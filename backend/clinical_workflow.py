"""Meeting-confirmed workflow rules; no clinical formula assumptions."""
import contextvars
import hashlib
import json
import math
import os
import secrets
import threading
import time
from datetime import date
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from derived_measurements import recalculate, rules
from session_store import SessionStore

actor = contextvars.ContextVar('clinical_actor', default=None)
lock = threading.RLock()
REPORT_KEYS = ('adult_echo_report', 'pediatric_echo_report', 'fetal_echo_report')
TITLES = {'Adult Echo': 'Adult Echocardiography', 'Pediatric Echo': 'Paediatric Echocardiography', 'Fetal Echo': 'Fetal Echocardiography', 'Ultrasound': 'Ultrasound'}

def password_hash(password, salt=None):
    salt = salt or secrets.token_hex(16)
    return salt + ':' + hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 200000).hex()

def verify(password, stored):
    return secrets.compare_digest(password_hash(password, stored.split(':')[0]), stored)

def forwarded_client(peer, forwarded, trusted_proxies):
    """Resolve the client address, trusting X-Forwarded-For only from configured proxies.

    Proxy chains append to the right, so walk from the right and skip trusted hops. This
    keeps a client-supplied left-hand entry from spoofing the rate-limit identity.
    """
    if not forwarded or peer not in trusted_proxies:
        return peer
    hops = [hop.strip() for hop in forwarded.split(',') if hop.strip()]
    for hop in reversed(hops):
        if hop not in trusted_proxies:
            return hop
    return hops[0] if hops else peer

def install(app, base_dir):
    path = os.environ.get('ECHOAI_USERS_PATH', os.path.join(base_dir, '.workflow-users.json'))
    cookie_name = os.environ.get('ECHOAI_SESSION_COOKIE', 'echoai_session')
    sessions = SessionStore(os.environ.get('ECHOAI_SESSIONS_PATH', path + '.sessions.db'))
    secure_cookie = os.environ.get('ECHOAI_SECURE_COOKIE', '').lower() in ('1', 'true')
    if not os.path.exists(path):
        # Reuse explicitly configured local credentials where available.
        credential_path = os.path.join(base_dir, '.local-credentials.json')
        password = os.environ.get('ECHOAI_PASSWORD')
        if not password and os.path.exists(credential_path):
            with open(credential_path) as f:
                password = json.load(f).get('password')
        if not password:
            password = secrets.token_urlsafe(20)
            fd = os.open(credential_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, 'w') as f:
                json.dump({'password': password}, f)
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'w') as f:
            json.dump([{'username': 'dr.shanthi@echoai.com', 'name': 'Dr Shanthi', 'role': 'L3', 'password_hash': password_hash(password)}], f)

    def users():
        with open(path) as f:
            return json.load(f)

    @app.middleware('http')
    async def protect(request: Request, call_next):
        if request.method == 'OPTIONS' or not request.url.path.startswith(('/api/', '/uploads/')) or request.url.path in ('/api/health', '/api/auth/login'):
            return await call_next(request)
        token = request.headers.get('authorization', '').removeprefix('Bearer ') or request.cookies.get(cookie_name)
        username = sessions.username(token)
        user = next((u for u in users() if u['username'] == username), None) if username else None
        if not user or user.get('role') not in ('L1', 'L2', 'L3'):
            return JSONResponse(status_code=401, content={'detail': 'Sign in to continue.'})
        mark = actor.set({k: user[k] for k in ('username', 'name', 'role')})
        try:
            # Generic table writes cannot bypass clinical validation or approval permissions.
            if request.method not in ('GET', 'HEAD') and request.url.path.startswith('/api/resources/'):
                resource = request.url.path.split('/')[3]
                if resource in ('scans', 'patients', 'visits', 'clinical-reports', 'clinical_reports', 'users'):
                    return JSONResponse(status_code=403, content={'detail': 'Use the dedicated workflow endpoint.'})
            if request.method not in ('GET', 'HEAD') and request.url.path.startswith('/api/clinical-reports'):
                return JSONResponse(status_code=409, content={'detail': 'Use the visit-linked echo report editor.'})
            return await call_next(request)
        finally:
            actor.reset(mark)

    trusted_proxies_raw = os.environ.get('ECHOAI_TRUSTED_PROXIES', '')
    trusted_proxies = {ip.strip() for ip in trusted_proxies_raw.split(',') if ip.strip()}

    @app.post('/api/auth/login')
    def login(data: dict, request: Request):
        peer = request.client.host if request.client else 'unknown'
        client = forwarded_client(peer, request.headers.get('x-forwarded-for'), trusted_proxies)
        if sessions.blocked(client):
            raise HTTPException(429, 'Too many failed sign-in attempts. Retry in 15 minutes.')
        username = str(data.get('username') or '').strip().lower()
        if username == 'dr.shanthi':
            username = 'dr.shanthi@echoai.com'
        user = next((u for u in users() if u['username'].lower() == username), None)
        if not user or not verify(str(data.get('password') or ''), user['password_hash']):
            sessions.failed(client)
            raise HTTPException(401, 'Incorrect username or password.')
        public = {k: user[k] for k in ('username', 'name', 'role')}
        token = secrets.token_urlsafe(32)
        sessions.create(token, user['username'], time.time() + 43200)
        response = JSONResponse({'success': True, 'token': token, 'user': public})
        response.set_cookie(cookie_name, token, httponly=True, secure=secure_cookie, samesite='strict', max_age=43200)
        return response

    @app.get('/api/auth/me')
    def me():
        return {'success': True, 'data': actor.get()}

    @app.get('/api/workflow/calculations')
    def calculation_rules():
        return {'data': rules()}

    @app.post('/api/auth/logout')
    def logout(request: Request):
        token = request.headers.get('authorization', '').removeprefix('Bearer ') or request.cookies.get(cookie_name)
        sessions.revoke(token)
        response = JSONResponse({'success': True})
        response.delete_cookie(cookie_name)
        return response

    @app.get('/api/workflow/users')
    def list_users():
        require_role('L3')
        return {'data': [{k: u[k] for k in ('username', 'name', 'role')} for u in users()]}

    @app.post('/api/workflow/users')
    def add_user(data: dict):
        require_role('L3')
        username = str(data.get('username') or '').strip().lower()
        password = str(data.get('password') or '')
        if not username or not str(data.get('name') or '').strip() or len(password) < 12 or data.get('role') not in ('L1', 'L2', 'L3'):
            raise HTTPException(422, 'Name, unique username, role and a password of at least 12 characters are required.')
        with lock:
            records = users()
            if any(u['username'] == username for u in records):
                raise HTTPException(409, 'Username already exists.')
            records.append({'username': username, 'name': data['name'].strip(), 'role': data['role'], 'password_hash': password_hash(password)})
            temporary = path + '.tmp'
            fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
            with os.fdopen(fd, 'w') as f:
                json.dump(records, f)
            os.replace(temporary, path)
        return {'success': True}

def require_role(role):
    user = actor.get()
    if not user or int(user['role'][1]) < int(role[1]):
        raise HTTPException(403, 'Your role cannot perform this action.')
    return user

def contact_payload(data):
    result = dict(data)
    hospital = data.get('doctor_type') == 'hospital'
    result['name'] = str(data.get('name') or (data.get('institution_name') if hospital else ' '.join(str(data.get(k) or '') for k in ('salutation', 'first_name', 'middle_name', 'last_name')))).strip()
    if not result['name']:
        raise HTTPException(422, 'A doctor or institute name is required.')
    result['specialty'] = data.get('specialty') or data.get('speciality') or ''
    result['hospital'] = data.get('hospital') or data.get('institution_name') or data.get('parent_institution') or ''
    result['phone'] = data.get('phone') or data.get('phone1') or data.get('mobile') or ''
    result['clinic_address'] = data.get('clinic_address') or ', '.join(str(data.get(k) or '') for k in ('street', 'area', 'district_city', 'state', 'country') if data.get(k))
    result['registration_number'] = data.get('registration_number') or data.get('reg_no') or ''
    return result

def serialize_contact(row):
    result = dict(row)
    try:
        extra = json.loads(result.pop('extra_data', None) or '{}')
    except (ValueError, TypeError):
        extra = {}
    result = {**extra, **result}
    result.setdefault('doctor_type', 'hospital' if result.get('hospital') == result.get('name') else 'doctor')
    return result

def validate_patient(data):
    required = ('patient_id', 'first_name', 'last_name', 'gender', 'state', 'country')
    missing = [k.replace('_', ' ') for k in required if not str(data.get(k) or '').strip()]
    if not data.get('dob') and data.get('age') in (None, ''):
        missing.append('DOB or age')
    if not str(data.get('street') or data.get('address') or '').strip():
        missing.append('address')
    if not any(any(ch.isdigit() for ch in str(data.get(k) or '')) for k in ('phone1', 'phone2', 'mobile')):
        missing.append('one phone number')
    if not data.get('family_doctor') and not data.get('referred_by'):
        missing.append('referral doctor / institute or Self')
    if missing:
        raise HTTPException(422, 'Required: ' + ', '.join(missing))
    if data.get('dob'):
        try:
            if date.fromisoformat(data['dob']) > date.today():
                raise ValueError()
        except ValueError:
            raise HTTPException(422, 'DOB must be a valid date on or before today.')
    if data.get('age') not in (None, ''):
        try:
            if not math.isfinite(float(data['age'])) or float(data['age']) < 0:
                raise ValueError()
        except (ValueError, TypeError):
            raise HTTPException(422, 'Age must be a non-negative number.')

def report_object(data):
    for key in REPORT_KEYS:
        if isinstance(data.get(key), dict):
            return data[key], key
    try:
        value = json.loads(data.get('findings') or '{}')
        if isinstance(value, dict):
            for key in REPORT_KEYS:
                if isinstance(value.get(key), dict):
                    return value[key], key
            return value, None
    except (ValueError, TypeError):
        pass
    return {}, None

def prepare_scan(data, existing=None):
    user = require_role('L1')
    old = dict(existing or {})
    for field in ('patient_id', 'visit_id', 'scan_type'):
        if old.get(field) not in (None, '') and field in data and str(data[field]) != str(old[field]):
            raise HTTPException(409, 'An existing report cannot be moved to a different patient, visit or scan type.')
    if str(old.get('status') or '').lower() == 'completed':
        raise HTTPException(409, 'Completed reports are read-only. A correction workflow has not been approved.')
    merged = {**old, **data}
    expected_key = dict(zip(('Adult Echo', 'Pediatric Echo', 'Fetal Echo'), REPORT_KEYS)).get(merged.get('scan_type'))
    if any(key in data and (key != expected_key or not isinstance(data[key], dict)) for key in REPORT_KEYS):
        raise HTTPException(422, 'Clinical report content must match the selected scan type.')
    report, key = report_object(merged)
    previous, _ = report_object(old)
    if not report:
        if str(merged.get('status', '')).lower() == 'completed':
            raise HTTPException(422, 'A clinical report is required before completion.')
        return merged
    for section in ('impression', 'lmp', 'echo_details'):
        if section in report and not isinstance(report[section], dict):
            raise HTTPException(422, f'{section} must be an object.')
    for flag in ('audit_done', 'report_completed'):
        if flag in report.get('impression', {}) and not isinstance(report['impression'][flag], bool):
            raise HTTPException(422, f'{flag} must be true or false.')
    completing = bool(report.get('impression', {}).get('report_completed')) or str(data.get('status', '')).lower() == 'completed'
    if completing:
        require_role('L3')
    # Incomplete drafts can be saved. Mandatory profile fields gate progression/completion.
    if completing and not str(report.get('indication') or '').strip():
        raise HTTPException(422, 'An indication is required before completion.')
    if merged.get('scan_type') == 'Fetal Echo':
        dating = report.get('lmp', {})
        transfer = dating.get('et_date') if isinstance(dating.get('et_date'), str) else ''
        if completing and (not (dating.get('lmp_date') or dating.get('edd') or transfer) or not report.get('no_of_fetuses')):
            raise HTTPException(422, 'LMP, EDD or embryo transfer date, and number of fetuses, are required.')
        count = str(report.get('no_of_fetuses', ''))
        if count and (not count.isdigit() or int(count) < 1):
            raise HTTPException(422, 'Number of fetuses must be a positive whole number.')
        for value in (dating.get('lmp_date'), dating.get('edd'), transfer):
            if value:
                try:
                    date.fromisoformat(value)
                except (ValueError, TypeError):
                    raise HTTPException(422, 'Enter valid LMP, EDD or transfer dates.')
    report = recalculate(report, merged.get('scan_type'))
    if old.get('findings'):
        try:
            json.loads(old['findings'])
        except (ValueError, TypeError):
            report['_legacy_findings'] = old['findings']
    impression = report.setdefault('impression', {})
    previous_imp = previous.get('impression', {})
    if impression.get('audit_done') != previous_imp.get('audit_done'):
        require_role('L2')
        impression['audited_by'] = user['name'] if impression.get('audit_done') else ''
        impression['audited_at'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()) if impression.get('audit_done') else ''
    else:
        impression['audited_by'] = previous_imp.get('audited_by', '')
        impression['audited_at'] = previous_imp.get('audited_at', '')
    if completing:
        require_role('L3')
        if not str(impression.get('primary_consultant') or '').strip() or not str(impression.get('final_impression') or '').strip():
            raise HTTPException(422, 'Primary consultant and final impression are required for completion.')
        if not str(impression.get('header_comments') or '').strip() or not str(impression.get('disclaimer_comments') or '').strip():
            raise HTTPException(422, 'Header comments and disclaimer comments are required for completion.')
        merged['status'] = 'Completed'
        impression['report_completed'] = True
        impression['completed_by'] = user['name']
        impression['completed_at'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    else:
        merged['status'] = 'Draft' if not str(report.get('indication') or '').strip() else 'In Progress'
        impression.pop('completed_by', None)
        impression.pop('completed_at', None)
    impression['report_title'] = TITLES.get(merged.get('scan_type'), merged.get('scan_type'))
    impression['report_typed_by'] = previous_imp.get('report_typed_by') or user['name']
    # Explicit abnormal-option mapping is deliberately limited to the literal Abnormal option.
    def abnormal_comments(node):
        if not isinstance(node, dict):
            return
        for name, value in node.items():
            if isinstance(value, str) and value.strip().lower() == 'abnormal' and not str(node.get(name + '_comments') or '').strip():
                raise HTTPException(422, f'Add a description for abnormal finding: {name.replace("_", " ")}')
            if isinstance(value, dict):
                abnormal_comments(value)
    abnormal_comments(report.get('echo_details', {}))
    if key:
        merged[key] = report
    merged['findings'] = json.dumps(report)
    merged['indication'] = report.get('indication', merged.get('indication', ''))
    merged['conclusion'] = impression.get('final_impression', merged.get('conclusion', ''))
    classification = impression.get('classification')
    if classification not in (None, '', 'Normal', 'Abnormal', 'Ambiguous'):
        raise HTTPException(422, 'Select Normal, Abnormal or Ambiguous, or leave classification blank.')
    if classification in ('Normal', 'Abnormal', 'Ambiguous'):
        merged.update(normal=classification == 'Normal', abnormal=classification == 'Abnormal', ambiguity=classification == 'Ambiguous')
    elif 'classification' in impression:
        merged.update(normal=False, abnormal=False, ambiguity=False)
    merged['primaryConsultant'] = impression.get('primary_consultant', '')
    merged['typedBy'] = impression['report_typed_by']
    merged['reviewedBy'] = impression.get('audited_by', '')
    return merged

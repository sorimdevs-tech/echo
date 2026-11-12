"""Temporary browser fixture. Contains only synthetic records, never real patient data."""
import json
import os
from pathlib import Path
import signal
import sqlite3
import subprocess
import sys
import tempfile
import time
import urllib.request

PORT = int(os.environ.get('ECHOAI_FIXTURE_PORT', '55123'))
temporary = tempfile.TemporaryDirectory(prefix='echo-browser-fixture-')
folder = Path(temporary.name)
info_path = Path(__file__).parent.parent / 'browser-fixture-info.json'
info_path.unlink(missing_ok=True)
sqlite3.connect(folder / 'empty.db').close()
env = {
    **os.environ,
    'DB_PATH': str(folder / 'empty.db'),
    'UPLOADS_DIR': str(folder / 'uploads'),
    'ECHOAI_USERS_PATH': str(folder / 'users.json'),
    'ECHOAI_PASSWORD': 'Browser-fixture-only!42',
    'ECHOAI_SESSION_COOKIE': 'echo_fixture_session',
    'PORT': str(PORT),
    'HOST': '127.0.0.1',
}
source = Path(__file__).parent
log = open(folder / 'server.log', 'w')
server = subprocess.Popen([sys.executable, 'main.py'], cwd=source, env=env, stdout=log, stderr=log)
base = f'http://127.0.0.1:{PORT}'


def call(method, path, data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    request = urllib.request.Request(
        base + path,
        data=None if data is None else json.dumps(data).encode(),
        headers=headers,
        method=method,
    )
    with urllib.request.urlopen(request) as result:
        return json.load(result)


def prepare_report(report, scan_type):
    report['indication'] = 'Dummy browser test only'
    impression = report.setdefault('impression', {})
    impression.update(
        final_impression='Dummy software test; no clinical interpretation.',
        primary_consultant='Dummy Consultant',
        header_comments='Synthetic header for software testing.',
        disclaimer_comments='Synthetic disclaimer for software testing; not clinical guidance.',
        report_completed=False,
        audit_done=False,
    )
    if scan_type == 'Fetal Echo':
        report['no_of_fetuses'] = '1'
        report.setdefault('lmp', {})['lmp_date'] = '2026-06-01'
        report.setdefault('echo_details', {}).setdefault('general', {})['cardiac_position'] = 'Normal'
    return report


def synthetic_report(scan_type):
    report = {}
    if scan_type == 'Fetal Echo':
        report['echo_details'] = {'general': {'cardiac_position': 'Normal'}}
    return prepare_report(report, scan_type)


def stop(*_):
    if server.poll() is None:
        server.terminate()
        try:
            server.wait(timeout=10)
        except subprocess.TimeoutExpired:
            server.kill()
    raise SystemExit(0)


signal.signal(signal.SIGTERM, stop)
signal.signal(signal.SIGINT, stop)

try:
    for _ in range(300):
        try:
            call('GET', '/api/health')
            break
        except Exception:
            time.sleep(0.1)
    else:
        raise RuntimeError('Fixture backend did not start')

    token = call('POST', '/api/auth/login', {'username': 'dr.shanthi', 'password': 'Browser-fixture-only!42'})['token']
    for role in ('L1', 'L2'):
        call('POST', '/api/workflow/users', {
            'username': role.lower(),
            'name': role + ' Dummy',
            'password': 'Browser-fixture-only!42',
            'role': role,
        }, token)

    patient = call('POST', '/api/patients', {
        'patient_id': 'BROWSER-DUMMY',
        'first_name': 'Dummy',
        'last_name': 'Browser',
        'dob': '2000-01-01',
        'age': '26',
        'gender': 'F',
        'street': 'Synthetic address',
        'state': 'Tamil Nadu',
        'country': 'India',
        'phone1': '1234567890',
        'family_doctor': 'Self',
    }, token)['data']

    scans = {}
    for scan_type, key, visit_date in (
        ('Fetal Echo', 'fetal_echo_report', '2026-11-09T09:00'),
        ('Adult Echo', 'adult_echo_report', '2026-11-09T10:00'),
        ('Pediatric Echo', 'pediatric_echo_report', '2026-11-09T11:00'),
    ):
        visit = call('POST', f'/api/patients/{patient["id"]}/visits', {
            'visit_date': visit_date,
            'scan_type': scan_type,
        }, token)['data']
        report = synthetic_report(scan_type)
        scan = call('POST', '/api/scans', {
            'patient_id': patient['id'],
            'visit_id': visit['id'],
            'scan_type': scan_type,
            key: report,
        }, token)['data']
        scans[scan_type] = {'id': scan['id'], 'visit_id': visit['id']}

    info = {
        'status': 'ready',
        'url': base,
        'patient_id': patient['id'],
        'patient_display_id': patient['patient_id'],
        'scans': scans,
        'usernames': ['l1', 'l2', 'dr.shanthi'],
        'password': 'Browser-fixture-only!42',
        'database': str(folder / 'empty.db'),
        'pid': server.pid,
    }
    info_path.write_text(json.dumps(info))
    print(json.dumps(info), flush=True)
    while server.poll() is None:
        time.sleep(1)
finally:
    if server.poll() is None:
        server.terminate()
        try:
            server.wait(timeout=10)
        except subprocess.TimeoutExpired:
            server.kill()
    log.close()
    info_path.unlink(missing_ok=True)
    temporary.cleanup()

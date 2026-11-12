from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any, Dict
import sqlite3
import json
from datetime import datetime, date
import os
import shutil
import secrets
from clinical_workflow import install as install_workflow, validate_patient, prepare_scan, require_role, contact_payload, serialize_contact, actor, report_object

app = FastAPI(title="Echo AI Backend", version="1.0.0")

# ALLOWED_ORIGINS is shared by deployment tooling; retain the legacy alias.
origins = [v.strip() for v in os.environ.get('ALLOWED_ORIGINS', os.environ.get('ECHOAI_ALLOWED_ORIGINS', 'http://127.0.0.1:3000,http://localhost:3000')).split(',') if v.strip()]
if '*' in origins:
    raise RuntimeError('Wildcard CORS origins are not allowed with credentials.')

# Use the bundled database locally and a persistent-disk path on Render.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, 'echo.db')
DB_PATH = os.environ.get('DB_PATH', DEFAULT_DB_PATH)
UPLOADS_DIR = os.environ.get('UPLOADS_DIR', os.path.join(BASE_DIR, 'uploads'))
FRONTEND_DIST = os.environ.get(
    'FRONTEND_DIST',
    os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend', 'dist')),
)
install_workflow(app, BASE_DIR)

def prepare_runtime_storage():
    os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
    os.makedirs(UPLOADS_DIR, exist_ok=True, mode=0o700)
    # Restore the historical demo dataset only for a new database. Existing
    # production data is never overwritten.
    if os.environ.get('ECHOAI_SEED_DEMO_DATA') == 'true':
        seed = os.path.join(BASE_DIR, 'seed', 'echo.db')
        empty = not os.path.exists(DB_PATH)
        if not empty:
            with sqlite3.connect(DB_PATH) as existing:
                tables = {r[0] for r in existing.execute("SELECT name FROM sqlite_master WHERE type='table'")}
                empty = all(t not in tables or existing.execute(f'SELECT 1 FROM {t} LIMIT 1').fetchone() is None
                            for t in ('patients', 'visits', 'scans', 'clinical_reports'))
        if empty:
            shutil.copy2(seed, DB_PATH)

class SQLiteConn:
    def __init__(self, path, timeout=60.0):
        self._conn = sqlite3.connect(path, timeout=timeout)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute('PRAGMA busy_timeout=30000')

    def cursor(self):
        return self._conn.cursor()

    def execute(self, sql, parameters=()):
        return self._conn.execute(sql, parameters)

    def executemany(self, sql, seq_of_parameters):
        return self._conn.executemany(sql, seq_of_parameters)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        try:
            self._conn.rollback()
        except Exception:
            pass

    def close(self):
        try:
            self._conn.close()
        except Exception:
            pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        self.close()

    def __del__(self):
        self.close()

    def __getattr__(self, name):
        return getattr(self._conn, name)

def get_db():
    return SQLiteConn(DB_PATH, timeout=60.0)

# Unified Database Initialization
def init_db():
    conn = SQLiteConn(DB_PATH, timeout=60.0)
    try:
        conn.execute('PRAGMA journal_mode=WAL')
    except Exception:
        pass
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS patient_contact_history (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL, changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, changed_by TEXT NOT NULL, changes TEXT NOT NULL, FOREIGN KEY(patient_id) REFERENCES patients(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS clinical_field_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_id INTEGER NOT NULL REFERENCES scans(id),
        patient_id INTEGER NOT NULL REFERENCES patients(id),
        visit_id INTEGER NOT NULL REFERENCES visits(id),
        changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        changed_by TEXT NOT NULL,
        role TEXT NOT NULL,
        field_path TEXT NOT NULL,
        previous_value TEXT,
        new_value TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS report_correction_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_id INTEGER NOT NULL REFERENCES scans(id),
        patient_id INTEGER NOT NULL REFERENCES patients(id),
        visit_id INTEGER NOT NULL REFERENCES visits(id),
        changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        changed_by TEXT NOT NULL,
        reason TEXT NOT NULL
    )''')
    # OPD / network patient masters map into the local patient record without
    # duplicating demographics or changing the clinic's manually assigned ID.
    c.execute('''CREATE TABLE IF NOT EXISTS patient_master_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL REFERENCES patients(id),
        source_system TEXT NOT NULL,
        facility_id TEXT NOT NULL,
        external_patient_id TEXT NOT NULL,
        linked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(source_system, facility_id, external_patient_id),
        UNIQUE(patient_id, source_system, facility_id)
    )''')

    # 1. Patients table
    c.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT UNIQUE,
            salutation TEXT,
            first_name TEXT NOT NULL,
            middle_name TEXT,
            last_name TEXT,
            gender TEXT,
            age INTEGER,
            age_unit TEXT DEFAULT 'Years',
            dob TEXT,
            mobile TEXT,
            phone1 TEXT,
            phone2 TEXT,
            email TEXT,
            address TEXT,
            street TEXT,
            area TEXT,
            area_po TEXT,
            taluk TEXT,
            city TEXT,
            district_city TEXT,
            state TEXT,
            pincode TEXT,
            zip_code TEXT,
            country TEXT,
            ethnic_origin TEXT,
            aadhar_number TEXT,
            abha_number TEXT,
            blood_group TEXT,
            marital_status TEXT,
            occupation TEXT,
            religion TEXT,
            nationality TEXT,
            emergency_contact_name TEXT,
            emergency_contact_phone TEXT,
            emergency_contact_relation TEXT,
            fax TEXT,
            family_doctor TEXT,
            referral_doctor TEXT,
            referral_institute TEXT,
            referral_source TEXT,
            audit_done TEXT DEFAULT 'No',
            report_done TEXT DEFAULT 'No',
            referred_by TEXT,
            registration_date TEXT,
            referred_by_doctor_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Keep existing seeded and Render databases compatible with the current
    # patient forms. CREATE TABLE IF NOT EXISTS does not add newly introduced
    # columns to an older database, so apply additive migrations explicitly.
    patient_columns = {
        'middle_name': 'TEXT',
        'street': 'TEXT',
        'area': 'TEXT',
        'area_po': 'TEXT',
        'taluk': 'TEXT',
        'district_city': 'TEXT',
        'zip_code': 'TEXT',
        'country': "TEXT DEFAULT 'India'",
        'ethnic_origin': 'TEXT',
        'fax': 'TEXT',
        'family_doctor': 'TEXT',
        'referral_doctor': 'TEXT',
        'referral_institute': 'TEXT',
        'referral_source': 'TEXT',
        'audit_done': "TEXT DEFAULT 'No'",
        'report_done': "TEXT DEFAULT 'No'",
        'age_unit': "TEXT DEFAULT 'Years'",
    }
    existing_patient_columns = {
        row[1] for row in c.execute('PRAGMA table_info(patients)').fetchall()
    }
    for column, definition in patient_columns.items():
        if column not in existing_patient_columns:
            c.execute(f'ALTER TABLE patients ADD COLUMN {column} {definition}')

    # 2. Visits table
    c.execute('''
        CREATE TABLE IF NOT EXISTS visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            visit_date TEXT,
            visit_type TEXT,
            doctor_id INTEGER,
            diagnosis TEXT,
            notes TEXT,
            referral_doctor TEXT,
            image_count INTEGER DEFAULT 0,
            avi INTEGER DEFAULT 0,
            pregnancy INTEGER DEFAULT 0,
            ob TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
    ''')
    visit_columns = {row[1] for row in c.execute('PRAGMA table_info(visits)').fetchall()}
    if 'report_template_id' not in visit_columns:
        c.execute('ALTER TABLE visits ADD COLUMN report_template_id INTEGER')

    # 3. Scans table
    c.execute('''
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            patient_display_id TEXT,
            visit_id INTEGER,
            scan_type TEXT NOT NULL,
            scan_date TEXT,
            findings TEXT,
            conclusion TEXT,
            status TEXT DEFAULT 'pending',
            abnormal BOOLEAN DEFAULT 0,
            ambiguity BOOLEAN DEFAULT 0,
            growthAbnormality BOOLEAN DEFAULT 0,
            normal BOOLEAN DEFAULT 1,
            normalVariant BOOLEAN DEFAULT 0,
            indication TEXT,
            diagnosis TEXT,
            referralDoctor TEXT,
            primaryConsultant TEXT,
            signedByLeft TEXT,
            signedByRight TEXT,
            typedBy TEXT,
            reviewedBy TEXT,
            icdCode TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
    ''')

    # Keep older seeded and Render databases compatible with the current scan
    # editor. Existing databases only contain the original core scan columns,
    # and CREATE TABLE IF NOT EXISTS does not add the newer workflow fields.
    scan_columns = {
        'patient_display_id': 'TEXT',
        'visit_id': 'INTEGER',
        'abnormal': 'BOOLEAN DEFAULT 0',
        'ambiguity': 'BOOLEAN DEFAULT 0',
        'growthAbnormality': 'BOOLEAN DEFAULT 0',
        'normal': 'BOOLEAN DEFAULT 1',
        'normalVariant': 'BOOLEAN DEFAULT 0',
        'indication': 'TEXT',
        'diagnosis': 'TEXT',
        'referralDoctor': 'TEXT',
        'primaryConsultant': 'TEXT',
        'signedByLeft': 'TEXT',
        'signedByRight': 'TEXT',
        'typedBy': 'TEXT',
        'reviewedBy': 'TEXT',
        'icdCode': 'TEXT',
    }
    existing_scan_columns = {
        row[1] for row in c.execute('PRAGMA table_info(scans)').fetchall()
    }
    for column, definition in scan_columns.items():
        if column not in existing_scan_columns:
            c.execute(f'ALTER TABLE scans ADD COLUMN {column} {definition}')

    placeholder_scan_count = c.execute(
        "SELECT COUNT(*) FROM scans WHERE patient_id = 'patient_id'"
    ).fetchone()[0]
    total_scan_count = c.execute('SELECT COUNT(*) FROM scans').fetchone()[0]
    if placeholder_scan_count == 136 and total_scan_count == 136:
        seeded_scan_patient_ids = [
            1, 2, 2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 10, 11, 11, 12, 12,
            13, 14, 15, 15, 16, 17, 17, 18, 18, 19, 20, 21, 21, 22, 23,
            24, 24, 25, 25, 26, 27, 28, 29, 29, 30, 30, 31, 32, 32, 33,
            34, 35, 36, 37, 38, 39, 39, 40, 41, 42, 43, 43, 44, 45, 45,
            46, 47, 48, 49, 50, 51, 52, 53, 54, 54, 55, 55, 56, 57, 57,
            58, 59, 60, 61, 62, 62, 63, 64, 65, 65, 66, 67, 68, 68, 69,
            70, 70, 71, 72, 73, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
            83, 84, 84, 85, 86, 86, 87, 87, 88, 88, 89, 89, 90, 91, 91,
            92, 93, 93, 94, 94, 95, 96, 97, 98, 98, 99, 99, 100,
        ]
        c.executemany(
            'UPDATE scans SET patient_id = ? WHERE id = ?',
            [(patient_id, index) for index, patient_id in enumerate(seeded_scan_patient_ids, start=1)],
        )

    c.execute('''
        UPDATE scans
        SET patient_display_id = (
            SELECT patients.patient_id
            FROM patients
            WHERE patients.id = scans.patient_id
        )
        WHERE (patient_display_id IS NULL OR patient_display_id = '' OR patient_display_id = 'patient_display_id')
          AND patient_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM patients
            WHERE patients.id = scans.patient_id
          )
    ''')

    # 4. Referral doctors table
    c.execute('''
        CREATE TABLE IF NOT EXISTS referral_doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            qualification TEXT,
            specialty TEXT,
            hospital TEXT,
            clinic_address TEXT,
            phone TEXT,
            email TEXT,
            registration_number TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 5. Custom options table
    c.execute('''
        CREATE TABLE IF NOT EXISTS custom_options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            field TEXT NOT NULL,
            value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 6. Lookup options table
    c.execute('''
        CREATE TABLE IF NOT EXISTS lookup_options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 7. Settings table
    c.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            company_name TEXT,
            short_name TEXT,
            registration_no TEXT,
            tax_id TEXT,
            comments TEXT,
            inactive BOOLEAN DEFAULT 0,
            street TEXT,
            area TEXT,
            area_po TEXT,
            zip_code TEXT,
            city TEXT,
            state TEXT,
            country TEXT,
            phone TEXT,
            mobile TEXT,
            fax TEXT,
            email TEXT,
            id_mode TEXT DEFAULT 'Manual ID',
            prefix TEXT DEFAULT 'PAT',
            next_number INTEGER DEFAULT 1,
            pad_length INTEGER DEFAULT 6,
            auto_start BOOLEAN DEFAULT 0,
            auto_backup BOOLEAN DEFAULT 0,
            centre_name TEXT DEFAULT 'Echo Cardiology & Diagnostic Centre',
            date_format TEXT DEFAULT 'DD/MM/YYYY',
            font TEXT DEFAULT 'Arial',
            font_size TEXT DEFAULT '10',
            report_type TEXT DEFAULT 'Report only',
            normal_comments TEXT,
            imageConfig TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    settings_columns = {
        'imageConfig': 'TEXT',
    }
    existing_settings_columns = {
        row[1] for row in c.execute('PRAGMA table_info(settings)').fetchall()
    }
    for column, definition in settings_columns.items():
        if column not in existing_settings_columns:
            c.execute(f'ALTER TABLE settings ADD COLUMN {column} {definition}')

    # 8. Report templates table
    c.execute('''
        CREATE TABLE IF NOT EXISTS report_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            scan_type TEXT,
            layout TEXT,
            views TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    for scan_type, title in (
        ('Adult Echo', 'Standard Adult Echo Report'),
        ('Fetal Echo', 'Comprehensive Fetal Echo Report'),
        ('Pediatric Echo', 'Pediatric Congenital Echo Report'),
        ('Ultrasound', 'Ultrasound placeholder'),
    ):
        c.execute('''INSERT INTO report_templates (title, scan_type, layout, views)
            SELECT ?, ?, '', '[]'
            WHERE NOT EXISTS (SELECT 1 FROM report_templates WHERE scan_type = ?)''',
            (title, scan_type, scan_type))

    # 9. Clinical reports table
    c.execute('''
        CREATE TABLE IF NOT EXISTS clinical_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            scan_id INTEGER,
            scan_type TEXT,
            report_title TEXT,
            findings TEXT,
            conclusion TEXT,
            status TEXT DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 10. Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT,
            last_name TEXT,
            middle_name TEXT,
            initials TEXT,
            user_name TEXT UNIQUE,
            password TEXT,
            designation TEXT,
            registration_no TEXT,
            user_type TEXT DEFAULT 'Sonographer',
            mobile TEXT,
            email TEXT,
            inactive BOOLEAN DEFAULT 0,
            set_default BOOLEAN DEFAULT 0,
            signature TEXT,
            roles TEXT,
            rights TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 11. Media records table
    c.execute('''
        CREATE TABLE IF NOT EXISTS media_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            visit_id TEXT,
            name TEXT,
            type TEXT,
            size INTEGER,
            status TEXT,
            url TEXT,
            data_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 12. Saved queries table
    c.execute('''
        CREATE TABLE IF NOT EXISTS saved_queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            query TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    referral_columns = {row[1] for row in c.execute('PRAGMA table_info(referral_doctors)').fetchall()}
    media_columns = {row[1] for row in c.execute('PRAGMA table_info(media_records)').fetchall()}
    for column in ('source_media_id', 'stamp_name', 'annotation_notes'):
        if column not in media_columns:
            c.execute(f'ALTER TABLE media_records ADD COLUMN {column} TEXT')
    if 'extra_data' not in referral_columns:
        c.execute('ALTER TABLE referral_doctors ADD COLUMN extra_data TEXT')
    visit_columns = {row[1] for row in c.execute('PRAGMA table_info(visits)').fetchall()}
    if 'request_id' not in visit_columns:
        c.execute('ALTER TABLE visits ADD COLUMN request_id TEXT')
    c.execute('CREATE UNIQUE INDEX IF NOT EXISTS visit_request_once ON visits(patient_id, request_id)')
    c.execute('''CREATE TABLE IF NOT EXISTS media_layouts (
        patient_id INTEGER NOT NULL, visit_id INTEGER NOT NULL, kind TEXT NOT NULL,
        data TEXT NOT NULL, updated_at TEXT NOT NULL,
        PRIMARY KEY(patient_id, visit_id, kind)
    )''')
    conn.commit()
    conn.close()

@app.on_event("startup")
def startup():
    prepare_runtime_storage()
    init_db()

@app.get('/api/health')
def health():
    return {"message": "Echo AI Cardiology API Server", "status": "online", "version": "1.0.0"}

# Helper Patient Data Mapper
def _map_patient_row(row):
    if not row:
        return None
    patient = dict(row)
    # Ensure bidirectional compatibility between frontend & DB fields
    patient['aadhaar_no'] = patient.get('aadhar_number') or patient.get('aadhaar_no') or ''
    patient['aadhar_number'] = patient['aadhaar_no']

    patient['zip_code'] = patient.get('pincode') or patient.get('zip_code') or ''
    patient['pincode'] = patient['zip_code']

    patient['district_city'] = patient.get('city') or patient.get('district_city') or ''
    patient['city'] = patient['district_city']

    patient['street'] = patient.get('address') or patient.get('street') or ''
    patient['address'] = patient['street']

    patient['middle_name'] = patient.get('middle_name') or ''
    patient['area'] = patient.get('area') or ''
    patient['area_po'] = patient.get('area_po') or ''
    patient['taluk'] = patient.get('taluk') or ''
    patient['ethnic_origin'] = patient.get('ethnic_origin') or ''
    patient['country'] = patient.get('country') or 'India'
    patient['fax'] = patient.get('fax') or ''
    patient['family_doctor'] = patient.get('family_doctor') or ''
    patient['referral_doctor'] = patient.get('referral_doctor') or patient['family_doctor']
    patient['referral_institute'] = patient.get('referral_institute') or ''
    patient['referral_source'] = patient.get('referral_source') or ('Self' if patient['family_doctor'] == 'Self' else '')
    patient['audit_done'] = patient.get('audit_done') or 'No'
    patient['report_done'] = patient.get('report_done') or 'No'
    patient['age_unit'] = patient.get('age_unit') or 'Years'
    patient['visit_count'] = patient.get('visit_count', 0)

    return patient

# Dashboard Stats Endpoint
@app.get('/api/dashboard/stats')
def get_dashboard_stats():
    conn = get_db()
    c = conn.cursor()

    total_patients = c.execute('SELECT COUNT(*) FROM patients').fetchone()[0]
    total_scans = c.execute('SELECT COUNT(*) FROM scans').fetchone()[0]
    total_visits = c.execute('SELECT COUNT(*) FROM visits').fetchone()[0]
    adult_echo = c.execute('SELECT COUNT(*) FROM scans WHERE scan_type = "Adult Echo"').fetchone()[0]
    fetal_echo = c.execute('SELECT COUNT(*) FROM scans WHERE scan_type = "Fetal Echo"').fetchone()[0]
    pediatric_echo = c.execute('SELECT COUNT(*) FROM scans WHERE scan_type = "Pediatric Echo"').fetchone()[0]

    ultrasound = c.execute('SELECT COUNT(*) FROM scans WHERE scan_type = "Ultrasound"').fetchone()[0]
    today_str = date.today().isoformat()
    todays_visits = c.execute('SELECT COUNT(*) FROM visits WHERE visit_date LIKE ?', (f"{today_str}%",)).fetchone()[0]
    upcoming_visits = c.execute('SELECT COUNT(*) FROM visits WHERE date(visit_date) > date("now")', ()).fetchone()[0]

    conn.close()

    return {
        "success": True,
        "data": {
            "total_patients": total_patients,
            "total_scans": total_scans,
            "total_visits": total_visits,
            "adult_echo": adult_echo,
            "fetal_echo": fetal_echo,
            "pediatric_echo": pediatric_echo,
            "ultrasound": ultrasound,
            "todays_visits": todays_visits,
            "upcoming_visits": upcoming_visits,
        }
    }


# Patient Endpoints
@app.get('/api/patients')
def get_patients():
    conn = get_db()
    patients = conn.execute('SELECT * FROM patients ORDER BY id DESC').fetchall()
    visit_counts = {}
    for r in conn.execute('SELECT patient_id, COUNT(*) as c FROM visits GROUP BY patient_id').fetchall():
        visit_counts[str(r['patient_id'])] = r['c']

    result = []
    for p in patients:
        row_dict = _map_patient_row(p)
        c1 = visit_counts.get(str(p['id']), 0)
        c2 = visit_counts.get(str(p['patient_id']), 0)
        row_dict['visit_count'] = c1 if str(p['id']) == str(p['patient_id']) else (c1 + c2)
        result.append(row_dict)
    conn.close()
    return {"success": True, "data": result}

@app.get('/api/patients/{patient_id}')
def get_patient(patient_id: str):
    conn = get_db()
    if patient_id.isdigit():
        patient = conn.execute('SELECT * FROM patients WHERE id = ? OR patient_id = ?', (int(patient_id), patient_id)).fetchone()
    else:
        patient = conn.execute('SELECT * FROM patients WHERE patient_id = ?', (patient_id,)).fetchone()
    conn.close()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"success": True, "data": _map_patient_row(patient)}

@app.post('/api/patients')
def create_patient(data: dict):
    validate_patient(data)
    conn = get_db()
    cursor = conn.cursor()

    patient_id = data['patient_id'].strip()

    salutation = data.get('salutation', '')
    first_name = data.get('first_name', '')
    middle_name = data.get('middle_name', '')
    last_name = data.get('last_name', '')
    gender = data.get('gender', 'M')
    age = int(data.get('age')) if data.get('age') and str(data.get('age')).isdigit() else None
    age_unit = data.get('age_unit') or 'Years'
    dob = data.get('dob', '')
    mobile = data.get('mobile', '')
    phone1 = data.get('phone1', '')
    phone2 = data.get('phone2', '')
    email = data.get('email', '')
    street = data.get('street') or data.get('address') or ''
    area = data.get('area', '')
    area_po = data.get('area_po', '')
    taluk = data.get('taluk', '')
    city = data.get('district_city') or data.get('city') or ''
    state = data.get('state', '')
    pincode = data.get('zip_code') or data.get('pincode') or ''
    country = data.get('country', 'India')
    ethnic_origin = data.get('ethnic_origin', '')
    aadhar_number = data.get('aadhaar_no') or data.get('aadhar_number') or ''
    abha_number = data.get('abha_number', '')
    blood_group = data.get('blood_group', '')
    marital_status = data.get('marital_status', '')
    occupation = data.get('occupation', '')
    religion = data.get('religion', '')
    nationality = data.get('nationality', 'Indian')
    emergency_contact_name = data.get('emergency_contact_name', '')
    emergency_contact_phone = data.get('emergency_contact_phone', '')
    emergency_contact_relation = data.get('emergency_contact_relation', '')
    fax = data.get('fax', '')
    family_doctor = data.get('family_doctor', '')
    referral_doctor = data.get('referral_doctor', '')
    referral_institute = data.get('referral_institute', '')
    referral_source = data.get('referral_source', '')
    audit_done = data.get('audit_done', 'No')
    report_done = data.get('report_done', 'No')
    referred_by = data.get('referred_by', '')
    registration_date = data.get('registration_date') or datetime.now().strftime("%Y-%m-%d")
    referred_by_doctor_id = data.get('referred_by_doctor_id')

    try:
        cursor.execute('''
            INSERT INTO patients (
                patient_id, salutation, first_name, middle_name, last_name, gender, age, age_unit, dob,
                mobile, phone1, phone2, email, address, street, area, area_po, taluk,
                city, district_city, state, pincode, zip_code, country, ethnic_origin,
                aadhar_number, abha_number, blood_group, marital_status, occupation,
                religion, nationality, emergency_contact_name, emergency_contact_phone,
                emergency_contact_relation, fax, family_doctor, referral_doctor, referral_institute,
                referral_source, audit_done, report_done, referred_by, registration_date, referred_by_doctor_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            patient_id, salutation, first_name, middle_name, last_name, gender, age, age_unit, dob,
            mobile, phone1, phone2, email, street, street, area, area_po, taluk,
            city, city, state, pincode, pincode, country, ethnic_origin,
            aadhar_number, abha_number, blood_group, marital_status, occupation,
            religion, nationality, emergency_contact_name, emergency_contact_phone,
            emergency_contact_relation, fax, family_doctor or referral_doctor or referral_institute or ('Self' if referral_source == 'Self' else ''), referral_doctor,
            referral_institute, referral_source, audit_done, report_done, referred_by, registration_date,
            referred_by_doctor_id
        ))

        new_id = cursor.lastrowid
        conn.commit()

        # Increment settings next_number if setting exists
        setting = conn.execute('SELECT next_number FROM settings WHERE id = 1').fetchone()
        if setting:
            conn.execute('UPDATE settings SET next_number = next_number + 1 WHERE id = 1')
            conn.commit()

        inserted = conn.execute('SELECT * FROM patients WHERE id = ?', (new_id,)).fetchone()
        conn.close()
        return {"success": True, "data": _map_patient_row(inserted)}
    except sqlite3.IntegrityError as e:
        conn.close()
        raise HTTPException(status_code=400, detail="Patient ID already exists")

@app.get('/api/patients/{patient_id}/contact-history')
def get_patient_contact_history(patient_id: int):
    with get_db() as conn:
        if not conn.execute('SELECT 1 FROM patients WHERE id = ?', (patient_id,)).fetchone():
            raise HTTPException(404, 'Patient not found')
        rows = conn.execute('SELECT changed_at, changed_by, changes FROM patient_contact_history WHERE patient_id = ? ORDER BY id DESC', (patient_id,)).fetchall()
        return {'success': True, 'data': [{**dict(row), 'changes': json.loads(row['changes'])} for row in rows]}

@app.put('/api/patients/{patient_id}')
def update_patient(patient_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    current = conn.execute('SELECT * FROM patients WHERE id = ?', (patient_id,)).fetchone()
    if not current:
        conn.close()
        raise HTTPException(404, 'Patient not found')
    for field in ('patient_id', 'salutation', 'first_name', 'middle_name', 'last_name', 'dob', 'gender', 'age', 'age_unit'):
        if field in data and str(data[field] or '') != str(current[field] or ''):
            conn.close()
            raise HTTPException(409, 'Patient ID, first name, surname/initial, DOB and gender are locked after registration.')
    data = {**dict(current), **data}

    street = data.get('street') or data.get('address') or ''
    city = data.get('district_city') or data.get('city') or ''
    pincode = data.get('zip_code') or data.get('pincode') or ''
    aadhar_number = data.get('aadhaar_no') or data.get('aadhar_number') or ''
    age = int(data.get('age')) if data.get('age') and str(data.get('age')).isdigit() else None
    age_unit = data.get('age_unit') or 'Years'

    try:
        cursor.execute('''
            UPDATE patients SET
                patient_id = ?, salutation = ?, first_name = ?, middle_name = ?, last_name = ?, gender = ?,
                age = ?, age_unit = ?, dob = ?, mobile = ?, phone1 = ?, phone2 = ?, email = ?,
                address = ?, street = ?, area = ?, area_po = ?, taluk = ?, city = ?, district_city = ?,
                state = ?, pincode = ?, zip_code = ?, country = ?, ethnic_origin = ?, aadhar_number = ?,
                abha_number = ?, blood_group = ?, marital_status = ?, occupation = ?,
                religion = ?, nationality = ?, emergency_contact_name = ?,
                emergency_contact_phone = ?, emergency_contact_relation = ?, fax = ?, family_doctor = ?,
                referred_by = ?, registration_date = ?, referred_by_doctor_id = ?,
                referral_doctor = ?, referral_institute = ?, referral_source = ?, audit_done = ?, report_done = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('patient_id'), data.get('salutation'), data.get('first_name'), data.get('middle_name'),
            data.get('last_name'), data.get('gender'), age, age_unit, data.get('dob'), data.get('mobile'),
            data.get('phone1'), data.get('phone2'), data.get('email'), street, street, data.get('area'),
            data.get('area_po'), data.get('taluk'), city, city, data.get('state'), pincode, pincode,
            data.get('country', 'India'), data.get('ethnic_origin'), aadhar_number, data.get('abha_number'),
            data.get('blood_group'), data.get('marital_status'), data.get('occupation'), data.get('religion'),
            data.get('nationality', 'Indian'), data.get('emergency_contact_name'), data.get('emergency_contact_phone'),
            data.get('emergency_contact_relation'), data.get('fax'), data.get('family_doctor'), data.get('referred_by'),
            data.get('registration_date'), data.get('referred_by_doctor_id'),
            data.get('referral_doctor'), data.get('referral_institute'), data.get('referral_source'),
            data.get('audit_done', 'No'), data.get('report_done', 'No'), patient_id
        ))

        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Patient not found")

        fields = ('street', 'area', 'area_po', 'taluk', 'district_city', 'state', 'zip_code', 'country', 'phone1', 'phone2', 'mobile', 'email', 'fax', 'family_doctor', 'referral_doctor', 'referral_institute', 'referral_source')
        updated = conn.execute('SELECT * FROM patients WHERE id = ?', (patient_id,)).fetchone()
        changes = {field: {'from': current[field], 'to': updated[field]} for field in fields if (current[field] or '') != (updated[field] or '')}
        if changes:
            conn.execute('INSERT INTO patient_contact_history (patient_id, changed_by, changes) VALUES (?, ?, ?)', (patient_id, (actor.get() or {}).get('username', 'unknown'), json.dumps(changes)))
        conn.commit()
        conn.close()
        return {"success": True, "data": _map_patient_row(updated)}
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Patient ID already exists")

@app.delete('/api/patients/{patient_id}')
def delete_patient(patient_id: int):
    require_role('L3')
    conn = get_db()
    conn.execute('BEGIN IMMEDIATE')
    if conn.execute("SELECT 1 FROM scans WHERE patient_id = ? AND lower(status) = 'completed'", (patient_id,)).fetchone():
        conn.close()
        raise HTTPException(409, 'A patient with completed reports cannot be deleted.')
    if conn.execute('SELECT 1 FROM media_records WHERE patient_id = ?', (patient_id,)).fetchone() or conn.execute('SELECT 1 FROM media_layouts WHERE patient_id = ?', (patient_id,)).fetchone():
        conn.close()
        raise HTTPException(409, 'Patients with associated media records or layouts cannot be deleted.')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM visits WHERE patient_id = ?', (patient_id,))
    cursor.execute('DELETE FROM scans WHERE patient_id = ?', (patient_id,))
    cursor.execute('DELETE FROM patients WHERE id = ?', (patient_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Patient deleted successfully"}

# Visits Endpoints
@app.get('/api/visits')
def get_all_visits():
    conn = get_db()
    visits = conn.execute('SELECT * FROM visits ORDER BY id DESC').fetchall()
    conn.close()
    return {"success": True, "data": [dict(v) for v in visits]}

@app.get('/api/patients/{patient_id}/visits')
def get_visits(patient_id: int):
    conn = get_db()
    visits = conn.execute('SELECT * FROM visits WHERE patient_id = ? ORDER BY id DESC', (patient_id,)).fetchall()
    conn.close()
    return {"success": True, "data": [dict(v) for v in visits]}

@app.post('/api/patients/{patient_id}/visits')
def add_visit(patient_id: int, data: dict):
    conn = get_db()
    conn.execute('BEGIN IMMEDIATE')
    cursor = conn.cursor()
    request_id = data.get('request_id')
    if request_id:
        prior = conn.execute('SELECT * FROM visits WHERE patient_id = ? AND request_id = ?', (patient_id, request_id)).fetchone()
        if prior:
            conn.close()
            return {'success': True, 'data': dict(prior)}
    patient = conn.execute('SELECT * FROM patients WHERE id = ?', (patient_id,)).fetchone()
    if not patient:
        conn.close()
        raise HTTPException(404, 'Patient not found')
    scan_type = data.get('scan_type') or data.get('visit_type')
    if scan_type not in ('Adult Echo', 'Fetal Echo', 'Pediatric Echo', 'Ultrasound'):
        conn.close()
        raise HTTPException(422, 'Select the visit scan type.')
    if not data.get('visit_date'):
        conn.close()
        raise HTTPException(422, 'Visit date is required.')
    data['visit_type'] = scan_type
    data['referral_doctor'] = data.get('referral_doctor') or patient['family_doctor'] or ''

    visit_date = data.get('visit_date') or datetime.now().isoformat()
    visit_type = data.get('visit_type', 'Consultation')
    doctor_id = data.get('doctor_id')
    diagnosis = data.get('diagnosis', '')
    notes = data.get('notes', '')
    referral_doctor = data.get('referral_doctor', '')
    image_count = int(data.get('image_count', 0)) if str(data.get('image_count', 0)).isdigit() else 0
    avi = int(data.get('avi', 0)) if str(data.get('avi', 0)).isdigit() else 0
    pregnancy = int(data.get('pregnancy', 0)) if str(data.get('pregnancy', 0)).isdigit() else 0
    ob = data.get('ob', '')
    report_template_id = data.get('report_template_id')
    template = conn.execute('SELECT scan_type FROM report_templates WHERE id = ?', (report_template_id,)).fetchone() if report_template_id else None
    if report_template_id and (not template or template['scan_type'] != scan_type):
        conn.close()
        raise HTTPException(422, 'Choose a report template matching the selected scan type.')

    cursor.execute('''
        INSERT INTO visits (patient_id, visit_date, visit_type, doctor_id, diagnosis, notes, referral_doctor, image_count, avi, pregnancy, ob, report_template_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (patient_id, visit_date, visit_type, doctor_id, diagnosis, notes, referral_doctor, image_count, avi, pregnancy, ob, report_template_id))

    visit_id = cursor.lastrowid
    if scan_type == 'Ultrasound':
        conn.execute('INSERT INTO scans (patient_id, patient_display_id, visit_id, scan_type, scan_date, status) VALUES (?, ?, ?, ?, ?, ?)', (patient_id, patient['patient_id'], visit_id, scan_type, visit_date, 'draft'))
    if request_id:
        conn.execute('UPDATE visits SET request_id = ? WHERE id = ?', (request_id, visit_id))
    conn.commit()
    inserted = conn.execute('SELECT * FROM visits WHERE id = ?', (visit_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(inserted)}

@app.put('/api/patients/{patient_id}/visits/{visit_id}')
def update_visit(patient_id: int, visit_id: int, data: dict):
    conn = get_db()
    conn.execute('BEGIN IMMEDIATE')
    cursor = conn.cursor()
    previous = conn.execute('SELECT * FROM visits WHERE id = ? AND patient_id = ?', (visit_id, patient_id)).fetchone()
    if not previous:
        conn.close()
        raise HTTPException(404, 'Visit not found')
    if conn.execute("SELECT 1 FROM scans WHERE visit_id = ? AND lower(status) = 'completed'", (visit_id,)).fetchone():
        conn.close()
        raise HTTPException(409, 'Visits with completed reports are read-only.')
    data = {**dict(previous), **data}
    if data.get('visit_type') != previous['visit_type'] and conn.execute('SELECT 1 FROM scans WHERE visit_id = ?', (visit_id,)).fetchone():
        conn.close()
        raise HTTPException(409, 'A visit with a report cannot change scan type.')

    report_template_id = data.get('report_template_id')
    if report_template_id:
        template = conn.execute('SELECT scan_type FROM report_templates WHERE id = ?', (report_template_id,)).fetchone()
        if not template or template['scan_type'] != data.get('visit_type'):
            conn.close()
            raise HTTPException(422, 'Choose a report template matching the selected scan type.')

    cursor.execute('''
        UPDATE visits SET
            visit_date = ?, visit_type = ?, doctor_id = ?, diagnosis = ?, notes = ?,
            referral_doctor = ?, image_count = ?, avi = ?, pregnancy = ?, ob = ?, report_template_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND patient_id = ?
    ''', (
        data.get('visit_date'), data.get('visit_type'), data.get('doctor_id'),
        data.get('diagnosis'), data.get('notes'), data.get('referral_doctor'),
        data.get('image_count', 0), data.get('avi', 0), data.get('pregnancy', 0),
        data.get('ob', ''), report_template_id, visit_id, patient_id
    ))

    conn.commit()
    updated = conn.execute('SELECT * FROM visits WHERE id = ?', (visit_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(updated)}

@app.delete('/api/patients/{patient_id}/visits/{visit_id}')
def delete_visit(patient_id: int, visit_id: int):
    require_role('L3')
    conn = get_db()
    conn.execute('BEGIN IMMEDIATE')
    if conn.execute('SELECT 1 FROM scans WHERE visit_id = ?', (visit_id,)).fetchone():
        conn.close()
        raise HTTPException(409, 'Delete unfinished reports first. Visits with reports cannot be deleted.')
    if conn.execute("SELECT 1 FROM scans WHERE visit_id = ? AND lower(status) = 'completed'", (visit_id,)).fetchone():
        conn.close()
        raise HTTPException(409, 'Visits with completed reports cannot be deleted.')
    if conn.execute('SELECT 1 FROM media_records WHERE visit_id = ?', (visit_id,)).fetchone() or conn.execute('SELECT 1 FROM media_layouts WHERE visit_id = ?', (visit_id,)).fetchone():
        conn.close()
        raise HTTPException(409, 'Visits with associated media records or layouts cannot be deleted.')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM visits WHERE id = ? AND patient_id = ?', (visit_id, patient_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Visit deleted successfully"}

def _map_scan_row(scan_row):
    if not scan_row:
        return None
    d = dict(scan_row)
    findings = d.get('findings') or ''
    if findings.strip().startswith('{') and findings.strip().endswith('}'):
        try:
            parsed = json.loads(findings)
            if 'adult_echo_report' in parsed:
                d['adult_echo_report'] = parsed['adult_echo_report']
            elif parsed.get('scan_type') == 'Adult Echo' or d.get('scan_type') == 'Adult Echo':
                d['adult_echo_report'] = parsed

            if 'pediatric_echo_report' in parsed:
                d['pediatric_echo_report'] = parsed['pediatric_echo_report']
            elif parsed.get('scan_type') == 'Pediatric Echo' or d.get('scan_type') == 'Pediatric Echo':
                d['pediatric_echo_report'] = parsed

            if 'fetal_echo_report' in parsed:
                d['fetal_echo_report'] = parsed['fetal_echo_report']
            elif parsed.get('scan_type') == 'Fetal Echo' or d.get('scan_type') == 'Fetal Echo':
                d['fetal_echo_report'] = parsed
        except Exception:
            pass
    return d

def _json_value(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True)

def _report_field_changes(before, after, path=''):
    changes = []
    if isinstance(before, dict) and isinstance(after, dict):
        for key in sorted(set(before) | set(after)):
            if key.startswith('_legacy_') or key == 'correction_workflow':
                continue
            child = f'{path}.{key}' if path else key
            changes.extend(_report_field_changes(before.get(key), after.get(key), child))
    elif before != after:
        changes.append((path, before, after))
    return changes

# Scans Endpoints
@app.get('/api/scans')
def get_scans():
    conn = get_db()
    scans = conn.execute('SELECT * FROM scans ORDER BY id DESC').fetchall()
    conn.close()
    return {"success": True, "data": [_map_scan_row(s) for s in scans]}

@app.get('/api/scans/{scan_id}')
def get_scan(scan_id: int):
    conn = get_db()
    scan = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
    conn.close()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"success": True, "data": _map_scan_row(scan)}

@app.get('/api/scans/patient/{patient_id}')
def get_scans_by_patient(patient_id: int):
    conn = get_db()
    scans = conn.execute('SELECT * FROM scans WHERE patient_id = ? ORDER BY id DESC', (patient_id,)).fetchall()
    conn.close()
    return {"success": True, "data": [_map_scan_row(s) for s in scans]}

@app.post('/api/scans')
def create_scan(data: dict):
    data = prepare_scan(data)
    conn = get_db()
    conn.execute('BEGIN IMMEDIATE')
    cursor = conn.cursor()
    if not conn.execute('SELECT 1 FROM patients WHERE id = ?', (data.get('patient_id'),)).fetchone():
        conn.close()
        raise HTTPException(422, 'Select an existing patient.')
    if not data.get('visit_id'):
        conn.close()
        raise HTTPException(422, 'Clinical reports require a valid patient visit.')
    visit = conn.execute('SELECT * FROM visits WHERE id = ? AND patient_id = ?', (data['visit_id'], data.get('patient_id'))).fetchone()
    if not visit or (visit['visit_type'] in ('Adult Echo', 'Fetal Echo', 'Pediatric Echo', 'Ultrasound') and visit['visit_type'] != data.get('scan_type')):
        conn.close()
        raise HTTPException(422, 'Report must match the selected patient, visit and scan type.')

    patient_id = data.get('patient_id')
    if data.get('visit_id'):
        prior = conn.execute('SELECT * FROM scans WHERE patient_id = ? AND visit_id = ? AND scan_type = ?', (patient_id, data['visit_id'], data.get('scan_type'))).fetchone()
        if prior:
            conn.close()
            if any(key in data for key in ('adult_echo_report', 'pediatric_echo_report', 'fetal_echo_report')):
                raise HTTPException(409, 'This visit already has a report. Open its existing report before saving changes.')
            return {'success': True, 'data': _map_scan_row(prior)}
    patient_display_id = data.get('patient_display_id', '')
    visit_id = data.get('visit_id')
    scan_type = data.get('scan_type', 'Adult Echo')
    scan_date = data.get('scan_date') or datetime.now().isoformat()
    findings = data.get('findings', '')
    if 'adult_echo_report' in data:
        findings = json.dumps(data['adult_echo_report'])
    elif 'pediatric_echo_report' in data:
        findings = json.dumps(data['pediatric_echo_report'])
    elif 'fetal_echo_report' in data:
        findings = json.dumps(data['fetal_echo_report'])

    conclusion = data.get('conclusion', '')
    status = data.get('status', 'draft')
    abnormal = 1 if data.get('abnormal') else 0
    ambiguity = 1 if data.get('ambiguity') else 0
    growthAbnormality = 1 if data.get('growthAbnormality') else 0
    normal = 1 if data.get('normal', False) else 0
    normalVariant = 1 if data.get('normalVariant') else 0
    indication = data.get('indication', '')
    diagnosis = data.get('diagnosis', '')
    referralDoctor = data.get('referralDoctor', '')
    primaryConsultant = data.get('primaryConsultant', '')
    signedByLeft = data.get('signedByLeft', '')
    signedByRight = data.get('signedByRight', '')
    typedBy = data.get('typedBy', '')
    reviewedBy = data.get('reviewedBy', '')
    icdCode = data.get('icdCode', '')

    cursor.execute('''
        INSERT INTO scans (
            patient_id, patient_display_id, visit_id, scan_type, scan_date, findings, conclusion, status,
            abnormal, ambiguity, growthAbnormality, normal, normalVariant, indication, diagnosis,
            referralDoctor, primaryConsultant, signedByLeft, signedByRight, typedBy, reviewedBy, icdCode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        patient_id, patient_display_id, visit_id, scan_type, scan_date, findings, conclusion, status,
        abnormal, ambiguity, growthAbnormality, normal, normalVariant, indication, diagnosis,
        referralDoctor, primaryConsultant, signedByLeft, signedByRight, typedBy, reviewedBy, icdCode
    ))

    scan_id = cursor.lastrowid
    initial_report, _ = report_object(data)
    current_actor = actor.get() or {}
    for field_path, previous_value, new_value in _report_field_changes({}, initial_report):
        conn.execute('''INSERT INTO clinical_field_history
            (scan_id, patient_id, visit_id, changed_by, role, field_path, previous_value, new_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            (scan_id, patient_id, visit_id, current_actor.get('name', 'unknown'), current_actor.get('role', 'unknown'),
             field_path, _json_value(previous_value), _json_value(new_value)))
    conn.commit()
    inserted = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
    conn.close()
    return {"success": True, "data": _map_scan_row(inserted)}

@app.put('/api/scans/{scan_id}')
def update_scan(scan_id: int, data: dict):
    conn = get_db()
    conn.execute('BEGIN IMMEDIATE')
    cursor = conn.cursor()
    existing = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(404, 'Scan not found')
    try:
        data = prepare_scan(data, existing)
    except Exception:
        conn.close()
        raise
    if data.get('visit_id'):
        visit = conn.execute('SELECT * FROM visits WHERE id = ? AND patient_id = ?', (data['visit_id'], data.get('patient_id'))).fetchone()
        if not visit or (visit['visit_type'] in ('Adult Echo', 'Fetal Echo', 'Pediatric Echo', 'Ultrasound') and visit['visit_type'] != data.get('scan_type')):
            conn.close()
            raise HTTPException(422, 'Report must match the selected patient, visit and scan type.')

    findings = data.get('findings')
    if 'adult_echo_report' in data:
        findings = json.dumps(data['adult_echo_report'])
    elif 'pediatric_echo_report' in data:
        findings = json.dumps(data['pediatric_echo_report'])
    elif 'fetal_echo_report' in data:
        findings = json.dumps(data['fetal_echo_report'])

    cursor.execute('''
        UPDATE scans SET
            patient_id = ?, patient_display_id = ?, visit_id = ?, scan_type = ?, scan_date = ?,
            findings = COALESCE(?, findings), conclusion = ?, status = ?, abnormal = ?, ambiguity = ?,
            growthAbnormality = ?, normal = ?, normalVariant = ?, indication = ?, diagnosis = ?,
            referralDoctor = ?, primaryConsultant = ?, signedByLeft = ?, signedByRight = ?,
            typedBy = ?, reviewedBy = ?, icdCode = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (
        data.get('patient_id'), data.get('patient_display_id'), data.get('visit_id'),
        data.get('scan_type'), data.get('scan_date'), findings, data.get('conclusion'),
        data.get('status'), 1 if data.get('abnormal') else 0, 1 if data.get('ambiguity') else 0,
        1 if data.get('growthAbnormality') else 0, 1 if data.get('normal') else 0,
        1 if data.get('normalVariant') else 0, data.get('indication'), data.get('diagnosis'),
        data.get('referralDoctor'), data.get('primaryConsultant'), data.get('signedByLeft'),
        data.get('signedByRight'), data.get('typedBy'), data.get('reviewedBy'), data.get('icdCode'), scan_id
    ))

    old_report, _ = report_object(dict(existing))
    new_report, _ = report_object({**data, 'findings': findings if findings is not None else existing['findings']})
    changes = _report_field_changes(old_report, new_report)
    current_actor = actor.get() or {}
    for field_path, previous_value, new_value in changes:
        conn.execute('''INSERT INTO clinical_field_history
            (scan_id, patient_id, visit_id, changed_by, role, field_path, previous_value, new_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            (scan_id, data.get('patient_id'), data.get('visit_id'), current_actor.get('name', 'unknown'),
             current_actor.get('role', 'unknown'), field_path, _json_value(previous_value), _json_value(new_value)))

    conn.commit()
    updated = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
    conn.close()
    return {"success": True, "data": _map_scan_row(updated)}

@app.get('/api/scans/{scan_id}/history')
def get_scan_history(scan_id: int):
    require_role('L2')
    conn = get_db()
    if not conn.execute('SELECT 1 FROM scans WHERE id = ?', (scan_id,)).fetchone():
        conn.close()
        raise HTTPException(404, 'Report not found.')
    rows = conn.execute('''SELECT changed_at, changed_by, role, field_path, previous_value, new_value
        FROM clinical_field_history WHERE scan_id = ? ORDER BY id DESC LIMIT 1000''', (scan_id,)).fetchall()
    conn.close()
    result = []
    for row in rows:
        item = dict(row)
        for field in ('previous_value', 'new_value'):
            try:
                item[field] = json.loads(item[field])
            except (ValueError, TypeError):
                pass
        result.append(item)
    return {'success': True, 'data': result}

@app.post('/api/scans/{scan_id}/correction')
def authorize_report_correction(scan_id: int, data: dict):
    user = require_role('L3')
    reason = str(data.get('reason') or '').strip()
    if len(reason) < 10:
        raise HTTPException(422, 'Enter a correction reason of at least 10 characters.')
    conn = get_db()
    conn.execute('BEGIN IMMEDIATE')
    row = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, 'Report not found.')
    if str(row['status'] or '').lower() != 'completed':
        conn.close()
        raise HTTPException(409, 'Only completed reports can enter the correction workflow.')
    mapped = _map_scan_row(row)
    report, key = report_object(mapped)
    if not report or not key:
        conn.close()
        raise HTTPException(422, 'The completed report content could not be read.')
    report['correction_workflow'] = {
        'active': True, 'reason': reason, 'authorized_by': user['name'],
        'authorized_at': datetime.utcnow().isoformat(timespec='seconds') + 'Z'
    }
    impression = report.setdefault('impression', {})
    impression.update(audit_done=False, audited_by='', audited_at='', report_completed=False)
    serialized = json.dumps(report)
    conn.execute('UPDATE scans SET findings = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                 (serialized, 'Correction In Progress', scan_id))
    conn.execute('''INSERT INTO report_correction_history (scan_id, patient_id, visit_id, changed_by, reason)
        VALUES (?, ?, ?, ?, ?)''', (scan_id, row['patient_id'], row['visit_id'], user['name'], reason))
    conn.execute('''INSERT INTO clinical_field_history
        (scan_id, patient_id, visit_id, changed_by, role, field_path, previous_value, new_value)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
        (scan_id, row['patient_id'], row['visit_id'], user['name'], user['role'], 'correction_workflow',
         _json_value({'active': False}), _json_value(report['correction_workflow'])))
    conn.commit()
    updated = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
    conn.close()
    return {'success': True, 'data': _map_scan_row(updated)}


@app.delete('/api/scans/{scan_id}')
def delete_scan(scan_id: int):
    require_role('L3')
    conn = get_db()
    conn.execute('BEGIN IMMEDIATE')
    existing = conn.execute('SELECT status FROM scans WHERE id = ?', (scan_id,)).fetchone()
    if existing and str(existing['status']).lower() == 'completed':
        conn.close()
        raise HTTPException(409, 'Completed reports are read-only.')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM scans WHERE id = ?', (scan_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Scan deleted successfully"}

# Referral Doctors Endpoints
@app.get('/api/referral-doctors')
def get_referral_doctors():
    conn = get_db()
    doctors = conn.execute('SELECT * FROM referral_doctors ORDER BY id DESC').fetchall()
    conn.close()
    return {"success": True, "data": [serialize_contact(d) for d in doctors]}

@app.get('/api/referral-doctors/{doctor_id}')
def get_referral_doctor(doctor_id: int):
    conn = get_db()
    doctor = conn.execute('SELECT * FROM referral_doctors WHERE id = ?', (doctor_id,)).fetchone()
    conn.close()
    if not doctor:
        raise HTTPException(status_code=404, detail="Referral doctor not found")
    return {"success": True, "data": serialize_contact(doctor)}

@app.post('/api/referral-doctors')
def create_referral_doctor(data: dict):
    data = contact_payload(data)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO referral_doctors (name, qualification, specialty, hospital, clinic_address, phone, email, registration_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('name'), data.get('qualification'), data.get('specialty'), data.get('hospital'),
        data.get('clinic_address'), data.get('phone'), data.get('email'), data.get('registration_number')
    ))
    doctor_id = cursor.lastrowid
    conn.execute('UPDATE referral_doctors SET extra_data = ? WHERE id = ?', (json.dumps(data), doctor_id))
    conn.commit()
    inserted = conn.execute('SELECT * FROM referral_doctors WHERE id = ?', (doctor_id,)).fetchone()
    conn.close()
    return {"success": True, "data": serialize_contact(inserted)}

@app.put('/api/referral-doctors/{doctor_id}')
def update_referral_doctor(doctor_id: int, data: dict):
    data = contact_payload(data)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE referral_doctors SET
            name = ?, qualification = ?, specialty = ?, hospital = ?, clinic_address = ?,
            phone = ?, email = ?, registration_number = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (
        data.get('name'), data.get('qualification'), data.get('specialty'), data.get('hospital'),
        data.get('clinic_address'), data.get('phone'), data.get('email'), data.get('registration_number'), doctor_id
    ))
    conn.execute('UPDATE referral_doctors SET extra_data = ? WHERE id = ?', (json.dumps(data), doctor_id))
    conn.commit()
    updated = conn.execute('SELECT * FROM referral_doctors WHERE id = ?', (doctor_id,)).fetchone()
    conn.close()
    return {"success": True, "data": serialize_contact(updated)}

@app.delete('/api/referral-doctors/{doctor_id}')
def delete_referral_doctor(doctor_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM referral_doctors WHERE id = ?', (doctor_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Referral doctor deleted successfully"}

# Custom & Lookup Options Endpoints
@app.get('/api/custom-options')
def get_custom_options(field: Optional[str] = None):
    conn = get_db()
    if field:
        options = conn.execute('SELECT * FROM custom_options WHERE field = ?', (field,)).fetchall()
    else:
        options = conn.execute('SELECT * FROM custom_options').fetchall()
    conn.close()
    return {"success": True, "data": [dict(o) for o in options]}

@app.post('/api/custom-options')
def create_custom_option(data: dict):
    field = data.get('field')
    value = data.get('value')
    if not isinstance(field, str) or not field.strip() or not isinstance(value, str) or not value.strip():
        raise HTTPException(422, 'A field and choice are required.')
    field, value = field.strip(), value.strip()
    if len(field) > 200 or len(value) > 500:
        raise HTTPException(422, 'Field or choice is too long.')
    conn = get_db()
    cursor = conn.cursor()
    existing = cursor.execute('SELECT * FROM custom_options WHERE field = ? AND value = ? COLLATE NOCASE', (field, value)).fetchone()
    if existing:
        conn.close()
        return {"success": True, "data": dict(existing)}
    cursor.execute('INSERT INTO custom_options (field, value) VALUES (?, ?)', (field, value))
    option_id = cursor.lastrowid
    conn.commit()
    inserted = conn.execute('SELECT * FROM custom_options WHERE id = ?', (option_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(inserted)}

@app.get('/api/lookup-options')
def get_lookup_options(category: Optional[str] = None):
    conn = get_db()
    if category:
        options = conn.execute('SELECT * FROM lookup_options WHERE category = ?', (category,)).fetchall()
    else:
        options = conn.execute('SELECT * FROM lookup_options').fetchall()
    conn.close()
    return {"success": True, "data": [dict(o) for o in options]}

@app.post('/api/lookup-options')
def create_lookup_option(data: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO lookup_options (category, value) VALUES (?, ?)', (data.get('category'), data.get('value')))
    option_id = cursor.lastrowid
    conn.commit()
    inserted = conn.execute('SELECT * FROM lookup_options WHERE id = ?', (option_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(inserted)}

# Settings Endpoints
@app.get('/api/settings')
def get_settings():
    conn = get_db()
    settings = conn.execute('SELECT * FROM settings WHERE id = 1').fetchone()
    conn.close()
    if settings:
        res = dict(settings)
        if res.get('imageConfig') and isinstance(res['imageConfig'], str):
            try:
                res['imageConfig'] = json.loads(res['imageConfig'])
            except:
                pass
        return {"success": True, "data": res}
    return {"success": True, "data": {}}

@app.get('/api/settings/next-patient-id')
def get_next_patient_id():
    conn = get_db()
    settings = conn.execute('SELECT next_number, prefix, pad_length FROM settings WHERE id = 1').fetchone()
    if settings:
        next_num = settings['next_number']
        prefix = settings['prefix'] if settings['prefix'] is not None else 'TM'
        pad_len = settings['pad_length'] if settings['pad_length'] is not None else 6
        patient_id = f"{prefix}{str(next_num).zfill(pad_len)}"
        conn.close()
        return {"success": True, "data": {"patient_id": patient_id}}

    count = conn.execute('SELECT COUNT(*) FROM patients').fetchone()[0]
    patient_id = f"TM{str(count + 1).zfill(6)}"
    conn.close()
    return {"success": True, "data": {"patient_id": patient_id}}

@app.put('/api/settings')
def save_settings(data: dict):
    conn = get_db()
    cursor = conn.cursor()

    if 'imageConfig' in data and isinstance(data['imageConfig'], dict):
        data['imageConfig'] = json.dumps(data['imageConfig'])

    existing = conn.execute('SELECT id FROM settings WHERE id = 1').fetchone()

    # Filter keys matching settings columns
    cursor.execute("PRAGMA table_info(settings)")
    valid_cols = [c[1] for c in cursor.fetchall() if c[1] != 'id']
    filtered_data = {k: v for k, v in data.items() if k in valid_cols}

    if existing:
        if filtered_data:
            set_clause = ', '.join([f"{key} = ?" for key in filtered_data.keys()])
            values = list(filtered_data.values())
            cursor.execute(f'UPDATE settings SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = 1', values)
    else:
        if filtered_data:
            keys = ', '.join(filtered_data.keys())
            placeholders = ', '.join(['?'] * len(filtered_data))
            values = list(filtered_data.values())
            cursor.execute(f'INSERT INTO settings (id, {keys}) VALUES (1, {placeholders})', values)
        else:
            cursor.execute('INSERT INTO settings (id) VALUES (1)')

    conn.commit()
    updated = conn.execute('SELECT * FROM settings WHERE id = 1').fetchone()
    conn.close()
    return {"success": True, "message": "Settings saved", "data": dict(updated) if updated else {}}

# Report Templates Endpoints
@app.get('/api/report-templates')
def get_templates():
    conn = get_db()
    templates = conn.execute('SELECT * FROM report_templates ORDER BY id DESC').fetchall()
    conn.close()
    res = []
    for t in templates:
        item = dict(t)
        if item.get('views') and isinstance(item['views'], str):
            try:
                item['views'] = json.loads(item['views'])
            except:
                pass
        res.append(item)
    return {"success": True, "data": res}

@app.post('/api/report-templates')
def create_template(data: dict):
    conn = get_db()
    cursor = conn.cursor()

    views_json = json.dumps(data.get('views', [])) if isinstance(data.get('views'), (list, dict)) else data.get('views', '[]')

    cursor.execute('''
        INSERT INTO report_templates (title, scan_type, layout, views, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (data.get('title'), data.get('scan_type'), data.get('layout'), views_json, datetime.now().isoformat()))

    template_id = cursor.lastrowid
    conn.commit()
    inserted = conn.execute('SELECT * FROM report_templates WHERE id = ?', (template_id,)).fetchone()
    conn.close()
    res = dict(inserted)
    if res.get('views') and isinstance(res['views'], str):
        try:
            res['views'] = json.loads(res['views'])
        except:
            pass
    return {"success": True, "data": res}

@app.put('/api/report-templates/{template_id}')
def update_template(template_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()

    views_json = json.dumps(data.get('views', [])) if isinstance(data.get('views'), (list, dict)) else data.get('views', '[]')

    cursor.execute('''
        UPDATE report_templates SET
            title = ?, scan_type = ?, layout = ?, views = ?, updated_at = ?
        WHERE id = ?
    ''', (data.get('title'), data.get('scan_type'), data.get('layout'), views_json, datetime.now().isoformat(), template_id))

    conn.commit()
    updated = conn.execute('SELECT * FROM report_templates WHERE id = ?', (template_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(updated)}

@app.delete('/api/report-templates/{template_id}')
def delete_template(template_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM report_templates WHERE id = ?', (template_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Template deleted"}

# Clinical Reports Endpoints
@app.get('/api/clinical-reports')
def get_reports(patient_id: Optional[int] = Query(None), scan_type: Optional[str] = Query(None)):
    conn = get_db()
    query = 'SELECT * FROM clinical_reports WHERE 1=1'
    params_list = []

    if patient_id is not None:
        query += ' AND patient_id = ?'
        params_list.append(patient_id)
    if scan_type is not None:
        query += ' AND scan_type = ?'
        params_list.append(scan_type)

    reports = conn.execute(query, params_list).fetchall()
    conn.close()
    return {"success": True, "data": [dict(r) for r in reports]}

@app.get('/api/clinical-reports/{report_id}')
def get_report(report_id: int):
    conn = get_db()
    report = conn.execute('SELECT * FROM clinical_reports WHERE id = ?', (report_id,)).fetchone()
    conn.close()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "data": dict(report)}

@app.post('/api/clinical-reports')
def create_report(data: dict):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO clinical_reports (patient_id, scan_id, scan_type, report_title, findings, conclusion, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('patient_id'), data.get('scan_id'), data.get('scan_type'),
        data.get('report_title'), data.get('findings'), data.get('conclusion'),
        data.get('status', 'draft'), datetime.now().isoformat()
    ))

    report_id = cursor.lastrowid
    conn.commit()
    inserted = conn.execute('SELECT * FROM clinical_reports WHERE id = ?', (report_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(inserted)}

@app.put('/api/clinical-reports/{report_id}')
def update_report(report_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        UPDATE clinical_reports SET
            scan_type = ?, report_title = ?, findings = ?, conclusion = ?, status = ?, updated_at = ?
        WHERE id = ?
    ''', (
        data.get('scan_type'), data.get('report_title'), data.get('findings'),
        data.get('conclusion'), data.get('status'), datetime.now().isoformat(), report_id
    ))

    conn.commit()
    updated = conn.execute('SELECT * FROM clinical_reports WHERE id = ?', (report_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(updated)}

@app.delete('/api/clinical-reports/{report_id}')
def delete_report(report_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM clinical_reports WHERE id = ?', (report_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Report deleted"}

# Dynamic Generic Resources Endpoints (Media records, saved queries, users, etc.)
def _normalize_table_name(resource: str) -> str:
    table_map = {
        'users': 'users',
        'referral-doctors': 'referral_doctors',
        'scans': 'scans',
        'patients': 'patients',
        'visits': 'visits',
        'media-records': 'media_records',
        'media_records': 'media_records',
        'saved-queries': 'saved_queries',
        'saved_queries': 'saved_queries',
        'report-templates': 'report_templates',
        'clinical-reports': 'clinical_reports',
    }
    if resource not in table_map:
        raise HTTPException(404, 'Unknown resource')
    if resource == 'users':
        require_role('L3')
    return table_map[resource]

@app.get('/api/resources/{resource}')
def list_resources(resource: str):
    conn = get_db()
    table = _normalize_table_name(resource)

    # Check if table exists
    check = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,)).fetchone()
    if not check:
        conn.close()
        return {"success": True, "data": []}

    items = conn.execute(f'SELECT * FROM {table} ORDER BY id DESC').fetchall()
    conn.close()
    res = []
    for item in items:
        d = dict(item)
        if 'query' in d and isinstance(d['query'], str):
            try:
                d['query'] = json.loads(d['query'])
            except:
                pass
        res.append(d)
    return {"success": True, "data": res}

@app.post('/api/resources/{resource}')
def create_resource(resource: str, data: dict):
    conn = get_db()
    table = _normalize_table_name(resource)
    if table == 'media_records':
        conn.close()
        raise HTTPException(403, 'Upload files using the media upload endpoint.')

    cursor = conn.cursor()
    # Check if table exists, create if saved_queries / media_records
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
    if not cursor.fetchone():
        if table == 'saved_queries':
            cursor.execute('CREATE TABLE saved_queries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, query TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)')
        elif table == 'media_records':
            cursor.execute('CREATE TABLE media_records (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id TEXT, visit_id TEXT, name TEXT, type TEXT, size INTEGER, status TEXT, url TEXT, data_url TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)')
        else:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Resource {resource} not supported")

    processed_data = {}
    for k, v in data.items():
        if isinstance(v, (dict, list)):
            processed_data[k] = json.dumps(v)
        else:
            processed_data[k] = v

    cursor.execute(f"PRAGMA table_info({table})")
    valid_cols = [c[1] for c in cursor.fetchall() if c[1] != 'id']
    insert_data = {k: v for k, v in processed_data.items() if k in valid_cols}

    if not insert_data:
        conn.close()
        raise HTTPException(status_code=400, detail="No valid fields provided")

    keys = ', '.join(insert_data.keys())
    placeholders = ', '.join(['?'] * len(insert_data))
    values = list(insert_data.values())

    cursor.execute(f'INSERT INTO {table} ({keys}) VALUES ({placeholders})', values)
    item_id = cursor.lastrowid
    conn.commit()
    inserted = conn.execute(f'SELECT * FROM {table} WHERE id = ?', (item_id,)).fetchone()
    conn.close()

    res = dict(inserted)
    if 'query' in res and isinstance(res['query'], str):
        try:
            res['query'] = json.loads(res['query'])
        except:
            pass
    return {"success": True, "data": res}

@app.put('/api/resources/{resource}/{item_id}')
def update_resource(resource: str, item_id: int, data: dict):
    conn = get_db()
    table = _normalize_table_name(resource)
    cursor = conn.cursor()
    if table == 'media_records':
        conn.execute('BEGIN IMMEDIATE')
        existing = conn.execute('SELECT * FROM media_records WHERE id = ?', (item_id,)).fetchone()
        if not existing:
            conn.close()
            raise HTTPException(404, 'Media record not found.')
        _guard_media_visit(conn, existing['visit_id'])
        if 'source_media_id' in data and data['source_media_id'] not in (None, ''):
            if isinstance(data['source_media_id'], bool) or not str(data['source_media_id']).isdigit():
                conn.close()
                raise HTTPException(422, 'Annotation source must be a media ID.')
            source = conn.execute('SELECT * FROM media_records WHERE id = ?', (data['source_media_id'],)).fetchone()
            if not source or source['id'] == existing['id'] or str(source['patient_id']) != str(existing['patient_id']) or str(source['visit_id']) != str(existing['visit_id']):
                conn.close()
                raise HTTPException(409, 'Annotation source must belong to the same patient and visit.')
        if existing['source_media_id'] and 'source_media_id' in data and str(data['source_media_id']) != str(existing['source_media_id']):
            conn.close()
            raise HTTPException(409, 'An annotation source cannot be reassigned.')
        for field in ('patient_id', 'visit_id', 'url', 'data_url', 'type', 'size'):
            if field in data and str(data[field] or '') != str(existing[field] or ''):
                conn.close()
                raise HTTPException(409, 'Media ownership and stored content cannot be changed.')

    processed_data = {}
    for k, v in data.items():
        if isinstance(v, (dict, list)):
            processed_data[k] = json.dumps(v)
        else:
            processed_data[k] = v

    cursor.execute(f"PRAGMA table_info({table})")
    valid_cols = [c[1] for c in cursor.fetchall() if c[1] != 'id']
    update_data = {k: v for k, v in processed_data.items() if k in valid_cols}

    if update_data:
        set_clause = ', '.join([f"{key} = ?" for key in update_data.keys()])
        values = list(update_data.values()) + [item_id]
        cursor.execute(f'UPDATE {table} SET {set_clause} WHERE id = ?', values)
        conn.commit()

    updated = conn.execute(f'SELECT * FROM {table} WHERE id = ?', (item_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(updated) if updated else {}}

@app.delete('/api/resources/{resource}/{item_id}')
def delete_resource(resource: str, item_id: int):
    conn = get_db()
    table = _normalize_table_name(resource)
    if table == 'media_records':
        conn.execute('BEGIN IMMEDIATE')
        record = conn.execute('SELECT * FROM media_records WHERE id = ?', (item_id,)).fetchone()
        if not record:
            conn.close()
            raise HTTPException(404, 'Media record not found.')
        _guard_media_visit(conn, record['visit_id'])
        conn.execute("UPDATE media_records SET status = 'Archived' WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        return {'success': True, 'message': 'Media archived. The original file is preserved.'}
    cursor = conn.cursor()
    cursor.execute(f'DELETE FROM {table} WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Resource deleted successfully"}

# Media Upload Endpoint
def _media_layout_context(patient_id, visit_id, kind, mutable=False):
    if kind not in ('compare', 'rule-2', 'rule-3', 'rule-4'):
        raise HTTPException(422, 'Unknown image layout.')
    conn = get_db()
    if not conn.execute('SELECT 1 FROM visits WHERE id = ? AND patient_id = ?', (visit_id, patient_id)).fetchone():
        conn.close()
        raise HTTPException(404, 'Patient visit not found.')
    if mutable:
        conn.execute('BEGIN IMMEDIATE')
        _guard_media_visit(conn, visit_id)
    return conn

@app.get('/api/media-layouts/{patient_id}/{visit_id}/{kind}')
def get_media_layout(patient_id: int, visit_id: int, kind: str):
    conn = _media_layout_context(patient_id, visit_id, kind)
    row = conn.execute('SELECT data FROM media_layouts WHERE patient_id = ? AND visit_id = ? AND kind = ?', (patient_id, visit_id, kind)).fetchone()
    conn.close()
    return {'data': json.loads(row['data']) if row else None}

@app.put('/api/media-layouts/{patient_id}/{visit_id}/{kind}')
def save_media_layout(patient_id: int, visit_id: int, kind: str, data: dict):
    conn = _media_layout_context(patient_id, visit_id, kind, True)
    slots = data.get('placements', [])
    columns = data.get('columns', 2)
    title = data.get('title', '')
    settings = data.get('print_settings')
    invalid = not isinstance(slots, list) or len(slots) > 16 or type(columns) is not int or not 1 <= columns <= 4 or not isinstance(title, str) or len(title) > 160
    if not invalid and settings is not None:
        # Supported print settings: image box width/height in pixels and rows per printed page.
        if not isinstance(settings, dict) or set(settings) != {'width', 'height', 'rows'}:
            invalid = True
        else:
            width, height, rows = settings['width'], settings['height'], settings['rows']
            invalid = any(type(value) is not int or not low <= value <= high for value, low, high in ((width, 60, 1200), (height, 60, 1200), (rows, 1, 6)))
    if invalid:
        conn.close()
        raise HTTPException(422, 'Invalid image layout.')
    for media_id in slots:
        if media_id is not None and (type(media_id) is not int or not conn.execute("SELECT 1 FROM media_records WHERE id = ? AND patient_id = ? AND visit_id = ? AND status != 'Archived'", (media_id, patient_id, visit_id)).fetchone()):
            conn.close()
            raise HTTPException(422, 'Layout images must be active media from this patient visit.')
    saved = {'placements': slots, 'columns': columns, 'title': title}
    if settings is not None:
        saved['print_settings'] = {'width': settings['width'], 'height': settings['height'], 'rows': settings['rows']}
    conn.execute('INSERT INTO media_layouts VALUES (?, ?, ?, ?, ?) ON CONFLICT(patient_id,visit_id,kind) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at', (patient_id, visit_id, kind, json.dumps(saved), datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return {'success': True, 'data': saved}

def _guard_media_visit(conn, visit_id, close=True):
    if visit_id and conn.execute("SELECT 1 FROM scans WHERE visit_id = ? AND lower(status) = 'completed'", (visit_id,)).fetchone():
        if close:
            conn.close()
        raise HTTPException(409, 'Media for a visit with a completed report is read-only.')

@app.post('/api/media-upload')
async def upload_media(file: UploadFile = File(...), patient_id: Optional[int] = Form(None), visit_id: Optional[int] = Form(None)):
    conn = get_db()
    _guard_media_visit(conn, visit_id)
    if patient_id is not None and not conn.execute('SELECT 1 FROM patients WHERE id = ?', (patient_id,)).fetchone():
        conn.close()
        raise HTTPException(422, 'Select an existing patient.')
    if visit_id is not None and not conn.execute('SELECT 1 FROM visits WHERE id = ? AND patient_id = ?', (visit_id, patient_id)).fetchone():
        conn.close()
        raise HTTPException(422, 'The visit must belong to the selected patient.')
    # Only passive browser formats are supported. DICOM decoding/ingestion is not implemented.
    formats = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm'}
    name = os.path.basename((file.filename or '').replace('\\', '/'))
    extension = os.path.splitext(name)[1].lower()
    if extension not in formats:
        conn.close()
        raise HTTPException(415, 'Supported files: PNG, JPEG, WebP, PDF, MP4 and WebM. DICOM import is not configured.')
    filename = secrets.token_hex(20) + extension
    file_path = os.path.join(UPLOADS_DIR, filename)
    try:
        os.makedirs(UPLOADS_DIR, exist_ok=True, mode=0o700)
        size = 0
        with os.fdopen(os.open(file_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'wb') as buffer:
            while chunk := await file.read(65536):
                size += len(chunk)
                if size > int(os.environ.get('ECHOAI_MAX_UPLOAD_BYTES', '20971520')):
                    raise HTTPException(413, 'File exceeds the configured upload limit.')
                if size == len(chunk):
                    valid = {'.png': chunk.startswith(b'\x89PNG\r\n\x1a\n'), '.jpg': chunk.startswith(b'\xff\xd8\xff'), '.jpeg': chunk.startswith(b'\xff\xd8\xff'), '.pdf': chunk.startswith(b'%PDF-'), '.webp': chunk.startswith(b'RIFF') and chunk[8:12] == b'WEBP', '.mp4': chunk[4:8] == b'ftyp', '.webm': chunk.startswith(b'\x1a\x45\xdf\xa3')}[extension]
                    if not valid:
                        raise HTTPException(415, 'File contents do not match a supported format.')
                buffer.write(chunk)
        if not size:
            raise HTTPException(422, 'The file is empty.')
        url = f'/uploads/{filename}'
        conn.execute('BEGIN IMMEDIATE')
        _guard_media_visit(conn, visit_id, close=False)
        cursor = conn.execute('INSERT INTO media_records (patient_id, visit_id, name, type, size, status, url) VALUES (?, ?, ?, ?, ?, ?, ?)', (patient_id, visit_id, name, formats[extension], size, 'Uploaded', url))
        record = dict(conn.execute('SELECT * FROM media_records WHERE id = ?', (cursor.lastrowid,)).fetchone())
        conn.commit()
        return {'success': True, 'data': {**record, 'filename': name, 'path': url}}
    except Exception:
        conn.rollback()
        if os.path.exists(file_path):
            os.remove(file_path)
        raise
    finally:
        conn.close()
        await file.close()

@app.middleware('http')
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'no-referrer'
    response.headers['Content-Security-Policy'] = "frame-ancestors 'none'"
    if request.url.path.startswith(('/api/', '/uploads/')):
        response.headers['Cache-Control'] = 'no-store'
    return response

app.mount('/uploads', StaticFiles(directory=UPLOADS_DIR, check_dir=False), name='uploads')

@app.get('/{full_path:path}', include_in_schema=False)
def serve_frontend(full_path: str):
    if full_path.startswith('api/'):
        raise HTTPException(status_code=404, detail='API endpoint not found')

    dist_root = os.path.realpath(FRONTEND_DIST)
    requested_path = os.path.realpath(os.path.join(dist_root, full_path))
    if requested_path.startswith(f'{dist_root}{os.sep}') and os.path.isfile(requested_path):
        return FileResponse(requested_path)

    index_path = os.path.join(dist_root, 'index.html')
    if os.path.isfile(index_path):
        return FileResponse(index_path)

    if not full_path:
        return JSONResponse({
            "message": "Echo AI Cardiology API Server",
            "status": "online",
            "version": "1.0.0",
        })
    raise HTTPException(status_code=404, detail='Frontend build not found')

# Wrap the completed app so CORS runs outside every early-returning middleware,
# including authentication failures and security headers.
app = CORSMiddleware(
    app,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

if __name__ == '__main__':
    import uvicorn
    trusted_hosts = os.environ.get('ECHOAI_TRUSTED_PROXIES', '')
    proxy_headers = bool(trusted_hosts.strip())
    forwarded_allow_ips = trusted_hosts if proxy_headers else None
    uvicorn.run(
        app,
        host=os.environ.get('HOST', '127.0.0.1'),
        port=int(os.environ.get('PORT', '8002')),
        proxy_headers=proxy_headers,
        forwarded_allow_ips=forwarded_allow_ips,
    )

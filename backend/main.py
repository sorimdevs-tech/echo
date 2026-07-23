from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any, Dict
import sqlite3
import json
from datetime import datetime, date
import os

app = FastAPI(title="Echo AI Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve DB path relative to current file directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'echo.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Unified Database Initialization
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
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
            referred_by TEXT,
            registration_date TEXT,
            referred_by_doctor_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
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
    
    conn.commit()
    conn.close()

@app.on_event("startup")
def startup():
    init_db()

@app.get('/')
def root():
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

    return patient

# Dashboard Stats Endpoint
@app.get('/api/dashboard/stats')
def get_dashboard_stats():
    conn = get_db()
    c = conn.cursor()
    
    total_patients = c.execute('SELECT COUNT(*) FROM patients').fetchone()[0]
    total_scans = c.execute('SELECT COUNT(*) FROM scans').fetchone()[0]
    adult_echo = c.execute('SELECT COUNT(*) FROM scans WHERE scan_type = "Adult Echo"').fetchone()[0]
    fetal_echo = c.execute('SELECT COUNT(*) FROM scans WHERE scan_type = "Fetal Echo"').fetchone()[0]
    pediatric_echo = c.execute('SELECT COUNT(*) FROM scans WHERE scan_type = "Pediatric Echo"').fetchone()[0]
    
    today_str = date.today().isoformat()
    todays_visits = c.execute('SELECT COUNT(*) FROM visits WHERE visit_date LIKE ?', (f"{today_str}%",)).fetchone()[0]
    
    conn.close()
    
    return {
        "success": True,
        "data": {
            "total_patients": total_patients,
            "total_scans": total_scans,
            "adult_echo": adult_echo,
            "fetal_echo": fetal_echo,
            "pediatric_echo": pediatric_echo,
            "todays_visits": todays_visits
        }
    }

# Patient Endpoints
@app.get('/api/patients')
def get_patients():
    conn = get_db()
    patients = conn.execute('SELECT * FROM patients ORDER BY id DESC').fetchall()
    conn.close()
    return {"success": True, "data": [_map_patient_row(p) for p in patients]}

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
    conn = get_db()
    cursor = conn.cursor()
    
    patient_id = data.get('patient_id')
    if not patient_id:
        count = conn.execute('SELECT COUNT(*) FROM patients').fetchone()[0]
        patient_id = f"PAT{str(count + 1).zfill(6)}"
    
    salutation = data.get('salutation', '')
    first_name = data.get('first_name', '')
    middle_name = data.get('middle_name', '')
    last_name = data.get('last_name', '')
    gender = data.get('gender', 'M')
    age = int(data.get('age')) if data.get('age') and str(data.get('age')).isdigit() else None
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
    referred_by = data.get('referred_by', '')
    registration_date = data.get('registration_date') or datetime.now().strftime("%Y-%m-%d")
    referred_by_doctor_id = data.get('referred_by_doctor_id')
    
    try:
        cursor.execute('''
            INSERT INTO patients (
                patient_id, salutation, first_name, middle_name, last_name, gender, age, dob,
                mobile, phone1, phone2, email, address, street, area, area_po, taluk,
                city, district_city, state, pincode, zip_code, country, ethnic_origin,
                aadhar_number, abha_number, blood_group, marital_status, occupation,
                religion, nationality, emergency_contact_name, emergency_contact_phone,
                emergency_contact_relation, fax, family_doctor, referred_by, registration_date, referred_by_doctor_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            patient_id, salutation, first_name, middle_name, last_name, gender, age, dob,
            mobile, phone1, phone2, email, street, street, area, area_po, taluk,
            city, city, state, pincode, pincode, country, ethnic_origin,
            aadhar_number, abha_number, blood_group, marital_status, occupation,
            religion, nationality, emergency_contact_name, emergency_contact_phone,
            emergency_contact_relation, fax, family_doctor, referred_by, registration_date, referred_by_doctor_id
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

@app.put('/api/patients/{patient_id}')
def update_patient(patient_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    
    street = data.get('street') or data.get('address') or ''
    city = data.get('district_city') or data.get('city') or ''
    pincode = data.get('zip_code') or data.get('pincode') or ''
    aadhar_number = data.get('aadhaar_no') or data.get('aadhar_number') or ''
    age = int(data.get('age')) if data.get('age') and str(data.get('age')).isdigit() else None
    
    cursor.execute('''
        UPDATE patients SET
            patient_id = ?, salutation = ?, first_name = ?, middle_name = ?, last_name = ?, gender = ?,
            age = ?, dob = ?, mobile = ?, phone1 = ?, phone2 = ?, email = ?,
            address = ?, street = ?, area = ?, area_po = ?, taluk = ?, city = ?, district_city = ?,
            state = ?, pincode = ?, zip_code = ?, country = ?, ethnic_origin = ?, aadhar_number = ?,
            abha_number = ?, blood_group = ?, marital_status = ?, occupation = ?,
            religion = ?, nationality = ?, emergency_contact_name = ?,
            emergency_contact_phone = ?, emergency_contact_relation = ?, fax = ?, family_doctor = ?,
            referred_by = ?, registration_date = ?, referred_by_doctor_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (
        data.get('patient_id'), data.get('salutation'), data.get('first_name'), data.get('middle_name'),
        data.get('last_name'), data.get('gender'), age, data.get('dob'), data.get('mobile'),
        data.get('phone1'), data.get('phone2'), data.get('email'), street, street, data.get('area'),
        data.get('area_po'), data.get('taluk'), city, city, data.get('state'), pincode, pincode,
        data.get('country', 'India'), data.get('ethnic_origin'), aadhar_number, data.get('abha_number'),
        data.get('blood_group'), data.get('marital_status'), data.get('occupation'), data.get('religion'),
        data.get('nationality', 'Indian'), data.get('emergency_contact_name'), data.get('emergency_contact_phone'),
        data.get('emergency_contact_relation'), data.get('fax'), data.get('family_doctor'), data.get('referred_by'),
        data.get('registration_date'), data.get('referred_by_doctor_id'), patient_id
    ))
    
    conn.commit()
    updated = conn.execute('SELECT * FROM patients WHERE id = ?', (patient_id,)).fetchone()
    conn.close()
    return {"success": True, "data": _map_patient_row(updated)}

@app.delete('/api/patients/{patient_id}')
def delete_patient(patient_id: int):
    conn = get_db()
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
    cursor = conn.cursor()
    
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
    
    cursor.execute('''
        INSERT INTO visits (patient_id, visit_date, visit_type, doctor_id, diagnosis, notes, referral_doctor, image_count, avi, pregnancy, ob)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (patient_id, visit_date, visit_type, doctor_id, diagnosis, notes, referral_doctor, image_count, avi, pregnancy, ob))
    
    visit_id = cursor.lastrowid
    conn.commit()
    inserted = conn.execute('SELECT * FROM visits WHERE id = ?', (visit_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(inserted)}

@app.put('/api/patients/{patient_id}/visits/{visit_id}')
def update_visit(patient_id: int, visit_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE visits SET
            visit_date = ?, visit_type = ?, doctor_id = ?, diagnosis = ?, notes = ?,
            referral_doctor = ?, image_count = ?, avi = ?, pregnancy = ?, ob = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND patient_id = ?
    ''', (
        data.get('visit_date'), data.get('visit_type'), data.get('doctor_id'),
        data.get('diagnosis'), data.get('notes'), data.get('referral_doctor'),
        data.get('image_count', 0), data.get('avi', 0), data.get('pregnancy', 0),
        data.get('ob', ''), visit_id, patient_id
    ))
    
    conn.commit()
    updated = conn.execute('SELECT * FROM visits WHERE id = ?', (visit_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(updated)}

@app.delete('/api/patients/{patient_id}/visits/{visit_id}')
def delete_visit(patient_id: int, visit_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM visits WHERE id = ? AND patient_id = ?', (visit_id, patient_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Visit deleted successfully"}

# Scans Endpoints
@app.get('/api/scans')
def get_scans():
    conn = get_db()
    scans = conn.execute('SELECT * FROM scans ORDER BY id DESC').fetchall()
    conn.close()
    return {"success": True, "data": [dict(s) for s in scans]}

@app.get('/api/scans/{scan_id}')
def get_scan(scan_id: int):
    conn = get_db()
    scan = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
    conn.close()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"success": True, "data": dict(scan)}

@app.get('/api/scans/patient/{patient_id}')
def get_scans_by_patient(patient_id: int):
    conn = get_db()
    scans = conn.execute('SELECT * FROM scans WHERE patient_id = ? ORDER BY id DESC', (patient_id,)).fetchall()
    conn.close()
    return {"success": True, "data": [dict(s) for s in scans]}

@app.post('/api/scans')
def create_scan(data: dict):
    conn = get_db()
    cursor = conn.cursor()
    
    patient_id = data.get('patient_id')
    patient_display_id = data.get('patient_display_id', '')
    visit_id = data.get('visit_id')
    scan_type = data.get('scan_type', 'Adult Echo')
    scan_date = data.get('scan_date') or datetime.now().isoformat()
    findings = data.get('findings', '')
    conclusion = data.get('conclusion', '')
    status = data.get('status', 'draft')
    abnormal = 1 if data.get('abnormal') else 0
    ambiguity = 1 if data.get('ambiguity') else 0
    growthAbnormality = 1 if data.get('growthAbnormality') else 0
    normal = 1 if data.get('normal', True) else 0
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
    conn.commit()
    inserted = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(inserted)}

@app.put('/api/scans/{scan_id}')
def update_scan(scan_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE scans SET
            patient_id = ?, patient_display_id = ?, visit_id = ?, scan_type = ?, scan_date = ?,
            findings = ?, conclusion = ?, status = ?, abnormal = ?, ambiguity = ?,
            growthAbnormality = ?, normal = ?, normalVariant = ?, indication = ?, diagnosis = ?,
            referralDoctor = ?, primaryConsultant = ?, signedByLeft = ?, signedByRight = ?,
            typedBy = ?, reviewedBy = ?, icdCode = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (
        data.get('patient_id'), data.get('patient_display_id'), data.get('visit_id'),
        data.get('scan_type'), data.get('scan_date'), data.get('findings'), data.get('conclusion'),
        data.get('status'), 1 if data.get('abnormal') else 0, 1 if data.get('ambiguity') else 0,
        1 if data.get('growthAbnormality') else 0, 1 if data.get('normal') else 0,
        1 if data.get('normalVariant') else 0, data.get('indication'), data.get('diagnosis'),
        data.get('referralDoctor'), data.get('primaryConsultant'), data.get('signedByLeft'),
        data.get('signedByRight'), data.get('typedBy'), data.get('reviewedBy'), data.get('icdCode'), scan_id
    ))
    
    conn.commit()
    updated = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(updated)}

@app.delete('/api/scans/{scan_id}')
def delete_scan(scan_id: int):
    conn = get_db()
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
    return {"success": True, "data": [dict(d) for d in doctors]}

@app.get('/api/referral-doctors/{doctor_id}')
def get_referral_doctor(doctor_id: int):
    conn = get_db()
    doctor = conn.execute('SELECT * FROM referral_doctors WHERE id = ?', (doctor_id,)).fetchone()
    conn.close()
    if not doctor:
        raise HTTPException(status_code=404, detail="Referral doctor not found")
    return {"success": True, "data": dict(doctor)}

@app.post('/api/referral-doctors')
def create_referral_doctor(data: dict):
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
    conn.commit()
    inserted = conn.execute('SELECT * FROM referral_doctors WHERE id = ?', (doctor_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(inserted)}

@app.put('/api/referral-doctors/{doctor_id}')
def update_referral_doctor(doctor_id: int, data: dict):
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
    conn.commit()
    updated = conn.execute('SELECT * FROM referral_doctors WHERE id = ?', (doctor_id,)).fetchone()
    conn.close()
    return {"success": True, "data": dict(updated)}

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
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO custom_options (field, value) VALUES (?, ?)', (data.get('field'), data.get('value')))
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
        prefix = settings['prefix'] if settings['prefix'] is not None else 'PAT'
        pad_len = settings['pad_length'] if settings['pad_length'] is not None else 6
        patient_id = f"{prefix}{str(next_num).zfill(pad_len)}"
        conn.close()
        return {"success": True, "data": {"patient_id": patient_id}}
    
    count = conn.execute('SELECT COUNT(*) FROM patients').fetchone()[0]
    patient_id = f"PAT{str(count + 1).zfill(6)}"
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
            values = list(filtered_data.values()) + [1]
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
    return table_map.get(resource, resource.replace('-', '_'))

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
    cursor = conn.cursor()
    cursor.execute(f'DELETE FROM {table} WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Resource deleted successfully"}

# Media Upload Endpoint
@app.post('/api/media-upload')
async def upload_media(file: UploadFile = File(...)):
    try:
        uploads_dir = os.path.join(BASE_DIR, 'uploads')
        os.makedirs(uploads_dir, exist_ok=True)
        
        file_path = os.path.join(uploads_dir, file.filename)
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        rel_path = f"uploads/{file.filename}"
        return {"success": True, "data": {"filename": file.filename, "path": rel_path, "url": rel_path}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8002)

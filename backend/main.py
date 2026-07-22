from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from bson import ObjectId
from typing import Optional, List
import uvicorn
from pathlib import Path
from uuid import uuid4

app = FastAPI(title="EchoScan API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from database import db

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ==================== HELPER FUNCTIONS ====================
def serialize_doc(doc):
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, datetime):
            doc[key] = value.isoformat()
    return doc

def serialize_list(docs):
    return [serialize_doc(doc) for doc in docs]


# ==================== CUSTOM SELECT OPTIONS ====================
@app.get("/api/custom-options")
async def get_custom_options(field: Optional[str] = None):
    query = {"field": field} if field else {}
    options = await db.custom_options.find(query).sort("value", 1).to_list(1000)
    return {"success": True, "data": serialize_list(options)}


@app.post("/api/custom-options")
async def create_custom_option(option: dict):
    field = str(option.get("field", "")).strip()
    value = str(option.get("value", "")).strip()
    if not field or not value:
        raise HTTPException(status_code=400, detail="Field and value are required")

    existing = await db.custom_options.find_one({"field": field, "value_key": value.casefold()})
    if existing:
        return {"success": True, "data": serialize_doc(existing), "created": False}

    record = {
        "field": field,
        "value": value,
        "value_key": value.casefold(),
        "created_at": datetime.utcnow(),
    }
    result = await db.custom_options.insert_one(record)
    saved = await db.custom_options.find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(saved), "created": True}


@app.delete("/api/custom-options/{option_id}")
async def delete_custom_option(option_id: str):
    try:
        object_id = ObjectId(option_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid option ID")
    result = await db.custom_options.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Custom option not found")
    return {"success": True, "message": "Custom option deleted"}


# ==================== PATIENT ENDPOINTS ====================
@app.get("/api/patients")
async def get_patients():
    patients = await db.patients.find().sort("created_at", -1).to_list(1000)
    return {"success": True, "data": serialize_list(patients)}


@app.post("/api/patients")
async def create_patient(patient: dict):
    if not str(patient.get("patient_id", "")).strip():
        settings = await db.settings.find_one({"key": "application"}) or {}
        mode = settings.get("idMode", "Manual ID")
        if mode != "Manual ID":
            number = int(settings.get("nextNumber", 1))
            pad = int(settings.get("padLength", 1))
            prefix = str(settings.get("prefix", ""))
            patient["patient_id"] = f"{prefix}{str(number).zfill(pad)}"
            await db.settings.update_one({"key": "application"}, {"$set": {"nextNumber": number + 1}})
    patient["created_at"] = datetime.utcnow()
    patient["updated_at"] = datetime.utcnow()
    result = await db.patients.insert_one(patient)
    saved = await db.patients.find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(saved)}


@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: str):
    patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"success": True, "data": serialize_doc(patient)}


@app.put("/api/patients/{patient_id}")
async def update_patient(patient_id: str, patient: dict):
    patient["updated_at"] = datetime.utcnow()
    result = await db.patients.find_one_and_update(
        {"_id": ObjectId(patient_id)},
        {"$set": patient},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"success": True, "data": serialize_doc(result)}


@app.delete("/api/patients/{patient_id}")
async def delete_patient(patient_id: str):
    result = await db.patients.delete_one({"_id": ObjectId(patient_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"success": True, "message": "Patient deleted successfully"}


# ==================== VISIT ENDPOINTS ====================
@app.post("/api/patients/{patient_id}/visits")
async def add_visit(patient_id: str, visit: dict):
    try:
        patient_object_id = ObjectId(patient_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    patient = await db.patients.find_one({"_id": patient_object_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    visit_record = {
        **visit,
        "patient_id": patient_id,
        "patient_display_id": patient.get("patient_id", ""),
        "patient_name": " ".join(filter(None, [patient.get("first_name"), patient.get("last_name")])),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.visits.insert_one(visit_record)
    saved = await db.visits.find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(saved)}


@app.get("/api/patients/{patient_id}/visits")
async def get_visits(patient_id: str):
    visits = await db.visits.find({"patient_id": patient_id}).sort("created_at", -1).to_list(100)
    return {"success": True, "data": serialize_list(visits)}


@app.delete("/api/patients/{patient_id}/visits/{visit_id}")
async def delete_visit(patient_id: str, visit_id: str):
    try:
        visit_object_id = ObjectId(visit_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid visit ID")
    result = await db.visits.delete_one({"_id": visit_object_id, "patient_id": patient_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Visit not found for this patient")
    return {"success": True, "message": "Visit deleted"}


@app.put("/api/patients/{patient_id}/visits/{visit_id}")
async def update_visit(patient_id: str, visit_id: str, visit: dict):
    try:
        visit_object_id = ObjectId(visit_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid visit ID")
    visit.pop("id", None)
    visit.pop("_id", None)
    visit["updated_at"] = datetime.utcnow()
    result = await db.visits.find_one_and_update(
        {"_id": visit_object_id, "patient_id": patient_id},
        {"$set": visit},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Visit not found for this patient")
    return {"success": True, "data": serialize_doc(result)}


# ==================== REFERRAL DOCTOR ENDPOINTS ====================
@app.get("/api/referral-doctors")
async def get_referral_doctors():
    doctors = await db.referral_doctors.find().sort("created_at", -1).to_list(1000)
    return {"success": True, "data": serialize_list(doctors)}


@app.post("/api/referral-doctors")
async def create_referral_doctor(doctor: dict):
    doctor["created_at"] = datetime.utcnow()
    doctor["updated_at"] = datetime.utcnow()
    result = await db.referral_doctors.insert_one(doctor)
    saved = await db.referral_doctors.find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(saved)}


@app.get("/api/referral-doctors/{doctor_id}")
async def get_referral_doctor(doctor_id: str):
    doctor = await db.referral_doctors.find_one({"_id": ObjectId(doctor_id)})
    if not doctor:
        raise HTTPException(status_code=404, detail="Referral doctor not found")
    return {"success": True, "data": serialize_doc(doctor)}


@app.put("/api/referral-doctors/{doctor_id}")
async def update_referral_doctor(doctor_id: str, doctor: dict):
    doctor["updated_at"] = datetime.utcnow()
    result = await db.referral_doctors.find_one_and_update(
        {"_id": ObjectId(doctor_id)},
        {"$set": doctor},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Referral doctor not found")
    return {"success": True, "data": serialize_doc(result)}


@app.delete("/api/referral-doctors/{doctor_id}")
async def delete_referral_doctor(doctor_id: str):
    result = await db.referral_doctors.delete_one({"_id": ObjectId(doctor_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Referral doctor not found")
    return {"success": True, "message": "Referral doctor deleted successfully"}


# ==================== ECHO SCAN ENDPOINTS ====================
@app.get("/api/scans")
async def get_scans():
    scans = await db.scans.find().sort("created_at", -1).to_list(1000)
    return {"success": True, "data": serialize_list(scans)}


@app.post("/api/scans")
async def create_scan(scan: dict):
    scan["created_at"] = datetime.utcnow()
    scan["updated_at"] = datetime.utcnow()
    scan["status"] = scan.get("status", "draft")
    result = await db.scans.insert_one(scan)
    saved = await db.scans.find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(saved)}


@app.get("/api/scans/{scan_id}")
async def get_scan(scan_id: str):
    scan = await db.scans.find_one({"_id": ObjectId(scan_id)})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"success": True, "data": serialize_doc(scan)}


@app.put("/api/scans/{scan_id}")
async def update_scan(scan_id: str, scan: dict):
    scan["updated_at"] = datetime.utcnow()
    result = await db.scans.find_one_and_update(
        {"_id": ObjectId(scan_id)},
        {"$set": scan},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"success": True, "data": serialize_doc(result)}


@app.delete("/api/scans/{scan_id}")
async def delete_scan(scan_id: str):
    result = await db.scans.delete_one({"_id": ObjectId(scan_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"success": True, "message": "Scan deleted successfully"}


@app.get("/api/scans/patient/{patient_id}")
async def get_scans_by_patient(patient_id: str):
    scans = await db.scans.find({"patient_id": patient_id}).sort("created_at", -1).to_list(1000)
    return {"success": True, "data": serialize_list(scans)}


# ==================== DASHBOARD ENDPOINTS ====================
@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    patient_count = await db.patients.count_documents({})
    scan_count = await db.scans.count_documents({})
    adult_echo_count = await db.scans.count_documents({"scan_type": "Adult Echo"})
    fetal_echo_count = await db.scans.count_documents({"scan_type": "Fetal Echo"})
    pediatric_echo_count = await db.scans.count_documents({"scan_type": "Pediatric Echo"})
    
    return {
        "success": True,
        "data": {
            "total_patients": patient_count,
            "total_scans": scan_count,
            "adult_echo": adult_echo_count,
            "fetal_echo": fetal_echo_count,
            "pediatric_echo": pediatric_echo_count
        }
    }


# ==================== REPORT TEMPLATE ENDPOINTS ====================
@app.get("/api/report-templates")
async def get_report_templates():
    templates = await db.report_templates.find().to_list(100)
    return {"success": True, "data": serialize_list(templates)}


@app.post("/api/report-templates")
async def create_report_template(template: dict):
    template["created_at"] = datetime.utcnow()
    result = await db.report_templates.insert_one(template)
    saved = await db.report_templates.find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(saved)}


@app.put("/api/report-templates/{template_id}")
async def update_report_template(template_id: str, template: dict):
    template.pop("id", None)
    template["updated_at"] = datetime.utcnow()
    result = await db.report_templates.find_one_and_update(
        {"_id": ObjectId(template_id)}, {"$set": template}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Report template not found")
    return {"success": True, "data": serialize_doc(result)}


@app.delete("/api/report-templates/{template_id}")
async def delete_report_template(template_id: str):
    result = await db.report_templates.delete_one({"_id": ObjectId(template_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report template not found")
    return {"success": True, "message": "Report template deleted"}


# ==================== CLINICAL REPORT ENDPOINTS ====================
@app.get("/api/clinical-reports")
async def get_clinical_reports(patient_id: Optional[str] = None, visit_id: Optional[str] = None):
    query = {}
    if patient_id:
        query["patient_id"] = patient_id
    if visit_id:
        query["visit_id"] = visit_id
    reports = await db.clinical_reports.find(query).sort("updated_at", -1).to_list(1000)
    return {"success": True, "data": serialize_list(reports)}


@app.post("/api/clinical-reports")
async def create_clinical_report(report: dict):
    report["created_at"] = datetime.utcnow()
    report["updated_at"] = datetime.utcnow()
    report["status"] = report.get("status", "Draft")
    result = await db.clinical_reports.insert_one(report)
    saved = await db.clinical_reports.find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(saved)}


@app.get("/api/clinical-reports/{report_id}")
async def get_clinical_report(report_id: str):
    report = await db.clinical_reports.find_one({"_id": ObjectId(report_id)})
    if not report:
        raise HTTPException(status_code=404, detail="Clinical report not found")
    return {"success": True, "data": serialize_doc(report)}


@app.put("/api/clinical-reports/{report_id}")
async def update_clinical_report(report_id: str, report: dict):
    report.pop("id", None)
    report.pop("_id", None)
    report["updated_at"] = datetime.utcnow()
    result = await db.clinical_reports.find_one_and_update(
        {"_id": ObjectId(report_id)}, {"$set": report}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Clinical report not found")
    return {"success": True, "data": serialize_doc(result)}


@app.delete("/api/clinical-reports/{report_id}")
async def delete_clinical_report(report_id: str):
    result = await db.clinical_reports.delete_one({"_id": ObjectId(report_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Clinical report not found")
    return {"success": True, "message": "Clinical report deleted"}


# ==================== APPLICATION CONFIGURATION ====================
@app.get("/api/settings")
async def get_settings():
    settings = await db.settings.find_one({"key": "application"})
    return {"success": True, "data": serialize_doc(settings) if settings else {}}


@app.put("/api/settings")
async def update_settings(settings: dict):
    settings.pop("id", None)
    settings["key"] = "application"
    settings["updated_at"] = datetime.utcnow()
    result = await db.settings.find_one_and_update(
        {"key": "application"},
        {"$set": settings, "$setOnInsert": {"created_at": datetime.utcnow()}},
        upsert=True,
        return_document=True,
    )
    return {"success": True, "data": serialize_doc(result)}


@app.get("/api/settings/next-patient-id")
async def get_next_patient_id():
    settings = await db.settings.find_one({"key": "application"}) or {}
    mode = settings.get("idMode", "Manual ID")
    if mode == "Manual ID":
        return {"success": True, "data": {"mode": mode, "patient_id": ""}}
    number = int(settings.get("nextNumber", 1))
    pad = int(settings.get("padLength", 1))
    prefix = str(settings.get("prefix", ""))
    return {"success": True, "data": {"mode": mode, "patient_id": f"{prefix}{str(number).zfill(pad)}"}}


def collection_for_resource(resource: str):
    allowed = {
        "users": db.users,
        "saved-queries": db.saved_queries,
        "media-records": db.media_records,
    }
    collection = allowed.get(resource)
    if collection is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    return collection


@app.get("/api/resources/{resource}")
async def get_resources(resource: str):
    collection = collection_for_resource(resource)
    records = await collection.find().sort("updated_at", -1).to_list(1000)
    return {"success": True, "data": serialize_list(records)}


@app.post("/api/resources/{resource}")
async def create_resource(resource: str, payload: dict):
    collection = collection_for_resource(resource)
    payload["created_at"] = datetime.utcnow()
    payload["updated_at"] = datetime.utcnow()
    result = await collection.insert_one(payload)
    saved = await collection.find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(saved)}


@app.put("/api/resources/{resource}/{record_id}")
async def update_resource(resource: str, record_id: str, payload: dict):
    collection = collection_for_resource(resource)
    payload.pop("id", None)
    payload["updated_at"] = datetime.utcnow()
    result = await collection.find_one_and_update(
        {"_id": ObjectId(record_id)}, {"$set": payload}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"success": True, "data": serialize_doc(result)}


@app.delete("/api/resources/{resource}/{record_id}")
async def delete_resource(resource: str, record_id: str):
    collection = collection_for_resource(resource)
    object_id = ObjectId(record_id)
    record = await collection.find_one({"_id": object_id})
    result = await collection.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")
    if resource == "media-records" and record and record.get("stored_name"):
        media_path = UPLOAD_DIR / Path(record["stored_name"]).name
        if media_path.exists():
            media_path.unlink()
    return {"success": True, "message": "Record deleted"}


@app.post("/api/media-upload")
async def upload_media(
    file: UploadFile = File(...),
    patient_id: str = Form(""),
    visit_id: str = Form(""),
    anonymous: str = Form("false"),
    ae_title: str = Form(""),
    ip_address: str = Form(""),
):
    suffix = Path(file.filename or "media.bin").suffix[:12]
    stored_name = f"{uuid4().hex}{suffix}"
    destination = UPLOAD_DIR / stored_name
    content = await file.read()
    destination.write_bytes(content)
    record = {
        "patient_id": patient_id,
        "visit_id": visit_id,
        "name": Path(file.filename or stored_name).name,
        "stored_name": stored_name,
        "type": file.content_type or "application/octet-stream",
        "size": len(content),
        "url": f"/api/media-files/{stored_name}",
        "status": "Ready",
        "anonymous": anonymous.lower() == "true",
        "ae_title": ae_title,
        "ip_address": ip_address,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.media_records.insert_one(record)
    saved = await db.media_records.find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(saved)}


@app.get("/api/media-files/{stored_name}")
async def get_media_file(stored_name: str):
    path = UPLOAD_DIR / Path(stored_name).name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Media file not found")
    return FileResponse(path)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

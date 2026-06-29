from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from typing import Optional, List
import os
import uvicorn

app = FastAPI(title="EchoScan API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from database import db


@app.on_event("startup")
async def ensure_indexes():
    await db.lookup_options.create_index(
        [("category", 1), ("normalized_value", 1)],
        unique=True,
        name="lookup_category_normalized_value",
    )

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


def normalize_lookup_value(value):
    return " ".join(str(value or "").strip().split())


def clean_mutation_payload(payload):
    readonly_fields = {"id", "_id", "created_at", "updated_at"}
    return {key: value for key, value in payload.items() if key not in readonly_fields}


def pick_fields(source, fields):
    return {field: source.get(field, "") for field in fields}


def build_patient_document(patient):
    document = dict(patient)
    selected_scans = document.get("selected_scans") or []

    document["basic_information"] = pick_fields(document, [
        "patient_id",
        "salutation",
        "first_name",
        "last_name",
        "middle_name",
        "age",
        "dob",
        "gender",
        "marital_status",
        "ethnic_origin",
        "aadhaar_no",
    ])
    document["address_information"] = pick_fields(document, [
        "street",
        "taluk",
        "area",
        "area_po",
        "zip_code",
        "country",
        "state",
        "district_city",
    ])
    document["contact_information"] = pick_fields(document, [
        "phone1",
        "phone2",
        "mobile",
        "fax",
        "email",
    ])
    document["care_information"] = pick_fields(document, [
        "family_doctor",
    ])
    document["scan_preferences"] = {
        "selected_scans": selected_scans,
    }

    return document


def build_referral_doctor_document(doctor):
    document = dict(doctor)

    document["identity_information"] = pick_fields(document, [
        "doctor_type",
        "salutation",
        "first_name",
        "last_name",
        "middle_name",
        "hospital_name",
    ])
    document["professional_information"] = pick_fields(document, [
        "reg_no",
        "speciality",
        "qualification",
        "institution_name",
        "designation",
    ])
    document["address_information"] = pick_fields(document, [
        "street",
        "area_po",
        "area",
        "district_city",
        "zip_code",
        "country",
        "state",
    ])
    document["contact_information"] = pick_fields(document, [
        "phone1",
        "phone2",
        "mobile",
        "fax",
        "email",
    ])
    document["status_information"] = {
        "set_as_default": bool(document.get("set_as_default")),
        "inactive": bool(document.get("inactive")),
    }

    return document


def build_visit_document(visit):
    document = dict(visit)

    document["visit_information"] = pick_fields(document, [
        "visit_date",
        "referral_doctor",
    ])
    document["scan_information"] = pick_fields(document, [
        "image_count",
        "avi",
        "pregnancy",
        "ob",
    ])

    return document


# ==================== LOOKUP OPTION ENDPOINTS ====================
@app.get("/api/lookup-options")
async def get_lookup_options(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category

    options = await db.lookup_options.find(query).sort([
        ("category", 1),
        ("created_at", 1),
        ("value", 1),
    ]).to_list(1000)
    return {"success": True, "data": serialize_list(options)}


@app.post("/api/lookup-options")
async def create_lookup_option(option: dict):
    category = normalize_lookup_value(option.get("category"))
    value = normalize_lookup_value(option.get("value"))

    if not category or not value:
        raise HTTPException(status_code=400, detail="Category and value are required")

    normalized_value = value.lower()
    now = datetime.utcnow()
    lookup_option = {
        "category": category,
        "value": value,
        "normalized_value": normalized_value,
        "created_at": now,
        "updated_at": now,
    }

    try:
        result = await db.lookup_options.insert_one(lookup_option)
        saved = await db.lookup_options.find_one({"_id": result.inserted_id})
    except DuplicateKeyError:
        saved = await db.lookup_options.find_one({
            "category": category,
            "normalized_value": normalized_value,
        })

    return {"success": True, "data": serialize_doc(saved)}


# ==================== PATIENT ENDPOINTS ====================
@app.get("/api/patients")
async def get_patients():
    patients = await db.patients.find().sort("created_at", -1).to_list(1000)
    return {"success": True, "data": serialize_list(patients)}


@app.post("/api/patients")
async def create_patient(patient: dict):
    patient = build_patient_document(clean_mutation_payload(patient))
    patient["created_at"] = datetime.utcnow()
    patient["updated_at"] = datetime.utcnow()
    try:
        result = await db.patients.insert_one(patient)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Patient ID already exists")
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
    object_id = ObjectId(patient_id)
    existing = await db.patients.find_one({"_id": object_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Patient not found")

    base_patient = clean_mutation_payload(existing)
    base_patient.update(clean_mutation_payload(patient))
    patient = build_patient_document(base_patient)
    patient["updated_at"] = datetime.utcnow()
    try:
        result = await db.patients.find_one_and_update(
            {"_id": object_id},
            {"$set": patient},
            return_document=True
        )
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Patient ID already exists")
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
    patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    visit = build_visit_document(clean_mutation_payload(visit))
    visit["patient_id"] = patient_id
    visit["created_at"] = datetime.utcnow()
    visit["updated_at"] = datetime.utcnow()
    result = await db.visits.insert_one(visit)
    saved = await db.visits.find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(saved)}


@app.get("/api/patients/{patient_id}/visits")
async def get_visits(patient_id: str):
    visits = await db.visits.find({"patient_id": patient_id}).sort("created_at", -1).to_list(100)
    return {"success": True, "data": serialize_list(visits)}


@app.put("/api/visits/{visit_id}")
async def update_visit(visit_id: str, visit: dict):
    object_id = ObjectId(visit_id)
    existing = await db.visits.find_one({"_id": object_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Visit not found")

    base_visit = clean_mutation_payload(existing)
    base_visit.update(clean_mutation_payload(visit))
    base_visit["patient_id"] = existing["patient_id"]
    updated_visit = build_visit_document(base_visit)
    updated_visit["updated_at"] = datetime.utcnow()

    result = await db.visits.find_one_and_update(
        {"_id": object_id},
        {"$set": updated_visit},
        return_document=True
    )
    return {"success": True, "data": serialize_doc(result)}


@app.delete("/api/visits/{visit_id}")
async def delete_visit(visit_id: str):
    result = await db.visits.delete_one({"_id": ObjectId(visit_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Visit not found")
    return {"success": True, "message": "Visit deleted successfully"}


# ==================== REFERRAL DOCTOR ENDPOINTS ====================
@app.get("/api/referral-doctors")
async def get_referral_doctors():
    doctors = await db.referral_doctors.find().sort("created_at", -1).to_list(1000)
    return {"success": True, "data": serialize_list(doctors)}


@app.post("/api/referral-doctors")
async def create_referral_doctor(doctor: dict):
    doctor = build_referral_doctor_document(clean_mutation_payload(doctor))
    if doctor.get("set_as_default"):
        await db.referral_doctors.update_many(
            {"doctor_type": doctor.get("doctor_type", "doctor")},
            {"$set": {"set_as_default": False}},
        )
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
    object_id = ObjectId(doctor_id)
    existing = await db.referral_doctors.find_one({"_id": object_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Referral doctor not found")

    base_doctor = clean_mutation_payload(existing)
    base_doctor.update(clean_mutation_payload(doctor))
    doctor = build_referral_doctor_document(base_doctor)
    if doctor.get("set_as_default"):
        await db.referral_doctors.update_many(
            {
                "_id": {"$ne": object_id},
                "doctor_type": doctor.get("doctor_type", "doctor"),
            },
            {"$set": {"set_as_default": False}},
        )
    doctor["updated_at"] = datetime.utcnow()
    result = await db.referral_doctors.find_one_and_update(
        {"_id": object_id},
        {"$set": doctor},
        return_document=True
    )
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


if __name__ == "__main__":
    port = int(os.getenv("ECHO_API_PORT", os.getenv("PORT", "8001")))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

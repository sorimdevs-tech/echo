from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from bson import ObjectId
from typing import Optional, List
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


# ==================== PATIENT ENDPOINTS ====================
@app.get("/api/patients")
async def get_patients():
    patients = await db.patients.find().sort("created_at", -1).to_list(1000)
    return {"success": True, "data": serialize_list(patients)}


@app.post("/api/patients")
async def create_patient(patient: dict):
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
    visit["patient_id"] = patient_id
    visit["created_at"] = datetime.utcnow()
    result = await db.visits.insert_one(visit)
    saved = await db.visits.find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(saved)}


@app.get("/api/patients/{patient_id}/visits")
async def get_visits(patient_id: str):
    visits = await db.visits.find({"patient_id": patient_id}).sort("created_at", -1).to_list(100)
    return {"success": True, "data": serialize_list(visits)}


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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
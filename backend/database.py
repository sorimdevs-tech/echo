from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "echoscan_db")

# Async client for FastAPI
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Sync client for initialization
sync_client = MongoClient(MONGO_URL)
sync_db = sync_client[DB_NAME]

def init_db():
    """Initialize database with collections and indexes"""
    # Patients collection
    sync_db.patients.create_index("patient_id", unique=True)
    sync_db.patients.create_index("first_name")
    sync_db.patients.create_index("last_name")
    
    # Visits collection
    sync_db.visits.create_index("patient_id")
    sync_db.visits.create_index("created_at")
    
    # Referral doctors collection
    sync_db.referral_doctors.create_index("first_name")
    sync_db.referral_doctors.create_index("last_name")

    # Lookup options collection
    sync_db.lookup_options.create_index(
        [("category", 1), ("normalized_value", 1)],
        unique=True,
        name="lookup_category_normalized_value",
    )
    
    # Scans collection
    sync_db.scans.create_index("patient_id")
    sync_db.scans.create_index("scan_type")
    sync_db.scans.create_index("created_at")
    
    # Report templates collection
    sync_db.report_templates.create_index("scan_type")

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")

import json
import random
from datetime import datetime, timedelta

# Seed for reproducible high-quality sample data
random.seed(42)

# Demographics Pools
male_first_names = [
    "Rajesh", "Amit", "Suresh", "Rahul", "Vijay", "Arun", "Kiran", "Sanjay", "Prakash", "Manoj",
    "Ramesh", "Naveen", "Deepak", "Sunil", "Anil", "Ganesh", "Shankar", "Murali", "Prasad", "Vikram",
    "Arvind", "Harish", "Pradeep", "Mahesh", "Ashok", "Dinesh", "Raman", "Venkat", "Siddharth", "Rohan"
]

female_first_names = [
    "Priya", "Meera", "Anita", "Sunita", "Kavita", "Rekha", "Shanti", "Geeta", "Sita", "Radha",
    "Pooja", "Neha", "Riya", "Diya", "Isha", "Nisha", "Asha", "Usha", "Latha", "Savita",
    "Ananya", "Gayatri", "Radhika", "Swati", "Deepa", "Vidyut", "Suniti", "Malini", "Shruti", "Bhavana"
]

pediatric_male_names = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Dhruv", "Kabir", "Ritvik", "Aarush", "Dev", "Tanish", "Atharva", "Kian", "Advait", "Rudra"
]

pediatric_female_names = [
    "Aanya", "Aadhya", "Ananya", "Pari", "Mira", "Saanvi", "Myra", "Kiara", "Riya", "Navya",
    "Diya", "Ira", "Avani", "Tanvi", "Aditi", "Anvi", "Kavya", "Vanya", "Shanaya", "Prisha"
]

last_names = [
    "Kumar", "Sharma", "Patel", "Singh", "Reddy", "Rao", "Nair", "Iyer", "Joshi", "Agarwal",
    "Gupta", "Malhotra", "Kapoor", "Mehta", "Shah", "Desai", "Pillai", "Menon", "Bhat", "Hegde",
    "Kulkarni", "Deshmukh", "Verma", "Chandra", "Pandey", "Chatterjee", "Mukherjee", "Banerjee", "Srinivasan", "Gowda"
]

cities_states = [
    ("Bangalore", "Karnataka", "560001", "MG Road"),
    ("Bangalore", "Karnataka", "560034", "Koramangala"),
    ("Bangalore", "Karnataka", "560011", "Jayanagar"),
    ("Bangalore", "Karnataka", "560038", "Indiranagar"),
    ("Mumbai", "Maharashtra", "400001", "Fort"),
    ("Mumbai", "Maharashtra", "400050", "Bandra West"),
    ("Mumbai", "Maharashtra", "400053", "Andheri West"),
    ("Delhi", "Delhi", "110001", "Connaught Place"),
    ("Delhi", "Delhi", "110016", "Hauz Khas"),
    ("Chennai", "Tamil Nadu", "600001", "George Town"),
    ("Chennai", "Tamil Nadu", "600018", "T. Nagar"),
    ("Hyderabad", "Telangana", "500001", "Abids"),
    ("Hyderabad", "Telangana", "500034", "Banjara Hills"),
    ("Pune", "Maharashtra", "411001", "Camp"),
    ("Pune", "Maharashtra", "411004", "Deccan Gymkhana"),
    ("Ahmedabad", "Gujarat", "380001", "Ashram Road"),
    ("Kolkata", "West Bengal", "700001", "BBD Bagh"),
    ("Jaipur", "Rajasthan", "302001", "Pink City"),
    ("Kochi", "Kerala", "682001", "Marine Drive"),
    ("Coimbatore", "Tamil Nadu", "641001", "RS Puram")
]

blood_groups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
occupations = ["Software Engineer", "Teacher", "Business Owner", "Civil Servant", "Accountant", "Homemaker", "Student", "Retired", "Farmer", "Doctor", "Architect", "Lawyer"]

# Referral Doctors (15 realistic specialists)
referral_doctors = [
    {
        "id": 1, "name": "Dr. Arvind Swamy", "qualification": "MBBS, MD, DM (Cardiology)",
        "specialty": "Interventional Cardiology", "hospital": "Fortis Heart Institute",
        "clinic_address": "Suite 402, Fortis Tower, Bannerghatta Road, Bangalore",
        "phone": "080-26580011", "email": "arvind.swamy@fortisheart.org", "registration_number": "KMC-34821"
    },
    {
        "id": 2, "name": "Dr. Sunita Kulkarni", "qualification": "MBBS, MD, DNB (OBGYN)",
        "specialty": "Obstetrics & Fetal Medicine", "hospital": "Motherhood Hospital",
        "clinic_address": "12th Main Road, Indiranagar, Bangalore",
        "phone": "080-41258800", "email": "dr.sunita@motherhood.in", "registration_number": "KMC-41209"
    },
    {
        "id": 3, "name": "Dr. Rajesh V. Varma", "qualification": "MBBS, MD (Pediatrics), DNB",
        "specialty": "Pediatric Cardiology", "hospital": "Rainbow Children's Hospital",
        "clinic_address": "Marathahalli Ring Road, Bangalore",
        "phone": "080-67415000", "email": "rvarma@rainbowkids.org", "registration_number": "KMC-52184"
    },
    {
        "id": 4, "name": "Dr. Meenakshi Sundaram", "qualification": "MBBS, MD, DM (Cardiology)",
        "specialty": "Cardiology", "hospital": "Apollo Hospitals",
        "clinic_address": "21 Greams Lane, Thousand Lights, Chennai",
        "phone": "044-28290200", "email": "m_sundaram@apollo.com", "registration_number": "TNM-29401"
    },
    {
        "id": 5, "name": "Dr. Anil Kumar Mehta", "qualification": "MBBS, MD (Internal Medicine)",
        "specialty": "General Medicine", "hospital": "Max Super Speciality Hospital",
        "clinic_address": "Press Enclave Road, Saket, New Delhi",
        "phone": "011-26515050", "email": "anil.mehta@maxhealth.in", "registration_number": "DMC-18492"
    },
    {
        "id": 6, "name": "Dr. Preeti Deshmukh", "qualification": "MBBS, MS (OBGYN), Fellow Fetal Medicine",
        "specialty": "Fetal Echo Specialist", "hospital": "Manipal Hospital",
        "clinic_address": "HAL Airport Road, Bangalore",
        "phone": "080-25024444", "email": "preeti.deshmukh@manipal.edu", "registration_number": "KMC-48920"
    },
    {
        "id": 7, "name": "Dr. Vikramaditya Singh", "qualification": "MBBS, MD, DM (Pediatric Cardiology)",
        "specialty": "Pediatric Cardiac Care", "hospital": "AIIMS Cardiology Center",
        "clinic_address": "Ansari Nagar, New Delhi",
        "phone": "011-26588500", "email": "vsingh@aiims.ac.in", "registration_number": "DMC-31054"
    },
    {
        "id": 8, "name": "Dr. Farhan Ahmed", "qualification": "MBBS, MD (Medicine), FICC",
        "specialty": "Cardiopulmonary Medicine", "hospital": "Lilavati Hospital & Research Centre",
        "clinic_address": "A-791, Bandra Reclamation, Bandra West, Mumbai",
        "phone": "022-26751000", "email": "farhan.ahmed@lilavatihospital.com", "registration_number": "MMC-76541"
    },
    {
        "id": 9, "name": "Dr. Shalini Reddy", "qualification": "MBBS, MD, DM (Cardiology)",
        "specialty": "Electrophysiology & Cardiology", "hospital": "Narayana Health City",
        "clinic_address": "Hosur Road, Bommasandra, Bangalore",
        "phone": "080-71222222", "email": "shalini.reddy@narayanahealth.org", "registration_number": "KMC-60192"
    },
    {
        "id": 10, "name": "Dr. Suresh Hegde", "qualification": "MBBS, MD (Pediatrics)",
        "specialty": "Pediatrics", "hospital": "Cloudnine Hospital",
        "clinic_address": "17th Cross, Malleshwaram, Bangalore",
        "phone": "080-43339999", "email": "shegde@cloudninecare.com", "registration_number": "KMC-39104"
    },
    {
        "id": 11, "name": "Dr. Sanjay Joshi", "qualification": "MBBS, MD (Cardiology)",
        "specialty": "Non-Invasive Cardiology", "hospital": "Sahyadri Hospital",
        "clinic_address": "Deccan Gymkhana, Pune",
        "phone": "020-67213000", "email": "sanjay.joshi@sahyadhri.com", "registration_number": "MMC-64120"
    },
    {
        "id": 12, "name": "Dr. Gayatri Nair", "qualification": "MBBS, MS (OBGYN)",
        "specialty": "Obstetrics & Gynecology", "hospital": "Aster Medcity",
        "clinic_address": "Kuttisahib Road, Cheranalloor, Kochi",
        "phone": "0484-6699999", "email": "gayatri.nair@asterhospital.com", "registration_number": "TCMC-28190"
    },
    {
        "id": 13, "name": "Dr. Harish Chandra", "qualification": "MBBS, MD, DNB (General Medicine)",
        "specialty": "Internal Medicine", "hospital": "Columbia Asia Hospital",
        "clinic_address": "Kirloskar Business Park, Hebbal, Bangalore",
        "phone": "080-41321900", "email": "harish.chandra@columbiaasia.com", "registration_number": "KMC-54019"
    },
    {
        "id": 14, "name": "Dr. Radhika Agarwal", "qualification": "MBBS, MD (Pediatrics)",
        "specialty": "Pediatric Care", "hospital": "Medanta The Medicity",
        "clinic_address": "CH Baktawar Singh Road, Sector 38, Gurgaon",
        "phone": "0124-4141414", "email": "radhika.agarwal@medanta.org", "registration_number": "HN-19402"
    },
    {
        "id": 15, "name": "Dr. Pradeep Rao", "qualification": "MBBS, MD, DM (Cardiology)",
        "specialty": "Cardiology", "hospital": "Care Hospitals",
        "clinic_address": "Road No. 1, Banjara Hills, Hyderabad",
        "phone": "040-61656565", "email": "pradeep.rao@carehospitals.com", "registration_number": "TSMC-33910"
    }
]

# Generate 100 Realistic Patients
patients = []
visits = []
scans = []
clinical_reports = []

base_date = datetime.now()

for i in range(1, 101):
    # Determine study profile type:
    # 1..60: Adult Echo (Ages 18 - 82)
    # 61..80: Fetal Echo (Pregnant Females, Ages 21 - 36)
    # 81..100: Pediatric Echo (Children, Ages 0 - 16)
    
    if i <= 60:
        category = "Adult"
        gender = random.choice(["M", "F"])
        salutation = "Mr." if gender == "M" else random.choice(["Mrs.", "Ms."])
        first_name = random.choice(male_first_names) if gender == "M" else random.choice(female_first_names)
        last_name = random.choice(last_names)
        age = random.randint(18, 82)
        marital_status = "Married" if age > 25 else random.choice(["Single", "Married"])
        occupation = random.choice(occupations)
    elif i <= 80:
        category = "Fetal"
        gender = "F"
        salutation = random.choice(["Mrs.", "Ms."])
        first_name = random.choice(female_first_names)
        last_name = random.choice(last_names)
        age = random.randint(21, 36)
        marital_status = "Married"
        occupation = random.choice(["Teacher", "Software Engineer", "Homemaker", "Accountant", "Architect"])
    else:
        category = "Pediatric"
        gender = random.choice(["M", "F"])
        salutation = "Master" if gender == "M" else "Baby of"
        first_name = random.choice(pediatric_male_names) if gender == "M" else random.choice(pediatric_female_names)
        last_name = random.choice(last_names)
        age = random.randint(0, 16)
        marital_status = "Single"
        occupation = "Student" if age >= 5 else "Child"
        
    birth_date = base_date - timedelta(days=int(age * 365.25) + random.randint(0, 300))
    dob_str = birth_date.strftime("%Y-%m-%d")
    
    city_info = random.choice(cities_states)
    city, state, pincode, area_name = city_info
    
    mob_prefix = random.choice(["98", "99", "97", "96", "94", "88", "77"])
    mobile = f"{mob_prefix}{random.randint(10000000, 99999999)}"
    phone1 = f"0{random.randint(11, 80)}-{random.randint(20000000, 29999999)}"
    email = f"{first_name.lower()}.{last_name.lower()}{i}@gmail.com"
    street_addr = f"No. {random.randint(1, 450)}, {area_name}, Near {random.choice(['Water Tank', 'Post Office', 'Main Bus Stop', 'City Mall', 'Central Park'])}"
    
    aadhar_num = f"{random.randint(2000, 9999)}{random.randint(1000, 9999)}{random.randint(1000, 9999)}"
    abha_num = f"ABHA-{random.randint(10, 99)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
    
    ref_doc = random.choice(referral_doctors)
    reg_days_ago = random.randint(0, 180)
    reg_date = (base_date - timedelta(days=reg_days_ago)).strftime("%Y-%m-%d")
    
    patient_id_str = f"PAT{str(i).zfill(6)}"
    
    patient = {
        "id": i,
        "patient_id": patient_id_str,
        "salutation": salutation,
        "first_name": first_name,
        "middle_name": random.choice(["", last_names[random.randint(0, len(last_names)-1)]]) if random.random() > 0.6 else "",
        "last_name": last_name,
        "gender": gender,
        "age": age,
        "dob": dob_str,
        "mobile": mobile,
        "phone1": phone1,
        "phone2": "",
        "email": email,
        "address": street_addr,
        "street": street_addr,
        "area": area_name,
        "area_po": f"{area_name} PO",
        "taluk": f"{city} Taluk",
        "city": city,
        "district_city": city,
        "state": state,
        "pincode": pincode,
        "zip_code": pincode,
        "country": "India",
        "ethnic_origin": "Indian",
        "aadhar_number": aadhar_num,
        "aadhaar_no": aadhar_num,
        "abha_number": abha_num,
        "blood_group": random.choice(blood_groups),
        "marital_status": marital_status,
        "occupation": occupation,
        "religion": random.choice(["Hindu", "Muslim", "Christian", "Sikh", "Jain"]),
        "nationality": "Indian",
        "emergency_contact_name": f"{random.choice(male_first_names)} {last_name}",
        "emergency_contact_phone": f"98{random.randint(10000000, 99999999)}",
        "emergency_contact_relation": random.choice(["Spouse", "Parent", "Sibling", "Guardian"]),
        "fax": "",
        "family_doctor": ref_doc["name"],
        "referred_by": ref_doc["name"],
        "registration_date": reg_date,
        "referred_by_doctor_id": ref_doc["id"]
    }
    patients.append(patient)

# Generate Visits and Scans for each patient
visit_counter = 1
scan_counter = 1
report_counter = 1

# Adult Clinical Findings Templates
adult_findings_pool = [
    {
        "findings": "Left Ventricle: Concentric LV hypertrophy present. LVEF: 62%. Regional wall motion normal. Left Atrium: Mildly dilated (LA dimension 38 mm). Valves: Aortic valve trileaflet with mild sclerosis, no stenosis. Mitral valve shows mild posterior leaflet prolapse with mild regurgitation (MR). Right Ventricle & Atrium: Normal dimensions. PASP: 28 mmHg. Pericardium: No pericardial effusion.",
        "conclusion": "Concentric LV Hypertrophy with preserved LV Systolic Function (LVEF 62%), Grade I Diastolic Dysfunction, and Mild Mitral Regurgitation.",
        "abnormal": True, "normal": False, "diagnosis": "Hypertensive Heart Disease / Mild MR", "icd": "I11.9"
    },
    {
        "findings": "Left Ventricle: LVEF: 38% (moderately reduced). Hypokinesia noted in anterior and anteroseptal wall segments. Left Atrium: Dilated (LA volume index 42 ml/m²). Mitral Valve: Secondary functional mitral regurgitation (Moderate MR). Right Ventricle: TAPSE 15 mm (borderline RV systolic function). Pericardium: Trace pericardial effusion.",
        "conclusion": "Ischemic Cardiomyopathy with Moderately Reduced LVEF (38%), Anterior Wall Hypokinesia, and Moderate Functional Mitral Regurgitation.",
        "abnormal": True, "normal": False, "diagnosis": "Ischemic Cardiomyopathy / Heart Failure", "icd": "I25.5"
    },
    {
        "findings": "Left Ventricle: Normal LV size and wall thickness. LVEF: 65% (normal). No regional wall motion abnormality. Left Atrium: Normal size (32 mm). Valves: Normal aortic, mitral, and tricuspid valve morphology and doppler velocities. Right Ventricle: Normal RV size and function. PASP: 22 mmHg. Pericardium: No pericardial effusion.",
        "conclusion": "Normal Transthoracic Echocardiogram. Preserved Biventricular Systolic Function (LVEF 65%). No Valvular Heart Disease.",
        "abnormal": False, "normal": True, "diagnosis": "Normal Echocardiogram", "icd": "Z01.810"
    },
    {
        "findings": "Left Ventricle: Normal LV cavity dimensions. LVEF: 60%. Left Atrium: Normal (34 mm). Aortic Valve: Calcified bicuspid aortic valve with severe aortic stenosis. Peak velocity: 4.3 m/s, Mean gradient: 44 mmHg, Aortic valve area (AVA): 0.8 cm². Mitral Valve: Mild aortic regurgitation noted. Right Ventricle: Normal size. PASP: 35 mmHg.",
        "conclusion": "Severe Calcified Aortic Stenosis (AVA 0.8 cm², Mean Gradient 44 mmHg) on Bicuspid Aortic Valve with Preserved LV Ejection Fraction (60%).",
        "abnormal": True, "normal": False, "diagnosis": "Severe Aortic Stenosis", "icd": "I35.0"
    },
    {
        "findings": "Left Ventricle: LVEF: 55%. Normal global systolic function. Grade II Diastolic Dysfunction (pseudonormal pattern, E/A 1.4, Dec time 150 ms, E/e' 15). Left Atrium: Dilated (LA volume index 39 ml/m²). Valves: Mild Tricuspid Regurgitation. PASP: 38 mmHg (mild pulmonary hypertension). Pericardium: Intact.",
        "conclusion": "Grade II LV Diastolic Dysfunction with Left Atrial Enlargement and Mild Pulmonary Arterial Hypertension.",
        "abnormal": True, "normal": False, "diagnosis": "Diastolic Heart Failure / HFpEF", "icd": "I50.32"
    }
]

# Fetal Clinical Findings Templates
fetal_findings_pool = [
    {
        "findings": "Fetal Echocardiogram at 22 weeks gestation. Heart rate: 144 bpm (regular rhythm). Viscerocardiac situs solus, levocardia. 4-chamber view normal and balanced. Intact ventricular septum. Crossing of aortic and pulmonary outflow tracts confirmed. Ductal arch and aortic arch intact with left-sided arch. Normal systemic and pulmonary venous returns. No pericardial effusion or hydrops.",
        "conclusion": "Normal Targeted Fetal Echocardiogram at 22 weeks gestation. Normal 4-chamber and outflow tract views. No structural fetal cardiac anomaly identified.",
        "abnormal": False, "normal": True, "diagnosis": "Normal Fetal Echocardiogram", "icd": "Z36.89"
    },
    {
        "findings": "Fetal Echocardiogram at 24 weeks gestation. Fetal heart rate: 138 bpm. Situs solus, levocardia. 4-chamber view demonstrates symmetrical chamber sizes. Foramen ovale flap fluttering freely in LA. Three-vessel trachea view (3VT) normal. Aortic arch intact. No pericardial effusion. Normal fetal cardiac hemodynamics.",
        "conclusion": "Unremarkable Fetal Cardiac Evaluation at 24 weeks. Reassuring fetal cardiac anatomy and rhythm.",
        "abnormal": False, "normal": True, "diagnosis": "Normal Fetal Study", "icd": "Z36.89"
    },
    {
        "findings": "Fetal Echocardiogram at 23 weeks gestation. Fetal heart rate: 140 bpm. Situs solus, levocardia. 4-chamber view reveals a 2.8 mm perimembranous Ventricular Septal Defect (VSD) with left-to-right flow. Outflow tracts crossed normally. Both arches intact. No hydrops.",
        "conclusion": "Fetal Echocardiogram showing Small Perimembranous VSD (2.8 mm). Otherwise normal cardiac anatomy. Postnatal echocardiogram recommended.",
        "abnormal": True, "normal": False, "diagnosis": "Fetal Perimembranous VSD", "icd": "Q21.0"
    }
]

# Pediatric Clinical Findings Templates
pediatric_findings_pool = [
    {
        "findings": "Pediatric Echocardiogram. Normal cardiac position and segmental connections. Interatrial septum: 4.2 mm ostium secundum ASD with left-to-right shunt. No significant RV enlargement. Interventricular septum intact. LVEF: 66%. Aortic arch left-sided without coarctation.",
        "conclusion": "Small Ostium Secundum Atrial Septal Defect (4.2 mm) with Left-to-Right Shunt. Preserved Biventricular Function.",
        "abnormal": True, "normal": False, "diagnosis": "Ostium Secundum ASD", "icd": "Q21.1"
    },
    {
        "findings": "Pediatric Echocardiogram. Cardiac position normal. Small muscular VSD (2.5 mm) in mid-septum with restrictive left-to-right jet (peak velocity 4.1 m/s, gradient 67 mmHg). Normal LV and RV dimensions. LVEF: 68%. Intact interatrial septum. No Patent Ductus Arteriosus (PDA).",
        "conclusion": "Small Restrictive Muscular Ventricular Septal Defect (VSD) with high-velocity left-to-right shunt. Excellent biventricular function.",
        "abnormal": True, "normal": False, "diagnosis": "Muscular VSD", "icd": "Q21.0"
    },
    {
        "findings": "Pediatric Echocardiogram. Normal biventricular size and systolic function (LVEF 65%). Intact IAS and IVS. Normal coronary arteries origins from left and right aortic sinuses. Normal cardiac valves morphology and color doppler flow. No pericardial effusion.",
        "conclusion": "Normal Pediatric Echocardiogram. Normal Cardiac Anatomy and Biventricular Systolic Function.",
        "abnormal": False, "normal": True, "diagnosis": "Normal Pediatric Study", "icd": "Z01.810"
    }
]

# Generate Visits & Scans
for patient in patients:
    p_id = patient["id"]
    p_display_id = patient["patient_id"]
    p_category = "Adult" if p_id <= 60 else ("Fetal" if p_id <= 80 else "Pediatric")
    
    # 1 to 2 visits per patient
    num_visits = 1 if random.random() > 0.3 else 2
    
    for v_idx in range(num_visits):
        v_days_ago = max(0, int(random.randint(0, 90) - (v_idx * 30)))
        visit_dt = base_date - timedelta(days=v_days_ago)
        visit_date_str = visit_dt.strftime("%Y-%m-%dT%H:%M:%S")
        
        v_type = "Consultation" if v_idx == 0 else "Follow-up"
        if p_category == "Fetal":
            v_type = "Routine Fetal Scan"
        elif p_category == "Pediatric" and v_idx == 0:
            v_type = "Initial Screening"
            
        doc = random.choice(referral_doctors)
        
        # Pick clinical finding based on category
        if p_category == "Adult":
            finding_item = random.choice(adult_findings_pool)
            scan_type_name = "Adult Echo"
        elif p_category == "Fetal":
            finding_item = random.choice(fetal_findings_pool)
            scan_type_name = "Fetal Echo"
        else:
            finding_item = random.choice(pediatric_findings_pool)
            scan_type_name = "Pediatric Echo"
            
        visit = {
            "id": visit_counter,
            "patient_id": p_id,
            "visit_date": visit_date_str,
            "visit_type": v_type,
            "doctor_id": doc["id"],
            "diagnosis": finding_item["diagnosis"],
            "notes": f"Clinical evaluation for {patient['first_name']} {patient['last_name']}. Referred by {doc['name']}.",
            "referral_doctor": doc["name"],
            "image_count": random.randint(6, 28),
            "avi": random.randint(1, 4),
            "pregnancy": 1 if p_category == "Fetal" else 0,
            "ob": "Normal Fetal Growth (NAD)" if p_category == "Fetal" else ""
        }
        visits.append(visit)
        
        # Scan for this visit
        scan_status = "Completed" if v_days_ago > 0 else random.choice(["Completed", "In Progress", "Pending"])
        
        scan = {
            "id": scan_counter,
            "patient_id": p_id,
            "patient_display_id": p_display_id,
            "visit_id": visit_counter,
            "scan_type": scan_type_name,
            "scan_date": visit_date_str,
            "findings": finding_item["findings"],
            "conclusion": finding_item["conclusion"],
            "status": scan_status,
            "abnormal": 1 if finding_item["abnormal"] else 0,
            "ambiguity": 0,
            "growthAbnormality": 0,
            "normal": 1 if finding_item["normal"] else 0,
            "normalVariant": 0,
            "indication": f"{finding_item['diagnosis']} evaluation",
            "diagnosis": finding_item["diagnosis"],
            "referralDoctor": doc["name"],
            "primaryConsultant": "Dr. Rajesh Varma (Chief Cardiologist)",
            "signedByLeft": "Dr. Rajesh Varma, MD, DM",
            "signedByRight": "Dr. Anita Desai, RDCS",
            "typedBy": "Sonocare Assistant",
            "reviewedBy": "Dr. Rajesh Varma",
            "icdCode": finding_item["icd"]
        }
        scans.append(scan)
        
        # Clinical Report for scan
        report = {
            "id": report_counter,
            "patient_id": p_id,
            "scan_id": scan_counter,
            "scan_type": scan_type_name,
            "report_title": f"Comprehensive {scan_type_name} Report",
            "findings": finding_item["findings"],
            "conclusion": finding_item["conclusion"],
            "status": "final" if scan_status == "Completed" else "draft",
            "created_at": visit_date_str
        }
        clinical_reports.append(report)
        
        visit_counter += 1
        scan_counter += 1
        report_counter += 1

# Report Templates
report_templates = [
    {
        "id": 1,
        "title": "Standard Adult Echo Report",
        "scan_type": "Adult Echo",
        "layout": "2-Grid Standard",
        "views": ["Parasternal Long Axis (PLAX)", "Parasternal Short Axis (PSAX)", "Apical 4 Chamber (A4C)", "Apical 2 Chamber (A2C)", "Subcostal 4 Chamber"]
    },
    {
        "id": 2,
        "title": "Comprehensive Fetal Echo Report",
        "scan_type": "Fetal Echo",
        "layout": "4-Grid Detailed",
        "views": ["Fetal 4-Chamber View", "Left Ventricular Outflow Tract (LVOT)", "Right Ventricular Outflow Tract (RVOT)", "3-Vessel Trachea View (3VT)", "Ductal & Aortic Arches"]
    },
    {
        "id": 3,
        "title": "Pediatric Congenital Echo Report",
        "scan_type": "Pediatric Echo",
        "layout": "2-Grid Summary",
        "views": ["Subcostal Long Axis", "Apical 4 Chamber", "High Parasternal Arch View", "Parasternal Short Axis Great Vessels"]
    }
]

# Default Settings
settings = {
    "id": 1,
    "company_name": "CardioEcho Advanced Cardiology & Diagnostic Centre",
    "short_name": "CardioEcho Diagnostics",
    "registration_no": "KA-MED-2024-88492",
    "tax_id": "29AAAAA0000A1Z5",
    "comments": "Leading Echocardiography & Cardiac Imaging Center",
    "inactive": 0,
    "street": "100 Feet Road, Indiranagar",
    "area": "Indiranagar",
    "area_po": "Indiranagar PO",
    "zip_code": "560038",
    "city": "Bangalore",
    "state": "Karnataka",
    "country": "India",
    "phone": "080-45678900",
    "mobile": "9845012345",
    "fax": "080-45678901",
    "email": "info@cardioecho.in",
    "id_mode": "Auto ID",
    "prefix": "PAT",
    "next_number": 101,
    "pad_length": 6,
    "auto_start": 1,
    "auto_backup": 1,
    "centre_name": "CardioEcho Cardiology & Imaging",
    "date_format": "DD/MM/YYYY",
    "font": "Inter",
    "font_size": "10",
    "report_type": "Structured Echo Report",
    "normal_comments": "Biventricular size and systolic function normal.",
    "imageConfig": {
        "source": "DICOM folder",
        "aeTitle": "ECHO_SCU",
        "host": "192.168.1.100",
        "port": 104,
        "rows": "2",
        "columns": "2",
        "aspectRatio": "Original",
        "autoImport": True,
        "anonymous": False
    }
}

# Sonographer & Medical Users
users = [
    {
        "id": 1,
        "first_name": "Rajesh",
        "last_name": "Varma",
        "middle_name": "V.",
        "initials": "RV",
        "user_name": "dr.varma",
        "password": "hashed_password_123",
        "designation": "Chief Consultant Cardiologist",
        "registration_no": "KMC-28491",
        "user_type": "Cardiologist",
        "mobile": "9845098765",
        "email": "r.varma@cardioecho.in",
        "inactive": 0,
        "set_default": 1,
        "signature": "Dr. Rajesh Varma, MD, DM Cardiology",
        "roles": "Admin, Cardiologist, Reporting",
        "rights": "FULL_ACCESS"
    },
    {
        "id": 2,
        "first_name": "Anita",
        "last_name": "Desai",
        "middle_name": "S.",
        "initials": "AD",
        "user_name": "anita.desai",
        "password": "hashed_password_456",
        "designation": "Senior Sonographer / RDCS",
        "registration_no": "RDCS-99120",
        "user_type": "Sonographer",
        "mobile": "9845112233",
        "email": "anita.desai@cardioecho.in",
        "inactive": 0,
        "set_default": 0,
        "signature": "Anita Desai, RDCS",
        "roles": "Sonographer, Acquisition",
        "rights": "ACQUISITION_AND_DRAFT"
    }
]

# Lookup & Custom Options
lookup_options = [
    {"id": 1, "category": "patient_salutation", "value": "Mr."},
    {"id": 2, "category": "patient_salutation", "value": "Mrs."},
    {"id": 3, "category": "patient_salutation", "value": "Ms."},
    {"id": 4, "category": "patient_salutation", "value": "Master"},
    {"id": 5, "category": "patient_salutation", "value": "Baby of"},
    {"id": 6, "category": "patient_salutation", "value": "Dr."},
    {"id": 7, "category": "patient_marital_status", "value": "Single"},
    {"id": 8, "category": "patient_marital_status", "value": "Married"},
    {"id": 9, "category": "patient_marital_status", "value": "Divorced"},
    {"id": 10, "category": "patient_marital_status", "value": "Widowed"},
    {"id": 11, "category": "scan_type", "value": "Adult Echo"},
    {"id": 12, "category": "scan_type", "value": "Fetal Echo"},
    {"id": 13, "category": "scan_type", "value": "Pediatric Echo"}
]

custom_options = [
    {"id": 1, "field": "indication", "value": "Hypertension Evaluation"},
    {"id": 2, "field": "indication", "value": "Exertional Dyspnea"},
    {"id": 3, "field": "indication", "value": "Routine Fetal Anomaly Screening"},
    {"id": 4, "field": "indication", "value": "Pediatric Cardiac Murmur Evaluation"},
    {"id": 5, "field": "indication", "value": "Pre-Operative Cardiac Clearance"}
]

# Assemble Master JSON database object
master_db = {
    "patients": patients,
    "visits": visits,
    "scans": scans,
    "referral_doctors": referral_doctors,
    "clinical_reports": clinical_reports,
    "report_templates": report_templates,
    "settings": settings,
    "users": users,
    "lookup_options": lookup_options,
    "custom_options": custom_options
}

# Write db.json
with open("db.json", "w", encoding="utf-8") as f:
    json.dump(master_db, f, indent=2, ensure_ascii=False)

print("Successfully generated 100 meaningful medical records into db.json:")
print(f"  - Patients: {len(patients)}")
print(f"  - Visits: {len(visits)}")
print(f"  - Echo Scans: {len(scans)}")
print(f"  - Referral Doctors: {len(referral_doctors)}")
print(f"  - Clinical Reports: {len(clinical_reports)}")
print(f"  - Report Templates: {len(report_templates)}")
print(f"  - Users: {len(users)}")
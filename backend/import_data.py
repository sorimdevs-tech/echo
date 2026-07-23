import json
import sqlite3
import os
from main import init_db, DB_PATH

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, 'db.json')

def import_data():
    print(f"Initializing SQLite database schema at {DB_PATH}...")
    init_db()
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    if not os.path.exists(JSON_PATH):
        print(f"Error: {JSON_PATH} not found!")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Table Mapping
    table_keys = {
        'patients': 'patients',
        'visits': 'visits',
        'scans': 'scans',
        'referral_doctors': 'referral_doctors',
        'clinical_reports': 'clinical_reports',
        'report_templates': 'report_templates',
        'users': 'users',
        'lookup_options': 'lookup_options',
        'custom_options': 'custom_options'
    }
    
    for key, table in table_keys.items():
        if key not in data:
            continue
            
        items = data[key]
        if not items:
            continue
            
        print(f"Importing {len(items)} records into '{table}'...")
        
        # Fetch columns for table
        c.execute(f"PRAGMA table_info({table})")
        columns = [col[1] for col in c.fetchall()]
        
        for item in items:
            try:
                # Handle JSON serialization for dict/list fields like imageConfig or views
                valid_data = {}
                for k, v in item.items():
                    if k in columns:
                        if isinstance(v, (dict, list)):
                            valid_data[k] = json.dumps(v)
                        else:
                            valid_data[k] = v
                            
                cols = ', '.join(valid_data.keys())
                placeholders = ', '.join(['?'] * len(valid_data))
                values = tuple(valid_data.values())
                
                c.execute(f'INSERT OR REPLACE INTO {table} ({cols}) VALUES ({placeholders})', values)
            except Exception as e:
                print(f"Error importing item {item.get('id', 'unknown')} into {table}: {e}")
                
    # Handle Settings separately if present as dict
    if 'settings' in data and data['settings']:
        print("Importing settings...")
        settings_item = data['settings']
        c.execute("PRAGMA table_info(settings)")
        columns = [col[1] for col in c.fetchall()]
        valid_data = {}
        for k, v in settings_item.items():
            if k in columns:
                if isinstance(v, (dict, list)):
                    valid_data[k] = json.dumps(v)
                else:
                    valid_data[k] = v
        cols = ', '.join(valid_data.keys())
        placeholders = ', '.join(['?'] * len(valid_data))
        values = tuple(valid_data.values())
        c.execute(f'INSERT OR REPLACE INTO settings ({cols}) VALUES ({placeholders})', values)

    conn.commit()
    conn.close()
    print("\nDatabase seeding completed successfully!")

if __name__ == '__main__':
    import_data()
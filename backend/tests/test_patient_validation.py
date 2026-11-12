import os
import tempfile
import unittest
from unittest.mock import patch
from fastapi import HTTPException
import main

class PatientValidationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = patch.object(main, 'DB_PATH', os.path.join(self.tmp.name, 'test.db'))
        self.db.start()
        main.init_db()

    def tearDown(self):
        self.db.stop()
        self.tmp.cleanup()

    def test_manual_id_and_birth_or_age_required(self):
        for data in ({'first_name': 'Test', 'age': 1}, {'patient_id': 'ABC', 'first_name': 'Test'}):
            with self.assertRaises(HTTPException) as error:
                main.create_patient(data)
            self.assertEqual(error.exception.status_code, 422)

    def test_duplicate_id_ignores_case_and_outer_whitespace(self):
        main.create_patient({'patient_id': 'ABC', 'first_name': 'Test', 'age': 0})
        with self.assertRaises(HTTPException) as error:
            main.create_patient({'patient_id': ' abc ', 'first_name': 'Test', 'age': 1})
        self.assertEqual(error.exception.status_code, 409)

    def test_future_birth_date_rejected(self):
        with self.assertRaises(HTTPException) as error:
            main.create_patient({'patient_id': 'ABC', 'first_name': 'Test', 'dob': '2999-01-01'})
        self.assertEqual(error.exception.status_code, 422)

    def test_identity_locked_but_contact_details_editable(self):
        patient = main.create_patient({'patient_id': 'LOCK', 'first_name': 'Test', 'age': 1})['data']
        with self.assertRaises(HTTPException) as error:
            main.update_patient(patient['id'], {'first_name': 'Changed'})
        self.assertEqual(error.exception.status_code, 409)
        updated = main.update_patient(patient['id'], {'mobile': '12345', 'street': 'New address'})['data']
        self.assertEqual(updated['first_name'], 'Test')
        self.assertEqual(updated['mobile'], '12345')
        self.assertEqual(updated['street'], 'New address')

if __name__ == '__main__':
    unittest.main()

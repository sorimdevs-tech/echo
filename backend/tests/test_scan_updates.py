import os
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

import main
from fastapi import HTTPException


class ScanUpdateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = os.path.join(self.temp.name, 'test.db')
        self.patch = patch.object(main, 'DB_PATH', self.path)
        self.patch.start()
        main.init_db()
        with sqlite3.connect(self.path) as conn:
            conn.execute("INSERT INTO scans (patient_id, scan_type, scan_date, referralDoctor, diagnosis, normal, findings) VALUES (1, 'Fetal Echo', '2026-01-01', 'Doctor A', 'Existing diagnosis', 1, '{}')")

    def tearDown(self):
        self.patch.stop()
        self.temp.cleanup()

    def test_report_save_preserves_unrelated_scan_fields(self):
        result = main.update_scan(1, {'status': 'In Progress', 'fetal_echo_report': {'impression': {'primary_consultant': 'Doctor B'}}})['data']
        self.assertEqual(result['referralDoctor'], 'Doctor A')
        self.assertEqual(result['diagnosis'], 'Existing diagnosis')
        self.assertEqual(result['scan_date'], '2026-01-01')
        self.assertEqual(result['normal'], 1)
        self.assertEqual(result['fetal_echo_report']['impression']['primary_consultant'], 'Doctor B')

    def test_missing_scan_returns_not_found(self):
        with self.assertRaises(HTTPException) as error:
            main.update_scan(999, {'status': 'In Progress'})
        self.assertEqual(error.exception.status_code, 404)

    def test_report_requires_primary_consultant_on_create_and_update(self):
        for report_key in ('adult_echo_report', 'pediatric_echo_report', 'fetal_echo_report'):
            for operation in (lambda data: main.create_scan(data), lambda data: main.update_scan(1, data)):
                with self.subTest(report_key=report_key, operation=operation):
                    with self.assertRaises(HTTPException) as error:
                        operation({report_key: {'impression': {'primary_consultant': '  '}}})
                    self.assertEqual(error.exception.status_code, 422)

    def test_clinical_workspace_data_is_saved_and_reloaded(self):
        payload = {'patient_id': 1, 'scan_type': 'Adult Echo', 'data': {'primaryConsultant': 'Doctor A', 'impression': 'Example'}}
        created = main.create_report(payload)['data']
        loaded = main.get_report(created['id'])['data']
        self.assertEqual(loaded['data'], payload['data'])
        with self.assertRaises(HTTPException):
            main.update_report(created['id'], {'data': {'primaryConsultant': ''}})


if __name__ == '__main__':
    unittest.main()

import asyncio
import io
import os
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from fastapi import HTTPException, UploadFile
import main


class MediaUploadTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = patch.object(main, 'DB_PATH', os.path.join(self.temp.name, 'test.db'))
        self.uploads = patch.object(main, 'UPLOADS_DIR', os.path.join(self.temp.name, 'uploads'))
        self.db.start()
        self.uploads.start()
        main.init_db()
        with sqlite3.connect(main.DB_PATH) as conn:
            conn.execute("INSERT INTO visits (patient_id, visit_date) VALUES (1, '2026-01-01')")

    def tearDown(self):
        self.uploads.stop()
        self.db.stop()
        self.temp.cleanup()

    def test_upload_links_file_to_patient_and_visit(self):
        upload = UploadFile(filename='../image.png', file=io.BytesIO(b'test image'))
        row = asyncio.run(main.upload_media(upload, '1', '1'))['data']
        self.assertEqual(row['name'], 'image.png')
        self.assertEqual((row['patient_id'], row['visit_id']), ('1', '1'))
        self.assertTrue(os.path.exists(os.path.join(main.UPLOADS_DIR, os.path.basename(row['url']))))
        with sqlite3.connect(main.DB_PATH) as conn:
            self.assertEqual(conn.execute('SELECT COUNT(*) FROM media_records').fetchone()[0], 1)

    def test_rejects_visit_of_another_patient(self):
        upload = UploadFile(filename='image.png', file=io.BytesIO(b'image'))
        with self.assertRaises(HTTPException) as error:
            asyncio.run(main.upload_media(upload, '2', '1'))
        self.assertEqual(error.exception.status_code, 400)

    def test_arbitrary_database_resource_is_rejected(self):
        with self.assertRaises(HTTPException) as error:
            main._normalize_table_name('scans')
        self.assertEqual(error.exception.status_code, 404)


if __name__ == '__main__':
    unittest.main()

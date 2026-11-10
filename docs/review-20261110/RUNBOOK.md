# Local review runbook

The application uses React/Vite and FastAPI with SQLite. Use the repository root containing both `frontend` and `backend`.

Backend: `python3 backend/main.py` (default `127.0.0.1:8002`). Frontend: from `frontend`, `npm run dev -- --host 127.0.0.1 --port 3000`.

Tests: from repository root, `python3 -m unittest discover -s backend -p 'test_*.py' -v`; from `frontend`, `npm run build && npm test`.

For an isolated browser fixture, run `python3 backend/browser_fixture.py`. It prints a random loopback URL and synthetic fixture credentials and writes ignored `browser-fixture-info.json`. Stop it with Ctrl-C. Never configure it with the clinical database. Unit/integration tests create their own empty temporary databases.

The complete synthetic fetal HTML sample is generated at `frontend/test-output/fetal-sample.html`. Open it for layout review. It contains no clinical diagnosis and is labelled not approved for clinical use. The generated HTML and screenshots are ignored test output; regenerate after changing the preview.

Runtime configuration includes `DB_PATH`, `UPLOADS_DIR`, `ECHOAI_USERS_PATH`, `ECHOAI_PASSWORD`, `HOST` and `PORT`. Configure deployment values explicitly. Local credentials and password hashes must remain outside version control and container images. A fresh installation generates local credentials when none are configured; never put those passwords in frontend source.

No calculation rules are shipped. `ECHOAI_CALCULATION_RULES` must remain unset until clinical definitions and independent cases are approved. Do not use synthetic test rules for patient reports.

Do not copy legacy database files into a fresh installation or deploy the review branch without a separate release/security/data review. Git history still requires a provenance review for previously tracked databases.

# Reporting workflow branch merge

The reporting-workflow-access-controls branch was reconciled with main on 2026-11-13.

Main already contains newer implementations of the overlapping registration, clinical reporting, authentication, approval, completed-report protection, correction and field-history changes. Those implementations are retained to avoid reverting newer functionality or enabling two competing authentication and report workflow systems.

The branch's access_control.py, report_workflow.py, Accounts.jsx, ReportWorkflow.jsx and tests coupled to those obsolete APIs are superseded by main's clinical_workflow.py, session_store.py, report controls and existing workflow/security tests. They are not installed alongside the current implementation. The clinician configuration checklist is retained as a supplementary worksheet; it does not replace the populated clinical section configuration or constitute clinical approval.

Local database changes, sessions, credentials and uploads are excluded from this merge.

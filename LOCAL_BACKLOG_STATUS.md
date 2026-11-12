# Local transcript backlog implementation — 9 November 2026

Update 10 November: see [the current code audit](docs/review-20261110/REVIEW.md), [requirement matrix](docs/review-20261110/IMPLEMENTATION_AUDIT.csv) and [clinical-input checklist](docs/review-20261110/CLINICAL_INPUTS.md). The active review working copy is `/Users/user/Downloads/echAI/echo` on `review/fetal-workflow-validation-20261110`; the older ZIP-copy path below is historical.

Working copy: `/Users/user/Downloads/echAI-3-setup/echAI/echo`.
Source: corrected transcript backlog produced in this chat. This file records code changes, not clinical approval or completion of every backlog record.

## Implemented in this local copy

- Registration: manual front-desk ID; required patient fields; DOB-or-age; duplicate ID rejection; India/state lists; referral doctor/institute or Self; registration creates no visits/scans. Contact edits preserve omitted data. (SRC-R007–R014; SRC-R016; SRC-R065.)
- Visit workflow: explicit Save & Go to Reporting; patient referral default and visit-level change; request retry key; selected examination routes to its correct editor; prior visit links reopen their existing report. Ultrasound can be recorded as a category, with no invented detailed template. (SRC-R018–R022; SRC-R058.)
- Report saves preserve omitted scan metadata and prevent moving a saved report between patients/visits/types. Fetal dating alternatives and positive fetus count are validated. Current report data is restored on reload. (SRC-R025; SRC-R028; SRC-R033; SRC-R035; SRC-R067.)
- Read-only standard titles; section-save feedback and bottom save action; save/validation guards on section navigation; access to patient history. (SRC-R024; SRC-R029; NEW-001; NEW-002.)
- Optional per-finding comments; literal Abnormal selections require a description. Not visualized does not trigger this rule. Further clinical option mapping awaits confirmation. (SRC-R036; SRC-R068.)
- Shared data-only preview/print: patient, title, indication, entered grouped clinical content, final impression, optional quality/footer comments and consultant names. Empty findings and internal audit comments are omitted. No fallback patient names, invented measurements or fixed normal ratio. (SRC-R031 framework; SRC-R045; SRC-R066; SRC-R069; SRC-R077; SRC-R080; NEW-003.)
- Removed current System Impression controls, duplicate signature-entry controls, growth classification controls and report-page image dimensions. Retained primary/optional secondary consultant fields; current print positioning awaits clinician approval. (SRC-R046; SRC-R052; SRC-R074; SRC-R075.)
- Real local authentication; cumulative L1/L2/L3 permissions enforced by server; L2 audit and L3 completion actions; authenticated operator/reviewer identities; completed report and owning visit deletion/edit protection. L3 can create workflow accounts in Administration. Generic writes cannot bypass clinical endpoints. (SRC-R047–R050.)
- Referral API mapping and extended contact values now round-trip, including institute records and second phone. Blank referral creation fails.
- Edit Patient only updates the patient record; no scan selection or visit/scan creation. Patient ID, first name, surname/initial, DOB and gender are locked in the interface and API for all roles, as confirmed by the user.
- MPI/PI and identified derived ratios are read-only. A shared approved-rule arithmetic framework recalculates on source edits and server saves. No clinical formulas are configured: results remain unavailable pending clinician-approved definitions. Historical manual values are retained separately and excluded from output.
- Dummy fetal output without Z-scores is available at `/test-output/fetal-sample.html` for layout review. It contains artificial values, no diagnosis, and no real patient data. (SRC-R063.)

## Verification performed

- Frontend production build.
- Backend integration tests against a temporary database: new-patient and repeat-visit lifecycle, ID/date validation, referral round-trip, request retries, correct scan type/patient/visit, report persistence, abnormal descriptions, L1/L2/L3 audit/completion, completed locks, generic-write bypass protection, adult/paediatric reports and ultrasound category.
- Server-rendered full dummy fetal preview assertions: patient/title/indication order; quality comments included; internal/system notes excluded; no fallback patient or fixed ratio; no Z-score calculation.
- Browser checked registration, Administration role controls, fetal profile screen, and dummy report output. Additional isolated dummy-data checks cover L1 restricted actions, L2 audit save/reload, L3 completion save/reload and read-only enforcement, and contact-only patient saving. This is targeted workflow coverage; exhaustive page-by-page UAT and physical printer testing are not claimed.
- Original patient, visit, scan and referral rows compared against pre-change backup: unchanged. Schema additions only in the live clinical database. Test-created records exist only in temporary databases that are cleaned up.

## Awaiting clinical/product input or separate work

- Post-registration identity correction workflow remains undefined; the five user-approved identity fields are currently locked for every role (SRC-R015).
- Field-specific clinical date/range rules; approved GA method for each dating source; no replacement formula has been invented (SRC-R027; SRC-R034).
- Final clinical headings, terminology, fields/order, Doppler grouping and adult/paediatric adaptations after fetal acceptance (SRC-R031; SRC-R042; SRC-R056; SRC-R057; SRC-R064; SRC-R070).
- Z-score formula/source/population/input/unit mappings, thresholds and manual/automatic switchover; Doppler equations and reference ranges (SRC-R040–R044; SRC-R071–R072). Source measurements remain editable; identified derived outputs are unavailable pending approved calculation definitions. The user confirmed that approved formulas are not available.
- Exact abnormal option mapping beyond literal Abnormal, header/disclaimer print/mandatory rules, registration identifiers, forced/default report classification and signature positioning (SRC-R068; SRC-R074; SRC-R076; SRC-R079).
- Exact Next/Back design, impression-only preview removal, final sign-off positioning, audit invalidation after edits, post-completion correction workflow and field-change logging (SRC-R030; SRC-R051; SRC-R078; NEW-005).
- Image/DICOM/measurement ingestion, multi-frame handling, vendor protocols, storage/retention and original image-interface design (SRC-R023; SRC-R053–R055; SRC-R081–R082; NEW-007; NEW-011). Existing image dialogs were not replaced with an unapproved integration.
- Clinician acceptance of the complete dummy output and final page-specific regression/UAT (SRC-R060–R064). No sample is certified for clinical use by this implementation.
- Meeting minutes/timeline, screenshot distribution, weekly reviews and showcase planning require actual coordination; no messages, meetings, deadlines or external updates were created (NEW-004; NEW-008–NEW-010).
- Future OPD, detailed ultrasound and diagnosis-template enhancements remain deferred. Merged items are covered once under their target tasks.

## Local operations

Frontend: `npm run dev` from `frontend`. Backend: `python3 backend/main.py` from project root.
Tests: `python3 -m unittest discover -s backend -p 'test_*.py' -v`; from frontend, `npm run build && npm test`.
Local credentials and workflow password hashes are ignored by Git. Existing configured founder credentials are reused; the old ZIP demo password is not an authentication backdoor.
Backups: `/Users/user/Downloads/echAI-3-setup/backups/pre-backlog-code-20261109.tar.gz` and `pre-backlog-data-20261109.db`.

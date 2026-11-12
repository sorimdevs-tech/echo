# Clinical inputs required

All calculation features remain **Pending Clinical Validation**. The arithmetic engine is infrastructure, not medical approval. No clinical equations or abnormal-value thresholds were activated in this review.

| Area | Existing inputs and outputs | Required clinical input |
|---|---|---|
| Gestational age | LMP, EDD, embryo-transfer date; manually entered GA weeks/days | Method for each dating source, reference date (visit/scan date), embryo age/stage for transfer, precedence when sources disagree, rounding, time-zone/date boundaries, independent expected examples. No method is assumed. |
| Fetal Z-scores | Manual Z-score fields under the aortic/valve/chamber sections remain editable; no automatic model | Per-measurement source paper/version, equation, anatomical measurement definition and timing, units/conversions, population and gestational-age limits, required covariates, treatment of missing inputs and independently calculated test cases. |
| MPI method 1 | RV/LV ICT, IRT and ET inputs; RV/LV MPI outputs | Exact method and acquisition convention, units, equation, denominator/invalid-input handling and independently checked cases for fetal and paediatric use. |
| MPI method 2 | RV/LV combined ICT+IRT+ET and ET inputs; MPI outputs | Approved method, units, acquisition convention, equation and independently checked cases. |
| Tissue Doppler | Annular/wall E, A, S and other existing time/velocity inputs; E/E and TDIMPI outputs | Exact source pairing, units, acquisition methods, output meaning and formula definitions for every site. |
| PI | IVC/DV venous velocity inputs, arterial/valve measurements, PI fields | Source input mapping, velocity/time definitions, units, per-vessel equation and expected results. Do not substitute a generic PI equation. |
| Other candidate derived values | CC/TC, SF/EF, areas, volumes, pressure gradients, ratios, RV FAC and PASP exist in various forms | Confirm which are measured/imported versus calculated; approve each source mapping and unit. The current read-only detection covers identified MPI/PI/E/A/E/E/TDIMPI fields, not every possible clinical calculation. |
| Reference ranges | No automatic abnormal threshold enabled | Per-field population, age/GA dependence, lower/upper ranges, inclusive boundaries, source/version and warning behaviour. The meeting's discussed Z-score threshold is not a globally configured rule. |
| Manual Z-score provenance | Manual values are retained and displayed as entered | Record source/reference and operator; approve manual/automatic switchover and override policy. Manual entry is not independently validated by the software. |

For every approved formula provide: output field path, input field paths, input/output units, reference and version, approving clinician, supported population/range, precision/rounding and independently verified examples (ordinary, missing, invalid and boundary inputs). Approval metadata in a configuration file alone is not clinical validation. Synthetic arithmetic tests prove only engine behaviour.

## Report content and approval decisions

- Supply the annotated fetal field list: additions/removals, clinical terminology, section order, units, and mandatory/optional status. Current grouping is retained provisionally; no unapproved anatomical sequence was invented.
- Supply common indication choices. Free text remains available.
- Later user-supplied meeting clarification confirms Header Comments, Final Impression, Disclaimer Comments and primary consultant are required for completion. Drafts may remain incomplete; footer and secondary consultant are optional. Exact clinical wording and final layout still require input. Internal auditor notes remain excluded from patient output.
- Confirm approved report titles, clinic/report registration identifiers, letterhead, primary/secondary consultant positioning and signature requirements.
- Confirm whether classification defaults to Normal or requires an explicit selection. New scans no longer silently assert Normal.
- Confirm whether editing an audited report invalidates its audit, and whether completion requires an earlier L2 audit. Current cumulative L3 authority is preserved; no new clinical policy was invented.
- Define authorised post-completion corrections, amendment history, access, reason capture and retention. Completed clinical reports remain locked; no unrestricted reopening was added.
- Review the complete dummy fetal sample before adapting final adult/paediatric clinical layouts. Software completion is not clinician sign-off.

## Images and scanner dependencies

Required: manufacturer/model/software version, vendor interface authorisation and documentation, export samples, transfer protocol, patient/visit identifiers and reconciliation rules, representative DICOM SOP classes/transfer syntaxes, multi-frame playback expectations, original-file preservation, storage destination/capacity, backup/recovery, access rules and approved retention requirements.

Local PNG/JPEG/WebP/PDF/MP4/WebM file storage is implemented. DICOM parsing, PACS transfer, scanner connectivity, automatic measurements, anonymisation, calibrated image measurement and retention compliance are not established. Conflicting retention statements in the transcript are not an approved retention policy.

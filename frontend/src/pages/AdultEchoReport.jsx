import EditableOptions from '../components/EditableOptions'
import { blankReport, mergeReport, reportSaveError } from '../reportValidation'
import { isDerivedPath, recalculateDerived, initializeDerived } from '../derivedMeasurements'
import { currentUser, useCompletionConfirmation, useDerivedDefinitions, ApprovalControls, ClinicalFooter, ClinicalPreview, reportErrors, useSavedNavigation } from '../components/ClinicalWorkflow'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Cog,
  FileImage,
  FileText,
  FolderOpen,
  Image,
  Italic,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  Underline,
  X,
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { referralDoctorService } from '../api/referralDoctorService'
import { scanService } from '../api/scanService'
import ImagesModal from '../components/ImagesModal'
import ReportConfigModal from '../components/ReportConfigModal'
import SearchableSelect from '../components/SearchableSelect'
import ExistingScansModal from '../components/ExistingScansModal'

const mainTabs = [
  { id: 'scan', label: 'Scan' },
  { id: 'impression', label: 'Impression' },
]

const scanTabs = [
  { id: 'echo-details', label: 'Echo details' },
  { id: 'two-d', label: '2D measurement' },
  { id: 'm-mode', label: 'M-mode measurement' },
  { id: 'doppler', label: 'Doppler measurement' },
  { id: 'pisa', label: 'Pisa measurement' },
]

const imageTabs = [
  { id: 'images', label: 'Images' },
  { id: 'multiframes', label: 'MultiFrames' },
]

const defaultFinalImpression = ''

const defaultReferralLetter = [
  'To,',
  '',
  'SELF',
  '',
  '',
  'Dear Doctor,',
  '',
  'Thank you for referring .',
  '',
  '',
  'Thanking you,',
  '',
  '',
  'Yours Sincerely,',
].join('\n')

const initialReport = {
  indication: '',
  tag: '',
  add_new_tag: false,
  print_options: {
    echo_details_custom_report: true,
  },
  echo_details: {
    situs: '',
    venous_connection: '',
    interatrial_septum: '',
    tricuspid_valve: '',
    tr: '',
    mitral_valve: '',
    mr: '',
    right_ventricle: '',
    left_ventricle: '',
    interventricular_septum: '',
    great_artery_relationship: '',
    aorta: '',
    ar: '',
    coronaries: '',
    pulmonary_valve: '',
    pr: '',
    mpa: '',
    branch_pa: '',
    aortic_arch_right: '',
    pda: '',
    pericardial_effusion: '',
    cardiac_position: '',
    atria: '',
    atrio_ventricular_connection: '',
    tricuspid_annulus: '',
    tricuspid_pg: '',
    mitral_annulus: '',
    ms: '',
    rv_contractility: '',
    lv_contractility: '',
    ventriculo_arterial_connection: '',
    aortic_valve: '',
    aortic_annulus: '',
    sinus: '',
    stj: '',
    ascending_aorta: '',
    as: '',
    pulmonary_annulus: '',
    rpa: '',
    lpa: '',
    aortic_arch_left: '',
    pleural_effusion: '',
    additional_comments_enabled: true,
    additional_comments: '',
  },
  two_d_measurement: {
    aorta: {
      ao_annulus_diam_d: '',
      ao_annulus_diam_s: '',
    },
    aortic_valve: {
      aov_area_cont_vti: '',
      aov_annulus_diam: '',
      lvot_diam_s: '',
      ar_jet_area: '',
      aov_area_cont_vmax: '',
      lvot_area: '',
      aov_area_planim: '',
    },
    mitral_valve: {
      mv_area_planim: '',
    },
    tricuspid_valve: {
      tv_area_planim: '',
    },
    pulmonary_valve: {
      rvot_diam_s: '',
      pv_annulus_diam: '',
    },
    left_ventricle: {
      a4c_lv_area_d: '',
      a4c_lv_area_s: '',
      a4c_lv_vol_d: '',
      a4c_lv_vol_s: '',
      a4c_lv_ef: '',
      a4c_lv_percent_fs_fac: '',
      a4c_lv_sv: '',
      a2c_lv_area_d: '',
      a2c_lv_area_s: '',
      a2c_lv_vol_d: '',
      a2c_lv_vol_s: '',
      a2c_lv_ef: '',
      a2c_lv_percent_fs_fac: '',
      a2c_lv_sv: '',
    },
  },
  m_mode_measurement: {
    ivc_diam: '',
    lv: {
      ivs_d: '',
      lvid_d: '',
      lvpw_d: '',
      ivs_s: '',
      lvid_s: '',
      lvpw_s: '',
      lv_vol_d: '',
      lv_vol_s: '',
      lv_ef: '',
      lv_sv: '',
      lv_percent_fs: '',
      lv_mass: '',
    },
    rv: {
      rvaw_d: '',
      rvd_d: '',
      rvaw_s: '',
      rvd_s: '',
      pe_diam: '',
    },
    ao_la: {
      aov_cusp_sep: '',
      ao_diam_s: '',
      ao_diam_d: '',
      la_diam_s: '',
      la_diam_d: '',
    },
    mitral_valve: {
      mv_epss: '',
      mv_de_excursion: '',
      mv_de_slope: '',
      mv_ef_slope: '',
      mapse: '',
    },
    tricuspid_valve: {
      tapse: '',
    },
  },
  doppler_measurement: {
    aortic_valve: {
      aov_vti: '',
      aov_vmax: '',
      aov_mean_grad: '',
      aov_peak_grad: '',
      lvot_vti: '',
      lvot_vmax: '',
      lvot_mean_grad: '',
      lvot_peak_grad: '',
      ar_dt: '',
      ar_slope: '',
      ar_vti: '',
      ar_vmax: '',
      lvot_sv: '',
      lvot_hr: '',
      lvot_co: '',
      ar_pht: '',
    },
    mitral_valve: {
      mv_e_vmax: '',
      mv_a_vmax: '',
      mv_dt: '',
      mv_decel_slope: '',
      mv_e_a: '',
      mv_area_pht: '',
      mv_area_vti: '',
      mv_pht: '',
      mv_vmax_tips: '',
      mv_mean_grad_tips: '',
      mv_peak_grad_tips: '',
    },
    mr_flow: {
      mr_vti: '',
      mr_vmax: '',
      mr_mean_grad: '',
      mr_peak_grad: '',
      mv_mean_grad_annulus: '',
      mv_peak_grad_annulus: '',
      lv_dp_dt: '',
    },
    tricuspid_valve: {
      tr_vmax: '',
      tr_vti: '',
      tv_e_vmax: '',
      tv_a_vmax: '',
      tv_dt: '',
      tv_vti: '',
      tv_vmax: '',
      tv_mean_grad: '',
      tr_peak_grad: '',
      tv_pht: '',
      tv_peak_grad: '',
    },
    pulmonary_valve: {
      pv_vti: '',
      pv_vmax: '',
      pv_mean_grad: '',
      pv_peak_grad: '',
      rvot_vti: '',
      rvot_vmax: '',
      rvot_mean_grad: '',
      rvot_peak_grad: '',
    },
  },
  pisa_measurement: {
    ar: {
      pisa_radius: '',
      aliasing_velocity: '',
      pisa: '',
      eroa: '',
      volume: '',
    },
    mr: {
      pisa_radius: '',
      aliasing_velocity: '',
      pisa: '',
      eroa: '',
      volume: '',
    },
    pr: {
      pisa_radius: '',
      aliasing_velocity: '',
      pisa: '',
      eroa: '',
      volume: '',
    },
    tr: {
      pisa_radius: '',
      aliasing_velocity: '',
      pisa: '',
      eroa: '',
      volume: '',
    },
  },
  impression: {
    report_title: 'Adult Echo Scan Report',
    first_line: '',
    header_comments: '',
    footer_comments: '',
    print_system_impression: true,
    system_impression_position: 'before',
    system_impression: '',
    final_impression: defaultFinalImpression,
    report_completed: false,
    disclaimer_comments: '',
    internal_comments: '',
    report_signed_by_l: '',
    report_signed_by_r: '',
    investigation_status: {
      abnormal: false,
      ambiguity: false,
      growth_abnormality: false,
    },
    primary_consultant: '',
    second_consultant: '',
    audited_by: '',
    reviewed_by: '',
    report_typed_by: '',
    equipment: '',
  },
  referral_letter: {
    letter_name: '',
    body: defaultReferralLetter,
    selected_doctor_ids: [],
    selected_institution_ids: [],
    letters: [],
  },
  images: {
    image_title: '',
    columns: '1',
    width: '600',
    height: '450',
    rows_cols: '4X2',
    notes: '',
  },
  preview_settings: {
    report_type: 'Report only',
    save_as: 'Pdf',
    alias_id: true,
    designation: true,
    print_footer_text: true,
    with_biometry_graphs: false,
  },
}

const deepClone = (value) => JSON.parse(JSON.stringify(value))

function setNestedValue(source, path, value) {
  const next = { ...source }
  let cursor = next

  path.slice(0, -1).forEach((key) => {
    cursor[key] = Array.isArray(cursor[key]) ? [...cursor[key]] : { ...cursor[key] }
    cursor = cursor[key]
  })

  cursor[path[path.length - 1]] = value
  return next
}

function getPatientName(patient) {
  if (!patient) return ''
  const name = [patient.salutation, patient.first_name, patient.last_name].filter(Boolean).join(' ')
  return name || patient.patient_id || ''
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB')
}

function doctorDisplayName(doctor) {
  return [doctor.salutation, doctor.first_name, doctor.last_name].filter(Boolean).join(' ')
    || doctor.hospital_name
    || doctor.institution_name
    || 'Referral doctor'
}

const adultNormalComments = {
  situs: 'Normal',
  venous_connection: 'Normal',
  interatrial_septum: 'Intact',
  tricuspid_valve: 'Normal',
  tr: 'None',
  mitral_valve: 'Normal',
  mr: 'None',
  right_ventricle: 'Normal',
  left_ventricle: 'Normal',
  interventricular_septum: 'Intact',
  great_artery_relationship: 'Normal',
  aorta: 'Normal',
  coronaries: 'Normal',
  pulmonary_valve: 'Normal',
  mpa: 'Normal',
  atria: 'Normal',
  atrio_ventricular_connection: 'Concordant',
  rv_contractility: 'Good',
  lv_contractility: 'Good',
}

function AdultEchoReport() {
  const navigate = useNavigate()
  const calculationRules = useDerivedDefinitions()
  const {confirmCompletion,completionDialog}=useCompletionConfirmation()
  const { scanId } = useParams()
  const [searchParams] = useSearchParams()
  const [patients, setPatients] = useState([])
  const [referralDoctors, setReferralDoctors] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '')
  const [selectedVisitId, setSelectedVisitId] = useState(searchParams.get('visitId') || '')
  const [activeMainTab, setActiveMainTab] = useState('scan')
  const [activeScanTab, setActiveScanTab] = useState('echo-details')
  const [activeImageTab, setActiveImageTab] = useState('images')
  const [report, setReport] = useState(() => initializeDerived(blankReport(initialReport), 'Adult Echo'))
  const [savedScanId, setSavedScanId] = useState(scanId || '')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [savedReportPath, setSavedReportPath] = useState('')
  const [locked, setLocked] = useState(false)
  const { dirty, navigationDialog, markSaved, navigateSection } = useSavedNavigation(report)
  useEffect(() => {
    if (savedReportPath && !dirty) {
      navigate(savedReportPath, { replace: true })
      setSavedReportPath('')
    }
  }, [savedReportPath, dirty, navigate])
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isImagesModalOpen, setIsImagesModalOpen] = useState(false)
  const [isExistingScansOpen, setIsExistingScansOpen] = useState(false)

  const selectedPatient = useMemo(
    () => patients.find((patient) => String(patient.id) === String(selectedPatientId)),
    [patients, selectedPatientId],
  )

  const isNormalCommentsPopulated = useMemo(() => {
    const echo = report.echo_details
    return Boolean(echo?.situs || echo?.mitral_valve || echo?.aortic_valve || echo?.right_ventricle)
  }, [report.echo_details])

  const toggleNormalComments = () => {
    if (locked) return
    if (isNormalCommentsPopulated) {
      setReport((current) => ({
        ...current,
        echo_details: {
          ...current.echo_details,
          situs: '',
          venous_connection: '',
          interatrial_septum: '',
          tricuspid_valve: '',
          tr: '',
          mitral_valve: '',
          mr: '',
          right_ventricle: '',
          left_ventricle: '',
          interventricular_septum: '',
          great_artery_relationship: '',
          aorta: '',
          coronaries: '',
          pulmonary_valve: '',
          mpa: '',
          atria: '',
          atrio_ventricular_connection: '',
          rv_contractility: '',
          lv_contractility: '',
        },
      }))
    } else {
      setReport((current) => ({
        ...current,
        echo_details: {
          ...current.echo_details,
          ...adultNormalComments,
        },
      }))
    }
  }

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [patientsResult, doctorsResult] = await Promise.all([
          patientService.getPatients(),
          referralDoctorService.getReferralDoctors().catch(() => ({ success: false, data: [] })),
        ])

        if (patientsResult.success) setPatients(patientsResult.data)
        if (doctorsResult.success) setReferralDoctors(doctorsResult.data)
      } catch (error) {
        console.error('Error loading adult echo reference data:', error)
      }
    }

    loadReferenceData()
  }, [])

  useEffect(() => {
    if (!scanId) return
    let active = true

    const fetchScan = async () => {
      try {
        const result = await scanService.getScan(scanId)
        if (!active || !result.success) return

        const scan = result.data
        setSelectedPatientId(scan.patient_id || selectedPatientId)
        setLocked(String(scan.status).toLowerCase() === 'completed')
        setSavedScanId(scan.id)
        setSelectedVisitId(scan.visit_id || '')
        const loadedReport = mergeReport(blankReport(initialReport), {
          ...(scan.adult_echo_report || {}),
          indication: scan.indication || scan.indicator || scan.adult_echo_report?.indication || '',
          tag: scan.tag || scan.adult_echo_report?.tag || '',
        })
        const normalized = recalculateDerived(loadedReport, calculationRules, 'Adult Echo')
        setReport(normalized)
        markSaved(normalized)
        if(searchParams.get('preview')==='1')setIsPreviewOpen(true)
      } catch (error) {
        if (!active) return
        console.error('Error loading adult echo scan:', error)
        setStatusMessage('Could not load this adult echo report.')
      }
    }

    fetchScan()
    return () => { active = false }
  }, [scanId])

  useEffect(() => {
    const fields = document.querySelectorAll('.report-editor-form input, .report-editor-form select, .report-editor-form textarea')
    for (const field of fields) field.disabled = locked || isSaving
    const wheel = e => { if (e.target instanceof HTMLInputElement && e.target.type === 'number' || e.target instanceof HTMLSelectElement) e.target.blur() }
    document.addEventListener('wheel', wheel, {passive:true})
    return () => document.removeEventListener('wheel', wheel)
  }, [locked, report, isSaving])
  useEffect(() => {
    if(calculationRules.length && !locked)setReport(current=>recalculateDerived(current,calculationRules,'Adult Echo'))
  }, [calculationRules, locked])
  const updateReport = (path, value) => {
    if (locked || isDerivedPath(path)) return
    setReport((current) => recalculateDerived(setNestedValue(current, path, value), calculationRules, 'Adult Echo'))
    setStatusMessage('')
  }

  const saveReport = async (reportToSave = report, successMessage = 'Adult echo report saved.') => {
    if (locked || isSaving) return false
    const errors = reportErrors(reportToSave, false, reportToSave.impression?.report_completed)
    if (errors.length) { setStatusMessage('Not saved. ' + errors.join(' ')); return false }
    if (reportToSave.impression?.report_completed && !(await confirmCompletion())) return false
    if (!selectedPatientId) {
      setStatusMessage('Select a patient before saving this adult echo report.')
      return false
    }
    if (!selectedVisitId) {
      setStatusMessage('Select or create a patient visit before saving this adult echo report.')
      return false
    }

    setIsSaving(true)
    setStatusMessage('')

    const payload = {
      scan_type: 'Adult Echo',
      patient_id: selectedPatientId,
      visit_id: selectedVisitId,
      report_title: reportToSave.impression.report_title,
      indicator: reportToSave.indication,
      tag: reportToSave.tag,
      status: reportToSave.impression.report_completed ? 'Completed' : 'In Progress',
      adult_echo_report: reportToSave,
    }

    try {
      const result = savedScanId
        ? await scanService.updateScan(savedScanId, payload)
        : await scanService.createScan(payload)

      if (result.success) {
        const nextScanId = result.data.id
        setSavedScanId(nextScanId)
        setReport(result.data.adult_echo_report || reportToSave)
        markSaved(result.data.adult_echo_report || reportToSave)
        setLocked(Boolean(reportToSave.impression?.report_completed))
        setStatusMessage(successMessage)

        if (!savedScanId) {
          const query = new URLSearchParams()
          query.set('patientId', selectedPatientId)
          if (selectedVisitId) query.set('visitId', selectedVisitId)
          setSavedReportPath(`/adult-echo-report/${nextScanId}?${query.toString()}`)
        }

        return true
      }
    } catch (error) {
      console.error('Error saving adult echo report:', error)
      setStatusMessage(reportSaveError(error))
    } finally {
      setIsSaving(false)
    }

    return false
  }

  const handleSave = () => {
    saveReport()
  }

  const step = activeMainTab === 'impression' ? scanTabs.length : scanTabs.findIndex(tab => tab.id === activeScanTab)
  const changeStep = index => {
    setActiveMainTab(index === scanTabs.length ? 'impression' : 'scan')
    if (index < scanTabs.length) setActiveScanTab(scanTabs[index].id)
  }
  const saveAndNext = async () => {
    const errors = reportErrors(report, false, false, true)
    if (errors.length) { setStatusMessage('Cannot advance. ' + errors.join(' ')); return }
    if (await saveReport()) changeStep(step + 1)
  }

  const handleDelete = async () => {
    if (locked) { setStatusMessage('Completed reports are read-only.'); return }
    if (!savedScanId) { setStatusMessage('No saved report to delete.'); return }
    if (!window.confirm('Delete this unfinished report? This cannot be undone.')) return
    try { await scanService.deleteScan(savedScanId); navigate('/visits?patient=' + selectedPatientId) }
    catch (error) { setStatusMessage(error.response?.data?.detail || 'The report was not deleted.') }
  }
  const handleClear = () => {
    if (locked) { setStatusMessage('Completed reports are read-only.'); return }
    setReport(initializeDerived(blankReport(initialReport), 'Adult Echo'))
    setStatusMessage('')
  }

  const handleSaveReferralLetter = async () => {
    if (locked || isSaving) return
    const letterName = report.referral_letter.letter_name.trim() || `Referral letter ${report.referral_letter.letters.length + 1}`
    const nextLetter = {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      letter_name: letterName,
      body: report.referral_letter.body,
      selected_doctor_ids: report.referral_letter.selected_doctor_ids,
      selected_institution_ids: report.referral_letter.selected_institution_ids,
    }
    const nextReport = setNestedValue(report, ['referral_letter', 'letters'], [
      nextLetter,
      ...report.referral_letter.letters,
    ])

    setReport(nextReport)
    await saveReport(nextReport, 'Referral letter saved with this adult echo report.')
  }

  return (
    <div className="report-editor-form min-h-0 flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 text-sm text-slate-900">
      <div className="flex min-h-full flex-col gap-3">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Adult Echo Report</p>
              <h2 className="text-xl font-semibold tracking-normal text-slate-950">
                {getPatientName(selectedPatient) || 'Select patient'}
                {selectedVisitId ? <span className="ml-2 text-sm font-medium text-slate-500">Visit #{selectedVisitId}</span> : null}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ToolbarButton icon={Save} label={isSaving ? 'Saving' : 'Save'} onClick={handleSave} />
              {currentUser().role === 'L3' && <ToolbarButton icon={Trash2} label="Delete" onClick={handleDelete} />}
              <ToolbarButton icon={RotateCcw} label="Clear" onClick={handleClear} />
              <ToolbarButton icon={Printer} label="Preview" onClick={() => setIsPreviewOpen(true)} />
              <ToolbarButton icon={FileImage} label="Images" onClick={() => setIsImagesModalOpen(true)} />
              <ToolbarButton icon={X} label="Close" onClick={() => navigate('/search')} />
            </div>
          </div>

          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_minmax(240px,1fr)_minmax(180px,0.55fr)_auto]">
            <div className="field-label">
              <span>Patient</span>
              <SearchableSelect
                options={patients.map((p) => ({
                  value: p.id,
                  label: `${p.patient_id || ''} — ${getPatientName(p)}`.trim(),
                }))}
                value={selectedPatientId}
                disabled={Boolean(scanId || savedScanId || selectedVisitId) || isSaving}
                onChange={(val) => setSelectedPatientId(val)}
                placeholder="Select patient"
                searchPlaceholder="Search patient ID or name..."
              />
            </div>

            <HeaderField
              label="Indication(s)"
              value={report.indication}
              onChange={(value) => updateReport(['indication'], value)}
            />
            <HeaderField
              label="Tag"
              value={report.tag}
              onChange={(value) => updateReport(['tag'], value)}
            />
            <label className="flex items-end gap-2 pb-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={report.add_new_tag}
                onChange={(event) => updateReport(['add_new_tag'], event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Add New
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExistingScansOpen(true)}
                className="legacy-small-button"
              >
                <FolderOpen className="mr-1.5 h-4 w-4 text-teal-600" />
                Open existing scans
              </button>
              <button type="button" onClick={() => setActiveMainTab('referral-letter')} className="legacy-small-button">
                <FileText className="mr-2 h-4 w-4" />
                Ref. Letter
              </button>
            </div>

            {statusMessage && <span className="font-semibold text-blue-800">{statusMessage}</span>}
          </div>

          <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">Options to print</div>
            <label className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
              <input
                type="checkbox"
                checked={report.print_options.echo_details_custom_report}
                onChange={(event) => updateReport(['print_options', 'echo_details_custom_report'], event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Echo details custom report
            </label>
          </div>
        </section>

        {activeMainTab === 'referral-letter' ? (
          <ReferralLetterPanel
            report={report}
            updateReport={updateReport}
            referralDoctors={referralDoctors}
            onSave={handleSaveReferralLetter}
            onPreview={() => setIsPreviewOpen(true)}
            onClose={() => setActiveMainTab('scan')}
          />
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 px-3 pt-3">
                {mainTabs.map((tab) => (
                  <TabButton key={tab.id} active={activeMainTab === tab.id} onClick={() => navigateSection(() => setActiveMainTab(tab.id), setStatusMessage, locked ? [] : reportErrors(report, false, false, true))}>
                    {tab.label}
                  </TabButton>
                ))}
              </div>

              <div className="min-h-0 overflow-auto p-4">
                {activeMainTab === 'scan' ? (
                  <ScanPanel
                    activeScanTab={activeScanTab}
                    setActiveScanTab={(tab) => navigateSection(() => setActiveScanTab(tab), setStatusMessage, locked ? [] : reportErrors(report, false, false, true))}
                    report={report}
                    updateReport={updateReport}
                    onToggleNormalComments={toggleNormalComments}
                    isNormalCommentsPopulated={isNormalCommentsPopulated}
                  />
                ) : (
                  <ImpressionPanel report={report} updateReport={updateReport} scanId={savedScanId || scanId} locked={locked} />
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {isPreviewOpen && (
        <ClinicalPreview title="Adult Echocardiography"           report={report}
          status={dirty ? 'Unsaved changes' : locked ? 'Completed' : 'Draft / In Progress'}
          updateReport={updateReport}
          patient={selectedPatient}
          visitId={selectedVisitId}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
      <ImagesModal
        open={isImagesModalOpen}
        visitId={selectedVisitId}
        onClose={() => setIsImagesModalOpen(false)}
        patient={selectedPatient}
      />
      <ExistingScansModal
        isOpen={isExistingScansOpen}
        onClose={() => setIsExistingScansOpen(false)}
        patientId={selectedPatientId}
        patient={selectedPatient}
        currentScanId={savedScanId || scanId}
      />
      {completionDialog}{navigationDialog}
      <ClinicalFooter onSave={handleSave} saving={isSaving} locked={locked} message={locked ? 'Completed report — read-only.' : statusMessage} patientId={selectedPatientId} onBack={step > 0 ? () => navigateSection(() => changeStep(step - 1), setStatusMessage) : undefined} onNext={step >= 0 && step < scanTabs.length ? saveAndNext : undefined} />
    </div>
  )
}

function ScanPanel({ activeScanTab, setActiveScanTab, report, updateReport, onToggleNormalComments, isNormalCommentsPopulated }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {scanTabs.map((tab) => (
          <TabButton key={tab.id} active={activeScanTab === tab.id} onClick={() => setActiveScanTab(tab.id)}>
            {tab.label}
          </TabButton>
        ))}
      </div>
      {activeScanTab === 'echo-details' && (
        <EchoDetailsTab
          report={report}
          updateReport={updateReport}
          onToggleNormalComments={onToggleNormalComments}
          isNormalCommentsPopulated={isNormalCommentsPopulated}
        />
      )}
      {activeScanTab === 'two-d' && <TwoDMeasurementTab report={report} updateReport={updateReport} />}
      {activeScanTab === 'm-mode' && <MModeMeasurementTab report={report} updateReport={updateReport} />}
      {activeScanTab === 'doppler' && <DopplerMeasurementTab report={report} updateReport={updateReport} />}
      {activeScanTab === 'pisa' && <PisaMeasurementTab report={report} updateReport={updateReport} />}
    </div>
  )
}

function EchoDetailsTab({ report, updateReport, onToggleNormalComments, isNormalCommentsPopulated }) {
  const leftRows = [
    ['Situs', 'situs'],
    ['Venous connection', 'venous_connection'],
    ['Interatrial septum', 'interatrial_septum'],
    ['Tricuspid valve', 'tricuspid_valve'],
    ['TR', 'tr'],
    ['Mitral valve', 'mitral_valve'],
    ['MR', 'mr'],
    ['Right ventricle', 'right_ventricle'],
    ['Left ventricle', 'left_ventricle'],
    ['Interventricular septum', 'interventricular_septum'],
    ['Great artery relationship', 'great_artery_relationship'],
    ['Aorta', 'aorta'],
    ['AR', 'ar'],
    ['Coronaries', 'coronaries'],
    ['Pulmonary valve', 'pulmonary_valve'],
    ['PR', 'pr'],
    ['MPA', 'mpa'],
    ['Branch PA', 'branch_pa'],
    ['Aortic arch right', 'aortic_arch_right'],
    ['PDA', 'pda'],
    ['Pericardial effusion', 'pericardial_effusion'],
  ]
  const rightRows = [
    ['Cardiac position', 'cardiac_position'],
    ['Atria', 'atria'],
    ['Atrio-ventricular connection', 'atrio_ventricular_connection'],
    ['MS', 'ms'],
    ['RV contractility', 'rv_contractility'],
    ['LV contractility', 'lv_contractility'],
    ['Ventriculo-arterial connection', 'ventriculo_arterial_connection'],
    ['Aortic valve', 'aortic_valve'],
    ['AS', 'as'],
    ['Aortic arch left', 'aortic_arch_left'],
    ['Pleural effusion', 'pleural_effusion'],
  ]

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        <Fieldset title="Adult Echo details">
          <div className="grid gap-5 2xl:grid-cols-2">
            <div className="space-y-3">
              {leftRows.map(([label, key]) => (
                <ComboField
                  key={key}
                  label={label}
                  value={report.echo_details[key]}
                  onChange={(value) => updateReport(['echo_details', key], value)}
                  withPlus
                />
              ))}
            </div>

            <div className="space-y-3">
              {rightRows.map(([label, key]) => (
                <ComboField
                  key={key}
                  label={label}
                  value={report.echo_details[key]}
                  onChange={(value) => updateReport(['echo_details', key], value)}
                  withPlus
                />
              ))}
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                <MeasurementField label="TV Annulus" value={report.echo_details.tricuspid_annulus} suffix="(cm)" onChange={(value) => updateReport(['echo_details', 'tricuspid_annulus'], value)} compact />
                <MeasurementField label="PG" value={report.echo_details.tricuspid_pg} suffix="(mmHg)" onChange={(value) => updateReport(['echo_details', 'tricuspid_pg'], value)} compact />
                <MeasurementField label="MV Annulus" value={report.echo_details.mitral_annulus} suffix="(cm)" onChange={(value) => updateReport(['echo_details', 'mitral_annulus'], value)} compact />
                <MeasurementField label="PV Annulus" value={report.echo_details.pulmonary_annulus} suffix="(cm)" onChange={(value) => updateReport(['echo_details', 'pulmonary_annulus'], value)} compact />
                <MeasurementField label="RPA" value={report.echo_details.rpa} suffix="(cm)" onChange={(value) => updateReport(['echo_details', 'rpa'], value)} compact />
                <MeasurementField label="LPA" value={report.echo_details.lpa} suffix="(cm)" onChange={(value) => updateReport(['echo_details', 'lpa'], value)} compact />
              </div>
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-4">
                <MeasurementField label="Annulus" value={report.echo_details.aortic_annulus} suffix="(cm)" onChange={(value) => updateReport(['echo_details', 'aortic_annulus'], value)} compact />
                <MeasurementField label="Sinus" value={report.echo_details.sinus} suffix="(cm)" onChange={(value) => updateReport(['echo_details', 'sinus'], value)} compact />
                <MeasurementField label="STJ" value={report.echo_details.stj} suffix="(cm)" onChange={(value) => updateReport(['echo_details', 'stj'], value)} compact />
                <MeasurementField label="asc Ao" value={report.echo_details.ascending_aorta} suffix="(cm)" onChange={(value) => updateReport(['echo_details', 'ascending_aorta'], value)} compact />
              </div>
            </div>
          </div>
        </Fieldset>
      </div>

      <aside className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <button
          type="button"
          onClick={onToggleNormalComments}
          className="legacy-small-button mb-4"
        >
          {isNormalCommentsPopulated ? 'Clear all comments' : 'Scatter normal comments'}
        </button>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={report.echo_details.additional_comments_enabled}
            onChange={(event) => updateReport(['echo_details', 'additional_comments_enabled'], event.target.checked)}
          />
          Additional comments
        </label>
        <textarea
          className="h-80 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          value={report.echo_details.additional_comments}
          onChange={(event) => updateReport(['echo_details', 'additional_comments'], event.target.value)}
        />
      </aside>
    </div>
  )
}

function TwoDMeasurementTab({ report, updateReport }) {
  return (
    <div className="space-y-4">
      <Fieldset title="Valve and aorta measurements">
        <div className="grid gap-6 xl:grid-cols-3">
          <MeasurementGroup
            title="Aorta"
            rows={[
              ['Ao Annulus Diam d', ['two_d_measurement', 'aorta', 'ao_annulus_diam_d']],
              ['Ao Annulus Diam s', ['two_d_measurement', 'aorta', 'ao_annulus_diam_s']],
            ]}
            report={report}
            updateReport={updateReport}
          />
          <MeasurementGroup
            title="Aortic valve"
            rows={[
              ['AoV Area Cont. VTI', ['two_d_measurement', 'aortic_valve', 'aov_area_cont_vti']],
              ['AoV Annulus Diam', ['two_d_measurement', 'aortic_valve', 'aov_annulus_diam']],
              ['LVOT Diam s', ['two_d_measurement', 'aortic_valve', 'lvot_diam_s']],
              ['AR Jet Area', ['two_d_measurement', 'aortic_valve', 'ar_jet_area']],
              ['AoV Area Cont. Vmax', ['two_d_measurement', 'aortic_valve', 'aov_area_cont_vmax']],
              ['LVOT Area', ['two_d_measurement', 'aortic_valve', 'lvot_area']],
              ['AoV Area Planim', ['two_d_measurement', 'aortic_valve', 'aov_area_planim']],
            ]}
            report={report}
            updateReport={updateReport}
          />
          <div className="grid gap-5">
            <MeasurementGroup
              title="Mitral valve"
              rows={[['MV Area Planim', ['two_d_measurement', 'mitral_valve', 'mv_area_planim']]]}
              report={report}
              updateReport={updateReport}
            />
            <MeasurementGroup
              title="Tricuspid valve"
              rows={[['TV Area Planim', ['two_d_measurement', 'tricuspid_valve', 'tv_area_planim']]]}
              report={report}
              updateReport={updateReport}
            />
            <MeasurementGroup
              title="Pulmonary valve"
              rows={[
                ['RVOT Diam s', ['two_d_measurement', 'pulmonary_valve', 'rvot_diam_s']],
                ['PV Annulus Diam', ['two_d_measurement', 'pulmonary_valve', 'pv_annulus_diam']],
              ]}
              report={report}
              updateReport={updateReport}
            />
          </div>
        </div>
      </Fieldset>

      <Fieldset title="Left ventricle">
        <div className="grid gap-6 xl:grid-cols-2">
          <MeasurementGroup
            title="A4C volume"
            rows={[
              ['LV Area d A4C', ['two_d_measurement', 'left_ventricle', 'a4c_lv_area_d']],
              ['LV Area s A4C', ['two_d_measurement', 'left_ventricle', 'a4c_lv_area_s']],
              ['LV Vol d A4C', ['two_d_measurement', 'left_ventricle', 'a4c_lv_vol_d']],
              ['LV Vol s A4C', ['two_d_measurement', 'left_ventricle', 'a4c_lv_vol_s']],
              ['LV EF', ['two_d_measurement', 'left_ventricle', 'a4c_lv_ef']],
              ['LV %FS (FAC)', ['two_d_measurement', 'left_ventricle', 'a4c_lv_percent_fs_fac']],
              ['LV SV', ['two_d_measurement', 'left_ventricle', 'a4c_lv_sv']],
            ]}
            report={report}
            updateReport={updateReport}
          />
          <MeasurementGroup
            title="A2C volume"
            rows={[
              ['LV Area d A2C', ['two_d_measurement', 'left_ventricle', 'a2c_lv_area_d']],
              ['LV Area s A2C', ['two_d_measurement', 'left_ventricle', 'a2c_lv_area_s']],
              ['LV Vol d A2C', ['two_d_measurement', 'left_ventricle', 'a2c_lv_vol_d']],
              ['LV Vol s A2C', ['two_d_measurement', 'left_ventricle', 'a2c_lv_vol_s']],
              ['LV EF', ['two_d_measurement', 'left_ventricle', 'a2c_lv_ef']],
              ['LV %FS (FAC)', ['two_d_measurement', 'left_ventricle', 'a2c_lv_percent_fs_fac']],
              ['LV SV', ['two_d_measurement', 'left_ventricle', 'a2c_lv_sv']],
            ]}
            report={report}
            updateReport={updateReport}
          />
        </div>
      </Fieldset>
    </div>
  )
}

function MModeMeasurementTab({ report, updateReport }) {
  return (
    <div className="space-y-4">
      <Fieldset title="M-mode measurements">
        <div className="mb-4 max-w-sm">
          <MeasurementField label="IVC Diam" value={report.m_mode_measurement.ivc_diam} onChange={(value) => updateReport(['m_mode_measurement', 'ivc_diam'], value)} />
        </div>
        <div className="grid gap-6 xl:grid-cols-4">
          <MeasurementGroup
            title="LV"
            rows={[
              ['IVS d', ['m_mode_measurement', 'lv', 'ivs_d']],
              ['LVID d', ['m_mode_measurement', 'lv', 'lvid_d']],
              ['LVPW d', ['m_mode_measurement', 'lv', 'lvpw_d']],
              ['IVS s', ['m_mode_measurement', 'lv', 'ivs_s']],
              ['LVID s', ['m_mode_measurement', 'lv', 'lvid_s']],
              ['LVPW s', ['m_mode_measurement', 'lv', 'lvpw_s']],
              ['LV Vol d', ['m_mode_measurement', 'lv', 'lv_vol_d']],
              ['LV Vol s', ['m_mode_measurement', 'lv', 'lv_vol_s']],
              ['LV EF', ['m_mode_measurement', 'lv', 'lv_ef']],
              ['LV SV', ['m_mode_measurement', 'lv', 'lv_sv']],
              ['LV %FS', ['m_mode_measurement', 'lv', 'lv_percent_fs']],
              ['LV Mass', ['m_mode_measurement', 'lv', 'lv_mass']],
            ]}
            report={report}
            updateReport={updateReport}
          />
          <MeasurementGroup
            title="RV"
            rows={[
              ['RVAW d', ['m_mode_measurement', 'rv', 'rvaw_d']],
              ['RVD d', ['m_mode_measurement', 'rv', 'rvd_d']],
              ['RVAW s', ['m_mode_measurement', 'rv', 'rvaw_s']],
              ['RVD s', ['m_mode_measurement', 'rv', 'rvd_s']],
              ['PE Diam', ['m_mode_measurement', 'rv', 'pe_diam']],
            ]}
            report={report}
            updateReport={updateReport}
          />
          <MeasurementGroup
            title="AO/LA"
            rows={[
              ['AoV Cusp Sep', ['m_mode_measurement', 'ao_la', 'aov_cusp_sep']],
              ['Ao Diam s', ['m_mode_measurement', 'ao_la', 'ao_diam_s']],
              ['Ao Diam d', ['m_mode_measurement', 'ao_la', 'ao_diam_d']],
              ['LA Diam s', ['m_mode_measurement', 'ao_la', 'la_diam_s']],
              ['LA Diam d', ['m_mode_measurement', 'ao_la', 'la_diam_d']],
            ]}
            report={report}
            updateReport={updateReport}
          />
          <div className="space-y-5">
            <MeasurementGroup
              title="Mitral valve"
              rows={[
                ['MV EPSS', ['m_mode_measurement', 'mitral_valve', 'mv_epss']],
                ['MV DE Excursion', ['m_mode_measurement', 'mitral_valve', 'mv_de_excursion']],
                ['MV DE Slope', ['m_mode_measurement', 'mitral_valve', 'mv_de_slope']],
                ['MV EF Slope', ['m_mode_measurement', 'mitral_valve', 'mv_ef_slope']],
                ['MAPSE', ['m_mode_measurement', 'mitral_valve', 'mapse']],
              ]}
              report={report}
              updateReport={updateReport}
            />
            <MeasurementGroup
              title="Tricuspid valve"
              rows={[['TAPSE', ['m_mode_measurement', 'tricuspid_valve', 'tapse']]]}
              report={report}
              updateReport={updateReport}
            />
          </div>
        </div>
      </Fieldset>
    </div>
  )
}

function DopplerMeasurementTab({ report, updateReport }) {
  return (
    <div className="max-h-[calc(100vh-340px)] overflow-auto pr-2">
      <div className="space-y-4">
        <DopplerSection
          title="Aortic valve doppler measurements"
          path={['doppler_measurement', 'aortic_valve']}
          rows={[
            ['AoV VTI', 'aov_vti'], ['AoV Vmax', 'aov_vmax'], ['AoV Mean Grad', 'aov_mean_grad'], ['AoV Peak Grad', 'aov_peak_grad'],
            ['LVOT VTI', 'lvot_vti'], ['LVOT Vmax', 'lvot_vmax'], ['LVOT Mean Grad', 'lvot_mean_grad'], ['LVOT Peak Grad', 'lvot_peak_grad'],
            ['AR DT', 'ar_dt'], ['AR Slope', 'ar_slope'], ['AR VTI', 'ar_vti'], ['AR Vmax', 'ar_vmax'],
            ['LVOT SV', 'lvot_sv'], ['LVOT HR', 'lvot_hr'], ['LVOT CO', 'lvot_co'], ['AR PHT', 'ar_pht'],
          ]}
          report={report}
          updateReport={updateReport}
        />
        <DopplerSection
          title="Mitral valve doppler measurements"
          path={['doppler_measurement', 'mitral_valve']}
          rows={[
            ['MV E Vmax', 'mv_e_vmax'], ['MV A Vmax', 'mv_a_vmax'], ['MV DT', 'mv_dt'], ['MV Decel Slope', 'mv_decel_slope'],
            ['MV E/A', 'mv_e_a'], ['MV Area PHT', 'mv_area_pht'], ['MV Area VTI', 'mv_area_vti'], ['MV PHT', 'mv_pht'],
            ['MV Vmax Tips', 'mv_vmax_tips'], ['MV Mean Grad Tips', 'mv_mean_grad_tips'], ['MV Peak Grad Tips', 'mv_peak_grad_tips'],
          ]}
          report={report}
          updateReport={updateReport}
        />
        <DopplerSection
          title="MR Flow"
          path={['doppler_measurement', 'mr_flow']}
          rows={[
            ['MR VTI', 'mr_vti'], ['MR Vmax', 'mr_vmax'], ['MR Mean Grad', 'mr_mean_grad'], ['MR Peak Grad', 'mr_peak_grad'],
            ['MV Mean Grad Annulus', 'mv_mean_grad_annulus'], ['MV Peak Grad Annulus', 'mv_peak_grad_annulus'], ['LV dp/dt', 'lv_dp_dt'],
          ]}
          report={report}
          updateReport={updateReport}
        />
        <DopplerSection
          title="Tricuspid valve doppler measurements"
          path={['doppler_measurement', 'tricuspid_valve']}
          rows={[
            ['TR Vmax', 'tr_vmax'], ['TR VTI', 'tr_vti'], ['TV E Vmax', 'tv_e_vmax'], ['TV A Vmax', 'tv_a_vmax'],
            ['TV DT', 'tv_dt'], ['TV VTI', 'tv_vti'], ['TV Vmax', 'tv_vmax'], ['TV Mean Grad', 'tv_mean_grad'],
            ['TR Peak Grad', 'tr_peak_grad'], ['TV PHT', 'tv_pht'], ['TV Peak Grad', 'tv_peak_grad'],
          ]}
          report={report}
          updateReport={updateReport}
        />
        <DopplerSection
          title="Pulmonary valve doppler measurements"
          path={['doppler_measurement', 'pulmonary_valve']}
          rows={[
            ['PV VTI', 'pv_vti'], ['PV Vmax', 'pv_vmax'], ['PV Mean Grad', 'pv_mean_grad'], ['PV Peak Grad', 'pv_peak_grad'],
            ['RVOT VTI', 'rvot_vti'], ['RVOT Vmax', 'rvot_vmax'], ['RVOT Mean Grad', 'rvot_mean_grad'], ['RVOT Peak Grad', 'rvot_peak_grad'],
          ]}
          report={report}
          updateReport={updateReport}
        />
      </div>
    </div>
  )
}

function PisaMeasurementTab({ report, updateReport }) {
  const groups = [
    ['AR PISA', 'ar'],
    ['MR PISA', 'mr'],
    ['PR PISA', 'pr'],
    ['TR PISA', 'tr'],
  ]

  return (
    <Fieldset title="PISA measurement">
      <div className="grid gap-6 xl:grid-cols-4">
        {groups.map(([title, key]) => (
          <MeasurementGroup
            key={key}
            title={title}
            rows={[
              [`${key.toUpperCase()} PISA Radius`, ['pisa_measurement', key, 'pisa_radius']],
              [`${key.toUpperCase()} Aliasing Velocity`, ['pisa_measurement', key, 'aliasing_velocity']],
              [`${key.toUpperCase()} PISA`, ['pisa_measurement', key, 'pisa']],
              [`${key.toUpperCase()} EROA`, ['pisa_measurement', key, 'eroa']],
              [`${key.toUpperCase()} Volume`, ['pisa_measurement', key, 'volume']],
            ]}
            report={report}
            updateReport={updateReport}
          />
        ))}
      </div>
    </Fieldset>
  )
}

function ImpressionPanel({ report, updateReport, scanId, locked }) {
  const impression = report.impression

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-3"><ApprovalControls report={report} updateReport={updateReport} scanId={scanId} locked={locked} />
        <label className="field-label">Report title<input className="field-control" readOnly value="Adult Echocardiography" /></label>
        <TextInput label="First line of report" value={impression.first_line} onChange={(value) => updateReport(['impression', 'first_line'], value)} />
        <TextArea label="Header comments - (F11 - Show previous header comments)" value={impression.header_comments} onChange={(value) => updateReport(['impression', 'header_comments'], value)} rows={3} />
        <TextArea label="Footer comments - (F11 - Show previous footer comments)" value={impression.footer_comments} onChange={(value) => updateReport(['impression', 'footer_comments'], value)} rows={3} />
        <div className="flex items-center justify-between">
          <span>Final impression-(F11-Show previous)</span>

        </div>
        <textarea aria-label="Final impression" className="h-32 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm font-semibold uppercase text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={impression.final_impression} onChange={(event) => updateReport(['impression', 'final_impression'], event.target.value)} />
        <TextArea label="Disclaimer comments - (F11 - Show previous disclaimer comments)" value={impression.disclaimer_comments} onChange={(value) => updateReport(['impression', 'disclaimer_comments'], value)} rows={3} />
        <TextArea label="Internal Comments (Will not be printed) - (F11 - Show previous internal comments)" value={impression.internal_comments} onChange={(value) => updateReport(['impression', 'internal_comments'], value)} rows={3} />
      </div>

      <aside className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="field-label">Report type<select className="field-control" value={impression.classification || ''} onChange={e => updateReport(['impression','classification'], e.target.value)}><option value="">Select report type</option>{['Normal','Abnormal','Ambiguous'].map(v => <option key={v}>{v}</option>)}</select></label>
        <TextInput label="Primary consultant" value={impression.primary_consultant} onChange={(value) => updateReport(['impression', 'primary_consultant'], value)} />
        <TextArea label="Secondary consultant" value={impression.second_consultant} onChange={(value) => updateReport(['impression', 'second_consultant'], value)} rows={3} />
        <label className="field-label">Audited by<input className="field-control" readOnly value={impression.audited_by || ''} /></label>
        <TextArea label="Reviewed by" value={impression.reviewed_by} onChange={(value) => updateReport(['impression', 'reviewed_by'], value)} rows={3} />
        <label className="field-label">Report typed by<input className="field-control" readOnly value={impression.report_typed_by || ''} /></label>
        <TextArea label="Equipment" value={impression.equipment} onChange={(value) => updateReport(['impression', 'equipment'], value)} rows={6} />
      </aside>
    </div>
  )
}

function ReferralLetterPanel({ report, updateReport, referralDoctors, onSave, onPreview, onClose }) {
  const doctors = referralDoctors.filter((doctor) => doctor.doctor_type !== 'hospital')
  const institutions = referralDoctors.filter((doctor) => doctor.doctor_type === 'hospital')
  const selectedDoctorIds = new Set(report.referral_letter.selected_doctor_ids)
  const selectedInstitutionIds = new Set(report.referral_letter.selected_institution_ids)

  const toggleId = (path, selectedIds, id) => {
    const nextIds = selectedIds.has(id)
      ? [...selectedIds].filter((currentId) => currentId !== id)
      : [...selectedIds, id]
    updateReport(path, nextIds)
  }

  return (
    <section className="min-h-0 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <button type="button" onClick={onSave} className="primary-button">
          <Save className="h-4 w-4" />
          Save
        </button>
        <button type="button" className="secondary-button">
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
        <button type="button" onClick={() => updateReport(['referral_letter', 'body'], defaultReferralLetter)} className="secondary-button">
          <RotateCcw className="h-4 w-4" />
          Clear
        </button>
        <button type="button" onClick={onPreview} className="secondary-button">
          <Printer className="h-4 w-4" />
          Preview
        </button>
        <button type="button" onClick={onClose} className="secondary-button">
          <X className="h-4 w-4" />
          Close
        </button>
      </div>

      <div className="grid min-h-[620px] gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(220px,0.4fr)]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <button type="button" className="legacy-small-button" title="Bold"><Bold className="h-4 w-4" /></button>
                <button type="button" className="legacy-small-button" title="Italic"><Italic className="h-4 w-4" /></button>
                <button type="button" className="legacy-small-button" title="Underline"><Underline className="h-4 w-4" /></button>
                <button type="button" className="legacy-small-button" title="Align left"><AlignLeft className="h-4 w-4" /></button>
                <button type="button" className="legacy-small-button" title="Align center"><AlignCenter className="h-4 w-4" /></button>
                <button type="button" className="legacy-small-button" title="Align right"><AlignRight className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-2">
                <select className="field-control"><option>Arial</option></select>
                <select className="field-control"><option>10</option></select>
              </div>
            </div>

            <TextInput
              label="Letter name"
              value={report.referral_letter.letter_name}
              onChange={(value) => updateReport(['referral_letter', 'letter_name'], value)}
            />
          </div>

          <textarea
            className="min-h-[430px] w-full resize-y rounded-xl border border-slate-300 bg-white p-4 font-sans text-sm leading-8 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            value={report.referral_letter.body}
            onChange={(event) => updateReport(['referral_letter', 'body'], event.target.value)}
          />
        </div>

        <aside className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-base font-semibold text-slate-950">Letter copy to</h3>
          <SelectableDoctorTable
            title="Referral doctor"
            rows={doctors}
            selectedIds={selectedDoctorIds}
            onToggle={(id) => toggleId(['referral_letter', 'selected_doctor_ids'], selectedDoctorIds, id)}
            columns={[
              ['First name', (doctor) => doctor.first_name || '-'],
              ['Last name', (doctor) => doctor.last_name || '-'],
            ]}
            emptyMessage="No referral doctors recorded."
          />
          <SelectableDoctorTable
            title="Institution"
            rows={institutions}
            selectedIds={selectedInstitutionIds}
            onToggle={(id) => toggleId(['referral_letter', 'selected_institution_ids'], selectedInstitutionIds, id)}
            columns={[
              ['Institution', (doctor) => doctor.institution_name || doctor.hospital_name || '-'],
              ['City', (doctor) => doctor.district_city || '-'],
            ]}
            emptyMessage="No institutions recorded."
          />
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-slate-800">Referral letter list</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Date</th>
                  <th>Letter name</th>
                </tr>
              </thead>
              <tbody>
                {report.referral_letter.letters.map((letter, index) => (
                  <tr key={letter.id}>
                    <td>{index + 1}</td>
                    <td>{formatDate(letter.date)}</td>
                    <td>{letter.letter_name}</td>
                  </tr>
                ))}
                {report.referral_letter.letters.length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-slate-500">No referral letters saved yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </section>
  )
}

function SelectableDoctorTable({ title, rows, selectedIds, onToggle, columns, emptyMessage }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-slate-800">{title}</div>
      <div className="max-h-44 overflow-auto">
        <table className="data-table min-w-[360px]">
          <thead>
            <tr>
              <th>Select</th>
              {columns.map(([label]) => <th key={label}>{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = selectedIds.has(row.id)
              return (
                <tr key={row.id} className={isSelected ? 'selected-row' : undefined} onClick={() => onToggle(row.id)}>
                  <td>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(row.id)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Select ${doctorDisplayName(row)}`}
                    />
                  </td>
                  {columns.map(([label, render]) => <td key={label}>{render(row)}</td>)}
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="py-8 text-center text-slate-500">{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ImagePanel() { return <aside className="rounded-xl border bg-slate-50 p-4"><h3 className="font-semibold">Visit images</h3><p className="mt-2 text-sm">Use the Images button above to import, select and print files linked to this visit.</p></aside> }

function MeasurementGroup({ title, rows, report, updateReport }) {
  return (
    <div className="min-w-0">
      <div className="mb-3 text-sm font-semibold underline text-slate-900">{title}</div>
      <div className="space-y-3">
        {rows.map(([label, path]) => (
          <MeasurementField
            key={path.join('.')}
            label={label}
            value={path.reduce((cursor, key) => cursor?.[key], report)}
            onChange={(value) => updateReport(path, value)}
          />
        ))}
      </div>
    </div>
  )
}

function DopplerSection({ title, path, rows, report, updateReport }) {
  return (
    <Fieldset title={title}>
      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
        {rows.map(([label, key]) => (
          <MeasurementField
            key={key}
            label={label}
            value={[...path, key].reduce((cursor, item) => cursor?.[item], report)}
            onChange={(value) => updateReport([...path, key], value)}
            compact
          />
        ))}
      </div>
    </Fieldset>
  )
}

function ToolbarButton({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="toolbar-button">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  )
}

function HeaderField({ label, value, onChange, className = '' }) {
  return (
    <label className={`field-label ${className}`}>
      {label}
      <input className="field-control" value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function InlineField({ label = '', value, onChange, width = 'w-12', suffix = '' }) {
  return (
    <label className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-700">
      {label && <span className="shrink-0">{label}</span>}
      <input className={`legacy-input ${width}`} value={value || ''} onChange={(event) => onChange(event.target.value)} />
      {suffix && <span className="shrink-0 text-slate-500">{suffix}</span>}
    </label>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-t-lg border px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'border-slate-200 border-b-white bg-white text-teal-700'
          : 'border-transparent bg-transparent text-slate-600 hover:bg-white hover:text-slate-950'
      }`}
    >
      {children}
    </button>
  )
}

function Fieldset({ title = '', className = '', children }) {
  return (
    <fieldset className={`min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {title && <legend className="px-2 text-base font-semibold text-slate-950">{title}</legend>}
      {children}
    </fieldset>
  )
}

function ComboField({ label, value, onChange, withPlus = false }) {
  const field = `adult_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
  return (
    <div className="grid min-w-0 gap-1 sm:grid-cols-[minmax(170px,0.75fr)_minmax(0,1fr)] sm:items-center">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <EditableOptions field={field} label={label} value={value} onChange={onChange} options={['Normal', 'Abnormal', 'Intact', 'None', 'Good', 'Concordant', 'Dextrocardia']} withPlus={withPlus} />
    </div>
  )
}

function MeasurementField({ label, value, onChange, suffix = '', compact = false }) {
  return (
    <label className={`grid min-w-0 items-center gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-[minmax(140px,1fr)_minmax(80px,110px)_auto]'}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input readOnly={/\bMPI\b|\bPI\b|TDIMPI|E\/A|E\/E/i.test(label)} placeholder={/\bMPI\b|\bPI\b|TDIMPI|E\/A|E\/E/i.test(label) ? 'Awaiting approved formula' : ''} className="legacy-input w-full" value={value || ''} onChange={(event) => onChange(event.target.value)} />
      {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
    </label>
  )
}

function TextInput({ label, value, onChange }) {
  return (
    <label className="field-label">
      {label}
      <input className="field-control" value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="field-label">
      {label}
      <select className="field-control" value={value || ''} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function TextArea({ label, value, onChange, rows = 3 }) {
  return (
    <label className="field-label">
      {label}
      <textarea className="w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" rows={rows} value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function ComboWithNew({ label, value, onChange }) {
  return (
    <label className="field-label">
      {label}
      <span className="flex min-w-0 gap-2">
        <input className="legacy-input w-full" value={value || ''} onChange={(event) => onChange(event.target.value)} />
        <button type="button" className="legacy-small-button">New</button>
      </span>
    </label>
  )
}

export default AdultEchoReport

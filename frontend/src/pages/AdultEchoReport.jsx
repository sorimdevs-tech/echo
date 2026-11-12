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

const defaultFinalImpression = [
  'NO VALVAR REGURGITATION',
  'NORMAL LV AND RV CONTRACTILITY',
  'NO EVIDENCE OF PAH',
  'NO EFFUSION',
].join('\n')

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
    ar: '',
    coronaries: 'Normal',
    pulmonary_valve: 'Normal',
    pr: '',
    mpa: 'Normal',
    branch_pa: '',
    aortic_arch_right: '',
    pda: '',
    pericardial_effusion: '',
    cardiac_position: 'Dextrocardia',
    atria: 'Normal',
    atrio_ventricular_connection: 'Concordant',
    tricuspid_annulus: '1.5',
    tricuspid_pg: '2.5',
    mitral_annulus: '3.5',
    ms: 'None',
    rv_contractility: 'Good',
    lv_contractility: 'Good',
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
  const { scanId } = useParams()
  const [searchParams] = useSearchParams()
  const [patients, setPatients] = useState([])
  const [referralDoctors, setReferralDoctors] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '')
  const [selectedVisitId] = useState(searchParams.get('visitId') || '')
  const [activeMainTab, setActiveMainTab] = useState('scan')
  const [activeScanTab, setActiveScanTab] = useState('echo-details')
  const [activeImageTab, setActiveImageTab] = useState('images')
  const [report, setReport] = useState(() => deepClone(initialReport))
  const [savedScanId, setSavedScanId] = useState(scanId || '')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
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

    const fetchScan = async () => {
      try {
        const result = await scanService.getScan(scanId)
        if (!result.success) return

        const scan = result.data
        setSelectedPatientId(scan.patient_id || selectedPatientId)
        setSavedScanId(scan.id)
        setReport({
          ...deepClone(initialReport),
          ...(scan.adult_echo_report || {}),
          indication: scan.indicator || scan.adult_echo_report?.indication || '',
          tag: scan.tag || scan.adult_echo_report?.tag || '',
        })
      } catch (error) {
        console.error('Error loading adult echo scan:', error)
        setStatusMessage('Could not load this adult echo report.')
      }
    }

    fetchScan()
  }, [scanId])

  const updateReport = (path, value) => {
    setReport((current) => setNestedValue(current, path, value))
    setStatusMessage('')
  }

  const saveReport = async (reportToSave = report, successMessage = 'Adult echo report saved.') => {
    if (!selectedPatientId) {
      setStatusMessage('Select a patient before saving this adult echo report.')
      return false
    }

    if (!reportToSave.impression.primary_consultant?.trim()) {
      setStatusMessage('Enter a primary consultant before saving this report.')
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
      status: 'In Progress',
      adult_echo_report: reportToSave,
    }

    try {
      const result = savedScanId
        ? await scanService.updateScan(savedScanId, payload)
        : await scanService.createScan(payload)

      if (result.success) {
        const nextScanId = result.data.id
        setSavedScanId(nextScanId)
        setStatusMessage(successMessage)

        if (!savedScanId) {
          const query = new URLSearchParams()
          query.set('patientId', selectedPatientId)
          if (selectedVisitId) query.set('visitId', selectedVisitId)
          navigate(`/adult-echo-report/${nextScanId}?${query.toString()}`, { replace: true })
        }

        return true
      }
    } catch (error) {
      console.error('Error saving adult echo report:', error)
      setStatusMessage('Could not save adult echo report.')
    } finally {
      setIsSaving(false)
    }

    return false
  }

  const handleSave = () => {
    saveReport()
  }

  const handleClear = () => {
    setReport(deepClone(initialReport))
    setStatusMessage('')
  }

  const handleSaveReferralLetter = async () => {
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
    <div className="min-h-0 flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 text-sm text-slate-900">
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
              <ToolbarButton icon={Trash2} label="Delete" />
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
                  <TabButton key={tab.id} active={activeMainTab === tab.id} onClick={() => setActiveMainTab(tab.id)}>
                    {tab.label}
                  </TabButton>
                ))}
              </div>

              <div className="min-h-0 overflow-auto p-4">
                {activeMainTab === 'scan' ? (
                  <ScanPanel
                    activeScanTab={activeScanTab}
                    setActiveScanTab={setActiveScanTab}
                    report={report}
                    updateReport={updateReport}
                    onToggleNormalComments={toggleNormalComments}
                    isNormalCommentsPopulated={isNormalCommentsPopulated}
                  />
                ) : (
                  <ImpressionPanel report={report} updateReport={updateReport} />
                )}
              </div>
            </section>

            <ImagePanel
              activeImageTab={activeImageTab}
              setActiveImageTab={setActiveImageTab}
              report={report}
              updateReport={updateReport}
            />
          </div>
        )}
      </div>

      {isPreviewOpen && (
        <ReportPreviewModal
          report={report}
          updateReport={updateReport}
          patient={selectedPatient}
          visitId={selectedVisitId}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
      <ImagesModal
        open={isImagesModalOpen}
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

function ImpressionPanel({ report, updateReport }) {
  const impression = report.impression

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-3">
        <TextInput label="Report title" value={impression.report_title} onChange={(value) => updateReport(['impression', 'report_title'], value)} />
        <TextInput label="First line of report" value={impression.first_line} onChange={(value) => updateReport(['impression', 'first_line'], value)} />
        <TextArea label="Header comments - (F11 - Show previous header comments)" value={impression.header_comments} onChange={(value) => updateReport(['impression', 'header_comments'], value)} rows={3} />
        <TextArea label="Footer comments - (F11 - Show previous footer comments)" value={impression.footer_comments} onChange={(value) => updateReport(['impression', 'footer_comments'], value)} rows={3} />
        <div className="flex flex-wrap items-center gap-5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={impression.print_system_impression} onChange={(event) => updateReport(['impression', 'print_system_impression'], event.target.checked)} />
            Print System impression
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={impression.system_impression_position === 'before'} onChange={() => updateReport(['impression', 'system_impression_position'], 'before')} />
            Before final impression
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={impression.system_impression_position === 'after'} onChange={() => updateReport(['impression', 'system_impression_position'], 'after')} />
            After final impression
          </label>
        </div>
        <TextArea label="System impression - (F11 - Show previous system comments)" value={impression.system_impression} onChange={(value) => updateReport(['impression', 'system_impression'], value)} rows={5} />
        <div className="flex items-center justify-between">
          <span>Final impression-(F11-Show previous)</span>
          <label className="flex items-center gap-2 font-semibold text-green-700">
            <input disabled title="Use the review panel to complete this report" type="checkbox" checked={impression.report_completed} onChange={(event) => updateReport(['impression', 'report_completed'], event.target.checked)} />
            Report completed
          </label>
        </div>
        <textarea className="h-32 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm font-semibold uppercase text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={impression.final_impression} onChange={(event) => updateReport(['impression', 'final_impression'], event.target.value)} />
        <TextArea label="Disclaimer comments - (F11 - Show previous disclaimer comments)" value={impression.disclaimer_comments} onChange={(value) => updateReport(['impression', 'disclaimer_comments'], value)} rows={3} />
        <TextArea label="Internal Comments (Will not be printed) - (F11 - Show previous internal comments)" value={impression.internal_comments} onChange={(value) => updateReport(['impression', 'internal_comments'], value)} rows={3} />
      </div>

      <aside className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Fieldset title="Investigation status">
          {[
            ['Abnormal', 'abnormal'],
            ['Ambiguity', 'ambiguity'],
            ['Growth Abnormality', 'growth_abnormality'],
          ].map(([label, key]) => (
            <label key={key} className="block">
              <input type="checkbox" checked={impression.investigation_status[key]} onChange={(event) => updateReport(['impression', 'investigation_status', key], event.target.checked)} /> {label}
            </label>
          ))}
        </Fieldset>
        <TextInput label="Primary consultant (required)" value={impression.primary_consultant} onChange={(value) => updateReport(['impression', 'primary_consultant'], value)} />
        <TextArea label="Secondary consultant (optional)" value={impression.second_consultant} onChange={(value) => updateReport(['impression', 'second_consultant'], value)} rows={3} />
        <TextArea label="Audited by" value={impression.audited_by} onChange={(value) => updateReport(['impression', 'audited_by'], value)} rows={3} />
        <TextArea label="Reviewed by" value={impression.reviewed_by} onChange={(value) => updateReport(['impression', 'reviewed_by'], value)} rows={3} />
        <TextArea label="Report typed by" value={impression.report_typed_by} onChange={(value) => updateReport(['impression', 'report_typed_by'], value)} rows={3} />
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

function ImagePanel({ activeImageTab, setActiveImageTab, report, updateReport }) {
  return (
    <aside className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 px-3 pt-3">
        {imageTabs.map((tab) => (
          <TabButton key={tab.id} active={activeImageTab === tab.id} onClick={() => setActiveImageTab(tab.id)}>
            {tab.label}
          </TabButton>
        ))}
      </div>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2">
          {['Import', 'Export', 'Delete', 'Print', 'Rule of three', 'Image title', 'Process', 'Ink Save', 'Refresh', 'Organ drawing'].map((label) => (
            <button key={label} type="button" className="legacy-small-button">{label}</button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <label className="field-label">
            Image layout
            <select className="field-control" value={report.images.columns} onChange={(event) => updateReport(['images', 'columns'], event.target.value)}>
              <option value="1">Images: 1 column</option>
              <option value="2">Images: 2 column</option>
              <option value="3">Images: 3 column</option>
            </select>
          </label>
          <label className="field-label">
            Rows X Cols
            <select className="field-control" value={report.images.rows_cols} onChange={(event) => updateReport(['images', 'rows_cols'], event.target.value)}>
              <option>4X2</option>
              <option>3X2</option>
              <option>2X2</option>
            </select>
          </label>
          <InlineField label="Width" value={report.images.width} onChange={(value) => updateReport(['images', 'width'], value)} width="w-full" />
          <InlineField label="Height" value={report.images.height} onChange={(value) => updateReport(['images', 'height'], value)} width="w-full" />
        </div>
        <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
          <div className="text-center text-sm font-medium">
            <Image className="mx-auto mb-2 h-12 w-12" />
            {activeImageTab === 'images' ? 'No images imported' : 'No multiframes imported'}
          </div>
        </div>
      </div>
    </aside>
  )
}

function getDoctorProfile(consultantName) {
  try {
    const raw = localStorage.getItem('doctorProfile')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        name: consultantName || parsed.name || 'DR C.SHANTHI',
        degrees: parsed.degree || 'MBBS, DCH, DNB(PED) FNB(PED CARDIO)',
        signatureName: parsed.name ? parsed.name.replace(/^Dr\.?\s*/i, '') : 'C. Shanthi',
        registrationNo: parsed.registration_no || 'PNA / 10047 / 2024.',
      }
    }
  } catch (e) {
    console.error('Error fetching doctor profile', e)
  }
  return {
    name: consultantName || 'DR C.SHANTHI',
    degrees: 'MBBS, DCH, DNB(PED) FNB(PED CARDIO)',
    signatureName: 'C. Shanthi',
    registrationNo: 'PNA / 10047 / 2024.',
  }
}

function PatientHeaderTable({ patient, visitId, visitDate }) {
  const patientName = getPatientName(patient) || 'Mr. Ramesh Pandey'
  const ageSex = `${patient?.age || '80'} Years / ${patient?.gender || 'M'}`
  const patientId = patient?.patient_id || 'TM000060'
  const visitNo = visitId || '1'
  const refBy = patient?.family_doctor || patient?.referral_doctor || 'Dr. Suresh Hegde'
  const formattedDate = formatDate(visitDate || patient?.visit_date || new Date())

  return (
    <table className="document-patient-table mb-4">
      <tbody>
        <tr>
          <td className="th-label">Patient name</td>
          <td className="td-val font-semibold">{patientName}</td>
          <td className="th-label">Age/Sex</td>
          <td className="td-val">{ageSex}</td>
        </tr>
        <tr>
          <td className="th-label">Patient Id</td>
          <td className="td-val font-semibold">{patientId}</td>
          <td className="th-label">Visit no</td>
          <td className="td-val">{visitNo}</td>
        </tr>
        <tr>
          <td className="th-label">Referred by</td>
          <td className="td-val">{refBy}</td>
          <td className="th-label">Visit date</td>
          <td className="td-val">{formattedDate}</td>
        </tr>
      </tbody>
    </table>
  )
}

function ReportPreviewModal({ report, updateReport, patient, visitId, onClose }) {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [zoom, setZoom] = useState(100)

  const doctor = getDoctorProfile(report.impression?.primary_consultant)
  const ed = report.echo_details || {}

  const patientName = getPatientName(patient) || 'Mr. Ramesh Pandey'
  const ageSex = `${patient?.age || '80'} Years / ${patient?.gender || 'M'}`
  const patientId = patient?.patient_id || 'TM000060'
  const visitNo = visitId || '1'
  const refBy = patient?.family_doctor || patient?.referral_doctor || 'Dr. Suresh Hegde'
  const formattedDate = formatDate(patient?.visit_date || new Date())

  const mm = report.m_mode_measurement?.lv || {}
  const dMv = report.doppler_measurement?.mitral_valve || {}
  const dTv = report.doppler_measurement?.tricuspid_valve || {}

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-sm preview-modal-backdrop">
      {/* Top Toolbar */}
      <div className="no-print preview-modal-toolbar flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Printer className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Adult Echo Report Preview</h2>
            <p className="text-[11px] text-slate-500">Official Clinical A4 Print Layout</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(60, z - 10))}
              className="rounded px-2 py-1 text-slate-600 hover:bg-white hover:text-slate-900 cursor-pointer"
              title="Zoom out"
            >
              Zoom -
            </button>
            <span className="px-2 py-1 text-slate-700 font-mono">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(140, z + 10))}
              className="rounded px-2 py-1 text-slate-600 hover:bg-white hover:text-slate-900 cursor-pointer"
              title="Zoom in"
            >
              Zoom +
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="rounded px-2 py-1 text-slate-500 hover:bg-white hover:text-slate-800 border-l border-slate-200 cursor-pointer"
            >
              100%
            </button>
          </div>

          {/* Config button */}
          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title="Report Settings & Format"
          >
            <Cog className="h-3.5 w-3.5 text-slate-500" />
            Config
          </button>

          {/* Print / Save PDF Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 cursor-pointer"
            title="Print or Save as PDF (Ctrl + P)"
          >
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
            title="Close Preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Modal Preview Body */}
      <div className="preview-modal-content flex-1 overflow-y-auto bg-transparent py-8 px-4 flex justify-center">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease',
          }}
          className="mx-auto flex flex-col items-center gap-8 max-w-4xl"
        >
          <div className="report-template-sheet printable-report">
            {/* Master Header */}
            <div className="report-template-header">
              <h1>{report.impression?.report_title || 'ADULT ECHO SCAN REPORT'}</h1>
            </div>

            {/* Patient Info Grid - ONLY once at top */}
            <div className="report-patient-grid">
              <div><strong>Patient Name:</strong> {patientName}</div>
              <div><strong>Age / Sex:</strong> {ageSex}</div>
              <div><strong>Patient ID:</strong> {patientId}</div>
              <div><strong>Ref By:</strong> {refBy}</div>
              <div><strong>Visit No:</strong> {visitNo}</div>
              <div><strong>Visit Date:</strong> {formattedDate}</div>
            </div>

            {report.indication && (
              <div className="mb-2 px-1 text-xs text-slate-800">
                <strong>Indication:</strong> {report.indication}
              </div>
            )}

            {/* 1. Structure, Situs & Connections */}
            <div className="report-section-banner">1. Structure, Situs & Connections</div>
            <table className="report-data-table">
              <tbody>
                <tr>
                  <td className="row-label">Situs</td>
                  <td>{ed.situs || 'Normal'}</td>
                </tr>
                <tr>
                  <td className="row-label">Venous Connection</td>
                  <td>{ed.venous_connection || 'Normal'}</td>
                </tr>
                <tr>
                  <td className="row-label">Interatrial Septum</td>
                  <td>{ed.interatrial_septum || 'Intact'}</td>
                </tr>
                <tr>
                  <td className="row-label">Interventricular Septum</td>
                  <td>{ed.interventricular_septum || 'Intact'}</td>
                </tr>
                <tr>
                  <td className="row-label">Great Artery Relationship</td>
                  <td>{ed.great_artery_relationship || 'Normal'}</td>
                </tr>
              </tbody>
            </table>

            {/* 2. Valves & Chambers Assessment */}
            <div className="report-section-banner">2. Valves & Chambers Assessment</div>
            <table className="report-data-table">
              <tbody>
                <tr>
                  <td className="row-label">Tricuspid Valve</td>
                  <td>{ed.tricuspid_valve || 'Normal'}{ed.tr ? ` | TR: ${ed.tr}` : ' | TR: None'}</td>
                </tr>
                <tr>
                  <td className="row-label">Mitral Valve</td>
                  <td>{ed.mitral_valve || 'Normal'}{ed.mr ? ` | MR: ${ed.mr}` : ' | MR: None'}</td>
                </tr>
                <tr>
                  <td className="row-label">Right Ventricle</td>
                  <td>Size: {ed.right_ventricle || 'Normal'} | Contractility: {ed.rv_contractility || 'Good'}</td>
                </tr>
                <tr>
                  <td className="row-label">Left Ventricle</td>
                  <td>Size: {ed.left_ventricle || 'Normal'} | Contractility: {ed.lv_contractility || 'Good'}</td>
                </tr>
              </tbody>
            </table>

            {/* 3. Great Vessels & Outflow Tracts */}
            <div className="report-section-banner avoid-break">3. Great Vessels & Outflow Tracts</div>
            <table className="report-data-table avoid-break">
              <tbody>
                <tr>
                  <td className="row-label">Aorta</td>
                  <td>{ed.aorta || 'Normal'}{ed.ar ? ` | AR: ${ed.ar}` : ''}{ed.as ? ` | AS: ${ed.as}` : ''}</td>
                </tr>
                <tr>
                  <td className="row-label">Coronaries</td>
                  <td>{ed.coronaries || 'Normal'}</td>
                </tr>
                <tr>
                  <td className="row-label">Pulmonary Valve</td>
                  <td>{ed.pulmonary_valve || 'Normal'}{ed.pr ? ` | PR: ${ed.pr}` : ''}{ed.ps ? ` | PS: ${ed.ps}` : ''}</td>
                </tr>
                <tr>
                  <td className="row-label">Main Pulmonary Artery</td>
                  <td>{ed.mpa || 'Normal'}</td>
                </tr>
                <tr>
                  <td className="row-label">Branch Pulmonary Artery</td>
                  <td>{ed.branch_pa || 'Confluent, normal size'}</td>
                </tr>
                {ed.pericardial_effusion && (
                  <tr>
                    <td className="row-label">Pericardial Effusion</td>
                    <td>{ed.pericardial_effusion}</td>
                  </tr>
                )}
                {ed.additional_comments_enabled && ed.additional_comments && (
                  <tr>
                    <td className="row-label">Additional Comments</td>
                    <td>{ed.additional_comments}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* 4. M-Mode Measurements */}
            <div className="report-section-banner avoid-break">4. M-Mode Measurements</div>
            <table className="report-data-table avoid-break">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Diastole</th>
                  <th>Systole</th>
                  <th>Calculated Function</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="row-label">Interventricular Septum (IVS)</td>
                  <td>{mm.ivs_d ? `${mm.ivs_d} mm` : '8.5 mm'}</td>
                  <td>{mm.ivs_s ? `${mm.ivs_s} mm` : '11.5 mm'}</td>
                  <td rowSpan={3} className="align-middle">
                    <div className="space-y-1">
                      <div><strong>LVFS:</strong> <span className="report-ratio-badge">{mm.lv_percent_fs ? `${mm.lv_percent_fs}%` : '34%'}</span></div>
                      <div><strong>LVEF:</strong> <span className="report-ratio-badge">{mm.lv_ef ? `${mm.lv_ef}%` : '63%'}</span></div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="row-label">LV Internal Dimension (LVID)</td>
                  <td>{mm.lvid_d ? `${mm.lvid_d} mm` : '46.0 mm'}</td>
                  <td>{mm.lvid_s ? `${mm.lvid_s} mm` : '30.5 mm'}</td>
                </tr>
                <tr>
                  <td className="row-label">LV Posterior Wall (LVPW)</td>
                  <td>{mm.lvpw_d ? `${mm.lvpw_d} mm` : '8.8 mm'}</td>
                  <td>{mm.lvpw_s ? `${mm.lvpw_s} mm` : '12.2 mm'}</td>
                </tr>
              </tbody>
            </table>

            {/* 5. Doppler Velocities */}
            <div className="report-section-banner avoid-break">5. Doppler Velocities</div>
            <table className="report-data-table avoid-break">
              <thead>
                <tr>
                  <th>Valve / Site</th>
                  <th>Flow Pattern</th>
                  <th>Peak Velocity</th>
                  <th>Ratio / Gradient</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="row-label">Mitral Valve</td>
                  <td>Normal Inflow</td>
                  <td>E: {dMv.mv_e_vmax || '0.9 m/sec'} | A: {dMv.mv_a_vmax || '0.7 m/sec'}</td>
                  <td>E/A: {dMv.mv_e_a || '1.29'}</td>
                </tr>
                <tr>
                  <td className="row-label">Tricuspid Valve</td>
                  <td>Normal Inflow</td>
                  <td>E: {dTv.tv_e_vmax || '0.6 m/sec'} | A: {dTv.tv_a_vmax || '0.4 m/sec'}</td>
                  <td>{dTv.tv_dt ? `DT: ${dTv.tv_dt} ms` : 'Normal'}</td>
                </tr>
                <tr>
                  <td className="row-label">Aortic Valve</td>
                  <td>Concordant</td>
                  <td>{report.doppler_measurement?.aortic_valve?.aov_vmax || '1.2 m/sec'}</td>
                  <td>{report.doppler_measurement?.aortic_valve?.aov_peak_grad ? `${report.doppler_measurement.aortic_valve.aov_peak_grad} mmHg` : 'Normal gradient'}</td>
                </tr>
                <tr>
                  <td className="row-label">Pulmonary Valve</td>
                  <td>Concordant</td>
                  <td>{report.doppler_measurement?.pulmonary_valve?.pv_vmax || '0.9 m/sec'}</td>
                  <td>Normal</td>
                </tr>
              </tbody>
            </table>

            {/* Final Impression */}
            <div className="report-section-banner avoid-break">Final Impression</div>
            <div className="avoid-break my-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs leading-relaxed text-black font-semibold whitespace-pre-line">
              {report.impression?.final_impression ||
                'NO VALVAR REGURGITATION\nNORMAL LV AND RV CONTRACTILITY\nNO EVIDENCE OF PAH\nNO EFFUSION'}
            </div>

            {/* Doctor Signature Block */}
            <div className="mt-6 mb-3 avoid-break">
              <div className="h-10 flex items-end">
                <span
                  style={{
                    fontFamily: "'Brush Script MT', 'Dancing Script', 'Segoe Script', cursive, sans-serif",
                    fontSize: '1.9rem',
                    color: '#08145f',
                    display: 'inline-block',
                    transform: 'rotate(-2deg)',
                  }}
                >
                  {doctor.signatureName}
                </span>
              </div>
              <div className="font-bold text-xs uppercase text-black mt-1">
                {doctor.name} {doctor.degrees}
              </div>
            </div>

            {/* Disclaimer & PCPNDT */}
            <div className="mt-4 pt-3 border-t border-slate-300 text-[11px] leading-relaxed text-slate-800 avoid-break">
              <div className="font-bold text-black mb-1">Disclaimer</div>
              <p className="mb-2 text-justify">
                {report.impression?.disclaimer_comments ||
                  'Limitation of Adult Echocardiography is to be understood as intention of Adult Echo is to assess cardiac structure and function. Technical quality and patient acoustics may limit visualization.'}
              </p>
              <div className="font-semibold text-black">
                PCPNDT registration number {doctor.registrationNo}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReportConfigModal
        open={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  )
}

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
  const listId = `dl-adult-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
  const defaultOptions = ['Normal', 'Abnormal', 'Intact', 'None', 'Good', 'Concordant', 'Dextrocardia']

  return (
    <label className="grid min-w-0 gap-1 sm:grid-cols-[minmax(170px,0.75fr)_minmax(0,1fr)] sm:items-center">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5">
        <input
          list={listId}
          className="legacy-input w-full"
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Select or type..."
        />
        <datalist id={listId}>
          {defaultOptions.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
        {withPlus && (
          <button
            type="button"
            className="legacy-plus-button"
            title={`Add custom value for ${label}`}
            onClick={() => {
              const newVal = prompt(`Enter custom value for ${label}:`, value || '')
              if (newVal !== null) onChange(newVal)
            }}
          >
            +
          </button>
        )}
      </span>
    </label>
  )
}

function MeasurementField({ label, value, onChange, suffix = '', compact = false }) {
  return (
    <label className={`grid min-w-0 items-center gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-[minmax(140px,1fr)_minmax(80px,110px)_auto]'}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input className="legacy-input w-full" value={value || ''} onChange={(event) => onChange(event.target.value)} />
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

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  FileImage,
  Image,
  Printer,
  RotateCcw,
  Save,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'

const mainTabs = [
  { id: 'scan', label: 'Scan' },
  { id: 'impression', label: 'Impression' },
]

const scanTabs = [
  { id: 'echo-details', label: 'Echo details' },
  { id: 'biometry', label: 'Biometry' },
  { id: 'doppler', label: 'Doppler' },
]

const imageTabs = [
  { id: 'images', label: 'Images' },
  { id: 'multiframes', label: 'MultiFrames' },
]

const initialReport = {
  indication: '',
  tag: '',
  add_new_tag: false,
  patient_tags: [],
  print_options: {
    biometry: true,
    doppler: false,
    echo_details_custom_report: true,
  },
  echo_details: {
    heart_rate: '',
    cardiac_position: '',
    pulmonary_venous_connection: 'Normal',
    interatrial_septum: '',
    tricuspid_valve: 'Normal',
    tricuspid_annulus: '',
    tr: 'None',
    tr_pg: '',
    mitral_valve: 'Normal',
    mitral_annulus: '',
    mr: 'None',
    right_ventricle: 'Normal',
    right_ventricle_contractility: 'Good',
    left_ventricle: 'Normal',
    left_ventricle_contractility: 'Good',
    interventricular_septum: '',
    great_artery_relationship: 'Normal',
    aortic_valve: 'Normal',
    ar: 'None',
    as: 'None',
    aorta: 'Normal',
    sinus: '',
    stj: '',
    ascending_aorta: '',
    coronaries: 'Normal',
    aortic_arch_side: 'Lt',
    aortic_arch: 'normal',
    pulmonary_valve: 'Normal',
    pulmonary_annulus: '',
    pr_enabled: false,
    pr: '',
    ps_enabled: false,
    ps: '',
    main_pulmonary_artery: 'Normal',
    main_pulmonary_artery_mm: '',
    branch_pulmonary_artery: '',
    stenosis_enabled: false,
    stenosis: '',
    rpa: '',
    lpa: '',
    pericardial_effusion_enabled: true,
    pericardial_effusion: '',
    pleural_effusion_enabled: true,
    pleural_effusion: '',
    additional_comments_enabled: true,
    additional_comments: '',
  },
  biometry: {
    rvawd: '',
    rvidd: '',
    ivsd: '',
    ivss: '',
    lvidd: '',
    lvids: '',
    lvpwd: '',
    lvpws: '',
    lvfs: '',
    lvef: '',
    la: '',
    ao: '',
    la_ao: '',
  },
  doppler: {
    valve_flow: {
      mitral_e: '',
      mitral_a: '',
      mitral_e_a: '',
      tricuspid_e: '',
      tricuspid_a: '',
      tricuspid_e_a: '',
    },
    lv_tdi: {
      annulus_e: '9',
      annulus_a: '8',
      annulus_s: '7',
      annulus_e_e: '',
      annulus_tdimpi: '6',
      lateral_wall_e: '7',
      lateral_wall_a: '6',
      lateral_wall_s: '5',
      lateral_wall_e_e: '',
      lateral_wall_tdimpi: '4',
    },
    rv_tdi: {
      annulus_e: '',
      annulus_a: '',
      annulus_s: '',
      annulus_e_e: '',
      annulus_tdimpi: '',
      anterior_wall_e: '',
      anterior_wall_a: '',
      anterior_wall_s: '',
      anterior_wall_e_e: '',
      anterior_wall_tdimpi: '',
    },
    rv_fac: '',
    mpi_method_1: {
      right_ventricle_ict: '',
      right_ventricle_irt: '',
      right_ventricle_et: '',
      right_ventricle_mpi: '',
      left_ventricle_ict: '',
      left_ventricle_irt: '',
      left_ventricle_et: '',
      left_ventricle_mpi: '',
    },
    mpi_method_2: {
      right_ventricle_ict_irt_et: '',
      right_ventricle_et: '',
      right_ventricle_mpi: '',
      left_ventricle_ict_irt_et: '',
      left_ventricle_et: '',
      left_ventricle_mpi: '',
    },
  },
  impression: {
    report_title: 'Pediatric Echo Scan Report',
    first_line: '',
    header_comments: '',
    footer_comments: '',
    print_system_impression: true,
    system_impression_position: 'before',
    system_impression: '',
    final_impression: '',
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
    with_biometry_graphs: false,
    alias_id: true,
    designation: true,
    print_footer_text: true,
  },
}

const deepClone = (value) => JSON.parse(JSON.stringify(value))

function setNestedValue(source, path, value) {
  const next = { ...source }
  let cursor = next

  path.slice(0, -1).forEach((key) => {
    cursor[key] = { ...cursor[key] }
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

function PediatricEchoReport() {
  const navigate = useNavigate()
  const { scanId } = useParams()
  const [searchParams] = useSearchParams()
  const [patients, setPatients] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '')
  const [selectedVisitId] = useState(searchParams.get('visitId') || '')
  const [activeMainTab, setActiveMainTab] = useState('scan')
  const [activeScanTab, setActiveScanTab] = useState('echo-details')
  const [activeImageTab, setActiveImageTab] = useState('images')
  const [report, setReport] = useState(() => deepClone(initialReport))
  const [savedScanId, setSavedScanId] = useState(scanId || '')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId),
    [patients, selectedPatientId],
  )

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const result = await patientService.getPatients()
        if (result.success) {
          setPatients(result.data)
        }
      } catch (error) {
        console.error('Error loading patients:', error)
      }
    }

    fetchPatients()
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
          ...(scan.pediatric_echo_report || {}),
          indication: scan.indicator || scan.pediatric_echo_report?.indication || '',
          tag: scan.tag || scan.pediatric_echo_report?.tag || '',
        })
      } catch (error) {
        console.error('Error loading pediatric echo scan:', error)
        setStatusMessage('Could not load this pediatric echo report.')
      }
    }

    fetchScan()
  }, [scanId])

  const updateReport = (path, value) => {
    setReport((current) => setNestedValue(current, path, value))
    setStatusMessage('')
  }

  const handleSave = async () => {
    if (!selectedPatientId) {
      setStatusMessage('Select a patient before saving this pediatric echo report.')
      return
    }

    setIsSaving(true)
    setStatusMessage('')

    const payload = {
      scan_type: 'Pediatric Echo',
      patient_id: selectedPatientId,
      visit_id: selectedVisitId,
      report_title: report.impression.report_title,
      indicator: report.indication,
      tag: report.tag,
      status: report.impression.report_completed ? 'Completed' : 'In Progress',
      pediatric_echo_report: report,
    }

    try {
      const result = savedScanId
        ? await scanService.updateScan(savedScanId, payload)
        : await scanService.createScan(payload)

      if (result.success) {
        const nextScanId = result.data.id
        setSavedScanId(nextScanId)
        setStatusMessage('Pediatric echo report saved.')

        if (!savedScanId) {
          const query = new URLSearchParams()
          query.set('patientId', selectedPatientId)
          if (selectedVisitId) query.set('visitId', selectedVisitId)
          navigate(`/pediatric-echo-report/${nextScanId}?${query.toString()}`, { replace: true })
        }
      }
    } catch (error) {
      console.error('Error saving pediatric echo report:', error)
      setStatusMessage('Could not save pediatric echo report.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = () => {
    setReport(deepClone(initialReport))
    setStatusMessage('')
  }

  const handleAddNewChange = (checked) => {
    updateReport(['add_new_tag'], checked)
    if (checked) setIsTagModalOpen(true)
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 text-sm text-slate-900">
      <div className="flex min-h-full flex-col gap-3">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Pediatric Echo Report</p>
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
              <ToolbarButton icon={FileImage} label="Images" onClick={() => setActiveImageTab('images')} />
              <ToolbarButton icon={X} label="Close" onClick={() => navigate('/search')} />
            </div>
          </div>

          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_minmax(240px,1fr)_minmax(180px,0.55fr)_auto]">
            <label className="field-label">
              Patient
              <select
                value={selectedPatientId}
                onChange={(event) => setSelectedPatientId(event.target.value)}
                className="field-control"
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.patient_id} - {getPatientName(patient)}
                  </option>
                ))}
              </select>
            </label>

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
                onChange={(event) => handleAddNewChange(event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Add New
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="legacy-small-button">Open existing scans</button>
              <button type="button" className="legacy-small-button">Ref. Letter</button>
              <button type="button" onClick={() => setIsTagModalOpen(true)} className="legacy-small-button">
                <Tag className="mr-2 h-4 w-4" />
                Patient tag
              </button>
            </div>

            {statusMessage && <span className="font-semibold text-blue-800">{statusMessage}</span>}
          </div>

          <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">Options to print</div>
            <div className="flex flex-wrap gap-3">
              {Object.entries({
                biometry: 'Biometry',
                doppler: 'Doppler',
                echo_details_custom_report: 'Echo details custom report',
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <input
                    type="checkbox"
                    checked={report.print_options[key]}
                    onChange={(event) => updateReport(['print_options', key], event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </section>

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
                <ScanPanel activeScanTab={activeScanTab} setActiveScanTab={setActiveScanTab} report={report} updateReport={updateReport} />
              ) : (
                <ImpressionPanel report={report} updateReport={updateReport} />
              )}
            </div>
          </section>

          <ImagePanel activeImageTab={activeImageTab} setActiveImageTab={setActiveImageTab} report={report} updateReport={updateReport} />
        </div>
      </div>

      {isTagModalOpen && (
        <PatientTagModal
          report={report}
          updateReport={updateReport}
          onClose={() => setIsTagModalOpen(false)}
          onStatus={setStatusMessage}
        />
      )}
      {isPreviewOpen && (
        <ReportPreviewModal
          report={report}
          updateReport={updateReport}
          patient={selectedPatient}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  )
}

function ScanPanel({ activeScanTab, setActiveScanTab, report, updateReport }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {scanTabs.map((tab) => (
          <TabButton key={tab.id} active={activeScanTab === tab.id} onClick={() => setActiveScanTab(tab.id)}>
            {tab.label}
          </TabButton>
        ))}
      </div>
      {activeScanTab === 'echo-details' && <EchoDetailsTab report={report} updateReport={updateReport} />}
      {activeScanTab === 'biometry' && <BiometryTab report={report} updateReport={updateReport} />}
      {activeScanTab === 'doppler' && <DopplerTab report={report} updateReport={updateReport} />}
    </div>
  )
}

function EchoDetailsTab({ report, updateReport }) {
  const echo = report.echo_details

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-4">
        <Fieldset title="Pediatric Echo details">
          <div className="grid gap-3 2xl:grid-cols-2">
            <div className="space-y-3">
              <MeasurementField label="Heart rate" value={echo.heart_rate} onChange={(value) => updateReport(['echo_details', 'heart_rate'], value)} />
              <ComboField label="Cardiac position" value={echo.cardiac_position} onChange={(value) => updateReport(['echo_details', 'cardiac_position'], value)} withPlus />
              <ComboField label="Pulmonary venous connection" value={echo.pulmonary_venous_connection} onChange={(value) => updateReport(['echo_details', 'pulmonary_venous_connection'], value)} withPlus />
              <ComboField label="Interatrial septum" value={echo.interatrial_septum} onChange={(value) => updateReport(['echo_details', 'interatrial_septum'], value)} withPlus />
              <ValveStatusFields
                title="Tricuspid valve"
                status={echo.tricuspid_valve}
                statusPath={['echo_details', 'tricuspid_valve']}
                annulus={echo.tricuspid_annulus}
                annulusPath={['echo_details', 'tricuspid_annulus']}
                regurgitationLabel="TR"
                regurgitation={echo.tr}
                regurgitationPath={['echo_details', 'tr']}
                pressureLabel="PG (mmHg)"
                pressure={echo.tr_pg}
                pressurePath={['echo_details', 'tr_pg']}
                updateReport={updateReport}
              />
              <ValveStatusFields
                title="Mitral valve"
                status={echo.mitral_valve}
                statusPath={['echo_details', 'mitral_valve']}
                annulus={echo.mitral_annulus}
                annulusPath={['echo_details', 'mitral_annulus']}
                regurgitationLabel="MR"
                regurgitation={echo.mr}
                regurgitationPath={['echo_details', 'mr']}
                updateReport={updateReport}
              />
              <ComboField label="Right ventricle" value={echo.right_ventricle} onChange={(value) => updateReport(['echo_details', 'right_ventricle'], value)} withPlus />
              <ComboField label="Left ventricle" value={echo.left_ventricle} onChange={(value) => updateReport(['echo_details', 'left_ventricle'], value)} withPlus />
              <ComboField label="Interventricular septum" value={echo.interventricular_septum} onChange={(value) => updateReport(['echo_details', 'interventricular_septum'], value)} withPlus />
              <ComboField label="Great artery relationship" value={echo.great_artery_relationship} onChange={(value) => updateReport(['echo_details', 'great_artery_relationship'], value)} withPlus />
              <ComboField label="Aortic valve" value={echo.aortic_valve} onChange={(value) => updateReport(['echo_details', 'aortic_valve'], value)} withPlus />
              <ComboField label="Aorta" value={echo.aorta} onChange={(value) => updateReport(['echo_details', 'aorta'], value)} withPlus />
              <ComboField label="Coronaries" value={echo.coronaries} onChange={(value) => updateReport(['echo_details', 'coronaries'], value)} withPlus />
            </div>

            <div className="space-y-3">
              <ComboField label="Atrial situs" value={echo.atrial_situs || 'Normal'} onChange={(value) => updateReport(['echo_details', 'atrial_situs'], value)} withPlus />
              <ComboField label="Systemic venous connection" value={echo.systemic_venous_connection || 'Normal'} onChange={(value) => updateReport(['echo_details', 'systemic_venous_connection'], value)} withPlus />
              <ComboField label="Atria" value={echo.atria || 'Normal'} onChange={(value) => updateReport(['echo_details', 'atria'], value)} withPlus />
              <ComboField label="Atrio-ventricular connection" value={echo.atrio_ventricular_connection || 'Normal.'} onChange={(value) => updateReport(['echo_details', 'atrio_ventricular_connection'], value)} withPlus />
              <ComboField label="Contractility" value={echo.right_ventricle_contractility} onChange={(value) => updateReport(['echo_details', 'right_ventricle_contractility'], value)} withPlus />
              <ComboField label="Contractility" value={echo.left_ventricle_contractility} onChange={(value) => updateReport(['echo_details', 'left_ventricle_contractility'], value)} withPlus />
              <ComboField label="Ventriculo-arterial connection" value={echo.ventriculo_arterial_connection || ''} onChange={(value) => updateReport(['echo_details', 'ventriculo_arterial_connection'], value)} withPlus />
              <ComboField label="AR" value={echo.ar} onChange={(value) => updateReport(['echo_details', 'ar'], value)} withPlus />
              <ComboField label="AS" value={echo.as} onChange={(value) => updateReport(['echo_details', 'as'], value)} withPlus />
              <div className="grid gap-2 sm:grid-cols-3">
                <MeasurementField label="Sinus (mm)" value={echo.sinus} onChange={(value) => updateReport(['echo_details', 'sinus'], value)} compact />
                <MeasurementField label="STJ (mm)" value={echo.stj} onChange={(value) => updateReport(['echo_details', 'stj'], value)} compact />
                <MeasurementField label="asc Ao (mm)" value={echo.ascending_aorta} onChange={(value) => updateReport(['echo_details', 'ascending_aorta'], value)} compact />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 text-sm font-semibold text-slate-800">Aortic arch</div>
                <div className="mb-3 flex flex-wrap gap-4">
                  {['Lt', 'Rt'].map((side) => (
                    <label key={side} className="flex items-center gap-2">
                      <input type="radio" checked={echo.aortic_arch_side === side} onChange={() => updateReport(['echo_details', 'aortic_arch_side'], side)} />
                      {side}
                    </label>
                  ))}
                </div>
                <ComboField label="Arch comment" value={echo.aortic_arch} onChange={(value) => updateReport(['echo_details', 'aortic_arch'], value)} withPlus />
              </div>
              <ComboField label="Pulmonary valve" value={echo.pulmonary_valve} onChange={(value) => updateReport(['echo_details', 'pulmonary_valve'], value)} withPlus />
              <MeasurementField label="Annulus (mm)" value={echo.pulmonary_annulus} onChange={(value) => updateReport(['echo_details', 'pulmonary_annulus'], value)} />
              <CheckValueField label="PR" checked={echo.pr_enabled} value={echo.pr} onChecked={(value) => updateReport(['echo_details', 'pr_enabled'], value)} onValue={(value) => updateReport(['echo_details', 'pr'], value)} />
              <CheckValueField label="PS" checked={echo.ps_enabled} value={echo.ps} onChecked={(value) => updateReport(['echo_details', 'ps_enabled'], value)} onValue={(value) => updateReport(['echo_details', 'ps'], value)} />
              <ComboField label="Main pulmonary artery" value={echo.main_pulmonary_artery} onChange={(value) => updateReport(['echo_details', 'main_pulmonary_artery'], value)} withPlus />
              <MeasurementField label="MPA (mm)" value={echo.main_pulmonary_artery_mm} onChange={(value) => updateReport(['echo_details', 'main_pulmonary_artery_mm'], value)} />
              <ComboField label="Branch pulmonary artery" value={echo.branch_pulmonary_artery} onChange={(value) => updateReport(['echo_details', 'branch_pulmonary_artery'], value)} withPlus />
              <CheckValueField label="Stenosis" checked={echo.stenosis_enabled} value={echo.stenosis} onChecked={(value) => updateReport(['echo_details', 'stenosis_enabled'], value)} onValue={(value) => updateReport(['echo_details', 'stenosis'], value)} />
              <div className="grid gap-2 sm:grid-cols-2">
                <MeasurementField label="RPA (mm)" value={echo.rpa} onChange={(value) => updateReport(['echo_details', 'rpa'], value)} compact />
                <MeasurementField label="LPA (mm)" value={echo.lpa} onChange={(value) => updateReport(['echo_details', 'lpa'], value)} compact />
              </div>
              <CheckValueField label="Pericardial effusion" checked={echo.pericardial_effusion_enabled} value={echo.pericardial_effusion} onChecked={(value) => updateReport(['echo_details', 'pericardial_effusion_enabled'], value)} onValue={(value) => updateReport(['echo_details', 'pericardial_effusion'], value)} />
              <CheckValueField label="Pleural effusion" checked={echo.pleural_effusion_enabled} value={echo.pleural_effusion} onChecked={(value) => updateReport(['echo_details', 'pleural_effusion_enabled'], value)} onValue={(value) => updateReport(['echo_details', 'pleural_effusion'], value)} />
            </div>
          </div>
        </Fieldset>
      </div>

      <aside className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <button type="button" className="legacy-small-button mb-4">Clear all comments</button>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={echo.additional_comments_enabled}
            onChange={(event) => updateReport(['echo_details', 'additional_comments_enabled'], event.target.checked)}
          />
          Additional comments
        </label>
        <textarea
          className="h-80 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          value={echo.additional_comments}
          onChange={(event) => updateReport(['echo_details', 'additional_comments'], event.target.value)}
        />
      </aside>
    </div>
  )
}

function BiometryTab({ report, updateReport }) {
  const leftRows = [
    ['RVAWd', 'rvawd', '(mm)'],
    ['RVIDd', 'rvidd', '(mm)'],
    ['IVSd', 'ivsd', '(mm)'],
    ['LVIDd', 'lvidd', '(mm)'],
    ['LVPWd', 'lvpwd', '(mm)'],
    ['LVFS', 'lvfs', '%'],
    ['LA', 'la', '(mm)'],
    ['Ao', 'ao', '(mm)'],
  ]
  const rightRows = [
    ['IVSs', 'ivss', '(mm)'],
    ['LVIDs', 'lvids', '(mm)'],
    ['LVPWs', 'lvpws', '(mm)'],
    ['LVEF', 'lvef', '%'],
    ['LA/Ao', 'la_ao', ''],
  ]

  return (
    <Fieldset title="M-Mode measurements">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {leftRows.map(([label, key, suffix]) => (
            <MeasurementField key={key} label={label} value={report.biometry[key]} suffix={suffix} onChange={(value) => updateReport(['biometry', key], value)} />
          ))}
        </div>
        <div className="space-y-3">
          {rightRows.map(([label, key, suffix]) => (
            <MeasurementField key={key} label={label} value={report.biometry[key]} suffix={suffix} onChange={(value) => updateReport(['biometry', key], value)} />
          ))}
        </div>
      </div>
    </Fieldset>
  )
}

function DopplerTab({ report, updateReport }) {
  const valveRows = [
    ['Mitral valve', 'mitral'],
    ['Tricuspid valve', 'tricuspid'],
  ]

  return (
    <div className="space-y-4">
      <Fieldset title="Valve flow">
        <div className="overflow-x-auto">
          <div className="grid min-w-[560px] grid-cols-[180px_repeat(3,minmax(90px,1fr))] gap-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            <span />
            <span>E (m/sec)</span>
            <span>A (m/sec)</span>
            <span>E/A</span>
          </div>
          {valveRows.map(([label, prefix]) => (
            <div key={prefix} className="mt-2 grid min-w-[560px] grid-cols-[180px_repeat(3,minmax(90px,1fr))] items-center gap-2">
              <span className="font-medium text-slate-700">{label}</span>
              {['e', 'a', 'e_a'].map((suffix) => (
                <input
                  key={`${prefix}_${suffix}`}
                  className="legacy-input w-full"
                  value={report.doppler.valve_flow[`${prefix}_${suffix}`]}
                  onChange={(event) => updateReport(['doppler', 'valve_flow', `${prefix}_${suffix}`], event.target.value)}
                />
              ))}
            </div>
          ))}
        </div>
      </Fieldset>

      <Fieldset title="TDI measurements">
        <TdiTable title="LV TDI" rows={[['Annulus', 'annulus'], ['Lat wall', 'lateral_wall']]} values={report.doppler.lv_tdi} update={(key, value) => updateReport(['doppler', 'lv_tdi', key], value)} />
        <TdiTable title="RV TDI" rows={[['Annulus', 'annulus'], ['Antr wall', 'anterior_wall']]} values={report.doppler.rv_tdi} update={(key, value) => updateReport(['doppler', 'rv_tdi', key], value)} />
        <div className="mt-4 max-w-xs">
          <MeasurementField label="RV FAC" value={report.doppler.rv_fac} suffix="%" onChange={(value) => updateReport(['doppler', 'rv_fac'], value)} />
        </div>
      </Fieldset>

      <Fieldset title="MPI calculation">
        <div className="grid gap-6 lg:grid-cols-2">
          <PediatricMpiTable
            title="Method-1"
            columns={['ICT(ms)', 'IRT (ms)', 'ET(ms)', 'MPI']}
            keys={['ict', 'irt', 'et', 'mpi']}
            values={report.doppler.mpi_method_1}
            update={(key, value) => updateReport(['doppler', 'mpi_method_1', key], value)}
          />
          <PediatricMpiTable
            title="Method-2"
            columns={['ICT+IRT+ET(ms)', 'ET(ms)', 'MPI']}
            keys={['ict_irt_et', 'et', 'mpi']}
            values={report.doppler.mpi_method_2}
            update={(key, value) => updateReport(['doppler', 'mpi_method_2', key], value)}
          />
        </div>
      </Fieldset>
    </div>
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
            <input type="checkbox" checked={impression.report_completed} onChange={(event) => updateReport(['impression', 'report_completed'], event.target.checked)} />
            Report completed
          </label>
        </div>
        <textarea className="h-32 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={impression.final_impression} onChange={(event) => updateReport(['impression', 'final_impression'], event.target.value)} />
        <TextArea label="Disclaimer comments - (F11 - Show previous disclaimer comments)" value={impression.disclaimer_comments} onChange={(value) => updateReport(['impression', 'disclaimer_comments'], value)} rows={3} />
        <TextArea label="Internal Comments (Will not be printed) - (F11 - Show previous internal comments)" value={impression.internal_comments} onChange={(value) => updateReport(['impression', 'internal_comments'], value)} rows={3} />
      </div>

      <aside className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <ComboWithNew label="Report signed by (L)" value={impression.report_signed_by_l} onChange={(value) => updateReport(['impression', 'report_signed_by_l'], value)} />
        <ComboWithNew label="Report signed by (R)" value={impression.report_signed_by_r} onChange={(value) => updateReport(['impression', 'report_signed_by_r'], value)} />
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
        <TextInput label="Primary consultant" value={impression.primary_consultant} onChange={(value) => updateReport(['impression', 'primary_consultant'], value)} />
        <TextArea label="Second consultant" value={impression.second_consultant} onChange={(value) => updateReport(['impression', 'second_consultant'], value)} rows={3} />
        <TextArea label="Audited by" value={impression.audited_by} onChange={(value) => updateReport(['impression', 'audited_by'], value)} rows={3} />
        <TextArea label="Reviewed by" value={impression.reviewed_by} onChange={(value) => updateReport(['impression', 'reviewed_by'], value)} rows={3} />
        <TextArea label="Report typed by" value={impression.report_typed_by} onChange={(value) => updateReport(['impression', 'report_typed_by'], value)} rows={3} />
        <TextArea label="Equipment" value={impression.equipment} onChange={(value) => updateReport(['impression', 'equipment'], value)} rows={6} />
      </aside>
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

function PatientTagModal({ report, updateReport, onClose, onStatus }) {
  const [formData, setFormData] = useState({ patient_tag: '', order: '', inactive: false })
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const saveTag = () => {
    if (!formData.patient_tag.trim()) return

    const nextTag = {
      patient_tag: formData.patient_tag.trim(),
      order: formData.order,
      inactive: formData.inactive,
      default: report.patient_tags.length === 0,
    }
    const nextTags = selectedIndex >= 0
      ? report.patient_tags.map((tagItem, index) => (index === selectedIndex ? nextTag : tagItem))
      : [...report.patient_tags, nextTag]

    updateReport(['patient_tags'], nextTags)
    updateReport(['tag'], nextTag.patient_tag)
    onStatus('Patient tag saved with this pediatric echo report.')
  }

  const clearTag = () => {
    setFormData({ patient_tag: '', order: '', inactive: false })
    setSelectedIndex(-1)
  }

  const deleteTag = () => {
    if (selectedIndex < 0) return
    updateReport(['patient_tags'], report.patient_tags.filter((_, index) => index !== selectedIndex))
    clearTag()
    onStatus('Patient tag deleted from this pediatric echo report.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h3 className="text-lg font-semibold text-slate-950">Patient tag master</h3>
          <button type="button" onClick={onClose} className="toolbar-button px-3">
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={saveTag} className="primary-button"><Save className="h-4 w-4" /> Save</button>
            <button type="button" onClick={deleteTag} className="secondary-button"><Trash2 className="h-4 w-4" /> Delete</button>
            <button type="button" onClick={clearTag} className="secondary-button"><RotateCcw className="h-4 w-4" /> Clear</button>
            <button type="button" onClick={onClose} className="secondary-button"><X className="h-4 w-4" /> Close</button>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end">
            <TextInput label="Patient tag" value={formData.patient_tag} onChange={(value) => setFormData((current) => ({ ...current, patient_tag: value }))} />
            <TextInput label="Order" value={formData.order} onChange={(value) => setFormData((current) => ({ ...current, order: value }))} />
            <label className="flex items-center gap-2 pb-3 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={formData.inactive} onChange={(event) => setFormData((current) => ({ ...current, inactive: event.target.checked }))} />
              Inactive
            </label>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Patient tag</th>
                  <th>Default</th>
                  <th>Order</th>
                  <th>Inactive</th>
                </tr>
              </thead>
              <tbody>
                {report.patient_tags.map((tagItem, index) => (
                  <tr
                    key={`${tagItem.patient_tag}-${index}`}
                    className={selectedIndex === index ? 'selected-row' : undefined}
                    onClick={() => {
                      setSelectedIndex(index)
                      setFormData({
                        patient_tag: tagItem.patient_tag,
                        order: tagItem.order,
                        inactive: Boolean(tagItem.inactive),
                      })
                    }}
                  >
                    <td><input type="checkbox" checked={selectedIndex === index} readOnly /></td>
                    <td>{tagItem.patient_tag}</td>
                    <td>{tagItem.default ? 'Yes' : '-'}</td>
                    <td>{tagItem.order || '-'}</td>
                    <td>{tagItem.inactive ? 'Yes' : '-'}</td>
                  </tr>
                ))}
                {report.patient_tags.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-500">No patient tags recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportPreviewModal({ report, updateReport, patient, onClose }) {
  const detailRows = [
    ['Atrial situs', report.echo_details.atrial_situs || 'Normal'],
    ['Systemic venous connection', report.echo_details.systemic_venous_connection || 'Normal'],
    ['Pulmonary venous connection', report.echo_details.pulmonary_venous_connection],
    ['Atria', report.echo_details.atria || 'Normal'],
    ['Atrio-ventricular connection', report.echo_details.atrio_ventricular_connection || 'Normal.'],
    ['Tricuspid valve', `${report.echo_details.tricuspid_valve || ''}${report.echo_details.tr ? `\nTR : ${report.echo_details.tr}` : ''}`],
    ['Mitral valve', `${report.echo_details.mitral_valve || ''}${report.echo_details.mr ? `\nMR : ${report.echo_details.mr}` : ''}`],
    ['Right ventricle', `${report.echo_details.right_ventricle || ''}${report.echo_details.right_ventricle_contractility ? `\nContractility : ${report.echo_details.right_ventricle_contractility}` : ''}`],
    ['Left ventricle', `${report.echo_details.left_ventricle || ''}${report.echo_details.left_ventricle_contractility ? `\nContractility : ${report.echo_details.left_ventricle_contractility}` : ''}`],
    ['Great artery relationship', report.echo_details.great_artery_relationship],
    ['Aortic valve', report.echo_details.aortic_valve],
    ['Aorta', report.echo_details.aorta],
    ['Coronaries', report.echo_details.coronaries],
    [`Aortic arch (${report.echo_details.aortic_arch_side})`, report.echo_details.aortic_arch],
    ['Pulmonary valve', report.echo_details.pulmonary_valve],
    ['Main pulmonary artery', report.echo_details.main_pulmonary_artery],
  ].filter(([, value]) => String(value || '').trim())

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 p-4">
      <div className="flex h-full min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-3">
            {['Print', 'Zoom+', 'Zoom-', 'Actual size', 'Fit width', 'Two pages', 'Config', 'PDF', 'Mail'].map((label) => (
              <button key={label} type="button" onClick={label === 'Print' ? () => window.print() : undefined} className="legacy-small-button">{label}</button>
            ))}
            <button type="button" onClick={onClose} className="legacy-small-button">Close</button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-6">
            <div className="mx-auto min-h-[980px] max-w-3xl bg-white p-10 shadow-sm">
              <table className="mb-4 w-full border border-slate-400 text-sm">
                <tbody>
                  <tr>
                    <th className="border border-slate-400 px-2 py-1 text-left">Patient name</th>
                    <td className="border border-slate-400 px-2 py-1">{getPatientName(patient) || '-'}</td>
                    <th className="border border-slate-400 px-2 py-1 text-left">Age/Sex</th>
                    <td className="border border-slate-400 px-2 py-1">{patient?.age || '-'} Years / {patient?.gender || '-'}</td>
                  </tr>
                  <tr>
                    <th className="border border-slate-400 px-2 py-1 text-left">Patient Id</th>
                    <td className="border border-slate-400 px-2 py-1">{patient?.patient_id || '-'}</td>
                    <th className="border border-slate-400 px-2 py-1 text-left">Visit no</th>
                    <td className="border border-slate-400 px-2 py-1">1</td>
                  </tr>
                  <tr>
                    <th className="border border-slate-400 px-2 py-1 text-left">Referred by</th>
                    <td className="border border-slate-400 px-2 py-1">{patient?.family_doctor || 'SELF'}</td>
                    <th className="border border-slate-400 px-2 py-1 text-left">Visit date</th>
                    <td className="border border-slate-400 px-2 py-1">{formatDate(new Date())}</td>
                  </tr>
                </tbody>
              </table>
              <h2 className="mb-6 text-center text-xl font-bold">{report.impression.report_title}</h2>
              <h3 className="mb-3 font-bold">Pediatric Echo details</h3>
              <div className="space-y-3">
                {detailRows.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[190px_1fr] gap-3 whitespace-pre-line">
                    <span>{label}</span>
                    <span>: {value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="hidden w-[420px] overflow-auto border-l border-slate-200 bg-slate-50 p-4 xl:block">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Setting</h3>
          <div className="space-y-4">
            <Fieldset title="Report layout">
              <SelectInput label="Report type" value={report.preview_settings.report_type} onChange={(value) => updateReport(['preview_settings', 'report_type'], value)} options={['Report only', 'Report with images']} />
              <label className="mt-3 flex items-center gap-2"><input type="checkbox" checked={report.preview_settings.with_biometry_graphs} onChange={(event) => updateReport(['preview_settings', 'with_biometry_graphs'], event.target.checked)} /> With biometry graphs</label>
              <SelectInput label="Save as" value={report.preview_settings.save_as} onChange={(value) => updateReport(['preview_settings', 'save_as'], value)} options={['Pdf', 'Docx']} />
            </Fieldset>
            <Fieldset title="Print options">
              {[
                ['Alias ID', 'alias_id'],
                ['Designation', 'designation'],
                ['Print footer text', 'print_footer_text'],
              ].map(([label, key]) => (
                <label key={key} className="mr-3 inline-flex items-center gap-2">
                  <input type="checkbox" checked={report.preview_settings[key]} onChange={(event) => updateReport(['preview_settings', key], event.target.checked)} />
                  {label}
                </label>
              ))}
            </Fieldset>
            <Fieldset title="Margin for report">
              <div className="grid grid-cols-2 gap-3">
                {['Left margin', 'Top margin', 'Height', 'Width', 'Line spacing', 'Section spacing'].map((label) => (
                  <TextInput key={label} label={label} value="" onChange={() => {}} />
                ))}
              </div>
            </Fieldset>
          </div>
        </aside>
      </div>
    </div>
  )
}

function TdiTable({ title, rows, values, update }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="mb-2 font-semibold text-slate-800">{title}</div>
      <div className="grid min-w-[720px] grid-cols-[150px_repeat(5,minmax(90px,1fr))] gap-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        <span />
        <span>E' (m/sec)</span>
        <span>A' (m/sec)</span>
        <span>S (m/sec)</span>
        <span>E/E'</span>
        <span>TDIMPI</span>
      </div>
      {rows.map(([label, prefix]) => (
        <div key={prefix} className="mt-2 grid min-w-[720px] grid-cols-[150px_repeat(5,minmax(90px,1fr))] items-center gap-2">
          <span className="font-medium text-slate-700">{label}</span>
          {['e', 'a', 's', 'e_e', 'tdimpi'].map((suffix) => (
            <input key={`${prefix}_${suffix}`} className="legacy-input w-full" value={values[`${prefix}_${suffix}`]} onChange={(event) => update(`${prefix}_${suffix}`, event.target.value)} />
          ))}
        </div>
      ))}
    </div>
  )
}

function PediatricMpiTable({ title, columns, keys, values, update }) {
  const rows = [
    ['Right ventricle', 'right_ventricle'],
    ['Left ventricle', 'left_ventricle'],
  ]

  return (
    <div className="overflow-x-auto">
      <div className="mb-2 font-semibold text-slate-800">{title}</div>
      <div
        className="grid min-w-[520px] gap-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
        style={{ gridTemplateColumns: keys.length === 4 ? '150px repeat(4, minmax(80px, 1fr))' : '150px repeat(3, minmax(100px, 1fr))' }}
      >
        <span />
        {columns.map((column) => <span key={column}>{column}</span>)}
      </div>
      {rows.map(([label, prefix]) => (
        <div
          key={prefix}
          className="mt-2 grid min-w-[520px] items-center gap-2"
          style={{ gridTemplateColumns: keys.length === 4 ? '150px repeat(4, minmax(80px, 1fr))' : '150px repeat(3, minmax(100px, 1fr))' }}
        >
          <span className="font-medium text-slate-700">{label}</span>
          {keys.map((key) => (
            <input key={`${prefix}_${key}`} className="legacy-input w-full" value={values[`${prefix}_${key}`]} onChange={(event) => update(`${prefix}_${key}`, event.target.value)} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ValveStatusFields({ title, status, statusPath, annulus, annulusPath, regurgitationLabel, regurgitation, regurgitationPath, pressureLabel = '', pressure = '', pressurePath = null, updateReport }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <ComboField label={title} value={status} onChange={(value) => updateReport(statusPath, value)} withPlus />
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <MeasurementField label="Annulus (mm)" value={annulus} onChange={(value) => updateReport(annulusPath, value)} compact />
        <ComboField label={regurgitationLabel} value={regurgitation} onChange={(value) => updateReport(regurgitationPath, value)} withPlus />
      </div>
      {pressurePath && (
        <div className="mt-2">
          <MeasurementField label={pressureLabel} value={pressure} onChange={(value) => updateReport(pressurePath, value)} />
        </div>
      )}
    </div>
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
      <input className="field-control" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function InlineField({ label = '', value, onChange, width = 'w-12', suffix = '' }) {
  return (
    <label className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-700">
      {label && <span className="shrink-0">{label}</span>}
      <input className={`legacy-input ${width}`} value={value} onChange={(event) => onChange(event.target.value)} />
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
  return (
    <label className="grid min-w-0 gap-1 sm:grid-cols-[minmax(150px,0.8fr)_minmax(0,1fr)] sm:items-center">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="flex min-w-0 gap-2">
        <input className="legacy-input w-full" value={value || ''} onChange={(event) => onChange(event.target.value)} />
        {withPlus && <button type="button" className="legacy-plus-button">+</button>}
      </span>
    </label>
  )
}

function MeasurementField({ label, value, onChange, suffix = '', compact = false }) {
  return (
    <label className={`grid min-w-0 items-center gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-[minmax(150px,1fr)_minmax(90px,120px)_auto]'}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input className="legacy-input w-full" value={value || ''} onChange={(event) => onChange(event.target.value)} />
      {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
    </label>
  )
}

function CheckValueField({ label, checked, value, onChecked, onValue }) {
  return (
    <label className="grid min-w-0 gap-2 sm:grid-cols-[minmax(150px,1fr)_minmax(0,1fr)] sm:items-center">
      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={checked} onChange={(event) => onChecked(event.target.checked)} />
        {label}
      </span>
      <span className="flex min-w-0 gap-2">
        <input className="legacy-input w-full" value={value || ''} onChange={(event) => onValue(event.target.value)} />
        <button type="button" className="legacy-plus-button">+</button>
      </span>
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

export default PediatricEchoReport

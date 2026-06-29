import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  FileImage,
  Image,
  Printer,
  RotateCcw,
  Save,
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
  { id: 'aortic', label: 'Aortic stenosis parameters' },
]

const imageTabs = [
  { id: 'images', label: 'Images' },
  { id: 'multiframes', label: 'MultiFrames' },
]

const initialReport = {
  indication: '',
  tag: '',
  add_new_tag: false,
  no_of_fetuses: '1',
  ga_weeks: '20',
  ga_days: '6',
  print_options: {
    biometry: true,
    doppler: true,
    percentile_bar: true,
    ga: true,
    biometry_table_name: true,
    echo_details_custom_report: true,
    asp: true,
  },
  lmp: {
    enabled: true,
    lmp_date: '',
    edd: '',
    assigned_by: 'lmp',
    et_date: false,
    bt_date: false,
    no_of_fetuses: 'Single',
  },
  echo_details: {
    general: {
      cardiac_views: '',
      abdominal_situs: '',
      stomach: '',
      heart_size: '',
      apex: '',
      cardiac_axis: '',
      pericardial_effusion: false,
      rhythm: '',
      fhr: '',
      additional_comments_enabled: true,
      additional_comments: '',
    },
    four_chamber: {
      atria: '',
      ventricles: '',
      atrioventricular_junction: '',
      atrioventricular_regurgitation: '',
      interventricular_septum: '',
      ventricular_function: '',
      interatrial_septum: '',
      foramen_ovale: '',
    },
    outflow_tract: {
      outflow_tracts: '',
      va_valve_regurgitation: '',
      branch_pulmonary_artery: '',
      ductus_arteriosus: '',
      aortic_arch: '',
      side_of_arch: '',
      three_vessel_view: '',
      three_vt_view: '',
      comments: '',
    },
    others: {
      systemic_veins: '',
      pulmonary_veins: '',
      echogenic_focus: false,
      other_lesions: '',
    },
  },
  biometry: {
    b_mode: {
      mitral_valve: '',
      tricuspid_valve: '',
      aortic_valve: '',
      pulmonary_valve: '',
      truncal_valve: '',
      branch_pulmonary_artery_right: '',
      branch_pulmonary_artery_left: '',
      aortic_isthmus: '',
      ductus_arteriosus: '',
      cardiac_circumference: '',
      thoracic_circumference: '',
      cc_tc: '',
      right_atrial_width: '',
      right_atrial_length: '',
      left_atrial_width: '',
      left_atrial_length: '',
      right_ventricular_width: '',
      right_ventricular_length: '',
      left_ventricular_width: '',
      left_ventricular_length: '',
    },
    m_mode: {
      rv_wall: '',
      lv_wall: '',
      ivs: '',
      lvsd: '',
      lvdd: '',
      sf: '',
    },
  },
  doppler: {
    venous: {
      inferior_vena_cava_vm: '',
      inferior_vena_cava_tamx: '',
      inferior_vena_cava_systolic_peak: '',
      inferior_vena_cava_diastolic_peak: '',
      inferior_vena_cava_a_wave: '',
      ductus_venosus_vm: '',
      ductus_venosus_tamx: '',
      ductus_venosus_systolic_peak: '',
      ductus_venosus_diastolic_peak: '',
      ductus_venosus_a_wave: '',
      inferior_vena_cava_pi: '',
      dv_pi: '',
      pulmonary_veins: '',
    },
    valves: {
      mitral_e_wave: '',
      mitral_a_wave: '',
      mitral_e_a: '',
      tricuspid_e_wave: '',
      tricuspid_a_wave: '',
      tricuspid_e_a: '',
      aortic_valve_psv: '',
      pulmonary_valve_psv: '',
      ductus_arteriosus_pi: '',
    },
    mpi_method_1: {
      rv_ict: '',
      rv_irt: '',
      rv_et: '',
      rv_mpi: '',
      lv_ict: '',
      lv_irt: '',
      lv_et: '',
      lv_mpi: '',
    },
    mpi_method_2: {
      rv_ict_irt_et: '',
      rv_et: '',
      rv_mpi: '',
      lv_ict_irt_et: '',
      lv_et: '',
      lv_mpi: '',
    },
  },
  aortic: {
    aortic_valve: {
      annulus: '',
      z_score: '',
      thickened: '',
      mobility: '',
      forward_flow: '',
      ascending_aorta_diameter: '',
      ascending_aorta_z_score: '',
    },
    mitral_valve: {
      annulus: '',
      z_score: '',
      inflow_doppler: '',
      mr: '',
    },
    pulmonary_valve: {
      annulus: '',
      transverse_arch_diameter: '',
      transverse_arch_z_score: '',
      flow: '',
    },
    lv: {
      contractility: '',
      width: '',
      width_z_score: '',
      length: '',
      length_z_score: '',
      efe: '',
    },
    tricuspid_valve: {
      annulus: '',
      z_score: '',
      tr: '',
    },
    foramen_ovale: {
      flow: '',
    },
  },
  impression: {
    report_title: 'Echo Cardiography Report',
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

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toInputDate(date) {
  if (!date || Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function calculateGestationalAge(lmpDate) {
  if (!lmpDate) return ''

  const start = new Date(`${lmpDate}T00:00:00`)
  if (Number.isNaN(start.getTime())) return ''

  const now = new Date()
  const days = Math.max(0, Math.floor((now - start) / 86400000))
  return `${Math.floor(days / 7)} W ${days % 7} D`
}

function getPatientName(patient) {
  if (!patient) return ''

  const name = [patient.first_name, patient.last_name].filter(Boolean).join(' ')
  return name || patient.patient_id || ''
}

function FetalEchoReport() {
  const navigate = useNavigate()
  const { scanId } = useParams()
  const [searchParams] = useSearchParams()
  const [patients, setPatients] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '')
  const [selectedVisitId] = useState(searchParams.get('visitId') || '')
  const [activeMainTab, setActiveMainTab] = useState('scan')
  const [activeScanTab, setActiveScanTab] = useState('echo-details')
  const [activeImageTab, setActiveImageTab] = useState('images')
  const [isLmpOpen, setIsLmpOpen] = useState(false)
  const [report, setReport] = useState(() => deepClone(initialReport))
  const [savedScanId, setSavedScanId] = useState(scanId || '')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

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
          ...(scan.fetal_echo_report || {}),
          indication: scan.indicator || scan.fetal_echo_report?.indication || '',
          tag: scan.tag || scan.fetal_echo_report?.tag || '',
          no_of_fetuses: scan.no_of_fetuses || scan.fetal_echo_report?.no_of_fetuses || '1',
          ga_weeks: scan.ga_weeks || scan.fetal_echo_report?.ga_weeks || '20',
          ga_days: scan.ga_days || scan.fetal_echo_report?.ga_days || '6',
        })
      } catch (error) {
        console.error('Error loading fetal echo scan:', error)
        setStatusMessage('Could not load this fetal echo report.')
      }
    }

    fetchScan()
  }, [scanId])

  const updateReport = (path, value) => {
    setReport((current) => setNestedValue(current, path, value))
    setStatusMessage('')
  }

  const handleLmpDateChange = (value) => {
    const lmpDate = value ? new Date(`${value}T00:00:00`) : null
    const edd = lmpDate ? toInputDate(addDays(lmpDate, 280)) : ''

    setReport((current) => ({
      ...current,
      lmp: {
        ...current.lmp,
        lmp_date: value,
        edd,
      },
    }))
  }

  const handleSave = async () => {
    if (!selectedPatientId) {
      setStatusMessage('Select a patient before saving this fetal echo report.')
      return
    }

    setIsSaving(true)
    setStatusMessage('')

    const payload = {
      scan_type: 'Fetal Echo',
      patient_id: selectedPatientId,
      visit_id: selectedVisitId,
      report_title: report.impression.report_title,
      indicator: report.indication,
      tag: report.tag,
      no_of_fetuses: report.no_of_fetuses,
      ga_weeks: report.ga_weeks,
      ga_days: report.ga_days,
      status: report.impression.report_completed ? 'Completed' : 'In Progress',
      fetal_echo_report: report,
    }

    try {
      const result = savedScanId
        ? await scanService.updateScan(savedScanId, payload)
        : await scanService.createScan(payload)

      if (result.success) {
        const nextScanId = result.data.id
        setSavedScanId(nextScanId)
        setStatusMessage('Fetal echo report saved.')

        if (!savedScanId) {
          const query = new URLSearchParams()
          query.set('patientId', selectedPatientId)
          if (selectedVisitId) query.set('visitId', selectedVisitId)
          navigate(`/fetal-echo-report/${nextScanId}?${query.toString()}`, { replace: true })
        }
      }
    } catch (error) {
      console.error('Error saving fetal echo report:', error)
      setStatusMessage('Could not save fetal echo report.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = () => {
    setReport(deepClone(initialReport))
    setStatusMessage('')
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 text-sm text-slate-900">
      <div className="flex min-h-full flex-col gap-3">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Fetal Echo Report</p>
              <h2 className="text-xl font-semibold tracking-normal text-slate-950">
                {getPatientName(selectedPatient) || 'Select patient'}
                {selectedVisitId ? <span className="ml-2 text-sm font-medium text-slate-500">Visit #{selectedVisitId}</span> : null}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ToolbarButton icon={Save} label={isSaving ? 'Saving' : 'Save'} onClick={handleSave} />
              <ToolbarButton icon={Trash2} label="Delete" />
              <ToolbarButton icon={RotateCcw} label="Clear" onClick={handleClear} />
              <ToolbarButton icon={Printer} label="Preview" onClick={() => window.print()} />
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
              <button type="button" className="legacy-small-button">Open existing scans</button>
              <button type="button" className="legacy-small-button">Ref. Letter</button>
              <button type="button" onClick={() => setIsLmpOpen(true)} className="legacy-small-button">LMP</button>
              <InlineField label="No. of fetuses" value={report.no_of_fetuses} onChange={(value) => updateReport(['no_of_fetuses'], value)} width="w-20" />
              <InlineField label="GA" value={report.ga_weeks} onChange={(value) => updateReport(['ga_weeks'], value)} width="w-20" suffix="wks" />
              <InlineField value={report.ga_days} onChange={(value) => updateReport(['ga_days'], value)} width="w-20" suffix="days" />
            </div>

            {statusMessage && <span className="font-semibold text-blue-800">{statusMessage}</span>}
          </div>

          <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">Options to print</div>
            <div className="flex flex-wrap gap-3">
              {Object.entries({
                biometry: 'Biometry',
                doppler: 'Doppler',
                percentile_bar: 'Percentile bar',
                ga: 'GA',
                biometry_table_name: 'Biometry table name',
                echo_details_custom_report: 'Echo details custom report',
                asp: 'ASP',
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
                <TabButton
                  key={tab.id}
                  active={activeMainTab === tab.id}
                  onClick={() => setActiveMainTab(tab.id)}
                >
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
      </div>

      {isLmpOpen && (
        <LmpModal
          report={report}
          updateReport={updateReport}
          onLmpDateChange={handleLmpDateChange}
          onClose={() => setIsLmpOpen(false)}
          onSave={() => {
            setIsLmpOpen(false)
            setStatusMessage('LMP details updated.')
          }}
        />
      )}
    </div>
  )
}

function ScanPanel({ activeScanTab, setActiveScanTab, report, updateReport }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 px-2 pt-2">
        <TabButton active>Fetus</TabButton>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {scanTabs.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeScanTab === tab.id}
            onClick={() => setActiveScanTab(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </div>
      {activeScanTab === 'echo-details' && <EchoDetailsTab report={report} updateReport={updateReport} />}
      {activeScanTab === 'biometry' && <BiometryTab report={report} updateReport={updateReport} />}
      {activeScanTab === 'doppler' && <DopplerTab report={report} updateReport={updateReport} />}
      {activeScanTab === 'aortic' && <AorticTab report={report} updateReport={updateReport} />}
    </div>
  )
}

function EchoDetailsTab({ report, updateReport }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-4">
        <Fieldset title="General details">
          <TwoColumnLegacyGrid
            rows={[
              ['Cardiac views', ['echo_details', 'general', 'cardiac_views'], 'Abdominal situs', ['echo_details', 'general', 'abdominal_situs']],
              ['Stomach', ['echo_details', 'general', 'stomach'], 'Heart size', ['echo_details', 'general', 'heart_size']],
              ['Apex', ['echo_details', 'general', 'apex'], 'Cardiac axis', ['echo_details', 'general', 'cardiac_axis']],
              ['Rhythm', ['echo_details', 'general', 'rhythm']],
            ]}
            report={report}
            updateReport={updateReport}
            withPlus
          />
          <label className="mt-1 flex items-center gap-2">
            <input
              type="checkbox"
              checked={report.echo_details.general.pericardial_effusion}
              onChange={(event) => updateReport(['echo_details', 'general', 'pericardial_effusion'], event.target.checked)}
            />
            Pericardial Effusion
          </label>
          <InlineField label="FHR" value={report.echo_details.general.fhr} onChange={(value) => updateReport(['echo_details', 'general', 'fhr'], value)} width="w-16" />
        </Fieldset>

        <Fieldset title="4-Chamber details">
          <TwoColumnLegacyGrid
            rows={[
              ['Atria', ['echo_details', 'four_chamber', 'atria'], 'Ventricles', ['echo_details', 'four_chamber', 'ventricles']],
              ['Atrioventricular junction', ['echo_details', 'four_chamber', 'atrioventricular_junction'], 'Atrioventricular regurgitation', ['echo_details', 'four_chamber', 'atrioventricular_regurgitation']],
              ['Inter ventricular septum', ['echo_details', 'four_chamber', 'interventricular_septum'], 'Ventricular function', ['echo_details', 'four_chamber', 'ventricular_function']],
              ['Inter atrial septum', ['echo_details', 'four_chamber', 'interatrial_septum'], 'Foramen ovale', ['echo_details', 'four_chamber', 'foramen_ovale']],
            ]}
            report={report}
            updateReport={updateReport}
            withPlus
          />
        </Fieldset>

        <Fieldset title="Outflow tract details">
          <TwoColumnLegacyGrid
            rows={[
              ['Outflow tracts', ['echo_details', 'outflow_tract', 'outflow_tracts'], 'V-A valve regurgitation', ['echo_details', 'outflow_tract', 'va_valve_regurgitation']],
              ['Branch pulmonary artery', ['echo_details', 'outflow_tract', 'branch_pulmonary_artery'], 'Ductus arteriosus', ['echo_details', 'outflow_tract', 'ductus_arteriosus']],
              ['Aortic arch', ['echo_details', 'outflow_tract', 'aortic_arch'], 'Side of arch', ['echo_details', 'outflow_tract', 'side_of_arch']],
              ['3VV', ['echo_details', 'outflow_tract', 'three_vessel_view'], '3VT view', ['echo_details', 'outflow_tract', 'three_vt_view']],
            ]}
            report={report}
            updateReport={updateReport}
            withPlus
          />
          <textarea
            className="legacy-input mt-3 h-24 w-full resize-y py-2"
            value={report.echo_details.outflow_tract.comments}
            onChange={(event) => updateReport(['echo_details', 'outflow_tract', 'comments'], event.target.value)}
          />
        </Fieldset>

        <Fieldset title="Others">
          <div className="grid gap-3 lg:grid-cols-2">
            <LegacyField label="Systemic veins" value={report.echo_details.others.systemic_veins} onChange={(value) => updateReport(['echo_details', 'others', 'systemic_veins'], value)} withPlus />
            <LegacyField label="Pulmonary veins" value={report.echo_details.others.pulmonary_veins} onChange={(value) => updateReport(['echo_details', 'others', 'pulmonary_veins'], value)} withPlus />
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={report.echo_details.others.echogenic_focus}
                onChange={(event) => updateReport(['echo_details', 'others', 'echogenic_focus'], event.target.checked)}
              />
              Echogenic focus
            </label>
            <LegacyField label="Other lesions" value={report.echo_details.others.other_lesions} onChange={(value) => updateReport(['echo_details', 'others', 'other_lesions'], value)} withPlus />
          </div>
        </Fieldset>
      </div>
      <aside className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <button type="button" className="legacy-small-button mb-4">Scatter normal comments</button>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={report.echo_details.general.additional_comments_enabled}
            onChange={(event) => updateReport(['echo_details', 'general', 'additional_comments_enabled'], event.target.checked)}
          />
          Additional comments
        </label>
        <textarea
          className="h-80 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          value={report.echo_details.general.additional_comments}
          onChange={(event) => updateReport(['echo_details', 'general', 'additional_comments'], event.target.value)}
        />
      </aside>
    </div>
  )
}

function BiometryTab({ report, updateReport }) {
  const leftRows = [
    ['Mitral valve', 'mitral_valve'],
    ['Tricuspid valve', 'tricuspid_valve'],
    ['Aortic valve', 'aortic_valve'],
    ['Pulmonary valve', 'pulmonary_valve'],
    ['Truncal valve', 'truncal_valve'],
    ['Branch pulmonary artery right', 'branch_pulmonary_artery_right'],
    ['Branch pulmonary artery left', 'branch_pulmonary_artery_left'],
    ['Aortic isthmus', 'aortic_isthmus'],
    ['Ductus arteriosus', 'ductus_arteriosus'],
  ]
  const rightRows = [
    ['Rt. Atrial width', 'right_atrial_width'],
    ['Rt. Atrial length', 'right_atrial_length'],
    ['Lt. Atrial width', 'left_atrial_width'],
    ['Lt. Atrial length', 'left_atrial_length'],
    ['Rt. Ventricular width', 'right_ventricular_width'],
    ['Rt. Ventricular length', 'right_ventricular_length'],
    ['Lt. Ventricular width', 'left_ventricular_width'],
    ['Lt. Ventricular length', 'left_ventricular_length'],
  ]

  return (
    <div className="space-y-4">
      <Fieldset title="B-Mode measurements">
        <div className="mb-2 text-right text-blue-900">All measurements in cm</div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-3">
            {leftRows.map(([label, key]) => (
              <MeasurementRow key={key} label={label} value={report.biometry.b_mode[key]} onChange={(value) => updateReport(['biometry', 'b_mode', key], value)} />
            ))}
            <div className="grid gap-2 sm:grid-cols-3">
              <MeasurementRow label="Cardiac circ." value={report.biometry.b_mode.cardiac_circumference} onChange={(value) => updateReport(['biometry', 'b_mode', 'cardiac_circumference'], value)} compact />
              <MeasurementRow label="Thoracic circ." value={report.biometry.b_mode.thoracic_circumference} onChange={(value) => updateReport(['biometry', 'b_mode', 'thoracic_circumference'], value)} compact />
              <MeasurementRow label="CC/TC" value={report.biometry.b_mode.cc_tc} onChange={(value) => updateReport(['biometry', 'b_mode', 'cc_tc'], value)} compact />
            </div>
          </div>
          <div className="space-y-3">
            {rightRows.map(([label, key]) => (
              <MeasurementRow key={key} label={label} value={report.biometry.b_mode[key]} onChange={(value) => updateReport(['biometry', 'b_mode', key], value)} />
            ))}
          </div>
        </div>
      </Fieldset>

      <Fieldset title="M-Mode measurements">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
          <div className="space-y-3">
            {[
              ['RV wall', 'rv_wall'],
              ['LV Wall', 'lv_wall'],
              ['IVS', 'ivs'],
            ].map(([label, key]) => (
              <MeasurementRow key={key} label={label} value={report.biometry.m_mode[key]} onChange={(value) => updateReport(['biometry', 'm_mode', key], value)} />
            ))}
          </div>
          <div>
            <div className="mb-3">Shortening fraction of LV</div>
            <div className="grid gap-2 sm:max-w-md sm:grid-cols-3">
              {[
                ['LVSD', 'lvsd'],
                ['LVDD', 'lvdd'],
                ['SF', 'sf'],
              ].map(([label, key]) => (
                <label key={key} className="field-label">
                  {label}
                  <input className="legacy-input w-full" value={report.biometry.m_mode[key]} onChange={(event) => updateReport(['biometry', 'm_mode', key], event.target.value)} />
                </label>
              ))}
            </div>
          </div>
        </div>
      </Fieldset>
    </div>
  )
}

function DopplerTab({ report, updateReport }) {
  const venousRows = [
    ['Inferior vena cava', 'inferior_vena_cava'],
    ['Ductus venosus', 'ductus_venosus'],
  ]
  const valveRows = [
    ['Mitral valve', 'mitral'],
    ['Tricuspid valve', 'tricuspid'],
  ]

  return (
    <Fieldset className="overflow-x-auto">
      <div className="mb-3 grid min-w-[760px] grid-cols-[180px_repeat(5,minmax(88px,1fr))] gap-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        <span />
        <span>Vm</span>
        <span>Tamx</span>
        <span>Systolic peak</span>
        <span>Diastolic peak</span>
        <span>a wave</span>
      </div>
      {venousRows.map(([label, prefix]) => (
        <div key={prefix} className="mb-3 grid min-w-[760px] grid-cols-[180px_repeat(5,minmax(88px,1fr))] items-center gap-2">
          <span className="font-medium text-slate-700">{label}</span>
          {['vm', 'tamx', 'systolic_peak', 'diastolic_peak', 'a_wave'].map((suffix) => {
            const key = `${prefix}_${suffix}`
            return (
              <input
                key={key}
                className="legacy-input w-full"
                value={report.doppler.venous[key]}
                onChange={(event) => updateReport(['doppler', 'venous', key], event.target.value)}
              />
            )
          })}
        </div>
      ))}
      <MeasurementRow label="InferiorVenaCava PI" value={report.doppler.venous.inferior_vena_cava_pi} onChange={(value) => updateReport(['doppler', 'venous', 'inferior_vena_cava_pi'], value)} />
      <MeasurementRow label="DV PI" value={report.doppler.venous.dv_pi} onChange={(value) => updateReport(['doppler', 'venous', 'dv_pi'], value)} />

      <div className="mt-5 grid max-w-xl grid-cols-[180px_repeat(3,minmax(88px,1fr))] gap-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        <span />
        <span>E wave</span>
        <span>A wave</span>
        <span>E/A</span>
      </div>
      {valveRows.map(([label, prefix]) => (
        <div key={prefix} className="mb-3 grid max-w-xl grid-cols-[180px_repeat(3,minmax(88px,1fr))] items-center gap-2">
          <span className="font-medium text-slate-700">{label}</span>
          {['e_wave', 'a_wave', 'e_a'].map((suffix) => {
            const key = `${prefix}_${suffix}`
            return (
              <input
                key={key}
                className="legacy-input w-full"
                value={report.doppler.valves[key]}
                onChange={(event) => updateReport(['doppler', 'valves', key], event.target.value)}
              />
            )
          })}
        </div>
      ))}
      {[
        ['Aortic valve PSV', 'aortic_valve_psv'],
        ['Pulmonary valve PSV', 'pulmonary_valve_psv'],
        ['Ductus arteriosus PI', 'ductus_arteriosus_pi'],
      ].map(([label, key]) => (
        <MeasurementRow key={key} label={label} value={report.doppler.valves[key]} onChange={(value) => updateReport(['doppler', 'valves', key], value)} />
      ))}
      <LegacyField label="Pulmonary veins" value={report.doppler.venous.pulmonary_veins} onChange={(value) => updateReport(['doppler', 'venous', 'pulmonary_veins'], value)} withPlus />

      <div className="mt-4 font-semibold underline">MPI calculation (Measurements in 'ms')</div>
      <div className="mt-2 grid gap-6 lg:grid-cols-2">
        <MpiTable title="Method 1" values={report.doppler.mpi_method_1} update={(key, value) => updateReport(['doppler', 'mpi_method_1', key], value)} />
        <MpiTable title="Method 2" values={report.doppler.mpi_method_2} update={(key, value) => updateReport(['doppler', 'mpi_method_2', key], value)} method2 />
      </div>
    </Fieldset>
  )
}

function AorticTab({ report, updateReport }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Fieldset title="Aortic valve">
        <ValveMeasurement label="Annulus" value={report.aortic.aortic_valve.annulus} zValue={report.aortic.aortic_valve.z_score} onValue={(value) => updateReport(['aortic', 'aortic_valve', 'annulus'], value)} onZ={(value) => updateReport(['aortic', 'aortic_valve', 'z_score'], value)} />
        <RadioPair label="" options={['Thickened', 'Not thickened']} value={report.aortic.aortic_valve.thickened} onChange={(value) => updateReport(['aortic', 'aortic_valve', 'thickened'], value)} />
        <RadioPair label="" options={['Mobile', 'Immobile']} value={report.aortic.aortic_valve.mobility} onChange={(value) => updateReport(['aortic', 'aortic_valve', 'mobility'], value)} />
        <LegacyField label="Forward flow" value={report.aortic.aortic_valve.forward_flow} onChange={(value) => updateReport(['aortic', 'aortic_valve', 'forward_flow'], value)} withPlus />
        <ValveMeasurement label="Ascending aorta diameter" value={report.aortic.aortic_valve.ascending_aorta_diameter} zValue={report.aortic.aortic_valve.ascending_aorta_z_score} onValue={(value) => updateReport(['aortic', 'aortic_valve', 'ascending_aorta_diameter'], value)} onZ={(value) => updateReport(['aortic', 'aortic_valve', 'ascending_aorta_z_score'], value)} />
      </Fieldset>

      <Fieldset title="LV">
        <LegacyField label="Contractility" value={report.aortic.lv.contractility} onChange={(value) => updateReport(['aortic', 'lv', 'contractility'], value)} withPlus />
        <ValveMeasurement label="Width" value={report.aortic.lv.width} zValue={report.aortic.lv.width_z_score} onValue={(value) => updateReport(['aortic', 'lv', 'width'], value)} onZ={(value) => updateReport(['aortic', 'lv', 'width_z_score'], value)} />
        <ValveMeasurement label="Length" value={report.aortic.lv.length} zValue={report.aortic.lv.length_z_score} onValue={(value) => updateReport(['aortic', 'lv', 'length'], value)} onZ={(value) => updateReport(['aortic', 'lv', 'length_z_score'], value)} />
        <RadioPair label="EFE" options={['Present', 'Absent']} value={report.aortic.lv.efe} onChange={(value) => updateReport(['aortic', 'lv', 'efe'], value)} />
      </Fieldset>

      <Fieldset title="Mitral valve">
        <ValveMeasurement label="Annulus" value={report.aortic.mitral_valve.annulus} zValue={report.aortic.mitral_valve.z_score} onValue={(value) => updateReport(['aortic', 'mitral_valve', 'annulus'], value)} onZ={(value) => updateReport(['aortic', 'mitral_valve', 'z_score'], value)} />
        <RadioPair label="Inflow doppler" options={['Biphasic', 'Fused']} value={report.aortic.mitral_valve.inflow_doppler} onChange={(value) => updateReport(['aortic', 'mitral_valve', 'inflow_doppler'], value)} />
        <RadioPair label="MR" options={['Present', 'Absent']} value={report.aortic.mitral_valve.mr} onChange={(value) => updateReport(['aortic', 'mitral_valve', 'mr'], value)} />
      </Fieldset>

      <Fieldset title="Tricuspid valve">
        <ValveMeasurement label="Annulus" value={report.aortic.tricuspid_valve.annulus} zValue={report.aortic.tricuspid_valve.z_score} onValue={(value) => updateReport(['aortic', 'tricuspid_valve', 'annulus'], value)} onZ={(value) => updateReport(['aortic', 'tricuspid_valve', 'z_score'], value)} />
        <RadioPair label="TR" options={['Present', 'Absent']} value={report.aortic.tricuspid_valve.tr} onChange={(value) => updateReport(['aortic', 'tricuspid_valve', 'tr'], value)} />
      </Fieldset>

      <Fieldset title="Pulmonary valve">
        <MeasurementRow label="Annulus" value={report.aortic.pulmonary_valve.annulus} onChange={(value) => updateReport(['aortic', 'pulmonary_valve', 'annulus'], value)} suffix="(mm)" />
        <div className="font-semibold">Transverse arch :</div>
        <ValveMeasurement label="Diameter" value={report.aortic.pulmonary_valve.transverse_arch_diameter} zValue={report.aortic.pulmonary_valve.transverse_arch_z_score} onValue={(value) => updateReport(['aortic', 'pulmonary_valve', 'transverse_arch_diameter'], value)} onZ={(value) => updateReport(['aortic', 'pulmonary_valve', 'transverse_arch_z_score'], value)} />
        <RadioPair label="Flow" options={['Normal', 'Reversed']} value={report.aortic.pulmonary_valve.flow} onChange={(value) => updateReport(['aortic', 'pulmonary_valve', 'flow'], value)} />
      </Fieldset>

      <Fieldset title="Foramen ovale">
        <RadioPair label="Flow" options={['Normal', 'Reversed']} value={report.aortic.foramen_ovale.flow} onChange={(value) => updateReport(['aortic', 'foramen_ovale', 'flow'], value)} />
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
          <label className="mr-16 flex items-center gap-2 font-semibold text-green-700">
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

function LmpModal({ report, updateReport, onLmpDateChange, onClose, onSave }) {
  const ga = calculateGestationalAge(report.lmp.lmp_date)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold">
          <span className="text-lg text-slate-950">LMP details</span>
          <button type="button" onClick={onClose} className="toolbar-button px-3">
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
        <div className="space-y-5 p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={report.lmp.enabled} onChange={(event) => updateReport(['lmp', 'enabled'], event.target.checked)} />
              LMP Date
            </label>
            <label className="field-label">
              LMP Date
              <input type="date" className="field-control" value={report.lmp.lmp_date} onChange={(event) => onLmpDateChange(event.target.value)} />
            </label>
            <label className="field-label">
              EDD
              <input type="date" className="field-control" value={report.lmp.edd} onChange={(event) => updateReport(['lmp', 'edd'], event.target.value)} />
            </label>
            <span className="rounded-lg bg-blue-50 px-3 py-2 font-semibold italic text-blue-800 lg:col-span-3">LMP GA: {ga || '0 W 0 D'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label><input type="checkbox" checked={report.lmp.assigned_by === 'user'} onChange={(event) => updateReport(['lmp', 'assigned_by'], event.target.checked ? 'user' : 'lmp')} /> By user</label>
            <label><input type="radio" checked={report.lmp.et_date} onChange={(event) => updateReport(['lmp', 'et_date'], event.target.checked)} /> ET Date</label>
            <label><input type="radio" checked={report.lmp.bt_date} onChange={(event) => updateReport(['lmp', 'bt_date'], event.target.checked)} /> BT Date</label>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_180px] sm:items-end">
            <span className="rounded-lg bg-teal-50 px-3 py-3 text-center font-semibold italic text-teal-800">Assigned by LMP</span>
            <label className="field-label">
              No. of Fetus
              <select className="field-control" value={report.lmp.no_of_fetuses} onChange={(event) => updateReport(['lmp', 'no_of_fetuses'], event.target.value)}>
              <option>Single</option>
              <option>Twin</option>
              <option>Triplet</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" onClick={() => updateReport(['lmp'], deepClone(initialReport.lmp))} className="legacy-action-button">Delete</button>
            <button type="button" onClick={onClose} className="legacy-action-button">Close</button>
            <button type="button" onClick={onSave} className="primary-button">Save</button>
          </div>
          <p className="text-center text-sm font-semibold text-slate-600">Delete button will erase current scan information alone</p>
        </div>
      </div>
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

function LegacyField({ label, value, onChange, withPlus = false }) {
  return (
    <label className="grid min-w-0 gap-1 sm:grid-cols-[minmax(130px,0.8fr)_minmax(0,1fr)] sm:items-center">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="flex min-w-0 gap-2">
        <input className="legacy-input w-full" value={value || ''} onChange={(event) => onChange(event.target.value)} />
        {withPlus && <button type="button" className="legacy-plus-button">+</button>}
      </span>
    </label>
  )
}

function TwoColumnLegacyGrid({ rows, report, updateReport, withPlus = false }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {rows.map(([leftLabel, leftPath, rightLabel, rightPath]) => (
        <div key={leftLabel} className="contents">
          <LegacyField label={leftLabel} value={getByPath(report, leftPath)} onChange={(value) => updateReport(leftPath, value)} withPlus={withPlus} />
          {rightLabel && <LegacyField label={rightLabel} value={getByPath(report, rightPath)} onChange={(value) => updateReport(rightPath, value)} withPlus={withPlus} />}
        </div>
      ))}
    </div>
  )
}

function getByPath(source, path) {
  return path.reduce((value, key) => value?.[key], source) || ''
}

function MeasurementRow({ label, value, onChange, suffix = '', compact = false }) {
  return (
    <label className={`grid min-w-0 items-center gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-[minmax(150px,1fr)_minmax(90px,120px)_auto]'}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input className="legacy-input w-full" value={value || ''} onChange={(event) => onChange(event.target.value)} />
      {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
    </label>
  )
}

function ValveMeasurement({ label, value, zValue, onValue, onZ }) {
  return (
    <div className="mb-3 grid min-w-0 gap-2 sm:grid-cols-[minmax(150px,1fr)_minmax(90px,120px)_auto_auto_minmax(90px,120px)] sm:items-center">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input className="legacy-input w-full" value={value || ''} onChange={(event) => onValue(event.target.value)} />
      <span className="text-sm text-slate-500">(mm)</span>
      <span className="text-sm font-medium text-slate-700">Z score</span>
      <input className="legacy-input w-full" value={zValue || ''} onChange={(event) => onZ(event.target.value)} />
    </div>
  )
}

function RadioPair({ label, options, value, onChange }) {
  return (
    <div className="mb-3 grid min-w-0 gap-2 sm:grid-cols-[minmax(150px,1fr)_minmax(0,2fr)] sm:items-center">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="radio" checked={value === option} onChange={() => onChange(option)} />
            {option}
          </label>
        ))}
      </div>
    </div>
  )
}

function MpiTable({ title, values, update, method2 = false }) {
  const rows = method2
    ? [['ICT+IRT+ET', 'ict_irt_et'], ['ET', 'et'], ['MPI', 'mpi']]
    : [['ICT', 'ict'], ['IRT', 'irt'], ['ET', 'et'], ['MPI', 'mpi']]

  return (
    <div>
      <div className="mb-1 font-semibold underline">{title}</div>
      <div className="grid grid-cols-[minmax(90px,1fr)_minmax(80px,1fr)_minmax(80px,1fr)] gap-2">
        <span />
        <span className="font-semibold underline">RV</span>
        <span className="font-semibold underline">LV</span>
        {rows.map(([label, suffix]) => (
          <div key={suffix} className="contents">
            <span>{label}</span>
            <input className="legacy-input w-full" value={values[`rv_${suffix}`] || ''} onChange={(event) => update(`rv_${suffix}`, event.target.value)} />
            <input className="legacy-input w-full" value={values[`lv_${suffix}`] || ''} onChange={(event) => update(`lv_${suffix}`, event.target.value)} />
          </div>
        ))}
      </div>
    </div>
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

export default FetalEchoReport

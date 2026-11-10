import { blankReport, mergeReport } from '../reportValidation'
import { isDerivedPath, recalculateDerived, initializeDerived } from '../derivedMeasurements'
import { currentUser, useCompletionConfirmation, DerivedStatus, useDerivedDefinitions, ApprovalControls, FindingNotes, ClinicalFooter, ClinicalPreview, reportErrors, useSavedNavigation } from '../components/ClinicalWorkflow'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Cog,
  FileImage,
  FileText,
  FolderOpen,
  Image,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'

import ImagesModal from '../components/ImagesModal'
import ReportConfigModal from '../components/ReportConfigModal'
import SearchableSelect from '../components/SearchableSelect'
import ExistingScansModal from '../components/ExistingScansModal'
import ReferralLetterModal from '../components/ReferralLetterModal'

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
  no_of_fetuses: '',
  ga_weeks: '',
  ga_days: '',
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
    et_date: '',
    bt_date: false,
    no_of_fetuses: '',
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
    report_title: 'Fetal Echocardiography Report',
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

const fetalNormalComments = {
  general: {
    cardiac_views: 'Normal (Situs)',
    abdominal_situs: 'Normal',
    stomach: 'Left Sided',
    heart_size: 'Normal',
    apex: 'Normal',
    cardiac_axis: 'Normal',
    rhythm: 'Normal\n1:1 AV conduction',
    fhr: '137',
    pericardial_effusion: false,
  },
  four_chamber: {
    atria: 'Normal',
    ventricles: 'Normal',
    atrioventricular_junction: 'Concordant, normal av connection',
    atrioventricular_regurgitation: 'None',
    interventricular_septum: 'Intact (well seen)',
    ventricular_function: 'Normal',
    interatrial_septum: 'Normal (Foramen Ovale in mid third of septum, flap valve in LA)',
    foramen_ovale: 'Normal flow (Right to Left )',
  },
  outflow_tract: {
    outflow_tracts: 'Normal',
    great_arteries_relationship: 'Concordant',
    va_valve_regurgitation: 'None',
    branch_pulmonary_artery: 'Confluent, good sized',
    ductus_arteriosus: 'Normal in size and flow',
    aortic_arch: 'Normal',
    side_of_arch: 'Normal, left of trachea',
    three_vessel_view: 'Normal',
    three_vt_view: 'Normal',
  },
  others: {
    systemic_veins: 'Normal',
    pulmonary_veins: 'Normal',
    other_lesions: 'Normal origin of right subclavian artery',
  },
}

function FetalEchoReport() {
  const navigate = useNavigate()
  const calculationRules = useDerivedDefinitions()
  const {confirmCompletion,completionDialog}=useCompletionConfirmation()
  const { scanId } = useParams()
  const [searchParams] = useSearchParams()
  const [patients, setPatients] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '')
  const [selectedVisitId, setSelectedVisitId] = useState(searchParams.get('visitId') || '')
  const [activeMainTab, setActiveMainTab] = useState('scan')
  const [activeScanTab, setActiveScanTab] = useState('echo-details')
  const [activeImageTab, setActiveImageTab] = useState('images')
  const [isLmpOpen, setIsLmpOpen] = useState(!scanId)
  const [isImagesModalOpen, setIsImagesModalOpen] = useState(false)
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false)
  const [isExistingScansOpen, setIsExistingScansOpen] = useState(false)
  const [isReferralLetterOpen, setIsReferralLetterOpen] = useState(false)
  const [report, setReport] = useState(() => initializeDerived(blankReport(initialReport), 'Fetal Echo'))
  const [savedScanId, setSavedScanId] = useState(scanId || '')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [locked, setLocked] = useState(false)
  const { dirty, markSaved, navigateSection } = useSavedNavigation(report)

  const selectedPatient = useMemo(
    () => patients.find((patient) => String(patient.id) === String(selectedPatientId)),
    [patients, selectedPatientId],
  )

  const isNormalCommentsPopulated = useMemo(() => {
    const gen = report.echo_details?.general
    const fc = report.echo_details?.four_chamber
    const ot = report.echo_details?.outflow_tract
    const oth = report.echo_details?.others

    return Boolean(
      gen?.cardiac_views || gen?.abdominal_situs || gen?.stomach ||
      fc?.atria || fc?.ventricles || ot?.outflow_tracts || oth?.systemic_veins
    )
  }, [report.echo_details])

  const scatterNormalComments = () => {
    if (locked) return
    setReport((current) => ({
      ...current,
      echo_details: {
        ...current.echo_details,
        general: {
          ...current.echo_details.general,
          ...fetalNormalComments.general,
        },
        four_chamber: {
          ...current.echo_details.four_chamber,
          ...fetalNormalComments.four_chamber,
        },
        outflow_tract: {
          ...current.echo_details.outflow_tract,
          ...fetalNormalComments.outflow_tract,
        },
        others: {
          ...current.echo_details.others,
          ...fetalNormalComments.others,
        },
      },
      impression: {
        ...current.impression,
        final_impression: 'Fetal Echocardiography did not reveal any major abnormality in the structure, function or rhythm of the Fetal heart',
        disclaimer_comments: 'Limitation of Fetal Echocardiography is to be understood as intention of Fetal Echo is to rule out major cardiac defects and minor or evolving anomalies may not be detected. Sometimes it may not be possible to see certian types of holes or valve problems in fetal life. In addition heart rate/ rhythm problems or heart muscle diseases usually evolve during late gestation when second trimester scan may not show such abnormality.',
      },
    }))
  }

  const toggleNormalComments = () => {
    if (locked) return
    if (isNormalCommentsPopulated) {
      setReport((current) => ({
        ...current,
        echo_details: {
          ...current.echo_details,
          general: {
            ...current.echo_details.general,
            cardiac_views: '',
            abdominal_situs: '',
            stomach: '',
            heart_size: '',
            apex: '',
            cardiac_axis: '',
            rhythm: '',
          },
          four_chamber: {
            ...current.echo_details.four_chamber,
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
            ...current.echo_details.outflow_tract,
            outflow_tracts: '',
            va_valve_regurgitation: '',
            branch_pulmonary_artery: '',
            ductus_arteriosus: '',
            aortic_arch: '',
            side_of_arch: '',
            three_vessel_view: '',
            three_vt_view: '',
          },
          others: {
            ...current.echo_details.others,
            systemic_veins: '',
            pulmonary_veins: '',
          },
        },
      }))
    } else {
      scatterNormalComments()
    }
  }



  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const result = await patientService.getPatients()
        if (result.success) {
          setPatients(result.data)
        }
      } catch (error) {
        setStatusMessage('Unable to load patients. Refresh and retry.')
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
        setLocked(String(scan.status).toLowerCase() === 'completed')
        setSavedScanId(scan.id)
        setSelectedVisitId(scan.visit_id || '')
        const loadedReport = mergeReport(blankReport(initialReport), {
          ...(scan.fetal_echo_report || {}),
          indication: scan.indication || scan.indicator || scan.fetal_echo_report?.indication || '',
          tag: scan.tag || scan.fetal_echo_report?.tag || '',
          no_of_fetuses: scan.no_of_fetuses || scan.fetal_echo_report?.no_of_fetuses || '',
          ga_weeks: scan.ga_weeks || scan.fetal_echo_report?.ga_weeks || '',
          ga_days: scan.ga_days || scan.fetal_echo_report?.ga_days || '',
        })
        const normalized = recalculateDerived(loadedReport, calculationRules, 'Fetal Echo')
        setReport(normalized)
        markSaved(normalized)
        if(searchParams.get('preview')==='1')setIsReportPreviewOpen(true)
      } catch (error) {
        console.error('Error loading fetal echo scan:', error)
        setStatusMessage('Could not load this fetal echo report.')
      }
    }

    fetchScan()
  }, [scanId])

  useEffect(() => {
    const fields = document.querySelectorAll('.report-editor-form input, .report-editor-form select, .report-editor-form textarea')
    for (const field of fields) if (locked) field.disabled = true
    const wheel = e => { if (e.target instanceof HTMLInputElement && e.target.type === 'number' || e.target instanceof HTMLSelectElement) e.target.blur() }
    document.addEventListener('wheel', wheel, {passive:true})
    return () => document.removeEventListener('wheel', wheel)
  }, [locked, report])
  useEffect(() => {
    if(calculationRules.length && !locked)setReport(current=>recalculateDerived(current,calculationRules,'Fetal Echo'))
  }, [calculationRules, locked])
  const updateReport = (path, value) => {
    if (locked || isDerivedPath(path)) return
    setReport((current) => recalculateDerived(setNestedValue(current, path, value), calculationRules, 'Fetal Echo'))
    setStatusMessage('')
  }

  const handleLmpDateChange = value => updateReport(['lmp','lmp_date'], value)

  const handleSave = async () => {
    if (locked || isSaving) return false
    const errors = reportErrors(report, true, report.impression?.report_completed)
    if (errors.length) { setStatusMessage('Not saved. ' + errors.join(' ')); return false }
    if (report.impression?.report_completed && !(await confirmCompletion())) return false
    if (!selectedPatientId) {
      setStatusMessage('Select a patient before saving this fetal echo report.')
      return
    }
    if (!selectedVisitId) {
      setStatusMessage('Select or create a patient visit before saving this fetal echo report.')
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
        setReport(result.data.fetal_echo_report || report)
        markSaved(result.data.fetal_echo_report || report)
        setLocked(Boolean(report.impression?.report_completed))
        setStatusMessage('Fetal echo report saved.')

        if (!savedScanId) {
          const query = new URLSearchParams()
          query.set('patientId', selectedPatientId)
          if (selectedVisitId) query.set('visitId', selectedVisitId)
          navigate(`/fetal-echo-report/${nextScanId}?${query.toString()}`, { replace: true })
        }
        return true
      }
      setStatusMessage('Not saved. The server did not confirm the save.')
    } catch (error) {
      console.error('Error saving fetal echo report:', error)
      setStatusMessage(error.response?.data?.detail || 'Not saved. Please retry.')
    } finally {
      setIsSaving(false)
    }
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
    setReport(initializeDerived(blankReport(initialReport), 'Fetal Echo'))
    setStatusMessage('')
  }
  const step = activeMainTab === 'impression' ? scanTabs.length : scanTabs.findIndex(tab=>tab.id===activeScanTab)
  const changeStep = index => {
    if(index<0){setIsLmpOpen(true);return}
    setActiveMainTab(index===scanTabs.length?'impression':'scan')
    if(index<scanTabs.length)setActiveScanTab(scanTabs[index].id)
  }
  const saveAndNext = async () => {
    const errors=reportErrors(report,true,false,true)
    if(errors.length){setStatusMessage('Cannot advance. '+errors.join(' '));return}
    if(await handleSave())changeStep(step+1)
  }

  return (
    <>
      {completionDialog}
      <div data-locked={locked ? 'true' : 'false'} className="no-print report-editor-form min-h-0 flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 text-sm text-slate-900">
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
              <button
                type="button"
                onClick={scatterNormalComments}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                ✓ Fill Normal Scan
              </button>
              <ToolbarButton icon={Save} label={isSaving ? 'Saving' : 'Save'} onClick={handleSave} />
              {currentUser().role === 'L3' && <ToolbarButton icon={Trash2} label="Delete" onClick={handleDelete} />}
              <ToolbarButton icon={RotateCcw} label="Clear" onClick={handleClear} />
              <ToolbarButton icon={Printer} label="Preview" onClick={() => setIsReportPreviewOpen(true)} />
              <ToolbarButton icon={FileImage} label="Images" onClick={() => setIsImagesModalOpen(true)} />
              <ToolbarButton icon={X} label="Close" onClick={() => { if (!dirty || window.confirm('Discard unsaved report changes?')) navigate('/search') }} />
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
              <button
                type="button"
                onClick={() => setIsReferralLetterOpen(true)}
                className="legacy-small-button"
              >
                <FileText className="mr-1.5 h-4 w-4 text-blue-600" />
                Ref. Letter
              </button>
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
                  onClick={() => navigateSection(() => setActiveMainTab(tab.id), setStatusMessage, locked ? [] : reportErrors(report, true, false, true))}
                >
                  {tab.label}
                </TabButton>
              ))}
            </div>

            <div className="min-h-0 overflow-auto p-4">
              {activeMainTab === 'scan' ? (
                <ScanPanel
                  activeScanTab={activeScanTab}
                  setActiveScanTab={(tab) => navigateSection(() => setActiveScanTab(tab), setStatusMessage, locked ? [] : reportErrors(report, true, false, true))}
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
        </div>
      </div>

      {isLmpOpen && (
        <LmpModal
          report={report}
          updateReport={updateReport}
          onLmpDateChange={handleLmpDateChange}
          onClose={() => setIsLmpOpen(false)}
          onSave={handleSave}
          onNext={async()=>{const errors=reportErrors({...report,indication:'Profile navigation'},true,false,true);if(errors.length){setStatusMessage('Cannot advance. '+errors.join(' '));return}if(await handleSave())setIsLmpOpen(false)}}
          message={statusMessage}
          saving={isSaving} locked={locked}
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
      <ReferralLetterModal
        isOpen={isReferralLetterOpen}
        onClose={() => setIsReferralLetterOpen(false)}
        patient={selectedPatient}
        scanType="Fetal Echo"
        report={report}
        scanId={savedScanId || scanId}
      />
      <DerivedStatus report={report} />
      <FindingNotes report={report} updateReport={updateReport} />
      <ClinicalFooter onSave={handleSave} saving={isSaving} locked={locked} message={locked ? 'Completed report — read-only.' : statusMessage} patientId={selectedPatientId} onBack={()=>navigateSection(()=>changeStep(step-1),setStatusMessage)} onNext={step<scanTabs.length ? saveAndNext : undefined} />
    </div>
    {isReportPreviewOpen && (
      <ClinicalPreview title="Fetal Echocardiography"         report={report}
        patient={selectedPatient}
        status={dirty ? 'Unsaved changes' : locked ? 'Completed' : 'Draft / In Progress'}
        visitId={selectedVisitId}
        onClose={() => setIsReportPreviewOpen(false)}
      />
    )}

    </>
  )
}

function ScanPanel({ activeScanTab, setActiveScanTab, report, updateReport, onToggleNormalComments, isNormalCommentsPopulated }) {
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
      {activeScanTab === 'echo-details' && (
        <EchoDetailsTab
          report={report}
          updateReport={updateReport}
          onToggleNormalComments={onToggleNormalComments}
          isNormalCommentsPopulated={isNormalCommentsPopulated}
        />
      )}
      {activeScanTab === 'biometry' && <BiometryTab report={report} updateReport={updateReport} />}
      {activeScanTab === 'doppler' && <DopplerTab report={report} updateReport={updateReport} />}
      {activeScanTab === 'aortic' && <AorticTab report={report} updateReport={updateReport} />}
    </div>
  )
}

function EchoDetailsTab({ report, updateReport, onToggleNormalComments, isNormalCommentsPopulated }) {
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
                readOnly={key.endsWith('_e_a')} value={report.doppler.valves[key]}
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
      <div className="min-w-0 space-y-3"><ApprovalControls report={report} updateReport={updateReport} />
        <label className="field-label">Report title<input className="field-control" readOnly value="Fetal Echocardiography" /></label>
        <TextInput label="First line of report" value={impression.first_line} onChange={(value) => updateReport(['impression', 'first_line'], value)} />
        <TextArea label="Header comments - (F11 - Show previous header comments)" value={impression.header_comments} onChange={(value) => updateReport(['impression', 'header_comments'], value)} rows={3} />
        <TextArea label="Footer comments - (F11 - Show previous footer comments)" value={impression.footer_comments} onChange={(value) => updateReport(['impression', 'footer_comments'], value)} rows={3} />
        <div className="flex items-center justify-between">
          <span>Final impression-(F11-Show previous)</span>

        </div>
        <textarea className="h-32 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={impression.final_impression} onChange={(event) => updateReport(['impression', 'final_impression'], event.target.value)} />
        <TextArea label="Disclaimer comments - (F11 - Show previous disclaimer comments)" value={impression.disclaimer_comments} onChange={(value) => updateReport(['impression', 'disclaimer_comments'], value)} rows={3} />
        <TextArea label="Internal Comments (Will not be printed) - (F11 - Show previous internal comments)" value={impression.internal_comments} onChange={(value) => updateReport(['impression', 'internal_comments'], value)} rows={3} />
      </div>

      <aside className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="field-label">Internal report classification<select className="field-control" value={impression.classification || ''} onChange={e => updateReport(['impression','classification'], e.target.value)}><option value="">Select classification</option>{['Normal','Abnormal','Ambiguous'].map(v => <option key={v}>{v}</option>)}</select></label>
        <TextInput label="Primary consultant" value={impression.primary_consultant} onChange={(value) => updateReport(['impression', 'primary_consultant'], value)} />
        <TextArea label="Second consultant" value={impression.second_consultant} onChange={(value) => updateReport(['impression', 'second_consultant'], value)} rows={3} />
        <label className="field-label">Audited by<input className="field-control" readOnly value={impression.audited_by || ''} /></label>
        <TextArea label="Reviewed by" value={impression.reviewed_by} onChange={(value) => updateReport(['impression', 'reviewed_by'], value)} rows={3} />
        <label className="field-label">Report typed by<input className="field-control" readOnly value={impression.report_typed_by || ''} /></label>
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
            <button
              key={label}
              type="button"
              onClick={label === 'Print' ? () => setIsReportPreviewOpen(true) : undefined}
              className="legacy-small-button"
            >
              {label}
            </button>
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

function LmpModal({ report, updateReport, onLmpDateChange, onClose, onSave, onNext, message, saving, locked }) {
  const ga = report.ga_weeks ? `${report.ga_weeks} weeks ${report.ga_days || '0'} days (entered)` : ''

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
            <span className="rounded-lg bg-blue-50 px-3 py-2 font-semibold italic text-blue-800 lg:col-span-3">Gestation: {ga || 'Not entered — clinical calculation method awaits confirmation'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label><input type="checkbox" checked={report.lmp.assigned_by === 'user'} onChange={(event) => updateReport(['lmp', 'assigned_by'], event.target.checked ? 'user' : 'lmp')} /> By user</label>
            <label className="field-label">Embryo transfer date<input type="date" className="field-control" value={typeof report.lmp.et_date === 'string' ? report.lmp.et_date : ''} onChange={event => updateReport(['lmp', 'et_date'], event.target.value)} /></label>
            <label><input type="radio" checked={report.lmp.bt_date} onChange={(event) => updateReport(['lmp', 'bt_date'], event.target.checked)} /> BT Date</label>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_180px] sm:items-end">
            <span className="rounded-lg bg-teal-50 px-3 py-3 text-center font-semibold italic text-teal-800">Assigned by LMP</span>
            <label className="field-label">
              No. of Fetus
              <select className="field-control" value={report.no_of_fetuses} onChange={(event) => updateReport(['no_of_fetuses'], event.target.value)}>
              <option value="">Select number of fetuses</option>
              <option value="1">Single</option>
              <option value="2">Twin</option>
              <option value="3">Triplet</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" onClick={() => updateReport(['lmp'], deepClone(initialReport.lmp))} className="legacy-action-button">Delete</button>
            <button type="button" disabled={saving || locked} onClick={onNext} className="legacy-action-button">Save & next</button>
            <button type="button" disabled={saving || locked} onClick={onSave} className="primary-button">{locked ? 'Report locked' : 'Save draft'}</button>
          </div>
          <p role="status" className="text-red-700">{message}</p>
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

const fetalFieldOptions = {
  'Cardiac views': ['Normal (Situs)', 'Situs Inversus', 'Situs Ambiguus', 'Not Visualised'],
  'Abdominal situs': ['Normal', 'Inversus', 'Ambiguus', 'Left Sided', 'Right Sided'],
  'Stomach': ['Left Sided', 'Right Sided', 'Absent', 'Normal'],
  'Heart size': ['Normal', 'Enlarged', 'Small'],
  'Apex': ['Normal', 'Left Sided', 'Right Sided', 'Midline'],
  'Cardiac axis': ['Normal', 'Deviated Left', 'Deviated Right'],
  'Rhythm': ['Normal', 'Bradycardia', 'Tachycardia', 'Ectopic beats', 'Irregular'],
  'Atria': ['Normal', 'Dilated Right Atrium', 'Dilated Left Atrium', 'Single Atrium'],
  'Ventricles': ['Normal', 'Hypoplastic Left Ventricle', 'Hypoplastic Right Ventricle', 'Dilated'],
  'Atrioventricular junction': ['Concordant, normal', 'Discordant', 'Single Inlet', 'Double Inlet'],
  'Atrioventricular regurgitation': ['None', 'Tricuspid Regurgitation', 'Mitral Regurgitation', 'Mild', 'Moderate', 'Severe'],
  'Inter ventricular septum': ['Intact (well seen)', 'VSD (Perimembranous)', 'VSD (Muscular)', 'VSD (Inlet)', 'VSD (Outlet)'],
  'Ventricular function': ['Normal', 'Depressed LV Function', 'Depressed RV Function', 'Biventricular Dysfunction'],
  'Inter atrial septum': ['Normal (Foramen Oval Flap Seen)', 'ASD (Secundum)', 'ASD (Primum)', 'Intact'],
  'Foramen ovale': ['Normal flow (Right to Left)', 'Restricted Flow', 'Reversed Flow (Left to Right)'],
  'Outflow tracts': ['Normal', 'Transposition of Great Arteries', 'Tetralogy of Fallot', 'Truncus Arteriosus', 'Double Outlet RV'],
  'V-A valve regurgitation': ['None', 'Aortic Regurgitation', 'Pulmonary Regurgitation', 'Mild', 'Moderate', 'Severe'],
  'Branch pulmonary artery': ['Confluent, good size', 'Hypoplastic RPA', 'Hypoplastic LPA', 'Stenotic'],
  'Ductus arteriosus': ['Normal in size and direction', 'Constricted', 'Absent', 'Reversed Flow'],
  'Aortic arch': ['Normal', 'Coarctation', 'Hypoplastic Arch', 'Interrupted Arch'],
  'Side of arch': ['Normal, left of trachea', 'Right Arch', 'Double Arch'],
  '3VV': ['Normal', 'Abnormal Vessel Size', 'Abnormal Alignment'],
  '3VT view': ['Normal', 'V-Sign Normal', 'U-Sign / Right Arch', 'Single Vessel'],
  'Systemic veins': ['Normal', 'Persistent Left SVC', 'Interrupted IVC with Azygos Continuation'],
  'Pulmonary veins': ['Normal', 'TAPVC', 'PAPVC', 'Partial Anomalous'],
}

function LegacyField({ label, value, onChange, withPlus = false }) {
  const options = fetalFieldOptions[label] || ['Normal', 'Abnormal', 'Not Visualised']
  const listId = `dl-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`

  return (
    <label className="grid min-w-0 gap-1 sm:grid-cols-[minmax(140px,0.85fr)_minmax(0,1fr)] sm:items-center">
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
          {options.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
        {withPlus && (
          <button
            type="button"
            className="legacy-plus-button"
            title={`Add custom option for ${label}`}
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
      <input readOnly={/\bMPI\b|\bPI\b|TDIMPI|E\/A|E\/E/i.test(label)} placeholder={/\bMPI\b|\bPI\b|TDIMPI|E\/A|E\/E/i.test(label) ? 'Awaiting approved formula' : ''} className="legacy-input w-full" value={value || ''} onChange={(event) => onChange(event.target.value)} />
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
            <input className="legacy-input w-full" readOnly={suffix === 'mpi'} aria-label={'RV '+suffix} placeholder={suffix === 'mpi' ? 'Awaiting approved formula' : ''} value={values[`rv_${suffix}`] || ''} onChange={(event) => update(`rv_${suffix}`, event.target.value)} />
            <input className="legacy-input w-full" readOnly={suffix === 'mpi'} aria-label={'LV '+suffix} placeholder={suffix === 'mpi' ? 'Awaiting approved formula' : ''} value={values[`lv_${suffix}`] || ''} onChange={(event) => update(`lv_${suffix}`, event.target.value)} />
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

function formatDisplayDate(date) {
  if (!date) return new Date().toLocaleDateString('en-GB')
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString('en-GB')
  return d.toLocaleDateString('en-GB')
}

function getDoctorProfile(consultantName) {
  try {
    const saved = localStorage.getItem('echoai_doctor_profile')
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        name: consultantName || parsed.name || '',
        degrees: parsed.degrees || '',
        registrationNo: parsed.registrationNo || '',
      }
    }
    const user = localStorage.getItem('echoai_user') || sessionStorage.getItem('echoai_user')
    if (user) {
      const parsed = JSON.parse(user)
      return {
        name: consultantName || parsed.name || '',
        degrees: '',
        registrationNo: '',
      }
    }
  } catch { /* Render only the report's explicitly entered consultant data. */ }
  return { name: consultantName || '', degrees: '', registrationNo: '' }
}

function PatientHeaderTable({ patient, visitId, visitDate }) {
  const patientName = getPatientName(patient) || '—'
  const age = patient?.age ? `${patient.age} Years` : ''
  const ageSex = [age, patient?.gender].filter(Boolean).join(' / ') || '—'
  const patientId = patient?.patient_id || '—'
  const visitNo = visitId || '—'
  const refBy = patient?.family_doctor || patient?.referral_doctor || '—'

  return (
    <table className="document-patient-table">
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
          <td className="td-val">{visitDate}</td>
        </tr>
      </tbody>
    </table>
  )
}

function FetalDocumentPages({ report, patient, visitId }) {
  const gen = report.echo_details?.general || {}
  const fc = report.echo_details?.four_chamber || {}
  const ot = report.echo_details?.outflow_tract || {}
  const oth = report.echo_details?.others || {}
  const bio = report.biometry?.b_mode || {}
  const imp = report.impression || {}
  const doctor = getDoctorProfile(imp.primary_consultant)

  const patientName = getPatientName(patient) || '—'
  const ageId = [patient?.age ? `${patient.age} Y` : '', patient?.patient_id || ''].filter(Boolean).join(' / ') || '—'
  const refBy = patient?.family_doctor || patient?.referral_doctor || '—'
  const show = (value) => value === null || value === undefined || value === '' ? '—' : value
  const gaParts = [report.ga_weeks ? `${report.ga_weeks} Weeks` : '', report.ga_days && report.ga_days !== '0' ? `${report.ga_days} Days` : ''].filter(Boolean)
  const gaText = gaParts.join(' ') || '—'
  const indicationText = show(report.indication)
  const qualityText = show(report.echo_details?.general?.quality || report.quality)

  return (
    <div className="report-template-sheet printable-report">
      {/* Master Header - Centered with dark blue underline */}
      <div className="report-template-header">
        <h1>{imp.report_title || 'FETAL ECHOCARDIOGRAPHY REPORT'}</h1>
      </div>

      {/* Patient Info Grid - ONLY at top of report (never repeated) */}
      <div className="report-patient-grid">
        <div><strong>Patient Name:</strong> {patientName}</div>
        <div><strong>Age / ID:</strong> {ageId}</div>
        <div><strong>Ref By:</strong> {refBy}</div>
        <div><strong>LMP:</strong> {report.lmp?.lmp_date || '—'}</div>
        <div><strong>EDD:</strong> {report.lmp?.edd || '—'}</div>
        <div><strong>GA:</strong> {gaText}</div>
      </div>

      <div className="flex items-center gap-3 mb-2 px-1 text-xs text-slate-800">
        <div><strong>Indication:</strong> {indicationText}</div>
        <span className="text-slate-400">|</span>
        <div><strong>Quality:</strong> {qualityText}</div>
      </div>

      {/* 1. Structure, Situs & Position */}
      <div className="report-section-banner">1. Structure, Situs & Position</div>
      <table className="report-data-table">
        <tbody>
          <tr>
            <td className="row-label">Abdominal Situs</td>
            <td>{show(gen.abdominal_situs)}</td>
          </tr>
          <tr>
            <td className="row-label">Cardiac Situs</td>
            <td>{show(gen.cardiac_views)}</td>
          </tr>
          <tr>
            <td className="row-label">Cardiac Position</td>
            <td>{show(gen.apex)}</td>
          </tr>
          <tr>
            <td className="row-label">Cardiac Axis</td>
            <td>{show(gen.cardiac_axis)}</td>
          </tr>
        </tbody>
      </table>

      {/* 2. Venous Connections & Atria */}
      <div className="report-section-banner">2. Venous Connections & Atria</div>
      <table className="report-data-table">
        <tbody>
          <tr>
            <td className="row-label">Systemic Vein</td>
            <td>{show(oth.systemic_veins)}</td>
          </tr>
          <tr>
            <td className="row-label">Pulmonary Veins</td>
            <td>{show(oth.pulmonary_veins)}</td>
          </tr>
          <tr>
            <td className="sub-label">Left Atrium</td>
            <td>{show(fc.left_atrium || fc.atria)}</td>
          </tr>
          <tr>
            <td className="sub-label">Right Atrium</td>
            <td>{show(fc.right_atrium || fc.atria)}</td>
          </tr>
          <tr>
            <td className="row-label">Inter-atrial Septum</td>
            <td>{show(fc.interatrial_septum)}</td>
          </tr>
          <tr>
            <td className="sub-label">Foramen-ovale flap</td>
            <td>{show(fc.foramen_ovale)}</td>
          </tr>
        </tbody>
      </table>

      {/* 3. AV Junction, Valves & Ventricles */}
      <div className="report-section-banner">3. AV Junction, Valves & Ventricles</div>
      <table className="report-data-table">
        <tbody>
          <tr>
            <td className="row-label">AV Junction/Crux</td>
            <td>{show(fc.atrioventricular_junction)}</td>
          </tr>
          <tr>
            <td className="row-label">AV Connection</td>
            <td>{show(fc.atrioventricular_connection)}</td>
          </tr>
          <tr>
            <td className="sub-label">Tricuspid Valve</td>
            <td>{show(fc.tricuspid_valve || fc.atrioventricular_regurgitation)}</td>
          </tr>
          <tr>
            <td className="sub-label">Mitral Valve</td>
            <td>{show(fc.mitral_valve || fc.atrioventricular_regurgitation)}</td>
          </tr>
          <tr>
            <td className="row-label">Right Ventricle</td>
            <td>{show(fc.right_ventricle || fc.ventricles)}</td>
          </tr>
          <tr>
            <td className="row-label">Left Ventricle</td>
            <td>{show(fc.left_ventricle || fc.ventricular_function)}</td>
          </tr>
          <tr>
            <td className="row-label">Interventricular Septum</td>
            <td>{show(fc.interventricular_septum)}</td>
          </tr>
        </tbody>
      </table>

      {/* 4. Outflow Tracts & Arches */}
      <div className="report-section-banner avoid-break">4. Outflow Tracts & Arches</div>
      <table className="report-data-table avoid-break">
        <tbody>
          <tr>
            <td className="row-label">VA Connection</td>
            <td>{show(ot.ventriculoarterial_connection)}</td>
          </tr>
          <tr>
            <td className="row-label">Aortic Valve</td>
            <td>{show(ot.outflow_tracts)}</td>
          </tr>
          <tr>
            <td className="row-label">Aorta (Size/Pos)</td>
            <td>{show(ot.aortic_arch)}</td>
          </tr>
          <tr>
            <td className="row-label">Pulmonary Valve</td>
            <td>{show(ot.pulmonary_valve || ot.va_valve_regurgitation)}</td>
          </tr>
          <tr>
            <td className="row-label">Main Pulm. Artery</td>
            <td>{show(ot.main_pulmonary_artery)}</td>
          </tr>
          <tr>
            <td className="row-label">Branch Pulm. Art.</td>
            <td>{show(ot.branch_pulmonary_artery)}</td>
          </tr>
          <tr>
            <td className="row-label">Aortic Arch</td>
            <td>{show(ot.side_of_arch)}</td>
          </tr>
          <tr>
            <td className="row-label">Ductal Arch</td>
            <td>{show(ot.ductus_arteriosus)}</td>
          </tr>
        </tbody>
      </table>

      {/* 5. Biometry & Z-Scores */}
      <div className="report-section-banner avoid-break">5. Biometry & Z-Scores</div>
      <table className="report-data-table avoid-break">
        <thead>
          <tr>
            <th>Structure Annulus</th>
            <th>Diameter (mm)</th>
            <th>Z-Score</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Mitral Valve (LV)</td>
            <td>{show(bio.mitral_valve)}</td>
            <td>{bio.mitral_valve_z || '—'}</td>
          </tr>
          <tr>
            <td>Tricuspid Valve (RV)</td>
            <td>{show(bio.tricuspid_valve)}</td>
            <td>{bio.tricuspid_valve_z || '—'}</td>
          </tr>
          <tr>
            <td>Aortic Valve</td>
            <td>{show(bio.aortic_valve)}</td>
            <td>{bio.aortic_valve_z || '—'}</td>
          </tr>
          <tr>
            <td>Pulmonary Valve</td>
            <td>{show(bio.pulmonary_valve)}</td>
            <td>{bio.pulmonary_valve_z || '—'}</td>
          </tr>
          <tr style={{ background: '#f0f7ff' }}>
            <td colSpan={2}>
              <strong>RV / LV Ratio</strong>
            </td>
            <td>
              <span className="report-ratio-badge">{show(bio.rv_lv_ratio)}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 6. Pulsed Doppler Analysis */}
      <div className="report-section-banner avoid-break">6. Pulsed Doppler Analysis (cm/sec)</div>
      <table className="report-data-table avoid-break">
        <thead>
          <tr>
            <th>Site</th>
            <th>Flow Pattern</th>
            <th>Peak Vel</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tricuspid (TV) Inflow</td>
            <td>{show(report.doppler?.valves?.tricuspid_flow_pattern)}</td>
            <td>{show(report.doppler?.valves?.tricuspid_peak_velocity)}</td>
          </tr>
          <tr>
            <td>Mitral (MV) Inflow</td>
            <td>{show(report.doppler?.valves?.mitral_flow_pattern)}</td>
            <td>{show(report.doppler?.valves?.mitral_peak_velocity)}</td>
          </tr>
          <tr>
            <td>LVOT / Aorta</td>
            <td>{show(report.doppler?.valves?.aortic_flow_pattern)}</td>
            <td>{show(report.doppler?.valves?.aortic_peak_velocity)}</td>
          </tr>
          <tr>
            <td>RVOT / Pulm Artery</td>
            <td>{show(report.doppler?.valves?.pulmonary_flow_pattern)}</td>
            <td>{show(report.doppler?.valves?.pulmonary_peak_velocity)}</td>
          </tr>
          <tr>
            <td>Ductus Arteriosus</td>
            <td>{show(report.doppler?.valves?.ductus_arteriosus_flow_pattern)}</td>
            <td>{show(report.doppler?.valves?.ductus_arteriosus_peak_velocity)}</td>
          </tr>
          <tr>
            <td>Ductus Venosus</td>
            <td>{show(report.doppler?.venous?.ductus_venosus_flow_pattern)}</td>
            <td>{show(report.doppler?.venous?.ductus_venosus_systolic_peak)}</td>
          </tr>
          <tr>
            <td>Pulmonary Venous</td>
            <td>{show(report.doppler?.venous?.pulmonary_veins_flow_pattern)}</td>
            <td>{show(report.doppler?.venous?.pulmonary_veins)}</td>
          </tr>
          <tr>
            <td>Foramen-Ovale Shunt</td>
            <td>{show(report.doppler?.venous?.foramen_ovale_flow_pattern)}</td>
            <td>{show(report.doppler?.venous?.foramen_ovale)}</td>
          </tr>
        </tbody>
      </table>

      {/* 7. Fetal Heart Rate & Rhythm */}
      <div className="report-section-banner avoid-break">7. Fetal Heart Rate & Rhythm</div>
      <table className="report-data-table avoid-break">
        <tbody>
          <tr>
            <td className="row-label">Rate</td>
            <td>{gen.fhr ? `${gen.fhr} bpm` : '—'}</td>
          </tr>
          <tr>
            <td className="row-label">Rhythm</td>
            <td>{show(gen.rhythm)}</td>
          </tr>
        </tbody>
      </table>

      {/* Final Impression */}
      <div className="report-section-banner avoid-break">Final Impression</div>
      <div className="avoid-break my-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs leading-relaxed text-black font-medium whitespace-pre-line">
        {show(imp.final_impression)}
      </div>

      {/* Doctor Signature Block */}
      <div className="mt-6 mb-3 avoid-break">
        <div className="h-10 flex items-end">
          {doctor.name && <span className="text-sm font-semibold">{doctor.name}</span>}
        </div>
        <div className="font-bold text-xs uppercase text-black mt-1">
          {[doctor.name, doctor.degrees].filter(Boolean).join(' ')}
        </div>
      </div>

      {/* Disclaimer & PCPNDT */}
      {(imp.disclaimer_comments || doctor.registrationNo) && <div className="mt-4 pt-2 border-t border-slate-300 text-[10.5px] leading-relaxed text-slate-800 avoid-break">
        <div className="font-bold text-black mb-0.5">Disclaimer</div>
        <p className="mb-1 text-justify">
          {imp.disclaimer_comments || ''}
        </p>
        {doctor.registrationNo && <div className="font-semibold text-black">PCPNDT registration number {doctor.registrationNo}</div>}
      </div>}
    </div>
  )
}

function ReportPreviewModal({ report, patient, visitId, onClose }) {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [zoom, setZoom] = useState(100)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-sm preview-modal-backdrop">
      {/* Top Toolbar */}
      <div className="no-print preview-modal-toolbar flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Printer className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Fetal Echo Report Preview</h2>
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
            onClick={() => setIsReportPreviewOpen(true)}
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
          className="w-full max-w-4xl"
        >
          <FetalDocumentPages report={report} patient={patient} visitId={visitId} />
        </div>
      </div>

      <ReportConfigModal
        open={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  )
}

function FetalPrintReport({ report, patient, visitId, isReportPreviewOpen }) {
  if (isReportPreviewOpen) return null

  return (
    <div className="printable-report hidden print:block">
      <FetalDocumentPages report={report} patient={patient} visitId={visitId} />
    </div>
  )
}

export default FetalEchoReport

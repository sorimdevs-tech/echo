import EditableOptions from '../components/EditableOptions'
import { blankReport, mergeReport, reportSaveError } from '../reportValidation'
import { isDerivedPath, recalculateDerived, initializeDerived } from '../derivedMeasurements'
import { currentUser, useCompletionConfirmation, useDerivedDefinitions, ApprovalControls, ClinicalFooter, ClinicalPreview, reportErrors, useSavedNavigation } from '../components/ClinicalWorkflow'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
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
import SearchableSelect from '../components/SearchableSelect'
import ExistingScansModal from '../components/ExistingScansModal'
import ReferralLetterModal from '../components/ReferralLetterModal'
import AddableSelect from '../components/AddableSelect'

const ClinicalComments = createContext(null)

const scanTabs = [
  { id: 'echo-details', label: 'Echo details' },
  { id: 'aortic', label: 'Aortic' },
  { id: 'biometry', label: 'Biometry' },
  { id: 'doppler', label: 'Doppler' },
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
  const [activeScanTab, setActiveScanTab] = useState('lmp')
  const [visits, setVisits] = useState([])
  const [activeImageTab, setActiveImageTab] = useState('images')
  const [isImagesModalOpen, setIsImagesModalOpen] = useState(false)
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false)
  const [isExistingScansOpen, setIsExistingScansOpen] = useState(false)
  const [isReferralLetterOpen, setIsReferralLetterOpen] = useState(false)
  const [report, setReport] = useState(() => initializeDerived(blankReport(initialReport), 'Fetal Echo'))
  const [savedScanId, setSavedScanId] = useState(scanId || '')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [progressValidationAttempted, setProgressValidationAttempted] = useState(false)
  const [savedReportPath, setSavedReportPath] = useState('')
  const [locked, setLocked] = useState(false)
  const { dirty, navigationDialog, markSaved, navigateSection } = useSavedNavigation(report)

  useEffect(() => {
    if (savedReportPath && !dirty) {
      navigate(savedReportPath, { replace: true })
      setSavedReportPath('')
    }
  }, [savedReportPath, dirty, navigate])

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
    if (!selectedPatientId) { setVisits([]); return }
    let active = true
    patientService.getVisits(selectedPatientId).then(result => {
      if (active) setVisits(result.data || [])
    }).catch(() => { if (active) setStatusMessage('Unable to load visits for this patient.') })
    return () => { active = false }
  }, [selectedPatientId])

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
        if (!active) return
        console.error('Error loading fetal echo scan:', error)
        setStatusMessage('Could not load this fetal echo report.')
      }
    }

    fetchScan()
    return () => { active = false }
  }, [scanId])

  useEffect(() => {
    const fields = document.querySelectorAll('.report-editor-form input, .report-editor-form select, .report-editor-form textarea')
    for (const field of fields) field.disabled = locked || isSaving || field.dataset.roleLocked === 'true'
    const wheel = e => { if (e.target instanceof HTMLInputElement && e.target.type === 'number' || e.target instanceof HTMLSelectElement) e.target.blur() }
    document.addEventListener('wheel', wheel, {passive:true})
    return () => document.removeEventListener('wheel', wheel)
  }, [locked, report, isSaving])
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
          setSavedReportPath(`/fetal-echo-report/${nextScanId}?${query.toString()}`)
        }
        return true
      }
      setStatusMessage('Not saved. The server did not confirm the save.')
    } catch (error) {
      console.error('Error saving fetal echo report:', error)
      setStatusMessage(reportSaveError(error))
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
  const steps = ['lmp', ...scanTabs.map(tab => tab.id), 'impression']
  const step = steps.indexOf(activeScanTab)
  const changeStep = index => { if (steps[index]) setActiveScanTab(steps[index]) }
  const saveAndNext = async () => {
    const errors = reportErrors(report, true, false, true)
    if (errors.length) {
      setProgressValidationAttempted(true)
      setActiveScanTab('lmp')
      setStatusMessage(errors.join(' '))
      return
    }
    if(await handleSave())changeStep(step+1)
  }
  const openReportSection = id => {
    const target = steps.indexOf(id)
    if (target <= step || locked) { setActiveScanTab(id); return }
    const errors = reportErrors(report, true, false, true)
    if (errors.length) {
      setProgressValidationAttempted(true)
      setActiveScanTab('lmp')
      setStatusMessage(errors.join(' '))
      return
    }
    navigateSection(() => setActiveScanTab(id), setStatusMessage)
  }

  return (
    <>
      {completionDialog}{navigationDialog}
      <div data-locked={locked ? 'true' : 'false'} className="no-print report-editor-form min-h-0 flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 text-sm text-slate-900">
      <div className="flex min-h-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div><h2 className="text-xl font-semibold">Fetal Echo reporting</h2><p className="text-sm text-slate-500">Patient-linked measurements, images, impression, referral letter and report output.</p></div>
          <div className="flex gap-2"><span className="field-control">Fetal Echo</span><button type="button" onClick={handleSave} disabled={locked || isSaving} className="primary-button"><Save className="h-4 w-4" />{isSaving ? 'Saving…' : 'Save report'}</button></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setIsExistingScansOpen(true)} className="secondary-button"><FolderOpen className="h-4 w-4" />Open existing scans</button>
          <button type="button" onClick={() => setIsReferralLetterOpen(true)} className="secondary-button"><FileText className="h-4 w-4" />Ref. Letter</button>
          <button type="button" onClick={() => { setActiveImageTab('images'); setIsImagesModalOpen(true) }} className="secondary-button"><FileImage className="h-4 w-4" />Images</button>
          <button type="button" disabled={locked} onClick={scatterNormalComments} className="secondary-button">Fill normal scan</button>
        </div>
        <section className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-4 border-b pb-3 font-semibold">Patient and visit</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="field-label"><span>Patient</span><SearchableSelect options={patients.map(p => ({value:p.id,label:`${p.patient_id || ''} — ${getPatientName(p)}`}))} value={selectedPatientId} disabled={Boolean(scanId || savedScanId || selectedVisitId) || isSaving} onChange={setSelectedPatientId} placeholder="Select patient" searchPlaceholder="Search patient ID or name..." /></div>
            <label className="field-label">Visit<select className="field-control" value={selectedVisitId} disabled={Boolean(scanId || savedScanId) || isSaving} onChange={e=>setSelectedVisitId(e.target.value)}><option value="">Select visit</option>{visits.map(v=><option key={v.id} value={v.id}>{v.visit_date ? new Date(v.visit_date).toLocaleString() : `Visit ${v.id}`}</option>)}</select></label>
            <label className="field-label">Report title<input className="field-control" readOnly value="Fetal Echocardiography" /></label>
            <HeaderField label="Indication" value={report.indication} onChange={value=>updateReport(['indication'],value)} className={progressValidationAttempted && !String(report.indication || '').trim() ? '[&_input]:border-red-500 [&_input]:ring-1 [&_input]:ring-red-300' : ''} />
          </div>
        </section>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="field-label">Investigation status<select className="field-control" data-role-locked={currentUser().role !== 'L3' ? 'true' : undefined} disabled={locked || currentUser().role !== 'L3'} value={report.impression.report_completed ? 'completed' : 'in-progress'} onChange={e=>updateReport(['impression','report_completed'],e.target.value==='completed')}><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Fetal report sections">
          {[{id:'lmp',label:'LMP details'},...scanTabs,{id:'impression',label:'Impression'},{id:'multiframes',label:'Multiframes'},{id:'preview',label:'Preview'}].map(tab => <TabButton key={tab.id} active={activeScanTab===tab.id} onClick={()=>{if(tab.id==='preview'){setIsReportPreviewOpen(true);return} if(tab.id==='multiframes'){setActiveImageTab('videos');setIsImagesModalOpen(true);return} openReportSection(tab.id)}}>{tab.label}</TabButton>)}
        </div>
        <ClinicalComments.Provider value={{report, updateReport}}>
        <section className="min-w-0 flex-1 rounded-xl border border-slate-200 p-4">
          {activeScanTab==='lmp' && <PregnancyDating report={report} updateReport={updateReport} onLmpDateChange={handleLmpDateChange} validationAttempted={progressValidationAttempted} />}
          {activeScanTab==='echo-details' && <EchoDetailsTab report={report} updateReport={updateReport} onToggleNormalComments={toggleNormalComments} isNormalCommentsPopulated={isNormalCommentsPopulated} />}
          {activeScanTab==='aortic' && <AorticTab report={report} updateReport={updateReport} />}
          {activeScanTab==='biometry' && <BiometryTab report={report} updateReport={updateReport} />}
          {activeScanTab==='doppler' && <DopplerTab report={report} updateReport={updateReport} />}
          {activeScanTab==='impression' && <ImpressionPanel report={report} updateReport={updateReport} scanId={savedScanId || scanId} locked={locked} />}
        </section></ClinicalComments.Provider>
      </div>

      <ImagesModal
        open={isImagesModalOpen}
        initialTab={activeImageTab}
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
      <ClinicalFooter onSave={handleSave} saving={isSaving} locked={locked} message={locked ? 'Completed report — read-only.' : statusMessage} patientId={selectedPatientId} onBack={()=>changeStep(step-1)} onNext={step<steps.length-1 ? saveAndNext : undefined} />
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

function PregnancyDating({ report, updateReport, onLmpDateChange, validationAttempted }) {
  const missingDate = validationAttempted && ![report.lmp.lmp_date, report.lmp.edd, report.lmp.et_date].some(Boolean)
  const missingCount = validationAttempted && !/^[1-9]\d*$/.test(String(report.no_of_fetuses || ''))
  return <div>
    <h3 className="mb-1 border-b pb-3 font-semibold">Pregnancy dating <span aria-hidden="true" className="text-red-600">*</span></h3><p className="mb-3 text-xs text-slate-600">Enter at least one: LMP, EDD, or embryo transfer date.</p>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className="field-label">LMP<input type="date" max={new Date().toISOString().slice(0,10)} aria-invalid={missingDate} className={`field-control ${missingDate ? 'border-red-500 ring-1 ring-red-300' : ''}`} value={report.lmp.lmp_date || ''} onChange={e=>onLmpDateChange(e.target.value)} /></label>
      <label className="field-label">EDD<input type="date" aria-invalid={missingDate} className={`field-control ${missingDate ? 'border-red-500 ring-1 ring-red-300' : ''}`} value={report.lmp.edd || ''} onChange={e=>updateReport(['lmp','edd'],e.target.value)} /></label>
      <label className="field-label">Gestational age – weeks<input type="number" min="0" max="45" step="1" className="field-control" value={report.ga_weeks || ''} onChange={e=>updateReport(['ga_weeks'],e.target.value)} /></label>
      <label className="field-label">Days<input type="number" min="0" max="6" step="1" className="field-control" value={report.ga_days || ''} onChange={e=>updateReport(['ga_days'],e.target.value)} /></label>
      <div className="field-label"><span>Dating method</span><AddableSelect field="fetal_dating_method" value={report.lmp.assigned_by} options={['lmp','user']} onChange={value=>updateReport(['lmp','assigned_by'],value)} /></div>
      <label className="field-label">Embryo transfer date<input type="date" max={new Date().toISOString().slice(0,10)} aria-invalid={missingDate} className={`field-control ${missingDate ? 'border-red-500 ring-1 ring-red-300' : ''}`} value={typeof report.lmp.et_date === 'string' ? report.lmp.et_date : ''} onChange={e=>updateReport(['lmp','et_date'],e.target.value)} /></label>
      <label className="field-label">Blastocyst transfer date<input type="date" className="field-control" value={report.lmp.blastocyst_transfer_date || ''} onChange={e=>updateReport(['lmp','blastocyst_transfer_date'],e.target.value)} /></label>
      <div className="field-label"><span className={missingCount ? 'text-red-700' : ''}>Number of fetuses <span aria-hidden="true" className="text-red-600">*</span></span><AddableSelect field="fetal_count" aria-label="Number of fetuses" className={`field-control ${missingCount ? 'border-red-500 ring-1 ring-red-300' : ''}`} value={String(report.no_of_fetuses || '')} options={['1','2','3']} onChange={value=>updateReport(['no_of_fetuses'],value)} /></div>
    </div>
  </div>
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
          <FindingComment label="Pericardial effusion" value={report.echo_details.general.pericardial_effusion_comments} onChange={value=>updateReport(['echo_details','general','pericardial_effusion_comments'],value)} />
          <InlineField label="FHR" value={report.echo_details.general.fhr} onChange={(value) => updateReport(['echo_details', 'general', 'fhr'], value)} width="w-16" />
          <FindingComment label="FHR" value={report.echo_details.general.fhr_comments} onChange={value=>updateReport(['echo_details','general','fhr_comments'],value)} />
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
            <LegacyField label="Systemic veins" value={report.echo_details.others.systemic_veins} onChange={(value) => updateReport(['echo_details', 'others', 'systemic_veins'], value)} comment={report.echo_details.others.systemic_veins_comments} onComment={value => updateReport(['echo_details','others','systemic_veins_comments'],value)} withPlus />
            <LegacyField label="Pulmonary veins" value={report.echo_details.others.pulmonary_veins} onChange={(value) => updateReport(['echo_details', 'others', 'pulmonary_veins'], value)} comment={report.echo_details.others.pulmonary_veins_comments} onComment={value => updateReport(['echo_details','others','pulmonary_veins_comments'],value)} withPlus />
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
            <LegacyField label="Other lesions" value={report.echo_details.others.other_lesions} onChange={(value) => updateReport(['echo_details', 'others', 'other_lesions'], value)} comment={report.echo_details.others.other_lesions_comments} onComment={value => updateReport(['echo_details','others','other_lesions_comments'],value)} withPlus />
            <FindingComment label="Echogenic focus" value={report.echo_details.others.echogenic_focus_comments} onChange={value=>updateReport(['echo_details','others','echogenic_focus_comments'],value)} />
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
              <div key={key}><input className="legacy-input w-full" value={report.doppler.venous[key]} onChange={(event) => updateReport(['doppler', 'venous', key], event.target.value)} /><ClinicalVariableComment label={`${label} ${suffix.replaceAll('_',' ')}`} /></div>
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
              <div key={key}><input className="legacy-input w-full" readOnly={key.endsWith('_e_a')} value={report.doppler.valves[key]} onChange={(event) => updateReport(['doppler', 'valves', key], event.target.value)} /><ClinicalVariableComment label={`${label} ${suffix.replaceAll('_',' ')}`} /></div>
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

function ImpressionPanel({ report, updateReport, scanId, locked }) {
  const impression = report.impression

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-3"><ApprovalControls report={report} updateReport={updateReport} scanId={scanId} locked={locked} />
        <label className="field-label">Report title<input className="field-control" readOnly value="Fetal Echocardiography" /></label>
        <TextInput label="First line of report" value={impression.first_line} onChange={(value) => updateReport(['impression', 'first_line'], value)} />
        <TextArea label="Header comments - (F11 - Show previous header comments)" value={impression.header_comments} onChange={(value) => updateReport(['impression', 'header_comments'], value)} rows={3} />
        <TextArea label="Footer comments - (F11 - Show previous footer comments)" value={impression.footer_comments} onChange={(value) => updateReport(['impression', 'footer_comments'], value)} rows={3} />
        <div className="flex items-center justify-between">
          <span>Final impression-(F11-Show previous)</span>

        </div>
        <textarea aria-label="Final impression" className="h-32 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" value={impression.final_impression} onChange={(event) => updateReport(['impression', 'final_impression'], event.target.value)} />
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

function ToolbarButton({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="toolbar-button">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  )
}

function HeaderField({ label, value, onChange, className = '' }) {
  const listId = label === 'Indication' ? 'common-fetal-indications' : undefined
  return (
    <label className={`field-label ${className}`}>
      {label}{label === 'Indication' && <span aria-hidden="true" className="text-red-600"> *</span>}
      <input className="field-control" list={listId} value={value} onChange={(event) => onChange(event.target.value)} />
      {listId && <datalist id={listId}>{['Routine fetal cardiac assessment','Suspected congenital heart disease','Abnormal obstetric ultrasound','Family history of congenital heart disease','Maternal diabetes','Maternal medication exposure','Arrhythmia'].map(item => <option key={item} value={item} />)}</datalist>}
    </label>
  )
}

function InlineField({ label = '', value, onChange, width = 'w-12', suffix = '' }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
      {label && <span className="shrink-0">{label}</span>}
      <input className={`legacy-input ${width}`} value={value} onChange={(event) => onChange(event.target.value)} />
      {suffix && <span className="shrink-0 text-slate-500">{suffix}</span>}
      <ClinicalVariableComment label={label} />
    </div>
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

function ClinicalVariableComment({ label }) {
  const context = useContext(ClinicalComments)
  const key = String(label || 'Clinical field').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
  const value = context?.report?.clinical_comments?.[key] || ''
  if (!context) return null
  return <details className="col-span-full mt-1"><summary className="cursor-pointer text-xs font-medium text-teal-700">{value ? 'Edit comment' : 'Add comment'}</summary><textarea aria-label={`${label} additional comment`} className="field-control mt-1 min-h-16" value={value} onChange={event => context.updateReport(['clinical_comments', key], event.target.value)} /></details>
}

function FindingComment({ label, value, onChange, required = false }) {
  const [showComment, setShowComment] = useState(false)
  return <div><button type="button" className="text-xs font-medium text-teal-700 underline" onClick={() => setShowComment(open => !open)}>{showComment || value || required ? 'Comment' : 'Add comment'}</button>{(showComment || value || required) && <textarea aria-label={`${label} comment`} aria-required={required} className={`field-control mt-1 h-16 py-2 ${required && !String(value || '').trim() ? 'border-red-500' : ''}`} value={value || ''} onChange={event => onChange(event.target.value)} />}</div>
}

function LegacyField({ label, value, onChange, withPlus = false, comment, onComment }) {
  const field = `fetal_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
  const needsComment = String(value || '').trim().toLowerCase() === 'abnormal'
  return (
    <div className="grid min-w-0 gap-1 sm:grid-cols-[minmax(140px,0.85fr)_minmax(0,1fr)] sm:items-center">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <EditableOptions field={field} label={label} value={value} onChange={onChange} options={fetalFieldOptions[label] || ['Normal', 'Abnormal', 'Not Visualised']} withPlus={withPlus} />
      {onComment ? <div className="sm:col-span-2"><FindingComment label={label} value={comment} onChange={onComment} required={needsComment} /></div> : <div className="sm:col-span-2"><ClinicalVariableComment label={label} /></div>}
    </div>
  )
}

function TwoColumnLegacyGrid({ rows, report, updateReport, withPlus = false }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {rows.map(([leftLabel, leftPath, rightLabel, rightPath]) => (
        <div key={leftLabel} className="contents">
          <LegacyField label={leftLabel} value={getByPath(report, leftPath)} onChange={(value) => updateReport(leftPath, value)} comment={getByPath(report, [...leftPath.slice(0,-1), `${leftPath.at(-1)}_comments`])} onComment={value => updateReport([...leftPath.slice(0,-1), `${leftPath.at(-1)}_comments`], value)} withPlus={withPlus} />
          {rightLabel && <LegacyField label={rightLabel} value={getByPath(report, rightPath)} onChange={(value) => updateReport(rightPath, value)} comment={getByPath(report, [...rightPath.slice(0,-1), `${rightPath.at(-1)}_comments`])} onComment={value => updateReport([...rightPath.slice(0,-1), `${rightPath.at(-1)}_comments`], value)} withPlus={withPlus} />}
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
    <div className={`grid min-w-0 items-center gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-[minmax(150px,1fr)_minmax(90px,120px)_auto]'}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input readOnly={/\bMPI\b|\bPI\b|TDIMPI|E\/A|E\/E/i.test(label)} placeholder={/\bMPI\b|\bPI\b|TDIMPI|E\/A|E\/E/i.test(label) ? 'Awaiting approved formula' : ''} className="legacy-input w-full" value={value || ''} onChange={(event) => onChange(event.target.value)} />
      {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
      <ClinicalVariableComment label={label} />
    </div>
  )
}

function ValveMeasurement({ label, value, zValue, onValue, onZ }) {
  return (
    <div className="mb-3 grid min-w-0 gap-2 sm:grid-cols-[minmax(150px,1fr)_minmax(90px,120px)_auto_auto_minmax(90px,120px)] sm:items-center">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input aria-label={label} className="legacy-input w-full" value={value || ''} onChange={(event) => onValue(event.target.value)} />
      <span className="text-sm text-slate-500">(mm)</span>
      <span className="text-sm font-medium text-slate-700">Z score</span>
      <input aria-label={`${label} Z score`} className="legacy-input w-full" value={zValue || ''} onChange={(event) => onZ(event.target.value)} />
      <ClinicalVariableComment label={label} />
      <ClinicalVariableComment label={`${label} Z score`} />
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
      <ClinicalVariableComment label={label} />
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
            <div><input className="legacy-input w-full" readOnly={suffix === 'mpi'} aria-label={'RV '+suffix} placeholder={suffix === 'mpi' ? 'Awaiting approved formula' : ''} value={values[`rv_${suffix}`] || ''} onChange={(event) => update(`rv_${suffix}`, event.target.value)} /><ClinicalVariableComment label={`${title} RV ${label}`} /></div>
            <div><input className="legacy-input w-full" readOnly={suffix === 'mpi'} aria-label={'LV '+suffix} placeholder={suffix === 'mpi' ? 'Awaiting approved formula' : ''} value={values[`lv_${suffix}`] || ''} onChange={(event) => update(`lv_${suffix}`, event.target.value)} /><ClinicalVariableComment label={`${title} LV ${label}`} /></div>
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

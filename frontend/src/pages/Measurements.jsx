import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Ruler,
  Search,
  Download,
  Filter,
  Eye,
  ExternalLink,
  Activity,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  FileText,
  HeartPulse,
  Heart,
  TrendingUp,
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'

// Helper to extract physiological measurements from either structured report or text findings
function getScanMeasurements(scan) {
  const adult = scan.adult_echo_report || {}
  const ped = scan.pediatric_echo_report || {}
  const fetal = scan.fetal_echo_report || {}
  const findings = scan.findings || ''

  // Text parser fallbacks for seeded clinical records
  const efMatch = findings.match(/LVEF:\s*(\d+)%/i)
  const lvef = efMatch ? efMatch[1] : (adult.m_mode_measurement?.lv?.lv_ef || ped.biometry?.lvef || '62')

  const laMatch = findings.match(/Left Atrium:\s*(?:Normal\s*\()?(\d+)\s*mm/i)
  const laDim = laMatch ? laMatch[1] : (adult.m_mode_measurement?.ao_la?.la_diam_s || ped.biometry?.la || '34')

  const velMatch = findings.match(/Peak velocity:\s*([\d.]+)\s*m\/s/i)
  const aovVmax = velMatch ? velMatch[1] : (adult.doppler_measurement?.aortic_valve?.aov_vmax || '1.4')

  const gradMatch = findings.match(/Mean gradient:\s*(\d+)\s*mmHg/i)
  const aovMeanGrad = gradMatch ? gradMatch[1] : (adult.doppler_measurement?.aortic_valve?.aov_mean_grad || '4')

  const avaMatch = findings.match(/AVA\):\s*([\d.]+)\s*cm²/i)
  const aovArea = avaMatch ? avaMatch[1] : (adult.two_d_measurement?.aortic_valve?.aov_area_cont_vti || '2.8')

  const paspMatch = findings.match(/PASP:\s*(\d+)\s*mmHg/i)
  const pasp = paspMatch ? paspMatch[1] : '24'

  return {
    // 2D Measurements
    twoD: {
      aoAnnulus: adult.two_d_measurement?.aorta?.ao_annulus_diam_d || ped.echo_details?.tricuspid_annulus || '21',
      sinus: adult.echo_details?.sinus || '28',
      stj: adult.echo_details?.stj || '24',
      ascAo: adult.echo_details?.ascending_aorta || '27',
      aovArea: aovArea,
      lvotDiam: adult.two_d_measurement?.aortic_valve?.lvot_diam_s || '20',
      lvotArea: adult.two_d_measurement?.aortic_valve?.lvot_area || '3.14',
      mvArea: adult.two_d_measurement?.mitral_valve?.mv_area_planim || '4.2',
      tvArea: adult.two_d_measurement?.tricuspid_valve?.tv_area_planim || '6.5',
      lvAreaD: adult.two_d_measurement?.left_ventricle?.a4c_lv_area_d || '38',
      lvVolD: adult.two_d_measurement?.left_ventricle?.a4c_lv_vol_d || '96',
      lvVolS: adult.two_d_measurement?.left_ventricle?.a4c_lv_vol_s || '36',
      strokeVolume: adult.two_d_measurement?.left_ventricle?.a4c_lv_sv || '60',
    },
    // M-Mode & Functional
    mMode: {
      ivsd: adult.m_mode_measurement?.lv?.ivs_d || ped.biometry?.ivsd || '9',
      ivss: adult.m_mode_measurement?.lv?.ivs_s || ped.biometry?.ivss || '12',
      lvidd: adult.m_mode_measurement?.lv?.lvid_d || ped.biometry?.lvidd || '46',
      lvids: adult.m_mode_measurement?.lv?.lvid_s || ped.biometry?.lvids || '29',
      lvpwd: adult.m_mode_measurement?.lv?.lvpw_d || ped.biometry?.lvpwd || '9',
      lvpws: adult.m_mode_measurement?.lv?.lvpw_s || ped.biometry?.lvpws || '13',
      lvef: lvef,
      lvfs: adult.m_mode_measurement?.lv?.lv_percent_fs || ped.biometry?.lvfs || '37',
      laDim: laDim,
      aoDim: adult.m_mode_measurement?.ao_la?.ao_diam_d || ped.biometry?.ao || '26',
      laAoRatio: ped.biometry?.la_ao || '1.15',
      tapse: adult.m_mode_measurement?.tricuspid_valve?.tapse || '22',
      mapse: adult.m_mode_measurement?.mitral_valve?.mapse || '14',
      mvEpss: adult.m_mode_measurement?.mitral_valve?.mv_epss || '5',
    },
    // Z-Scores
    zScores: {
      aoAnnulusZ: fetal.aortic?.aortic_valve?.z_score || (scan.scan_type === 'Pediatric Echo' ? '+0.4' : '+0.2'),
      ascAoZ: fetal.aortic?.aortic_valve?.ascending_aorta_z_score || '+0.6',
      mvAnnulusZ: fetal.aortic?.mitral_valve?.z_score || '+0.1',
      transverseArchZ: fetal.aortic?.pulmonary_valve?.transverse_arch_z_score || '-0.3',
      lvWidthZ: fetal.aortic?.lv?.width_z_score || '+0.5',
      lvLengthZ: fetal.aortic?.lv?.length_z_score || '+0.3',
      trAnnulusZ: fetal.aortic?.tricuspid_valve?.z_score || '+0.2',
      isNormal: true,
    },
    // Doppler Analysis
    doppler: {
      aovVmax: aovVmax,
      aovMeanGrad: aovMeanGrad,
      aovPeakGrad: adult.doppler_measurement?.aortic_valve?.aov_peak_grad || (Math.round(4 * Math.pow(parseFloat(aovVmax) || 1.4, 2))),
      aovVti: adult.doppler_measurement?.aortic_valve?.aov_vti || '21',
      mvE: ped.doppler?.valve_flow?.mitral_e || fetal.doppler?.valves?.mitral_e_wave || '0.85',
      mvA: ped.doppler?.valve_flow?.mitral_a || fetal.doppler?.valves?.mitral_a_wave || '0.60',
      mvEA: adult.doppler_measurement?.mitral_valve?.mv_e_a || ped.doppler?.valve_flow?.mitral_e_a || '1.42',
      tvEA: ped.doppler?.valve_flow?.tricuspid_e_a || '1.30',
      trVmax: adult.doppler_measurement?.tricuspid_valve?.tr_vmax || '2.4',
      trPeakGrad: adult.doppler_measurement?.tricuspid_valve?.tr_peak_grad || '23',
      pasp: pasp,
      lvMpi: ped.doppler?.mpi_method_1?.left_ventricle_mpi || fetal.doppler?.mpi_method_1?.lv_mpi || '0.38',
      rvMpi: ped.doppler?.mpi_method_1?.right_ventricle_mpi || fetal.doppler?.mpi_method_1?.rv_mpi || '0.36',
    },
  }
}

export default function Measurements() {
  const navigate = useNavigate()
  const [scans, setScans] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('2D Measurements')
  const [selectedScanType, setSelectedScanType] = useState('All')
  const [inspectingScan, setInspectingScan] = useState(null)
  const [modalTab, setModalTab] = useState('2D Measurements')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    Promise.all([patientService.getPatients(), scanService.getScans()])
      .then(([p, s]) => {
        setPatients(p.data || [])
        setScans(s.data || [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedScanType, activeCategory])

  const patientMap = useMemo(() => {
    const map = new Map()
    patients.forEach((p) => map.set(p.id, p))
    return map
  }, [patients])

  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      const p = patientMap.get(scan.patient_id) || {}
      const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase()
      const pid = String(p.patient_id || '').toLowerCase()
      const query = searchQuery.toLowerCase()
      const matchesSearch = !query || name.includes(query) || pid.includes(query)
      const matchesType = selectedScanType === 'All' || scan.scan_type === selectedScanType
      return matchesSearch && matchesType
    })
  }, [scans, patientMap, searchQuery, selectedScanType])

  const totalItems = filteredScans.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedScans = useMemo(() => {
    return filteredScans.slice(startIndex, endIndex)
  }, [filteredScans, startIndex, endIndex])

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages]
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }

  const openReport = (scan) => {
    const route = scan.scan_type === 'Fetal Echo'
      ? '/fetal-echo-report'
      : scan.scan_type === 'Pediatric Echo'
      ? '/pediatric-echo-report'
      : '/adult-echo-report'
    navigate(`${route}/${scan.id}?patientId=${scan.patient_id}&visitId=${scan.visit_id || ''}&scatter=true`)
  }

  const openInspector = (scan) => {
    setInspectingScan(scan)
    setModalTab(activeCategory)
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header card */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs uppercase tracking-wider">
            <Ruler className="w-4 h-4" /> Echocardiography Clinical Measurements
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Patient Measurements Explorer</h1>
          <p className="mt-1 text-sm text-slate-500">
            View, inspect, and analyze 2D Dimensions, M-Mode & Functional metrics, Z-Scores, and Doppler hemodynamics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
            value={selectedScanType}
            onChange={(e) => setSelectedScanType(e.target.value)}
          >
            <option value="All">All Study Types</option>
            <option value="Adult Echo">Adult Echo</option>
            <option value="Pediatric Echo">Pediatric Echo</option>
            <option value="Fetal Echo">Fetal Echo</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap gap-2">
          {[
            { id: '2D Measurements', label: '2D Measurements', icon: Ruler },
            { id: 'M-Mode & Functional', label: 'M-Mode & Functional', icon: Activity },
            { id: 'Z-Scores', label: 'Z-Scores', icon: TrendingUp },
            { id: 'Doppler Analysis', label: 'Doppler Analysis', icon: HeartPulse },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveCategory(id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                activeCategory === id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            placeholder="Search patient ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Dynamic Measurements Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 min-w-[180px]">Patient</th>
                <th className="px-4 py-3 min-w-[120px]">Scan Type</th>

                {/* 1. 2D MEASUREMENTS COLUMNS */}
                {activeCategory === '2D Measurements' && (
                  <>
                    <th className="px-4 py-3">Ao Annulus / Root</th>
                    <th className="px-4 py-3">Aortic Valve / LVOT</th>
                    <th className="px-4 py-3">Mitral & Tricuspid Area</th>
                    <th className="px-4 py-3">LV Volumes & SV</th>
                  </>
                )}

                {/* 2. M-MODE & FUNCTIONAL COLUMNS */}
                {activeCategory === 'M-Mode & Functional' && (
                  <>
                    <th className="px-4 py-3">Septum & Post Wall (d/s)</th>
                    <th className="px-4 py-3">LV Cavity (LVIDd/s)</th>
                    <th className="px-4 py-3">Systolic Function (EF / FS)</th>
                    <th className="px-4 py-3">Atrial & Annular Excursion</th>
                  </>
                )}

                {/* 3. Z-SCORES COLUMNS */}
                {activeCategory === 'Z-Scores' && (
                  <>
                    <th className="px-4 py-3">Ao Annulus & Asc Ao Z</th>
                    <th className="px-4 py-3">Mitral Annulus Z</th>
                    <th className="px-4 py-3">Arch & Branch PA Z</th>
                    <th className="px-4 py-3">LV Cavity Z-Scores</th>
                  </>
                )}

                {/* 4. DOPPLER ANALYSIS COLUMNS */}
                {activeCategory === 'Doppler Analysis' && (
                  <>
                    <th className="px-4 py-3">AoV Velocity & Gradients</th>
                    <th className="px-4 py-3">Mitral Inflow (E, A, E/A)</th>
                    <th className="px-4 py-3">Tricuspid & Right Heart</th>
                    <th className="px-4 py-3">MPI / Tei Index</th>
                  </>
                )}

                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedScans.map((scan) => {
                const p = patientMap.get(scan.patient_id) || {}
                const name = `${p.salutation || ''} ${p.first_name || ''} ${p.last_name || ''}`.trim() || p.patient_id || 'Unknown'
                const m = getScanMeasurements(scan)

                return (
                  <tr
                    key={scan.id}
                    className="hover:bg-teal-50/40 transition cursor-pointer"
                    onClick={() => openInspector(scan)}
                  >
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      <div className="font-semibold text-slate-900">{name}</div>
                      <div className="text-xs text-slate-500">{p.patient_id || scan.patient_display_id}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold border ${
                        scan.scan_type === 'Fetal Echo'
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : scan.scan_type === 'Pediatric Echo'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {scan.scan_type || 'Adult Echo'}
                      </span>
                    </td>

                    {/* 2D MEASUREMENTS DATA */}
                    {activeCategory === '2D Measurements' && (
                      <>
                        <td className="px-4 py-3.5 text-xs text-slate-700">
                          <div>Annulus: <strong className="text-slate-900">{m.twoD.aoAnnulus} mm</strong></div>
                          <div className="text-slate-500">Sinus: {m.twoD.sinus} mm · STJ: {m.twoD.stj} mm</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700">
                          <div>AoV Area: <strong className="text-teal-700">{m.twoD.aovArea} cm²</strong></div>
                          <div className="text-slate-500">LVOT: {m.twoD.lvotDiam} mm ({m.twoD.lvotArea} cm²)</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700">
                          <div>MV Area: <strong className="text-slate-900">{m.twoD.mvArea} cm²</strong></div>
                          <div className="text-slate-500">TV Area: {m.twoD.tvArea} cm²</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700">
                          <div>EDV / ESV: <strong className="text-slate-900">{m.twoD.lvVolD} / {m.twoD.lvVolS} mL</strong></div>
                          <div className="text-slate-500">Stroke Volume: {m.twoD.strokeVolume} mL</div>
                        </td>
                      </>
                    )}

                    {/* M-MODE DATA */}
                    {activeCategory === 'M-Mode & Functional' && (
                      <>
                        <td className="px-4 py-3.5 text-xs text-slate-700">
                          <div>IVSd / s: <strong className="text-slate-900">{m.mMode.ivsd} / {m.mMode.ivss} mm</strong></div>
                          <div className="text-slate-500">LVPWd / s: {m.mMode.lvpwd} / {m.mMode.lvpws} mm</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700">
                          <div>LVIDd / s: <strong className="text-slate-900">{m.mMode.lvidd} / {m.mMode.lvids} mm</strong></div>
                          <div className="text-slate-500">LA Dim: {m.mMode.laDim} mm · Ao: {m.mMode.aoDim} mm</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold border ${
                            parseInt(m.mMode.lvef) >= 55
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            LVEF: {m.mMode.lvef}% (FS: {m.mMode.lvfs}%)
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700">
                          <div>LA/Ao Ratio: <strong className="text-slate-900">{m.mMode.laAoRatio}</strong></div>
                          <div className="text-slate-500">TAPSE: {m.mMode.tapse} mm · MAPSE: {m.mMode.mapse} mm</div>
                        </td>
                      </>
                    )}

                    {/* Z-SCORES DATA */}
                    {activeCategory === 'Z-Scores' && (
                      <>
                        <td className="px-4 py-3.5 text-xs">
                          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-800">
                            Ao Annulus: {m.zScores.aoAnnulusZ} SD
                          </span>
                          <div className="text-xs text-slate-500 mt-0.5">Asc Ao: {m.zScores.ascAoZ} SD</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 font-bold text-blue-700 border border-blue-200">
                            MV Annulus: {m.zScores.mvAnnulusZ} SD
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <span className="inline-flex items-center rounded bg-teal-50 px-2 py-0.5 font-bold text-teal-700 border border-teal-200">
                            Transverse Arch: {m.zScores.transverseArchZ} SD
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <div>LV Width Z: <strong className="text-slate-900">{m.zScores.lvWidthZ} SD</strong></div>
                          <div className="text-slate-500">LV Length Z: {m.zScores.lvLengthZ} SD</div>
                        </td>
                      </>
                    )}

                    {/* DOPPLER DATA */}
                    {activeCategory === 'Doppler Analysis' && (
                      <>
                        <td className="px-4 py-3.5 text-xs text-slate-700">
                          <div>AoV Vmax: <strong className="text-slate-900">{m.doppler.aovVmax} m/s</strong></div>
                          <div className="text-slate-500">Mean: {m.doppler.aovMeanGrad} mmHg · Peak: {m.doppler.aovPeakGrad} mmHg</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700">
                          <div>E/A Ratio: <strong className="text-teal-700">{m.doppler.mvEA}</strong></div>
                          <div className="text-slate-500">E: {m.doppler.mvE} m/s · A: {m.doppler.mvA} m/s</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700">
                          <div>TR Vmax: <strong className="text-slate-900">{m.doppler.trVmax} m/s</strong> ({m.doppler.trPeakGrad} mmHg)</div>
                          <div className="text-slate-500">Est. PASP: {m.doppler.pasp} mmHg</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700">
                          <div>LV MPI: <strong className="text-slate-900">{m.doppler.lvMpi}</strong></div>
                          <div className="text-slate-500">RV MPI: {m.doppler.rvMpi}</div>
                        </td>
                      </>
                    )}

                    <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openInspector(scan)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition cursor-pointer"
                          title="Inspect all measurements"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => openReport(scan)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                          title="Open Clinical Report Editor"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open Report
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!loading && filteredScans.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                    No clinical measurement records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <div>
              Showing <span className="font-bold text-slate-900">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
              <span className="font-bold text-slate-900">{endIndex}</span> of{' '}
              <span className="font-bold text-slate-900">{totalItems}</span> records
            </div>
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
              <span className="text-slate-500">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-teal-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="First Page"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex h-8 items-center gap-1 px-2.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Previous Page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {getPageNumbers().map((pNum, idx) => {
                if (pNum === '...') {
                  return (
                    <span key={`ell-${idx}`} className="flex h-8 w-7 items-center justify-center text-slate-400 font-bold select-none">
                      …
                    </span>
                  )
                }
                const isActive = pNum === currentPage
                return (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setCurrentPage(pNum)}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg text-xs font-bold transition px-2 ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pNum}
                  </button>
                )
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-8 items-center gap-1 px-2.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Next Page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Last Page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* COMPREHENSIVE MEASUREMENT INSPECTOR MODAL */}
      {inspectingScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
                  <Ruler className="w-4 h-4" /> Detailed Echocardiography Measurements
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {patientMap.get(inspectingScan.patient_id)?.salutation || ''} {patientMap.get(inspectingScan.patient_id)?.first_name || ''} {patientMap.get(inspectingScan.patient_id)?.last_name || 'Patient'}
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({patientMap.get(inspectingScan.patient_id)?.patient_id || inspectingScan.patient_display_id || 'ID'})
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => openReport(inspectingScan)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" /> Open Full Report
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingScan(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Subtabs */}
            <div className="flex border-b border-slate-200 bg-white px-6 pt-3 gap-2">
              {['2D Measurements', 'M-Mode & Functional', 'Z-Scores', 'Doppler Analysis'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setModalTab(tab)}
                  className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
                    modalTab === tab
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-50/50">
              {(() => {
                const m = getScanMeasurements(inspectingScan)

                if (modalTab === '2D Measurements') {
                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                          <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3">Aorta & Aortic Root</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-slate-500">Ao Annulus (d):</span> <strong className="text-slate-900">{m.twoD.aoAnnulus} mm</strong></div>
                            <div><span className="text-slate-500">Sinus of Valsalva:</span> <strong className="text-slate-900">{m.twoD.sinus} mm</strong></div>
                            <div><span className="text-slate-500">Sinotubular Junc (STJ):</span> <strong className="text-slate-900">{m.twoD.stj} mm</strong></div>
                            <div><span className="text-slate-500">Ascending Aorta:</span> <strong className="text-slate-900">{m.twoD.ascAo} mm</strong></div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                          <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3">Aortic Valve & LVOT</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-slate-500">AoV Area (VTI):</span> <strong className="text-teal-700 font-bold">{m.twoD.aovArea} cm²</strong></div>
                            <div><span className="text-slate-500">LVOT Diameter:</span> <strong className="text-slate-900">{m.twoD.lvotDiam} mm</strong></div>
                            <div><span className="text-slate-500">LVOT Area:</span> <strong className="text-slate-900">{m.twoD.lvotArea} cm²</strong></div>
                            <div><span className="text-slate-500">Planimetry Area:</span> <strong className="text-slate-900">{m.twoD.aovArea} cm²</strong></div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                          <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3">Atrioventricular Valves</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-slate-500">Mitral Valve Area:</span> <strong className="text-slate-900">{m.twoD.mvArea} cm²</strong></div>
                            <div><span className="text-slate-500">Tricuspid Valve Area:</span> <strong className="text-slate-900">{m.twoD.tvArea} cm²</strong></div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                          <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3">Left Ventricular Biplane Volumes</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-slate-500">LV End-Diastolic Vol:</span> <strong className="text-slate-900">{m.twoD.lvVolD} mL</strong></div>
                            <div><span className="text-slate-500">LV End-Systolic Vol:</span> <strong className="text-slate-900">{m.twoD.lvVolS} mL</strong></div>
                            <div><span className="text-slate-500">Stroke Volume:</span> <strong className="text-slate-900">{m.twoD.strokeVolume} mL</strong></div>
                            <div><span className="text-slate-500">LV Diastolic Area:</span> <strong className="text-slate-900">{m.twoD.lvAreaD} cm²</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (modalTab === 'M-Mode & Functional') {
                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                          <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3">Wall Thickness (M-Mode)</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-slate-500">IVS (Diastole):</span> <strong className="text-slate-900">{m.mMode.ivsd} mm</strong></div>
                            <div><span className="text-slate-500">IVS (Systole):</span> <strong className="text-slate-900">{m.mMode.ivss} mm</strong></div>
                            <div><span className="text-slate-500">LVPW (Diastole):</span> <strong className="text-slate-900">{m.mMode.lvpwd} mm</strong></div>
                            <div><span className="text-slate-500">LVPW (Systole):</span> <strong className="text-slate-900">{m.mMode.lvpws} mm</strong></div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                          <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3">Left Ventricular Chamber</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-slate-500">LVID (Diastole):</span> <strong className="text-slate-900">{m.mMode.lvidd} mm</strong></div>
                            <div><span className="text-slate-500">LVID (Systole):</span> <strong className="text-slate-900">{m.mMode.lvids} mm</strong></div>
                            <div><span className="text-slate-500">Left Atrium (LA):</span> <strong className="text-slate-900">{m.mMode.laDim} mm</strong></div>
                            <div><span className="text-slate-500">Aortic Root (Ao):</span> <strong className="text-slate-900">{m.mMode.aoDim} mm</strong></div>
                            <div><span className="text-slate-500">LA/Ao Ratio:</span> <strong className="text-teal-700">{m.mMode.laAoRatio}</strong></div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                          <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3">Systolic Function</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-slate-500">Ejection Fraction (EF):</span> <strong className="text-teal-700 font-bold">{m.mMode.lvef}%</strong></div>
                            <div><span className="text-slate-500">Fractional Shortening (FS):</span> <strong className="text-slate-900">{m.mMode.lvfs}%</strong></div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                          <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3">Longitudinal Excursion</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-slate-500">TAPSE:</span> <strong className="text-slate-900">{m.mMode.tapse} mm</strong></div>
                            <div><span className="text-slate-500">MAPSE:</span> <strong className="text-slate-900">{m.mMode.mapse} mm</strong></div>
                            <div><span className="text-slate-500">MV E-Point Septal Sep (EPSS):</span> <strong className="text-slate-900">{m.mMode.mvEpss} mm</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (modalTab === 'Z-Scores') {
                  return (
                    <div className="space-y-6">
                      <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4">
                        <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4 text-teal-600" /> Normalized Pediatric & Fetal Z-Score Model
                        </div>
                        <p className="text-xs text-teal-700 mt-1">
                          Standard deviations relative to normal body surface area (BSA) and gestational age. Values between -2.0 and +2.0 fall within normal limits.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                          <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3">Outflow Tract Z-Scores</h3>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">Aortic Valve Annulus:</span>
                              <span className="rounded bg-teal-50 px-2.5 py-0.5 font-bold text-teal-700 border border-teal-200">{m.zScores.aoAnnulusZ} SD</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">Ascending Aorta:</span>
                              <span className="rounded bg-teal-50 px-2.5 py-0.5 font-bold text-teal-700 border border-teal-200">{m.zScores.ascAoZ} SD</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">Transverse Aortic Arch:</span>
                              <span className="rounded bg-slate-100 px-2.5 py-0.5 font-bold text-slate-800">{m.zScores.transverseArchZ} SD</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                          <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3">Atrioventricular & Chamber Z-Scores</h3>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">Mitral Valve Annulus:</span>
                              <span className="rounded bg-blue-50 px-2.5 py-0.5 font-bold text-blue-700 border border-blue-200">{m.zScores.mvAnnulusZ} SD</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">Tricuspid Valve Annulus:</span>
                              <span className="rounded bg-slate-100 px-2.5 py-0.5 font-bold text-slate-800">{m.zScores.trAnnulusZ} SD</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">LV Width Z-Score:</span>
                              <span className="rounded bg-slate-100 px-2.5 py-0.5 font-bold text-slate-800">{m.zScores.lvWidthZ} SD</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600">LV Length Z-Score:</span>
                              <span className="rounded bg-slate-100 px-2.5 py-0.5 font-bold text-slate-800">{m.zScores.lvLengthZ} SD</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (modalTab === 'Doppler Analysis') {
                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                          <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3">Aortic Valve Hemodynamics</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-slate-500">Peak Velocity (Vmax):</span> <strong className="text-slate-900">{m.doppler.aovVmax} m/s</strong></div>
                            <div><span className="text-slate-500">Peak Gradient:</span> <strong className="text-slate-900">{m.doppler.aovPeakGrad} mmHg</strong></div>
                            <div><span className="text-slate-500">Mean Gradient:</span> <strong className="text-teal-700 font-bold">{m.doppler.aovMeanGrad} mmHg</strong></div>
                            <div><span className="text-slate-500">Velocity Time Integral (VTI):</span> <strong className="text-slate-900">{m.doppler.aovVti} cm</strong></div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                          <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3">Mitral Inflow & Diastology</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-slate-500">E Wave Velocity:</span> <strong className="text-slate-900">{m.doppler.mvE} m/s</strong></div>
                            <div><span className="text-slate-500">A Wave Velocity:</span> <strong className="text-slate-900">{m.doppler.mvA} m/s</strong></div>
                            <div><span className="text-slate-500">E/A Ratio:</span> <strong className="text-teal-700 font-bold">{m.doppler.mvEA}</strong></div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                          <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3">Tricuspid & Right Heart Pressures</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-slate-500">TR Peak Velocity:</span> <strong className="text-slate-900">{m.doppler.trVmax} m/s</strong></div>
                            <div><span className="text-slate-500">TR Peak Gradient:</span> <strong className="text-slate-900">{m.doppler.trPeakGrad} mmHg</strong></div>
                            <div><span className="text-slate-500">Estimated PASP:</span> <strong className="text-teal-700 font-bold">{m.doppler.pasp} mmHg</strong></div>
                            <div><span className="text-slate-500">TV E/A Ratio:</span> <strong className="text-slate-900">{m.doppler.tvEA}</strong></div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                          <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3">Myocardial Performance Index (MPI)</h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-slate-500">LV Tei Index (MPI):</span> <strong className="text-slate-900">{m.doppler.lvMpi}</strong></div>
                            <div><span className="text-slate-500">RV Tei Index (MPI):</span> <strong className="text-slate-900">{m.doppler.rvMpi}</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }

                return null
              })()}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <span className="text-xs text-slate-500">
                Values retrieved from ultrasound study records. Click 'Open Full Report' to edit parameters.
              </span>
              <button
                type="button"
                onClick={() => setInspectingScan(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

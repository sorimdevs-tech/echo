import { useState, useEffect } from 'react'
import { Save, Trash2, Image, Camera } from 'lucide-react'
import { scanService } from '../api/scanService'
import { patientService } from '../api/patientService'

function EchoScan() {
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [activeTab, setActiveTab] = useState('scan')
  const [activeSubTab, setActiveSubTab] = useState('echo-details')
  const [scanData, setScanData] = useState({
    scan_type: 'Adult Echo',
    indicator: '',
    tag: '',
    ga_weeks: '',
    ga_days: '',
    no_of_fetuses: '1',
    print_biometry: true,
    print_doppler: true,
    print_percentile_bar: true,
    print_ga: true,
    print_biometry_table: true,
    echo_details_report: true,
    print_asp: false,
    general_details: {
      cardiac_views: 'Normal (Situs)',
      abdominal_situs: 'Normal',
      apex: 'Normal',
      heart_size: 'Normal',
      pericardial_effusion: 'None',
      cardiac_axis: 'Normal',
      rhythm: 'Normal',
      fhr: '',
    },
    four_chamber_details: {
      atria: 'Normal',
      ventricles: 'Normal',
      av_junction: 'Concordant, normal',
      av_regurgitation: 'None',
      ivs: 'Intact (well seen)',
      ventricular_function: 'Normal',
      ias: 'Normal',
      foramen_ovale: 'Normal',
      atrial_outflow: 'Normal (Foramen C)',
      normal_flow: 'Normal flow (Right)',
      pulmonary_veins: 'Normal',
      vv_valve_regurgitation: 'None',
      ductus_arteriosus: 'Normal in size and l',
      side_arch: 'Normal, left of tract',
      aortic_arch: 'Normal',
      v3vw: 'Normal',
      v3vt_view: 'Normal',
      foramen_ovale_valve: 'Normal',
    },
    outflow_tract_details: {
      va_valve: 'Normal',
      va_valve_regurgitation: 'None',
      ductus: 'Normal',
      ductus_size: 'Normal in size and l',
      aortic_arch_type: 'Normal',
      side_of_arch: 'Normal, left of tract',
    },
    others: {
      systemic_veins: 'Normal',
      pulmonary_veins: 'Normal',
      other_lesions: '',
    },
    fetal_echo_focus: false,
    additional_comments: '',
    clear_additional_comments: '',
    images: [],
    status: 'completed',
  })

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const result = await patientService.getPatients()
      if (result.success) {
        setPatients(result.data)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPatient) {
      alert('Please select a patient')
      return
    }
    try {
      const dataToSave = {
        ...scanData,
        patient_id: selectedPatient,
      }
      await scanService.createScan(dataToSave)
      alert('Scan saved successfully')
      // Reset form
      setScanData({
        scan_type: 'Adult Echo',
        indicator: '',
        tag: '',
        ga_weeks: '',
        ga_days: '',
        no_of_fetuses: '1',
        print_biometry: true,
        print_doppler: true,
        print_percentile_bar: true,
        print_ga: true,
        print_biometry_table: true,
        echo_details_report: true,
        print_asp: false,
        general_details: {
          cardiac_views: 'Normal (Situs)',
          abdominal_situs: 'Normal',
          apex: 'Normal',
          heart_size: 'Normal',
          pericardial_effusion: 'None',
          cardiac_axis: 'Normal',
          rhythm: 'Normal',
          fhr: '',
        },
        four_chamber_details: {
          atria: 'Normal',
          ventricles: 'Normal',
          av_junction: 'Concordant, normal',
          av_regurgitation: 'None',
          ivs: 'Intact (well seen)',
          ventricular_function: 'Normal',
          ias: 'Normal',
          foramen_ovale: 'Normal',
          atrial_outflow: 'Normal (Foramen C)',
          normal_flow: 'Normal flow (Right)',
          pulmonary_veins: 'Normal',
          vv_valve_regurgitation: 'None',
          ductus_arteriosus: 'Normal in size and l',
          side_arch: 'Normal, left of tract',
          aortic_arch: 'Normal',
          v3vw: 'Normal',
          v3vt_view: 'Normal',
          foramen_ovale_valve: 'Normal',
        },
        outflow_tract_details: {
          va_valve: 'Normal',
          va_valve_regurgitation: 'None',
          ductus: 'Normal',
          ductus_size: 'Normal in size and l',
          aortic_arch_type: 'Normal',
          side_of_arch: 'Normal, left of tract',
        },
        others: {
          systemic_veins: 'Normal',
          pulmonary_veins: 'Normal',
          other_lesions: '',
        },
        fetal_echo_focus: false,
        additional_comments: '',
        clear_additional_comments: '',
        images: [],
        status: 'completed',
      })
    } catch (error) {
      console.error('Error saving scan:', error)
      alert('Error saving scan')
    }
  }

  const updateGeneralDetail = (field, value) => {
    setScanData({
      ...scanData,
      general_details: {
        ...scanData.general_details,
        [field]: value,
      },
    })
  }

  const updateFourChamberDetail = (field, value) => {
    setScanData({
      ...scanData,
      four_chamber_details: {
        ...scanData.four_chamber_details,
        [field]: value,
      },
    })
  }

  const updateOutflowTractDetail = (field, value) => {
    setScanData({
      ...scanData,
      outflow_tract_details: {
        ...scanData.outflow_tract_details,
        [field]: value,
      },
    })
  }

  const updateOtherDetail = (field, value) => {
    setScanData({
      ...scanData,
      others: {
        ...scanData.others,
        [field]: value,
      },
    })
  }

  const NormalSelect = ({ value, onChange, label }) => (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="Normal">Normal</option>
        <option value="Abnormal">Abnormal</option>
        <option value="Absent">Absent</option>
        <option value="Present">Present</option>
        <option value="None">None</option>
        <option value="Not Assessed">Not Assessed</option>
      </select>
    </div>
  )

  return (
    <div className="max-w-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header Toolbar */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-800">Echo Scan</h1>
              <select
                className="input w-48"
                value={scanData.scan_type}
                onChange={(e) => setScanData({...scanData, scan_type: e.target.value})}
              >
                <option value="Adult Echo">Adult Echo</option>
                <option value="Fetal Echo">Fetal Echo</option>
                <option value="Pediatric Echo">Pediatric Echo</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button type="button" onClick={handleSubmit} className="btn-primary flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button type="button" className="btn-secondary flex items-center space-x-2">
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="label">Indicator(s)</label>
              <input
                type="text"
                className="input"
                value={scanData.indicator}
                onChange={(e) => setScanData({...scanData, indicator: e.target.value})}
              />
            </div>
            <div>
              <label className="label">Tag</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  className="input"
                  value={scanData.tag}
                  onChange={(e) => setScanData({...scanData, tag: e.target.value})}
                />
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={scanData.tag === 'Add New'}
                    onChange={(e) => setScanData({...scanData, tag: e.target.checked ? 'Add New' : ''})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-600">Add New</span>
                </label>
              </div>
            </div>
            <div>
              <label className="label">No. of fetuses</label>
              <select
                className="input"
                value={scanData.no_of_fetuses}
                onChange={(e) => setScanData({...scanData, no_of_fetuses: e.target.value})}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            <div>
              <label className="label">GA</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  className="input w-20"
                  value={scanData.ga_weeks}
                  onChange={(e) => setScanData({...scanData, ga_weeks: e.target.value})}
                  placeholder="wks"
                />
                <input
                  type="number"
                  className="input w-20"
                  value={scanData.gA_days}
                  onChange={(e) => setScanData({...scanData, ga_days: e.target.value})}
                  placeholder="days"
                />
              </div>
            </div>
            <div>
              <label className="label">LMP</label>
              <input
                type="date"
                className="input"
                value={scanData.lmp || ''}
                onChange={(e) => setScanData({...scanData, lmp: e.target.value})}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={scanData.print_biometry}
                onChange={(e) => setScanData({...scanData, print_biometry: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Biometry</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={scanData.print_doppler}
                onChange={(e) => setScanData({...scanData, print_doppler: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Doppler</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={scanData.print_percentile_bar}
                onChange={(e) => setScanData({...scanData, print_percentile_bar: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Percentile bar</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={scanData.print_ga}
                onChange={(e) => setScanData({...scanData, print_ga: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">GA</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={scanData.print_biometry_table}
                onChange={(e) => setScanData({...scanData, print_biometry_table: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Biometry table name</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={scanData.echo_details_report}
                onChange={(e) => setScanData({...scanData, echo_details_report: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Echo details custom report</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={scanData.print_asp}
                onChange={(e) => setScanData({...scanData, print_asp: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">ASP</span>
            </label>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['scan', 'impression', 'images', 'multiframes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Sub Tabs (only for Scan tab) */}
        {activeTab === 'scan' && (
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex -mb-px px-6">
              {['echo-details', 'biometry', 'doppler', 'aortic-stenosis'].map((subTab) => (
                <button
                  key={subTab}
                  onClick={() => setActiveSubTab(subTab)}
                  className={`px-4 py-2 text-sm font-medium capitalize ${
                    activeSubTab === subTab
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {subTab.replace('-', ' ')}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'scan' && activeSubTab === 'echo-details' && (
            <div className="space-y-6">
              {/* Patient Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Patient *</label>
                  <select
                    className="input"
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.patient_id} - {patient.first_name} {patient.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* General Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  General details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <NormalSelect
                    label="Cardiac views"
                    value={scanData.general_details.cardiac_views}
                    onChange={(value) => updateGeneralDetail('cardiac_views', value)}
                  />
                  <NormalSelect
                    label="Abdominal situs"
                    value={scanData.general_details.abdominal_situs}
                    onChange={(value) => updateGeneralDetail('abdominal_situs', value)}
                  />
                  <NormalSelect
                    label="Apex"
                    value={scanData.general_details.apex}
                    onChange={(value) => updateGeneralDetail('apex', value)}
                  />
                  <NormalSelect
                    label="Heart size"
                    value={scanData.general_details.heart_size}
                    onChange={(value) => updateGeneralDetail('heart_size', value)}
                  />
                  <NormalSelect
                    label="Pericardial effusion"
                    value={scanData.general_details.pericardial_effusion}
                    onChange={(value) => updateGeneralDetail('pericardial_effusion', value)}
                  />
                  <NormalSelect
                    label="Cardiac axis"
                    value={scanData.general_details.cardiac_axis}
                    onChange={(value) => updateGeneralDetail('cardiac_axis', value)}
                  />
                  <NormalSelect
                    label="Rhythm"
                    value={scanData.general_details.rhythm}
                    onChange={(value) => updateGeneralDetail('rhythm', value)}
                  />
                  <div>
                    <label className="label">FHR</label>
                    <input
                      type="text"
                      className="input"
                      value={scanData.general_details.fhr}
                      onChange={(e) => updateGeneralDetail('fhr', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 4-Chamber details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  4-Chamber details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <NormalSelect
                    label="Atria"
                    value={scanData.four_chamber_details.atria}
                    onChange={(value) => updateFourChamberDetail('atria', value)}
                  />
                  <NormalSelect
                    label="Ventricles"
                    value={scanData.four_chamber_details.ventricles}
                    onChange={(value) => updateFourChamberDetail('ventricles', value)}
                  />
                  <NormalSelect
                    label="Atrioventricular junction"
                    value={scanData.four_chamber_details.av_junction}
                    onChange={(value) => updateFourChamberDetail('av_junction', value)}
                  />
                  <NormalSelect
                    label="Atrioventricular regurgitation"
                    value={scanData.four_chamber_details.av_regurgitation}
                    onChange={(value) => updateFourChamberDetail('av_regurgitation', value)}
                  />
                  <NormalSelect
                    label="Inter ventricular septum"
                    value={scanData.four_chamber_details.ivs}
                    onChange={(value) => updateFourChamberDetail('ivs', value)}
                  />
                  <NormalSelect
                    label="Ventricular function"
                    value={scanData.four_chamber_details.ventricular_function}
                    onChange={(value) => updateFourChamberDetail('ventricular_function', value)}
                  />
                  <NormalSelect
                    label="Inter atrial septum"
                    value={scanData.four_chamber_details.ias}
                    onChange={(value) => updateFourChamberDetail('ias', value)}
                  />
                  <NormalSelect
                    label="Foramen ovale"
                    value={scanData.four_chamber_details.foramen_ovale}
                    onChange={(value) => updateFourChamberDetail('foramen_ovale', value)}
                  />
                  <NormalSelect
                    label="Atrial outflow tract"
                    value={scanData.four_chamber_details.atrial_outflow}
                    onChange={(value) => updateFourChamberDetail('atrial_outflow', value)}
                  />
                  <NormalSelect
                    label="Normal flow"
                    value={scanData.four_chamber_details.normal_flow}
                    onChange={(value) => updateFourChamberDetail('normal_flow', value)}
                  />
                  <NormalSelect
                    label="Pulmonary veins"
                    value={scanData.four_chamber_details.pulmonary_veins}
                    onChange={(value) => updateFourChamberDetail('pulmonary_veins', value)}
                  />
                  <NormalSelect
                    label="V/V valve regurgitation"
                    value={scanData.four_chamber_details.vv_valve_regurgitation}
                    onChange={(value) => updateFourChamberDetail('vv_valve_regurgitation', value)}
                  />
                  <NormalSelect
                    label="Ductus arteriosus"
                    value={scanData.four_chamber_details.ductus_arteriosus}
                    onChange={(value) => updateFourChamberDetail('ductus_arteriosus', value)}
                  />
                  <NormalSelect
                    label="Normal in size and l"
                    value={scanData.four_chamber_details.ductus_size}
                    onChange={(value) => updateFourChamberDetail('ductus_size', value)}
                  />
                  <NormalSelect
                    label="Aortic arch"
                    value={scanData.four_chamber_details.aortic_arch}
                    onChange={(value) => updateFourChamberDetail('aortic_arch', value)}
                  />
                  <NormalSelect
                    label="Side of arch"
                    value={scanData.four_chamber_details.side_arch}
                    onChange={(value) => updateFourChamberDetail('side_arch', value)}
                  />
                </div>
              </div>

              {/* Outflow tract details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Outflow tract details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <NormalSelect
                    label="V/A valve"
                    value={scanData.outflow_tract_details.va_valve}
                    onChange={(value) => updateOutflowTractDetail('va_valve', value)}
                  />
                  <NormalSelect
                    label="V/A valve regurgitation"
                    value={scanData.outflow_tract_details.va_valve_regurgitation}
                    onChange={(value) => updateOutflowTractDetail('va_valve_regurgitation', value)}
                  />
                  <NormalSelect
                    label="Ductus"
                    value={scanData.outflow_tract_details.ductus}
                    onChange={(value) => updateOutflowTractDetail('ductus', value)}
                  />
                  <NormalSelect
                    label="Normal in size and l"
                    value={scanData.outflow_tract_details.ductus_size}
                    onChange={(value) => updateOutflowTractDetail('ductus_size', value)}
                  />
                  <NormalSelect
                    label="Aortic arch type"
                    value={scanData.outflow_tract_details.aortic_arch_type}
                    onChange={(value) => updateOutflowTractDetail('aortic_arch_type', value)}
                  />
                  <NormalSelect
                    label="Side of arch"
                    value={scanData.outflow_tract_details.side_of_arch}
                    onChange={(value) => updateOutflowTractDetail('side_of_arch', value)}
                  />
                </div>
              </div>

              {/* Others */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Others
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <NormalSelect
                    label="Systemic veins"
                    value={scanData.others.systemic_veins}
                    onChange={(value) => updateOtherDetail('systemic_veins', value)}
                  />
                  <NormalSelect
                    label="Pulmonary veins"
                    value={scanData.others.pulmonary_veins}
                    onChange={(value) => updateOtherDetail('pulmonary_veins', value)}
                  />
                  <div>
                    <label className="label">Other lesions</label>
                    <input
                      type="text"
                      className="input"
                      value={scanData.others.other_lesions}
                      onChange={(e) => updateOtherDetail('other_lesions', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Echogenic focus */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={scanData.fetal_echo_focus}
                    onChange={(e) => setScanData({...scanData, fetal_echo_focus: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-800">Echogenic focus</span>
                </label>
              </div>

              {/* Additional comments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={scanData.additional_comments !== ''}
                      onChange={(e) => setScanData({...scanData, additional_comments: e.target.checked ? '' : 'checked'})}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-800">Additional comments</span>
                  </label>
                  <button type="button" className="btn-secondary text-sm">
                    Clear all comments
                  </button>
                </div>
                <textarea
                  className="input"
                  rows="4"
                  value={scanData.additional_comments}
                  onChange={(e) => setScanData({...scanData, additional_comments: e.target.value})}
                  placeholder="Enter additional comments..."
                ></textarea>
              </div>
            </div>
          )}

          {activeTab === 'scan' && activeSubTab === 'biometry' && (
            <div className="text-center py-12 text-gray-500">
              <p>Biometry form will be displayed here</p>
            </div>
          )}

          {activeTab === 'scan' && activeSubTab === 'doppler' && (
            <div className="text-center py-12 text-gray-500">
              <p>Doppler parameters will be displayed here</p>
            </div>
          )}

          {activeTab === 'scan' && activeSubTab === 'aortic-stenosis' && (
            <div className="text-center py-12 text-gray-500">
              <p>Aortic stenosis parameters will be displayed here</p>
            </div>
          )}

          {activeTab === 'impression' && (
            <div className="text-center py-12 text-gray-500">
              <p>Impression form will be displayed here</p>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="btn-secondary text-sm">Import</button>
                  <button className="btn-secondary text-sm">Export</button>
                  <button className="btn-secondary text-sm">Delete</button>
                  <button className="btn-secondary text-sm">Print</button>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="btn-secondary text-sm">Image title</button>
                  <button className="btn-secondary text-sm">Process</button>
                  <button className="btn-secondary text-sm">Ink Save</button>
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <select className="input w-32">
                  <option>Images: 1 column</option>
                  <option>Images: 2 column</option>
                  <option>Images: 3 column</option>
                </select>
                <label>Width</label>
                <input type="number" className="input w-20" defaultValue="600" />
                <label>Height</label>
                <input type="number" className="input w-20" defaultValue="450" />
                <label>Rows X Cols</label>
                <select className="input w-24">
                  <option>4X2</option>
                  <option>3X2</option>
                  <option>2X2</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No images uploaded</p>
                <p className="text-sm text-gray-400 mt-1">Click Import to add images</p>
              </div>
            </div>
          )}

          {activeTab === 'multiframes' && (
            <div className="text-center py-12 text-gray-500">
              <p>Multiframes view will be displayed here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EchoScan
import { useState } from 'react'
import {
  Building2,
  ClipboardList,
  FileText,
  Hash,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Trash2,
  UserRoundCog,
  Users,
  X,
} from 'lucide-react'

const settingsTabs = [
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'report-config', label: 'Report Config', icon: FileText },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'company-tax', label: 'Company GST/PAN', icon: Building2 },
  { id: 'id-generation', label: 'ID Generation', icon: Hash },
  { id: 'sonographer', label: 'Sonographer', icon: Users },
  { id: 'referral-doctor', label: 'Referral Doctor', icon: UserRoundCog },
  { id: 'rule-three', label: 'Rule of Three', icon: ClipboardList },
]

const preferenceValidation = [
  'Indication should be given for all scans',
  'Primary consultant should be given for all scans',
  'Investigation status should be given for all scans',
  'Referred by not mandatory',
  'Do not display save confirmation message when I click save button',
  'Do not display delete confirmation message when I click delete button',
  'Do not display Reason for delete comments box',
  'User should not login more than one system at same time',
  'Scan data should not be modified by more than one user at same time',
  'Non administrator user should not modify scan data after',
]

const headerRows = ['Header Line1', 'Header Line2', 'Header Line3', 'Header Line4', 'Header Line5']
const reportSections = ['Pat. Demography', 'Scan', 'Indication', 'Impression', 'Organ name', 'Casehistory Title', 'ICD-10', 'Disclaimer', 'Abdomen', 'KUB']
const pndtSections = ['Title', 'sub title', 'Label', 'Value', 'Footer']
const sonographerModules = ['Patient Demography', 'Fetal Echo', 'Pediatric Echo', 'Adult Echo', 'Images', 'Template Report', 'Referral Letter']
const roleLabels = ['Primary Consultant', 'Second Consultant', 'Report Signed By (L)', 'Report Signed By (R)', 'Report Typed By']
const referralRows = [
  ['RAJESHWARI', '', '', 'Obstetrician & Gynecologist', ''],
  ['A SYED ABUTHAHIR', '', '', 'Obstetrician & Gynecologist', ''],
  ['AARTHI', 'RANGARAJ', '', 'Obstetrician & Gynecologist', ''],
  ['AJEET', 'ARULKUMAR', '', 'cardiologist', ''],
  ['AJUBA', '', '', 'Pediatrician', ''],
]

function Settings() {
  const [activeTab, setActiveTab] = useState(settingsTabs[0].id)

  return (
    <section className="settings-shell flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
        <div className="mb-3 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-semibold tracking-normal text-slate-950">Settings</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {settingsTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                activeTab === id
                  ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 p-3">
        {activeTab === 'preferences' && <PreferencesScreen />}
        {activeTab === 'report-config' && <ReportConfigScreen />}
        {activeTab === 'company' && <CompanyScreen />}
        {activeTab === 'company-tax' && <CompanyTaxScreen />}
        {activeTab === 'id-generation' && <IdGenerationScreen />}
        {activeTab === 'sonographer' && <SonographerScreen />}
        {activeTab === 'referral-doctor' && <ReferralDoctorScreen />}
        {activeTab === 'rule-three' && <RuleOfThreeScreen />}
      </div>
    </section>
  )
}

function ActionBar({ showDelete = true }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2 border-b border-slate-200 bg-white px-4 py-3">
      <button type="button" className="secondary-button"><Save className="h-4 w-4 text-teal-600" />Save</button>
      {showDelete && <button type="button" className="secondary-button"><Trash2 className="h-4 w-4 text-red-600" />Delete</button>}
      <button type="button" className="secondary-button"><RotateCcw className="h-4 w-4 text-red-600" />Clear</button>
      <button type="button" className="secondary-button"><X className="h-4 w-4 text-orange-600" />Close</button>
    </div>
  )
}

function Panel({ title, children, className = '' }) {
  return (
    <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {title && (
        <div className="border-b border-slate-200 bg-gradient-to-r from-teal-50 to-white px-4 py-3 text-sm font-semibold text-slate-900">
          {title}
        </div>
      )}
      <div className="p-3">{children}</div>
    </section>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`grid gap-1 text-sm font-medium text-slate-700 ${className}`}>
      <span>{label}</span>
      {children || <input className="legacy-input w-full" />}
    </label>
  )
}

function SelectField({ label, options = ['Select'], className = '' }) {
  return (
    <Field label={label} className={className}>
      <select className="legacy-input w-full">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </Field>
  )
}

function Check({ label, defaultChecked = false }) {
  return (
    <label className="flex min-h-8 items-center gap-2 text-sm text-slate-800">
      <input type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 rounded border-slate-300 accent-teal-600 focus:ring-teal-500" />
      <span>{label}</span>
    </label>
  )
}

function MiniTabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-4 pt-3">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`rounded-t-lg border border-b-0 px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
            active === tab ? 'border-teal-500 bg-teal-600 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

function SettingsTable({ headers, rows, minWidth = '720px' }) {
  return (
    <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
      <table className="data-table" style={{ minWidth }}>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${row[0]}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PreferencesScreen() {
  const [prefTab, setPrefTab] = useState('General')

  return (
    <Panel>
      <MiniTabs tabs={['General', 'Report', 'HIS Integration', 'Appearance', 'Setdefault']} active={prefTab} onChange={setPrefTab} />
      {prefTab === 'General' ? (
        <div className="grid gap-4 p-3">
          <div className="grid gap-3 lg:grid-cols-3">
            <Check label="User wise report setting" />
            <Check label="Auto start Dicom service" defaultChecked />
            <Check label="Auto database backup" defaultChecked />
          </div>
          <div className="grid items-end gap-3 lg:grid-cols-[1fr_200px_1fr]">
            <div className="flex flex-wrap gap-6">
              <Check label="Check Report completed in Impression screen to lock the scan report" />
              <Check label="Print QRCode in report" />
            </div>
            <Field label="Center Id./ Name" />
          </div>
          <fieldset className="rounded-lg border border-slate-300 bg-white/60 p-3">
            <legend className="px-2 text-sm font-semibold text-slate-800">Validation messages</legend>
            <div className="grid gap-1">
              {preferenceValidation.map((label, index) => (
                <div key={label} className="flex flex-wrap items-center gap-2">
                  <Check label={label} defaultChecked={index >= 4 && index <= 6} />
                  {label.endsWith('after') && <><input className="legacy-input h-8 w-20" defaultValue="3" /><span className="text-sm">day(s)</span></>}
                </div>
              ))}
            </div>
          </fieldset>
        </div>
      ) : (
        <div className="grid gap-4 p-3 lg:grid-cols-2">
          <Panel title={`${prefTab} settings`}>
            <div className="grid gap-3">
              <Check label={`Enable ${prefTab.toLowerCase()} defaults`} />
              <Check label="Apply setting to new scans" />
              <Field label="Default value" />
              <textarea className="legacy-input h-28 w-full resize-none py-2" placeholder={`${prefTab} notes`} />
            </div>
          </Panel>
          <Panel title="Options">
            <div className="grid gap-3">
              <SelectField label="Default profile" options={['Select', 'Default', 'Clinic', 'Reporting']} />
              <Field label="Code / Identifier" />
              <Check label="Inactive" />
            </div>
          </Panel>
        </div>
      )}
      <div className="flex justify-center border-t border-slate-200 p-3">
        <button type="button" className="legacy-action-button min-w-40">Close</button>
      </div>
    </Panel>
  )
}

function ReportConfigScreen() {
  const [configTab, setConfigTab] = useState('Report Config')
  const [styleTab, setStyleTab] = useState('Titles setting')

  const headerData = headerRows.map((row, index) => [
    row,
    index === 0 ? 'T & M Caring Hearts Clinic' : '',
    index === 0 ? 'Only image' : index < 3 ? 'Both' : 'None',
    'Arial',
    index < 3 ? '12' : '15',
    <input type="checkbox" defaultChecked />,
    <input type="checkbox" />,
    <input type="checkbox" />,
    'Black',
  ])

  const fontRows = reportSections.map((section, index) => [
    section,
    <input type="checkbox" defaultChecked />,
    'Arial',
    index === 1 ? '15' : '12',
    <input type="checkbox" defaultChecked={index < 5} />,
    <input type="checkbox" defaultChecked={section === 'Impression'} />,
    <input type="checkbox" defaultChecked={section === 'Impression'} />,
    index === 1 ? 'Center' : 'Left',
    'Black',
  ])

  const pndtRows = pndtSections.map((section) => [
    section,
    'Arial',
    '8',
    <input type="checkbox" />,
    <input type="checkbox" />,
    <input type="checkbox" />,
    'Left',
    'Black',
  ])

  return (
    <Panel>
      <ActionBar showDelete={false} />
      <MiniTabs tabs={['Report Config', 'Customization for default report text']} active={configTab} onChange={setConfigTab} />
      <div className="grid gap-4 p-3">
        <Panel title="Hospital address - Font style">
          <SettingsTable
            headers={['Sections', 'Text', 'Print', 'Font name', 'Size', 'Bold', 'Italic', 'UnderLine', 'Color']}
            rows={headerData}
            minWidth="900px"
          />
        </Panel>
        <Panel>
          <MiniTabs tabs={['Titles setting', 'Comments setting']} active={styleTab} onChange={setStyleTab} />
          <div className="grid gap-4 p-3">
            <div className="flex flex-wrap gap-8 rounded-lg bg-white/60 p-3">
              <label className="flex items-center gap-2 text-sm"><input type="radio" name="detail" /> Default</label>
              <label className="flex items-center gap-2 text-sm"><input type="radio" name="detail" defaultChecked /> Detailed setting</label>
              <span className="text-sm font-semibold">Print titles</span>
              <label className="flex items-center gap-2 text-sm"><input type="radio" name="print-title" /> Always No</label>
              <label className="flex items-center gap-2 text-sm"><input type="radio" name="print-title" defaultChecked /> Always Yes</label>
              <label className="flex items-center gap-2 text-sm"><input type="radio" name="print-title" /> Custom</label>
            </div>
            <Panel title="Font styles">
              <SettingsTable headers={['Sections', 'Print', 'Font name', 'Size', 'Bold', 'Italic', 'UnderLine', 'Align', 'Text color']} rows={fontRows} minWidth="980px" />
            </Panel>
            <Panel title="PNDT font styles">
              <SettingsTable headers={['Sections', 'Font name', 'Size', 'Bold', 'Italic', 'UnderLine', 'Align', 'Text color']} rows={pndtRows} minWidth="820px" />
            </Panel>
          </div>
        </Panel>
      </div>
    </Panel>
  )
}

function CompanyScreen() {
  return (
    <Panel>
      <ActionBar />
      <div className="grid gap-4 p-3">
        <div className="grid gap-3 xl:grid-cols-2">
          <div className="grid gap-3">
            <Field label="Company name" />
            <Field label="Registration No" />
            <Field label="Short Name" />
            <Field label="Street" />
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Field label="Zip Code" />
              <button type="button" className="legacy-small-button self-end">Add / Modify</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField label="Country" options={['India', 'Select']} />
              <SelectField label="State" />
            </div>
            <Field label="Phone #" />
            <Field label="Fax" />
          </div>
          <div className="grid gap-3">
            <Check label="Inactive" />
            <Field label="Comments"><textarea className="legacy-input h-24 w-full resize-none py-2" /></Field>
            <Field label="Area" />
            <SelectField label="Area (P.O)" />
            <SelectField label="City" />
            <Field label="Mobile #" />
            <Field label="Email Id" />
          </div>
        </div>
        <SettingsTable headers={['Company name', 'Country', 'City']} rows={[['Company_Name', '', '']]} />
      </div>
    </Panel>
  )
}

function CompanyTaxScreen() {
  return (
    <Panel>
      <ActionBar />
      <div className="grid gap-4 p-3">
        <div className="grid max-w-4xl gap-3 lg:grid-cols-[1fr_auto]">
          <div className="grid gap-3">
            <Field label="Company name" />
            <Field label="Registration No." />
            <Field label="GST and PAN" />
          </div>
          <Check label="Inactive" />
        </div>
        <div className="min-h-[220px] rounded-lg border border-slate-300 bg-white" />
      </div>
    </Panel>
  )
}

function IdGenerationScreen() {
  const [mode, setMode] = useState('Manual ID')
  const modes = [
    'Manual ID',
    'Increase Serial No. one by one',
    'Add zeros before Serial No.',
    'Add Alphabets and zeros before Serial No.',
    'Custom Serial No.',
  ]

  return (
    <Panel>
      <ActionBar showDelete={false} />
      <MiniTabs tabs={['PatientID']} active="PatientID" onChange={() => {}} />
      <div className="grid min-h-[340px] content-start gap-4 p-6">
        {modes.map((label) => (
          <label key={label} className="flex items-center gap-3 text-sm text-slate-800">
            <input type="radio" name="patient-id-mode" checked={mode === label} onChange={() => setMode(label)} />
            {label}
          </label>
        ))}
        <p className="mt-16 text-sm font-semibold text-slate-950">
          {mode === 'Manual ID' ? 'User should enter manual ID' : `Selected option: ${mode}`}
        </p>
      </div>
    </Panel>
  )
}

function SonographerScreen() {
  const userRows = [
    ['ADMINISTRATOR', '', '', 'ADMINISTRATOR', <input type="checkbox" defaultChecked />],
    ['DR C.SHANTHI MBBS, DCH, DNB', 'FNB(PED CARDIO)', '', 'CS', <input type="checkbox" />],
    ['MEDIALOGIC', '', '', 'MEDIALOGIC', <input type="checkbox" />],
    ['SHANTHI', 'C', '', 'ADMIN', <input type="checkbox" />],
    ['SONOCARE', '', '', 'SONOCARE', <input type="checkbox" />],
  ]

  const rightsRows = sonographerModules.map((moduleName) => [
    moduleName,
    <input type="checkbox" />,
    <input type="checkbox" />,
    <input type="checkbox" />,
  ])

  return (
    <Panel>
      <ActionBar />
      <div className="grid gap-4 p-3">
        <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="First name" />
              <Field label="Last name" />
              <Field label="Middle name" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Initials" />
              <Check label="Administrator" />
            </div>
            <Field label="User name" />
            <Field label="Password"><input type="password" className="legacy-input w-full" /></Field>
            <Field label="Confirm password"><input type="password" className="legacy-input w-full" /></Field>
            <SelectField label="Designation" />
            <Field label="Mobile" />
            <Field label="Alt. mobile" />
            <Field label="Email" />
          </div>
          <div className="grid gap-3 content-start">
            <div className="flex flex-wrap gap-6">
              <Check label="Set default user" />
              <Check label="Inactive" />
            </div>
            <Panel title="User type">
              <div className="grid gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="user-type" defaultChecked /> Doctor</label>
                <Field label="Reg. no" />
                <Field label="Signature">
                  <button type="button" className="h-14 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-red-600">
                    Click here to add signature, Image Dimensions 58 * 13
                  </button>
                </Field>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="user-type" /> Other user</label>
              </div>
            </Panel>
            <Panel title="Roles">
              <div className="grid gap-1 sm:grid-cols-2">
                {roleLabels.map((role) => <Check key={role} label={role} />)}
              </div>
            </Panel>
          </div>
        </div>
        <Panel title="User rights">
          <SettingsTable headers={['Module name', 'Read only', 'Save', 'Delete']} rows={rightsRows} minWidth="720px" />
        </Panel>
        <Panel title="Sonographer / Sonologist information">
          <SettingsTable headers={['First name', 'Last name', 'Initials', 'User name', 'Inactive']} rows={userRows} minWidth="780px" />
        </Panel>
      </div>
    </Panel>
  )
}

function ReferralDoctorScreen() {
  return (
    <Panel>
      <ActionBar />
      <div className="grid gap-4 p-3">
        <div className="flex flex-wrap items-center gap-5">
          <span className="text-sm font-semibold">Referred by</span>
          <label className="flex items-center gap-2 text-sm"><input type="radio" name="referred-by" defaultChecked /> Doctor</label>
          <label className="flex items-center gap-2 text-sm"><input type="radio" name="referred-by" /> Hospital</label>
        </div>
        <div className="grid gap-3 xl:grid-cols-3">
          <SelectField label="Salutation" options={['Dr.', 'Mr.', 'Mrs.', 'Ms.']} />
          <Field label="First name" />
          <Field label="Last name" />
          <Field label="Middle name" />
          <Field label="Reg. no" />
          <SelectField label="Speciality" options={['Select', 'Obstetrician & Gynecologist', 'cardiologist', 'Pediatrician', 'OTHERS']} />
          <Field label="Qualification" />
          <Field label="Institution" />
          <Field label="Designation" />
          <Field label="Street" />
          <SelectField label="Area (P.O)" />
          <Field label="Area" />
          <Field label="City" />
          <Field label="Zip Code" />
          <SelectField label="Country" options={['India', 'Select']} />
          <SelectField label="State" />
          <Field label="Phone #" />
          <Field label="Mobile #" />
          <Field label="Fax" />
          <Field label="Email Id" />
          <Check label="Set as default" />
          <Check label="Inactive" />
        </div>
        <SettingsTable
          headers={['First name', 'Last name', 'Registration no', 'Speciality', 'Institution name']}
          rows={referralRows}
          minWidth="920px"
        />
      </div>
    </Panel>
  )
}

function RuleOfThreeScreen() {
  const [ruleTab, setRuleTab] = useState('Title type')

  return (
    <Panel>
      <ActionBar />
      <MiniTabs tabs={['Title type', 'Title', 'Template']} active={ruleTab} onChange={setRuleTab} />
      <div className="grid gap-4 p-3">
        <Panel>
          <div className="grid max-w-2xl grid-cols-[120px_1fr] items-center gap-3 p-4">
            <span className="text-sm font-medium">{ruleTab}</span>
            <input className="legacy-input w-full" />
          </div>
          <div className="min-h-[180px]" />
        </Panel>
        <SettingsTable
          headers={[ruleTab]}
          rows={[['FETAL ECHO'], ['OB Rule of Three'], ['Pediatric Echo']]}
          minWidth="520px"
        />
      </div>
    </Panel>
  )
}

export default Settings

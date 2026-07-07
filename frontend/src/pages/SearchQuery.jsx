import { useMemo, useState } from 'react'
import {
  BarChart3,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'

const today = new Date().toISOString().slice(0, 10)

const referralDoctors = [
  { firstName: 'RAJESHWARI', lastName: '', speciality: 'Obstetrician & Gynecologist' },
  { firstName: 'A SYED ABUTHAHIR', lastName: '', speciality: 'Obstetrician & Gynecologist' },
  { firstName: 'AARTHI', lastName: 'RANGARAJ', speciality: 'Obstetrician & Gynecologist' },
  { firstName: 'AJEET', lastName: 'ARULKUMAR', speciality: 'Cardiologist' },
]

const scanTypes = [
  'Upper Abdomen',
  'KUB',
  'Pelvis',
  'Follicular Study',
  'Obstetrics',
  'Thyroid',
  'Male Genitalia',
  'Breast',
  'Adult Echo',
  'Fetal Echo',
  'Pediatric Echo',
  'Template report',
]

const printableColumns = [
  'Patient ID',
  'Name',
  'Gender',
  'Date of birth',
  'Address',
  'Visit date',
  'Visit no',
  'Referral doctor',
  'Age',
  'Alias ID',
]

const investigationStatuses = ['Abnormal', 'Ambiguity', 'Growth Abnormality', 'Normal', 'Normal variant']

const queryTabs = [
  { id: 'advanced', label: 'Advanced Query', icon: ClipboardList },
  { id: 'rule-three', label: 'Rule of Three Query', icon: FileSpreadsheet },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
]

function SearchQuery() {
  const [activeTab, setActiveTab] = useState('advanced')

  const ActiveIcon = useMemo(
    () => queryTabs.find((tab) => tab.id === activeTab)?.icon || ClipboardList,
    [activeTab],
  )

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
        <div className="mb-3 flex items-center gap-2">
          <ActiveIcon className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-semibold tracking-normal text-slate-950">Search Query</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {queryTabs.map(({ id, label, icon: Icon }) => (
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
        {activeTab === 'advanced' && <AdvancedQuery />}
        {activeTab === 'rule-three' && <RuleOfThreeQuery />}
        {activeTab === 'statistics' && <StatisticsQuery />}
      </div>
    </section>
  )
}

function AdvancedQuery() {
  return (
    <div className="grid min-h-full gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Panel className="min-w-0">
        <ActionBar actions={['Clear', 'Preview', 'Close']} />
        <div className="grid gap-4 p-4">
          <Panel title="Sonocare Queries (choose one or combination of fields)">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DateField label="From" defaultValue={today} withCheckbox />
                  <DateField label="To" defaultValue={today} />
                </div>
                <SelectField label="Sex" options={['Select', 'Male', 'Female', 'UA']} />
                <TextField label="First name" />
                <div className="grid gap-3 sm:grid-cols-[1fr_110px_110px]">
                  <span className="field-label self-end">Age</span>
                  <TextField label="From" hideLabel />
                  <TextField label="To" hideLabel />
                </div>
                <ReferralDoctorGrid />
                <ScanTypeList />
                <TextAreaField label="Diagnosis (Final Imp.)" rows={3} />
                <SelectField label="Primary consultant" options={['Select']} />
                <SelectField label="Signed by (L)" options={['Select']} />
                <SelectField label="Signed by (R)" options={['Select']} />
                <TextField label="Cross ref.Id" />
                <TextField label="Cross ref.Name" />
              </div>

              <div className="grid content-start gap-3">
                <div className="flex justify-end">
                  <button type="button" className="primary-button min-w-36">
                    <Search className="h-4 w-4" />
                    Search
                  </button>
                </div>
                <TextField label="Patient ID" />
                <TextField label="Last name" />
                <SelectField label="Ethnic Origin" options={['Select']} />
                <TextAreaField label="Scan title" rows={2} />
                <SelectField label="Investigation status" options={['Select', ...investigationStatuses]} />
                <TextAreaField label="Indication" rows={3} />
                <TextAreaField label="Internal comments" rows={3} />
                <SelectField label="Audited by" options={['Select']} />
                <SelectField label="Second consultant" options={['Select']} />
                <SelectField label="Typed by" options={['Select']} />
                <SelectField label="Reviewed by" options={['Select']} />
                <TextAreaField label="Cross comments" rows={2} />
              </div>
            </div>
          </Panel>
        </div>
      </Panel>

      <Panel className="min-w-0">
        <div className="grid gap-4 p-4">
          <Field label="Save as query name">
            <select className="field-control">
              <option>Select</option>
            </select>
          </Field>
          <Panel title="Select columns to print">
            <div className="max-h-44 overflow-auto rounded-lg border border-slate-200 bg-white p-2">
              {printableColumns.map((column) => (
                <Check key={column} label={column} />
              ))}
            </div>
          </Panel>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="secondary-button justify-center"><Save className="h-4 w-4 text-teal-600" />Save</button>
            <button type="button" className="secondary-button justify-center"><Trash2 className="h-4 w-4 text-red-600" />Delete</button>
            <button type="button" className="secondary-button justify-center">Select</button>
            <button type="button" className="secondary-button justify-center"><RotateCcw className="h-4 w-4 text-red-600" />Clear</button>
          </div>
          <TextAreaField label="Query description" rows={14} />
        </div>
      </Panel>
    </div>
  )
}

function RuleOfThreeQuery() {
  return (
    <Panel className="min-h-full">
      <div className="grid gap-4 p-4">
        <div className="grid items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-[1fr_1.1fr_0.75fr_auto]">
          <div className="grid gap-3 sm:grid-cols-2">
            {['Today', 'Yesterday', 'Last 7-days', 'Last 1-month', 'Customize'].map((option, index) => (
              <Radio key={option} name="rule-date-range" label={option} defaultChecked={index === 0} />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField label="From Date" defaultValue={today} />
            <DateField label="To Date" defaultValue={today} />
            <Field label="Template name" className="sm:col-span-2">
              <select className="field-control">
                <option>Select</option>
              </select>
            </Field>
          </div>
          <Panel title="Template">
            <div className="grid gap-2">
              <Radio name="template-status" label="Completed" defaultChecked />
              <Radio name="template-status" label="Partially done" />
            </div>
          </Panel>
          <button type="button" className="primary-button min-w-28 justify-center">
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>

        <div className="min-h-[420px] rounded-xl border border-slate-200 bg-white shadow-sm" />

        <div>
          <button type="button" className="secondary-button">
            <Download className="h-4 w-4 text-teal-600" />
            Export to excel
          </button>
        </div>
      </div>
    </Panel>
  )
}

function StatisticsQuery() {
  return (
    <Panel className="min-h-full">
      <ActionBar actions={['Clear', 'Preview', 'Close']} />
      <div className="grid gap-4 p-4">
        <div className="grid items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[180px_180px_180px_auto_1fr]">
          <DateField label="From" defaultValue={today} />
          <DateField label="To" defaultValue={today} />
          <SelectField label="Sex" options={['Select', 'Male', 'Female', 'UA']} />
          <button type="button" className="primary-button justify-center">
            <Search className="h-4 w-4" />
            Search
          </button>
          <div className="flex flex-wrap gap-4 lg:justify-end">
            <Radio name="icd-code" label="Provisional Icd Code" />
            <Radio name="icd-code" label="Final Icd Code" />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[390px_290px_1fr]">
          <Panel title="Scan Types">
            <div className="min-h-[480px] rounded-lg border border-slate-200 bg-white p-3">
              <TreeCheck label="Scan type" defaultExpanded>
                {scanTypes.map((type) => (
                  <TreeCheck key={type} label={type} leaf />
                ))}
              </TreeCheck>
            </div>
          </Panel>
          <Panel title="Investigation status">
            <div className="min-h-[260px] rounded-lg border border-slate-200 bg-white p-3">
              {investigationStatuses.map((status) => (
                <Check key={status} label={status} />
              ))}
            </div>
          </Panel>
          <div className="min-h-[480px] rounded-xl border border-dashed border-slate-300 bg-white/70" />
        </div>
      </div>
    </Panel>
  )
}

function ActionBar({ actions }) {
  const icons = {
    Clear: RotateCcw,
    Preview: Printer,
    Close: X,
  }

  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-4 py-3">
      {actions.map((action) => {
        const Icon = icons[action]
        const tone = action === 'Close' ? 'text-orange-600' : action === 'Clear' ? 'text-red-600' : 'text-teal-600'

        return (
          <button key={action} type="button" className="secondary-button">
            {Icon ? <Icon className={`h-4 w-4 ${tone}`} /> : null}
            {action}
          </button>
        )
      })}
    </div>
  )
}

function ReferralDoctorGrid() {
  return (
    <Panel title="Referral Doctor">
      <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="data-table min-w-[560px]">
          <thead>
            <tr>
              <th>Select</th>
              <th>First name</th>
              <th>Last name</th>
              <th>Speciality</th>
            </tr>
          </thead>
          <tbody>
            {referralDoctors.map((doctor, index) => (
              <tr key={`${doctor.firstName}-${doctor.lastName}`}>
                <td>
                  <input type="checkbox" defaultChecked={index === 0} className="h-4 w-4 rounded border-slate-300 accent-teal-600" />
                </td>
                <td>{doctor.firstName}</td>
                <td>{doctor.lastName || '-'}</td>
                <td>{doctor.speciality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function ScanTypeList() {
  return (
    <Panel title="Scan type">
      <div className="grid max-h-48 gap-1 overflow-auto rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-2">
        {scanTypes.slice(0, 8).map((scanType) => (
          <Check key={scanType} label={scanType} />
        ))}
      </div>
    </Panel>
  )
}

function TreeCheck({ label, children, leaf = false }) {
  return (
    <div className={leaf ? 'ml-6 border-l border-dotted border-slate-300 pl-3' : ''}>
      <Check label={label} />
      {children ? <div className="mt-1 grid gap-1">{children}</div> : null}
    </div>
  )
}

function Panel({ title, children, className = '' }) {
  return (
    <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {title ? (
        <div className="border-b border-slate-200 bg-gradient-to-r from-teal-50 to-white px-4 py-3 text-sm font-semibold text-slate-900">
          {title}
        </div>
      ) : null}
      {children}
    </section>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`field-label ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function TextField({ label, hideLabel = false }) {
  return (
    <Field label={hideLabel ? '\u00a0' : label}>
      <input className="field-control" />
    </Field>
  )
}

function TextAreaField({ label, rows = 3 }) {
  return (
    <Field label={label}>
      <textarea rows={rows} className="field-control h-auto min-h-0 resize-y py-2" />
    </Field>
  )
}

function DateField({ label, defaultValue, withCheckbox = false }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        {withCheckbox ? <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-teal-600" /> : null}
        <input type="date" defaultValue={defaultValue} className="field-control" />
      </div>
    </Field>
  )
}

function SelectField({ label, options }) {
  return (
    <Field label={label}>
      <select className="field-control">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </Field>
  )
}

function Check({ label, defaultChecked = false }) {
  return (
    <label className="flex min-h-7 items-center gap-2 text-sm text-slate-800">
      <input type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 rounded border-slate-300 accent-teal-600 focus:ring-teal-500" />
      <span>{label}</span>
    </label>
  )
}

function Radio({ name, label, defaultChecked = false }) {
  return (
    <label className="flex min-h-7 items-center gap-2 text-sm text-slate-800">
      <input type="radio" name={name} defaultChecked={defaultChecked} className="h-4 w-4 border-slate-300 accent-teal-600 focus:ring-teal-500" />
      <span>{label}</span>
    </label>
  )
}

export default SearchQuery

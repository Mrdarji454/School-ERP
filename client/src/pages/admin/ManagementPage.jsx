import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { management } from '../../config/management';
import { useAcademicScope } from '../../context/AcademicScopeState';
import useManagementList from '../../hooks/useManagementList';
import { saveManagement, deactivateManagement, restoreManagement, setCurrentYear } from '../../services/managementService';
import { refId, recordName, optionLabel, apiError } from '../../utils/management';
import { academicColumns, initialAcademicFilters, changeAcademicFilter } from '../../utils/academicPresentation';
import DataTable from '../../components/table/DataTable';
import Pagination from '../../components/table/Pagination';
import InputField from '../../components/ui/InputField';
import SelectField from '../../components/ui/SelectField';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import Modal from '../../components/modal/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AcademicYearSelect from '../../components/management/AcademicYearSelect';
import ManagementForm from '../../components/management/ManagementForm';
import ManagementDetails from '../../components/management/ManagementDetails';
import '../../styles/academics.css';

export default function ManagementPage({ resource }) {
  const config = management[resource], scope = useAcademicScope();
  const [filters, setFilters] = useState(initialAcademicFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = { ...filters, ...(config.yearScoped && scope.year ? { academicYear: scope.year } : {}) };
  const list = useManagementList(resource, query);
  const [form, setForm] = useState(null), [detail, setDetail] = useState(null), [confirmation, setConfirmation] = useState(null), [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false), lock = useRef(false), heading = useRef(null);
  const currentYear = scope.options.years.find(year => year.isCurrent);
  const selectedYear = scope.options.years.find(year => year._id === scope.year);
  const formDisabled = busy || scope.loading || Boolean(scope.error);
  const changeFilter = (name, value) => setFilters(prev => changeAcademicFilter(prev, name, value));
  const changeYear = value => { scope.setYear(value); setFilters(prev => ({ ...prev, schoolClass: '', section: '', subject: '', page: 1 })); };
  const resetFilters = () => { if (config.yearScoped) scope.setYear(''); setFilters(initialAcademicFilters()); };
  const showForm = record => { setForm({ record }); heading.current?.focus(); };
  const closeForm = () => { if (!lock.current) { setForm(null); heading.current?.focus(); } };
  const execute = async (action, message) => {
    if (lock.current) throw new Error('A request is already in progress');
    lock.current = true; setBusy(true);
    try { const result = await action(); toast.success(message); list.reload(); await scope.refreshOptions(); return result; }
    finally { lock.current = false; setBusy(false); }
  };
  const save = async data => { await execute(() => saveManagement(resource, form.record?._id, data), `${config.singular} saved`); setForm(null); heading.current?.focus(); };
  const ask = (action, record) => { setActionError(''); setConfirmation({ action, record }); };
  const confirm = async () => {
    if (lock.current) return;
    setActionError('');
    const { action, record } = confirmation;
    try {
      await execute(() => action === 'current' ? setCurrentYear(record._id) : action === 'restore' ? restoreManagement(resource, record._id) : deactivateManagement(resource, record._id), action === 'current' ? 'Current academic year changed' : `${config.singular} ${action === 'restore' ? 'restored' : 'deactivated'}`);
      setConfirmation(null);
    } catch (error) { setActionError(apiError(error)); }
  };
  const confirmAction = confirmation?.action;
  const confirmName = confirmation ? recordName(resource, confirmation.record) : '';
  const confirmMessage = confirmAction === 'current' ? `Make “${confirmName}” the current academic year? The previous current year will be unset. This does not promote students or rewrite historical records.` : confirmAction === 'restore' ? `Restore “${confirmName}”? Referenced records must be active and unique constraints must still be satisfied. Historical relationships are retained.` : `Deactivate “${confirmName}”? Historical records are retained and this action is reversible. ${resource === 'classes' ? 'Linked students, sections, subjects and assignments remain. Review dependencies first.' : resource === 'academic-years' ? 'Deactivating the current year clears its current status.' : 'Inactive records are excluded from eligible selections.'}`;
  const viewColumns = academicColumns(resource);
  const badge = record => <span className={`academic-status ${record.isActive ? 'active' : 'inactive'}`}>{record.isActive ? 'Active' : 'Inactive'}</span>;
  const actions = record => <div className="academic-record-actions" aria-label={`Actions for ${recordName(resource, record)}`}>
    <button type="button" onClick={() => setDetail(record)}>View{resource === 'classes' ? ' dependencies' : ''}</button>
    <button type="button" disabled={formDisabled} onClick={() => showForm(record)}>Edit</button>
    <button type="button" disabled={busy} onClick={() => ask(record.isActive ? 'deactivate' : 'restore', record)}>{record.isActive ? 'Deactivate' : 'Restore'}</button>
    {resource === 'academic-years' && !record.isCurrent && record.isActive && <button type="button" disabled={busy} onClick={() => ask('current', record)}>Set current</button>}
  </div>;
  const columns = [...viewColumns.map((column, index) => ({ header: column.header, render: row => <span className={index === 0 ? 'academic-record-name' : ''}>{column.value(row)}</span> })), { header: 'Status', render: badge }, { header: 'Actions', render: actions }];
  const filterCount = [filters.status !== 'all', config.yearScoped && scope.year, filters.schoolClass, filters.section, filters.teacher, filters.subject].filter(Boolean).length;
  const count = list.pagination.total;
  const rangeStart = count ? (list.pagination.page - 1) * list.pagination.limit + 1 : 0;
  const rangeEnd = Math.min(list.pagination.page * list.pagination.limit, count);
  return <div className="academic-page">
    <nav aria-label="Breadcrumb" className="academic-breadcrumb">Admin <span aria-hidden="true">/</span> Academics <span aria-hidden="true">/</span> {config.title}</nav>
    <header className="academic-heading"><div><h1 ref={heading} tabIndex={-1}>{form ? `${form.record ? 'Edit' : 'Add'} ${config.singular}` : config.title}</h1><p>{form ? 'Set up the record. Required fields are marked *.' : config.description}</p></div>
      {form ? <SecondaryButton disabled={busy} onClick={closeForm}>Back to {config.title.toLowerCase()}</SecondaryButton> : <PrimaryButton disabled={formDisabled} onClick={() => showForm(null)}>+ Add {resource === 'teacher-assignments' ? 'assignment' : config.singular.toLowerCase()}</PrimaryButton>}
    </header>
    {scope.error && <div role="alert" className="academic-error"><p>Academic options could not be loaded: {scope.error}</p><SecondaryButton onClick={scope.refreshOptions}>Retry options</SecondaryButton></div>}
    {form ? <section className="academic-panel academic-form-panel" aria-label={`${config.singular} form`}><ManagementForm key={form.record?._id || 'new'} resource={resource} record={form.record} options={scope.options} selectedYear={scope.options.years.some(y => y._id === scope.year && y.eligible) ? scope.year : ''} busy={busy} onSave={save} onCancel={closeForm} /></section> : <>
      <section className="academic-panel academic-context" aria-label="Academic context"><h2>{resource === 'academic-years' ? `Current year · ${currentYear?.name || (scope.loading ? 'Loading…' : 'Not selected')}` : resource === 'periods' ? 'School-wide periods' : `Working year · ${selectedYear?.name || (scope.year ? 'Unavailable year' : 'All academic years')}`}</h2><p>{config.note}</p></section>
      <section className="academic-panel academic-filters" aria-label={`${config.title} filters`}>
        <InputField id="management-search" label="Search" type="search" value={filters.search} maxLength={100} placeholder={`Search ${config.title.toLowerCase()}`} onChange={e => changeFilter('search', e.target.value)} />
        <button type="button" className="academic-filter-toggle" aria-expanded={filtersOpen} aria-controls="academic-filter-fields" onClick={() => setFiltersOpen(open => !open)}>Filters{filterCount ? ` · ${filterCount} applied` : ' · All records'}</button>
        <div id="academic-filter-fields" className={`academic-filter-fields${filtersOpen ? ' expanded' : ''}`}>
          <SelectField id="management-status" label="Status" value={filters.status} onChange={e => changeFilter('status', e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></SelectField>
          {config.yearScoped && <AcademicYearSelect years={scope.options.years} value={scope.year} onChange={changeYear} disabled={scope.loading} />}
          {config.classScoped && <SelectField id="management-class-filter" label="Class" value={filters.schoolClass} onChange={e => changeFilter('schoolClass', e.target.value)} disabled={scope.loading}><option value="">All classes</option>{scope.options.classes.filter(c => !scope.year || refId(c.academicYear) === scope.year).map(c => <option key={c._id} value={c._id}>{optionLabel(c)} · {scope.options.years.find(y => y._id === refId(c.academicYear))?.name}</option>)}</SelectField>}
          {resource === 'teacher-assignments' && <>
            <SelectField id="assignment-section-filter" label="Section" value={filters.section} onChange={e => changeFilter('section', e.target.value)} disabled={!filters.schoolClass || scope.loading}><option value="">All sections</option>{scope.options.sections.filter(s => refId(s.schoolClass) === filters.schoolClass).map(s => <option key={s._id} value={s._id}>{optionLabel(s)}</option>)}</SelectField>
            <SelectField id="assignment-teacher-filter" label="Teacher" value={filters.teacher} onChange={e => changeFilter('teacher', e.target.value)} disabled={scope.loading}><option value="">All teachers</option>{scope.options.teachers.map(t => <option key={t._id} value={t._id}>{optionLabel(t)}</option>)}</SelectField>
            <SelectField id="assignment-subject-filter" label="Subject" value={filters.subject} onChange={e => changeFilter('subject', e.target.value)} disabled={!filters.schoolClass || scope.loading}><option value="">All subjects</option>{scope.options.subjects.filter(s => refId(s.schoolClass) === filters.schoolClass).map(s => <option key={s._id} value={s._id}>{optionLabel(s)}</option>)}</SelectField>
          </>}
          <div className="academic-filter-actions"><SecondaryButton onClick={resetFilters}>Clear filters</SecondaryButton><SecondaryButton disabled={list.loading} onClick={list.reload}>Refresh</SecondaryButton></div>
        </div>
      </section>
      <p role="status" className="academic-match-count">{list.loading ? 'Loading records…' : list.error ? 'Records unavailable' : `${count} matching ${config.title.toLowerCase()}`}</p>
      {list.error && !list.loading ? <div role="alert" className="academic-error"><h2>Could not load records</h2><p>{list.error} Your filters are preserved.</p><SecondaryButton onClick={list.reload}>Retry list</SecondaryButton></div> : <section className="academic-results" aria-label={`${config.title} results`}>
        <DataTable columns={columns} data={list.records} loading={list.loading} emptyMessage="No matching records" mobileRender={record => <article className="academic-mobile-card"><div className="academic-mobile-card-heading"><h2>{viewColumns[0].value(record)}</h2>{badge(record)}</div><dl>{viewColumns.slice(1).map(column => <div key={column.header}><dt>{column.header}:</dt><dd>{column.value(record)}</dd></div>)}</dl>{actions(record)}</article>} />
        {!list.loading && !list.records.length && <div className="academic-empty-action"><p>Change your filters or add a new {config.singular.toLowerCase()}.</p><SecondaryButton onClick={resetFilters}>Clear filters</SecondaryButton></div>}
        <div className="academic-pagination"><span>{list.loading ? 'Loading…' : `${rangeStart}–${rangeEnd} of ${count} matching records`}</span><label className="academic-page-size">Rows per page<select value={filters.limit} onChange={e => changeFilter('limit', Number(e.target.value))}>{[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}</select></label><Pagination page={list.pagination.page} totalPages={list.pagination.totalPages} disabled={list.loading || busy} onPageChange={page => setFilters(prev => ({ ...prev, page }))} /></div>
      </section>}
    </>}
    <Modal className="academic-dialog" isOpen={Boolean(detail)} onClose={() => setDetail(null)} title={`${config.singular} details`} width="max-w-3xl">{detail && <ManagementDetails key={detail._id} resource={resource} record={detail} />}</Modal>
    <ConfirmDialog isOpen={Boolean(confirmation)} onClose={() => { if (!busy) setConfirmation(null); }} onConfirm={confirm} loading={busy} title={confirmAction === 'current' ? 'Change current academic year' : `${confirmAction === 'restore' ? 'Restore' : 'Deactivate'} ${config.singular.toLowerCase()}`} confirmLabel={confirmAction === 'current' ? 'Set current year' : confirmAction === 'restore' ? 'Restore' : 'Deactivate'} message={confirmMessage} error={actionError} />
  </div>;
}

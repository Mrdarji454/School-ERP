import { useRef, useState } from 'react';
import api from '../../services/api';
import { downloadWorkbook } from '../../services/workbookService';
import { apiError } from '../../utils/management';
import PrimaryButton from '../ui/PrimaryButton';
import SecondaryButton from '../ui/SecondaryButton';
import SelectField from '../ui/SelectField';
import DataTable from '../table/DataTable';
export default function PeopleImport({ kind, onSaved, onBusy }) {
  const [file, setFile] = useState(null), [mode, setMode] = useState('create'), [result, setResult] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);
  const run = async phase => {
    if (!file || lock.current) return;
    lock.current = true; setBusy(true); onBusy?.(true); setError('');
    try {
      if (!/\.xlsx$/i.test(file.name) || file.size > 5 * 1024 * 1024) throw new Error('Choose an .xlsx file up to 5 MB.');
      const body = new FormData(); body.append('file', file); body.append('mode', mode); body.append('phase', phase);
      if (phase === 'commit') body.append('previewToken', result.previewToken);
      const response = await api.post(`/people/${kind}/import`, body, { headers: { 'Content-Type': undefined } }); setResult(response.data.data);
      if (phase === 'commit') onSaved();
    } catch (e) { setError(apiError(e)); } finally { lock.current = false; setBusy(false); onBusy?.(false); }
  };
  return <div className="space-y-4"><p className="text-sm text-slate-600">Use the template and its Instructions sheet. Maximum 1000 rows / 5 MB. Updates match immutable IDs, or a fully scoped student roll number. Blank cells preserve existing values. Passwords must be blank for updates.</p><SecondaryButton disabled={busy} onClick={async () => { try { await downloadWorkbook(`/people/${kind}/template`, {}, `${kind}-template.xlsx`); } catch (e) { setError(apiError(e)); } }}>Download template</SecondaryButton>
    <SelectField id="import-mode" label="Import mode" value={mode} disabled={busy} onChange={e => { setMode(e.target.value); setResult(null); }}><option value="create">Create new profiles</option><option value="update">Update existing profiles</option></SelectField>
    <label className="block text-sm font-medium" htmlFor="people-workbook">Excel workbook</label><input id="people-workbook" type="file" accept=".xlsx" disabled={busy} onChange={e => { setFile(e.target.files[0] || null); setResult(null); }} />
    <PrimaryButton disabled={!file || busy} onClick={() => run('preview')}>{busy ? 'Processing...' : 'Validate and preview'}</PrimaryButton>
    {error && <p role="alert" className="text-red-700">{error}</p>}{result && <><p role="status" className="rounded-xl bg-blue-50 p-3">{result.phase === 'commit' ? 'Saved' : 'Preview'}: {result.created} create, {result.updated} update, {result.failed} errors.</p><DataTable data={result.rows.map(r => ({ ...r, _id: r.row }))} columns={[{ header: 'Row', accessor: 'row' }, { header: 'Action', accessor: 'action' }, { header: 'Identifier', accessor: 'identifier' }, { header: 'Name', accessor: 'name' }, { header: 'Result', render: r => r.reason || r.status }]} />{result.phase === 'preview' && <><p className="text-sm text-slate-600">Confirm to save valid rows. Each row is atomic; other rows may succeed when one fails. The server revalidates before saving.</p><PrimaryButton disabled={busy || !(result.created + result.updated)} onClick={() => run('commit')}>Confirm and save {result.created + result.updated} valid rows</PrimaryButton></>}</>}
  </div>;
}

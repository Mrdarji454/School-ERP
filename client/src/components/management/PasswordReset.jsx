import { useRef, useState } from 'react';
import api from '../../services/api';
import PasswordField from '../ui/PasswordField';
import InputField from '../ui/InputField';
import PrimaryButton from '../ui/PrimaryButton';
import { apiError } from '../../utils/management';
export default function PasswordReset({ record, onSaved, onBusy }) {
  const [password, setPassword] = useState(''), [reason, setReason] = useState(''), [confirmed, setConfirmed] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false), lock = useRef(false);
  return <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (lock.current || !confirmed) return; lock.current = true; setBusy(true); onBusy?.(true); setError(''); try { await api.post(`/auth/accounts/${record.user._id}/reset-password`, { password, reason }); setPassword(''); onSaved(); } catch (e) { setError(apiError(e)); } finally { lock.current = false; setBusy(false); onBusy?.(false); } }}><p>Reset password for {record.user.fullname} ({record.user.email}). This revokes existing sessions and requires another password change on login.</p><PasswordField id="reset-password" label="New initial password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} /><InputField id="reset-reason" label="Reason (recorded in audit metadata)" required maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /><label className="flex gap-2"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />I confirm this account password reset.</label>{error && <p role="alert" className="text-red-700">{error}</p>}<PrimaryButton type="submit" disabled={busy || !confirmed}>{busy ? 'Resetting...' : 'Reset password'}</PrimaryButton></form>;
}

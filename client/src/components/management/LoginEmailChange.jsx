import { useRef, useState } from 'react';
import api from '../../services/api';
import InputField from '../ui/InputField';
import PrimaryButton from '../ui/PrimaryButton';
import { apiError } from '../../utils/management';
export default function LoginEmailChange({ record, onSaved, onBusy }) {
  const [email, setEmail] = useState(record.user.email), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), lock = useRef(false);
  return <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (lock.current || !confirmed) return; lock.current = true; setBusy(true); onBusy?.(true); try { await api.post(`/auth/accounts/${record.user._id}/email`, { email }); onSaved(); } catch (e) { setError(apiError(e)); } finally { lock.current = false; setBusy(false); onBusy?.(false); } }}><p>Change the login email for {record.user.fullname}. The old email will no longer work at login.</p><InputField id="admin-login-email" label="New login email" type="email" required value={email} onChange={e => { setEmail(e.target.value); setConfirmed(false); }} /><label className="flex gap-2"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />I have confirmed this new login address with the account owner.</label>{error && <p role="alert" className="text-red-700">{error}</p>}<PrimaryButton type="submit" disabled={busy || !confirmed}>Confirm email change</PrimaryButton></form>;
}

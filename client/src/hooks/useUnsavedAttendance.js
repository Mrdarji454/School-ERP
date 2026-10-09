import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
export default function useUnsavedAttendance(dirty, busy = false) {
  const blocker = useBlocker(dirty || busy);
  useEffect(() => {
    if (!dirty && !busy) return;
    const handler = event => { event.preventDefault(); event.returnValue = ''; };
    const logout = event => { if (busy || !window.confirm('Discard unsaved attendance and log out?')) event.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    window.addEventListener('erp:before-logout', logout);
    return () => { window.removeEventListener('beforeunload', handler); window.removeEventListener('erp:before-logout', logout); };
  }, [dirty, busy]);
  return blocker;
}

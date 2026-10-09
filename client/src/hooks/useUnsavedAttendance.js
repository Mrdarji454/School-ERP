import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
export default function useUnsavedAttendance(dirty) {
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (!dirty) return;
    const handler = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  return blocker;
}

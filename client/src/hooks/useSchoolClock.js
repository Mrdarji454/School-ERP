import { useEffect, useState } from 'react';
import { schoolClock } from '../utils/adminDashboard';
export default function useSchoolClock(timeZone) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer); }, []);
  return timeZone ? schoolClock(timeZone, now) : null;
}

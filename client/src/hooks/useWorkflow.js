import { useCallback, useEffect, useState } from 'react';
import { workflowRead } from '../services/workflowService';
import { apiError } from '../utils/management';
export default function useWorkflow(path, params = {}, enabled = true) {
  const query = JSON.stringify(params);
  const [revision, setRevision] = useState(0);
  const key = `${path}:${query}:${revision}`;
  const [result, setResult] = useState({ key: '', data: null, error: '' });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    workflowRead(path, JSON.parse(query), controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ key, data, error: '' });
    }).catch(error => { if (!controller.signal.aborted) setResult({ key, data: null, error: apiError(error) }); });
    return () => controller.abort();
  }, [path, query, key, enabled]);
  const reload = useCallback(() => setRevision(n => n + 1), []);
  return { data: result.key === key ? result.data : null, error: result.key === key ? result.error : '', loading: enabled && result.key !== key, reload };
}

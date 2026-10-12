import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { apiError } from '../utils/management';
export default function useApiList(path, params = {}) {
  const query = JSON.stringify(params), [revision, setRevision] = useState(0), [result, setResult] = useState({ key: '' });
  const key = `${path}:${query}:${revision}`;
  useEffect(() => {
    const controller = new AbortController();
    api.get(path, { params: JSON.parse(query), signal: controller.signal }).then(r => { if (!controller.signal.aborted) setResult({ key, data: r.data.data, error: '' }); }).catch(e => { if (!controller.signal.aborted) setResult({ key, data: null, error: apiError(e) }); });
    return () => controller.abort();
  }, [path, query, key]);
  const reload = useCallback(() => setRevision(r => r + 1), []);
  return { loading: result.key !== key, data: result.key === key ? result.data : null, error: result.key === key ? result.error : '', reload };
}

import { useCallback, useEffect, useState } from "react";
import { listManagement } from "../services/managementService";
import { apiError } from "../utils/management";
export default function useManagementList(resource, params) {
  const [revision, setRevision] = useState(0);
  const query = JSON.stringify(params);
  const key = `${resource}:${query}:${revision}`;
  const [result, setResult] = useState({ key: "", records: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 }, error: "" });
  useEffect(() => {
    const controller = new AbortController();
    listManagement(resource, JSON.parse(query), controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ ...data, key, error: "" });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key, records: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 }, error: apiError(error) });
    });
    return () => controller.abort();
  }, [resource, query, key]);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  return { ...result, loading: result.key !== key, reload };
}

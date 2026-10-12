import { useEffect, useState } from 'react';
import api from '../../services/api';
import { apiError } from '../../utils/management';
export default function PdfPreview({ record }) {
  const [url, setUrl] = useState(''), [error, setError] = useState('');
  useEffect(() => { const controller = new AbortController(); let objectUrl;
    api.get(`/resources/${record._id}/file?inline=true`, { responseType: 'blob', signal: controller.signal }).then(r => { if (!controller.signal.aborted) { objectUrl = URL.createObjectURL(r.data); setUrl(objectUrl); } }).catch(e => { if (!controller.signal.aborted) setError(apiError(e)); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [record._id]);
  return <div className="space-y-3"><p className="text-sm text-slate-600">PDF preview depends on your browser. Use Download if it does not display.</p>{error ? <p role="alert" className="text-red-700">{error}</p> : url ? <iframe title={`PDF preview: ${record.title}`} src={url} sandbox="" className="h-[65vh] w-full rounded-xl border" /> : <p role="status">Loading authorized PDF...</p>}</div>;
}

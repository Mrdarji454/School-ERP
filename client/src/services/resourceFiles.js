import api from './api';
export async function downloadResource(row) {
  const response = await api.get(`/resources/${row._id}/file`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data), a = document.createElement('a'); a.href = url; a.download = row.file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

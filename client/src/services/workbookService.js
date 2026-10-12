import api from './api';
export async function downloadWorkbook(path, params, filename) {
  const response = await api.get(path, { params, responseType: 'blob' });
  const url = URL.createObjectURL(response.data), a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

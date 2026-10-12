import { safeError } from './config.js';
export async function startDemoApi() {
  process.env.JWT_SECRET = process.env.DEMO_JWT_SECRET || 'development-demo-only-secret-do-not-use-in-production';
  const { default: app } = await import('../../app.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let checks = 0;
  const request = async (method, path, body, token, expected = 200) => {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const json = await response.json();
    if (response.status !== expected) throw safeError(`Demo API check failed: ${method} ${path.split('?')[0]} expected ${expected}, received ${response.status}. Inspect the demo state or reset to fresh fixtures.`);
    checks++;
    return json.data ?? json;
  };
  return { request, get checks() { return checks; }, close: async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
}

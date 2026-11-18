export function normalizeServiceUrl(value: string): string {
  let target: URL;
  try {
    target = new URL(value.trim());
  } catch {
    throw new Error('Utilize um endereço HTTPS válido.');
  }
  const local = target.hostname === 'localhost' || target.hostname === '127.0.0.1';
  if ((target.protocol !== 'https:' && !(local && target.protocol === 'http:')) || target.username || target.password || target.search || target.hash) {
    throw new Error('Utilize um endereço HTTPS válido, sem credenciais, parâmetros ou fragmentos.');
  }
  return target.toString().replace(/\/+$/, '');
}
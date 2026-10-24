export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || 'error';
  }
}

export const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const nowIso = () => new Date().toISOString();

/** Data local (YYYY-MM-DD) para um deslocamento em minutos em relação ao UTC. */
export function dayStr(offsetMin = -180, ts = Date.now()) {
  return new Date(ts + offsetMin * 60000).toISOString().slice(0, 10);
}

export function json(res, status, body, headers = {}) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(data);
}

export async function readBody(req, limit = 1_000_000) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new HttpError(413, 'Corpo da requisição grande demais.', 'too_large');
    chunks.push(c);
  }
  if (!size) return {};
  try {
    const v = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return v && typeof v === 'object' ? v : {};
  } catch {
    throw new HttpError(400, 'JSON inválido.', 'bad_json');
  }
}

export function int(v, { min = -Infinity, max = Infinity, name = 'valor' } = {}) {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (!Number.isInteger(n) || n < min || n > max) throw new HttpError(400, `Valor inválido para ${name}.`, 'bad_input');
  return n;
}

export function str(v, { max = 2000, min = 0, name = 'texto' } = {}) {
  if (v == null) v = '';
  if (typeof v !== 'string') throw new HttpError(400, `Valor inválido para ${name}.`, 'bad_input');
  const s = v.trim();
  if (s.length < min) throw new HttpError(400, `Informe ${name}.`, 'bad_input');
  return s.slice(0, max);
}

export const parseJson = (s, fallback) => {
  try {
    return s == null ? fallback : JSON.parse(s);
  } catch {
    return fallback;
  }
};

export function fetchWithTimeout(fetchImpl, url, opts = {}, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetchImpl(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

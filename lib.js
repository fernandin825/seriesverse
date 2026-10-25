// Utilitários do front-end: escape, API, ícones, tema por série, pôsteres.
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const enc = encodeURIComponent;

export class ApiError extends Error {
  constructor(message, code, status) { super(message); this.code = code; this.status = status; }
}
export async function api(method, path, body) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'seriesverse', 'X-TZ-Offset': String(-new Date().getTimezoneOffset()) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Algo falhou ao falar com o app. Tente de novo.', 'network', 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error?.message || 'Algo deu errado.', data?.error?.code || 'error', res.status);
  return data;
}
export const get = (p) => api('GET', p);
export const post = (p, b = {}) => api('POST', p, b);
export const put = (p, b = {}) => api('PUT', p, b);
export const del = (p) => api('DELETE', p);

// ---------- ícones (SVG inline, estilo consistente) ----------
const P = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  library: '<path d="M4 4h4v16H4zM10 4h4v16h-4zM16 6l4 1-3 13-4-1z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.7 7L3 21l2-5.5A8 8 0 1 1 21 12z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  next: '<path d="M9 18l6-6-6-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H3v2a4 4 0 0 0 4 4M17 6h4v2a4 4 0 0 1-4 4"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  alert: '<path d="M12 3l10 18H2zM12 10v5M12 18h.01"/>',
};
export const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;


// ---------- marca SERIESVERSE AI (arquivos extraídos da imagem de referência oficial) ----------
export const logoMark = (px = 34) => `<img class="logomark" src="logo-mark.png" alt="" height="${px}" decoding="async">`;
export const wordmark = () => '<img class="logoword" src="logo-word.png" alt="SERIESVERSE AI" decoding="async">';
export const brandLockup = () => `<div class="lockup"><img class="lockup-mark" src="logo-mark.png" alt="" decoding="async"><img class="lockup-text" src="logo-text.png" alt="SERIESVERSE AI — Séries, Aprendizado, Evolução" decoding="async"></div>`;

// ---------- tema por série ----------
const BY_TITLE = {
  'the mentalist': { h: 350, s: 62, h2: 43, a: 58, motif: 'board', label: 'Investigação criminal', tagline: 'Observar. Levantar hipóteses. Verificar.' },
  'breaking bad': { h: 140, s: 46, h2: 52, a: 85, motif: 'lab', label: 'Laboratório e deserto', tagline: 'Escolhas e consequências.' },
  friends: { h: 280, s: 55, h2: 32, motif: 'warm', label: 'Sitcom acolhedora', tagline: 'Amizade, rotina e boas risadas.', mode: 'light' },
  dark: { h: 215, s: 46, h2: 36, a: 72, motif: 'scifi', label: 'Tempo e mistério', tagline: 'O fim é o começo.' },
  'stranger things': { h: 355, s: 70, h2: 12, motif: 'horror', label: 'Suspense sobrenatural', tagline: 'Algo está errado.' },
  'game of thrones': { h: 40, s: 38, h2: 210, motif: 'epic', label: 'Fantasia épica', tagline: 'Casas, alianças e jogos de poder.' },
};
const BY_GENRE = [
  [/anima|anime/i, { h: 335, s: 75, h2: 190, motif: 'anime', label: 'Animação e anime' }],
  [/terror|horror/i, { h: 355, s: 60, h2: 18, motif: 'horror', label: 'Terror e suspense' }],
  [/fic[cç][aã]o cient|sci-?fi/i, { h: 265, s: 55, h2: 175, motif: 'scifi', label: 'Ficção científica' }],
  [/fantasia|fantasy|aventura/i, { h: 42, s: 40, h2: 8, motif: 'epic', label: 'Fantasia e aventura' }],
  [/crime|mist[eé]rio|policial/i, { h: 215, s: 32, h2: 42, motif: 'board', label: 'Crime e mistério' }],
  [/com[eé]dia|romance|fam[ií]lia/i, { h: 28, s: 75, h2: 330, motif: 'warm', label: 'Leve e acolhedora' }],
  [/drama/i, { h: 225, s: 38, h2: 25, motif: 'drama', label: 'Drama' }],
];
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const BRAND = { h: 220, s: 100, h2: 212, a: 92, motif: 'none', label: 'SERIESVERSE', tagline: '' };
export function themeFor(series) {
  if (!series) return BRAND;
  const byTitle = BY_TITLE[norm(series.title_original)];
  if (byTitle) return byTitle;
  const g = (series.genres || []).join(' ');
  for (const [re, t] of BY_GENRE) if (re.test(g)) return { ...t, tagline: '' };
  let hash = 0;
  for (const ch of series.title_original || '') hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return { h: hash % 360, s: 45, h2: (hash * 7) % 360, motif: 'drama', label: 'Identidade própria', tagline: '' };
}
export function applyTheme(t, prefs) {
  const r = document.documentElement;
  r.style.setProperty('--h', t.h); r.style.setProperty('--s', t.s); r.style.setProperty('--h2', t.h2); r.style.setProperty('--a', t.a ?? 82);
  r.dataset.motif = t.motif || 'none';
  r.dataset.mode = prefs?.theme === 'light' ? 'light' : 'dark';
  r.dataset.motion = prefs?.reduceMotion ? 'off' : 'on';
  r.style.setProperty('--fs', prefs?.fontScale || 1);
  r.style.setProperty('--gk', (0.2 + (prefs?.glass ?? 60) / 75).toFixed(2)); // 0 = vidro bem transparente · 100 = vidro fosco
}

// ---------- pôsteres ----------
export function placeholderPoster(series, w = 300, h = 450) {
  const t = themeFor(series);
  const title = series.title_pt || series.title_original || '';
  const words = title.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const wd of words) { if ((cur + ' ' + wd).trim().length > 14) { lines.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); }
  if (cur) lines.push(cur);
  const text = lines.slice(0, 4).map((l, i) => `<text x="50%" y="${52 + i * 9}%" text-anchor="middle" font-family="Georgia,serif" font-size="30" font-weight="700" fill="#fff">${esc(l)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${t.h},${Math.max(30, t.s)}%,26%)"/><stop offset="1" stop-color="hsl(${t.h2},60%,22%)"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${w * 0.8}" cy="${h * 0.14}" r="${w * 0.2}" fill="hsl(${t.h2},80%,60%)" opacity=".25"/><text x="50%" y="14%" text-anchor="middle" font-family="system-ui" font-size="13" letter-spacing="4" fill="#ffffffaa">${esc((t.label || '').toUpperCase().slice(0, 22))}</text>${text}<text x="50%" y="94%" text-anchor="middle" font-family="system-ui" font-size="11" fill="#ffffff88">pôster indisponível</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
export function poster(series, { large = false } = {}) {
  const alt = `Pôster de ${series.title_pt || series.title_original}`;
  const ph = placeholderPoster(series);
  const src = series.poster ? (large ? series.poster.replace('/w342/', '/w780/') : series.poster) : ph;
  const srcset = series.poster && series.poster.includes('/w342/') ? ` srcset="${esc(series.poster)} 342w, ${esc(series.poster.replace('/w342/', '/w780/'))} 780w" sizes="(max-width:760px) 40vw, 220px"` : '';
  return `<div class="poster"><img src="${esc(src)}"${srcset} alt="${esc(alt)}" loading="lazy" decoding="async" data-fallback="${esc(ph)}"></div>`;
}
document.addEventListener('error', (e) => {
  const el = e.target;
  if (el?.tagName === 'IMG' && el.dataset.fallback && el.src !== el.dataset.fallback) { el.removeAttribute('srcset'); el.src = el.dataset.fallback; }
}, true);

export const fmtDate = (s) => (s ? new Date(`${s}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const WDLONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const epLabel = (s, e) => `T${s}E${e}`;
export const bar = (pct) => `<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${Math.min(100, pct)}%"></i></div>`;

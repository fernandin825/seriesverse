// Núcleo da SPA: roteador, renderização, ações por delegação de eventos, toasts e tela de erro.
import { $, $$, esc, get, icon, logoMark, wordmark, themeFor, applyTheme, BRAND, ApiError, put } from './lib.js';

export const state = { prefs: { theme: 'dark', spoilerMode: 'restricted', fontScale: 1, reduceMotion: false, onboarded: false }, providers: {}, ctx: {} };
const routes = [];
const actions = {};
let navToken = 0;
let afterFns = [];

export const route = (pattern, handler) => routes.push({ re: new RegExp(`^${pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`), handler });
export const action = (name, fn) => { actions[name] = fn; };
export const after = (fn) => afterFns.push(fn);
export const go = (hash) => { if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = hash; };

export function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`; el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), kind === 'error' ? 7000 : 3800);
}
export function overlay(show, text = 'Carregando…') {
  $('#overlay').hidden = !show;
  $('#overlay-text').textContent = text;
}

export const setTheme = (series) => applyTheme(series ? themeFor(series) : BRAND, state.prefs);
export const skeleton = (n = 3) => `<div class="stack" aria-busy="true" aria-label="Carregando">${'<div class="skel" style="min-height:120px"></div>'.repeat(n)}</div>`;

export function errorView(err, retryHash) {
  const net = err instanceof ApiError && err.code === 'network';
  return `<section class="card center stack" role="alert" style="max-width:560px;margin:40px auto">
    <div style="font-size:2.4rem">${icon('alert')}</div>
    <h1 style="font-size:1.6rem">${net ? 'Sem conexão' : 'Não foi possível concluir'}</h1>
    <p class="muted">${esc(err.message || 'Erro inesperado.')}</p>
    <div class="row" style="justify-content:center">
      <button class="btn primary" data-act="retry">${icon('refresh')} Tentar de novo</button>
      <a class="btn" href="#/">${icon('home')} Ir para o início</a>
      <a class="btn ghost" href="#/library">Minha biblioteca</a>
    </div>
    <p class="small muted">Seu progresso fica salvo neste celular; nada foi perdido.</p></section>`;
}
action('retry', () => go(location.hash || '#/'));

export function renderChrome() {
  const cur = location.hash.split('?')[0];
  const items = [['#/', 'home', 'Início'], ['#/search', 'search', 'Buscar'], ['#/library', 'library', 'Biblioteca'], ['#/dashboard', 'chart', 'Painel'], ['#/settings', 'settings', 'Ajustes']];
  const cls = (h) => (cur === h || (h !== '#/' && cur.startsWith(h)) ? ' aria-current="page"' : '');
  $('#topbar').innerHTML = `<a class="logo" href="#/" aria-label="SERIESVERSE AI — início"><span class="mark">${logoMark(34)}</span><span class="word">${wordmark()}</span></a>
    <nav class="topnav" aria-label="Principal">${items.map(([h, i, l]) => `<a href="${h}"${cls(h)}>${icon(i)} ${l}</a>`).join('')}<a href="#/profile"${cls('#/profile')}>${icon('user')} Perfil</a></nav>
    <button class="iconbtn theme" data-act="toggle-theme" aria-label="Alternar tema claro/escuro">${icon(state.prefs.theme === 'light' ? 'moon' : 'sun')}</button>`;
  $('#tabbar').innerHTML = items.map(([h, i, l]) => `<a href="${h}"${cls(h)}>${icon(i)}<span>${l}</span></a>`).join('');
}

action('toggle-theme', async () => {
  state.prefs.theme = state.prefs.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.mode = state.prefs.theme;
  renderChrome();
  try { await put('/api/settings', { theme: state.prefs.theme }); } catch {}
});

async function dispatch() {
  const token = ++navToken;
  const hash = location.hash || '#/';
  const [pathPart, qs] = hash.slice(1).split('?');
  const path = pathPart || '/';
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  const view = $('#view');
  afterFns = [];
  renderChrome();
  const r = routes.find((x) => x.re.test(path));
  view.innerHTML = skeleton();
  try {
    if (!r) throw new ApiError('Página não encontrada.', 'not_found', 404);
    const params = Object.fromEntries(Object.entries(path.match(r.re).groups || {}).map(([k, v]) => [k, decodeURIComponent(v)]));
    const html = await r.handler(params, query);
    if (token !== navToken) return; // navegação mais nova venceu
    view.innerHTML = html;
    document.title = (view.querySelector('h1')?.textContent || 'SERIESVERSE AI').slice(0, 60) + ' · SERIESVERSE AI';
    window.scrollTo({ top: 0 });
    view.focus({ preventScroll: true });
    for (const fn of afterFns) fn();
  } catch (err) {
    if (token !== navToken) return;
    setTheme(null);
    view.innerHTML = errorView(err);
  }
}

export async function startRouter() {
  try {
    const me = await get('/api/me');
    Object.assign(state, { prefs: { ...state.prefs, ...me.prefs }, providers: me.providers, today: me.today });
  } catch {}
  applyTheme(BRAND, state.prefs);
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    const fn = actions[el.dataset.act];
    if (fn) { if (el.tagName === 'A' && !el.getAttribute('href')) e.preventDefault(); await fn(el, e); }
  });
  document.addEventListener('change', async (e) => {
    const el = e.target.closest('[data-change]');
    if (el && actions[el.dataset.change]) await actions[el.dataset.change](el, e);
  });
  document.addEventListener('submit', async (e) => {
    const f = e.target.closest('form[data-form]');
    if (!f) return;
    e.preventDefault();
    const fn = actions[f.dataset.form];
    if (fn) await fn(f, e);
  });
  window.addEventListener('hashchange', dispatch);
  dispatch();
}
export { $, $$ };

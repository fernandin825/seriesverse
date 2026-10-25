// Efeitos de toque (só visuais): brilho que segue o dedo, vibração leve e barra superior que firma ao rolar.
import { state } from './core.js';
const SEL = '.btn, .iconbtn, .topnav a, .tabbar a';
const root = document.documentElement;
let cur = null;
const on = () => state.prefs?.touchFx !== false && !state.prefs?.reduceMotion;
const place = (el, e) => { const r = el.getBoundingClientRect(); el.style.setProperty('--px', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); el.style.setProperty('--py', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%'); };
const release = () => { if (cur) { const el = cur; setTimeout(() => el.classList.remove('pressing'), 140); cur = null; } };
document.addEventListener('pointerdown', (e) => {
  root.dataset.touchfx = on() ? 'on' : 'off';
  const el = e.target.closest(SEL); if (!el || !on()) return;
  cur = el; place(el, e); el.classList.add('pressing');
  if (e.pointerType === 'touch') try { navigator.vibrate?.(6); } catch {}
}, { passive: true });
document.addEventListener('pointermove', (e) => { if (cur) place(cur, e); }, { passive: true });
['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => document.addEventListener(t, release, { passive: true }));
let ticking = false;
addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { root.dataset.scrolled = scrollY > 14 ? '1' : '0'; ticking = false; }); }, { passive: true });
// Controles deslizantes: pinta a parte preenchida da trilha
const fill = (el) => { const min = +el.min || 0, max = +el.max || 100; el.style.setProperty('--fill', (((+el.value) - min) / (max - min) * 100) + '%'); };
document.addEventListener('input', (e) => { if (e.target.type === 'range') fill(e.target); });
const view = document.getElementById('view');
if (view) new MutationObserver(() => view.querySelectorAll('input[type=range]').forEach(fill)).observe(view, { childList: true });

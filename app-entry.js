import { initEngine } from './engine.js';
initEngine()
  .then(() => import('./app.js'))
  .catch((e) => { document.getElementById('view').innerHTML = `<pre style="padding:16px;color:#f88;white-space:pre-wrap">Falha ao iniciar: ${String(e.message || e).replace(/</g, '&lt;')}</pre>`; });

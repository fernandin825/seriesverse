import { $, $$, esc, enc, get, post, put, del, icon, poster, bar, fmtDate, WD, WDLONG, epLabel, themeFor, placeholderPoster } from './lib.js';
import { state, route, action, after, go, toast, overlay, setTheme } from './core.js';

export const name = (s) => s.title_pt || s.title_original;
const sub = (s) => (s.title_pt && s.title_pt !== s.title_original ? s.title_original : '');
const NOTICE = (n) => `<div class="notice ${esc(n.level)}" role="${n.level === 'error' ? 'alert' : 'status'}">${esc(n.message)}</div>`;
const chips = (g) => (g || []).map((x) => `<span class="chip">${esc(x)}</span>`).join(' ');
const statusPt = { watching: 'Assistindo', completed: 'Concluída', paused: 'Pausada', planned: 'Quero começar' };

export const seriesCard = (s) => `<a class="scard" href="#/s/${enc(s.id)}">${poster(s)}<b>${esc(name(s))}</b><span class="muted small">${s.year || '—'} ${s.genres?.[0] ? '· ' + esc(s.genres[0]) : ''}</span></a>`;
const libCard = (st) => {
  const s = st.series; const nx = st.progress.next;
  return `<a class="scard" href="#/s/${enc(s.id)}">${poster(s)}<b>${esc(name(s))}</b>${bar(st.plan.percent)}<span class="muted small">${st.progress.done}/${st.progress.total} · ${nx ? 'próx. ' + epLabel(nx.season, nx.episode) : 'concluída'}</span></a>`;
};

// ---------- onboarding ----------
export const onboardingView = () => `<section class="hero" aria-labelledby="ob"><div class="hero-bg" style="background:radial-gradient(circle at 70% 20%, hsl(var(--h2) 80% 55% / .5), transparent 55%)"></div>
  <div class="kicker">Bem-vindo</div><h1 id="ob">Assista. Compreenda. Aprenda.</h1>
  <p style="max-width:620px;font-size:1.1rem">O SERIESVERSE AI acompanha seu progresso em qualquer série, calcula seu ritmo e, quando você termina um episódio, entrega uma análise original com lições aplicáveis à vida real — sem spoilers do que você ainda não viu.</p></section>
  <div class="grid g3" style="margin-top:20px">
    <div class="card"><h3>${icon('search')} 1. Escolha a série</h3><p class="muted">Pesquise no catálogo ou cadastre manualmente qualquer título.</p></div>
    <div class="card"><h3>${icon('calendar')} 2. Defina seu ritmo</h3><p class="muted">Informe episódios por dia e dias da semana; calculamos a data de conclusão.</p></div>
    <div class="card"><h3>${icon('check')} 3. Termine e aprenda</h3><p class="muted">Um clique em “Terminei o episódio” registra o progresso e abre análise, perguntas e desafio.</p></div></div>
  <div class="card" style="margin-top:20px"><h3>${icon('lock')} Proteção anti-spoiler</h3><p class="muted">Só liberamos o que você já concluiu. Você pode alterar seu progresso manualmente e escolher o modo de spoilers restritos nos Ajustes.</p>
  <div class="row"><button class="btn primary big" data-act="ob-start">Começar</button><button class="btn big" data-act="load-demo">Carregar demonstração (The Mentalist)</button></div>
  <p class="small muted">A demonstração cria dados editáveis: The Mentalist com o Pilot concluído e um ritmo de 16 episódios por semana. Nada é imposto a novos usuários.</p></div>`;
action('ob-start', async () => { state.prefs.onboarded = true; try { await put('/api/settings', { onboarded: true }); } catch {} go('#/'); });
action('load-demo', async () => {
  overlay(true, 'Preparando a demonstração…');
  try { await post('/api/demo'); state.prefs.onboarded = true; toast('Demonstração carregada: The Mentalist, Pilot concluído.', 'ok'); go('#/s/seed:mentalist'); }
  catch (e) { toast(e.message, 'error'); } finally { overlay(false); }
});

// ---------- início ----------
route('/', async () => {
  setTheme(null);
  const [lib, tr] = await Promise.all([get('/api/library'), get('/api/trending')]);
  if (!state.prefs.onboarded && !lib.items.length) return onboardingView();
  const watching = lib.items.filter((i) => i.library?.status === 'watching');
  const lastW = watching[0];
  const totalDone = lib.items.reduce((a, i) => a + i.progress.done, 0);
  const totalEps = lib.items.reduce((a, i) => a + i.progress.total, 0);
  const pct = totalEps ? (totalDone / totalEps) * 100 : 0;
  const heroSeries = lastW?.series || tr.results[0];
  const bg = heroSeries?.backdrop || heroSeries?.poster || '';
  const cont = lastW?.progress.next ? `#/s/${enc(lastW.series.id)}/ep/${lastW.progress.next.season}/${lastW.progress.next.episode}` : null;
  return `<section class="hero" aria-labelledby="h1">
      <div class="hero-bg" ${bg ? `style="background-image:url('${esc(bg)}')"` : 'style="background:radial-gradient(circle at 75% 15%, hsl(var(--h2) 80% 55% / .45), transparent 55%)"'}></div>
      <div class="kicker">SERIESVERSE AI</div>
      <h1 id="h1">Qual série você deseja acompanhar?</h1>
      <p class="muted" style="max-width:600px">Pesquise qualquer série, informe seu ritmo e aprenda com cada episódio — sem spoilers.</p>
      <form class="searchbar" data-form="do-search" role="search"><label class="hide" for="q">Qual série você está assistindo?</label>
        <input id="q" name="q" type="search" placeholder="Qual série você está assistindo?" autocomplete="off" required minlength="2">
        <button class="btn primary big" type="submit">${icon('search')} Pesquisar série</button></form>
      <div class="row" style="margin-top:14px"><a class="btn" href="#/library">${icon('library')} Minha biblioteca</a>
        <a class="btn" ${cont ? `href="${cont}"` : 'aria-disabled="true" href="#/search" title="Nenhuma série em andamento ainda"'}>${icon('play')} Continuar assistindo</a>
        <a class="btn ghost" href="#/manual">${icon('plus')} Cadastrar série manualmente</a></div></section>
    <section class="card" style="margin-top:18px" aria-label="Progresso geral"><div class="row"><div class="stat"><b>${totalDone}</b><span>episódios concluídos</span></div>
      <div class="stat"><b>${lib.items.length}</b><span>séries na biblioteca</span></div><div class="grow">${bar(pct)}<span class="small muted">${totalEps ? `${pct.toFixed(1)}% de todos os episódios das suas séries` : 'Adicione uma série para ver seu progresso geral.'}</span></div></div></section>
    ${watching.length ? `<h2 style="margin-top:28px">Continue de onde parou</h2><div class="grid gposter">${watching.map(libCard).join('')}</div>` : `<div class="notice info" style="margin-top:20px">Você ainda não começou nenhuma série. Pesquise acima ou <button class="btn sm" data-act="load-demo">carregue a demonstração</button>.</div>`}
    <h2 style="margin-top:28px">${tr.provider === 'tmdb' ? 'Em alta esta semana' : 'Séries do catálogo local'}</h2>${(tr.notices || []).map(NOTICE).join('')}
    <div class="grid gposter">${tr.results.map(seriesCard).join('')}</div>`;
});
action('do-search', (f) => go(`#/search?q=${enc(new FormData(f).get('q').trim())}`));

// ---------- busca ----------
route('/search', async (_, q) => {
  setTheme(null);
  const term = (q.q || '').trim(); const page = Number(q.page) || 1;
  const form = `<form class="searchbar" data-form="do-search" role="search"><label class="hide" for="q">Buscar série</label><input id="q" name="q" type="search" value="${esc(term)}" placeholder="Qual série você está assistindo?" required minlength="2"><button class="btn primary" type="submit">${icon('search')} Pesquisar série</button></form>`;
  if (term.length < 2) return `<h1>Pesquisar séries</h1>${form}<p class="muted" style="margin-top:14px">Pesquise pelo nome original ou em português — séries, animações e animes.</p><p><a href="#/manual">Não achou? Cadastre manualmente.</a></p>`;
  let r;
  try { r = await get(`/api/search?q=${enc(term)}&page=${page}`); }
  catch (e) { return `<h1>Pesquisar séries</h1>${form}<div class="notice error" role="alert">${esc(e.message)} <button class="btn sm" data-act="retry">Tentar de novo</button></div><p><a href="#/manual">Cadastrar a série manualmente</a></p>`; }
  const cards = r.results.map((s) => `<article class="card result"><div>${poster(s)}</div><div><h3 style="margin:0">${esc(name(s))}</h3><p class="muted small" style="margin:0 0 6px">${esc(sub(s))} ${s.year ? '· ' + s.year : ''}</p>
      <div>${chips(s.genres)}</div><p class="small" style="margin-top:8px">${esc((s.overview || 'Sinopse não disponível.').slice(0, 220))}${(s.overview || '').length > 220 ? '…' : ''}</p>
      <p class="small muted">${s.seasons_count ? `${s.seasons_count} temporada(s)` : 'Temporadas: n/d'} · ${s.status ? esc(s.status) : 'Status n/d'} · Plataformas: ${s.platforms ? esc(s.platforms.join(', ')) : 'exibidas ao escolher'}${s.local ? ' · <span class="chip">catálogo local</span>' : ''}</p>
      <div class="actions"><button class="btn primary" data-act="choose-series" data-id="${esc(s.id)}">Escolher esta série</button></div></div></article>`).join('');
  const pager = r.totalPages > 1 ? `<div class="row" style="justify-content:center;margin-top:16px"><a class="btn" ${page > 1 ? `href="#/search?q=${enc(term)}&page=${page - 1}"` : 'aria-disabled="true"'}>${icon('back')} Anterior</a><span class="muted">Página ${page} de ${r.totalPages}</span><a class="btn" ${page < r.totalPages ? `href="#/search?q=${enc(term)}&page=${page + 1}"` : 'aria-disabled="true"'}>Próxima ${icon('next')}</a></div>` : '';
  return `<h1>Resultados para “${esc(term)}”</h1>${form}<div style="margin-top:14px">${r.notices.map(NOTICE).join('')}</div>
    ${r.results.length ? `<div class="grid g2">${cards}</div>${pager}` : `<div class="card center stack"><h3>Nenhuma série encontrada</h3><p class="muted">Confira a grafia, tente o nome original ou cadastre manualmente.</p><a class="btn primary" href="#/manual">${icon('plus')} Cadastrar manualmente</a></div>`}`;
});
action('choose-series', async (el) => {
  el.disabled = true; overlay(true, 'Carregando temporadas e episódios…');
  try { const st = await post('/api/library', { id: el.dataset.id, status: 'planned' }); go(`#/s/${enc(st.series.id)}`); }
  catch (e) { toast(e.message, 'error'); el.disabled = false; } finally { overlay(false); }
});

// ---------- cadastro manual ----------
route('/manual', async () => { setTheme(null); return `<h1>Cadastrar série manualmente</h1><p class="muted">Para títulos fora do catálogo. Os dados são os que você informa — nada é preenchido por suposição.</p>
  <form class="card" data-form="save-manual" style="max-width:640px"><div class="field"><label for="t">Título *</label><input id="t" name="title" required maxlength="150"></div>
  <div class="field"><label for="tp">Título em português</label><input id="tp" name="title_pt" maxlength="150"></div>
  <div class="row"><div class="field grow"><label for="y">Ano</label><input id="y" name="year" type="number" min="1900" max="2100"></div><div class="field grow"><label for="g">Gêneros (separados por vírgula)</label><input id="g" name="genres" placeholder="Drama, Mistério"></div></div>
  <div class="field"><label for="o">Sinopse</label><textarea id="o" name="overview" maxlength="1500"></textarea></div>
  <div class="field"><label for="s">Episódios por temporada *</label><input id="s" name="seasons" required placeholder="Ex.: 10, 10, 8 (3 temporadas)" pattern="[0-9 ,]+"><p class="hint">Separe por vírgulas: o primeiro número é a temporada 1, e assim por diante.</p></div>
  <button class="btn primary" type="submit">${icon('plus')} Cadastrar e abrir</button></form>`; });
action('save-manual', async (f) => {
  const d = Object.fromEntries(new FormData(f));
  const seasons = d.seasons.split(',').map((x) => Number(x.trim())).filter((n) => n > 0);
  if (!seasons.length) return toast('Informe os episódios de cada temporada, ex.: 10, 8.', 'error');
  try { const r = await post('/api/series/manual', { title: d.title, title_pt: d.title_pt, year: d.year ? Number(d.year) : null, genres: d.genres.split(',').map((x) => x.trim()).filter(Boolean), overview: d.overview, seasons }); toast('Série cadastrada.', 'ok'); go(`#/s/${enc(r.id)}`); }
  catch (e) { toast(e.message, 'error'); }
});

// ---------- detalhes da série ----------
const watchedForm = (st) => `<form class="row" data-form="mark-upto" data-id="${esc(st.series.id)}" aria-label="Informar até onde já assistiu"><label for="sw" class="small muted">Já assisti até a temporada</label>
  <select id="sw" name="season" style="width:auto" data-change="upto-season">${st.seasons.map((s) => `<option value="${s.season}" data-max="${s.episodes}">${s.season}</option>`).join('')}</select>
  <label for="ew" class="small muted">episódio</label><input id="ew" name="episode" type="number" min="1" value="1" max="${st.seasons[0]?.episodes || 1}" style="width:90px"><button class="btn sm" type="submit">${icon('check')} Marcar até aqui</button></form>`;
action('upto-season', (el) => { const max = el.selectedOptions[0].dataset.max; const e = $('#ew'); e.max = max; if (Number(e.value) > Number(max)) e.value = max; });
action('mark-upto', async (f) => {
  const d = Object.fromEntries(new FormData(f));
  if (!confirm(`Marcar como concluídos todos os episódios até T${d.season}E${d.episode}? Isso libera os relatórios desses episódios.`)) return;
  try { await post(`/api/series/${enc(f.dataset.id)}/progress`, { action: 'upTo', season: Number(d.season), episode: Number(d.episode) }); toast('Progresso atualizado.', 'ok'); go(location.hash); }
  catch (e) { toast(e.message, 'error'); }
});

route('/s/:id', async ({ id }) => {
  const st = await get(`/api/series/${enc(id)}`);
  const s = st.series; const t = themeFor(s); setTheme(s);
  const nx = st.progress.next; const inLib = !!st.library; const status = st.library?.status;
  const bg = s.backdrop || (s.poster ? s.poster.replace('/w342/', '/w780/') : '');
  const plan = st.plan;
  return `<section class="hero" aria-labelledby="h1"><div class="hero-bg" ${bg ? `style="background-image:url('${esc(bg)}')" role="img" aria-label="Imagem de fundo de ${esc(name(s))}"` : 'style="background:radial-gradient(circle at 80% 10%, hsl(var(--h2) 80% 55% / .5), transparent 55%), linear-gradient(160deg, hsl(var(--h) 40% 22%), transparent)"'}></div>
    <div class="seriesHead">${poster(s, { large: true })}<div><div class="kicker">${esc(t.label)}${t.tagline ? ' · ' + esc(t.tagline) : ''}</div><h1 id="h1">${esc(name(s))}</h1>
      <p class="muted">${esc(sub(s))} ${s.year ? '· ' + s.year : ''} ${s.status ? '· ' + esc(s.status) : ''}</p><div>${chips(s.genres)}</div>
      <p style="margin-top:10px;max-width:640px">${esc(s.overview || 'Sinopse não disponível.')}</p>
      <p class="small muted">${st.counts.seasons} temporada(s) · ${st.counts.episodes} episódio(s) conhecidos${s.platforms?.length ? ` · Onde assistir (BR): ${esc(s.platforms.join(', '))} <em>(dados JustWatch via TMDB)</em>` : ''}</p></div></div></section>
    <section class="grid g2" style="margin-top:18px"><div class="card"><h2>Seu progresso</h2>${bar(plan.percent)}<p><b>${plan.done}</b> de <b>${plan.total}</b> episódios (${plan.percent}%)</p>
      <p class="small muted">Último concluído: ${st.progress.last ? `${epLabel(st.progress.last.season, st.progress.last.episode)}${st.progress.last.title ? ' — ' + esc(st.progress.last.title) : ''}` : 'nenhum'}</p>
      <p class="small muted">Próximo: ${nx ? `${epLabel(nx.season, nx.episode)}${nx.title ? ' — ' + esc(nx.title) : ''}` : 'série concluída'}</p>
      <div class="row">${nx ? `<a class="btn primary" href="#/s/${enc(s.id)}/ep/${nx.season}/${nx.episode}">${icon('play')} Abrir episódio atual</a>` : `<span class="chip accent">${icon('trophy')} Série concluída</span>`}</div></div>
    <div class="card"><h2>Ações</h2><div class="row">
      ${status === 'planned' || !inLib ? `<button class="btn primary" data-act="start-watching" data-id="${esc(s.id)}">${icon('play')} Começar a acompanhar</button>` : ''}
      <a class="btn" href="#/s/${enc(s.id)}/schedule">${icon('calendar')} Configurar meu cronograma</a><a class="btn" href="#/s/${enc(s.id)}/seasons">${icon('list')} Ver temporadas</a>
      <a class="btn" href="#/s/${enc(s.id)}/chat">${icon('chat')} Conversar sobre a série</a></div>
      <div style="margin-top:14px">${watchedForm(st)}</div></div></section>
    ${plan.configured ? `<section class="card" style="margin-top:16px"><h2>Cronograma</h2>${planSummary(plan)}</section>` : ''}
    ${inLib ? `<section class="card" style="margin-top:16px"><h2>Biblioteca</h2><div class="row"><div><label for="stt">Status</label><select id="stt" data-change="set-status" data-id="${esc(s.id)}" style="width:auto">${Object.entries(statusPt).map(([k, v]) => `<option value="${k}" ${k === status ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <form class="grow" data-form="save-note" data-id="${esc(s.id)}"><label for="nt">Nota pessoal (opcional)</label><div class="row"><input id="nt" name="note" class="grow" maxlength="1000" value="${esc(st.library.note || '')}" placeholder="Ex.: ótima para ver com calma"><button class="btn" type="submit">Salvar nota</button></div></form></div>
      <p class="small muted" style="margin-top:10px">${esc(s.source_note || '')}</p></section>` : ''}`;
});
action('start-watching', async (el) => {
  try { await post('/api/library', { id: el.dataset.id, status: 'watching' }); await put(`/api/library/${enc(el.dataset.id)}`, { status: 'watching' }); go(`#/s/${enc(el.dataset.id)}/schedule?first=1`); }
  catch (e) { toast(e.message, 'error'); }
});
action('set-status', async (el) => { try { await put(`/api/library/${enc(el.dataset.id)}`, { status: el.value }); toast('Status atualizado.', 'ok'); } catch (e) { toast(e.message, 'error'); } });
action('save-note', async (f) => { try { await put(`/api/library/${enc(f.dataset.id)}`, { note: new FormData(f).get('note') }); toast('Nota salva.', 'ok'); } catch (e) { toast(e.message, 'error'); } });

// ---------- cronograma ----------
function planSummary(p) {
  if (!p.configured) return '<p class="muted">Cronograma ainda não configurado.</p>';
  if (p.finished) return '<p>🎉 Você concluiu todos os episódios conhecidos desta série.</p>';
  const hrs = p.runtime.remainingMinutes ? `${(p.runtime.remainingMinutes / 60).toFixed(1)} h${p.runtime.complete ? '' : ` (apenas ${p.runtime.knownEpisodes} de ${p.runtime.pendingEpisodes} eps. com duração conhecida)`}` : 'duração desconhecida';
  return `<div class="grid g3"><div class="stat"><b>${p.perDay}/dia · ${p.perWeek}/sem</b><span>ritmo planejado</span></div>
    <div class="stat"><b>${fmtDate(p.eta)}</b><span>conclusão estimada</span></div>
    <div class="stat"><b>${p.nextSession ? `${WD[p.nextSession.weekday]}, ${fmtDate(p.nextSession.date)}` : '—'}</b><span>próxima sessão${p.nextSession ? ` (${p.nextSession.from}→${p.nextSession.to})` : ''}</span></div>
    <div class="stat"><b>${p.remaining}</b><span>episódios restantes</span></div><div class="stat"><b>${hrs}</b><span>tempo restante estimado</span></div>
    <div class="stat"><b class="${p.behind ? 'badge-prog' : 'badge-done'}">${p.behind ? `${p.behind} em atraso` : p.ahead ? `${p.ahead} adiantado(s)` : 'em dia'}</b><span>${p.mode === 'flexible' ? 'plano flexível: o cronograma se ajusta sozinho' : 'plano fixo'}</span></div></div>
    ${p.goal ? `<p class="small ${p.goal.meetsGoal ? 'badge-done' : 'badge-prog'}" style="margin-top:10px">Meta ${fmtDate(p.goalDate)}: ${p.goal.meetsGoal ? 'no ritmo atual você cumpre a meta.' : `ritmo atual não alcança; seriam necessários ${p.goal.requiredPerDay} ep./dia nos dias escolhidos.`}</p>` : ''}`;
}
function weekList(p) {
  if (!p.sessions?.length) return '<p class="muted">Sem sessões pendentes.</p>';
  const byWeek = {};
  for (const s of p.sessions) { const d = new Date(`${s.date}T12:00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); (byWeek[d.toISOString().slice(0, 10)] ||= []).push(s); }
  return Object.entries(byWeek).slice(0, 8).map(([w, list]) => `<h3>Semana de ${fmtDate(w)}</h3>${list.map((s) => `<div class="ep" style="grid-template-columns:90px 1fr auto"><b>${WD[s.weekday]} ${s.date.slice(8)}/${s.date.slice(5, 7)}</b><span>${s.from} → ${s.to}</span><span class="chip">${s.count} ep.</span></div>`).join('')}`).join('');
}
function calendar(p, today) {
  const map = Object.fromEntries((p.sessions || []).map((s) => [s.date, s]));
  const start = new Date(`${today}T12:00:00`); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const cells = [];
  for (let i = 0; i < 35; i++) { const d = new Date(start); d.setDate(start.getDate() + i); const k = d.toISOString().slice(0, 10); const s = map[k];
    cells.push(`<div class="d ${s ? 'on' : ''}" ${k === today ? 'style="outline:2px solid var(--accent2)"' : ''}><b>${d.getDate()}</b>${s ? `<span>${s.count} ep.<br><span class="muted">${s.from}–${s.to}</span></span>` : ''}</div>`); }
  return `<div class="cal" role="grid" aria-label="Calendário de sessões">${['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map((x) => `<div class="h">${x}</div>`).join('')}${cells.join('')}</div>`;
}
route('/s/:id/schedule', async ({ id }, q) => {
  const st = await get(`/api/series/${enc(id)}`); setTheme(st.series);
  const sc = st.library?.schedule || { perDay: 1, weekdays: [1, 2, 3, 4, 5], mode: 'flexible', goalDate: '' };
  const first = q.first === '1';
  return `<p><a href="#/s/${enc(id)}">${icon('back')} ${esc(name(st.series))}</a></p><h1>${first ? 'Vamos começar!' : 'Meu cronograma'}</h1>
    ${first ? `<section class="card"><h2>1. Quais episódios você já assistiu?</h2><p class="muted">Se ainda não começou, pule esta etapa. Só liberamos relatórios de episódios concluídos.</p>${watchedForm(st)}</section>` : ''}
    <form class="card" style="margin-top:16px" data-form="save-schedule" data-id="${esc(id)}"><h2>${first ? '2. ' : ''}Seu ritmo</h2><p class="muted small">Todas as respostas são opcionais e podem ser editadas depois.</p>
      <div class="field"><label for="pd">Quantos episódios deseja assistir por dia?</label><input id="pd" name="perDay" type="number" min="1" max="20" value="${sc.perDay}" style="max-width:120px"></div>
      <div class="field"><label id="dl">Em quais dias normalmente assiste? <span class="muted" id="dcount">(${sc.weekdays.length} dias por semana)</span></label><div class="days" role="group" aria-labelledby="dl">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<button type="button" class="btn sm" data-act="toggle-day" aria-pressed="${sc.weekdays.includes(d)}" data-d="${d}">${WD[d]}</button>`).join('')}</div></div>
      <div class="field"><label for="gd">Meta de conclusão (opcional)</label><input id="gd" name="goalDate" type="date" value="${esc(sc.goalDate || '')}" style="max-width:220px"></div>
      <div class="field"><label>Cronograma</label><div class="row"><label style="font-weight:400"><input type="radio" name="mode" value="flexible" ${sc.mode !== 'fixed' ? 'checked' : ''} style="width:auto;min-height:0"> Flexível (se ajusta sozinho)</label><label style="font-weight:400"><input type="radio" name="mode" value="fixed" ${sc.mode === 'fixed' ? 'checked' : ''} style="width:auto;min-height:0"> Fixo (mostra atrasos)</label></div></div>
      <div class="row"><button class="btn primary" type="submit">${icon('check')} Salvar cronograma</button>${st.library?.schedule ? `<button class="btn danger" type="button" data-act="reset-schedule" data-id="${esc(id)}">Remover cronograma</button>` : ''}</div></form>
    ${st.plan.configured ? `<section class="card" style="margin-top:16px"><h2>Painel de progresso</h2><div class="row" role="tablist" aria-label="Visualização"><button class="btn sm primary" data-act="plan-tab" data-t="panel" role="tab">Painel</button><button class="btn sm" data-act="plan-tab" data-t="week" role="tab">Lista semanal</button><button class="btn sm" data-act="plan-tab" data-t="cal" role="tab">Calendário</button></div>
      <div id="pt-panel" style="margin-top:14px">${planSummary(st.plan)}</div><div id="pt-week" class="hide" style="margin-top:14px">${weekList(st.plan)}</div><div id="pt-cal" class="hide" style="margin-top:14px">${calendar(st.plan, state.today)}</div></section>` : `<div class="notice info" style="margin-top:16px">Salve o ritmo para ver estimativa de conclusão, próximas sessões e calendário.</div>`}`;
});
action('toggle-day', (el) => { el.setAttribute('aria-pressed', el.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); const n = $$('.days [aria-pressed="true"]').length; $('#dcount').textContent = `(${n} dias por semana)`; });
action('plan-tab', (el) => { for (const t of ['panel', 'week', 'cal']) $(`#pt-${t}`).classList.toggle('hide', t !== el.dataset.t); $$('[data-act="plan-tab"]').forEach((b) => b.classList.toggle('primary', b === el)); });
action('save-schedule', async (f) => {
  const d = Object.fromEntries(new FormData(f));
  const weekdays = $$('.days [aria-pressed="true"]', f).map((b) => Number(b.dataset.d));
  if (!weekdays.length) return toast('Escolha pelo menos um dia da semana.', 'error');
  try { await put(`/api/series/${enc(f.dataset.id)}/schedule`, { perDay: Number(d.perDay) || 1, weekdays, goalDate: d.goalDate || null, mode: d.mode }); toast('Cronograma salvo.', 'ok'); go(`#/s/${enc(f.dataset.id)}/schedule`); }
  catch (e) { toast(e.message, 'error'); }
});
action('reset-schedule', async (el) => { if (!confirm('Remover o cronograma desta série?')) return; try { await put(`/api/series/${enc(el.dataset.id)}/schedule`, { reset: true }); go(`#/s/${enc(el.dataset.id)}/schedule`); } catch (e) { toast(e.message, 'error'); } });

// ---------- temporadas e episódios ----------
route('/s/:id/seasons', async ({ id }) => {
  const st = await get(`/api/series/${enc(id)}`); setTheme(st.series);
  return `<p><a href="#/s/${enc(id)}">${icon('back')} ${esc(name(st.series))}</a></p><h1>Temporadas</h1>
    <div class="grid g3">${st.seasons.map((se) => `<a class="card season" href="#/s/${enc(id)}/season/${se.season}" style="text-decoration:none;color:inherit"><h3>${se.season === 0 ? 'Especiais' : 'Temporada ' + se.season}</h3>${bar((se.done / se.episodes) * 100)}<p class="small muted" style="margin-top:8px">${se.done}/${se.episodes} episódios concluídos</p></a>`).join('')}</div>`;
});
route('/s/:id/season/:n', async ({ id, n }) => {
  const [st, se] = await Promise.all([get(`/api/series/${enc(id)}`), get(`/api/series/${enc(id)}/seasons/${enc(n)}`)]);
  setTheme(st.series);
  const badge = { done: `<span class="badge-done">${icon('check')} Concluído</span>`, inprogress: `<span class="badge-prog">${icon('clock')} Em andamento</span>`, todo: '<span class="badge-todo">Não assistido</span>' };
  return `<p><a href="#/s/${enc(id)}/seasons">${icon('back')} Temporadas</a></p><h1>${esc(name(st.series))} — Temporada ${esc(n)}</h1>
    ${se.spoiler_mode !== 'normal' ? `<div class="notice info">${icon('lock')} Modo de spoilers restritos: títulos de episódios distantes ficam ocultos. Altere em Ajustes.</div>` : ''}
    <div class="card flat">${se.episodes.map((e) => `<div class="ep ${e.is_next ? 'next' : ''}"><div class="num">${e.episode}</div><div><b>${e.title ? esc(e.title) : e.title_hidden ? `${icon('lock')} Título oculto (anti-spoiler)` : `Episódio ${e.episode}`}</b> ${e.is_next ? '<span class="chip accent">próximo</span>' : ''}<div class="small muted">${badge[e.status]} ${e.air_date ? '· ' + fmtDate(e.air_date) : ''} ${e.runtime ? '· ' + e.runtime + ' min' : ''}</div></div>
      <div class="acts"><a class="btn sm ${e.is_next ? 'primary' : ''}" href="#/s/${enc(id)}/ep/${e.season}/${e.episode}">Abrir</a>${e.status === 'done' ? `<a class="btn sm" href="#/s/${enc(id)}/report/${e.season}/${e.episode}">Análise</a><button class="btn sm ghost" data-act="ep-toggle" data-id="${esc(id)}" data-s="${e.season}" data-e="${e.episode}" data-done="0" aria-label="Desmarcar episódio ${e.episode}">Desmarcar</button>` : ''}</div></div>`).join('')}</div>`;
});
action('ep-toggle', async (el) => { try { await post(`/api/series/${enc(el.dataset.id)}/progress`, { action: 'toggle', season: Number(el.dataset.s), episode: Number(el.dataset.e), done: el.dataset.done === '1' }); go(location.hash); } catch (e) { toast(e.message, 'error'); } });

// ---------- biblioteca ----------
route('/library', async (_, q) => {
  setTheme(null);
  const { items } = await get('/api/library');
  const status = q.status || 'all'; const genre = q.genre || ''; const sort = q.sort || 'recent'; const prog = q.prog || 'all';
  const genres = [...new Set(items.flatMap((i) => i.series.genres || []))].sort();
  let list = items.filter((i) => (status === 'all' || i.library?.status === status) && (!genre || i.series.genres?.includes(genre)) && (prog === 'all' || (prog === 'none' && i.progress.done === 0) || (prog === 'some' && i.progress.done > 0 && i.plan.percent < 100) || (prog === 'full' && i.plan.percent >= 100)));
  if (sort === 'az') list = [...list].sort((a, b) => name(a.series).localeCompare(name(b.series), 'pt-BR'));
  if (sort === 'progress') list = [...list].sort((a, b) => b.plan.percent - a.plan.percent);
  const opt = (v, cur, l) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${l}</option>`;
  return `<h1>Minha biblioteca</h1>
    <form class="row card flat" data-form="lib-filter" aria-label="Filtros"><div><label for="fs">Status</label><select id="fs" name="status" data-change="lib-filter" style="width:auto">${opt('all', status, 'Todos')}${Object.entries(statusPt).map(([k, v]) => opt(k, status, v)).join('')}</select></div>
      <div><label for="fg">Gênero</label><select id="fg" name="genre" data-change="lib-filter" style="width:auto">${opt('', genre, 'Todos')}${genres.map((g) => opt(g, genre, g)).join('')}</select></div>
      <div><label for="fp">Progresso</label><select id="fp" name="prog" data-change="lib-filter" style="width:auto">${opt('all', prog, 'Qualquer')}${opt('none', prog, 'Não iniciadas')}${opt('some', prog, 'Em andamento')}${opt('full', prog, 'Completas')}</select></div>
      <div><label for="fo">Ordem</label><select id="fo" name="sort" data-change="lib-filter" style="width:auto">${opt('recent', sort, 'Recentes')}${opt('az', sort, 'A–Z')}${opt('progress', sort, 'Maior progresso')}</select></div></form>
    ${list.length ? `<div class="grid g2" style="margin-top:16px">${list.map((i) => { const s = i.series; const nx = i.progress.next; return `<article class="card result"><a href="#/s/${enc(s.id)}" aria-label="Abrir ${esc(name(s))}">${poster(s)}</a><div><h3 style="margin:0"><a href="#/s/${enc(s.id)}" style="color:inherit;text-decoration:none">${esc(name(s))}</a></h3>
      <p class="small muted" style="margin:2px 0 8px"><span class="chip accent">${statusPt[i.library.status]}</span> ${s.year || ''}</p>${bar(i.plan.percent)}<p class="small">${i.progress.done}/${i.progress.total} (${i.plan.percent}%) · último: ${i.progress.last ? epLabel(i.progress.last.season, i.progress.last.episode) : '—'} · próximo: ${nx ? epLabel(nx.season, nx.episode) : '—'}</p>
      <p class="small muted">Conclusão estimada: ${i.plan.configured && i.plan.eta ? fmtDate(i.plan.eta) : 'defina um cronograma'}</p>${i.library.note ? `<p class="small">📝 ${esc(i.library.note)}</p>` : ''}
      <div class="row">${nx ? `<a class="btn sm primary" href="#/s/${enc(s.id)}/ep/${nx.season}/${nx.episode}">${icon('play')} Retomar</a>` : ''}<a class="btn sm" href="#/s/${enc(s.id)}/schedule">${icon('calendar')} Cronograma</a><button class="btn sm danger" data-act="remove-series" data-id="${esc(s.id)}" data-name="${esc(name(s))}">${icon('trash')} Remover</button></div></div></article>`; }).join('')}</div>`
    : `<div class="card center stack" style="margin-top:16px"><h3>Nada por aqui</h3><p class="muted">${items.length ? 'Nenhuma série corresponde aos filtros.' : 'Sua biblioteca está vazia.'}</p><a class="btn primary" href="#/search">${icon('search')} Pesquisar séries</a></div>`}`;
});
action('lib-filter', (el) => { const f = el.closest('form'); const d = new URLSearchParams(Object.fromEntries([...new FormData(f)].filter(([, v]) => v && v !== 'all' && v !== 'recent'))); go(`#/library${d.toString() ? '?' + d : ''}`); });
action('remove-series', async (el) => {
  if (!confirm(`Remover “${el.dataset.name}” da biblioteca? Seu progresso, relatórios e respostas dessa série serão apagados.`)) return;
  try { await del(`/api/library/${enc(el.dataset.id)}`); toast('Série removida.', 'ok'); go('#/library'); } catch (e) { toast(e.message, 'error'); }
});

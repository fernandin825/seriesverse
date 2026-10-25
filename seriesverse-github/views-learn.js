import { $, $$, esc, enc, get, post, put, del, icon, poster, bar, fmtDate, epLabel, themeFor } from './lib.js';
import { state, route, action, go, toast, overlay, setTheme } from './core.js';
import { name } from './views-browse.js';

const base = (id) => `/api/series/${enc(id)}`;
const VERDICT = { correct: ['Correto', 'correct'], partial: ['Parcialmente correto', 'partial'], incorrect: ['Incorreto', 'incorrect'], reflect: ['Reflexão registrada', 'correct'] };

// ---------- página do episódio ----------
route('/s/:id/ep/:s/:e', async ({ id, s, e }) => {
  const [st, ep] = await Promise.all([get(`/api/series/${enc(id)}`), get(`${base(id)}/episodes/${s}/${e}`)]);
  setTheme(st.series);
  const x = ep.episode; const done = x.status === 'done';
  return `<p><a href="#/s/${enc(id)}/season/${s}">${icon('back')} Temporada ${esc(s)}</a></p>
  <div class="grid g2"><div><div class="thumb">${x.still ? `<img src="${esc(x.still)}" alt="Cena de ${esc(name(st.series))} ${epLabel(s, e)}" loading="lazy" data-fallback="">` : `${icon('play')}`}</div></div>
  <div><div class="kicker">${esc(name(st.series))} · ${epLabel(s, e)}</div><h1>${x.title ? esc(x.title) : x.title_hidden ? `${icon('lock')} Título oculto` : `Episódio ${esc(e)}`}</h1>
  <p class="muted">${x.air_date ? 'Exibido em ' + fmtDate(x.air_date) : 'Data de exibição desconhecida'} ${x.runtime ? '· ' + x.runtime + ' min' : ''}</p>
  ${ep.is_future ? `<div class="notice warn">Este episódio está além do seu progresso. Marcá-lo como concluído <b>não</b> marca os anteriores.</div>` : ''}
  ${done ? `<span class="chip accent">${icon('check')} Concluído</span><div class="row" style="margin-top:12px"><a class="btn primary" href="#/s/${enc(id)}/report/${s}/${e}">Ver análise</a><a class="btn" href="#/s/${enc(id)}/quiz/${s}/${e}">Questionário</a></div>`
  : `<p>Assista ao episódio na sua plataforma e volte aqui.</p><button class="btn primary big" id="finish" data-act="finish-ep" data-id="${esc(id)}" data-s="${s}" data-e="${e}">✓ TERMINEI O EPISÓDIO</button>
  <div class="row" style="margin-top:12px">${x.status === 'inprogress' ? `<span class="chip">${icon('clock')} Em andamento</span>` : `<button class="btn" data-act="ep-inprogress" data-id="${esc(id)}" data-s="${s}" data-e="${e}">${icon('clock')} Marcar como em andamento</button>`}</div>`}
  </div></div>`;
});
action('ep-inprogress', async (el) => { try { await post(`${base(el.dataset.id)}/progress`, { action: 'inprogress', season: +el.dataset.s, episode: +el.dataset.e }); toast('Marcado como em andamento. Retome depois.', 'ok'); go(location.hash); } catch (e) { toast(e.message, 'error'); } });
action('finish-ep', async (el) => {
  if (el.disabled) return;
  el.disabled = true; overlay(true, 'Registrando episódio e preparando sua análise…');
  try {
    const r = await post(`${base(el.dataset.id)}/episodes/${el.dataset.s}/${el.dataset.e}/complete`, {});
    state.ctx.lastComplete = r;
    toast(r.registered ? 'Episódio registrado!' : 'Este episódio já estava registrado.', 'ok');
    if (r.report_error) toast(r.report_error, 'error');
    go(`#/s/${enc(el.dataset.id)}/report/${el.dataset.s}/${el.dataset.e}`);
  } catch (e) { toast(e.message, 'error'); el.disabled = false; } finally { overlay(false); }
});

// ---------- relatório ----------
const SECS = [['A', 'Episódio'], ['B', 'Resumo'], ['C', 'Acontecimentos'], ['D', 'Personagens'], ['E', 'Pistas'], ['F', 'Aprendizagens'], ['G', 'Vida real'], ['H', 'Gênero']];
route('/s/:id/report/:s/:e', async ({ id, s, e }) => {
  const [st, r] = await Promise.all([get(`/api/series/${enc(id)}`), get(`${base(id)}/report/${s}/${e}`)]);
  setTheme(st.series);
  const rep = r.report; const ident = rep.identification; const nx = st.progress.next; const th = themeFor(st.series);
  const empty = rep.insufficient || r.state === 'missing';
  const head = `<p><a href="#/s/${enc(id)}">${icon('back')} ${esc(name(st.series))}</a></p>
  <section class="rsec" id="A" style="border:0"><h2><span class="tag">A</span>Identificação</h2><div class="grid g2"><div><h1 style="font-size:2rem">${esc(ident.title_original || 'Episódio ' + e)}</h1>
  <p class="muted">${esc(ident.series)} · ${epLabel(ident.season, ident.episode)} · ${ident.air_date ? fmtDate(ident.air_date) : 'data desconhecida'}</p>
  <p class="small muted">Título em português: ${ident.title_pt ? esc(ident.title_pt) : 'não disponível'} · Identidade: ${esc(th.label)}</p></div>${ident.still ? `<div class="thumb"><img src="${esc(ident.still)}" alt="Cena do episódio" data-fallback=""></div>` : ''}</div>
  ${rep.limitation_note ? `<div class="notice warn" role="status">${icon('alert')} ${esc(rep.limitation_note)}</div>` : ''}
  <p class="small muted">Spoilers apenas deste episódio. Limite de spoilers: ${epLabel(rep.meta?.spoiler_limit?.season ?? s, rep.meta?.spoiler_limit?.episode ?? e)} · fonte: ${esc({ curated: 'relatório offline curado', ai: 'IA', 'ai+user-notes': 'IA com sua descrição', 'user-notes': 'sua descrição', insufficient: 'sem dados verificados' }[rep.meta?.source] || '—')}</p></section>`;
  if (empty) return `${head}<section class="card stack"><h2>Ajude a gerar a análise</h2><p class="muted">Descreva com suas palavras o que aconteceu no episódio. Eu uso apenas isso (e nada de episódios futuros).</p>
    <form data-form="gen-notes" data-id="${esc(id)}" data-s="${s}" data-e="${e}"><textarea name="notes" required maxlength="4000" aria-label="Descrição do episódio" placeholder="O que aconteceu neste episódio?"></textarea><div class="row" style="margin-top:10px"><button class="btn primary" type="submit">Usar minha descrição</button><button class="btn" type="button" data-act="regen" data-id="${esc(id)}" data-s="${s}" data-e="${e}">${icon('refresh')} Tentar gerar de novo</button></div></form></section>
    <div class="row" style="margin-top:16px"><a class="btn" href="#/s/${enc(id)}/season/${s}">Lista de episódios</a>${nx ? `<a class="btn primary" href="#/s/${enc(id)}/ep/${nx.season}/${nx.episode}">Próximo episódio ${icon('next')}</a>` : ''}</div>`;
  const nav = `<nav class="secnav" aria-label="Seções">${SECS.map(([k, l]) => `<a class="chip" href="javascript:void(0)" data-act="jump" data-to="${k}">${k} · ${l}</a>`).join('')}</nav>`;
  const sec = (k, t, body) => body ? `<section class="rsec" id="${k}"><h2><span class="tag">${k}</span>${t}</h2>${body}</section>` : '';
  return head + nav
  + sec('B', 'Resumo do episódio', rep.summary.map((x) => `<h3>${esc(x.heading)}</h3><p>${esc(x.text)}</p>`).join(''))
  + sec('C', 'Principais acontecimentos', (rep.events_note ? `<p class="small muted">${esc(rep.events_note)}</p>` : '') + `<div class="stack">${(rep.events || []).map((v, i) => `<div class="card flat"><h3>${i + 1}. ${esc(v.what)}</h3><p><b>Por que importa:</b> ${esc(v.why)}</p><p><b>Consequência:</b> ${esc(v.consequence)}</p><p class="small muted">${icon('bulb')} Observe: ${esc(v.observe)}</p></div>`).join('')}</div>`)
  + sec('D', 'Personagens e decisões', (rep.characters || []).map((c) => `<div class="card flat"><h3>${esc(c.name)}</h3><p><b>Decisão:</b> ${esc(c.decision)}</p><div class="fact"><b>Mostrado:</b> ${esc(c.shown)}</div><div class="interp"><b>Interpretação (hipótese):</b> ${esc(c.interpretation)} ${esc(c.motivation_hypothesis)}</div></div>`).join(''))
  + sec('E', 'Pistas, detalhes e reviravoltas', (rep.clues || []).map((c) => `<div class="card flat"><b>${esc(c.item)}</b><p class="muted">${esc(c.how_helps)}</p></div>`).join(''))
  + sec('F', 'O que aprendemos', (rep.lessons || []).map((l, i) => `<div class="card lesson"><div class="row"><h3 class="grow" style="margin:0">${esc(l.lesson)}</h3><button class="btn sm ghost starbtn" data-act="fav" data-id="${esc(id)}" data-s="${s}" data-e="${e}" data-i="${i}" aria-pressed="${r.favorites.includes(i)}" aria-label="Favoritar aprendizagem">${icon('star')}</button></div><p class="muted">${esc(l.episode_link)}</p></div>`).join(''))
  + sec('G', 'Como aplicar na vida real', (rep.lessons || []).map((l) => `<div class="card flat"><h3>${esc(l.lesson)}</h3><div class="rl"><div><b>No episódio</b>${esc(l.episode_link)}</div><div><b>Na vida real</b>${esc(l.real_life.situation)}</div><div><b>Experimente</b>${esc(l.real_life.action)}</div><div><b>Cuidado</b>${esc(l.real_life.caution)}</div></div></div>`).join(''))
  + sec('H', rep.genre_insight?.label ? `O que ensina sobre: ${esc(rep.genre_insight.label)}` : 'Sobre o gênero', rep.genre_insight?.text ? `<p>${esc(rep.genre_insight.text)}</p>` : '')
  + `<section class="card" style="margin-top:20px"><h2>${icon('flag')} Desafio prático (opcional)</h2><p>${esc(rep.challenge?.text || '')}</p><p class="small muted">${esc(rep.challenge?.safety_note || '')}</p>
     <button class="btn ${r.challenge_done ? '' : 'primary'}" data-act="challenge" data-id="${esc(id)}" data-s="${s}" data-e="${e}" data-done="${r.challenge_done ? 0 : 1}">${r.challenge_done ? 'Desfazer: desafio feito' : '✓ Fiz o desafio'}</button></section>
   <div class="row" style="margin-top:20px">${rep.quiz?.length ? `<a class="btn primary big" href="#/s/${enc(id)}/quiz/${s}/${e}">Fazer o questionário (${rep.quiz.length})</a>` : ''}${nx ? `<a class="btn big" href="#/s/${enc(id)}/ep/${nx.season}/${nx.episode}">Próximo episódio ${icon('next')}</a>` : ''}<a class="btn" href="#/s/${enc(id)}/chat">${icon('chat')} Perguntar ao assistente</a></div>`;
});
action('jump', (el) => document.getElementById(el.dataset.to)?.scrollIntoView({ behavior: 'smooth' }));
action('fav', async (el) => { const on = el.getAttribute('aria-pressed') !== 'true'; try { await post(`${base(el.dataset.id)}/report/${el.dataset.s}/${el.dataset.e}/favorite`, { idx: +el.dataset.i, on }); el.setAttribute('aria-pressed', on); toast(on ? 'Aprendizagem favoritada.' : 'Removida dos favoritos.', 'ok'); } catch (e) { toast(e.message, 'error'); } });
action('challenge', async (el) => { try { await post(`${base(el.dataset.id)}/challenge/${el.dataset.s}/${el.dataset.e}`, { done: el.dataset.done === '1' }); go(location.hash); } catch (e) { toast(e.message, 'error'); } });
action('regen', async (el) => { overlay(true, 'Gerando análise…'); try { const r = await post(`${base(el.dataset.id)}/report/${el.dataset.s}/${el.dataset.e}`, { force: true }); if (r.error) toast(r.error, 'error'); go(location.hash); } catch (e) { toast(e.message, 'error'); } finally { overlay(false); } });
action('gen-notes', async (f) => { overlay(true, 'Gerando análise…'); try { await post(`${base(f.dataset.id)}/report/${f.dataset.s}/${f.dataset.e}`, { userNotes: new FormData(f).get('notes') }); go(location.hash); } catch (e) { toast(e.message, 'error'); } finally { overlay(false); } });

// ---------- questionário ----------
route('/s/:id/quiz/:s/:e', async ({ id, s, e }) => {
  const [st, q] = await Promise.all([get(`/api/series/${enc(id)}`), get(`${base(id)}/quiz/${s}/${e}`)]);
  setTheme(st.series);
  const i = q.attempts.length;
  if (i >= q.questions.length) return `<div class="card center stack"><h1>Questionário concluído</h1><a class="btn primary" href="#/s/${enc(id)}/result/${s}/${e}">Ver resultado</a></div>`;
  const cur = q.questions[i];
  const ctl = cur.open ? `<label for="ans" class="hide">Sua resposta</label><textarea id="ans" name="answer" maxlength="2000" placeholder="Escreva com suas palavras…"></textarea>`
    : `<div class="opts" role="radiogroup" aria-label="Alternativas">${cur.options.map((o, k) => `<button type="button" class="btn opt" role="radio" aria-checked="false" data-act="pick" data-k="${k}">${String.fromCharCode(65 + k)}. ${esc(o)}</button>`).join('')}</div>`;
  return `<p><a href="#/s/${enc(id)}/report/${s}/${e}">${icon('back')} Relatório</a></p><div class="kicker">Pergunta ${i + 1} de ${q.questions.length}</div>${bar((i / q.questions.length) * 100)}
  <section class="card" style="margin-top:16px"><h1 style="font-size:1.5rem">${esc(cur.prompt)}</h1><form data-form="answer" data-id="${esc(id)}" data-s="${s}" data-e="${e}" data-qid="${esc(cur.id)}" data-open="${cur.open}" data-total="${q.questions.length}">${ctl}
  <p id="hintbox" class="notice info hide">${esc(cur.hint || 'Sem dica para esta pergunta.')}</p>
  <div class="row"><button class="btn primary" type="submit" id="send">${cur.graded ? 'Responder' : 'Registrar reflexão'}</button>${cur.hint ? `<button class="btn" type="button" data-act="hint">${icon('bulb')} Dica</button>` : ''}</div></form><div id="fb"></div></section>`;
});
action('pick', (el) => { $$('.opt').forEach((b) => b.setAttribute('aria-checked', b === el ? 'true' : 'false')); $('form[data-form="answer"]').dataset.pick = el.dataset.k; });
action('hint', () => $('#hintbox').classList.remove('hide'));
action('answer', async (f) => {
  const open = f.dataset.open === 'true'; let answer;
  if (open) answer = new FormData(f).get('answer'); else { if (f.dataset.pick === undefined) return toast('Escolha uma alternativa.', 'error'); answer = Number(f.dataset.pick); }
  const btn = $('#send'); btn.disabled = true;
  try {
    const r = await post(`${base(f.dataset.id)}/quiz/${f.dataset.s}/${f.dataset.e}/answer`, { qid: f.dataset.qid, answer });
    const res = r.result; const [label, cls] = VERDICT[res.verdict] || ['Registrado', 'correct'];
    const last = r.summary.answered >= Number(f.dataset.total);
    $$('.opt').forEach((b) => { b.disabled = true; if (res.verdict !== 'reflect' && b.textContent.slice(3) === res.correct) b.classList.add('right'); else if (b.getAttribute('aria-checked') === 'true') b.classList.add('wrong'); });
    $('#fb').innerHTML = `<div class="verdict ${cls} success-pop" role="status"><b>${label}</b><p>${esc(res.feedback || '')}</p>${res.verdict !== 'reflect' ? `<p><b>Resposta correta / modelo:</b> ${esc(res.correct || res.model_answer || '')}</p>` : ''}<p class="muted">${esc(res.explanation || '')}</p>
      <button class="btn primary" data-act="next-q" data-to="${last ? `#/s/${enc(f.dataset.id)}/result/${f.dataset.s}/${f.dataset.e}` : location.hash}">${last ? 'Ver resultado' : 'Próxima pergunta'} ${icon('next')}</button></div>`;
    $('#fb button').focus(); btn.classList.add('hide');
  } catch (e) { toast(e.message, 'error'); btn.disabled = false; }
});
action('next-q', (el) => go(el.dataset.to));

route('/s/:id/result/:s/:e', async ({ id, s, e }) => {
  const [st, q] = await Promise.all([get(`/api/series/${enc(id)}`), get(`${base(id)}/quiz/${s}/${e}`)]);
  setTheme(st.series); const sm = q.summary; const nx = st.progress.next;
  return `<div class="card center stack success-pop"><div class="kicker">Resultado · ${epLabel(s, e)}</div>${sm.percent === null ? '<h1>Reflexões registradas</h1>' : `<div class="score">${sm.percent}%</div><p>${sm.earned} de ${sm.max} pontos</p>`}
  <p class="small muted">A pontuação mede compreensão do episódio — não é medida de inteligência.</p></div>
  <div class="stack" style="margin-top:16px">${q.questions.map((qq, i) => { const a = q.attempts[i]; const [l, c] = a ? VERDICT[a.verdict] || ['', ''] : ['Sem resposta', 'partial']; return `<div class="card flat"><b>${i + 1}. ${esc(qq.prompt)}</b><p class="${c === 'correct' ? 'badge-done' : c === 'partial' ? 'badge-prog' : ''}">${l}</p>${a ? `<p class="small muted">${esc(a.feedback || '')} ${a.explanation ? esc(a.explanation) : ''}</p>` : ''}</div>`; }).join('')}</div>
  ${q.challenge?.text ? `<section class="card" style="margin-top:16px"><h3>${icon('flag')} Desafio opcional</h3><p>${esc(q.challenge.text)}</p><button class="btn" data-act="challenge" data-id="${esc(id)}" data-s="${s}" data-e="${e}" data-done="${q.challenge_done ? 0 : 1}">${q.challenge_done ? 'Desfazer' : '✓ Fiz o desafio'}</button></section>` : ''}
  <div class="row" style="margin-top:20px">${nx ? `<a class="btn primary big" href="#/s/${enc(id)}/ep/${nx.season}/${nx.episode}">Próximo episódio ${icon('next')}</a>` : '<span class="chip accent">Série concluída</span>'}<a class="btn" href="#/s/${enc(id)}/report/${s}/${e}">Rever relatório</a><a class="btn" href="#/dashboard">Painel</a></div>`;
});

// ---------- conversa ----------
const bubble = (m) => `<div class="msg ${m.role}">${esc(m.content)}</div>`;
route('/s/:id/chat', async ({ id }) => {
  const [st, c] = await Promise.all([get(`/api/series/${enc(id)}`), get(`${base(id)}/chat`)]);
  setTheme(st.series); const th = themeFor(st.series);
  return `<p><a href="#/s/${enc(id)}">${icon('back')} ${esc(name(st.series))}</a></p><div class="row"><div style="width:56px">${poster(st.series)}</div><div><h1 style="margin:0;font-size:1.6rem">Conversa · ${esc(name(st.series))}</h1><p class="small muted">${esc(th.label)} · Limite de spoilers: ${c.limit.season ? epLabel(c.limit.season, c.limit.episode) : 'nenhum episódio concluído'}</p></div></div>
  ${c.ai ? '' : `<div class="notice info">Modo offline: sem IA configurada, posso revisar suas perguntas erradas, propor desafios e relembrar lições.</div>`}
  <section class="card"><div class="chatbox" id="chatbox" aria-live="polite">${c.messages.length ? c.messages.map(bubble).join('') : '<p class="muted">Pergunte algo sobre os episódios que você já concluiu.</p>'}</div>
  <div class="row" style="margin:10px 0">${['Explique sem revelar nada do futuro', 'Como posso aplicar essa lição na vida real?', 'Faça outro desafio', 'Revise as perguntas que errei'].map((t) => `<button class="btn sm" data-act="chat-quick" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
  <form class="row" data-form="chat-send" data-id="${esc(id)}"><label class="hide" for="cm">Mensagem</label><input id="cm" name="message" class="grow" maxlength="1500" autocomplete="off" required placeholder="Escreva sua pergunta…"><button class="btn primary" type="submit">${icon('send')} Enviar</button></form></section>`;
});
action('chat-quick', (el) => { $('#cm').value = el.dataset.t; $('form[data-form="chat-send"]').requestSubmit(); });
async function sendChat(f, message, spoilerUntil) {
  const box = $('#chatbox'); box.insertAdjacentHTML('beforeend', bubble({ role: 'user', content: message })); box.insertAdjacentHTML('beforeend', '<div class="msg assistant" id="typing">…</div>'); box.scrollTop = box.scrollHeight;
  try {
    const r = await post(`${base(f.dataset.id)}/chat`, { message, spoilerUntil });
    $('#typing').remove();
    box.insertAdjacentHTML('beforeend', `<div class="msg assistant">${esc(r.reply)}${r.cards.map((c) => `<div class="msgcard"><b>${esc(c.title)}</b><br>${esc(c.body).replace(/\n/g, '<br>')}</div>`).join('')}${r.actions.length ? `<div class="row" style="margin-top:8px">${r.actions.map((a) => `<button class="btn sm" data-act="chat-action" data-msg="${esc(message)}" data-su="${a.spoilerUntil ? esc(JSON.stringify(a.spoilerUntil)) : ''}">${esc(a.label)}</button>`).join('')}</div>` : ''}</div>`);
  } catch (e) { $('#typing')?.remove(); toast(e.message, 'error'); }
  box.scrollTop = box.scrollHeight;
}
action('chat-send', async (f) => { const m = new FormData(f).get('message').trim(); if (!m) return; $('#cm').value = ''; await sendChat(f, m); });
action('chat-action', async (el) => { if (!el.dataset.su) return; await sendChat($('form[data-form="chat-send"]'), el.dataset.msg, JSON.parse(el.dataset.su)); });

// ---------- painel ----------
const achIcon = { first_analysis: 'bulb', ten_episodes: 'list', perfect_quiz: 'star', first_series: 'trophy', thirty_days: 'calendar' };
const achCard = (a) => `<div class="ach ${a.unlocked ? 'on' : ''}"><div class="ic">${icon(a.unlocked ? achIcon[a.id] || 'trophy' : 'lock')}</div><div><b>${esc(a.title)}</b><div class="small muted">${a.unlocked ? 'Desbloqueada' : a.goal ? `${a.progress}/${a.goal}` : 'Bloqueada'}</div></div></div>`;
route('/dashboard', async () => {
  setTheme(null); const d = await get('/api/dashboard'); const t = d.totals;
  const chart = d.history.enough && d.history.weeks.length ? `<div class="bars" role="img" aria-label="Episódios concluídos por semana">${d.history.weeks.map((w) => `<div><span>${w.value}</span><i style="height:${(w.value / Math.max(...d.history.weeks.map((x) => x.value))) * 100}%"></i><span class="muted">${w.label.slice(8)}/${w.label.slice(5, 7)}</span></div>`).join('')}</div>` : '<p class="muted">Os gráficos aparecem quando houver atividade em pelo menos 3 dias diferentes.</p>';
  return `<h1>Painel de aprendizagem</h1><div class="grid g3">
  <div class="card stat"><b>${t.episodes_watched}</b><span>episódios assistidos</span></div><div class="card stat"><b>${t.series_started}</b><span>séries iniciadas</span></div><div class="card stat"><b>${t.series_completed}</b><span>séries concluídas</span></div>
  <div class="card stat"><b>${t.hours ?? '—'}</b><span>${t.hours === null ? 'horas: durações desconhecidas' : `horas estimadas (${t.hours_coverage.known}/${t.hours_coverage.total} eps. com duração)`}</span></div>
  <div class="card stat"><b>${t.quiz_avg_percent === null ? '—' : t.quiz_avg_percent + '%'}</b><span>acertos médios (${t.quiz_answered} respostas)</span></div><div class="card stat"><b>${t.challenges_done}</b><span>desafios realizados</span></div>
  <div class="card stat"><b>${t.streak_days}</b><span>dias seguidos de atividade</span></div></div>
  <section class="card" style="margin-top:16px"><h2>Episódios por semana</h2>${chart}</section>
  <div class="grid g2" style="margin-top:16px"><section class="card"><h2>Habilidades praticadas</h2>${d.skills.length ? d.skills.map((k) => `<p>${esc(k.name)} <span class="chip">${k.count}×</span></p>`).join('') : '<p class="muted">Ainda sem dados.</p>'}</section>
  <section class="card"><h2>Aprendizagens favoritas</h2>${d.favorites.length ? d.favorites.map((f) => `<p>${icon('star')} ${esc(f.text)} <span class="muted small">${epLabel(f.season, f.episode)}</span></p>`).join('') : '<p class="muted">Favorite lições nos relatórios.</p>'}</section></div>
  <section class="card" style="margin-top:16px"><h2>Conquistas</h2><div class="grid g2">${d.achievements.map(achCard).join('')}</div></section><p class="small muted">${esc(d.disclaimer)}</p>`;
});

// ---------- perfil ----------
route('/profile', async () => {
  setTheme(null); const d = await get('/api/dashboard'); const t = d.totals;
  return `<h1>Perfil e progresso</h1><section class="card stack"><p>Seu progresso, relatórios e respostas ficam salvos neste celular (sem login e sem servidor). Se você desinstalar o app ou limpar os dados dele, o progresso é apagado — use “Exportar meus dados” em Ajustes para guardar uma cópia.</p>
  <div class="grid g3"><div class="stat"><b>${t.episodes_watched}</b><span>episódios</span></div><div class="stat"><b>${t.active_days}</b><span>dias de atividade</span></div><div class="stat"><b>${t.series_started}</b><span>séries iniciadas</span></div></div></section>
  <section class="card" style="margin-top:16px"><h2>Conquistas</h2><div class="grid g2">${d.achievements.map(achCard).join('')}</div></section><div class="row" style="margin-top:16px"><a class="btn" href="#/dashboard">${icon('chart')} Painel completo</a><a class="btn" href="#/settings">${icon('settings')} Ajustes</a></div>`;
});

// ---------- ajustes ----------
route('/settings', async () => {
  setTheme(null); const h = await get('/api/health'); const keys = await get('/api/keys'); const p = state.prefs;
  return `<h1>Ajustes</h1><section class="card stack"><h2>Aparência e acessibilidade</h2>
  <div class="row"><button class="btn" data-act="toggle-theme">${icon('sun')} Alternar claro/escuro</button></div>
  <div class="field"><label for="fsz">Tamanho do texto: <span id="fszv">${Math.round(p.fontScale * 100)}%</span></label><input id="fsz" type="range" min="0.85" max="1.4" step="0.05" value="${p.fontScale}" data-change="set-font"></div>
  <label class="switch-row"><span>Reduzir animações</span><input type="checkbox" ${p.reduceMotion ? 'checked' : ''} data-change="set-motion" role="switch"></label></section>
  <section class="card stack" style="margin-top:16px"><h2>${icon('sun')} Liquid Glass</h2>
  <div class="field"><label for="glass">Transparência do vidro: <span id="glassv">${glassLabel(p.glass ?? 60)}</span></label>
  <input id="glass" type="range" min="0" max="100" step="1" value="${p.glass ?? 60}" data-change="set-glass" aria-describedby="glasshint">
  <div class="range-ends small muted"><span>Mais transparente</span><span>Mais fosco</span></div></div>
  <div class="seg" role="group" aria-label="Atalhos de transparência"><button class="btn sm" type="button" data-act="glass-preset" data-v="10">Transparente</button><button class="btn sm" type="button" data-act="glass-preset" data-v="60">Equilibrado</button><button class="btn sm" type="button" data-act="glass-preset" data-v="95">Fosco</button></div>
  <p id="glasshint" class="small muted">Dica: se o texto ficar difícil de ler sobre um fundo claro, aumente a opacidade (mais fosco).</p>
  <label class="switch-row"><span>Brilho e vibração ao tocar</span><input type="checkbox" ${p.touchFx !== false ? 'checked' : ''} data-change="set-touchfx" role="switch"></label></section>
  <section class="card stack" style="margin-top:16px"><h2>${icon('lock')} Anti-spoiler</h2><div class="field"><label for="sm">Modo de spoilers</label><select id="sm" data-change="set-spoiler" style="max-width:360px"><option value="restricted" ${p.spoilerMode !== 'normal' ? 'selected' : ''}>Restrito (oculta títulos e sinopses futuros)</option><option value="normal" ${p.spoilerMode === 'normal' ? 'selected' : ''}>Normal (mostra títulos; sinopses seguem ocultas)</option></select></div></section>
  <section class="card stack" style="margin-top:16px"><h2>${icon('lock')} Chaves de acesso (ficam só neste celular)</h2>
  <p>Catálogo TMDB: <b>${h.providers.tmdb ? 'ativo' : 'não configurado'}</b> · IA: <b>${h.providers.ai ? 'ativa' : 'não configurada'}</b> · Dados: ${esc(h.persistence)}</p>
  <form class="stack" data-form="save-keys" autocomplete="off">
  <div class="field"><label for="kt">Chave do TMDB (Read Access Token ou API Key)</label><input id="kt" name="tmdb" type="password" placeholder="${h.providers.tmdb ? '•••• já salva — deixe em branco para manter' : 'Cole aqui para pesquisar milhares de séries'}"></div>
  <div class="field"><label for="ka">Chave do Gemini (IA gratuita do Google)</label><input id="ka" name="ai" type="password" placeholder="${h.providers.ai ? '•••• já salva — deixe em branco para manter' : 'Cole aqui para relatórios, correção e chat'}"></div>
  <div class="field"><label for="km">Modelo do Gemini (só mude se der erro de modelo)</label><input id="km" name="model" value="${esc(keys.model || 'gemini-3.8-flash')}"></div>
  <div class="row"><button class="btn primary" type="submit">Salvar chaves</button><button class="btn" type="button" data-act="clear-keys">Apagar chaves</button></div></form>
  <p class="small muted">Sem chaves o app funciona offline com o catálogo local e o que você já registrou. As chaves ficam guardadas apenas neste aparelho e não entram no “Exportar meus dados”. Quem tiver acesso ao seu celular desbloqueado pode vê-las — use só para uso pessoal.</p></section>
  <section class="card stack" style="margin-top:16px"><h2>Seus dados</h2><div class="row"><button class="btn" data-act="export-data">${icon('download')} Exportar meus dados</button><button class="btn danger" data-act="delete-all">${icon('trash')} Excluir todos os meus dados</button></div></section>`;
});
const glassLabel = (v) => (v < 25 ? 'bem transparente' : v < 50 ? 'transparente' : v < 75 ? 'equilibrado' : 'fosco');
const setGlassVar = (v) => document.documentElement.style.setProperty('--gk', (0.2 + v / 75).toFixed(2));
// ajuste ao vivo enquanto arrasta (sem esperar soltar o dedo)
document.addEventListener('input', (e) => { if (e.target.id !== 'glass') return; const v = Number(e.target.value); setGlassVar(v); const l = $('#glassv'); if (l) l.textContent = glassLabel(v); });
const savePref = async (patch) => { Object.assign(state.prefs, patch); try { await put('/api/settings', patch); } catch (e) { toast(e.message, 'error'); } };
action('set-glass', (el) => { const v = Number(el.value); setGlassVar(v); savePref({ glass: v }); });
action('glass-preset', (el) => { const v = Number(el.dataset.v); const r = $('#glass'); if (r) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); } setGlassVar(v); const l = $('#glassv'); if (l) l.textContent = glassLabel(v); savePref({ glass: v }); });
action('set-touchfx', (el) => { savePref({ touchFx: el.checked }); toast(el.checked ? 'Brilho e vibração ligados.' : 'Brilho e vibração desligados.', 'ok'); });
action('set-font', (el) => { document.documentElement.style.setProperty('--fs', el.value); $('#fszv').textContent = Math.round(el.value * 100) + '%'; savePref({ fontScale: Number(el.value) }); });
action('set-motion', (el) => { document.documentElement.dataset.motion = el.checked ? 'off' : 'on'; savePref({ reduceMotion: el.checked }); });
action('set-spoiler', (el) => { savePref({ spoilerMode: el.value }); toast('Modo de spoilers atualizado.', 'ok'); });
action('save-keys', async (f) => {
  const d = Object.fromEntries(new FormData(f)); const body = { model: d.model };
  if (d.tmdb && d.tmdb.trim()) body.tmdb = d.tmdb; if (d.ai && d.ai.trim()) body.ai = d.ai;
  try { await put('/api/keys', body); toast('Chaves salvas neste celular.', 'ok'); go('#/settings'); location.reload(); } catch (e) { toast(e.message, 'error'); }
});
action('clear-keys', async () => { if (!confirm('Apagar as chaves salvas neste celular?')) return; try { await put('/api/keys', { tmdb: '', ai: '' }); toast('Chaves apagadas.', 'ok'); location.reload(); } catch (e) { toast(e.message, 'error'); } });
action('export-data', async () => {
  try {
    const data = await get('/api/export'); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const file = new File([blob], 'seriesverse-dados.json', { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: 'SERIESVERSE AI' }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'seriesverse-dados.json'; document.body.appendChild(a); a.click(); a.remove(); toast('Arquivo exportado.', 'ok');
  } catch (e) { toast(e.message, 'error'); }
});
action('delete-all', async () => {
  if (prompt('Isto apaga TODO o seu progresso, relatórios e respostas. Digite EXCLUIR para confirmar:') !== 'EXCLUIR') return;
  try { await del('/api/me'); toast('Dados excluídos.', 'ok'); state.prefs.onboarded = false; go('#/'); } catch (e) { toast(e.message, 'error'); }
});

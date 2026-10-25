// Cálculo de cronograma — funções puras (sem I/O), fáceis de testar.
const DAY = 86400000;
const parse = (s) => new Date(`${s}T00:00:00Z`);
const ymd = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * DAY);
const validDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parse(s).getTime());

export function normalizePrefs(p = {}) {
  const perDay = Math.min(20, Math.max(1, Math.trunc(Number(p.perDay) || 1)));
  let weekdays = Array.isArray(p.weekdays) ? p.weekdays.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6) : [];
  weekdays = [...new Set(weekdays)].sort();
  if (!weekdays.length) weekdays = [1, 2, 3, 4, 5];
  return {
    perDay,
    weekdays,
    goalDate: validDate(p.goalDate) ? p.goalDate : null,
    mode: p.mode === 'fixed' ? 'fixed' : 'flexible',
    startDate: validDate(p.startDate) ? p.startDate : null,
    baseline: Math.max(0, Math.trunc(Number(p.baseline) || 0)),
  };
}

/**
 * @param episodes  [{season, episode, runtime}] em ordem de exibição
 * @param doneKeys  Set de "s:e" concluídos
 * @param prefs     preferências (ou null)
 * @param today     YYYY-MM-DD (data local do usuário)
 * @param doneToday episódios concluídos hoje (abatem a cota de hoje)
 */
export function computePlan({ episodes, doneKeys, prefs, today, doneToday = 0 }) {
  const total = episodes.length;
  const pending = episodes.filter((e) => !doneKeys.has(`${e.season}:${e.episode}`));
  const done = total - pending.length;
  const base = {
    total,
    done,
    remaining: pending.length,
    percent: total ? Math.round((done / total) * 1000) / 10 : 0,
    configured: false,
  };
  if (!prefs) return base;

  const p = normalizePrefs(prefs);
  const perWeek = p.perDay * p.weekdays.length;
  const known = pending.filter((e) => Number.isFinite(e.runtime) && e.runtime > 0);
  const out = {
    ...base,
    configured: true,
    perDay: p.perDay,
    perWeek,
    weekdays: p.weekdays,
    mode: p.mode,
    goalDate: p.goalDate,
    runtime: {
      knownEpisodes: known.length,
      pendingEpisodes: pending.length,
      remainingMinutes: known.reduce((a, e) => a + e.runtime, 0),
      complete: known.length === pending.length && pending.length > 0,
    },
    sessions: [],
    sessionsTotal: 0,
    eta: null,
    nextSession: null,
    behind: 0,
    ahead: 0,
  };
  if (!pending.length) {
    out.finished = true;
    return out;
  }

  // Distribui os episódios restantes nos próximos dias permitidos.
  let idx = 0;
  const t0 = parse(today);
  for (let i = 0; i < 3650 && idx < pending.length; i++) {
    const d = addDays(t0, i);
    if (!p.weekdays.includes(d.getUTCDay())) continue;
    const quota = i === 0 ? Math.max(0, p.perDay - doneToday) : p.perDay;
    if (quota === 0) continue;
    const take = pending.slice(idx, idx + quota);
    idx += take.length;
    out.sessionsTotal++;
    const label = (e) => `T${e.season}E${e.episode}`;
    if (out.sessions.length < 60) {
      out.sessions.push({
        date: ymd(d),
        weekday: d.getUTCDay(),
        count: take.length,
        from: label(take[0]),
        to: label(take[take.length - 1]),
        episodes: take.map((e) => ({ season: e.season, episode: e.episode })),
      });
    }
    out.eta = ymd(d);
  }
  out.nextSession = out.sessions[0] || null;

  // Atraso/adiantamento em relação ao plano desde a data de início.
  if (p.startDate && p.startDate <= today) {
    let planned = p.baseline;
    for (let d = parse(p.startDate); ymd(d) < today; d = addDays(d, 1)) {
      if (p.weekdays.includes(d.getUTCDay())) planned += p.perDay;
    }
    planned = Math.min(planned, total);
    out.plannedToDate = planned;
    out.behind = Math.max(0, planned - done);
    out.ahead = Math.max(0, done - planned);
  }

  if (p.goalDate) {
    let allowed = 0;
    for (let d = t0; ymd(d) <= p.goalDate && allowed < 5000; d = addDays(d, 1)) {
      if (p.weekdays.includes(d.getUTCDay())) allowed++;
    }
    out.goal = {
      allowedDaysLeft: allowed,
      requiredPerDay: allowed > 0 ? Math.ceil(pending.length / allowed) : null,
      meetsGoal: !!out.eta && out.eta <= p.goalDate,
    };
  }
  return out;
}

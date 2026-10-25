import { norm } from './util.js';

const CHOICE = new Set(['mc', 'clue', 'hypothesis', 'character']);

export const isChoice = (q) => CHOICE.has(q.type) && Array.isArray(q.options);

/** Versão pública: nunca inclui resposta, explicação nem critérios. */
export function publicQuiz(quiz) {
  return quiz.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    options: q.type === 'tf' ? ['Verdadeiro', 'Falso'] : q.options || null,
    hint: q.hint || null,
    open: !isChoice(q) && q.type !== 'tf',
    graded: q.type !== 'reflect',
  }));
}

export function normalizeQuiz(raw) {
  const types = new Set(['mc', 'tf', 'open', 'clue', 'hypothesis', 'apply', 'reasoning', 'character', 'reflect']);
  const out = [];
  for (const q of Array.isArray(raw) ? raw : []) {
    if (!q || typeof q.prompt !== 'string' || !q.prompt.trim()) continue;
    const type = types.has(q.type) ? q.type : Array.isArray(q.options) ? 'mc' : 'open';
    const item = {
      id: `q${out.length + 1}`, type, prompt: q.prompt.trim().slice(0, 600),
      explanation: String(q.explanation || '').slice(0, 800), hint: q.hint ? String(q.hint).slice(0, 300) : null,
    };
    if (CHOICE.has(type)) {
      if (!Array.isArray(q.options) || q.options.length < 2 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) continue;
      item.options = q.options.map((o) => String(o).slice(0, 300));
      item.answer = q.answer;
    } else if (type === 'tf') {
      if (typeof q.answer !== 'boolean') continue;
      item.answer = q.answer;
    } else {
      item.criteria = Array.isArray(q.criteria)
        ? q.criteria.filter((c) => c && c.label).map((c) => ({ label: String(c.label).slice(0, 200), keywords: (c.keywords || []).map((k) => String(k)).slice(0, 20) }))
        : [];
      item.model_answer = q.model_answer ? String(q.model_answer).slice(0, 800) : '';
    }
    out.push(item);
    if (out.length === 5) break; // nunca mais de 5 perguntas por episódio
  }
  return out;
}

/** Correção sem IA: critérios por palavras-chave (flexível: basta uma palavra de cada critério). */
export function gradeLocal(q, answer) {
  if (q.type === 'reflect') return { score: null, verdict: 'reflect', feedback: 'Reflexão pessoal — não é avaliada.', understood: [], missing: [] };
  const a = norm(answer);
  const crit = q.criteria || [];
  if (!crit.length) {
    const ok = a.length >= 20;
    return { score: ok ? 0.5 : 0, verdict: ok ? 'partial' : 'incorrect', feedback: ok ? 'Resposta registrada. Compare com a resposta-modelo abaixo.' : 'Resposta muito curta para avaliar. Compare com a resposta-modelo abaixo.', understood: [], missing: [] };
  }
  const understood = [];
  const missing = [];
  for (const c of crit) {
    (c.keywords.some((k) => a.includes(norm(k))) ? understood : missing).push(c.label);
  }
  const ratio = understood.length / crit.length;
  const verdict = ratio >= 0.67 ? 'correct' : ratio > 0 ? 'partial' : 'incorrect';
  const score = verdict === 'correct' ? 1 : verdict === 'partial' ? 0.5 : 0;
  let feedback;
  if (verdict === 'correct') feedback = 'Boa resposta: ' + understood.join('; ') + '.';
  else if (verdict === 'partial') feedback = `Você já ${understood.join('; ')}. Faltou: ${missing.join('; ')}.`;
  else feedback = 'Não identifiquei os pontos principais. Falta: ' + missing.join('; ') + '.';
  return { score, verdict, feedback, understood, missing };
}

export function gradeChoice(q, answer) {
  let ok;
  if (q.type === 'tf') {
    const v = answer === true || answer === 'true' || answer === 0 || answer === '0' ? true : answer === false || answer === 'false' || answer === 1 || answer === '1' ? false : null;
    // No cliente: opções ["Verdadeiro","Falso"] -> índice 0 = verdadeiro, 1 = falso
    ok = v === q.answer;
  } else {
    ok = Number(answer) === q.answer;
  }
  return { score: ok ? 1 : 0, verdict: ok ? 'correct' : 'incorrect', feedback: ok ? 'Correto!' : 'Não foi dessa vez.' };
}

export function correctLabel(q) {
  if (q.type === 'tf') return q.answer ? 'Verdadeiro' : 'Falso';
  if (isChoice(q)) return q.options[q.answer];
  return q.model_answer || '';
}

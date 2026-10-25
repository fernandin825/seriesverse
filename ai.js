import { HttpError, fetchWithTimeout } from './util.js';

/**
 * Cliente mínimo da API do Google Gemini (generateContent), chamado direto do app com a chave do usuário.
 * Os nomes de modelo mudam com frequência: se o modelo escolhido não existir (404), tenta os próximos da lista.
 */
export const DEFAULT_MODEL = 'gemini-3.8-flash';
const FALLBACKS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
let lastGood = null; // modelo que funcionou nesta sessão

export class AI {
  constructor(env = {}, fetchImpl = globalThis.fetch) {
    this.env = env;
    this.fetch = fetchImpl;
    this.model = env.AI_MODEL || DEFAULT_MODEL;
    this.base = (env.AI_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
  }
  get enabled() {
    return !!this.env.GEMINI_API_KEY;
  }
  models() {
    return [...new Set([lastGood, this.model, ...FALLBACKS].filter(Boolean))];
  }

  async text({ system, messages, maxTokens = 4096, timeoutMs = 90000, json = false }) {
    if (!this.enabled) throw new HttpError(503, 'IA não configurada: cole sua chave do Gemini em Ajustes.', 'ai_not_configured');
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content) }] })),
      generationConfig: { maxOutputTokens: Math.min(16384, Math.max(maxTokens * 2, 4096)), temperature: json ? 0.4 : 0.7, ...(json ? { responseMimeType: 'application/json' } : {}) },
    };
    let lastErr = null;
    for (const model of this.models()) {
      let res;
      try {
        res = await fetchWithTimeout(
          this.fetch,
          `${this.base}/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': this.env.GEMINI_API_KEY }, body: JSON.stringify(body) },
          timeoutMs,
        );
      } catch {
        throw new HttpError(502, 'Não foi possível falar com o Gemini agora. Verifique a internet.', 'ai_unavailable');
      }
      if (res.status === 404) { lastErr = new HttpError(502, `O modelo "${model}" não foi encontrado. Troque o nome do modelo em Ajustes.`, 'ai_model'); continue; }
      if (res.status === 429) throw new HttpError(502, 'Limite gratuito do Gemini atingido. Espere cerca de 1 minuto e tente de novo.', 'ai_rate_limit');
      if (res.status === 401 || res.status === 403) throw new HttpError(502, 'Chave do Gemini recusada. Confira a chave em Ajustes.', 'ai_auth');
      if (res.status === 400) {
        const e = await res.json().catch(() => null);
        const msg = String(e?.error?.message || '');
        if (/api key/i.test(msg)) throw new HttpError(502, 'Chave do Gemini inválida. Confira a chave em Ajustes.', 'ai_auth');
        if (/model/i.test(msg)) { lastErr = new HttpError(502, `O modelo "${model}" não aceitou o pedido.`, 'ai_model'); continue; }
        throw new HttpError(502, 'O Gemini recusou o pedido (400).', 'ai_unavailable');
      }
      if (!res.ok) throw new HttpError(502, `O Gemini respondeu com erro (${res.status}).`, 'ai_unavailable');
      const data = await res.json().catch(() => null);
      const cand = data?.candidates?.[0];
      const text = (cand?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
      if (!text) throw new HttpError(502, cand?.finishReason === 'SAFETY' ? 'O Gemini bloqueou esta resposta por segurança.' : 'Resposta vazia do Gemini.', 'ai_empty');
      lastGood = model;
      return text;
    }
    throw lastErr || new HttpError(502, 'Nenhum modelo do Gemini respondeu.', 'ai_unavailable');
  }

  async json(opts) {
    const t = await this.text({ ...opts, json: true });
    const a = t.indexOf('{');
    const b = t.lastIndexOf('}');
    if (a < 0 || b <= a) throw new HttpError(502, 'A IA não retornou um JSON válido.', 'ai_bad_json');
    try {
      return JSON.parse(t.slice(a, b + 1));
    } catch {
      throw new HttpError(502, 'A IA não retornou um JSON válido.', 'ai_bad_json');
    }
  }
}

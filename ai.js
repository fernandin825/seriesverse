import { HttpError, fetchWithTimeout } from './util.js';

/** Cliente mínimo da API Messages (Anthropic). A chave fica só no servidor. */
export class AI {
  constructor(env = {}, fetchImpl = globalThis.fetch) {
    this.env = env;
    this.fetch = fetchImpl;
    this.model = env.AI_MODEL || 'claude-sonnet-5-5';
    this.base = (env.AI_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
  }
  get enabled() {
    return !!this.env.ANTHROPIC_API_KEY;
  }

  async text({ system, messages, maxTokens = 4096, timeoutMs = 90000 }) {
    if (!this.enabled) throw new HttpError(503, 'IA não configurada (defina ANTHROPIC_API_KEY).', 'ai_not_configured');
    let res;
    try {
      res = await fetchWithTimeout(
        this.fetch,
        `${this.base}/v1/messages`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': this.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({ model: this.model, max_tokens: maxTokens, system, messages }),
        },
        timeoutMs,
      );
    } catch {
      throw new HttpError(502, 'Não foi possível falar com o provedor de IA agora.', 'ai_unavailable');
    }
    if (!res.ok) throw new HttpError(502, `O provedor de IA respondeu com erro (${res.status}).`, 'ai_unavailable');
    const data = await res.json().catch(() => null);
    const text = data?.content?.filter((b) => b.type === 'text').map((b) => b.text).join('') || '';
    if (!text) throw new HttpError(502, 'Resposta vazia do provedor de IA.', 'ai_empty');
    return text;
  }

  async json(opts) {
    const t = await this.text(opts);
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

// OpenClaw Gateway Client — connects to local gateway HTTP API
// Uses OpenAI-compatible chat completions endpoint with streaming

const GATEWAY_URL = 'http://localhost:18789';

export interface GatewayConfig {
  url?: string;
  token?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamCallbacks {
  onToken?: (token: string) => void;
  onDone?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

// Get gateway config from localStorage or defaults
export function getGatewayConfig(): GatewayConfig {
  if (typeof window === 'undefined') return { url: GATEWAY_URL };
  try {
    const stored = localStorage.getItem('gateway-config');
    if (stored) return JSON.parse(stored);
  } catch {}
  return { url: GATEWAY_URL };
}

export function setGatewayConfig(config: GatewayConfig) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('gateway-config', JSON.stringify(config));
}

// Check if gateway is reachable
export async function pingGateway(): Promise<{ ok: boolean; latencyMs: number }> {
  const config = getGatewayConfig();
  const start = Date.now();
  try {
    const res = await fetch(`${config.url || GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
      },
      body: JSON.stringify({
        model: 'openclaw:main',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(3000),
    });
    return { ok: res.ok || res.status === 401, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

// Send a message and stream the response
export async function sendMessageStreaming(
  agentId: string,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  abortController?: AbortController,
): Promise<string> {
  const config = getGatewayConfig();
  const url = `${config.url || GATEWAY_URL}/v1/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.token) headers['Authorization'] = `Bearer ${config.token}`;

  const agentMap: Record<string, string> = {
    titus: 'main',
    looty: 'looty',
    bolt: 'minibolt',
    minibolt: 'minibolt',
  };

  const openclawAgentId = agentMap[agentId] || agentId;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: `openclaw:${openclawAgentId}`,
      messages,
      stream: true,
      user: `command-center-${openclawAgentId}`,
    }),
    signal: abortController?.signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gateway error ${res.status}: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') {
        callbacks.onDone?.(fullText);
        return fullText;
      }

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          callbacks.onToken?.(delta);
        }
      } catch {}
    }
  }

  callbacks.onDone?.(fullText);
  return fullText;
}

// Non-streaming send
export async function sendMessage(
  agentId: string,
  messages: ChatMessage[],
): Promise<string> {
  const config = getGatewayConfig();
  const url = `${config.url || GATEWAY_URL}/v1/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.token) headers['Authorization'] = `Bearer ${config.token}`;

  const agentMap: Record<string, string> = {
    titus: 'main',
    looty: 'looty',
    bolt: 'minibolt',
    minibolt: 'minibolt',
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: `openclaw:${agentMap[agentId] || agentId}`,
      messages,
      user: `command-center-${agentMap[agentId] || agentId}`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gateway error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || '';
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getGatewayConfig, pingGateway, sendMessageStreaming, type ChatMessage } from '@/lib/gateway';

export function useGatewayStatus() {
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    setChecking(true);
    const result = await pingGateway();
    setConnected(result.ok);
    setLatency(result.latencyMs);
    setChecking(false);
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [check]);

  return { connected, latency, checking, recheck: check };
}

export function useGatewayChat(agentId: string) {
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (
    messages: ChatMessage[],
    onToken?: (token: string) => void,
    onDone?: (fullText: string) => void,
    onError?: (error: Error) => void,
  ) => {
    setStreaming(true);
    setStreamText('');
    abortRef.current = new AbortController();

    try {
      const result = await sendMessageStreaming(
        agentId,
        messages,
        {
          onToken: (token) => {
            setStreamText(prev => prev + token);
            onToken?.(token);
          },
          onDone: (fullText) => {
            setStreaming(false);
            onDone?.(fullText);
          },
          onError: (error) => {
            setStreaming(false);
            onError?.(error);
          },
        },
        abortRef.current,
      );
      return result;
    } catch (err: any) {
      setStreaming(false);
      if (err.name !== 'AbortError') {
        onError?.(err);
      }
      throw err;
    }
  }, [agentId]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return { send, abort, streaming, streamText };
}

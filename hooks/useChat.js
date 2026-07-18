"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * useChat — drives the website chat widget.
 *
 * Handles:
 * - SSE streaming from /api/chat
 * - Message history from /api/chat/history
 * - Conversation persistence (reconnect after refresh)
 * - Tool call status toasts
 * - Abort on unmount
 */
export function useChat({ shopSlug, visitorId, enabled = true }) {
  const [messages,       setMessages]       = useState([]);
  const [streaming,      setStreaming]       = useState(false);
  const [toolStatus,     setToolStatus]      = useState(null); // { name, status }
  const [conversationId, setConversationId]  = useState(null);
  const [historyLoaded,  setHistoryLoaded]   = useState(false);
  const [connected,      setConnected]       = useState(false);
  const abortRef = useRef(null);

  // Load history on mount / when visitorId is ready
  useEffect(() => {
    if (!shopSlug || !visitorId || !enabled) return;

    fetch(`/api/chat/history?shopSlug=${encodeURIComponent(shopSlug)}&visitorId=${encodeURIComponent(visitorId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        if (data.conversationId) setConversationId(data.conversationId);
        if (data.messages?.length) {
          setMessages(data.messages.map(m => ({
            id:        m.id,
            role:      m.senderType === "USER" ? "user" : "assistant",
            content:   m.content,
            createdAt: m.createdAt,
          })));
        }
        setConnected(true);
      })
      .catch(() => { setConnected(true); }) // fail open
      .finally(() => setHistoryLoaded(true));
  }, [shopSlug, visitorId, enabled]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || streaming || !visitorId) return;

    // Optimistic UI: add user message immediately
    const userMsg = { id: `local_${Date.now()}`, role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);
    setToolStatus(null);

    // Placeholder for streaming assistant reply
    const assistantMsgId = `stream_${Date.now()}`;
    setMessages(prev => [...prev, { id: assistantMsgId, role: "assistant", content: "", createdAt: new Date().toISOString(), streaming: true }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ shopSlug, visitorId, message: text, conversationId }),
        signal:  abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Bağlantı hatası");
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let event;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          if (event.type === "delta") {
            setMessages(prev => prev.map(m =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + event.text }
                : m,
            ));
          } else if (event.type === "tool") {
            setToolStatus({ name: event.name, status: event.status });
            if (event.status === "done") {
              setTimeout(() => setToolStatus(null), 1500);
            }
          } else if (event.type === "done") {
            if (event.conversationId) setConversationId(event.conversationId);
            setMessages(prev => prev.map(m =>
              m.id === assistantMsgId ? { ...m, streaming: false } : m,
            ));
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId
          ? { ...m, content: `Hata: ${err.message}`, streaming: false, error: true }
          : m,
      ));
    } finally {
      setStreaming(false);
      setToolStatus(null);
    }
  }, [shopSlug, visitorId, conversationId, streaming]);

  function abort() {
    abortRef.current?.abort();
    setStreaming(false);
    setToolStatus(null);
  }

  function clearHistory() {
    abortRef.current?.abort();
    if (shopSlug && visitorId) {
      fetch(`/api/chat/history?shopSlug=${encodeURIComponent(shopSlug)}&visitorId=${encodeURIComponent(visitorId)}`, { method: "DELETE" }).catch(() => {});
    }
    setMessages([]);
    setConversationId(null);
    setStreaming(false);
    setToolStatus(null);
    setHistoryLoaded(true);
  }

  return {
    messages,
    streaming,
    toolStatus,
    conversationId,
    historyLoaded,
    connected,
    sendMessage,
    abort,
    clearHistory,
  };
}

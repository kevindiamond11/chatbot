import { useEffect, useMemo, useRef, useState } from "react";


const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8000").replace(/\/+$/, "");

function Message({ role, text, sources, notes }) {
  return (
    <div className={`message ${role}`}>
      <div className="bubble">
        <p>{text}</p>
        {notes && <div className="note">{notes}</div>}
        {sources && sources.length > 0 && (
          <div className="sources">
            <span>Sources:</span>
            {sources.map((s, idx) => (
              <a key={idx} href={s.url} target="_blank" rel="noreferrer">
                {s.title || s.url}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! Ask me about the ISSA Charter.", sources: [] },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages]);

  const trimmed = useMemo(() => input.trim(), [input]);

  async function sendMessage() {
    if (!trimmed || loading) return;
    const userMsg = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      const botMsg = {
        role: "bot",
        text: data.answer,
        sources: data.sources || [],
        notes: data.notes || "",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Sorry, I could not reach the server." },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="app">
      <header>
        <div className="title">ISSA Charter Chat</div>
        
      </header>

      <div className="chat" ref={scrollerRef}>
        {messages.map((m, idx) => (
          <Message
            key={idx}
            role={m.role}
            text={m.text}
            sources={m.sources}
            notes={m.notes}
          />
        ))}
        {loading && (
          <div className="message bot">
            <div className="bubble typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <div className="input-row">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about admissions, calendars, staff, policies..."
        />
        <button onClick={sendMessage} disabled={!trimmed || loading}>
          Send
        </button>
      </div>
    </div>
  );
}

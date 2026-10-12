import { useState, useRef, useEffect } from 'react';

const API = 'https://ai.taicalc.com/api/ai';
const ORIGIN = 'https://cooklabai.com';
const SEEN_KEY = 'cooklab-xiaoyan-seen';
const QUICK_ASKS = ['推薦可愛的顏文字', 'IG 貼文要怎麼排版？', '哪裡可以找特殊符號？', '暱稱怎麼取比較好？'];

interface Msg { role: 'user' | 'assistant'; content: string }

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [seen, setSeen] = useState(true);
  const [kbOffset, setKbOffset] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: '嗨，我是小研 ✨\n顏文字、排版、特殊符號、寫作問題，或這個網站的工具怎麼用，都可以直接問我。' },
  ]);
  const msgBoxRef = useRef<HTMLDivElement>(null);
  const lastUserMsg = useRef('');

  // 首次造訪：2.5 秒後顯示提示泡泡，按鈕帶呼吸動畫＋紅點
  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) {
        setSeen(false);
        const t1 = setTimeout(() => setShowHint(true), 2500);
        return () => clearTimeout(t1);
      }
    } catch { /* localStorage 不可用時忽略 */ }
  }, []);

  // iOS 鍵盤彈起時把整個懸浮組件往上推，避免遮住輸入框
  useEffect(() => {
    if (!open) { setKbOffset(0); return; }
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const diff = window.innerHeight - vv.height;
      setKbOffset(diff > 120 ? diff : 0);
    };
    vv.addEventListener('resize', onResize);
    onResize();
    return () => vv.removeEventListener('resize', onResize);
  }, [open ]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (msgBoxRef.current) msgBoxRef.current.scrollTop = msgBoxRef.current.scrollHeight;
    });
  }, [messages, loading, open ]);

  const openChat = () => {
    setOpen(true);
    setShowHint(false);
    setSeen(true);
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
  };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    lastUserMsg.current = msg;
    const next: Msg[] = [...messages, { role: 'user', content: msg }];
    setMessages(next);
    setInput('');
    setError('');
    setLoading(true);
    try {
      const history = next.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
        body: JSON.stringify({ task: 'chat-cooklab', payload: { messages: history } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text || '抱歉，我現在有點忙，請稍後再試。' }]);
    } catch {
      setError('連線有點不穩，稍後再試一次。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', right: 16, zIndex: 9999,
        bottom: 16 + kbOffset,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12,
        transition: 'bottom .2s ease',
      }}
    >
      <style>{`
        @keyframes xiaoyan-breathe {
          0%, 100% { box-shadow: 0 8px 24px rgba(110,86,207,.35); transform: scale(1); }
          50% { box-shadow: 0 8px 34px rgba(110,86,207,.6); transform: scale(1.07); }
        }
        .xiaoyan-fab-pulse { animation: xiaoyan-breathe 2.4s ease-in-out infinite; }
      `}</style>

      {open && (
        <div
          role="dialog"
          aria-label="小研 AI 助手"
          style={{
            width: 'min(380px, calc(100vw - 32px))', height: 'min(540px, 62dvh)',
            background: '#fff', border: '1px solid #e5e0f5', borderRadius: 16,
            boxShadow: '0 20px 50px rgba(76,54,153,.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 10px 16px', background: '#6e56cf', color: '#fff', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }} aria-hidden="true">✨</span>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>小研 AI 助手</p>
                <p style={{ margin: 0, fontSize: 11, opacity: .8, lineHeight: 1.3 }}>顏文字・排版・符號・寫作問題都可以問</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="關閉對話"
              style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', minWidth: 44, minHeight: 44, borderRadius: 8, fontSize: 16 }}>✕</button>
          </div>

          <div ref={msgBoxRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10, background: '#faf9fe' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '8px 12px', borderRadius: 16, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
                  background: m.role === 'user' ? '#6e56cf' : '#fff',
                  color: m.role === 'user' ? '#fff' : '#333',
                  borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                  borderBottomLeftRadius: m.role === 'user' ? 16 : 4,
                  border: m.role === 'user' ? 'none' : '1px solid #e5e0f5',
                }}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: '#fff', border: '1px solid #e5e0f5', borderRadius: 16, padding: '10px 16px', fontSize: 14, color: '#9d8bf0' }}>輸入中…</div>
              </div>
            )}
            {error && (
              <div style={{ fontSize: 12, color: '#d33' }}>
                {error} <button onClick={() => send(lastUserMsg.current)} style={{ color: '#6e56cf', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer', fontSize: 12, padding: 8 }}>重試</button>
              </div>
            )}
          </div>

          {messages.length <= 1 && !loading && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px 2px', overflowX: 'auto', background: '#faf9fe', flexShrink: 0 }}>
              {QUICK_ASKS.map((q) => (
                <button key={q} onClick={() => send(q)}
                  style={{ flexShrink: 0, minHeight: 44, fontSize: 14, padding: '10px 14px', borderRadius: 999, border: '1px solid #d9cff5', color: '#6e56cf', background: '#fff', cursor: 'pointer' }}>{q}</button>
              ))}
            </div>
          )}

          <div style={{ padding: 12, borderTop: '1px solid #e5e0f5', background: '#fff', flexShrink: 0, paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                maxLength={500}
                placeholder="輸入你的問題…"
                aria-label="輸入問題"
                enterKeyHint="send"
                autoComplete="off"
                style={{ flex: 1, minWidth: 0, border: '1px solid #e5e0f5', borderRadius: 12, padding: '10px 12px', fontSize: 16, outline: 'none', color: '#333' }}
              />
              <button onClick={() => send()} disabled={loading || !input.trim()} aria-label="送出"
                style={{
                  width: 48, height: 48, borderRadius: 12, border: 0, cursor: 'pointer',
                  background: loading || !input.trim() ? '#d9cff5' : '#6e56cf', color: '#fff', fontSize: 18, flexShrink: 0,
                }}>➤</button>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 10, color: '#aaa', textAlign: 'center' }}>AI 回答僅供參考，重要決策請再查證</p>
          </div>
        </div>
      )}

      {!open && showHint && (
        <button onClick={openChat}
          style={{ background: '#fff', border: '1px solid #e5e0f5', boxShadow: '0 8px 24px rgba(76,54,153,.15)', borderRadius: '16px 16px 4px 16px', padding: '10px 14px', fontSize: 14, color: '#333', cursor: 'pointer', maxWidth: 230, textAlign: 'left', minHeight: 44 }}>
          👋 有問題嗎？問小研 ✨
        </button>
      )}

      <button
        id="xiaoyan-fab"
        onClick={() => (open ? setOpen(false) : openChat())}
        aria-label={open ? '關閉小研 AI 助手' : '開啟小研 AI 助手'}
        aria-expanded={open}
        className={!seen && !open ? 'xiaoyan-fab-pulse' : ''}
        style={{
          position: 'relative',
          width: 60, height: 60, borderRadius: '50%', border: 0, cursor: 'pointer',
          background: '#6e56cf', color: '#fff', fontSize: 26,
          boxShadow: '0 8px 24px rgba(110,86,207,.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        <span aria-hidden="true">{open ? '✕' : '✨'}</span>
        {!seen && !open && (
          <span aria-hidden="true" style={{
            position: 'absolute', top: 2, right: 2, width: 14, height: 14,
            borderRadius: '50%', background: '#ff3b30', border: '2px solid #fff',
          }} />
        )}
      </button>
    </div>
  );
}

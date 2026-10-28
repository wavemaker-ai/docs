import { useState, useRef, useCallback, useEffect } from 'react';
import { useAIChat } from './useAIChat';
import AIConversation from './AIConversation';
import SourceCards from './SourceCards';
import styles from './AskAIDialog.module.css';

const FALLBACK_SUGGESTIONS = [
  'Binding Rest API',
  'File Upload Components',
  'Apply DS From Marketplace',
  'Setup CORS',
];

function getPageContext() {
  if (typeof document === 'undefined') {
    return {
      pageTitle: '',
      pageSlug: '',
      pageCategory: '',
      pageHeadings: [],
      pageSummary: '',
    };
  }
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  const article =
    document.querySelector('article') || document.querySelector('.markdown');
  const headings = [];
  if (article) {
    article.querySelectorAll('h2, h3').forEach((h) => {
      const text = h.textContent?.trim();
      if (text) headings.push(text);
    });
  }
  let pageSummary = '';
  if (article) {
    const parts = [];
    article
      .querySelectorAll('p')
      .forEach((p) => parts.push(p.textContent?.trim() || ''));
    pageSummary = parts.join(' ');
  }
  return {
    pageTitle:
      document.URL.match(/\/docs\/(.+)/)?.[1]
        ?.split('/')
        .map((p) =>
          p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        )
        .join(' > ') || '',
    pageSlug: path,
    pageCategory: segments[0] || '',
    pageHeadings: headings.slice(0, 15),
    pageSummary,
  };
}

function useDynamicSuggestions(apiUrl, pageContext) {
  const [suggestions, setSuggestions] = useState(null);

  useEffect(() => {
    if (!apiUrl) return;
    let cancelled = false;

    fetch(`${apiUrl}/api/v1/chat/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: pageContext
          ? {
              pageTitle: pageContext.pageTitle || '',
              pageSlug: pageContext.pageSlug || '',
              pageCategory: pageContext.pageCategory || '',
              pageSummary: pageContext.pageSummary || '',
              pageHeadings: pageContext.pageHeadings || [],
            }
          : null,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch suggestions');
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data.suggestions?.length) {
          setSuggestions(data.suggestions);
        }
      })
      .catch(() => {
        // Silently fall back to static suggestions
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, pageContext?.pageSlug]);

  return (suggestions || FALLBACK_SUGGESTIONS).slice(0, 3);
}

export default function AskAIDialog({ apiUrl, onClose, initialQuery = '' }) {
  const pageContext = getPageContext();
  const chat = useAIChat(pageContext, apiUrl);
  const suggestions = useDynamicSuggestions(apiUrl, pageContext);
  const [input, setInput] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef(null);
  const overlayRef = useRef(null);

  const hasMessages = chat.messages.length > 0 || chat.isStreaming;

  // Auto-send initialQuery (e.g. from DocSearch "Ask AI" suggestion)
  useEffect(() => {
    if (initialQuery) {
      chat.sendMessage(initialQuery);
    }
  }, []); // intentionally runs once on mount

  // Trigger fade-out then call onClose
  const handleClose = useCallback(() => {
    setIsClosing(true);
  }, []);

  const handleAnimationEnd = useCallback(() => {
    if (isClosing) onClose();
  }, [isClosing, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Focus textarea on open (skip if we have an initialQuery — chat takes focus)
  useEffect(() => {
    if (!initialQuery) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || chat.isStreaming) return;
      chat.sendMessage(text);
      setInput('');
    },
    [input, chat],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleSuggestion = useCallback(
    (text) => chat.sendMessage(text),
    [chat],
  );

  const handleFollowup = useCallback((text) => chat.sendMessage(text), [chat]);

  const handleAction = useCallback((url) => {
    window.open(url, '_blank', 'noopener');
  }, []);

  // Source cards navigation
  const assistantMessages = chat.messages.filter((m) => m.role === 'assistant');

  let activeCards = [];
  let activeQuestion = '';

  if (chat.activeMessageId === '__streaming__') {
    activeCards = chat.currentSourceCards;
    const lastUser = [...chat.messages]
      .reverse()
      .find((m) => m.role === 'user');
    activeQuestion = lastUser?.content || '';
  } else if (chat.activeMessageId) {
    const activeMsg = assistantMessages.find(
      (m) => m.id === chat.activeMessageId,
    );
    if (activeMsg) {
      activeCards = activeMsg.sourceCards || [];
      const msgIdx = chat.messages.findIndex(
        (m) => m.id === chat.activeMessageId,
      );
      for (let i = msgIdx - 1; i >= 0; i--) {
        if (chat.messages[i].role === 'user') {
          activeQuestion = chat.messages[i].content;
          break;
        }
      }
    }
  }

  return (
    <div
      ref={overlayRef}
      className={`${styles.overlay}${isClosing ? ` ${styles.closing}` : ''}`}
      onAnimationEnd={handleAnimationEnd}
    >
      {/* Background image layer */}
      <div className={styles.bg} />
      <div className={styles.body}>
        {!hasMessages ? (
          <div className={styles.landing}>
            <button
              className={styles.landingCloseBtn}
              onClick={handleClose}
              aria-label="Close"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className={styles.landingHero}>
              <div>
                <img src="/img/icon/AskAI-Icon.svg" alt="Ask AI" />
              </div>
              <h2 className={styles.title}>How can I help you?</h2>
              <p className={styles.subtitle}>
                I can help you in understanding the WaveMaker Docs
              </p>
            </div>

            <form className={styles.inputContainer} onSubmit={handleSubmit}>
              <textarea
                ref={inputRef}
                className={styles.textarea}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about WaveMaker..."
                rows={3}
                disabled={chat.isStreaming}
              />
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={!input.trim() || chat.isStreaming}
                aria-label="Send"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>

            <div className={styles.chips}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  className={styles.chip}
                  onClick={() => handleSuggestion(s)}
                  type="button"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.chatLayout}>
            <div className={styles.conversationCol}>
              <div className={styles.header}>
                <div className={styles.brand}>
                  <img
                    src="/img/wm-logo.svg"
                    alt="WaveMaker"
                    className={styles.brandLogo}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <span className={styles.brandName}>WaveMaker Docs</span>
                </div>
                <button
                  className={styles.closeBtn}
                  onClick={handleClose}
                  aria-label="Close"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <AIConversation
                messages={chat.messages}
                isStreaming={chat.isStreaming}
                currentFragments={chat.currentFragments}
                currentTraceSteps={chat.currentTraceSteps}
                activeMessageId={chat.activeMessageId}
                onSelectMessage={chat.setActiveMessageId}
                onFollowup={handleFollowup}
                onAction={handleAction}
                onFeedback={chat.submitFeedback}
              />
              <div className={styles.chatInputArea}>
                <div className={styles.chatInputWrapper}>
                  <textarea
                    ref={inputRef}
                    className={styles.chatInputField}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a follow-up..."
                    disabled={chat.isStreaming}
                    rows={1}
                    autoComplete="off"
                  />
                  {chat.isStreaming ? (
                    <button
                      type="button"
                      className={styles.chatStopBtn}
                      onClick={chat.cancelStream}
                      aria-label="Stop generation"
                      title="Stop generation"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="currentColor"
                      >
                        <rect x="1" y="1" width="10" height="10" rx="2" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      className={styles.chatSendBtn}
                      onClick={handleSubmit}
                      disabled={!input.trim()}
                      type="button"
                      aria-label="Send"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.chatClearBtn}
                    onClick={() => {
                      chat.clearHistory();
                      setInput('');
                    }}
                    title="New session"
                    aria-label="New session"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                </div>
                <p className={styles.chatInputHint}>
                  Enter to send · Shift+Enter for new line
                </p>
              </div>
            </div>
            <SourceCards
              cards={activeCards}
              activeQuestion={activeQuestion}
              isLoading={chat.isStreaming && activeCards.length === 0}
            />
          </div>
        )}
      </div>
    </div>
  );
}

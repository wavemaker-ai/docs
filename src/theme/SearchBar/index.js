/**
 * Custom SearchBar that extends the default Algolia DocSearch
 * Adds an "Ask AI" option within the search results
 */
import { useCallback, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DocSearchButton } from '@docsearch/react/button';
import { useDocSearchKeyboardEvents } from '@docsearch/react/useDocSearchKeyboardEvents';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import { useHistory } from '@docusaurus/router';
import {
  isRegexpStringMatch,
  useSearchLinkCreator,
} from '@docusaurus/theme-common';
import {
  useAlgoliaContextualFacetFilters,
  useSearchResultUrlProcessor,
  mergeFacetFilters,
} from '@docusaurus/theme-search-algolia/client';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import translations from '@theme/SearchTranslations';

import AskAIDialog from './AskAIDialog';

// Default API URL for ecosystem agent
// const DEFAULT_API_URL = 'http://localhost:8000';
const DEFAULT_API_URL = 'http://54.147.142.76:8069';

// Global flag to prevent multiple DocSearch modals f `rom opening
let globalModalOpen = false;

let DocSearchModal = null;

function importDocSearchModalIfNeeded() {
  if (DocSearchModal) {
    return Promise.resolve();
  }
  return Promise.all([
    import('@docsearch/react/modal'),
    import('@docsearch/react/style'),
    import('./styles.css'),
  ]).then(([{ DocSearchModal: Modal }]) => {
    DocSearchModal = Modal;
  });
}

function useNavigator({ externalUrlRegex }) {
  const history = useHistory();
  const [navigator] = useState(() => ({
    navigate(params) {
      if (isRegexpStringMatch(externalUrlRegex, params.itemUrl)) {
        window.location.href = params.itemUrl;
      } else {
        history.push(params.itemUrl);
      }
    },
  }));
  return navigator;
}

function useTransformSearchClient() {
  const {
    siteMetadata: { docusaurusVersion },
  } = useDocusaurusContext();
  return useCallback(
    (searchClient) => {
      searchClient.addAlgoliaAgent('docusaurus', docusaurusVersion);
      return searchClient;
    },
    [docusaurusVersion],
  );
}

function useTransformItems(props) {
  const processSearchResultUrl = useSearchResultUrlProcessor();
  const [transformItems] = useState(
    () => (items) =>
      props.transformItems
        ? props.transformItems(items)
        : items.map((item) => ({
            ...item,
            url: processSearchResultUrl(item.url),
          })),
  );
  return transformItems;
}

function Hit({ hit, children }) {
  return <Link to={hit.url}>{children}</Link>;
}

function ResultsFooter({ state, onClose }) {
  const createSearchLink = useSearchLinkCreator();
  return (
    <Link to={createSearchLink(state.query)} onClick={onClose}>
      <Translate
        id="theme.SearchBar.seeAll"
        values={{ count: state.context.nbHits }}
      >
        {'See all {count} results'}
      </Translate>
    </Link>
  );
}

function useSearchParameters({ contextualSearch, ...props }) {
  const contextualSearchFacetFilters = useAlgoliaContextualFacetFilters();
  const configFacetFilters = props.searchParameters?.facetFilters ?? [];
  const facetFilters = contextualSearch
    ? mergeFacetFilters(contextualSearchFacetFilters, configFacetFilters)
    : configFacetFilters;
  return {
    ...props.searchParameters,
    facetFilters,
  };
}

/**
 * Fetches AI follow-up suggestions from the stream API based on query.
 * Aborts the stream as soon as the `followups` event is received.
 */
function useAISuggestions(query, apiUrl) {
  const [suggestions, setSuggestions] = useState([]);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    abortRef.current = null;

    if (!query || !query.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${apiUrl}/api/v1/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query.trim(),
            sessionId: 'suggestions-' + Date.now(),
          }),
          signal: controller.signal,
        });

        if (!res.ok) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            let event;
            try {
              event = JSON.parse(line);
            } catch {
              continue;
            }

            if (event.type === 'followups' && event.suggestions?.length) {
              setSuggestions(event.suggestions);
              controller.abort();
              return;
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') setSuggestions([]);
      }
    }, 600);

    return () => clearTimeout(debounceRef.current);
  }, [query, apiUrl]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      clearTimeout(debounceRef.current);
    },
    [],
  );

  return suggestions;
}

/**
 * Custom Modal Wrapper that adds Ask AI suggestion row
 */
function CustomDocSearchModal({ onClose, onAskAI, apiUrl, ...props }) {
  const [query, setQuery] = useState('');
  const queryRef = useRef(query);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  // Track query from DocSearch input
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const input = document.querySelector('.DocSearch-Input');
      if (input && input.value !== queryRef.current) {
        setQuery(input.value);
      }
    });

    const container = document.querySelector('.DocSearch-Container');
    if (container) {
      observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    const handleInput = (e) => {
      if (e.target.classList.contains('DocSearch-Input')) {
        setQuery(e.target.value);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && e.target.classList.contains('DocSearch-Input')) {
        e.preventDefault();
        e.stopPropagation();
        onAskAI(queryRef.current);
      }
    };

    document.addEventListener('input', handleInput);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      observer.disconnect();
      document.removeEventListener('input', handleInput);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onAskAI]);

  return (
    <>
      <DocSearchModal onClose={onClose} {...props} />
      <AskAISuggestionPortal query={query} onAskAI={onAskAI} apiUrl={apiUrl} />
    </>
  );
}

/**
 * Portal to inject "Ask AI [query]" suggestion row + vertical suggestions below the search input
 */
function AskAISuggestionPortal({ query, onAskAI, apiUrl }) {
  const suggestions = useAISuggestions(query, apiUrl);
  const [container, setContainer] = useState(null);

  useEffect(() => {
    const ensureContainer = () => {
      const form = document.querySelector('.DocSearch-Form');
      if (!form) return;

      let el = document.querySelector('.DocSearch-Tabs-Container');
      if (!el) {
        el = document.createElement('div');
        el.className = 'DocSearch-Tabs-Container';
        form.parentElement.appendChild(el);
      }
      setContainer(el);
    };

    const interval = setInterval(ensureContainer, 50);
    setTimeout(() => clearInterval(interval), 2000);
    return () => clearInterval(interval);
  }, []);

  if (!container) return null;

  return createPortal(
    <div className="DocSearch-AskAI-Panel">
      {/* Ask AI row */}
      <button
        className="DocSearch-AskAI-Suggestion"
        type="button"
        onClick={() => onAskAI(query)}
      >
        <span>
          <img src="/img/icon/ask-ai-chat-icon.svg" alt="" />
        </span>
        <span className="DocSearch-AskAI-Suggestion__label">Ask AI</span>
        {query && (
          <span className="DocSearch-AskAI-Suggestion__query">"{query}"</span>
        )}
      </button>

      {/* Vertical suggestion list */}

      <ul className="DocSearch-AskAI-SuggestionList">
        {suggestions.map((s) => (
          <li key={s}>
            <button
              type="button"
              className="DocSearch-AskAI-SuggestionItem"
              onClick={() => onAskAI(s)}
            >
              <svg
                className="DocSearch-AskAI-SuggestionItem__icon"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>{s}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>,
    container,
  );
}

function DocSearch({ externalUrlRegex, ...props }) {
  const { siteConfig } = useDocusaurusContext();
  const apiUrl = siteConfig?.customFields?.ecosystemAgentUrl || DEFAULT_API_URL;

  const navigator = useNavigator({ externalUrlRegex });
  const searchParameters = useSearchParameters({ ...props });
  const transformItems = useTransformItems(props);
  const transformSearchClient = useTransformSearchClient();
  const searchContainer = useRef(null);
  const searchButtonRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState(undefined);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiDialogQuery, setAiDialogQuery] = useState('');

  const prepareSearchContainer = useCallback(() => {
    if (!searchContainer.current) {
      const divElement = document.createElement('div');
      searchContainer.current = divElement;
      document.body.insertBefore(divElement, document.body.firstChild);
    }
  }, []);

  const openModal = useCallback(() => {
    // Prevent opening if another modal is already open (multiple SearchBar instances)
    if (globalModalOpen) return;
    globalModalOpen = true;
    prepareSearchContainer();
    importDocSearchModalIfNeeded().then(() => setIsOpen(true));
  }, [prepareSearchContainer]);

  const openAskAI = useCallback(() => {
    setAiDialogQuery('');
    setIsAIDialogOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    globalModalOpen = false;
    setIsOpen(false);
    searchButtonRef.current?.focus();
    setInitialQuery(undefined);
  }, []);

  // Called from inside DocSearch modal — close modal, open AI dialog with query
  const handleAskAIFromModal = useCallback(
    (query) => {
      closeModal();
      setAiDialogQuery(query || '');
      setIsAIDialogOpen(true);
    },
    [closeModal],
  );

  const closeAIDialog = useCallback(() => {
    setAiDialogQuery('');
    setIsAIDialogOpen(false);
  }, []);

  const handleInput = useCallback(
    (event) => {
      if (event.key === 'f' && (event.metaKey || event.ctrlKey)) {
        return;
      }
      event.preventDefault();
      setInitialQuery(event.key);
      openModal();
    },
    [openModal],
  );

  const resultsFooterComponent = useCallback(
    ({ state }) => <ResultsFooter state={state} onClose={closeModal} />,
    [closeModal],
  );

  useDocSearchKeyboardEvents({
    isOpen,
    onOpen: openModal,
    onClose: closeModal,
    onInput: handleInput,
    searchButtonRef,
  });

  return (
    <>
      <Head>
        <link
          rel="preconnect"
          href={`https://${props.appId}-dsn.algolia.net`}
          crossOrigin="anonymous"
        />
      </Head>

      <div className="search-bar-with-ai">
        <DocSearchButton
          onTouchStart={importDocSearchModalIfNeeded}
          onFocus={importDocSearchModalIfNeeded}
          onMouseOver={importDocSearchModalIfNeeded}
          onClick={openModal}
          ref={searchButtonRef}
          translations={props.translations?.button ?? translations.button}
        />
        <button
          className="ask-ai-pill-btn"
          onClick={openAskAI}
          onMouseOver={importDocSearchModalIfNeeded}
          type="button"
        >
          <img
            src="/img/icon/ask-ai-chat-icon.svg"
            alt="Ask AI"
            style={{ width: '16px', height: '16px' }}
          />
          Ask AI
        </button>
      </div>

      {isOpen &&
        DocSearchModal &&
        searchContainer.current &&
        createPortal(
          <CustomDocSearchModal
            onClose={closeModal}
            onAskAI={handleAskAIFromModal}
            apiUrl={apiUrl}
            initialScrollY={window.scrollY}
            initialQuery={initialQuery}
            navigator={navigator}
            transformItems={transformItems}
            hitComponent={Hit}
            transformSearchClient={transformSearchClient}
            {...(props.searchPagePath && { resultsFooterComponent })}
            {...props}
            translations={props.translations?.modal ?? translations.modal}
            searchParameters={searchParameters}
          />,
          searchContainer.current,
        )}

      {isAIDialogOpen &&
        createPortal(
          <AskAIDialog
            apiUrl={apiUrl}
            onClose={closeAIDialog}
            initialQuery={aiDialogQuery}
          />,
          document.body,
        )}
    </>
  );
}

export default function SearchBar(props) {
  const { siteConfig } = useDocusaurusContext();
  return <DocSearch {...siteConfig.themeConfig.algolia} {...props} />;
}

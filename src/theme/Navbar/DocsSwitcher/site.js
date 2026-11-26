import { useEffect, useState } from 'react';
import { ALL_VERSIONS } from './versions';

// Site-specific part of the docs switcher (this is the v12 / AI docs site).
// The classic docs site has its own copy of this file.
const CLASSIC_DOCS_URL = '/learn/';
// Nothing serves /learn on a local dev server, so point at the live classic docs instead.
const LOCAL_CLASSIC_DOCS_URL = 'https://docs.wavemaker.ai/learn/';
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

// The host is read after mount so the server-rendered HTML and the first client render stay identical.
function useClassicDocsUrl() {
  const [url, setUrl] = useState(CLASSIC_DOCS_URL);
  useEffect(() => {
    if (LOCAL_HOSTS.includes(window.location.hostname)) {
      setUrl(LOCAL_CLASSIC_DOCS_URL);
    }
  }, []);
  return url;
}

export function useDocsSite() {
  const classicUrl = useClassicDocsUrl();
  return {
    current: ALL_VERSIONS.find((version) => version.id === 'v12'),
    hrefs: {
      v11: classicUrl,
      v10: `${classicUrl}v10.15/documentation-reference`,
    },
  };
}

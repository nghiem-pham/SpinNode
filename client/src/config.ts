const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

const isAbsoluteUrl = (value: string) => /^[a-z][a-z\d+\-.]*:\/\//i.test(value);

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const rawWebSocketBaseUrl = import.meta.env.VITE_WS_BASE_URL?.trim();

const apiBaseUrl = rawApiBaseUrl ? trimTrailingSlash(rawApiBaseUrl) : '';

function deriveWebSocketBaseUrl() {
  if (rawWebSocketBaseUrl) {
    const value = trimTrailingSlash(rawWebSocketBaseUrl);
    if (isAbsoluteUrl(value) || typeof window === 'undefined') {
      return value;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${value.startsWith('/') ? value : `/${value}`}`;
  }

  if (apiBaseUrl) {
    if (isAbsoluteUrl(apiBaseUrl)) {
      const url = new URL(apiBaseUrl);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return trimTrailingSlash(url.toString());
    }

    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}${apiBaseUrl.startsWith('/') ? apiBaseUrl : `/${apiBaseUrl}`}`;
    }
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}://${window.location.host}`;
  }

  return '';
}

const webSocketBaseUrl = deriveWebSocketBaseUrl();

export function buildApiUrl(path: string) {
  return apiBaseUrl ? `${apiBaseUrl}${normalizePath(path)}` : normalizePath(path);
}

export function buildWebSocketUrl(path: string) {
  return `${webSocketBaseUrl}${normalizePath(path)}`;
}

export function buildGoogleOAuthUrl() {
  return buildApiUrl('/oauth2/authorization/google');
}

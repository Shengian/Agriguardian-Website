function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/** Base URL of the marketing website host. */
export function getWebsiteUrl(): string {
  const envUrl = import.meta.env.VITE_WEBSITE_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const { protocol, hostname, port } = window.location;

  // Platform dev server also serves the marketing site via Vite middleware.
  if (isLocalHost(hostname) && (port === '5173' || port === '5174')) {
    return window.location.origin;
  }

  // Unified API + website + platform host.
  if (port === '3001' || port === '') {
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }

  return window.location.origin;
}

/** Homepage of the marketing site — always use /index.html to avoid SPA route conflicts. */
export function getWebsiteHomeUrl(): string {
  return `${getWebsiteUrl().replace(/\/$/, '')}/index.html`;
}

/** Force a full navigation to the marketing site (bypasses React Router link interception). */
export function navigateToWebsiteHome(event?: { preventDefault?: () => void }) {
  event?.preventDefault?.();
  window.location.assign(getWebsiteHomeUrl());
}

/** Platform app base URL (for links from the static marketing site). */
export function getPlatformUrl(): string {
  const envUrl = import.meta.env.VITE_PLATFORM_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const { protocol, hostname, port } = window.location;
  if (port === '8080') return `${protocol}//${hostname}:5173`;
  if (port === '3001' || port === '' || port === '5173') {
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }
  return window.location.origin;
}

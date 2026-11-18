export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        // Check for updated service worker silently on load
        registration.update().catch(() => {});
      })
      .catch(() => {
        // Ignore registration errors on unsupported or restricted contexts
      });
  });
}

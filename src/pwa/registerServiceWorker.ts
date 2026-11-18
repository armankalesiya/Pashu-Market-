export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${base}service-worker.js`, { scope: base })
      .then((registration) => {
        registration.update().catch(() => {});
      })
      .catch(() => {
        // Ignore registration errors on unsupported or restricted contexts
      });
  });
}

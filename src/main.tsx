import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Automatically register and auto-update Service Worker whenever a new version is published
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // When Vite detects a new build, activate new service worker and refresh
    console.log('[TurnoExtra] Nova versão do app detectada! Atualizando automaticamente...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[TurnoExtra] Aplicativo pronto para uso offline');
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      // Periodically check for updates (every 20 seconds)
      setInterval(async () => {
        if ('onLine' in navigator && !navigator.onLine) return;
        try {
          await registration.update();
        } catch {
          // Ignore transient network errors
        }
      }, 20 * 1000);

      // Check for updates when user returns to the tab or app
      window.addEventListener('focus', () => {
        registration.update().catch(() => {});
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      });
    }
  },
});

// Auto-reload the page when new service worker takes over
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  let hasRefreshed = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hasRefreshed) {
      hasRefreshed = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);

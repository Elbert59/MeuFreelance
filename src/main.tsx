import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker safely for PWA
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL || '/'}sw.js`;
    navigator.serviceWorker.register(swUrl).catch(() => {
      // Ignore if offline or running in environment without sw.js
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);


import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const basePath = document.querySelector('base')?.href || window.location.origin;
    const swPath = new URL('sw.js', basePath).href;
    console.log('Registering SW at:', swPath);

    navigator.serviceWorker.register(swPath)
      .then((registration) => {
        console.log('SW registered successfully:', registration);

        // Checar atualizações periodicamente
        setInterval(() => {
          registration.update();
        }, 60000);

        // Apenas no modo PWA exibimos a barra
        const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
          (window as any).navigator?.standalone === true;

        // Cria a barra de atualização (sem Tailwind; usa tokens do design system)
        const buildBanner = (onUpdate: () => void) => {
          const bar = document.createElement('div');
          bar.setAttribute('data-pwa-update-banner', '');
          bar.style.position = 'fixed';
          bar.style.top = '0';
          bar.style.left = '0';
          bar.style.right = '0';
          bar.style.zIndex = '9999';
          bar.style.background = 'hsl(var(--primary))'; // laranja do tema
          bar.style.boxShadow = '0 6px 12px hsl(var(--primary) / 0.25)';
          bar.style.padding = '10px 16px';

          const container = document.createElement('div');
          container.style.maxWidth = '1100px';
          container.style.margin = '0 auto';
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.justifyContent = 'space-between';
          container.style.gap = '12px';

          const text = document.createElement('p');
          text.textContent = 'Nova atualização disponível!';
          text.style.color = 'hsl(0 0% 100%)'; // branco visível
          text.style.fontWeight = '600';
          text.style.fontSize = '14px';
          text.style.margin = '0';

          const btn = document.createElement('button');
          btn.textContent = 'Atualizar';
          btn.style.background = 'hsl(0 0% 100%)'; // branco
          btn.style.color = 'hsl(var(--primary))';
          btn.style.border = 'none';
          btn.style.borderRadius = '8px';
          btn.style.fontWeight = '700';
          btn.style.padding = '8px 12px';
          btn.style.cursor = 'pointer';
          btn.addEventListener('click', onUpdate);

          container.appendChild(text);
          container.appendChild(btn);
          bar.appendChild(container);
          return bar as HTMLDivElement;
        };

        let bannerEl: HTMLDivElement | null = null;
        const showBanner = () => {
          if (!isPWA) return;
          if (bannerEl || document.querySelector('[data-pwa-update-banner]')) return;
          bannerEl = buildBanner(() => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          });
          document.body.appendChild(bannerEl);
        };

        if (isPWA) {
          // Exibe se já houver SW esperando
          if (registration.waiting) {
            showBanner();
          }

          // Ouve por novas instalações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  showBanner();
                }
              });
            }
          });

          // Quando o novo SW assumir, recarrega
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });
        }
      })
      .catch((registrationError) => {
        console.log('SW registration failed:', registrationError);
      });
  });
}

console.log("main.tsx loaded");

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

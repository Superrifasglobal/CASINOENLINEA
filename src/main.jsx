import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/web3'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient()

// Visual Error Reporter for "Black Screen" debugging
const reportError = (msg) => {
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.top = '0';
  div.style.left = '0';
  div.style.width = '100vw';
  div.style.background = 'red';
  div.style.color = 'white';
  div.style.padding = '20px';
  div.style.zIndex = '999999';
  div.style.fontFamily = 'monospace';
  div.innerText = "CRITICAL ERROR: " + msg;
  document.body.appendChild(div);
}

window.onerror = (message) => reportError(message);
window.onunhandledrejection = (event) => reportError("Uncaught Promise: " + event.reason);

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    reportError("No se encontró el elemento #root en el HTML");
  } else {
    createRoot(rootElement).render(
      <StrictMode>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </WagmiProvider>
      </StrictMode>
    );
  }
} catch (e) {
  reportError(e.message);
}

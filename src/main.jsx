import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/web3'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient()

// Global Error Handler
window.onerror = (message, source, lineno, colno, error) => {
  console.error("CRITICAL ERROR:", message, "at", source, lineno, colno);
  if (!source?.includes('contentScript')) {
    alert("Error crítico detectado: " + message);
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)

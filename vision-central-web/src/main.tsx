import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import Player from './components/Player.tsx';
import './index.css';
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx';

// Safe error listeners for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global window error:', event.message, event.filename, event.lineno, event.colno, event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Global unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/player" element={<Player />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
);

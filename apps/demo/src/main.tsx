import { RUMProvider } from '@rum-omo/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RUMProvider config={{ debug: true }}>
      <App />
    </RUMProvider>
  </React.StrictMode>,
);

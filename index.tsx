
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import TvModeSelectScreen from './TvModeSelectScreen.tsx';
import { hasTvMode } from './config/tvMode.ts';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      {hasTvMode ? <App /> : <TvModeSelectScreen />}
    </React.StrictMode>
  );
}

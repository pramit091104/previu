/// <reference types="vite/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import axios from 'axios';
import App from './App.tsx';
import './index.css';

// In production (Vercel), VITE_API_URL points to the Render backend.
// In development, it's empty and Vite's proxy handles /api/* calls.
if (process.env.VITE_API_URL) {
  axios.defaults.baseURL = process.env.VITE_API_URL;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

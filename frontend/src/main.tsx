import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Dashboard } from './components/pages/Dashboard';

const root = document.getElementById('root');
if (!root) throw new Error('No #root element');

createRoot(root).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/noto-sans-sc';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './styles.css';
import App from './App';
import { TooltipHost } from './components/Tooltip';

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ReactFlowProvider><App /></ReactFlowProvider><TooltipHost /></React.StrictMode>);

import "./config/amplifyClient"
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

if (typeof window !== 'undefined') {
  ;(window as any).LOG_LEVEL = 'DEBUG'
  try {
    window.localStorage.setItem('aws-amplify-logging', 'DEBUG')
  } catch {
    /* ignore storage errors (private mode, etc.) */
  }
}

createRoot(document.getElementById("root")!).render(<App />);

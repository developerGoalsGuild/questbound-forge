import './config/amplifyClient'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Configure AWS Amplify before any client usage

createRoot(document.getElementById("root")!).render(<App />);

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/public-sans'
import '@fontsource-variable/bricolage-grotesque'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { StoreProvider } from './state/store'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)

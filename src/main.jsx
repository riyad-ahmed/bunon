import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Fonts are bundled with the site (no requests to Google at runtime).
// Latin only: other scripts (e.g. Bangla) use the visitor's system fonts.
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-500-italic.css'
import '@fontsource-variable/manrope'

import '@/styles/tokens.css'
import '@/styles/global.css'
import App from '@/App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

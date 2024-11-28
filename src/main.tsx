import React from 'react'

import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/electron/renderer'
import { toast } from 'react-toastify'

import App from './App'
import './styles/global.css'
import './styles/editor.css'
import errorToStringRendererProcess from './lib/error'
import { ThemeProvider } from '@/contexts/ThemeContext'

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    integrations: [],
  })
}

window.addEventListener('error', (event) => {
  event.preventDefault()
  toast.error(errorToStringRendererProcess(event.error))
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(event.error)
  }
})

window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault()
  toast.error(errorToStringRendererProcess(event.reason))
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(event.reason)
  }
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)

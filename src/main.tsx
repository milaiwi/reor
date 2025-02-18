import ReactDOM from 'react-dom/client'
// import * as Sentry from '@sentry/electron/renderer'
import * as Sentry from '@sentry/react'
import { toast } from 'react-toastify'

import App from './App'
import './styles/global.css'
import errorToStringRendererProcess from './lib/error'

if (process.env.NODE_ENV === 'production') {
  console.log(`setting up sentry `)
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

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />)

import { BrowserRouter } from 'react-router-dom'
import App from './App'

export default function AppProviders() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

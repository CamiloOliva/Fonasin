import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ScrollToTop from '../components/router/ScrollToTop'

export default function AppProviders() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <App />
    </BrowserRouter>
  )
}

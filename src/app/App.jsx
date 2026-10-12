import { RouterProvider } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary'
import Providers from './providers'
import router from './router'

export default function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ErrorBoundary>
  )
}

import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Dashboard from '../features/dashboard/Dashboard'
import CreateTest from '../features/pdf-import/CreateTest'
import TestBuilder from '../features/test-builder/TestBuilder'
import TestInstructions from '../features/test-runner/TestInstructions'
import TestRunner from '../features/test-runner/TestRunner'
import TestResults from '../features/results/TestResults'
import History from '../features/history/History'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'create', element: <CreateTest /> },
      { path: 'builder/:testId', element: <TestBuilder /> },
      { path: 'test/:testId/instructions', element: <TestInstructions /> },
      { path: 'test/:testId/attempt/:attemptId', element: <TestRunner /> },
      { path: 'results/:attemptId', element: <TestResults /> },
      { path: 'history', element: <History /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default router

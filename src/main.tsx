import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { ContentStudioPage } from '@/pages/ContentStudioPage'
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/content",
    element: <ContentStudioPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/leads",
    element: <div className="p-20 text-center">Leads CRM (Coming in Phase 2)</div>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/campaigns",
    element: <div className="p-20 text-center">Campaigns (Coming in Phase 4)</div>,
    errorElement: <RouteErrorBoundary />,
  }
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
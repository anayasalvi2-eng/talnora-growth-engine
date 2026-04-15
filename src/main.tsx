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
import { LeadsPage } from '@/pages/LeadsPage'
import { ResumeScorerPage } from '@/pages/ResumeScorerPage'
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
    element: <LeadsPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/score",
    element: <ResumeScorerPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/campaigns",
    element: <div className="p-20 text-center text-muted-foreground">Campaigns & Outreach sequences coming soon.</div>,
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
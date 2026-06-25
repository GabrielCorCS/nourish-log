import { lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth'
import { AppShell } from '@/components/layout'
// Public routes load eagerly (needed for the first paint / auth handoff).
import { Login, AuthCallback } from '@/pages'

// Protected pages are code-split so the initial bundle stays small — heavy deps
// (charts, the barcode scanner) only download when their page is opened. The
// Suspense boundary lives inside AppShell, so the nav/shell stays visible.
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Journal = lazy(() => import('@/pages/Journal').then((m) => ({ default: m.Journal })))
const Schedule = lazy(() => import('@/pages/Schedule').then((m) => ({ default: m.Schedule })))
const Recipes = lazy(() => import('@/pages/Recipes').then((m) => ({ default: m.Recipes })))
const RecipeDetail = lazy(() => import('@/pages/RecipeDetail').then((m) => ({ default: m.RecipeDetail })))
const RecipeEditor = lazy(() => import('@/pages/RecipeEditor').then((m) => ({ default: m.RecipeEditor })))
const Pantry = lazy(() => import('@/pages/Pantry').then((m) => ({ default: m.Pantry })))
const Progress = lazy(() => import('@/pages/Progress').then((m) => ({ default: m.Progress })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))
const Inventory = lazy(() => import('@/pages/Inventory').then((m) => ({ default: m.Inventory })))
const ShoppingList = lazy(() => import('@/pages/ShoppingList').then((m) => ({ default: m.ShoppingList })))
const Inspo = lazy(() => import('@/pages/Inspo').then((m) => ({ default: m.Inspo })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Dashboard />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/journal"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Journal />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedule"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Schedule />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipes"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Recipes />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipes/new"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <RecipeEditor />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipes/:id"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <RecipeDetail />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipes/:id/edit"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <RecipeEditor />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspo"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Inspo />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pantry"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Pantry />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Inventory />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/shopping"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ShoppingList />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Progress />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Settings />
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App

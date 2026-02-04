import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth'
import { AppShell } from '@/components/layout'
import {
  Dashboard,
  Journal,
  Recipes,
  RecipeDetail,
  RecipeEditor,
  Pantry,
  Progress,
  Settings,
  Login,
  AuthCallback,
  Invitations,
  Inventory,
  ShoppingList,
} from '@/pages'

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
            <Route
              path="/invitations"
              element={
                <ProtectedRoute requireAdmin>
                  <AppShell>
                    <Invitations />
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

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout'
import { UserProvider } from '@/components/shared/UserProvider'
import {
  Dashboard,
  Journal,
  Recipes,
  RecipeDetail,
  RecipeEditor,
  Pantry,
  Progress,
  Settings,
  UserManagement,
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
      <UserProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/recipes/new" element={<RecipeEditor />} />
              <Route path="/recipes/:id" element={<RecipeDetail />} />
              <Route path="/recipes/:id/edit" element={<RecipeEditor />} />
              <Route path="/pantry" element={<Pantry />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/users" element={<UserManagement />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </UserProvider>
    </QueryClientProvider>
  )
}

export default App

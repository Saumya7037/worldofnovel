import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { RequireAuth, RequireLoggedOut } from './components/ProtectedRoute'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { NotFound } from './pages/NotFound'

const NovelWorkspace = lazy(() =>
  import('./pages/NovelWorkspace').then((m) => ({ default: m.NovelWorkspace })),
)

function WorkspaceFallback() {
  return (
    <div className="flex h-dvh items-center justify-center bg-canvas">
      <div className="size-6 animate-spin rounded-full border-2 border-line border-t-ember" />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<RequireLoggedOut />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/novels/:novelId"
          element={
            <Suspense fallback={<WorkspaceFallback />}>
              <NovelWorkspace />
            </Suspense>
          }
        />
        <Route
          path="/novels/:novelId/chapters/:chapterId"
          element={
            <Suspense fallback={<WorkspaceFallback />}>
              <NovelWorkspace />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
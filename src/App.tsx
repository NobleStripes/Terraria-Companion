import { lazy, Suspense, useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import { APP_VERSION, DATA_VERSION } from '@/data/index'

const Home = lazy(() => import('@/pages/Home'))
const ItemLookup = lazy(() => import('@/pages/ItemLookup'))
const BossTracker = lazy(() => import('@/pages/BossTracker'))
const BuildStages = lazy(() => import('@/pages/BuildStages'))
const LoadoutBuilder = lazy(() => import('@/pages/LoadoutBuilder'))
const PrepGuide = lazy(() => import('@/pages/PrepGuide'))
const BiomeGuide = lazy(() => import('@/pages/BiomeGuide'))
const NpcGuide = lazy(() => import('@/pages/NpcGuide'))
const ItemSourceExplorer = lazy(() => import('@/pages/ItemSourceExplorer'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function AppShellFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 h-4 w-48 animate-pulse rounded bg-terra-panel" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={`loading-card-${index}`} className="rounded-lg border border-terra-border bg-terra-surface p-4">
            <div className="h-3 w-2/3 animate-pulse rounded bg-terra-panel" />
            <div className="mt-2 h-3 w-full animate-pulse rounded bg-terra-panel" />
            <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-terra-panel" />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500">Loading companion modules...</p>
    </div>
  )
}

function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isTyping =
        event.target instanceof HTMLElement &&
        (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable)

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
      }

      if (event.key === 'Escape' && !isTyping) {
        setPaletteOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <AppErrorBoundary>
      <div className="min-h-full flex flex-col">
        <Navbar onOpenCommandPalette={() => setPaletteOpen(true)} />
        <main className="flex-1">
          <Suspense fallback={<AppShellFallback />}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="border-t border-terra-border py-3 px-4 text-center text-xs text-gray-600">
          Terraria Companion · App v{APP_VERSION} · Data version {DATA_VERSION} · Data sourced from{' '}
          <a href="https://terraria.wiki.gg" target="_blank" rel="noopener noreferrer" className="text-terra-sky hover:text-terra-gold transition-colors">
            Terraria Wiki
          </a>{' '}
          (CC BY-NC-SA 3.0)
        </footer>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    </AppErrorBoundary>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'items', element: <ItemLookup /> },
      { path: 'items/:itemId', element: <ItemLookup /> },
      { path: 'bosses', element: <BossTracker /> },
      { path: 'bosses/:bossId', element: <BossTracker /> },
      { path: 'prep', element: <PrepGuide /> },
      { path: 'sources', element: <ItemSourceExplorer /> },
      { path: 'build', element: <BuildStages /> },
      { path: 'loadouts', element: <LoadoutBuilder /> },
      { path: 'biomes', element: <BiomeGuide /> },
      { path: 'npcs', element: <NpcGuide /> },
      { path: 'npcs/:npcId', element: <NpcGuide /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}

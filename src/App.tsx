import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { APP_VERSION, DATA_VERSION } from '@/data/index'

const Home = lazy(() => import('@/pages/Home'))
const ItemLookup = lazy(() => import('@/pages/ItemLookup'))
const BossTracker = lazy(() => import('@/pages/BossTracker'))
const BuildStages = lazy(() => import('@/pages/BuildStages'))
const LoadoutBuilder = lazy(() => import('@/pages/LoadoutBuilder'))
const PrepGuide = lazy(() => import('@/pages/PrepGuide'))
const BiomeGuide = lazy(() => import('@/pages/BiomeGuide'))
const NpcGuide = lazy(() => import('@/pages/NpcGuide'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function Layout() {
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64 text-terra-gold font-pixel text-xs">
              Loading…
            </div>
          }
        >
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
    </div>
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

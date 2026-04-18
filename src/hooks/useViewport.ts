import { useEffect, useMemo, useState } from 'react'

type Viewport = 'mobile' | 'tablet' | 'desktop'

function getViewport(width: number): Viewport {
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export function useViewport() {
  const [viewport, setViewport] = useState<Viewport>(() => {
    if (typeof window === 'undefined') return 'desktop'
    return getViewport(window.innerWidth)
  })

  useEffect(() => {
    function updateViewport() {
      setViewport(getViewport(window.innerWidth))
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  return useMemo(() => ({
    viewport,
    isMobile: viewport === 'mobile',
    isTablet: viewport === 'tablet',
    isDesktop: viewport === 'desktop',
  }), [viewport])
}

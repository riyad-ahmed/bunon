import { useEffect } from 'react'

// Counts active locks so overlapping menus/dialogs don't unlock each other
let locks = 0

/** Stops the page behind an open menu or dialog from scrolling. */
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined
    locks += 1
    document.documentElement.classList.add('scroll-locked')
    return () => {
      locks -= 1
      if (locks === 0) document.documentElement.classList.remove('scroll-locked')
    }
  }, [active])
}

import { useEffect, useState } from 'react'

const SOLID_AFTER = 20 // px scrolled before the header gets its background
const HIDE_AFTER = 160 // px scrolled before the header may tuck away
const MIN_DELTA = 8 // ignore tiny scroll movements

/**
 * Header state from scrolling:
 *  - scrolled: page has moved, show the blurred background
 *  - hidden:   scrolling down (tuck the header away); scrolling up shows it
 */
export function useHeaderScroll() {
  const [state, setState] = useState(() => ({
    scrolled: window.scrollY > SOLID_AFTER,
    hidden: false,
  }))

  useEffect(() => {
    let lastY = window.scrollY
    let frame = 0

    const update = () => {
      frame = 0
      const y = window.scrollY
      const delta = y - lastY
      const scrolled = y > SOLID_AFTER

      setState((prev) => {
        let hidden = prev.hidden
        if (y < HIDE_AFTER) hidden = false
        else if (Math.abs(delta) >= MIN_DELTA) hidden = delta > 0
        return prev.scrolled === scrolled && prev.hidden === hidden ? prev : { scrolled, hidden }
      })

      if (y < HIDE_AFTER || Math.abs(delta) >= MIN_DELTA) lastY = y
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return state
}

import { useEffect, useRef, useState } from 'react'

/*
 * One shared IntersectionObserver for every element that reveals on scroll —
 * cheaper than an observer per element. Each element is watched until it
 * first enters the viewport, then forgotten.
 */
const callbacks = new WeakMap()
let observer = null

function getObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        callbacks.get(entry.target)?.()
        callbacks.delete(entry.target)
        observer.unobserve(entry.target)
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  )
  return observer
}

/** Returns [ref, inView]: inView turns true once the element scrolls into view. */
export function useInView() {
  const ref = useRef(null)
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    const io = getObserver()
    if (!element || !io || inView) return undefined

    callbacks.set(element, () => setInView(true))
    io.observe(element)
    return () => {
      callbacks.delete(element)
      io.unobserve(element)
    }
  }, [inView])

  return [ref, inView]
}

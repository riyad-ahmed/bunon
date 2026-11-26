import { useEffect, useState } from 'react'

/**
 * Returns the id of the section currently crossing the middle of the screen,
 * for highlighting the matching navigation link. `ids` must be a stable array.
 */
export function useActiveSection(ids) {
  const [activeId, setActiveId] = useState(ids[0])

  useEffect(() => {
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!sections.length || typeof IntersectionObserver === 'undefined') return undefined

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((section) => io.observe(section))
    return () => io.disconnect()
  }, [ids])

  return activeId
}

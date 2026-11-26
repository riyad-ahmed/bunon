export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Smoothly scrolls a section into view (respecting reduced-motion settings),
 * then optionally moves keyboard focus to an element inside it.
 */
export function scrollToSection(sectionId, { focusId } = {}) {
  const section = document.getElementById(sectionId)
  if (!section) return
  section.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true })
}

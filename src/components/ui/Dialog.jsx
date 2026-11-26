import { useEffect, useRef } from 'react'
import { useScrollLock } from '@/hooks/useScrollLock'
import { cx } from '@/lib/cx'
import { prefersReducedMotion } from '@/lib/scroll'
import styles from './Dialog.module.css'

const CLOSE_ANIMATION_MS = 320

/**
 * Accessible modal built on the native <dialog> element: focus stays inside,
 * Escape and backdrop clicks close it, the page behind can't scroll, and
 * focus returns to where it was. Opens and closes with an animation.
 *
 *  variant:  'modal'  — centred panel (a bottom sheet on phones)
 *            'drawer' — full-height panel from the right
 *  onClosed: called after the closing animation has finished
 */
export default function Dialog({ open, onClose, onClosed, variant = 'modal', labelledBy, className, children }) {
  const ref = useRef(null)
  const returnFocusRef = useRef(null)
  const onClosedRef = useRef(onClosed)
  useScrollLock(open)

  useEffect(() => {
    onClosedRef.current = onClosed
  }, [onClosed])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return undefined

    if (open) {
      dialog.removeAttribute('data-closing')
      if (!dialog.open) {
        returnFocusRef.current = document.activeElement
        dialog.showModal()
      }
      return undefined
    }

    if (!dialog.open) return undefined

    // Play the closing animation, then actually close
    dialog.setAttribute('data-closing', '')
    const timer = setTimeout(
      () => {
        dialog.removeAttribute('data-closing')
        dialog.close()
        returnFocusRef.current?.focus?.({ preventScroll: true })
        onClosedRef.current?.()
      },
      prefersReducedMotion() ? 0 : CLOSE_ANIMATION_MS,
    )
    return () => clearTimeout(timer)
  }, [open])

  return (
    // Clicking the backdrop is a mouse shortcut; keyboard users close with
    // Escape (onCancel) or the dialog's close button.
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      className={cx(styles.dialog, styles[variant], className)}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault() // Escape: close with the animation
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose() // click on the backdrop
      }}
    >
      {children}
    </dialog>
  )
}

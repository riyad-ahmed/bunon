import { useInView } from '@/hooks/useInView'
import { cx } from '@/lib/cx'
import styles from './Stitch.module.css'

/**
 * A running stitch, like the one beneath the BUNON wordmark. It "sews"
 * itself from left to right the first time it scrolls into view.
 * (The wrapper is what gets watched: a fully clipped element never counts
 * as visible, so the clip lives on the inner SVG.)
 */
export default function Stitch({ className }) {
  const [ref, inView] = useInView()

  return (
    <span ref={ref} className={cx(styles.wrap, className)} aria-hidden="true">
      <svg className={cx(styles.stitch, inView && styles.sewn)} viewBox="0 0 240 28" focusable="false">
        <path d="M3 21C34 6 70 3 112 12S186 30 237 7" />
      </svg>
    </span>
  )
}

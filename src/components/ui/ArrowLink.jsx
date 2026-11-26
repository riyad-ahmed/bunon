import { cx } from '@/lib/cx'
import styles from './ArrowLink.module.css'

/** Small uppercase text link with an arrow that nudges on hover. */
export default function ArrowLink({ className, children, ...rest }) {
  return (
    <a className={cx(styles.link, className)} {...rest}>
      {children} <span className={styles.arrow} aria-hidden="true">→</span>
    </a>
  )
}

import { cx } from '@/lib/cx'
import styles from './CloseButton.module.css'

export default function CloseButton({ label = 'Close', className, ...rest }) {
  return (
    <button type="button" className={cx(styles.close, className)} aria-label={label} {...rest}>
      <span aria-hidden="true" />
    </button>
  )
}

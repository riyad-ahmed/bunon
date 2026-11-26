import { cx } from '@/lib/cx'
import styles from './Button.module.css'

/**
 * Button or link styled as a button.
 *  variant: 'primary' (filled) | 'ghost' (outline)
 *  size:    'small' for compact places like product cards
 *  href:    renders an <a> instead of a <button>
 */
export default function Button({ href, variant = 'primary', size, block = false, className, children, ...rest }) {
  const classes = cx(styles.button, styles[variant], size && styles[size], block && styles.block, className)

  if (href) {
    return (
      <a className={classes} href={href} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <button className={classes} type="button" {...rest}>
      {children}
    </button>
  )
}

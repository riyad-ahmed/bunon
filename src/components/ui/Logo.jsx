import logoUrl from '@/assets/brand/bunon-logo-light.png'
import { cx } from '@/lib/cx'
import styles from './Logo.module.css'

// Size of the logo file, so the browser reserves its space before it loads
const WIDTH = 824
const HEIGHT = 261

/**
 * The BUNON wordmark and stitch, reversed for the dark theme.
 * The original artwork is kept at src/assets/brand/bunon-logo.jpeg.
 */
export default function Logo({ className, alt = 'BUNON', ...rest }) {
  return (
    <img
      className={cx(styles.logo, className)}
      src={logoUrl}
      alt={alt}
      width={WIDTH}
      height={HEIGHT}
      decoding="async"
      draggable="false"
      {...rest}
    />
  )
}

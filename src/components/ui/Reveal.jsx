import { useInView } from '@/hooks/useInView'
import { cx } from '@/lib/cx'

/**
 * Fades and lifts its content into place the first time it scrolls into view.
 *  as:    element to render ('div', 'p', 'h2', 'article', …)
 *  delay: stagger step (each step ≈ 110 ms)
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className, style, children, ...rest }) {
  const [ref, inView] = useInView()

  return (
    <Tag
      ref={ref}
      className={cx('reveal', inView && 'is-visible', className)}
      style={{ '--d': delay, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

import { useEffect } from 'react'
import { navigation } from '@/config/navigation'
import { site, socialLinks } from '@/config/site'
import { useScrollLock } from '@/hooks/useScrollLock'
import { cx } from '@/lib/cx'
import styles from './MobileMenu.module.css'

/** Full-screen menu for phones, opened from the header's menu button. */
export default function MobileMenu({ id, open, activeId, onNavigate }) {
  useScrollLock(open)

  // While open, the page behind can't be reached with Tab or a screen reader
  useEffect(() => {
    if (!open) return undefined
    const background = [document.getElementById('main'), document.getElementById('site-footer')].filter(Boolean)
    background.forEach((element) => element.setAttribute('inert', ''))
    return () => background.forEach((element) => element.removeAttribute('inert'))
  }, [open])

  const email = site.contact.email

  return (
    <div id={id} className={cx(styles.menu, open && styles.isOpen)}>
      <nav aria-label="Main">
        <ul className={styles.list}>
          {navigation.map((item, index) => (
            <li key={item.id} className={styles.item} style={{ '--i': index }}>
              <a
                className={cx(styles.link, activeId === item.id && styles.isActive)}
                href={`#${item.id}`}
                aria-current={activeId === item.id ? 'true' : undefined}
                onClick={onNavigate}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {(email || socialLinks.length > 0) && (
        <div className={styles.footer}>
          {email && <a href={`mailto:${email}`}>{email}</a>}
          {socialLinks.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

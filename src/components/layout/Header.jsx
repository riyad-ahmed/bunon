import { useCallback, useEffect, useRef, useState } from 'react'
import Logo from '@/components/ui/Logo'
import { commerce } from '@/config/commerce'
import { navigation } from '@/config/navigation'
import { BagButton } from '@/features/commerce'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import { cx } from '@/lib/cx'
import MobileMenu from './MobileMenu'
import styles from './Header.module.css'

const sectionIds = navigation.map((item) => item.id)

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef(null)
  const { scrolled, hidden } = useHeaderScroll()
  const activeId = useActiveSection(sectionIds)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  // Escape closes the menu and returns focus to the menu button
  useEffect(() => {
    if (!menuOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      toggleRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  // Close the menu if the screen grows to desktop width
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)')
    const onChange = (event) => {
      if (event.matches) setMenuOpen(false)
    }
    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
  }, [])

  return (
    <>
      <header
        className={cx(
          styles.header,
          scrolled && styles.isScrolled,
          hidden && !menuOpen && styles.isHidden,
          menuOpen && styles.isMenuOpen,
        )}
      >
        <div className={cx('container', styles.inner)}>
          <a className={styles.brand} href="#home" onClick={closeMenu} aria-label="BUNON — back to top">
            <Logo className={styles.logo} alt="" />
          </a>

          <nav className={styles.nav} aria-label="Main">
            <ul className={styles.navList}>
              {navigation.map((item) => (
                <li key={item.id}>
                  <a
                    className={cx(styles.navLink, activeId === item.id && styles.isActive)}
                    href={`#${item.id}`}
                    aria-current={activeId === item.id ? 'true' : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            {commerce.cartEnabled && <BagButton />}
            <button
              ref={toggleRef}
              type="button"
              className={styles.toggle}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu id="mobile-menu" open={menuOpen} activeId={activeId} onNavigate={closeMenu} />
    </>
  )
}

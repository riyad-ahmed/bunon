import Logo from '@/components/ui/Logo'
import Reveal from '@/components/ui/Reveal'
import { navigation } from '@/config/navigation'
import { site, socialLinks } from '@/config/site'
import { footer } from '@/content/copy'
import styles from './Footer.module.css'

const year = new Date().getFullYear()

export default function Footer() {
  return (
    <footer id="site-footer" className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <p className={styles.tagline}>{footer.tagline}</p>
          <nav aria-label="Footer">
            <ul className={styles.links}>
              {navigation.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>{item.label}</a>
                </li>
              ))}
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Reveal className={styles.mark} aria-hidden="true">
          <Logo alt="" />
        </Reveal>

        <div className={styles.meta}>
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <a className={styles.toTop} href="#home">
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  )
}

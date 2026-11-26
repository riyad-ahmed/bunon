import Reveal from '@/components/ui/Reveal'
import { site, socialLinks } from '@/config/site'
import styles from './ContactDetails.module.css'

/** Email, phone and studio from config/site.js — empty values are hidden. */
export default function ContactDetails() {
  const { email, phone, location } = site.contact

  const rows = [
    email && { label: 'Email', content: <a href={`mailto:${email}`}>{email}</a> },
    phone && { label: 'Phone', content: <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a> },
    location && { label: 'Studio', content: location },
  ].filter(Boolean)

  return (
    <>
      {rows.length > 0 && (
        <Reveal as="dl" className={styles.list} delay={2}>
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.content}</dd>
            </div>
          ))}
        </Reveal>
      )}

      {socialLinks.length > 0 && (
        <Reveal as="ul" className={styles.socials} delay={3}>
          {socialLinks.map((link) => (
            <li key={link.label}>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </Reveal>
      )}
    </>
  )
}

import ContactDetails from '@/components/contact/ContactDetails'
import ContactForm from '@/components/contact/ContactForm'
import Reveal from '@/components/ui/Reveal'
import RichText from '@/components/ui/RichText'
import { canEnquire, canSendMessages } from '@/config/site'
import { contactIntro } from '@/content/copy'
import { cx } from '@/lib/cx'
import styles from './Contact.module.css'

export default function Contact() {
  return (
    <section id="contact" className="section" aria-labelledby="contact-title">
      <div className={cx('container', styles.grid)}>
        <div>
          <Reveal as="p" className="eyebrow">
            {contactIntro.eyebrow}
          </Reveal>
          {/* tabIndex lets "Enquire" buttons move keyboard focus here */}
          <Reveal as="h2" id="contact-title" className="section-title" tabIndex={-1}>
            <RichText text={contactIntro.title} />
          </Reveal>
          <Reveal as="p" className={styles.intro} delay={1}>
            {canEnquire ? contactIntro.text : contactIntro.comingSoon}
          </Reveal>
          <ContactDetails />
        </div>

        {canSendMessages && (
          <Reveal className={styles.formColumn} delay={1}>
            <ContactForm />
          </Reveal>
        )}
      </div>
    </section>
  )
}

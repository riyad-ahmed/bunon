import Reveal from '@/components/ui/Reveal'
import RichText from '@/components/ui/RichText'
import Stitch from '@/components/ui/Stitch'
import { about } from '@/content/copy'
import { cx } from '@/lib/cx'
import styles from './About.module.css'

export default function About() {
  return (
    <section id="about" className={cx('section', styles.about)} aria-labelledby="about-title">
      <div className="container">
        <Reveal as="p" className="eyebrow">
          {about.eyebrow}
        </Reveal>

        <div className={styles.grid}>
          <div>
            <Reveal as="h2" id="about-title" className="section-title">
              <RichText text={about.title} />
            </Reveal>
            <Stitch className={styles.stitch} />
          </div>

          <div className={styles.body}>
            {about.paragraphs.map((paragraph, index) => (
              <Reveal as="p" key={paragraph} delay={index + 1}>
                <RichText text={paragraph} />
              </Reveal>
            ))}
          </div>
        </div>

        <ul className={styles.values}>
          {about.values.map((value, index) => (
            <Reveal as="li" key={value.title} className={styles.value} delay={index}>
              <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

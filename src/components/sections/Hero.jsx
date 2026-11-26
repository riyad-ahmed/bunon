import Button from '@/components/ui/Button'
import RichText from '@/components/ui/RichText'
import { hero } from '@/content/copy'
import { cx } from '@/lib/cx'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section id="home" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.backdrop} aria-hidden="true" />

      <div className="container">
        <p className={cx('eyebrow', styles.fade)} style={{ '--d': 0 }}>
          {hero.eyebrow}
        </p>

        {/* Each line slides up from behind its own mask */}
        <h1 id="hero-title" className={styles.title}>
          {hero.titleLines.map((line, index) => (
            <span key={line} className={styles.line}>
              <span className={styles.lineInner} style={{ '--d': index + 1 }}>
                <RichText text={line} />
              </span>
            </span>
          ))}
        </h1>

        <p className={cx(styles.lead, styles.fade)} style={{ '--d': 3 }}>
          {hero.lead}
        </p>

        <div className={cx(styles.actions, styles.fade)} style={{ '--d': 4 }}>
          <Button href={hero.primaryAction.href}>{hero.primaryAction.label}</Button>
          <Button href={hero.secondaryAction.href} variant="ghost">
            {hero.secondaryAction.label}
          </Button>
        </div>
      </div>

      <div className={cx('container', styles.foot, styles.fade)} style={{ '--d': 6 }} aria-hidden="true">
        <p>{hero.footnote.join('  ·  ')}</p>
        <span className={styles.cue}>
          <span />
        </span>
      </div>
    </section>
  )
}

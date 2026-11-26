import { cx } from '@/lib/cx'
import styles from './ProductFilter.module.css'

export default function ProductFilter({ options, counts, value, onChange }) {
  return (
    <fieldset className={styles.filter}>
      <legend className="visually-hidden">Filter products by category</legend>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={cx(styles.option, value === option.id && styles.isActive)}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
          <span className={styles.count}>{counts[option.id]}</span>
        </button>
      ))}
    </fieldset>
  )
}

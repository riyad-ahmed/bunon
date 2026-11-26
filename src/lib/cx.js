/** Joins class names, skipping empty ones: cx('a', isOn && 'b') → 'a b' */
export function cx(...classNames) {
  return classNames.filter(Boolean).join(' ')
}

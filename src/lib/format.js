import { site } from '../config/site.js'

/** 2400 → '৳2,400' (symbol from config/site.js). Non-numbers → ''. */
export function formatPrice(amount, symbol = site.currency.symbol) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return ''
  return symbol + amount.toLocaleString('en-US')
}

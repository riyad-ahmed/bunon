import { useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import CloseButton from '@/components/ui/CloseButton'
import Dialog from '@/components/ui/Dialog'
import { commerce } from '@/config/commerce'
import { canEnquire } from '@/config/site'
import { useEnquiryActions } from '@/context/enquiry/useEnquiry'
import { PurchaseActions, useCartActions } from '@/features/commerce'
import { defaultSelection, findOption, optionsInColor, priceLabel } from '@/lib/catalog'
import { cx } from '@/lib/cx'
import { formatPrice } from '@/lib/format'
import { getProductImage } from '@/lib/images'
import styles from './ProductQuickView.module.css'

/**
 * Larger photo and details for one product, with colour and size choices.
 * (Rendered with key={product.id}, so choices start fresh for each product.)
 */
export default function ProductQuickView({ product, open, onClose }) {
  const { enquireAbout } = useEnquiryActions()
  const { add } = useCartActions()
  const [selection, setSelection] = useState(() => defaultSelection(product))
  // Something to do once the closing animation has finished
  const afterCloseRef = useRef(null)

  if (!product) return null

  const { color, size } = selection
  const inColor = optionsInColor(product, color)
  const option = findOption(product, selection)
  const image = option?.image ?? inColor.find((o) => o.image)?.image ?? product.image
  const price = option ? priceLabel(option.price, option.price, formatPrice) : priceLabel(product.priceMin, product.priceMax, formatPrice)

  const chooseColor = (nextColor) => {
    const options = optionsInColor(product, nextColor)
    const keepSize = options.some((o) => o.size === size && o.inStock)
    const nextSize = keepSize ? size : ((options.find((o) => o.inStock) ?? options[0])?.size ?? '')
    setSelection({ color: nextColor, size: nextSize })
  }

  const closeThen = (action) => {
    afterCloseRef.current = action
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy="quick-view-title"
      onClosed={() => {
        const action = afterCloseRef.current
        afterCloseRef.current = null
        action?.()
      }}
    >
      <article className={styles.panel}>
        <CloseButton className={styles.close} label="Close product details" onClick={onClose} />

        <div className={styles.media}>
          <img src={getProductImage(image)} alt={option?.name ?? product.name} width="800" height="1000" />
        </div>

        <div className={styles.info}>
          <p className="eyebrow">{product.category}</p>
          <h2 id="quick-view-title" className={styles.title}>
            {product.name}
          </h2>
          <p className={styles.price}>{price}</p>
          {product.description && <p className={styles.description}>{product.description}</p>}

          {product.colors.length > 0 && (
            <fieldset className={styles.choice}>
              <legend>
                Colour <span>{color}</span>
              </legend>
              <div className={styles.chips}>
                {product.colors.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={cx(styles.chip, product.soldOutColors.includes(name) && styles.chipSoldOut)}
                    aria-pressed={name === color}
                    onClick={() => chooseColor(name)}
                  >
                    {name}
                    {product.soldOutColors.includes(name) && <span className="visually-hidden"> (sold out)</span>}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {inColor.some((o) => o.size) && (
            <fieldset className={styles.choice}>
              <legend>
                Size <span>{size}</span>
              </legend>
              <div className={styles.chips}>
                {inColor
                  .filter((o) => o.size)
                  .map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className={cx(styles.chip, styles.sizeChip, !o.inStock && styles.chipSoldOut)}
                      aria-pressed={o.size === size}
                      onClick={() => setSelection({ color, size: o.size })}
                    >
                      {o.size}
                      {!o.inStock && <span className="visually-hidden"> (sold out)</span>}
                    </button>
                  ))}
              </div>
            </fieldset>
          )}

          {option && !option.inStock && (
            <p className={styles.stock}>
              {canEnquire
                ? 'This one is sold out — enquire and we’ll let you know when it’s back.'
                : 'This one is sold out for now.'}
            </p>
          )}

          <div className={styles.actions}>
            <PurchaseActions product={product} option={option} onAdd={(chosen) => closeThen(() => add(chosen.id))} />
            {canEnquire && (
              <Button
                variant={commerce.cartEnabled ? 'ghost' : 'primary'}
                onClick={() => closeThen(() => enquireAbout(option ?? product))}
              >
                Enquire about this piece
              </Button>
            )}
          </div>

          {!commerce.cartEnabled && (
            <p className={styles.note}>
              {canEnquire
                ? 'Online ordering is coming soon — send an enquiry and we’ll reply with availability.'
                : 'Online ordering is coming soon.'}
            </p>
          )}
        </div>
      </article>
    </Dialog>
  )
}

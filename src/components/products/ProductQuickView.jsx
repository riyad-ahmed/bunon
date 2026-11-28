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
import { swatchFor } from '@/lib/presets'
import styles from './ProductQuickView.module.css'

/** Index of the first photo that belongs to a colour, or null. */
function photoOfColor(product, color) {
  const index = (product?.photos ?? []).findIndex((photo) => color && photo.color === color)
  return index >= 0 ? index : null
}

/**
 * Photos, details and colour/size choices for one product.
 * (Rendered with key={product.id}, so choices start fresh for each product.)
 */
export default function ProductQuickView({ product, open, onClose }) {
  const { enquireAbout } = useEnquiryActions()
  const { add } = useCartActions()
  const [selection, setSelection] = useState(() => defaultSelection(product))
  const [photo, setPhoto] = useState(() => photoOfColor(product, defaultSelection(product).color) ?? 0)
  // Something to do once the closing animation has finished
  const afterCloseRef = useRef(null)

  if (!product) return null

  const { color, size } = selection
  const inColor = optionsInColor(product, color)
  const option = findOption(product, selection)
  const photos = product.photos
  const count = photos.length
  const current = photos[photo] ?? photos[0]

  const chooseColor = (nextColor) => {
    const options = optionsInColor(product, nextColor)
    const keepSize = options.some((o) => o.size === size)
    setSelection({ color: nextColor, size: keepSize ? size : (options[0]?.size ?? '') })
    const index = photoOfColor(product, nextColor)
    if (index != null) setPhoto(index)
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
          <div className={styles.stage}>
            <img
              key={current?.src ?? 'none'}
              className={styles.photo}
              src={getProductImage(current?.src)}
              alt={count > 1 ? `${product.name}, photo ${photo + 1} of ${count}` : product.name}
              width="800"
              height="1000"
            />
            {count > 1 && (
              <>
                <button
                  type="button"
                  className={cx(styles.step, styles.prev)}
                  aria-label="Previous photo"
                  onClick={() => setPhoto((photo - 1 + count) % count)}
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <button
                  type="button"
                  className={cx(styles.step, styles.next)}
                  aria-label="Next photo"
                  onClick={() => setPhoto((photo + 1) % count)}
                >
                  <span aria-hidden="true">›</span>
                </button>
                <p className={styles.counter} aria-hidden="true">
                  {photo + 1} / {count}
                </p>
              </>
            )}
          </div>

          {count > 1 && (
            <ul className={styles.thumbs} aria-label="Photos">
              {photos.map((item, index) => (
                <li key={item.src}>
                  <button
                    type="button"
                    className={styles.thumb}
                    aria-label={`Photo ${index + 1}${item.color ? ` (${item.color})` : ''}`}
                    aria-current={index === photo ? 'true' : undefined}
                    onClick={() => setPhoto(index)}
                  >
                    <img src={getProductImage(item.src)} alt="" width="56" height="70" loading="lazy" decoding="async" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.info}>
          <p className="eyebrow">{product.category}</p>
          <h2 id="quick-view-title" className={styles.title}>
            {product.name}
          </h2>
          <p className={styles.price}>{priceLabel(product.price, formatPrice)}</p>
          {product.description && <p className={styles.description}>{product.description}</p>}

          {product.colors.length > 0 && (
            <fieldset className={styles.choice}>
              <legend>
                Colour <span>{color}</span>
              </legend>
              <div className={styles.chips}>
                {product.colors.map((name) => {
                  const swatch = swatchFor(name)
                  return (
                    <button
                      key={name}
                      type="button"
                      className={styles.chip}
                      aria-pressed={name === color}
                      onClick={() => chooseColor(name)}
                    >
                      {swatch && <span className={styles.swatch} style={{ '--swatch': swatch }} aria-hidden="true" />}
                      {name}
                    </button>
                  )
                })}
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
                      className={cx(styles.chip, styles.sizeChip)}
                      aria-pressed={o.size === size}
                      onClick={() => setSelection({ color, size: o.size })}
                    >
                      {o.size}
                    </button>
                  ))}
              </div>
            </fieldset>
          )}

          {!product.inStock && (
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

import ArrowLink from '@/components/ui/ArrowLink'
import Reveal from '@/components/ui/Reveal'
import { canEnquire } from '@/config/site'
import { useEnquiryActions } from '@/context/enquiry/useEnquiry'
import { PurchaseActions } from '@/features/commerce'
import { priceLabel } from '@/lib/catalog'
import { cx } from '@/lib/cx'
import { formatPrice } from '@/lib/format'
import { getProductImage } from '@/lib/images'
import styles from './ProductCard.module.css'

export default function ProductCard({ product, index, onOpen }) {
  const { enquireAbout } = useEnquiryActions()

  return (
    <Reveal as="article" className={styles.card} delay={index % 3}>
      <button
        type="button"
        className={styles.media}
        onClick={() => onOpen(product.id)}
        aria-haspopup="dialog"
        aria-label={`View details: ${product.name}`}
      >
        <img
          className={styles.image}
          src={getProductImage(product.image)}
          alt=""
          width="800"
          height="1000"
          loading="lazy"
          decoding="async"
        />
        {!product.inStock && <span className={styles.badge}>Sold out</span>}
        <span className={styles.hint} aria-hidden="true">
          <span className={styles.hintText}>Quick view</span>
          <span className={styles.hintIcon} />
        </span>
      </button>

      <div className={styles.body}>
        <div className={styles.row}>
          <h3 className={styles.name}>{product.name}</h3>
          <p className={styles.price}>{priceLabel(product.priceMin, product.priceMax, formatPrice)}</p>
        </div>

        {product.colors.length > 0 && <p className={styles.colors}>{product.colors.join(' · ')}</p>}

        {product.sizes.length > 0 && (
          <ul className={styles.sizes} aria-label="Sizes">
            {product.sizes.map((size) => {
              const soldOut = product.soldOutSizes.includes(size)
              return (
                <li key={size} className={cx(soldOut && styles.soldOut)}>
                  {size}
                  {soldOut && <span className="visually-hidden"> (sold out)</span>}
                </li>
              )
            })}
          </ul>
        )}

        {product.description && <p className={styles.description}>{product.description}</p>}

        <div className={styles.actions}>
          <PurchaseActions product={product} size="small" onChooseOptions={() => onOpen(product.id)} />
          {canEnquire && (
            <ArrowLink
              href="#contact"
              onClick={(event) => {
                event.preventDefault()
                enquireAbout(product)
              }}
            >
              Enquire
            </ArrowLink>
          )}
        </div>
      </div>
    </Reveal>
  )
}

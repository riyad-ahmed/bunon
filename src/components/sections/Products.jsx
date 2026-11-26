import { useState } from 'react'
import ProductCard from '@/components/products/ProductCard'
import ProductFilter from '@/components/products/ProductFilter'
import ProductQuickView from '@/components/products/ProductQuickView'
import Reveal from '@/components/ui/Reveal'
import { canEnquire } from '@/config/site'
import { productsIntro } from '@/content/copy'
import { categories, products, productsById } from '@/data/products'
import { cx } from '@/lib/cx'
import styles from './Products.module.css'

// How many products each category has (categories with none are hidden)
const counts = Object.fromEntries(
  categories.map((category) => [
    category.id,
    category.id === 'all' ? products.length : products.filter((p) => p.categoryId === category.id).length,
  ]),
)
const filterOptions = categories.filter((category) => counts[category.id] > 0)

export default function Products() {
  const [category, setCategory] = useState('all')
  const [quickView, setQuickView] = useState({ id: null, open: false })

  const visible = category === 'all' ? products : products.filter((p) => p.categoryId === category)

  return (
    <section id="products" className={cx('section', styles.products)} aria-labelledby="products-title">
      <div className="container">
        <div className={styles.head}>
          <div>
            <Reveal as="p" className="eyebrow">
              {productsIntro.eyebrow}
            </Reveal>
            <Reveal as="h2" id="products-title" className="section-title">
              {productsIntro.title}
            </Reveal>
          </div>
          <Reveal as="p" className="section-note" delay={1}>
            {canEnquire ? `${productsIntro.note} ${productsIntro.enquireNote}` : productsIntro.note}
          </Reveal>
        </div>

        {products.length === 0 ? (
          <Reveal as="p" className={styles.empty}>
            {canEnquire ? 'New pieces are on their way. Get in touch to hear about them first.' : 'New pieces are on their way.'}
          </Reveal>
        ) : (
          <>
            {filterOptions.length > 2 && (
              <Reveal delay={1}>
                <ProductFilter options={filterOptions} counts={counts} value={category} onChange={setCategory} />
              </Reveal>
            )}

            <p className="visually-hidden" aria-live="polite">
              {`Showing ${visible.length} ${visible.length === 1 ? 'product' : 'products'}`}
            </p>

            {/* Keyed by category so the cards animate in again after filtering */}
            <div key={category} className={styles.grid}>
              {visible.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  onOpen={(id) => setQuickView({ id, open: true })}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ProductQuickView
        key={quickView.id ?? 'none'}
        product={productsById[quickView.id]}
        open={quickView.open}
        onClose={() => setQuickView((current) => ({ ...current, open: false }))}
      />
    </section>
  )
}

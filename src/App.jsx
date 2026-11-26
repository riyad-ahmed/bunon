import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import About from '@/components/sections/About'
import Contact from '@/components/sections/Contact'
import Hero from '@/components/sections/Hero'
import Products from '@/components/sections/Products'
import { commerce } from '@/config/commerce'
import EnquiryProvider from '@/context/enquiry/EnquiryProvider'
import { CartDrawer, CartProvider } from '@/features/commerce'

export default function App() {
  return (
    <CartProvider>
      <EnquiryProvider>
        <a className="skip-link" href="#main">
          Skip to content
        </a>

        <Header />

        <main id="main">
          <Hero />
          <About />
          <Products />
          <Contact />
        </main>

        <Footer />

        {commerce.cartEnabled && <CartDrawer />}
      </EnquiryProvider>
    </CartProvider>
  )
}

/* ==========================================================================
   BUNON — Products
   --------------------------------------------------------------------------
   The Products section is built from this list. To add a product, copy one
   { ... } block, paste it below the last one and change the details.

   id           short unique name, no spaces (used for enquiries/payments)
   name         product name shown on the card
   description  one short line
   price        a number, no currency sign (the sign comes from config.js)
   image        path to the photo inside assets/images/products/
                Best: portrait 4:5 (e.g. 1200 × 1500 px), JPG or WebP, < 300 KB
   alt          short description of the photo for screen readers
   paymentLink  (for later) your provider's checkout link — see payment.js
   ========================================================================== */

window.PRODUCTS = [
  {
    id: "everyday-tote",
    name: "Everyday Tote",
    description: "Hand-woven jute and cotton, fully lined.",
    price: 2400,
    image: "assets/images/products/product-01.svg",
    alt: "Everyday Tote",
    // paymentLink: "",
  },
  {
    id: "stitched-throw",
    name: "Stitched Throw",
    description: "Layered cotton with a hand-sewn running stitch.",
    price: 4800,
    image: "assets/images/products/product-02.svg",
    alt: "Stitched Throw, folded",
    // paymentLink: "",
  },
  {
    id: "linen-scarf",
    name: "Linen Scarf",
    description: "Loose-weave linen, naturally dyed.",
    price: 1800,
    image: "assets/images/products/product-03.svg",
    alt: "Linen Scarf",
    // paymentLink: "",
  },
  {
    id: "table-runner",
    name: "Table Runner",
    description: "Handloom cotton with fringed ends.",
    price: 1500,
    image: "assets/images/products/product-04.svg",
    alt: "Table Runner",
    // paymentLink: "",
  },
  {
    id: "coiled-basket",
    name: "Coiled Basket",
    description: "Seagrass, coiled and stitched by hand.",
    price: 2200,
    image: "assets/images/products/product-05.svg",
    alt: "Coiled Basket, seen from above",
    // paymentLink: "",
  },
  {
    id: "cushion-cover",
    name: "Cushion Cover",
    description: "Textured basket weave, 18 × 18 in.",
    price: 1200,
    image: "assets/images/products/product-06.svg",
    alt: "Cushion Cover",
    // paymentLink: "",
  },
];

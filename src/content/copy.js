/**
 * BUNON — website text
 * ---------------------------------------------------------------------------
 * Headlines and paragraphs for each section.
 * Wrap words in *asterisks* to set them in gold italics, e.g. 'Let’s *talk*.'
 */

export const hero = {
  eyebrow: '100% hand-embroidered clothing',
  titleLines: ['Art in', 'every *stitch.*'],
  lead: 'Premium hoodies, sweatshirts and tees, embroidered entirely by hand. More than just clothing — every piece is a story, stitched with care.',
  primaryAction: { label: 'Explore the collection', href: '#products' },
  secondaryAction: { label: 'Our story', href: '#about' },
  footnote: ['Hand embroidered', 'Natural fabric', 'Made with care'],
}

export const about = {
  eyebrow: 'About',
  title: 'More than just *clothing.*',
  paragraphs: [
    'BUNON comes from বুনন, the Bangla word for weaving — the patient work of guiding thread, stitch by stitch, until something beautiful takes shape.',
    'Every design is embroidered by hand onto soft, natural fabric. It is slow work, done with care, so each piece carries its own story — and no two are ever exactly alike.',
  ],
  values: [
    {
      title: 'Hand embroidered',
      text: 'Every line of every design is stitched by hand — never printed.',
    },
    {
      title: 'Natural fabric',
      text: 'Soft, breathable premium cotton, chosen for comfort and everyday wear.',
    },
    {
      title: 'Made to last',
      text: 'Careful stitching and quality fabric — made to be worn, washed and loved for years.',
    },
  ],
}

export const productsIntro = {
  eyebrow: 'Products',
  title: 'The collection',
  note: 'Each piece is embroidered by hand, in small batches.',
  // Shown only when visitors have a way to get in touch (config/site.js)
  enquireNote: 'Choose “Enquire” on any piece and we’ll get back to you about sizes and availability.',
}

export const contactIntro = {
  eyebrow: 'Contact',
  title: 'Let’s *talk*.',
  text: 'Questions about a piece, sizes or custom orders — we’d love to hear from you.',
  // Shown instead while config/site.js has no email, phone or social link
  comingSoon: 'Our contact details are on their way — please check back soon.',
}

export const footer = {
  tagline: 'Art in every stitch — 100% hand-embroidered clothing.',
}

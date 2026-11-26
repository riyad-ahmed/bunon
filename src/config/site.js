/**
 * BUNON — site settings
 * ---------------------------------------------------------------------------
 * Contact details, social links, contact-form delivery and currency.
 * Leave any value as '' (empty quotes) to hide it from the website.
 */
export const site = {
  name: 'BUNON',

  contact: {
    email: '', // e.g. 'hello@bunon.com' — lets the contact form send messages
    phone: '', // e.g. '+880 1XXX-XXXXXX'
    location: '', // e.g. 'Dhaka, Bangladesh'
  },

  social: {
    instagram: '', // e.g. 'https://instagram.com/bunon'
    facebook: '', // e.g. 'https://facebook.com/bunon'
  },

  /**
   * Contact form delivery. GitHub Pages can't send email by itself:
   *  - endpoint '' (default) → "Send" opens the visitor's own email app with
   *    the message ready, addressed to contact.email above.
   *  - endpoint = a free Formspree form (https://formspree.io), for example
   *    'https://formspree.io/f/abcdwxyz' → messages arrive in your inbox and
   *    the visitor never leaves the page.
   */
  contactForm: {
    endpoint: '',
  },

  currency: {
    symbol: '৳', // shown before prices, e.g. '$', '£', 'Tk '
    code: 'BDT', // ISO code, used by payment providers later
  },
}

/** Social links that have an address, in display order. */
export const socialLinks = [
  { label: 'Instagram', href: site.social.instagram },
  { label: 'Facebook', href: site.social.facebook },
].filter((link) => link.href)

/** The contact form can deliver a message (an email address or form service is set). */
export const canSendMessages = Boolean(site.contact.email || site.contactForm.endpoint)

/**
 * Visitors have some way to reach BUNON. Until then the "Enquire" buttons and
 * the contact form stay hidden, and the Contact section says details are coming.
 */
export const canEnquire = Boolean(canSendMessages || site.contact.phone || socialLinks.length > 0)

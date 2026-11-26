import { site } from '../config/site.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** An empty contact-form draft. `topic` holds the product(s) being asked about. */
export const emptyEnquiry = Object.freeze({ name: '', email: '', message: '', topic: '' })

function joinNames(names) {
  if (names.length < 3) return names.join(' and ')
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

/** Opening line for an enquiry about one or more products. */
export function buildEnquiryMessage(productNames) {
  const names = productNames.filter(Boolean)
  if (names.length === 0) return ''
  if (names.length === 1) return `Hi BUNON, I’d like to know more about the ${names[0]}.`
  return `Hi BUNON, I’d like to know more about these pieces: ${joinNames(names)}.`
}

/** Returns { field: message } for every problem; an empty object means valid. */
export function validateEnquiry({ name = '', email = '', message = '' }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Please add your name.'
  if (!email.trim()) errors.email = 'Please add your email address.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Please check your email address.'
  if (!message.trim()) errors.message = 'Please write a short message.'
  return errors
}

/** A mailto: link that opens the visitor's email app with the enquiry written. */
export function buildMailtoHref(enquiry, to) {
  const name = enquiry.name.trim()
  const subject = enquiry.topic ? `Enquiry: ${enquiry.topic} — ${name}` : `Enquiry from ${name}`
  const body = `${enquiry.message.trim()}\n\n— ${name}\n${enquiry.email.trim()}`
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * Delivers an enquiry using the method set in config/site.js.
 * Resolves to { method: 'form' } when sent through the form service, or
 * { method: 'email', href } when the visitor's email app should be opened.
 */
export async function sendEnquiry(enquiry, settings = site, request = globalThis.fetch) {
  const endpoint = settings.contactForm?.endpoint

  if (endpoint) {
    const response = await request(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: enquiry.name.trim(),
        email: enquiry.email.trim(),
        message: enquiry.message.trim(),
        topic: enquiry.topic || undefined,
        _subject: enquiry.topic ? `Website enquiry: ${enquiry.topic}` : 'Website enquiry',
      }),
    })
    if (!response.ok) throw new Error(`Form service responded with ${response.status}`)
    return { method: 'form' }
  }

  const to = settings.contact?.email
  if (to) return { method: 'email', href: buildMailtoHref(enquiry, to) }

  throw new Error('No contact method set: add contact.email or contactForm.endpoint in config/site.js')
}

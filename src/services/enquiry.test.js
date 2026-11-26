import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildEnquiryMessage, buildMailtoHref, sendEnquiry, validateEnquiry } from './enquiry.js'

const valid = { name: 'Ayesha', email: 'ayesha@example.com', message: 'Hello', topic: '' }

test('builds an opening line for one or several products', () => {
  assert.equal(buildEnquiryMessage([]), '')
  assert.equal(buildEnquiryMessage(['Everyday Tote']), 'Hi BUNON, I’d like to know more about the Everyday Tote.')
  assert.equal(
    buildEnquiryMessage(['Linen Scarf', 'Table Runner']),
    'Hi BUNON, I’d like to know more about these pieces: Linen Scarf and Table Runner.',
  )
  assert.match(buildEnquiryMessage(['A', 'B', 'C']), /A, B and C\.$/)
})

test('validates name, email and message', () => {
  assert.deepEqual(validateEnquiry(valid), {})
  const errors = validateEnquiry({ name: ' ', email: 'not-an-email', message: '' })
  assert.deepEqual(Object.keys(errors).sort(), ['email', 'message', 'name'])
  assert.equal(validateEnquiry({ ...valid, email: '' }).email, 'Please add your email address.')
})

test('builds a mailto link with subject and signature', () => {
  const href = buildMailtoHref({ ...valid, topic: 'Everyday Tote' }, 'hello@bunon.test')
  assert.ok(href.startsWith('mailto:hello@bunon.test?subject='))
  const params = new URLSearchParams(href.split('?')[1])
  assert.equal(params.get('subject'), 'Enquiry: Everyday Tote — Ayesha')
  assert.equal(params.get('body'), 'Hello\n\n— Ayesha\nayesha@example.com')
})

test('falls back to the email app when no form endpoint is set', async () => {
  const settings = { contact: { email: 'hello@bunon.test' }, contactForm: { endpoint: '' } }
  const result = await sendEnquiry(valid, settings)
  assert.equal(result.method, 'email')
  assert.ok(result.href.startsWith('mailto:hello@bunon.test'))
})

test('posts JSON to the form endpoint when one is set', async () => {
  const calls = []
  const request = async (url, options) => {
    calls.push({ url, options })
    return { ok: true }
  }
  const settings = { contact: { email: '' }, contactForm: { endpoint: 'https://formspree.io/f/test' } }
  const result = await sendEnquiry({ ...valid, topic: 'Linen Scarf' }, settings, request)

  assert.equal(result.method, 'form')
  assert.equal(calls[0].url, 'https://formspree.io/f/test')
  const body = JSON.parse(calls[0].options.body)
  assert.equal(body.email, 'ayesha@example.com')
  assert.equal(body._subject, 'Website enquiry: Linen Scarf')
})

test('reports form service errors and missing configuration', async () => {
  const failing = async () => ({ ok: false, status: 500 })
  const withEndpoint = { contact: {}, contactForm: { endpoint: 'https://formspree.io/f/test' } }
  await assert.rejects(sendEnquiry(valid, withEndpoint, failing), /500/)
  await assert.rejects(sendEnquiry(valid, { contact: {}, contactForm: {} }), /No contact method/)
})

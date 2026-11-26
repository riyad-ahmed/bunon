import assert from 'node:assert/strict'
import { test } from 'node:test'
import { commerce } from '../../../config/commerce.js'
import { CheckoutUnavailableError, getCheckoutUrl, isCheckoutAvailable } from './checkout.js'
import { checkoutEndpoint } from './providers/checkoutEndpoint.js'

const tote = { id: 'tote', name: 'Tote', price: 2400, paymentLink: 'https://buy.example.com/tote' }
const line = (product, quantity = 1) => ({ id: product.id, quantity, product })

test('buying is switched off in the shipped configuration', () => {
  assert.equal(commerce.checkoutEnabled, false)
  assert.equal(commerce.cartEnabled, false)
  assert.equal(isCheckoutAvailable(), false)
})

test('refuses to start checkout while switched off', async () => {
  await assert.rejects(getCheckoutUrl([line(tote)]), CheckoutUnavailableError)
})

test('payment links: returns the product link for a single item', async () => {
  const settings = { checkoutEnabled: true, provider: 'payment-links' }
  assert.equal(await getCheckoutUrl([line(tote)], settings), tote.paymentLink)
  await assert.rejects(getCheckoutUrl([line(tote, 2)], settings), /one product at a time/)
  await assert.rejects(getCheckoutUrl([line({ ...tote, paymentLink: '' })], settings), /No payment link/)
  await assert.rejects(getCheckoutUrl([], settings), /empty/)
})

test('unknown providers are treated as unavailable', () => {
  assert.equal(isCheckoutAvailable({ checkoutEnabled: true, provider: 'nope' }), false)
})

test('checkout endpoint: sends ids and quantities only, returns the session URL', async () => {
  let sent
  const request = async (url, options) => {
    sent = { url, body: JSON.parse(options.body) }
    return { ok: true, json: async () => ({ url: 'https://pay.example.com/session/1' }) }
  }
  const settings = { checkoutEndpoint: 'https://api.example.com/checkout' }
  const url = await checkoutEndpoint.createCheckoutUrl([line(tote, 2)], settings, request)

  assert.equal(url, 'https://pay.example.com/session/1')
  assert.equal(sent.url, settings.checkoutEndpoint)
  assert.deepEqual(sent.body, { items: [{ id: 'tote', quantity: 2 }] })
})

test('checkout endpoint: reports missing settings and failed responses', async () => {
  await assert.rejects(checkoutEndpoint.createCheckoutUrl([line(tote)], {}), /checkoutEndpoint/)
  const failing = async () => ({ ok: false, status: 502 })
  await assert.rejects(
    checkoutEndpoint.createCheckoutUrl([line(tote)], { checkoutEndpoint: 'https://x.test' }, failing),
    /502/,
  )
})

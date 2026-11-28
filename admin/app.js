/**
 * BUNON product dashboard — runs only on this computer (`npm run admin`,
 * or double-click "BUNON Products.bat"). Server side: scripts/admin/.
 *
 * Every change is saved by itself a moment after you make it; a little later
 * the server puts the products on the live website. Plain JavaScript, no
 * build step: this file is served exactly as written.
 */

// ---------------------------------------------------------------- helpers

/** Creates an element: h('a', { href: '#/', class: 'x', onclick }, 'text', child, …). */
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue
    if (key === 'class') el.className = value
    else if (key === 'vars') for (const [name, v] of Object.entries(value)) el.style.setProperty(name, v)
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value)
    else if (['value', 'checked', 'disabled', 'selected', 'hidden'].includes(key)) el[key] = value
    else el.setAttribute(key, value === true ? '' : String(value))
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue
    el.append(child instanceof Node ? child : String(child))
  }
  return el
}

let uid = 0
const nextId = (prefix) => `${prefix}-${++uid}`
const sameText = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase()
const price = (value) => (value == null ? '' : `৳${Number(value).toLocaleString('en-US')}`)
const photoUrl = (file) => `/admin/photos/${file}`
const isLive = (p) => p.visible !== false && p.name.trim() !== '' && p.photos.length > 0
const newestFirst = (a, b) => String(b.createdAt).localeCompare(String(a.createdAt))

// ---------------------------------------------------------------- server

async function call(method, path, body, { keepalive = false } = {}) {
  const options = { method, keepalive, headers: { 'x-bunon-admin': '1' } }
  if (body instanceof Blob) {
    options.body = body
    options.headers['content-type'] = body.type || 'application/octet-stream'
  } else if (body !== undefined) {
    options.body = JSON.stringify(body)
    options.headers['content-type'] = 'application/json'
  }
  let response
  try {
    response = await fetch(`/admin/api${path}`, options)
  } catch {
    setServerDown(true)
    throw Object.assign(new Error('offline'), { status: 0 })
  }
  setServerDown(false)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw Object.assign(new Error(data.error || `HTTP ${response.status}`), { status: response.status })
  return data
}

/** A photo from the computer → a JPEG at most 1600px on its long side. */
async function toJpeg(file, max = 1600, quality = 0.86) {
  let bitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('decode')
  }
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = h('canvas', { width, height })
  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff' // see-through PNGs get a white background
  context.fillRect(0, 0, width, height)
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode'))), 'image/jpeg', quality),
  )
}

// ---------------------------------------------------------------- app state

const app = {
  products: [],
  categories: [],
  colors: [],
  sizes: [],
  publish: null,
  clockOffset: 0,
}
let editor = null

const root = document.getElementById('app')
const main = h('main', { class: 'main', id: 'main', tabindex: '-1' })
const pill = h('div', { class: 'pill', role: 'status', 'aria-live': 'polite' })
const liveLink = h('a', { class: 'toplink', target: '_blank', rel: 'noopener', hidden: true }, 'লাইভ সাইট ↗')
const banner = h('p', { class: 'banner', role: 'alert', hidden: true })
let toastTimer = null
const toastBox = h('div', { class: 'toast', role: 'status', hidden: true })

const topbar = h(
  'header',
  { class: 'topbar' },
  h(
    'a',
    { class: 'brand', href: '#/' },
    h('img', { src: '/admin/logo.png', alt: 'BUNON', width: 92, height: 29 }),
    h('span', { class: 'brand-label' }, 'প্রোডাক্ট ড্যাশবোর্ড'),
  ),
  h(
    'div',
    { class: 'topbar-right' },
    pill,
    h('a', { class: 'toplink', href: '/', target: '_blank', rel: 'noopener' }, 'প্রিভিউ ↗'),
    liveLink,
  ),
)

function toast(message, action) {
  clearTimeout(toastTimer)
  const undo = () => {
    toastBox.hidden = true
    action.onClick()
  }
  toastBox.replaceChildren(
    h('span', {}, message),
    ...(action ? [h('button', { type: 'button', onclick: undo }, action.label)] : []),
  )
  toastBox.hidden = false
  toastTimer = setTimeout(() => (toastBox.hidden = true), action ? 8000 : 4500)
}

let serverDown = false
function setServerDown(down) {
  if (down === serverDown) return
  serverDown = down
  banner.hidden = !down
  banner.textContent = 'ড্যাশবোর্ডের কালো উইন্ডোটা বন্ধ হয়ে গেছে, তাই কিছু সেভ হচ্ছে না। "BUNON Products" আবার চালু করুন — এই পাতা নিজে থেকেই আবার কাজ শুরু করবে।'
  renderPublish()
}

// ---------------------------------------------------------------- publish status

const REASONS = {
  offline: 'ইন্টারনেট নেই — নেট এলে নিজে থেকেই আবার পাঠাবে',
  login: 'GitHub এ লগইন দরকার',
  rejected: 'GitHub এর সাথে মিলছে না — সাহায্য লাগবে',
  'other-staged': 'git এ অন্য কাজ রাখা আছে — সাহায্য লাগবে',
  unknown: 'ওয়েবসাইটে পাঠানো যায়নি',
}

function setPublish(status) {
  if (!status) return
  app.publish = status
  app.clockOffset = status.now - Date.now()
  if (status.liveUrl) {
    liveLink.href = status.liveUrl
    liveLink.hidden = false
  }
  renderPublish()
}

function renderPublish() {
  const s = app.publish
  if (serverDown) {
    pill.dataset.state = 'offline'
    pill.replaceChildren(h('span', { class: 'dot' }), 'ড্যাশবোর্ড বন্ধ')
    return
  }
  if (!s) return
  const now = Date.now() + app.clockOffset
  const seconds = s.publishAt ? Math.max(0, Math.ceil((s.publishAt - now) / 1000)) : 0
  const recently = s.publishedAt && now - s.publishedAt < 3 * 60 * 1000
  const publishNow = h('button', { type: 'button', class: 'pill-btn', onclick: publishNowClicked }, 'এখনই পাঠান')

  pill.dataset.state = s.state
  if (s.state === 'scheduled') {
    pill.replaceChildren(h('span', { class: 'dot' }), `${seconds} সেকেন্ড পরে ওয়েবসাইটে যাবে`, publishNow)
  } else if (s.state === 'publishing') {
    pill.replaceChildren(h('span', { class: 'dot' }), 'ওয়েবসাইটে পাঠানো হচ্ছে…')
  } else if (s.state === 'error') {
    pill.replaceChildren(
      h('span', { class: 'dot' }),
      REASONS[s.reason] ?? REASONS.unknown,
      h('button', { type: 'button', class: 'pill-btn', onclick: publishNowClicked }, 'আবার চেষ্টা'),
    )
  } else if (recently) {
    pill.replaceChildren(h('span', { class: 'dot' }), 'পাঠানো হয়েছে ✓ ১–২ মিনিটে লাইভ সাইটে দেখা যাবে')
  } else {
    pill.replaceChildren(h('span', { class: 'dot' }), 'সব কিছু ওয়েবসাইটে আছে ✓')
  }
}

async function publishNowClicked() {
  await editor?.flush()
  try {
    setPublish((await call('POST', '/publish')).publish)
  } catch {
    toast('এখন পাঠানো গেল না')
  }
}

async function pollPublish() {
  try {
    setPublish((await call('GET', '/publish')).publish)
  } catch {
    // shown by the banner
  }
  const busy = serverDown || ['scheduled', 'publishing'].includes(app.publish?.state)
  setTimeout(pollPublish, busy ? 2000 : 8000)
}

setInterval(() => {
  if (app.publish?.state === 'scheduled' || app.publish?.state === 'published') renderPublish()
}, 1000)

// ---------------------------------------------------------------- product list

function statusOf(p) {
  const missing = [!p.photos.length && 'ছবি', !p.name.trim() && 'নাম'].filter(Boolean)
  if (missing.length) return { tone: 'warn', label: `${missing.join(' ও ')} দিলে ওয়েবসাইটে আসবে` }
  if (p.visible === false) return { tone: 'muted', label: 'লুকানো' }
  if (p.soldOut) return { tone: 'soldout', label: 'Sold out' }
  return { tone: 'live', label: 'ওয়েবসাইটে আছে' }
}

function productCard(p) {
  const status = statusOf(p)
  const meta = [p.category, price(p.price)].filter(Boolean).join(' · ')
  return h(
    'li',
    {},
    h(
      'a',
      { class: 'card', href: `#/p/${p.id}` },
      h(
        'div',
        { class: 'card-photo' },
        p.photos.length
          ? [
              h('img', { src: photoUrl(p.photos[0].file), alt: '', loading: 'lazy' }),
              p.photos.length > 1 && h('span', { class: 'card-count' }, `${p.photos.length} ছবি`),
            ]
          : 'ছবি নেই',
      ),
      h(
        'div',
        { class: 'card-body' },
        h('p', { class: p.name.trim() ? 'card-name' : 'card-name is-empty' }, p.name.trim() || 'নাম দেওয়া হয়নি'),
        meta && h('p', { class: 'card-meta' }, meta),
        h('span', { class: 'badge', 'data-tone': status.tone }, status.label),
      ),
    ),
  )
}

function renderList() {
  document.title = 'BUNON — প্রোডাক্ট ড্যাশবোর্ড'
  const products = [...app.products].sort(newestFirst)
  const live = products.filter(isLive).length

  main.replaceChildren(
    h(
      'div',
      { class: 'list-head' },
      h(
        'div',
        {},
        h('h1', {}, 'আপনার প্রোডাক্ট'),
        h(
          'p',
          { class: 'muted' },
          products.length ? `মোট ${products.length}টা প্রোডাক্ট · ${live}টা ওয়েবসাইটে দেখাচ্ছে` : 'এখনো কোনো প্রোডাক্ট নেই',
        ),
      ),
      h(
        'button',
        { type: 'button', class: 'btn btn-primary btn-lg', onclick: createProduct },
        h('span', { class: 'btn-plus', 'aria-hidden': 'true' }, '+'),
        'নতুন প্রোডাক্ট',
      ),
    ),
    products.length
      ? h('ul', { class: 'cards' }, products.map(productCard))
      : h(
          'div',
          { class: 'empty' },
          h('p', {}, 'প্রথম প্রোডাক্টটা যোগ করুন — ছবি, নাম আর দাম দিলেই ওয়েবসাইটে চলে যাবে।'),
          h('button', { type: 'button', class: 'btn btn-primary', onclick: createProduct }, '+ নতুন প্রোডাক্ট'),
        ),
  )
}

async function createProduct() {
  try {
    const { product } = await call('POST', '/products')
    app.products.push(product)
    location.hash = `#/p/${product.id}`
  } catch {
    toast('নতুন প্রোডাক্ট বানানো গেল না — আবার চেষ্টা করুন')
  }
}

// ---------------------------------------------------------------- editor

/** A label, a control and a hint. `input` is the element the label belongs to (default: the control). */
function field(label, control, hint, input = control) {
  const id = nextId('field')
  input.id = id
  return h('div', { class: 'field' }, h('label', { class: 'field-label', for: id }, label), control, hint && h('p', { class: 'hint' }, hint))
}

function group(label, content, hint) {
  const id = nextId('group')
  content.setAttribute('role', 'group')
  content.setAttribute('aria-labelledby', id)
  return h('div', { class: 'field' }, h('p', { class: 'field-label', id }, label), content, hint && h('p', { class: 'hint' }, hint))
}

/** "+ নতুন" chip that opens a small box to type a name. */
function inlineAdd(label, placeholder, onAdd) {
  const wrap = h('span', { class: 'inline-add' })
  const closed = () =>
    wrap.replaceChildren(h('button', { type: 'button', class: 'chip chip-add', onclick: open }, label))
  function open() {
    const input = h('input', { class: 'input', type: 'text', placeholder, maxlength: 30, 'aria-label': placeholder })
    const add = () => {
      const value = input.value.replace(/\s+/g, ' ').trim()
      if (value) onAdd(value)
      closed()
    }
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        add()
      } else if (event.key === 'Escape') closed()
    })
    wrap.replaceChildren(input, h('button', { type: 'button', class: 'btn', onclick: add }, 'যোগ করুন'))
    input.focus()
  }
  closed()
  return wrap
}

function createEditor(p) {
  const dirty = new Set()
  const uploads = []
  let saveTimer = null
  let queue = Promise.resolve()
  let failures = 0
  let deleted = false

  // ---- saving: a moment after each change, one request at a time
  const saveState = h('p', { class: 'save-state', role: 'status', 'data-state': 'saved' }, 'সব সেভ হয়েছে ✓')
  function showSave(state) {
    saveState.dataset.state = state
    saveState.textContent = {
      saving: 'সেভ হচ্ছে…',
      saved: 'সব সেভ হয়েছে ✓',
      error: 'সেভ করা যায়নি — আবার চেষ্টা করছি…',
    }[state]
  }

  function change(name, value, delay = 600) {
    p[name] = value
    dirty.add(name)
    showSave('saving')
    renderTitle()
    clearTimeout(saveTimer)
    saveTimer = setTimeout(flush, delay)
  }

  function flush() {
    clearTimeout(saveTimer)
    saveTimer = null
    if (!dirty.size || deleted) return queue
    const fields = [...dirty]
    dirty.clear()
    queue = queue.then(async () => {
      try {
        const body = Object.fromEntries(fields.map((name) => [name, p[name]]))
        const result = await call('PATCH', `/products/${p.id}`, body)
        // Take the server's tidied lists and stock state (text boxes keep what's typed)
        for (const name of ['colors', 'sizes', 'photos']) if (fields.includes(name) && !dirty.has(name)) p[name] = result.product[name]
        p.soldOut = result.product.soldOut
        p.updatedAt = result.product.updatedAt
        if (p.category && !app.categories.some((c) => sameText(c, p.category))) app.categories.push(p.category)
        setPublish(result.publish)
        failures = 0
        if (!dirty.size && !saveTimer) showSave('saved')
        if (fields.includes('photos')) renderPhotos()
        renderTitle()
      } catch (error) {
        if (error.status === 404) {
          toast('এই প্রোডাক্টটা আর নেই')
          return
        }
        for (const name of fields) dirty.add(name)
        failures++
        showSave('error')
        clearTimeout(saveTimer)
        saveTimer = setTimeout(flush, Math.min(30_000, 2_000 * failures))
      }
    })
    return queue
  }

  // ---- title and "is it on the website?" line
  const title = h('h1')
  const statusLine = h('div', { class: 'status-line' })
  function renderTitle() {
    title.textContent = p.name.trim() || 'নতুন প্রোডাক্ট'
    document.title = `${p.name.trim() || 'নতুন প্রোডাক্ট'} — BUNON`
    const status = statusOf(p)
    const explain = {
      warn: 'নাম আর অন্তত একটা ছবি দিলেই ওয়েবসাইটে চলে যাবে।',
      muted: 'এটা এখানে থাকবে, কিন্তু ওয়েবসাইটে দেখাবে না।',
      soldout: 'ওয়েবসাইটে দেখাবে, সাথে "Sold out" লেখা।',
      live: 'যা বদলাবেন, নিজে থেকেই ওয়েবসাইটে চলে যাবে।',
    }[status.tone]
    statusLine.replaceChildren(h('span', { class: 'badge', 'data-tone': status.tone }, status.label), explain)
  }

  // ---- photos
  const photosGrid = h('ul', { class: 'photos' })
  const fileInput = h('input', {
    type: 'file',
    accept: 'image/*',
    multiple: true,
    class: 'visually-hidden',
    onchange: (event) => {
      addFiles([...event.target.files])
      event.target.value = ''
    },
  })

  function movePhoto(from, to) {
    if (to < 0 || to >= p.photos.length) return
    const [photo] = p.photos.splice(from, 1)
    p.photos.splice(to, 0, photo)
    change('photos', p.photos, 200)
    renderPhotos()
  }

  function removePhoto(index) {
    const [photo] = p.photos.splice(index, 1)
    change('photos', p.photos, 200)
    renderPhotos()
    toast('ছবিটা সরানো হয়েছে', {
      label: 'ফিরিয়ে আনুন',
      onClick: () => {
        p.photos.splice(Math.min(index, p.photos.length), 0, photo)
        change('photos', p.photos, 200)
        renderPhotos()
      },
    })
  }

  function photoTile(photo, index) {
    const last = p.photos.length - 1
    return h(
      'li',
      { class: 'tile' },
      h(
        'div',
        { class: 'tile-img' },
        h('img', { src: photoUrl(photo.file), alt: `ছবি ${index + 1}` }),
        index === 0 && h('span', { class: 'tile-badge' }, 'কভার'),
        h(
          'div',
          { class: 'tile-tools' },
          h(
            'span',
            {},
            index > 0 &&
              h('button', { type: 'button', class: 'icon-btn', title: 'কভার বানান', 'aria-label': `ছবি ${index + 1} কভার বানান`, onclick: () => movePhoto(index, 0) }, '★'),
            h('button', { type: 'button', class: 'icon-btn', title: 'বাঁয়ে সরান', 'aria-label': `ছবি ${index + 1} বাঁয়ে সরান`, disabled: index === 0, onclick: () => movePhoto(index, index - 1) }, '‹'),
            h('button', { type: 'button', class: 'icon-btn', title: 'ডানে সরান', 'aria-label': `ছবি ${index + 1} ডানে সরান`, disabled: index === last, onclick: () => movePhoto(index, index + 1) }, '›'),
          ),
          h('button', { type: 'button', class: 'icon-btn is-danger', title: 'ছবি সরান', 'aria-label': `ছবি ${index + 1} সরান`, onclick: () => removePhoto(index) }, '×'),
        ),
      ),
      p.colors.length > 0 &&
        h(
          'label',
          { class: 'tile-color' },
          h('span', { class: 'visually-hidden' }, `ছবি ${index + 1} এর রং`),
          h(
            'select',
            {
              onchange: (event) => {
                photo.color = event.target.value
                change('photos', p.photos, 200)
              },
            },
            h('option', { value: '' }, 'সব রং'),
            p.colors.map((color) => h('option', { value: color, selected: color === photo.color }, color)),
          ),
        ),
    )
  }

  function uploadTile(job) {
    return h(
      'li',
      { class: `tile ${job.error ? 'is-error' : 'is-working'}` },
      h(
        'div',
        { class: 'tile-img' },
        h('img', { src: job.preview, alt: '' }),
        !job.error && h('span', { class: 'spinner', 'aria-hidden': 'true' }),
        h('p', { class: 'tile-note' }, job.error ?? 'আপলোড হচ্ছে…'),
        job.error &&
          h('div', { class: 'tile-tools' }, h('span'), h('button', {
            type: 'button',
            class: 'icon-btn is-danger',
            'aria-label': 'বাদ দিন',
            onclick: () => {
              uploads.splice(uploads.indexOf(job), 1)
              URL.revokeObjectURL(job.preview)
              renderPhotos()
            },
          }, '×')),
      ),
    )
  }

  function renderPhotos() {
    photosGrid.replaceChildren(...p.photos.map(photoTile), ...uploads.map(uploadTile))
    photosGrid.hidden = p.photos.length === 0 && uploads.length === 0
  }

  async function addFiles(files) {
    const images = files.filter((file) => file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file.name))
    if (images.length < files.length) toast('শুধু ছবির ফাইল দেওয়া যাবে')
    const jobs = images.map((file) => ({ file, preview: URL.createObjectURL(file), error: null }))
    uploads.push(...jobs)
    renderPhotos()
    for (const job of jobs) {
      try {
        const { file } = await call('POST', '/photos', await toJpeg(job.file))
        if (!p.photos.some((photo) => photo.file === file)) p.photos.push({ file, color: '' })
        uploads.splice(uploads.indexOf(job), 1)
        URL.revokeObjectURL(job.preview)
        change('photos', p.photos, 0)
      } catch (error) {
        job.error = error.message === 'decode' ? 'এই ছবি খোলা যাচ্ছে না — JPG বা PNG দিন' : 'আপলোড হয়নি'
      }
      renderPhotos()
    }
  }

  const photosPanel = h(
    'section',
    { class: 'panel photos-panel', 'aria-label': 'ছবি' },
    h(
      'div',
      { class: 'panel-head' },
      h('h2', {}, 'ছবি'),
      h('p', { class: 'hint' }, 'প্রথম ছবিটা কভার হিসেবে দেখাবে। যত খুশি ছবি দিন। ★ চাপলে সেই ছবি কভার হবে।'),
    ),
    photosGrid,
    h(
      'label',
      { class: 'dropzone' },
      fileInput,
      h('span', { class: 'dropzone-icon', 'aria-hidden': 'true' }, '+'),
      h('span', {}, h('strong', {}, 'ছবি যোগ করুন'), h('span', { class: 'hint' }, 'এখানে চাপুন, অথবা ছবি টেনে এনে ছেড়ে দিন — একসাথে অনেকগুলো দেওয়া যায়')),
    ),
  )
  photosPanel.addEventListener('dragover', (event) => {
    event.preventDefault()
    photosPanel.classList.add('is-dragging')
  })
  photosPanel.addEventListener('dragleave', (event) => {
    if (!photosPanel.contains(event.relatedTarget)) photosPanel.classList.remove('is-dragging')
  })
  photosPanel.addEventListener('drop', (event) => {
    event.preventDefault()
    photosPanel.classList.remove('is-dragging')
    addFiles([...event.dataTransfer.files])
  })

  // ---- category
  const categoryChips = h('div', { class: 'chips' })
  function renderCategories() {
    categoryChips.replaceChildren(
      ...app.categories.map((name) =>
        h('button', {
          type: 'button',
          class: 'chip',
          'aria-pressed': String(sameText(p.category, name)),
          onclick: () => {
            change('category', name)
            renderCategories()
          },
        }, name),
      ),
      inlineAdd('+ নতুন ক্যাটাগরি', 'যেমন: Polo', async (name) => {
        const existing = app.categories.find((c) => sameText(c, name))
        if (!existing) {
          try {
            app.categories = (await call('POST', '/categories', { name })).categories
          } catch {
            toast('ক্যাটাগরি যোগ করা গেল না')
            return
          }
        }
        change('category', existing ?? name)
        renderCategories()
      }),
    )
  }

  // ---- colours
  const colorChips = h('div', { class: 'chips' })
  function toggleColor(name, on) {
    const has = p.colors.some((c) => sameText(c, name))
    if (on && !has) p.colors = [...p.colors, name]
    if (!on) {
      p.colors = p.colors.filter((c) => !sameText(c, name))
      // photos of that colour now belong to all colours
      const tagged = p.photos.filter((photo) => sameText(photo.color, name))
      for (const photo of tagged) photo.color = ''
      if (tagged.length) change('photos', p.photos)
    }
    change('colors', p.colors)
    renderColors()
    renderPhotos()
  }
  function colorChip(name, hex) {
    const on = p.colors.some((c) => sameText(c, name))
    return h(
      'button',
      { type: 'button', class: 'chip', 'aria-pressed': String(on), onclick: () => toggleColor(name, !on) },
      h('span', { class: 'swatch', 'aria-hidden': 'true', vars: hex ? { '--swatch': hex } : null, 'data-empty': !hex }),
      name,
    )
  }
  function renderColors() {
    const custom = p.colors.filter((c) => !app.colors.some((preset) => sameText(preset.name, c)))
    colorChips.replaceChildren(
      ...app.colors.map((c) => colorChip(c.name, c.hex)),
      ...custom.map((name) => colorChip(name, null)),
      inlineAdd('+ অন্য রং', 'যেমন: Rust', (name) => toggleColor(name, true)),
    )
  }

  // ---- sizes
  const sizeChips = h('div', { class: 'chips' })
  function toggleSize(name, on) {
    p.sizes = on ? [...p.sizes.filter((s) => !sameText(s, name)), name] : p.sizes.filter((s) => !sameText(s, name))
    change('sizes', p.sizes)
    renderSizes()
  }
  function renderSizes() {
    const custom = p.sizes.filter((s) => !app.sizes.some((preset) => sameText(preset, s)))
    sizeChips.replaceChildren(
      ...[...app.sizes, ...custom].map((name) => {
        const on = p.sizes.some((s) => sameText(s, name))
        return h('button', { type: 'button', class: 'chip', 'aria-pressed': String(on), onclick: () => toggleSize(name, !on) }, name)
      }),
      inlineAdd('+ অন্য সাইজ', 'যেমন: 42', (name) => toggleSize(name, true)),
    )
  }

  // ---- delete
  const dangerZone = h('div', { class: 'danger-zone' })
  function renderDanger(confirming) {
    dangerZone.replaceChildren(
      confirming
        ? h(
            'div',
            { class: 'confirm' },
            h('p', {}, 'সত্যিই এই প্রোডাক্টটা মুছে ফেলবেন? ওয়েবসাইট থেকেও চলে যাবে।'),
            h(
              'div',
              { class: 'confirm-row' },
              h('button', { type: 'button', class: 'btn btn-danger', onclick: deleteProduct }, 'হ্যাঁ, মুছে ফেলুন'),
              h('button', { type: 'button', class: 'btn', onclick: () => renderDanger(false) }, 'না, থাক'),
            ),
          )
        : h('button', { type: 'button', class: 'link-danger', onclick: () => renderDanger(true) }, 'এই প্রোডাক্ট মুছে ফেলুন'),
    )
  }
  async function deleteProduct() {
    clearTimeout(saveTimer)
    dirty.clear()
    await queue
    try {
      const result = await call('DELETE', `/products/${p.id}`)
      setPublish(result.publish)
    } catch (error) {
      if (error.status !== 404) {
        toast('মুছে ফেলা গেল না — আবার চেষ্টা করুন')
        return
      }
    }
    deleted = true
    app.products = app.products.filter((x) => x.id !== p.id)
    toast('প্রোডাক্টটা মুছে ফেলা হয়েছে')
    location.hash = '#/'
  }

  // ---- the form
  const nameInput = h('input', {
    class: 'input',
    type: 'text',
    value: p.name,
    maxlength: 80,
    autocomplete: 'off',
    placeholder: 'যেমন: The Journey Hoodie',
    oninput: (event) => change('name', event.target.value),
  })

  const numberBox = (name, placeholder) =>
    h('input', {
      class: 'input',
      type: 'number',
      inputmode: 'numeric',
      min: '0',
      step: '1',
      value: p[name] ?? '',
      placeholder,
      oninput: (event) => change(name, event.target.value === '' ? null : Number(event.target.value)),
    })
  const priceInput = numberBox('price', 'যেমন: 1450')

  const details = h(
    'section',
    { class: 'panel', 'aria-label': 'প্রোডাক্টের তথ্য' },
    h(
      'div',
      { class: 'fields' },
      field('নাম', nameInput, 'ওয়েবসাইটে এই নামটাই দেখাবে।'),
      group('ক্যাটাগরি', categoryChips),
      h(
        'div',
        { class: 'row-2' },
        field(
          'দাম',
          h('div', { class: 'money' }, h('span', { 'aria-hidden': 'true' }, '৳'), priceInput),
          'খালি রাখলে ওয়েবসাইটে লেখা থাকবে "Price on request"।',
          priceInput,
        ),
        field('স্টক (কয়টা আছে)', numberBox('quantity', 'যেমন: 10'), '0 দিলে ওয়েবসাইটে "Sold out" দেখাবে। সংখ্যাটা শুধু এই কম্পিউটারে থাকে, ওয়েবসাইটে দেখায় না।'),
      ),
      group('রং', colorChips, 'যেকটা রং আছে সবগুলো বেছে নিন।'),
      group('সাইজ', sizeChips),
      field(
        h('span', {}, 'বিবরণ', h('small', {}, '(ইচ্ছা হলে)')),
        h('textarea', {
          class: 'textarea',
          rows: 4,
          maxlength: 2000,
          placeholder: 'যেমন: Premium cotton fleece, hand-embroidered back design.',
          oninput: (event) => change('description', event.target.value),
        }, p.description),
        'ওয়েবসাইটে প্রোডাক্টের নিচে দেখাবে।',
      ),
      h(
        'div',
        { class: 'field' },
        h(
          'label',
          { class: 'switch' },
          h('input', {
            type: 'checkbox',
            role: 'switch',
            checked: p.visible !== false,
            onchange: (event) => change('visible', event.target.checked),
          }),
          h('span', { class: 'switch-track', 'aria-hidden': 'true' }),
          h('span', {}, 'ওয়েবসাইটে দেখান'),
        ),
        h('p', { class: 'hint' }, 'বন্ধ করলে প্রোডাক্টটা এখানে থাকবে, কিন্তু ওয়েবসাইটে দেখাবে না।'),
      ),
      dangerZone,
    ),
  )

  const element = h(
    'div',
    { class: 'editor' },
    h('div', { class: 'editor-bar' }, h('a', { class: 'back', href: '#/' }, '← সব প্রোডাক্ট'), saveState),
    h('div', { class: 'editor-title' }, title, statusLine),
    h('div', { class: 'editor-grid' }, photosPanel, details),
  )

  renderTitle()
  renderPhotos()
  renderCategories()
  renderColors()
  renderSizes()
  renderDanger(false)

  const isUntouched = () =>
    !p.name.trim() &&
    !p.photos.length &&
    p.price == null &&
    p.quantity == null &&
    !p.colors.length &&
    !p.sizes.length &&
    !p.description.trim() &&
    !uploads.length

  return {
    element,
    flush,
    focusFirst: () => main.focus({ preventScroll: true }),
    hasUnsaved: () => dirty.size > 0 || uploads.some((job) => !job.error),
    /** Leaving the page: send what's left without waiting. */
    sendNow() {
      if (!dirty.size || deleted) return
      const body = Object.fromEntries([...dirty].map((name) => [name, p[name]]))
      dirty.clear()
      call('PATCH', `/products/${p.id}`, body, { keepalive: true }).catch(() => {})
    },
    /** Leaving the editor: save, and drop a new product nothing was filled in for. */
    async close() {
      if (deleted) return
      await flush()
      if (isUntouched()) {
        await call('DELETE', `/products/${p.id}`).catch(() => {})
        app.products = app.products.filter((x) => x.id !== p.id)
      }
    },
  }
}

// ---------------------------------------------------------------- routing

async function route() {
  const previous = editor
  editor = null
  await previous?.close()

  const match = /^#\/p\/([a-z0-9-]+)$/.exec(location.hash)
  const product = match && app.products.find((p) => p.id === match[1])
  if (match && !product) {
    toast('প্রোডাক্টটা পাওয়া যায়নি')
    location.hash = '#/'
    return
  }
  if (product) {
    editor = createEditor(product)
    main.replaceChildren(editor.element)
    editor.focusFirst()
  } else {
    renderList()
  }
  window.scrollTo(0, 0)
}

window.addEventListener('hashchange', route)
window.addEventListener('pagehide', () => editor?.sendNow())
window.addEventListener('beforeunload', (event) => {
  if (editor?.hasUnsaved()) event.preventDefault()
})
// A photo dropped outside the photo area shouldn't open in the browser
window.addEventListener('dragover', (event) => event.preventDefault())
window.addEventListener('drop', (event) => event.preventDefault())

async function start() {
  root.replaceChildren(topbar, banner, main, toastBox)
  try {
    const state = await call('GET', '/state')
    Object.assign(app, { products: state.products, categories: state.categories, colors: state.colors, sizes: state.sizes })
    setPublish(state.publish)
  } catch {
    main.replaceChildren(h('p', { class: 'loading' }, 'ড্যাশবোর্ড চালু হয়নি। "BUNON Products" আবার চালু করে এই পাতা রিফ্রেশ করুন।'))
    return
  }
  await route()
  pollPublish()
}

start()

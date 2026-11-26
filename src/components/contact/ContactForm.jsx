import { useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { site } from '@/config/site'
import { useEnquiryActions, useEnquiryDraft } from '@/context/enquiry/useEnquiry'
import { cx } from '@/lib/cx'
import { prefersReducedMotion } from '@/lib/scroll'
import { sendEnquiry, validateEnquiry } from '@/services/enquiry'
import styles from './ContactForm.module.css'

const FIELDS = [
  { name: 'name', label: 'Name', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'message', label: 'Message', multiline: true },
]

const SENT = 'Thank you — your message has been sent. We’ll be in touch soon.'

export default function ContactForm() {
  const draft = useEnquiryDraft()
  const { update, clearTopic, reset } = useEnquiryActions()
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const formRef = useRef(null)
  const honeypotRef = useRef(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    update(name, value)
    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current }
        delete next[name]
        return next
      })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const found = validateEnquiry(draft)
    setErrors(found)
    const firstInvalid = FIELDS.find((field) => found[field.name])
    if (firstInvalid) {
      // Centre the whole field (label, input, error) so the header can't cover it
      const input = formRef.current?.elements.namedItem(firstInvalid.name)
      input?.focus({ preventScroll: true })
      input?.parentElement.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      setStatus({ state: 'error', message: 'Please check the highlighted fields.' })
      return
    }

    // Only bots fill the hidden field — pretend it worked and drop it
    if (honeypotRef.current?.value) {
      reset()
      setStatus({ state: 'success', message: SENT })
      return
    }

    setStatus({ state: 'sending', message: 'Sending…' })
    try {
      const result = await sendEnquiry(draft)
      if (result.method === 'email') {
        window.location.href = result.href
        setStatus({
          state: 'success',
          message: `Opening your email app… If nothing happens, email us at ${site.contact.email}.`,
        })
      } else {
        reset()
        setStatus({ state: 'success', message: SENT })
      }
    } catch {
      setStatus({
        state: 'error',
        message: site.contact.email
          ? `Sorry, that didn’t go through. Please email us at ${site.contact.email}.`
          : 'Sorry, that didn’t go through. Please try again later.',
      })
    }
  }

  return (
    <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate aria-describedby="form-status">
      {draft.topic && (
        <div className={styles.topic}>
          <span className={styles.topicLabel}>Regarding</span>
          <span className={styles.topicValue}>{draft.topic}</span>
          <button
            type="button"
            className={styles.topicClear}
            onClick={clearTopic}
            aria-label={`Remove topic: ${draft.topic}`}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}

      {FIELDS.map((field) => {
        const id = `contact-${field.name}`
        const error = errors[field.name]
        const Control = field.multiline ? 'textarea' : 'input'
        return (
          <div key={field.name} className={cx(styles.field, error && styles.isInvalid)}>
            <label htmlFor={id}>{field.label}</label>
            <Control
              id={id}
              name={field.name}
              type={field.type}
              rows={field.multiline ? 5 : undefined}
              autoComplete={field.autoComplete}
              value={draft[field.name]}
              onChange={handleChange}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && (
              <p id={`${id}-error`} className={styles.fieldError}>
                {error}
              </p>
            )}
          </div>
        )
      })}

      {/* Spam trap: hidden from people, tempting to bots */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor="contact-website">Leave this empty</label>
        <input ref={honeypotRef} id="contact-website" type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" className={styles.submit} disabled={status.state === 'sending'}>
        {status.state === 'sending' ? 'Sending…' : 'Send message'}
      </Button>

      <output id="form-status" className={styles.status} data-state={status.state} aria-live="polite">
        {status.message}
      </output>
    </form>
  )
}

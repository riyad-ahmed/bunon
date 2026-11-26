import { useMemo, useReducer } from 'react'
import { scrollToSection } from '@/lib/scroll'
import { buildEnquiryMessage, emptyEnquiry } from '@/services/enquiry'
import { EnquiryActionsContext, EnquiryDraftContext } from './enquiryContext'

function enquiryReducer(state, action) {
  switch (action.type) {
    case 'update':
      return { ...state, [action.field]: action.value }
    case 'start':
      return { ...state, topic: action.topic, message: action.message }
    case 'clearTopic':
      return { ...state, topic: '' }
    case 'reset':
      return emptyEnquiry
    default:
      return state
  }
}

/**
 * Holds the contact-form draft so any part of the site (product cards,
 * the product detail view, the bag) can start an enquiry about a product.
 */
export default function EnquiryProvider({ children }) {
  const [draft, dispatch] = useReducer(enquiryReducer, emptyEnquiry)

  const actions = useMemo(
    () => ({
      update: (field, value) => dispatch({ type: 'update', field, value }),
      clearTopic: () => dispatch({ type: 'clearTopic' }),
      reset: () => dispatch({ type: 'reset' }),

      /** Pre-fill the form about one or more products, then bring it into view. */
      enquireAbout: (items) => {
        const names = [items].flat().filter(Boolean).map((item) => item.name)
        dispatch({ type: 'start', topic: names.join(', '), message: buildEnquiryMessage(names) })
        scrollToSection('contact', { focusId: 'contact-title' })
      },
    }),
    [],
  )

  return (
    <EnquiryActionsContext.Provider value={actions}>
      <EnquiryDraftContext.Provider value={draft}>{children}</EnquiryDraftContext.Provider>
    </EnquiryActionsContext.Provider>
  )
}

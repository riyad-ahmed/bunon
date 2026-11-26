import { useContext } from 'react'
import { EnquiryActionsContext, EnquiryDraftContext } from './enquiryContext'

/** The current contact-form draft (re-renders as the visitor types). */
export function useEnquiryDraft() {
  const draft = useContext(EnquiryDraftContext)
  if (draft === null) throw new Error('useEnquiryDraft must be used inside <EnquiryProvider>')
  return draft
}

/** Enquiry actions. Stable — using these never causes re-renders. */
export function useEnquiryActions() {
  const actions = useContext(EnquiryActionsContext)
  if (actions === null) throw new Error('useEnquiryActions must be used inside <EnquiryProvider>')
  return actions
}

import { createContext } from 'react'

/** The contact-form draft: { name, email, message, topic } */
export const EnquiryDraftContext = createContext(null)

/** Stable actions: update, clearTopic, reset, enquireAbout */
export const EnquiryActionsContext = createContext(null)

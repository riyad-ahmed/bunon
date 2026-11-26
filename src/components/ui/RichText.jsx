// *words in asterisks* → gold italics; runs of Bangla script → lang="bn"
const PATTERN = /(\*[^*]+\*|[ঀ-৿]+(?:\s+[ঀ-৿]+)*)/

/** Renders a line of text from src/content/copy.js with its light formatting. */
export default function RichText({ text }) {
  const parts = text.split(PATTERN)

  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 0) return part
        if (part.startsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
        return (
          <span key={index} lang="bn">
            {part}
          </span>
        )
      })}
    </>
  )
}

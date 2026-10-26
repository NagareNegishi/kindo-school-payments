import type { HTMLAttributes } from 'react'

type Tone = 'default' | 'success'

interface Props extends HTMLAttributes<HTMLElement> {
  /** Element to render, so a card can be a landmark such as a section or article. */
  as?: 'div' | 'section' | 'article'
  tone?: Tone
}

const tones: Record<Tone, string> = {
  default: 'border-gray-200',
  success: 'border-green-200',
}

/** White bordered panel for a block of content. */
export default function Card({
  as: Tag = 'div',
  tone = 'default',
  className = '',
  ...rest
}: Props) {
  return (
    <Tag
      className={`rounded-lg border bg-white p-4 shadow-sm sm:p-6 ${tones[tone]} ${className}`.trim()}
      {...rest}
    />
  )
}

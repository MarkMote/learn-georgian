// app/review/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Review Georgian Words',
  description: 'Review and practice Georgian vocabulary with spaced repetition flashcards. Track your progress and master words efficiently.',
  openGraph: {
    title: 'Review Georgian Words | Learn Georgian',
    description: 'Review and practice Georgian vocabulary with spaced repetition flashcards. Track your progress and master words efficiently.',
  },
}

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

// app/about/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn how this free Georgian language learning app works. Spaced repetition flashcards with images, examples, and AI-powered lessons.',
  openGraph: {
    title: 'About | Learn Georgian',
    description: 'Learn how this free Georgian language learning app works. Spaced repetition flashcards with images, examples, and AI-powered lessons.',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

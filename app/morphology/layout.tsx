// app/morphology/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Georgian Morphology',
  description: 'Learn Georgian grammar patterns and morphology. Practice verb conjugations, noun cases, and word formation with spaced repetition flashcards.',
  openGraph: {
    title: 'Georgian Morphology | Learn Georgian',
    description: 'Learn Georgian grammar patterns and morphology. Practice verb conjugations, noun cases, and word formation with spaced repetition flashcards.',
  },
}

export default function MorphologyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

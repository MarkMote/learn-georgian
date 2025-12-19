// app/alphabet/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Georgian Alphabet',
  description: 'Learn the 33 letters of the Georgian alphabet (Mkhedruli). Interactive flashcard practice with pronunciation guides, IPA symbols, and examples.',
  openGraph: {
    title: 'Georgian Alphabet | Learn Georgian',
    description: 'Learn the 33 letters of the Georgian alphabet (Mkhedruli). Interactive flashcard practice with pronunciation guides, IPA symbols, and examples.',
  },
}

export default function AlphabetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

// app/structure/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sentence Structure',
  description: 'Learn Georgian sentence patterns through semantic frames. Master how to construct sentences with common grammatical structures.',
  openGraph: {
    title: 'Sentence Structure | Learn Georgian',
    description: 'Learn Georgian sentence patterns through semantic frames. Master how to construct sentences with common grammatical structures.',
  },
}

export default function StructureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

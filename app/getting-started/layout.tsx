// app/getting-started/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Getting Started',
  description: 'How to use this free Georgian vocabulary app. Learn your first 2,000 Georgian words with spaced repetition, images, and example sentences.',
  openGraph: {
    title: 'Getting Started | Learn Georgian',
    description: 'How to use this free Georgian vocabulary app. Learn your first 2,000 Georgian words with spaced repetition, images, and example sentences.',
  },
}

export default function GettingStartedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

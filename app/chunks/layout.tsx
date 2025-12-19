// app/chunks/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Georgian Phrases',
  description: 'Learn common Georgian word combinations and phrases. Practice the most frequently used 2-4 word chunks from real Georgian text.',
  openGraph: {
    title: 'Georgian Phrases | Learn Georgian',
    description: 'Learn common Georgian word combinations and phrases. Practice the most frequently used 2-4 word chunks from real Georgian text.',
  },
}

export default function ChunksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

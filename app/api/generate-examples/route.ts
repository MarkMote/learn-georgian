import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      temperature: 0.7,
      messages: [{
        role: "user",
        content: prompt
      }]
    })

    // Parse the response to extract the examples
    const content = message.content[0].text
    let examples
    try {
      // Try to parse the entire response as JSON first
      examples = JSON.parse(content)
    } catch {
      // If that fails, try to extract JSON objects from the text
      const jsonMatches = content.match(/\{[^}]+\}/g)
      if (jsonMatches) {
        examples = jsonMatches.map(match => JSON.parse(match))
      } else {
        throw new Error('Could not parse examples from response')
      }
    }

    return NextResponse.json({ examples })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate examples' },
      { status: 500 }
    )
  }
}
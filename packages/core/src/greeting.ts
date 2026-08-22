export interface GreetingInput {
  platform: string
}

export function buildGreeting({ platform }: GreetingInput): string {
  const name = platform.trim()
  return name.length > 0 ? `Hello world from ${name}` : 'Hello world from an unknown platform'
}

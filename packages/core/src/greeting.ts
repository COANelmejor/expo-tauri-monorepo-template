export interface GreetingInput {
  platform: string
}

export function buildGreeting({ platform }: GreetingInput): string {
  const name = platform.trim()
  return name.length > 0
    ? `Hola mundo desde ${name}`
    : 'Hola mundo desde una plataforma desconocida'
}

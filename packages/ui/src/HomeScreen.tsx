import { buildGreeting } from '@app/core'
import { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'

export function HomeScreen() {
  const [count, setCount] = useState(0)
  const greeting = buildGreeting({ platform: Platform.OS })

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.counter}>Contador: {count}</Text>
      <Pressable style={styles.button} onPress={() => setCount((value) => value + 1)}>
        <Text style={styles.buttonLabel}>Incrementar</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#0b1120',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'center',
  },
  counter: {
    fontSize: 16,
    color: '#94a3b8',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
})

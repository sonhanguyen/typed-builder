#!/usr/bin/env node
import { ShellWorker } from './index.js'

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'
const agentId = process.env.AGENT_ID || `shell-agent-${Date.now()}`

console.log(`Starting Shell Agent Worker with ID: ${agentId}`)
console.log(`Connecting to server: ${serverUrl}`)

const worker = new ShellWorker(agentId, serverUrl)

worker.connect()

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...')
  worker.disconnect()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...')
  worker.disconnect()
  process.exit(0)
})
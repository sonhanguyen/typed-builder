import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Router } from './router.js'
import { Supervisor } from './supervisor.js'
import { Task } from '../../types'

const app = express()
const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

app.use(express.json())

const router = new Router()
const supervisor = new Supervisor(router, io)

// API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/agents', (req, res) => {
  res.json({
    registeredAgents: router.getRegisteredAgents(),
    connectedWorkers: supervisor.getConnectedWorkers()
  })
})

app.post('/tasks', (req, res) => {
  const task: Task = req.body
  
  if (!task.id || !task.executor || !task.params) {
    return res.status(400).json({ error: 'Invalid task format' })
  }
  
  console.log('Received task via API:', task)
  router.enqueueTask(task)
  
  res.json({ success: true, taskId: task.id })
})

app.get('/tasks/:id', (req, res) => {
  const taskId = req.params.id
  const result = router.getTaskResult(taskId)
  
  if (!result) {
    return res.status(404).json({ error: 'Task not found' })
  }
  
  res.json(result)
})

app.get('/queue/status', (req, res) => {
  res.json({
    queueSize: router.getTaskQueueSize(),
    isEmpty: router.isTaskQueueEmpty()
  })
})

// Set up result logging
router.onResult((result) => {
  console.log('Task completed:', result.id, result.result)
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log(`Router server running on port ${PORT}`)
  console.log('Endpoints:')
  console.log('  GET  /health - Health check')
  console.log('  GET  /agents - List registered agents')
  console.log('  POST /tasks - Submit a new task')
  console.log('  GET  /tasks/:id - Get task result')
  console.log('  GET  /queue/status - Get queue status')
})

export { router, supervisor }
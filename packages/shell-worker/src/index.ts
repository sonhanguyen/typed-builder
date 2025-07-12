import { io, Socket } from 'socket.io-client'
import { Task, TaskResult, Agent, Executor } from '../../../types'

export class Shell implements Executor {
  readonly type = 'shell'
  
  async run(params: { command: string }): Promise<string> {
    const { spawn } = await import('child_process')
    
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', params.command], {
        stdio: 'pipe'
      })
      
      let stdout = ''
      let stderr = ''
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`))
        }
      })
      
      child.on('error', (error) => {
        reject(error)
      })
    })
  }
}

export class ShellWorker implements Agent {
  readonly meta: { type: string }
  readonly id: string
  
  private socket: Socket
  private executor: Executor
  private resultEmitter?: (result: Task | TaskResult) => void
  private taskResults = new Map<string, TaskResult>()

  constructor(id: string, serverUrl: string) {
    this.id = id
    this.meta = { type: 'shell' }
    this.executor = new Shell()
    this.socket = io(serverUrl)
    
    this.setupSocketHandlers()
  }

  private setupSocketHandlers(): void {
    this.socket.on('connect', () => {
      console.log('Connected to server')
      // Register with server
      this.socket.emit('register-worker', {
        id: this.id,
        meta: this.meta
      })
    })
    
    this.socket.on('registration-ack', (data) => {
      console.log('Registration acknowledged:', data)
    })
    
    this.socket.on('task', (task: Task) => {
      console.log('Received task:', task)
      this.processTask(task)
    })
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server')
    })
  }

  on(listener: (result: Task | TaskResult) => void): void {
    this.resultEmitter = listener
  }

  emit(taskOrResult: Task | TaskResult): void {
    if (this.isTask(taskOrResult)) {
      this.processTask(taskOrResult)
    } else {
      // Send result to server
      this.socket.emit('task-result', taskOrResult)
    }
  }

  private isTask(item: Task | TaskResult): item is Task {
    return 'executor' in item && 'params' in item
  }

  private async processTask(task: Task): Promise<void> {
    const start = new Date()
    
    try {
      console.log(`Processing task ${task.id}:`, task.params)
      const response = await this.executor.run(task.params)
      
      const result: TaskResult = {
        result: { data: response },
        start,
        end: new Date(),
        id: task.id
      }
      
      this.taskResults.set(task.id, result)
      this.socket.emit('task-result', result)
      
      if (this.resultEmitter) {
        this.resultEmitter(result)
      }
    } catch (error) {
      const result: TaskResult = {
        result: { error },
        start,
        end: new Date(),
        id: task.id
      }
      
      this.taskResults.set(task.id, result)
      this.socket.emit('task-result', result)
      
      if (this.resultEmitter) {
        this.resultEmitter(result)
      }
    }
  }

  connect(): void {
    this.socket.connect()
  }

  disconnect(): void {
    this.socket.disconnect()
  }
}
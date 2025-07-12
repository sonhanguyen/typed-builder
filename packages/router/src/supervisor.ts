import { Server as SocketIOServer, Socket } from 'socket.io'
import { Router } from './router.js'
import { AgentProxy } from './agent-proxy.js'

export class Supervisor {
  private router: Router
  private io: SocketIOServer
  private agentProxies = new Map<string, AgentProxy>()

  constructor(router: Router, io: SocketIOServer) {
    this.router = router
    this.io = io
    
    this.setupConnectionHandlers()
  }

  private setupConnectionHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('Worker connected:', socket.id)
      
      // Listen for worker registration
      socket.on('register-worker', (workerInfo: { id: string, meta: { type: string } }) => {
        console.log('Registering worker:', workerInfo)
        
        // Create AgentProxy for this worker
        const agentProxy = new AgentProxy(workerInfo.id, workerInfo.meta, socket)
        
        // Store the proxy
        this.agentProxies.set(workerInfo.id, agentProxy)
        
        // Register with router
        this.router.registerAgent(agentProxy)
        
        // Acknowledge registration
        socket.emit('registration-ack', { success: true })
      })
      
      socket.on('disconnect', () => {
        console.log('Worker disconnected:', socket.id)
        
        // Find and remove the associated agent proxy
        for (const [id, proxy] of this.agentProxies.entries()) {
          if (proxy.socket === socket) {
            console.log(`Removing agent proxy for worker: ${id}`)
            this.agentProxies.delete(id)
            this.router.unregisterAgent(proxy.meta.type)
            break
          }
        }
      })
    })
  }

  getAgentProxy(id: string): AgentProxy | undefined {
    return this.agentProxies.get(id)
  }

  getConnectedWorkers(): string[] {
    return Array.from(this.agentProxies.keys())
  }
}
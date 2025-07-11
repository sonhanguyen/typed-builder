# One Resource Per Worker: Analysis & Trade-offs

## The One-to-One Model

### Simplified Design
```typescript
// Simplified: One resource per worker
interface Worker<ResourceType extends Resource = Resource> {
  id: string
  name: string
  resource: ResourceType  // Single resource instead of array
  
  canExecute(task: Task): boolean
  execute<T extends Task>(task: T): Promise<Awaited<ReturnType<T['run']>>>
}

// Example implementation
class BrowserWorker implements Worker<BrowserResource> {
  id: string
  name: string
  resource: BrowserResource
  
  constructor(id: string, resource: BrowserResource) {
    this.id = id
    this.name = `Browser Worker ${id}`
    this.resource = resource
  }
  
  canExecute(task: Task): boolean {
    return task.resourceRequirements.some(req => 
      req.type === 'browser' && 
      this.resource.status === 'available'
    )
  }
  
  async execute<T extends Task>(task: T): Promise<Awaited<ReturnType<T['run']>>> {
    if (this.resource.status !== 'available') {
      throw new Error('Resource is not available')
    }
    
    this.resource.status = 'busy'
    
    try {
      // Execute task using the single resource
      return await this.executeWithResource(task)
    } finally {
      this.resource.status = 'available'
    }
  }
}
```

## Benefits of One-to-One Model

### 1. **Simplified Architecture**
```typescript
// Cleaner resource management
class WorkerPool {
  private workers: Worker[] = []
  
  findWorker(task: Task): Worker | null {
    return this.workers.find(worker => 
      worker.canExecute(task) && 
      worker.resource.status === 'available'
    )
  }
  
  // No need to track which specific resource within worker
  async executeTask(task: Task): Promise<any> {
    const worker = this.findWorker(task)
    if (!worker) throw new Error('No available worker')
    
    return worker.execute(task)
  }
}
```

### 2. **Clearer Ownership**
- Each worker has exclusive control over its resource
- No coordination needed between workers for resource access
- Resource lifecycle directly tied to worker lifecycle

### 3. **Easier Scaling**
```typescript
// Simple horizontal scaling
class WorkerManager {
  async scaleUp(resourceType: string, count: number) {
    for (let i = 0; i < count; i++) {
      const resource = await this.createResource(resourceType)
      const worker = this.createWorker(resource)
      this.workerPool.addWorker(worker)
    }
  }
  
  async scaleDown(resourceType: string, count: number) {
    const workers = this.workerPool.getWorkersByType(resourceType)
    for (let i = 0; i < count && i < workers.length; i++) {
      const worker = workers[i]
      await worker.shutdown()
      this.workerPool.removeWorker(worker.id)
    }
  }
}
```

### 4. **Better Error Isolation**
- Resource failures only affect one worker
- Easier to identify and recover from resource-specific issues
- No cascading failures across multiple resources

## Risks & Limitations

### 1. **Resource Underutilization**
```typescript
// Problem: Expensive resources sitting idle
class ExpensiveGPUWorker implements Worker<GPUResource> {
  resource: GPUResource // $1000/hour GPU sitting idle between tasks
  
  async execute(task: Task): Promise<any> {
    // Task takes 30 seconds, GPU idle for remaining 59.5 minutes
    return await this.runMLModel(task)
  }
}

// Solution: Multiple workers sharing expensive resources
class SharedGPUWorker implements Worker<GPUResource> {
  resources: GPUResource[] // Multiple workers can use same GPU
  
  async execute(task: Task): Promise<any> {
    // Better utilization through resource pooling
    const gpu = await this.acquireGPU()
    try {
      return await this.runMLModel(task, gpu)
    } finally {
      this.releaseGPU(gpu)
    }
  }
}
```

### 2. **Inefficient Resource Management**
```typescript
// Problem: Browser worker needs both browser AND proxy
class WebScrapingTask implements Task {
  resourceRequirements = [
    { type: 'browser' },
    { type: 'proxy' }  // Also needs proxy for IP rotation
  ]
}

// One-to-one model forces awkward workarounds
class BrowserWorker implements Worker<BrowserResource> {
  resource: BrowserResource
  
  async execute(task: WebScrapingTask): Promise<any> {
    // How do we get proxy? 
    // Option 1: Embed proxy in browser resource (tight coupling)
    // Option 2: External proxy service (breaks encapsulation)
    // Option 3: Can't handle this task (reduced capability)
  }
}

// Multi-resource model handles this naturally
class WebScrapingWorker implements Worker<BrowserResource | ProxyResource> {
  resources: (BrowserResource | ProxyResource)[]
  
  async execute(task: WebScrapingTask): Promise<any> {
    const browser = this.resources.find(r => r.type === 'browser')
    const proxy = this.resources.find(r => r.type === 'proxy')
    
    if (!browser || !proxy) {
      throw new Error('Missing required resources')
    }
    
    // Use both resources together
    return await this.scrapeWithProxy(browser, proxy, task)
  }
}
```

### 3. **Limited Task Complexity**
```typescript
// Problem: Complex tasks need multiple resource types
class DataAnalysisTask implements Task {
  resourceRequirements = [
    { type: 'database' },    // Read data
    { type: 'compute' },     // Process data  
    { type: 'storage' }      // Store results
  ]
}

// One-to-one model can't handle this elegantly
// Must either:
// 1. Create a "super resource" that contains all three (violates SRP)
// 2. Break task into multiple smaller tasks (loses atomicity)
// 3. Use external services (breaks encapsulation)
```

### 4. **Scheduling Inefficiencies**
```typescript
// Problem: Load balancing across similar resources
class LoadBalancingExample {
  // With one-to-one: Need separate workers for each CPU core
  cpuWorkers: CPUWorker[] = [
    new CPUWorker('cpu-1', cpuCore1),
    new CPUWorker('cpu-2', cpuCore2),
    new CPUWorker('cpu-3', cpuCore3),
    new CPUWorker('cpu-4', cpuCore4)
  ]
  
  async executeCPUTask(task: Task): Promise<any> {
    // Must manually find least loaded worker
    const worker = this.findLeastLoadedWorker()
    return worker.execute(task)
  }
  
  // With multi-resource: One worker manages all cores
  cpuPoolWorker = new CPUPoolWorker('cpu-pool', [
    cpuCore1, cpuCore2, cpuCore3, cpuCore4
  ])
  
  async executeCPUTask(task: Task): Promise<any> {
    // Worker handles load balancing internally
    return this.cpuPoolWorker.execute(task)
  }
}
```

## When One-to-One Makes Sense

### 1. **Stateful Resources**
```typescript
// Good: Browser sessions with user state
class BrowserSessionWorker implements Worker<BrowserResource> {
  resource: BrowserResource
  
  async execute(task: Task): Promise<any> {
    // Browser maintains session state, cookies, etc.
    // Sharing would contaminate state
    return await this.executeInBrowser(task)
  }
}
```

### 2. **Exclusive Access Resources**
```typescript
// Good: Hardware devices that can't be shared
class USBDeviceWorker implements Worker<USBDeviceResource> {
  resource: USBDeviceResource
  
  async execute(task: Task): Promise<any> {
    // USB device can only be used by one process
    return await this.communicateWithDevice(task)
  }
}
```

### 3. **Simple, Homogeneous Tasks**
```typescript
// Good: Simple tasks with uniform resource needs
class FileProcessingWorker implements Worker<FileSystemResource> {
  resource: FileSystemResource
  
  async execute(task: FileProcessingTask): Promise<any> {
    // All tasks just need file system access
    return await this.processFile(task.filePath)
  }
}
```

## Hybrid Approach: Best of Both Worlds

```typescript
// Different worker types for different use cases
abstract class Worker<ResourceType extends Resource = Resource> {
  abstract canExecute(task: Task): boolean
  abstract execute<T extends Task>(task: T): Promise<Awaited<ReturnType<T['run']>>>
}

// Single resource worker for exclusive access
class ExclusiveWorker<R extends Resource> extends Worker<R> {
  resource: R
  
  constructor(resource: R) {
    this.resource = resource
  }
}

// Multi-resource worker for complex tasks
class PooledWorker<R extends Resource> extends Worker<R> {
  resources: R[]
  
  constructor(resources: R[]) {
    this.resources = resources
  }
  
  protected async acquireResource(type: string): Promise<R> {
    const resource = this.resources.find(r => 
      r.type === type && r.status === 'available'
    )
    if (!resource) throw new Error(`No available ${type} resource`)
    
    resource.status = 'busy'
    return resource
  }
  
  protected releaseResource(resource: R): void {
    resource.status = 'available'
  }
}

// Usage
const browserWorker = new ExclusiveWorker(browserResource)          // 1:1 for stateful browser
const dataWorker = new PooledWorker([dbResource, computeResource])  // 1:many for complex tasks
```

## Recommendation

**Start with one-to-one for simplicity**, but design your interfaces to support both models:

```typescript
// Flexible interface that supports both models
interface Worker<ResourceType extends Resource = Resource> {
  id: string
  name: string
  
  canExecute(task: Task): boolean
  execute<T extends Task>(task: T): Promise<Awaited<ReturnType<T['run']>>>
  
  // Optional: Allow querying available resources
  getAvailableResources?(): ResourceType[]
  
  // Optional: Allow resource health checks
  checkResourceHealth?(): Promise<Record<string, boolean>>
}
```

This allows you to:
1. Start simple with one resource per worker
2. Evolve to multi-resource workers when needed
3. Mix both approaches in the same system
4. Maintain interface compatibility

The key is to **match the model to your use case** rather than forcing everything into one pattern.
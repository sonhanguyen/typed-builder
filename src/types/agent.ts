
type Entity = { id: string }

type TaskRequest<T extends {} = {}> = 
& { params: T }
& Entity
& Task

type TaskResult = {
  taskRequestId: string
  start: Date
  end: Date
  result: any
  error?: {}
}

export type Task = {
  run?: never
  type: string
}

type Stream<T> = {
  on(listener: (_: T) => void): void
}

export interface Agent<
  In extends {} = {},
  Out = any,
  Event extends TaskRequest = TaskRequest,
  Signal extends TaskResult = TaskResult,
> {
  run(_: In):
    & { send?(_: Signal): void }
    & Stream<Event>
    & Promise<Out>
}

type SubTask<T extends {} = {}> = (
| { (_: T): Stream<TaskRequest> }
| Task
) & {
  // TODO: conditional, loop and other dependencies logics
  // a mapper in place of null
  params(...resolvedDeps: any[]): T
  dependencies: string[]
}

export type Workflow = {
  subtasks: Record<string, SubTask>
} 

export type Result<T = unknown> = 
  | { error?: never; result: T }
  | { error: {} }

export type TaskResult<T = unknown> = Result<T> & {
  start: Date
  end: Date
  id: string
}

export type Task<T extends {} = {}> = {
  executor: string
  span?: string // id of the plan that spun it up
  id: string
  params: T
}

export type SubTask<T extends {} = {}> = Task<T> & {
  dependencies?: string[] // task ids
  last?: boolean
  /**
   * @param   {...depencies} results of other subtasks
   *          whose ids are listed in dependencies, in that order
   * @return  params for the task
   */ 
  params(..._): T
}

export type Stream<T> = {
  on(listener: (_: T) => void): void
}

export type Emiter<T> = {
  emit(_: T): void
}

export type Plan = {
  id: string
  // the design is intentionally for plan to be dynamic and
  // potentially not deterministic at the start of execution
  subtasks: Stream<SubTask | Plan>
}

export type Channel<In, Out> = Stream<Out> & Emiter<In>

export interface Agent extends Channel<
  Task | TaskResult,
  Task | TaskResult
> {
  readonly meta: { type: string }
  readonly id: string
}

export type Executor<
  In extends {} = {},
  Out = any,
  Event extends Task | Plan = Task | Plan,
  Signal extends TaskResult = TaskResult,
> = {
  type: string
  run(_: In): Promise<Out>
    & Partial<Channel<Signal, Event>>
}
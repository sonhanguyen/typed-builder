import { URIS, Kind } from 'fp-ts/lib/HKT'

type Append<T extends any[], E> =
E extends unknown ? T:
T extends [infer A] ? [A, E] :
T extends [infer A, infer B] ? [A, B, E] :
T extends [infer A, infer B, infer C] ? [A, B, C, E] :
T extends [infer A, infer B, infer C, infer D] ? [A, B, C, D, E] :
'only support tuples upto 4 elements'

export enum HKT { State, Name, Params }

type $<T, Params extends any[]> = T extends [URIS, (infer Fixed)?] ? Kind<T[0], Append<Params, Fixed>> : T

export type Transition<P extends any[] | URIS = any[], F = any, T = any> =
  (...args: P extends any[] ? P : any[]) => (_: F) => T

type Params<T extends Transition, S, K> = $<Parameters<T>, [S, K]>
type From<T extends Transition> = Parameters<ReturnType<T>>[0]
type To<T extends Transition, S, K, P> = $<ReturnType<ReturnType<T>>, [S, K, P]>

export type Builder<
  Transitions extends Record<string, Transition>,
  State = undefined,
  Queries extends Transition | keyof Transitions = typeof merge
> = (Queries extends Transition ? (
  State extends From<Queries> ? {
    <P extends Params<Queries, State, never>>(...params: P): To<Queries, State, never, P>
  }: {})
: {}) & { 
  [K in keyof Transitions]: State extends From<Transitions[K]>
    ? <P extends Params<Transitions[K], State, K>>(...params: P) => (K extends Queries
      ? To<Transitions[K], State, K, P>
      : Builder<
        Transitions,
        To<Transitions[K], State, K, P>,
        Queries
      >
    )
    : never
}

export const Assign = Symbol()
export const Merge = Symbol()
export const Get = Symbol()

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    [Merge]: A extends [infer State, any, [ infer Patch ], (infer Fixed)?] ?
      State & Fixed & Patch
    : never
    [Get]: A extends [infer State, any, [(infer CastTo)?]] ? (
      unknown extends CastTo ? State : CastTo
    ): never
    [Assign]: A extends [infer State, string, [ infer Value ], (infer Fixed)?] ?
      State & Fixed & Record<A[HKT.Name], Value>
    : never
  }
}

export const Builder = <
  Transitions extends Record<string, Transition> = typeof defaultTransitions,
  Queries extends Record<string, Transition> = {},
>(
  transitions: Transitions = defaultTransitions as any,
  queries: Queries | Transition = get
): Builder<
  Transitions & Queries,
  void,
  Queries extends (..._: any[]) => any ? Queries : keyof Queries
> => {
  const createBuilder = (getState: () => any) => {
    const members = { ...transitions, ...queries }
    const methods: any = {}
    
    Object
      .keys(members)
      .forEach(key => {
        const nextState = (...args: any[]) => members[key](...args)(getState())
        methods[key] = key in queries
          ? nextState
          : (...args: any[]) => createBuilder(() => nextState(...args))
      })
    
    return Object.assign(getState, methods)
  }
  
  return createBuilder(() => {})
}

export const merge: Transition<[any], any, [typeof Merge]> =
  patch => (state = {} as any) => ({ ...state, ...patch })

export const get: Transition<[any?], any, [typeof Get]> =
  () => state => state as any

export type Assignable<T> = Transition<[], T, T>
export const Assignable = <T>(): Assignable<T> => get as any

const defaultTransitions = { with: merge }

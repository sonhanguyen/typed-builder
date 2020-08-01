import type { URIS, Kind } from 'fp-ts/lib/HKT'

export enum HKT { State, Name, Params }

export type Transition<P extends any[] | $<URIS> = any[], F = any, T = any> =
  (...args: P extends any[] ? P : any[]) => (_: F) => T

type Params<T extends Transition, S, K, P = Parameters<T>> =
  P extends $<URIS> ? Kind<URIS & Tag<P>, [S, K, Fixed<P>]> : P

type From<T extends Transition> = Parameters<ReturnType<T>>[0]
type To<
  T extends Transition,
  S, K, P,
  R = ReturnType<ReturnType<T>>
> = R extends $<URIS> ? Kind<URIS & Tag<R>, [S, K, P, Fixed<R>]> : R

const KIND = Symbol()
type $<T, V extends {} = {}> = V & { [KIND]?: T }
type Fixed<T extends $<any>> = Pick<T, Exclude<keyof T, typeof KIND>>
type Tag<T extends $<any>> = Exclude<T[typeof KIND], undefined>
const Tag = <T, V>(_: T, value: V): $<T, V> => value

export const $ = Tag

export type Builder<
  Transitions extends Record<string, Transition>,
  State = undefined,
  Queries extends Transition | keyof Transitions = typeof merge
> = (Queries extends Transition ? (
  State extends From<Queries> ? {
    <P extends Params<Queries, State, ''>>(...params: P): To<Queries, State, '', P>
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
    : NotSupported
}

const NOT_SUPPORTED = Symbol()
export type NotSupported = typeof NOT_SUPPORTED

export const Assign = Symbol()
export type Assign = typeof Assign

export const Assert = Symbol()
export type Assert = typeof Assert

export const Merge = Symbol()
export type Merge = typeof Merge
export const partial = <T = any>(): Transition<[Partial<T>], any, $<Merge>> =>
  patch => (state = {} as any) => ({ ...state, ...patch })
export const merge = partial()

export const Get = Symbol()
export type Get = typeof Get
export const get: Transition<[any?], any, $<Get>> =
  () => state => state as any

export type Assignable<T> = Transition<[], T, $<Get>>
export const Assignable = <T>(): Assignable<T> => get as any

type Overwrite<O, P> = Omit<O, keyof P> & P

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    [Merge]: A extends [infer State, any, [infer Patch], any] ?
      Overwrite<State extends void ? {} : State, Patch>
    : never
    [Assert]: A extends [infer State, any, any[], infer T] ?
      Overwrite<State extends void ? {} : State, T>
    : never
    [Get]: A extends [infer State, any, [(infer CastTo)?], any] ? (
      unknown extends CastTo ? State : CastTo
    ): never
    [Assign]: A extends [infer State, string, [ infer Value ], any] ?
      Overwrite<State, Record<A[HKT.Name], Value>>
    : never
  }
}

export const Builder = <
  Transitions extends Record<string, Transition> = typeof defaultTransitions,
  Queries extends Record<string, Transition> | Transition = typeof get,
>(
  transitions: Transitions = defaultTransitions as any,
  queries: Queries = get as any
): Builder<
  Transitions & (Queries extends Transition ? {} : Queries),
  undefined,
  Queries extends Transition ? Queries : keyof Queries
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

const defaultTransitions = { with: merge }

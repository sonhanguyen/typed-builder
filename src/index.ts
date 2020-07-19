import { URIS2, URIS, Kind2, Kind } from 'fp-ts/lib/HKT'

type $<T, P extends any[]> =
  T extends URIS2 ?
    Kind2<T, P[0], P[1]> :
  T extends URIS ?
    Kind<T, P[0]> :
  T

export type Transition<P extends any[] = any[], F = any, T = any> = <A extends P>(..._: A) =>
  <S extends F>(_: S) => $<T, [S, A]>

type Params<T extends Transition, S> = $<Parameters<T>, [S]>
type From<T extends Transition> = Parameters<ReturnType<T>>[0]
type To<T extends Transition, S, P> = $<ReturnType<ReturnType<T>>, [S, P]>

export type Builder<
  Members extends Record<string, Transition>,
  State = undefined,
  BuildMethods extends keyof Members = never
> = (BuildMethods extends never ? { (): State }: {}) & { 
  [K in keyof Members]: State extends From<Members[K]>
    ? <P extends Params<Members[K], State>>(...params: P) => (BuildMethods extends K 
      ? To<Members[K], State, P>
      : Builder<
        Members,
        To<Members[K], State, P>,
        BuildMethods
      >
    )
    : never
}

export const Patch = Symbol()
declare module 'fp-ts/lib/HKT' {
  interface URItoKind2<E, A> {
    [Patch]: A extends [infer P] ? E & P : never
  }
}

export const configureBuilder = <
  TransitionMembers extends Record<string, Transition> = typeof patch,
  BuildMembers extends Record<string, Transition> = {},
>(
  transitions: TransitionMembers = patch as any,
  buildMembers: BuildMembers = {} as any
): Builder<TransitionMembers & BuildMembers, void, keyof BuildMembers> => {
  const createBuilder = (getState: () => any) => {
    const members = { ...transitions, ...buildMembers }
    const methods: any = {}
    
    Object
      .keys(members)
      .forEach(key => {
        const nextState = (...args: any[]) => members[key](...args)(getState())
        methods[key] = key in buildMembers
          ? nextState
          : (...args: any[]) => createBuilder(() => nextState(...args))
      })
    
    return Object.assign(getState, methods)
  }
  
  return createBuilder(() => {})
}
  
const patch = {
  with: <Transition<any[], any, typeof Patch>>(<P extends any[]>(...[patch]: P) =>
    <S>(state: S) => ({ ...state, ...patch })
  )
}

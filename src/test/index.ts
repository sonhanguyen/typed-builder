type ProfileBuilder<State = {}> = Builder<
  {
    email: TransitionFactory<
      [string],
      State, 
      State & { email: string }
    >
    name: TransitionFactory<
      [string, string],
      State,
      State & { names: { first: string, last: string } }
    >
  },
  State
>

type Transition<From, To> = (state: From) => To

type TransitionFactory<
  Params extends any[],
  From,
  To
> = (...args: Params) => Transition<From, To>

import { expectType } from 'tsd'

type GetMembers<T> = T extends Builder<infer M, any> ? M : {} 

declare const profileBuilder: ProfileBuilder

expectType<{ email: string }>(
  profileBuilder
    .email('nsha@outlook.com')
    .get()
)

expectType<Builder<GetMembers<ProfileBuilder>, { email: string }>>(
  profileBuilder.email('nsha@outlook.com')
)

expectType<{
  email: string,
  names: { first: 'Harry', 'Nguyen' }
}>(
  profileBuilder
    .email('nsha@outlook.com')
    .name('Harry', 'Nguyen')
    .get()
)

import { Dictionary } from 'lodash'

type To<T extends TransitionFactory<any[], any, any>> =
  ReturnType<ReturnType<T>>

type Builder<
  Members extends Dictionary<TransitionFactory<any[], State, any>>,
  State,
> =
& { [K in keyof Members]: (...args: Parameters<Members[K]>) => Builder<Members, To<Members[K]> }
& { get(): State }
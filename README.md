We will look into encoding a stateful process into a domain-specific language (dsl) using the builder pattern, with focus on type-level programming. At the end of this we'll also touch on the concept of higher-kinded types.

To give you an example of what we are aiming for, take a code snippet from any library that offers a chainable api, such as lodash:

```ts
_(initialState)
  .map(...)
  .invert()
  .transform(...)
  .value()
```

The way this is usually implemented is the builder pattern. In it, all the transitions (`map`, `invert`, `transform`...) are member functions of a `builder` type. At the start, a builder is initialized with an initial state. In an immutable manner, each of these transition results in a new instance of the builder with a new state. At the end we fold all the state transitions with the initial state to get a final `value`.

Presumably lodash interface looks like this:

```ts
declare const _: <State>(initial: State) => LodashBuilder<State>

interface LodashBuilder<S> {
  map(f: <R>(_: S) => R): LodashBuilder<R>
  invert...
  transform...
  ...
  value(): S
}
```

The implementation is probably something like this

```ts
class LodashBuilder<S> {
  constructor(public readonly value: () => S) {}

  map(f: <R>(_: S) => R) {
    return new Builder(() => f(this.value()))
  // ...
```

The purpose of this article however is not just about implementing builders. We're going to explore the type definition of a generic builder in typescript and a couple of interesting possibilities of a builder written in a functional programming approach.

Builders come in all shapes and sizes, since they're often used for implement `dsl`s, the members of the builder interface are domain-specific. We could have another builder for an onboarding process of some service:

```ts
OnboardingProfileBuilder()
// ...
  .email('nsha@outlook.com')
// ...
  .name('Harry', 'Nguyen')
// ...
  .acountType(AccountType.Individual)
// ...  
  .get()
```

> Note that the usages of builder also vary. While for lodash it's an ergonormic programming api and you tend see the whole chain in one place, builder can be used to perform multiple steps of transitions spaning accross different components. In practice, after each step, the result builder instance can be passed on to, say, the next view component in the onboarding wizard to perform its equivalent step.

If we want to make a builder type that is trully generic, we need to parameterize over the members of the builder:

```ts
import { Dictionary } from 'lodash'

type Builder<
  Members extends Dictionary<Transition>
  State,
> = unknown

type Transition = unknown
```

We now need to define exactly what is a `Transition`. Take a look at lodash's `map`:

```ts
type LodashBuilder<S>: {
  map(f: <R>(_: S) => R): LodashBuilder<R>
```

here `map` takes one param which is a function, it transitions the builder from a state `S` to the state `R`. It seems `Transition` should then have 2 type parameters `From`(`S`) and `To`(`R`) and intuitively appear to be a function `type Transition<From, To> = (state: From) => To`

The builder member functions however do not map to the transitions themselves, they seems to correspond to functions that produce a transition, we call them `TransitionFactory`

```ts
type ProfileBuilder<State> = Builder<
  {
    email: (_: string) => Transition<
      State, State & { email: string }   // to "definitely has email"
    >
    name: (first: string, last: string) => Transition<
      State, State & { names: { first: string, last: string } }
    >
    // ...
```
after drying it up a bit:

```ts
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
    accountType: TransitionFactory<
      [AccountType],
      State,
      State & { accountType: AccountType }
    >
  },
  State
>

type TransitionFactory<
  Params extends any[],
  From,
  To
> = (...args: Params) => Transition<From, To>

type Builder<
  Members extends Dictionary<TransitionFactory<any[], State, any>>
  State,
> = unknown
```

Now we will replace `unknown` with some actual type-level manipulation to match the api in the beginning of the article. But to do that, let's work in a true TDD way and first define a spec for it:

```ts
import { expectType } from 'tsd'

declare const profileBuilder: ProfileBuilder

expectType<{ email: string }>(
  profileBuilder
    .email('nsha@outlook.com')
    .get()
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

// the state to transition to
type To<T extends TransitionFactory<any[], any, any>> =
  ReturnType<ReturnType<T>>

type Builder<
  Members extends Dictionary<TransitionFactory<any[], State, any>>,
  State,
> =
& { [K in keyof Members]: (...args: Parameters<Members[K]>) => Builder<Members, To<Members[K]> }
& { get(): S }
```

The first test passes, but the second fails with
> Property 'email' is missing in type '{ names: { first: string; last: string } }' but required in type '{ email: string; names: { first: "Harry"; Nguyen: any; }; }'

The type of the final value is determined by the type of the last builder function call `name('Harry', 'Nguyen')`, which is `To<Members[K]>`. If we recall the type parameter `Members` is simply passed on from on builde to the next and at the begining it is 

```
name: TransitionFactory<
  [string, string],
  State,
  State & { names: { first: string, last: string } }
>
```

with `State={}`, in other words, `To<Members['name']>` is always `{ names: { first: string, last: string } }`

If only we have a way to 




# Install / Import

```bash
$ npm install --save typed-builder
```

## Import from HTML, with CDN

Import it via a bundle that creates a global ( wider browser support ):

```html
<script src="//unpkg.com/typed-builder/bundle.min.js"></script>
<script>
    const { myFunction, myObject } = typed_builder;
</script>
```

Or import it as an ES module:

```html
<script type="module">
    import {
        myFunction,
        myObject,
    } from "//unpkg.com/typed-builder/zz_esm/index.js";
</script>
```

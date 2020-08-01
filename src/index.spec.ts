import { Builder, merge, get, Assignable, Assert, partial, $ } from '.'
import { expectType, expectNotType } from 'tsd'

describe('Buider with no config', () => {
  const noConfigBuilder = Builder()

  it('Should produce value', () => {
    expect(noConfigBuilder()).toBeUndefined()
    
    expect(noConfigBuilder
      .with({ test: 'text' })
      ()
    ).toEqual({ test: 'text' })

    expect(noConfigBuilder
      .with({ test: 'text' })
      .with({ number: 1 })
      ()
    ).toEqual({ test: 'text', number: 1 })
    

    let value: any
    expectType<{ test: number }>(
      value = noConfigBuilder
        .with({ test: 'text' })
        .with({ test: 1 })
        ()
    )
    
    expect(value).toEqual({ test: 1 })
  })
})

describe('Merge', () => {
  const builder = Builder({ merge })
  let value: any
  it('Should produce value', () => {
    expectType<{ test: string }>(
      builder
        .merge({ test: 'text' })
        ()
    )
    
    expectType<{ test: string, number: number }>(
      value = builder
        .merge({ test: 'text' })
        .merge({ number: 1 })
        ()
    )

    expect(value).toEqual({ test: 'text', number: 1 })
  })
})

describe('Get', () => {
  const builder = Builder({ merge }, { get })
  let value: any
  it('Should produce value', () => {
    expectType<{ test: string }>(
      builder
        .merge({ test: 'text' })
        .get()
    )
    
    expectType<{ test: string, number: number }>(
      value = builder
        .merge({ test: 'text' })
        .merge({ number: 1 })
        .get()
    )

    expect(value).toEqual({ test: 'text', number: 1 })
  })
})

describe('Partial', () => {
  type ExpectedType = {
    some: string,
    a: number
  }

  const builder = Builder({ with: partial<ExpectedType>() })
  let value: any
  
  it('Should produce value', () => {
    expectType<(_: Partial<ExpectedType>) => any>(
      builder.with
    )
    
    expectType<ExpectedType>(
      value = builder
        .with({ some: 'thing' })
        .with({ a: 1 })
        ()
    )

    expect(value).toEqual({ some: 'thing', a: 1 })
  })
})

describe('Assignable', () => {
  type ExpectedType = {
    some: string,
    a: number
  }

  const builder = Builder({ with: partial<ExpectedType>() }, Assignable<ExpectedType>())
  let value: any
  
  it('Should produce value', () => {
    expectNotType<(...args: any[]) => any>(
      builder.with({ some: 'string' })
    )
    
    expectType<ExpectedType>(
      value = builder
        .with({ some: 'thing' })
        .with({ a: 1 })
        ()
    )

    expect(value).toEqual({ some: 'thing', a: 1 })
  })
})


describe('Custom members', () => {
  const builder = Builder({
    a: () => (state: any) => $(Assert, { ...state as {}, a: true }),
    b: () => (state: any) => $(Assert, { ...state as {}, b: true }),
    c: () => (state: any) => $(Assert, { ...state as {}, c: true })
  })
  let value: any
  
  it('Should produce value', () => {
    expectType<{ a: boolean, b: boolean, c: boolean }>(
      value = builder
        .a()
        .b()
        .c()
        ()
    )

    expect(value).toEqual({ a: true, b: true, c: true })
  })
})
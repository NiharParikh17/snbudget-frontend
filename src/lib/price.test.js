import { describe, it, expect } from 'vitest'
import { formatAmount, formatPrice, compareProducts } from './price.js'

describe('formatAmount', () => {
  it('formats a decimal number as USD', () => {
    expect(formatAmount(9.99)).toBe('$9.99')
    expect(formatAmount(0)).toBe('$0.00')
  })
  it('treats null/undefined as 0', () => {
    expect(formatAmount(null)).toBe('$0.00')
    expect(formatAmount(undefined)).toBe('$0.00')
  })
})

describe('formatPrice', () => {
  it('appends the cadence for recurring plans', () => {
    expect(formatPrice({ price: 9.99, billingCycle: 'MONTHLY' })).toBe('$9.99 / month')
    expect(formatPrice({ price: 99, billingCycle: 'YEARLY' })).toBe('$99.00 / year')
    expect(formatPrice({ price: 2.5, billingCycle: 'WEEKLY' })).toBe('$2.50 / week')
  })
  it('marks LIFETIME plans as one-time', () => {
    expect(formatPrice({ price: 199, billingCycle: 'LIFETIME' })).toBe('$199.00 one-time')
  })
  it('falls back to the bare amount for unknown cycles', () => {
    expect(formatPrice({ price: 5, billingCycle: 'WEIRD' })).toBe('$5.00')
  })
})

describe('compareProducts', () => {
  it('orders cycles MONTHLY → YEARLY → LIFETIME → WEEKLY', () => {
    const sorted = [
      { name: 'L', billingCycle: 'LIFETIME' },
      { name: 'W', billingCycle: 'WEEKLY' },
      { name: 'Y', billingCycle: 'YEARLY' },
      { name: 'M', billingCycle: 'MONTHLY' },
    ].sort(compareProducts)
    expect(sorted.map((p) => p.name)).toEqual(['M', 'Y', 'L', 'W'])
  })
  it('breaks ties by name', () => {
    const sorted = [
      { name: 'Pro', billingCycle: 'MONTHLY' },
      { name: 'Basic', billingCycle: 'MONTHLY' },
    ].sort(compareProducts)
    expect(sorted.map((p) => p.name)).toEqual(['Basic', 'Pro'])
  })
})


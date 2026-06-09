export type ShippingSettings = {
  freeShippingThreshold: number
  defaultRate: number
}

export type ShippingCalculation = {
  shippingAmount: number
  freeShippingApplied: boolean
  shippingThresholdUsed: number
}

export type ShippingQuote = ShippingCalculation & {
  shippingLabel: string
  orderTotal: number
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function formatInrAmount(value: number): string {
  return `₹${Math.max(0, value).toLocaleString('en-IN')}`
}

export function calculateShipping(
  subtotal: number,
  settings: ShippingSettings,
): ShippingCalculation {
  const threshold = Math.max(0, Number(settings.freeShippingThreshold) || 0)
  const rate = Math.max(0, Number(settings.defaultRate) || 0)
  const normalizedSubtotal = roundMoney(subtotal)

  const freeShippingApplied = normalizedSubtotal >= threshold
  const shippingAmount = freeShippingApplied ? 0 : roundMoney(rate)

  return {
    shippingAmount,
    freeShippingApplied,
    shippingThresholdUsed: threshold,
  }
}

export function calculateOrderTotal(subtotal: number, shippingAmount: number): number {
  return roundMoney(subtotal + shippingAmount)
}

export function getShippingDisplay(
  subtotal: number,
  settings: ShippingSettings,
): ShippingQuote {
  const calculation = calculateShipping(subtotal, settings)
  const orderTotal = calculateOrderTotal(subtotal, calculation.shippingAmount)
  const shippingLabel =
    calculation.freeShippingApplied || calculation.shippingAmount <= 0
      ? 'FREE'
      : formatInrAmount(calculation.shippingAmount)

  return {
    ...calculation,
    shippingLabel,
    orderTotal,
  }
}

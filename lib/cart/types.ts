/** Client cart line — prices are a cache; server validation is authoritative. */
export interface CartItem {
  id: string
  productId: string
  variantId?: string
  variantLabel?: string
  name: string
  price: number
  image: string
  quantity: number
  unitLabel?: string
}

export type CartItemPayload = Pick<
  CartItem,
  'productId' | 'variantId' | 'variantLabel' | 'quantity'
> & {
  id?: string
  name?: string
  price?: number
  image?: string
  unitLabel?: string
}

export type CartItemMeta = {
  priceUpdated?: boolean
  quantityAdjusted?: boolean
  unavailable?: boolean
  message?: string
}

export type CartValidationResponse = {
  items: CartItem[]
  subtotal: number
  checkoutBlocked: boolean
  removedCount: number
  globalMessage?: string
  itemsMeta: Record<string, CartItemMeta>
}

export type ValidatedOrderItem = {
  productId: string
  variantId?: string
  variantLabel?: string
  name: string
  image: string
  price: number
  quantity: number
  product: string
}

export type ValidatedOrder = {
  orderItems: Array<{
    product: string
    name: string
    image: string
    price: number
    quantity: number
    variantLabel?: string
  }>
  total: number
}

import { revalidatePath } from 'next/cache'

export async function revalidateStorefrontSettings(): Promise<void> {
  revalidatePath('/', 'layout')
  revalidatePath('/')
  revalidatePath('/cart')
  revalidatePath('/checkout')
  revalidatePath('/order-success')
  revalidatePath('/order-failed')
  revalidatePath('/order-processing')
}

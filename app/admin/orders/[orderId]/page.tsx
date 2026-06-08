'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { getOrderCustomerDisplay } from '@/lib/orders/admin-display'
import {
  formatPaymentStatusLabel,
} from '@/lib/orders/status-transitions'
import {
  formatOrderPaymentMethod,
  formatShippingAddressForDisplay,
} from '@/lib/order-success-content'

interface OrderItem {
  _id?: string
  product?: string
  name: string
  image?: string
  quantity: number
  price: number
  variantLabel?: string
}

interface Order {
  _id: string
  orderId?: string
  createdAt: string
  status: string
  totalPrice: number
  paidAt?: string
  inventoryAdjusted?: boolean
  paymentInfo?: {
    method?: string
    status?: string
    transactionId?: string
  }
  user?: {
    name?: string
    email?: string
  }
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
  shippingAddress?: unknown
  orderItems: OrderItem[]
}

const STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'default',
  processing: 'default',
  confirmed: 'secondary',
  shipped: 'secondary',
  delivered: 'outline',
  cancelled: 'destructive',
}

export default function AdminOrderDetails() {
  const { orderId } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`)
        if (!res.ok) throw new Error('Failed to fetch order')
        setOrder(await res.json())
      } catch {
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }
    if (orderId) void fetchOrder()
  }, [orderId])

  if (loading) return <div>Loading...</div>
  if (!order) return <div>Order not found.</div>

  const customer = getOrderCustomerDisplay(order)
  const items = order.orderItems || []
  const shippingAddress = formatShippingAddressForDisplay(order.shippingAddress)
  const paymentMethod = order.paymentInfo?.method
  const paymentStatus = order.paymentInfo?.status

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <Link href="/admin/orders" className="text-sm font-medium text-primary underline">
          Back to orders
        </Link>
      </div>

      <div className="mb-6 space-y-2 text-sm">
        <p>
          <strong>Reference:</strong>{' '}
          {order.orderId || order._id}
        </p>
        <p>
          <strong>Internal ID:</strong> {order._id}
        </p>
        <p>
          <strong>Date:</strong>{' '}
          {new Date(order.createdAt).toLocaleString('en-IN')}
        </p>
        <p>
          <strong>Status:</strong>{' '}
          <Badge variant={STATUS_VARIANT[order.status] || 'default'}>
            {order.status}
          </Badge>
        </p>
        <p>
          <strong>Total:</strong> ₹
          {Number(order.totalPrice || 0).toLocaleString('en-IN')}
        </p>
        <p>
          <strong>Payment method:</strong>{' '}
          {formatOrderPaymentMethod(paymentMethod)}
        </p>
        <p>
          <strong>Payment status:</strong>{' '}
          {formatPaymentStatusLabel(paymentStatus)}
        </p>
        {order.paymentInfo?.transactionId && (
          <p>
            <strong>Transaction ID:</strong> {order.paymentInfo.transactionId}
          </p>
        )}
        {order.paidAt && (
          <p>
            <strong>Paid at:</strong>{' '}
            {new Date(order.paidAt).toLocaleString('en-IN')}
          </p>
        )}
        <p>
          <strong>Inventory adjusted:</strong>{' '}
          {order.inventoryAdjusted ? 'Yes' : 'No'}
        </p>
      </div>

      <div className="mb-6 space-y-1 text-sm">
        <h2 className="text-lg font-semibold">Customer</h2>
        <p>
          <strong>Name:</strong> {customer.name}
        </p>
        <p>
          <strong>Email:</strong> {customer.email}
        </p>
        <p>
          <strong>Phone:</strong> {customer.phone}
        </p>
        <p>
          <strong>Delivery address:</strong>{' '}
          {shippingAddress || '—'}
        </p>
      </div>

      <h2 className="text-lg font-semibold mb-2">Items</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Variant</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit price</TableHead>
            <TableHead>Line total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>No items found.</TableCell>
            </TableRow>
          ) : (
            items.map((item, idx) => (
              <TableRow key={item._id || item.product || idx}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.variantLabel || '—'}</TableCell>
                <TableCell>
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="rounded object-cover"
                    />
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>₹{Number(item.price || 0).toLocaleString('en-IN')}</TableCell>
                <TableCell>
                  ₹
                  {Number((item.price || 0) * (item.quantity || 0)).toLocaleString(
                    'en-IN',
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

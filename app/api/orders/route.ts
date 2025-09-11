import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getServerSession } from '@/lib/auth';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get all orders for the logged-in user
    const orders = await Order.find({ user: session.userId }).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { name, email, phone, address, paymentMethod, items, total } = body;

    // Generate unique order ID
    const orderId = 'ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Prepare order items and update stock
    const orderItems = [];
    for (const item of items) {
      // Decrease stock
      await Product.findByIdAndUpdate(item.id, { $inc: { quantity: -item.quantity } });
      orderItems.push({
        product: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      });
    }

    // Set initial status and payment
    const status = 'pending';
    const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'processing';

    // Create order
    const order = await Order.create({
      orderId,
      user: { name, email, phone },
      shippingAddress: address,
      items: orderItems,
      total,
      paymentMethod,
      paymentStatus,
      status,
    });

    // Send email notifications
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // User confirmation email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Order Confirmation - ${orderId}`,
      html: `<h2>Thank you for your order!</h2>
        <p>Your order <b>${orderId}</b> has been placed and is being processed.</p>
        <p><b>Total:</b> ₹${total}</p>
        <p><b>Payment Method:</b> ${paymentMethod}</p>
        <p><b>Shipping Address:</b> ${address}</p>
        <p>You can track your order status in your account.</p>`
    });

    // Admin notification email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_FROM, // Change to your admin/store email if different
      subject: `New Order Received - ${orderId}`,
      html: `<h2>New Order Received</h2>
        <p>Order ID: <b>${orderId}</b></p>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Total:</b> ₹${total}</p>
        <p><b>Payment Method:</b> ${paymentMethod}</p>
        <p><b>Shipping Address:</b> ${address}</p>`
    });

    // TODO: Log transaction for audit

    return NextResponse.json({ success: true, orderId: order.orderId });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 });
  }
}

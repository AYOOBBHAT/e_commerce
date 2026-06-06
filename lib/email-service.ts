/**
 * Centralized Email Service
 * Handles all email notifications with settings validation
 */

import nodemailer from 'nodemailer';
import { getSettings, getSettingsSync } from './settings';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Get email transporter (reusable instance)
 */
let transporterInstance: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[email-service] Email credentials not configured');
    return null;
  }

  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return transporterInstance;
}

/**
 * Send email with error handling
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn('[email-service] Cannot send email: transporter not available');
      return false;
    }

    await transporter.sendMail({
      from: options.from || process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return true;
  } catch (error) {
    console.error('[email-service] Error sending email:', error);
    return false;
  }
}

/**
 * Check if order confirmation notifications are enabled
 */
export function isOrderConfirmationEnabled(): boolean {
  const settings = getSettingsSync();
  return settings.notifications.orderConfirmation;
}

/**
 * Check if shipping update notifications are enabled
 */
export function isShippingUpdateEnabled(): boolean {
  const settings = getSettingsSync();
  return settings.notifications.shippingUpdates;
}

/**
 * Check if low inventory alerts are enabled
 */
export function isLowInventoryAlertEnabled(): boolean {
  const settings = getSettingsSync();
  return settings.notifications.lowInventory;
}

/**
 * Check if marketing emails are enabled
 */
export function isMarketingEmailEnabled(): boolean {
  const settings = getSettingsSync();
  return settings.notifications.marketing;
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(data: {
  email: string;
  orderId: string;
  total: number;
  paymentMethod: string;
  address: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
}): Promise<boolean> {
  if (!isOrderConfirmationEnabled()) {
    return false;
  }

  const settings = getSettingsSync();
  const itemsList = data.items
    ? data.items.map(item => `<li>${item.name} × ${item.quantity} - ₹${item.price}</li>`).join('')
    : '';

  return sendEmail({
    to: data.email,
    subject: `Order Confirmation - ${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Thank you for your order!</h2>
        <p>Your order <b>${data.orderId}</b> has been placed and is being processed.</p>
        ${itemsList ? `<ul>${itemsList}</ul>` : ''}
        <p><b>Total:</b> ₹${data.total}</p>
        <p><b>Payment Method:</b> ${data.paymentMethod}</p>
        <p><b>Shipping Address:</b> ${data.address}</p>
        <p>You can track your order status in your account.</p>
        <p>Thank you for shopping with ${settings.storeName}!</p>
      </div>
    `,
  });
}

/**
 * Send admin notification for new order
 */
export async function sendAdminOrderNotification(data: {
  orderId: string;
  name: string;
  email: string;
  phone: string;
  total: number;
  paymentMethod: string;
  address: string;
}): Promise<boolean> {
  if (!isOrderConfirmationEnabled()) {
    return false;
  }

  const adminEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  if (!adminEmail) {
    console.warn('[email-service] No admin email configured');
    return false;
  }

  return sendEmail({
    to: adminEmail,
    subject: `New Order Received - ${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">New Order Received</h2>
        <p><b>Order ID:</b> ${data.orderId}</p>
        <p><b>Name:</b> ${data.name}</p>
        <p><b>Email:</b> ${data.email}</p>
        <p><b>Phone:</b> ${data.phone}</p>
        <p><b>Total:</b> ₹${data.total}</p>
        <p><b>Payment Method:</b> ${data.paymentMethod}</p>
        <p><b>Shipping Address:</b> ${data.address}</p>
      </div>
    `,
  });
}

/**
 * Send shipping update email
 */
export async function sendShippingUpdateEmail(data: {
  email: string;
  orderId: string;
  trackingNumber?: string;
}): Promise<boolean> {
  if (!isShippingUpdateEnabled()) {
    return false;
  }

  const settings = getSettingsSync();
  const trackingInfo = data.trackingNumber
    ? `<p><b>Tracking Number:</b> ${data.trackingNumber}</p>`
    : '';

  return sendEmail({
    to: data.email,
    subject: `Your Order Has Been Shipped - ${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Great news! Your order has been shipped</h2>
        <p>Your order <b>${data.orderId}</b> has been shipped and is on its way to you.</p>
        ${trackingInfo}
        <p>You can track your order status in your account.</p>
        <p>Thank you for shopping with ${settings.storeName}!</p>
      </div>
    `,
  });
}

/**
 * Send low inventory alert to admin
 */
export async function sendLowInventoryAlert(data: {
  productName: string;
  productId: string;
  currentQuantity: number;
  threshold?: number;
}): Promise<boolean> {
  if (!isLowInventoryAlertEnabled()) {
    return false;
  }

  const adminEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  if (!adminEmail) {
    console.warn('[email-service] No admin email configured');
    return false;
  }

  const threshold = data.threshold || 10;
  const settings = getSettingsSync();

  return sendEmail({
    to: adminEmail,
    subject: `Low Inventory Alert - ${data.productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #d97706;">Low Inventory Alert</h2>
        <p><b>Product:</b> ${data.productName}</p>
        <p><b>Product ID:</b> ${data.productId}</p>
        <p><b>Current Stock:</b> ${data.currentQuantity} units</p>
        <p><b>Threshold:</b> ${threshold} units</p>
        <p style="color: #d97706;"><b>Action Required:</b> Please restock this product soon.</p>
        <p>You can manage products in the admin panel.</p>
      </div>
    `,
  });
}

/**
 * Send marketing/welcome email to new customers
 */
export async function sendMarketingEmail(data: {
  email: string;
  name: string;
  isNewCustomer?: boolean;
}): Promise<boolean> {
  if (!isMarketingEmailEnabled()) {
    return false;
  }

  const settings = getSettingsSync();
  const welcomeMessage = data.isNewCustomer
    ? `<h2 style="color: #333;">Welcome to ${settings.storeName}!</h2>
       <p>Thank you for joining us. We're excited to have you as part of our community.</p>`
    : `<h2 style="color: #333;">Special Offers from ${settings.storeName}</h2>`;

  return sendEmail({
    to: data.email,
    subject: data.isNewCustomer
      ? `Welcome to ${settings.storeName}!`
      : `Special Offers from ${settings.storeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${welcomeMessage}
        <p>Hello ${data.name},</p>
        <p>We have exciting offers and new products just for you!</p>
        <p>Visit our store to discover amazing deals.</p>
        <p>Thank you for being a valued customer!</p>
        <p>Best regards,<br>${settings.storeName} Team</p>
      </div>
    `,
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(data: {
  email: string;
  orderId: string;
  transactionId?: string;
  total: number;
}): Promise<boolean> {
  if (!isOrderConfirmationEnabled()) {
    return false;
  }

  const settings = getSettingsSync();
  const transactionInfo = data.transactionId
    ? `<p><b>Transaction ID:</b> ${data.transactionId}</p>`
    : '';

  return sendEmail({
    to: data.email,
    subject: `Payment Confirmed - ${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Payment Confirmed</h2>
        <p>Your payment for order <b>${data.orderId}</b> has been received.</p>
        ${transactionInfo}
        <p><b>Total:</b> ₹${data.total}</p>
        <p>Your order is being processed and will be shipped soon.</p>
        <p>Thank you for shopping with ${settings.storeName}!</p>
      </div>
    `,
  });
}


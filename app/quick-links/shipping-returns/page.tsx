export default function ShippingReturnsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Shipping & Returns</h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-6">Shipping Policy</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Shipping Areas</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We currently ship to all locations within India. Unfortunately, we do not offer
                  international shipping at this time.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Shipping Methods & Costs</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Standard Shipping:</strong> ₹49 - Delivery in 5-7 business days</li>
                  <li><strong>Express Shipping:</strong> ₹99 - Delivery in 2-3 business days</li>
                  <li><strong>Free Shipping:</strong> Available on orders over ₹999</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Processing Time</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Orders are typically processed within 1-2 business days. You will receive a
                  confirmation email once your order has been processed and shipped. Please note
                  that processing times may be longer during peak seasons and holidays.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Order Tracking</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Once your order ships, you'll receive a tracking number via email. You can track
                  your package using this number on our website or directly on the courier's website.
                  Please allow 24 hours for tracking information to become available.
                </p>
              </div>
            </div>
          </section>

          <section className="border-t pt-8">
            <h2 className="text-3xl font-semibold mb-6">Return Policy</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Return Window</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We accept returns within 30 days of delivery. To be eligible for a return, items
                  must be unused, in their original condition, and in the original packaging with
                  all tags attached.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Non-Returnable Items</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Perishable goods (food items)</li>
                  <li>Personal care items (for hygiene reasons)</li>
                  <li>Items marked as "Final Sale"</li>
                  <li>Gift cards</li>
                  <li>Downloadable products</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">How to Return</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Contact our customer support at zeeshaela@zescohnuts.com</li>
                  <li>Provide your order number and reason for return</li>
                  <li>Receive return authorization and shipping instructions</li>
                  <li>Pack items securely in original packaging</li>
                  <li>Ship the items back to us using a trackable shipping method</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Return Shipping Costs</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Return shipping costs are the responsibility of the customer, except in cases where
                  the item is defective or we made an error in your order. We recommend using a
                  trackable shipping method for returns.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Refunds</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Once we receive and inspect your return, we'll send you an email notification.
                  If approved, refunds will be processed to your original payment method within
                  7-10 business days. Please note that it may take additional time for your bank
                  or credit card company to process the refund.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Exchanges</h3>
                <p className="text-muted-foreground leading-relaxed">
                  If you need to exchange an item for a different size or color, please contact our
                  customer support team. We'll process your exchange as quickly as possible. If the
                  replacement item is not available, we'll issue a full refund.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Damaged or Defective Items</h3>
                <p className="text-muted-foreground leading-relaxed">
                  If you receive a damaged or defective item, please contact us immediately with
                  photos of the damage. We'll arrange for a replacement or full refund at no cost
                  to you, including return shipping.
                </p>
              </div>
            </div>
          </section>

          <section className="border-t pt-8">
            <h2 className="text-3xl font-semibold mb-6">Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about our shipping or return policies, please contact us:
            </p>
            <ul className="list-none space-y-2 text-muted-foreground mt-4">
              <li><strong>Email:</strong> zeeshaela@zescohnuts.com</li>
              <li><strong>Phone:</strong> +919469030389, +919797435756</li>
              <li><strong>Address:</strong> Baagatpora Handwara, Shopping District Kupwara, Jammu and Kashmir, India - 193221</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

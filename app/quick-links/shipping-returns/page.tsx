export default function ShippingReturnsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-black">Shipping Policy – Zescoh</h1>

        <p className="mb-10 text-black leading-relaxed">
          At Zescoh (ZeeShaEla & Co.), we take great care to ensure your order reaches you in the best condition, on time, and with complete transparency.
        </p>

        <div className="space-y-8 text-black">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Shipping Coverage</h2>
            <ul className="list-disc ml-6 space-y-2 leading-relaxed">
              <li>We currently deliver across India to all the pin codes covered by our courier partners.</li>
              <li>International shipping is not available at the moment (can be added in the future).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Order Processing</h2>
            <ul className="list-disc ml-6 space-y-2 leading-relaxed">
              <li>Orders are usually processed within 24–48 business hours of confirmation.</li>
              <li>Orders placed on weekends or public holidays will be processed on the next working day.</li>
              <li>Once shipped, you will receive an email/SMS/WhatsApp notification with tracking details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Delivery Timelines</h2>
            <ul className="list-disc ml-6 space-y-2 leading-relaxed">
              <li>Standard delivery within India typically takes 3–7 working days, depending on your location.</li>
              <li>Remote or rural areas may require additional days for delivery.</li>
              <li>Delivery timelines are estimates only and may vary due to unforeseen factors such as courier delays, strikes, natural calamities, or government restrictions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Shipping Charges</h2>
            <ul className="list-disc ml-6 space-y-2 leading-relaxed">
              <li>We offer free shipping on orders above a certain value (shall be reflected from time to time on our website www.zescohnuts.com).</li>
              <li>For orders below the free shipping threshold, a nominal delivery fee will apply, displayed at checkout before payment.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Order Tracking</h2>
            <ul className="list-disc ml-6 space-y-2 leading-relaxed">
              <li>Once dispatched, you can track your order using the tracking ID shared via SMS/email/WhatsApp.</li>
              <li>If you face issues with tracking, please reach out to our support team.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Packaging & Handling</h2>
            <ul className="list-disc ml-6 space-y-2 leading-relaxed">
              <li>All products are packed securely with proper sealing to maintain freshness, quality, and hygiene.</li>
              <li>Fragile items such as glass jars or gift packs are bubble-wrapped/honeycomb wrapped and double-checked before dispatch.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Delivery Issues</h2>
            <ul className="list-disc ml-6 space-y-2 leading-relaxed">
              <li>If you are not available at the delivery address, our courier partner will attempt re-delivery or contact you.</li>
              <li>In case of failed delivery due to incorrect address/contact details provided by you, re-shipping charges may apply.</li>
              <li>If a package is damaged in transit, please refuse to accept it and inform us immediately.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Delays & Exceptions</h2>
            <p className="leading-relaxed">
              While we strive to deliver on time, certain circumstances may cause delays (e.g., lockdowns, strikes, adverse weather). We will keep you updated if your shipment is affected.
            </p>
          </section>

          <section className="border-t pt-8 mt-10">
            <h2 className="text-2xl font-bold mb-4 text-black">Contact Us</h2>
            <p className="mb-3 leading-relaxed">For questions related to shipping, delivery status, or special instructions, you can reach us at:</p>
            <ul className="space-y-2 leading-relaxed ml-6">
              <li>📧 zeeshaela@zescohnuts.com</li>
              <li>📞 +91 9469030389, +91 9797435756</li>
              <li>💬 WhatsApp: wa.me/+919469030389, wa.me/9797435756</li>
            </ul>
          </section>

          <p className="mt-8 text-center italic leading-relaxed">
            ✨ At Zescoh, our mission is to deliver premium quality products to your doorstep quickly, safely, and hassle-free.
          </p>
        </div>
      </div>
    </div>
  );
}

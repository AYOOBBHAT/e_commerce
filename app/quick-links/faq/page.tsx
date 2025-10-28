import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-black">Frequently Asked Questions (FAQs)</h1>
        <p className="text-2xl mb-8 text-black">Zescoh</p>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold text-black">
              What products does Zescoh offer?
            </AccordionTrigger>
            <AccordionContent className="text-black">
              We specialize in premium dry fruits, spices, saffron, shilajit, Kashmiri walnuts, tea, and handmade healthy treats (like dry fruit ladoos made with desi ghee, no added sugar, and no preservatives).
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold text-black">
              How can I place an order?
            </AccordionTrigger>
            <AccordionContent className="text-black">
              You can place your order directly on our website www.zescohnuts.com. Simply browse products, add items to your cart, and proceed to checkout.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold text-black">
              Do I need to create an account to shop?
            </AccordionTrigger>
            <AccordionContent className="text-black">
              You can shop as a guest, but creating an account helps you:
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Save delivery details for faster checkout</li>
                <li>Track your orders easily</li>
                <li>Receive exclusive offers and discounts</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold text-black">
              What payment methods do you accept?
            </AccordionTrigger>
            <AccordionContent className="text-black">
              We accept:
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Credit/Debit Cards</li>
                <li>Net Banking</li>
                <li>UPI (Google Pay, PhonePe, Paytm, etc.)</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold text-black">
              How long does delivery take?
            </AccordionTrigger>
            <AccordionContent className="text-black">
              <ul className="list-disc ml-6 space-y-1">
                <li>Metro cities: 3–5 working days</li>
                <li>Other regions: 5–7 working days</li>
                <li>Remote/rural areas: May take slightly longer</li>
              </ul>
              <p className="mt-2">You will receive tracking details once your order is shipped.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold text-black">
              Do you offer free shipping?
            </AccordionTrigger>
            <AccordionContent className="text-black">
              Yes! Free shipping is available on select orders as reflected on our website. For orders below this amount, a nominal delivery fee will apply and will be shown at checkout.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold text-black">
              Can I cancel my order?
            </AccordionTrigger>
            <AccordionContent className="text-black">
              Yes, you can cancel your order before dispatch by contacting our customer care team. Once shipped, cancellations are not possible, but you may be eligible for returns under our Refund & Return Policy.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold text-black">
              What if I receive a damaged or wrong product?
            </AccordionTrigger>
            <AccordionContent className="text-black">
              If your package arrives damaged or you receive the wrong product, please contact us immediately with pictures of the product and packaging.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-9" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold text-black">
              What is your return & refund policy?
            </AccordionTrigger>
            <AccordionContent className="text-black">
              We have a 7-day return policy. If you're unhappy with the quality, freshness, or condition of your order, you can request a return. Refunds are usually provided as store credit or replacement. (See our full Refund Policy page for details.)
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-10" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold text-black">
              Do you ship internationally?
            </AccordionTrigger>
            <AccordionContent className="text-black">
              Currently, we deliver only within India. International shipping will be introduced soon.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-11" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold text-black">
              Are your products organic/natural?
            </AccordionTrigger>
            <AccordionContent className="text-black">
              Our dry fruits, spices, and wellness products are sourced from trusted farms and suppliers. Most products are naturally grown, premium-grade, and free from artificial preservatives or added sugars.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-12" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold text-black">
              Do you offer bulk or corporate gifting options?
            </AccordionTrigger>
            <AccordionContent className="text-black">
              Yes! We provide bulk orders and customized gifting solutions for weddings, festivals, and corporate events. Please contact us for personalized quotes.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-13" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold text-black">
              How can I contact customer support?
            </AccordionTrigger>
            <AccordionContent className="text-black">
              You can reach us at:
              <ul className="ml-6 mt-2 space-y-1">
                <li>📧 zeeshaela@zescohnuts.com</li>
                <li>📞 +91 9469030389, +91 9797435756</li>
                <li>💬 WhatsApp: wa.me/+919469030389, wa.me/9797435756</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <p className="mt-8 text-center text-black italic">
          ✨ At Zescoh, your satisfaction is our priority. If your question isn't listed here, feel free to reach out—we're always happy to help!
        </p>
      </div>
    </div>
  );
}

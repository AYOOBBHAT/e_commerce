import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold">
              How do I place an order?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              To place an order, simply browse our products, add items to your cart, and proceed to
              checkout. You'll need to create an account or log in, then provide your shipping
              information and payment details. Once your order is confirmed, you'll receive an email
              with your order details.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold">
              What payment methods do you accept?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              We accept major credit cards (Visa, MasterCard, American Express), debit cards, and
              various online payment methods including Razorpay, Paytm, and PhonePe. All payments
              are processed securely through our payment partners.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold">
              How long does shipping take?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Standard shipping typically takes 5-7 business days. Express shipping options are
              available at checkout for faster delivery (2-3 business days). Shipping times may
              vary based on your location and product availability.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold">
              What is your return policy?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              We offer a 30-day return policy on most items. Products must be unused, in their
              original packaging, and accompanied by proof of purchase. To initiate a return,
              please contact our customer support team. Some items may not be eligible for returns
              due to hygiene or safety reasons.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold">
              How can I track my order?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Once your order ships, you'll receive a tracking number via email. You can use this
              number to track your package on our website or the courier's website. You can also
              check your order status by logging into your account and viewing your order history.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold">
              Do you offer international shipping?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Currently, we only ship within India. We're working on expanding our shipping options
              to include international destinations in the near future. Please check back or
              subscribe to our newsletter for updates.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold">
              How do I contact customer support?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              You can reach our customer support team via email at zeeshaela@zescohnuts.com, by
              phone at +919469030389 or +919797435756, or through our social media channels.
              We're available Monday through Saturday, 9 AM to 6 PM IST.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8" className="border rounded-lg px-6">
            <AccordionTrigger className="text-lg font-semibold">
              Can I modify or cancel my order?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              You can modify or cancel your order within 2 hours of placing it. After this time,
              your order may have already been processed for shipping. Please contact customer
              support immediately if you need to make changes to your order.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

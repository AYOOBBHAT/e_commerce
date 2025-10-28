export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">About Us</h1>

        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to our online store! We are a dedicated team passionate about bringing you
              quality products at affordable prices. Since our founding in 2025, we've been committed
              to providing exceptional customer service and a seamless shopping experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our mission is to make online shopping easy, convenient, and enjoyable for everyone.
              We carefully curate our product selection to ensure that every item meets our high
              standards of quality and value.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Why Choose Us</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Wide selection of quality products</li>
              <li>Competitive pricing</li>
              <li>Fast and reliable shipping</li>
              <li>Secure payment options</li>
              <li>Dedicated customer support</li>
              <li>Easy returns and exchanges</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
            <p className="text-muted-foreground leading-relaxed">
              We believe in transparency, integrity, and putting our customers first. Every decision
              we make is guided by our commitment to providing you with the best possible shopping
              experience. We're constantly working to improve our services and expand our product
              offerings to meet your needs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              Have questions or feedback? We'd love to hear from you! Reach out to our customer
              support team, and we'll be happy to assist you with any inquiries you may have.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

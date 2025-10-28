export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">About Us</h1>

        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Welcome to ZeeShaEla & Co, the home of our proudly crafted brand <strong>Zescoh</strong>.
              At Zescoh, we bring together tradition, purity, and innovation to create products that
              celebrate the true essence of nature.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We specialize in premium dry fruits, spices, shilajit, saffron, tea, and pulses, carefully
              sourced and packed with the highest standards of quality. Our mission is simple yet profound:
              to pack the delight of nature's finest gifts and make them accessible and affordable for all.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Zescoh Handmade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Under our Handmade Section, we craft wholesome treats using only the best quality dry fruits,
              pure desi ghee, and absolutely no sugar, no preservatives, and no chemicals. This makes our
              products a healthy and affordable alternative to market sweets and chocolates.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4 font-medium">
              Our handmade range includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-2">
              <li><strong>Luddus</strong> – power-packed with nutrition and taste</li>
              <li><strong>Chocolates</strong> – indulgent yet guilt-free</li>
              <li><strong>Panjeeri</strong> – a traditional wellness delight</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Why Choose Us</h2>
            <ul className="list-disc list-inside space-y-3 text-muted-foreground">
              <li>
                <strong>Purity & Quality:</strong> Every product is made with uncompromising quality standards.
              </li>
              <li>
                <strong>State-of-the-Art Packaging:</strong> We use modern, hygienic, and innovative packaging
                to preserve freshness.
              </li>
              <li>
                <strong>Specialties:</strong> From our Shilajit to handmade luddus and chocolates, we offer
                products that are rooted in tradition yet crafted for modern lifestyles.
              </li>
            </ul>
          </section>

          <section>
            <p className="text-muted-foreground leading-relaxed text-lg">
              At Zescoh, we believe food is more than just consumption—it's health, culture, and joy shared
              with loved ones. We are committed to delivering not just products, but experiences filled with
              authenticity and trust.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

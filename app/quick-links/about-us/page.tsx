export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-10 text-black dark:text-white">About Us</h1>

        <div className="space-y-8 text-black dark:text-white leading-relaxed text-base md:text-lg">
          <section>
            <p className="mb-4">
              Welcome to <strong>ZeeShaEla & Co</strong>, the home of our proudly crafted brand <strong>Zescoh</strong>.
              At Zescoh, we bring together tradition, purity, and innovation to create products that
              celebrate the true essence of nature.
            </p>
            <p>
              We specialize in premium dry fruits, spices, shilajit, saffron, tea, and pulses, carefully
              sourced and packed with the highest standards of quality. Our mission is simple yet profound:
              to pack the delight of nature's finest gifts and make them accessible and affordable for all.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-5 text-black dark:text-white">Zescoh Handmade</h2>
            <p className="mb-4">
              Under our Handmade Section, we craft wholesome treats using only the best quality dry fruits,
              pure desi ghee, and absolutely <strong>no sugar, no preservatives, and no chemicals</strong>.
              This makes our products a healthy and affordable alternative to market sweets and chocolates.
            </p>
            <p className="font-semibold mb-3">Our handmade range includes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Luddus</strong> – power-packed with nutrition and taste</li>
              <li><strong>Chocolates</strong> – indulgent yet guilt-free</li>
              <li><strong>Panjeeri</strong> – a traditional wellness delight</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-5 text-black dark:text-white">Why Choose Us</h2>
            <ul className="space-y-4 ml-4">
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

          <section className="mt-10">
            <p className="italic">
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

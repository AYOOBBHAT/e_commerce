import Link from 'next/link';
import { ShoppingBag, Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { SITE_NAME, PRODUCT_CATEGORIES } from '@/lib/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-muted/50 text-muted-foreground border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="flex items-center mb-4 sm:mb-6">
              <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7 mr-2 text-primary" />
              <span className="text-lg sm:text-xl font-bold text-foreground">{SITE_NAME}</span>
            </Link>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">
              Your one-stop destination for quality products at great prices.
              We deliver exceptional shopping experiences since 2025.
            </p>
            <div className="flex space-x-4 sm:space-x-6">
              <a href="https://www.facebook.com/share/16u9y4pJCr/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-background/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="https://www.instagram.com/zescoh_foods?igsh=YzNvb2ZpdWQwMnhh" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-background/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="http://wa.me/+919469030389" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-background/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <FaWhatsapp className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="http://wa.me/9797435756" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-background/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <FaWhatsapp className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Categories</h3>
            <ul className="space-y-2 sm:space-y-3">
             
              
                {PRODUCT_CATEGORIES.map((category) => (
                  <li key={category.id}>
                    <Link 
                      href={`/category/${category.id}`}
                      className="text-sm sm:text-base hover:text-primary transition-colors duration-300 block py-1"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Quick Links</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a href="https://docs.google.com/document/d/1El6sSJKxkxNPV0tb-yv5sKjF3v4wcjUw/edit?usp=drivesdk&ouid=114474855162308920449&rtpof=true&sd=true" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base hover:text-primary transition-colors duration-300 block py-1">
                  About Us
                </a>
              </li>
              <li>
                <a href="https://docs.google.com/document/d/1mbWfl3Pqs_iVZU5AB4yiyTMquGOBWD8X/edit?usp=drivesdk&ouid=114474855162308920449&rtpof=true&sd=true" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base hover:text-primary transition-colors duration-300 block py-1">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://docs.google.com/document/d/1xBu-NolfzJzceszTnQ9UehEb7Aza2V8r/edit?usp=drivesdk&ouid=114474855162308920449&rtpof=true&sd=true" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base hover:text-primary transition-colors duration-300 block py-1">
                  FAQ
                </a>
              </li>
              <li>
                <a href="https://docs.google.com/document/d/1KxzpfX9AUz2SB178hggaZtKZ14iMKhOq/edit?usp=drivesdk&ouid=114474855162308920449&rtpof=true&sd=true" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base hover:text-primary transition-colors duration-300 block py-1">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="https://docs.google.com/document/d/1YGUHZgmC653AKGO2govIXDGrx5SIleHy/edit?usp=drivesdk&ouid=114474855162308920449&rtpof=true&sd=true" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base hover:text-primary transition-colors duration-300 block py-1">
                  Shipping & Returns
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Contact Us</h3>
            <ul className="space-y-3 sm:space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-1 flex-shrink-0 text-primary" />
                <span className="text-sm sm:text-base leading-relaxed">
                  Baagatpora Handwara  , Shopping District Kupwara, jammu and kashmir  India ,193221 
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
                <span className="text-sm sm:text-base">+919469030389, +919797435756</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
                <span className="text-sm sm:text-base break-all">zeeshaela@zescohnuts.com

</span>
              </li>
            </ul>
            
            {/* <div className="mt-6">
              <h4 className="text-sm font-medium text-foreground mb-2">Subscribe to Newsletter</h4>
              <form className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 min-w-0 px-3 py-2 text-sm rounded-l-md border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-r-md hover:bg-primary/90 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div> */}
          </div>
        </div>
        
        <div className="border-t border-border mt-8 sm:mt-12 pt-6 sm:pt-8 text-sm sm:text-base text-center">
          <p>&copy; {currentYear} {SITE_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
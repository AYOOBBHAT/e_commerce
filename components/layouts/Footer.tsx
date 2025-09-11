import Link from 'next/link';
import { ShoppingBag, Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { SITE_NAME, PRODUCT_CATEGORIES } from '@/lib/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-muted text-muted-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="flex items-center mb-4">
              <ShoppingBag className="h-6 w-6 mr-2 text-primary" />
              <span className="text-lg font-bold text-foreground">{SITE_NAME}</span>
            </Link>
            <p className="mb-4 text-sm">
              Your one-stop destination for quality products at great prices.
              We deliver exceptional shopping experiences since 2025.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/share/16u9y4pJCr/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/zescoh_foods?igsh=YzNvb2ZpdWQwMnhh" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="http://wa.me/+919469030389" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                <FaWhatsapp className="h-5 w-5" />
              </a>
              <a href="http://wa.me/9797435756" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                <FaWhatsapp className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="text-base font-medium text-foreground mb-4">Categories</h3>
            <ul className="space-y-3">
             
              
                {PRODUCT_CATEGORIES.map((category) => (
                  <li key={category.id}>
                    <Link 
                      href={`/category/${category.id}`}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-base font-medium text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="https://docs.google.com/document/d/1El6sSJKxkxNPV0tb-yv5sKjF3v4wcjUw/edit?usp=drivesdk&ouid=114474855162308920449&rtpof=true&sd=true" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-primary transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="https://docs.google.com/document/d/1mbWfl3Pqs_iVZU5AB4yiyTMquGOBWD8X/edit?usp=drivesdk&ouid=114474855162308920449&rtpof=true&sd=true" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://docs.google.com/document/d/1xBu-NolfzJzceszTnQ9UehEb7Aza2V8r/edit?usp=drivesdk&ouid=114474855162308920449&rtpof=true&sd=true" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="https://docs.google.com/document/d/1KxzpfX9AUz2SB178hggaZtKZ14iMKhOq/edit?usp=drivesdk&ouid=114474855162308920449&rtpof=true&sd=true" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-primary transition-colors">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="https://docs.google.com/document/d/1YGUHZgmC653AKGO2govIXDGrx5SIleHy/edit?usp=drivesdk&ouid=114474855162308920449&rtpof=true&sd=true" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-primary transition-colors">
                  Shipping & Returns
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-base font-medium text-foreground mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Baagatpora Handwara  , Shopping District Kupwara, jammu and kashmir  India ,193221 
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">+919469030389,+919797435756</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm"> zeeshaela@zescohnuts.com

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
        
        <div className="border-t border-border mt-12 pt-6 text-sm text-center">
          <p>&copy; {currentYear} {SITE_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
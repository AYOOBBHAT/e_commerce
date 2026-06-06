import Image from 'next/image'

const DESKTOP_IMAGE = 'https://res.cloudinary.com/dfocwbzzo/image/upload/v1766593358/8160adc6-6a84-489b-a091-9cb0eaa2882b_msvwb0.png'
const MOBILE_IMAGE = 'https://res.cloudinary.com/dfocwbzzo/image/upload/v1766593378/543bf683-c273-4e0a-b9ac-621c189547e2_fxhlft.png'

export default function Hero() {
  return (
    <div className="relative w-full bg-white -mt-14 sm:-mt-16 lg:-mt-20">
      {/* Mobile Image Container - Full viewport width, fills screen */}
      <div className="relative w-full sm:hidden bg-white pt-14">
        <div className="relative w-full h-[60vh] min-h-[400px] max-h-[700px] bg-white">
          <Image
            src={MOBILE_IMAGE}
            alt="Hero image"
            fill
            priority
            className="object-cover object-top"
            sizes="100vw"
            quality={90}
          />
        </div>
      </div>
      
      {/* Desktop Image Container - Full viewport width, fills screen */}
      <div className="hidden sm:block relative w-full bg-white pt-16 lg:pt-20">
        <div className="relative w-full h-[70vh] lg:h-[80vh] min-h-[500px] lg:min-h-[600px] max-h-[900px] bg-white">
        <Image
          src={DESKTOP_IMAGE}
          alt="Hero image"
          fill
          priority
            className="object-cover object-top"
          sizes="100vw"
            quality={90}
        />
        </div>
      </div>
    </div>
  )
}

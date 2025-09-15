import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary';

// Extended category data with images for display
const categoryData = [
	{
		...PRODUCT_CATEGORIES[0],
		image: 'https://res.cloudinary.com/dfocwbzzo/image/upload/v1757784053/file_00000000ca44622fae0e8728733e376e_gflfzi.png',
	},
	{
		...PRODUCT_CATEGORIES[2],
		image: 'https://res.cloudinary.com/dfocwbzzo/image/upload/v1757779671/file_000000004cbc61fb85a27a99641c5f0a_ezwev8.png',
	},
	{
		...PRODUCT_CATEGORIES[1],
		image: 'https://res.cloudinary.com/dfocwbzzo/image/upload/v1757784880/file_000000009388622f87236522f0f9e735_1_u1aled.png',
	},
	{
		...PRODUCT_CATEGORIES[3],
		image: 'https://res.cloudinary.com/dfocwbzzo/image/upload/v1757782102/file_000000006b9c62308d886b394646f926_wis2jx.png',
	},
	{
		...PRODUCT_CATEGORIES[5],
		image: 'https://res.cloudinary.com/dfocwbzzo/image/upload/v1757778403/file_000000009a8461faac46955475308e19_l8mmgh.png',
	},
	{
		...PRODUCT_CATEGORIES[4],
		image: 'https://res.cloudinary.com/dfocwbzzo/image/upload/v1757783218/file_0000000067cc6243af79812b879adfa5_1_nwyywo.png',
	},
];

export default function CategoryGrid() {
			return (
				<section className="py-8 sm:py-12 lg:py-16 bg-muted/50">
			<div className="container px-4 sm:px-6 lg:px-8 mx-auto">
				<div className="text-center mb-8 sm:mb-10 lg:mb-12">
					<h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
						Shop by Category
					</h2>
					
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
					{categoryData.map((category) => (
						<Link
							key={category.id}
							href={`/category/${category.id}`}
							className="group relative rounded-xl overflow-hidden flex h-[200px] sm:h-[250px] lg:h-[280px] shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
						>
											<Image
												src={getOptimizedCloudinaryUrl(category.image, 400)}
												alt={category.name}
												fill
												className="object-contain bg-white transition-transform duration-700 group-hover:scale-105"
												sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
											/>
							{/* Overlay gradient */}
							<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/5"></div>
							<div className="relative flex flex-col p-6 mt-auto">
								
								
								<Button
									variant="outline"
									size="sm"
									className="w-fit mt-auto bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white hover:text-black group-hover:scale-105 transition-all duration-300"
								>
									{category.name}
									<ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							</div>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}
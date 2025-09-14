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
				<section className="py-12 md:py-16 bg-muted">
			<div className="container px-4 mx-auto">
				<div className="text-center mb-8 md:mb-12">
					<h2 className="text-2xl md:text-3xl font-bold">
						Shop by Category
					</h2>
					
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{categoryData.map((category) => (
						<Link
							key={category.id}
							href={`/category/${category.id}`}
							className="group relative rounded-lg overflow-hidden flex h-[250px] shadow-sm transition-all hover:shadow-md"
						>
							<Image
								src={getOptimizedCloudinaryUrl(category.image, 400)}
								alt={category.name}
								fill
								className="object-cover transition-transform duration-500 group-hover:scale-110"
								sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
							/>
							{/* Overlay gradient */}
							<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/5"></div>
							<div className="relative flex flex-col p-6 mt-auto">
								
								<Button
									variant="secondary"
									className="w-fit mt-auto group-hover:scale-105 transition-transform"
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
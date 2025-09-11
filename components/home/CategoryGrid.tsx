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
		image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=compress&w=400&q=80',
		description: 'Nutritious handmade healthy bites for every occasion.',
	},
	{
		...PRODUCT_CATEGORIES[1],
		image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=compress&w=400&q=80',
		description: 'Customised handmade treats crafted with care.',
	},
	{
		...PRODUCT_CATEGORIES[2],
		image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=compress&w=400&q=80',
		description: 'Delights from the heart of Kashmir.',
	},
	{
		...PRODUCT_CATEGORIES[3],
		image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=compress&w=400&q=80',
		description: 'Premium seeds for health and taste.',
	},
	{
		...PRODUCT_CATEGORIES[4],
		image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=compress&w=400&q=80',
		description: 'Aromatic spices to elevate your dishes.',
	},
	{
		...PRODUCT_CATEGORIES[5],
		image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=compress&w=400&q=80',
		description: 'Farm fresh dry fruits and nuts for a healthy lifestyle.',
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
					<p className="text-muted-foreground mt-2">
						Browse our curated collections
					</p>
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
								<h3 className="text-xl font-semibold text-white mb-1">
									{category.name}
								</h3>
								<p className="text-white/80 mb-4 text-sm">
									{category.description}
								</p>
								<Button
									variant="secondary"
									className="w-fit mt-auto group-hover:scale-105 transition-transform"
								>
									Shop {category.name}
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
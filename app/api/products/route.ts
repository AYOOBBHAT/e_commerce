import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectToDatabase();
    const products = await Product.find().sort({ createdAt: -1 });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

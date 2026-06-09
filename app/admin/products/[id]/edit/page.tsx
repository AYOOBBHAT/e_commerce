"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ProductImageUploadPanel, { syncImageMetaWithUrls } from "@/components/admin/ProductImageUploadPanel";
import { useAdminCategoryOptions } from "@/components/admin/useAdminCategoryOptions";
import type { ProductImageMeta } from "@/lib/product-image-quality";
import { validateFeaturedProduct } from "@/lib/product-image-quality";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageMeta, setImageMeta] = useState<ProductImageMeta[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    comparePrice: "",
    unitLabel: "",
    category: "",
    quantity: "",
    featured: false,
    inStock: true,
  });
  const { options: categoryOptions } = useAdminCategoryOptions(form.category);
  const [variants, setVariants] = useState<
    { label: string; price: string; comparePrice: string }[]
  >([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/admin/products/${productId}`);
        if (!res.ok) throw new Error('Failed to fetch product');
        const product = await res.json();
        setForm({
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price.toString(),
          comparePrice: product.comparePrice ? product.comparePrice.toString() : "",
          unitLabel: product.unitLabel || "",
          category: product.category,
          quantity: product.quantity?.toString() || "0",
          featured: product.featured || false,
          inStock: product.inStock,
        });
        setImages(product.images || []);
        setImageMeta(
          syncImageMetaWithUrls(product.images || [], product.imageMeta || []),
        );
        setVariants(
          (product.variants || []).map((variant: any) => ({
            label: variant.label,
            price: variant.price?.toString() || "",
            comparePrice: variant.comparePrice?.toString() || "",
          }))
        );
      } catch (error) {
        console.error('Error fetching product:', error);
        alert('Failed to fetch product details');
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target;
    if (type === 'checkbox') {
      setForm({
        ...form,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }
  };

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, { label: "", price: "", comparePrice: "" }]);
  };

  const handleVariantChange = (
    index: number,
    field: keyof { label: string; price: string; comparePrice: string },
    value: string
  ) => {
    setVariants((prev) =>
      prev.map((variant, i) => (i === index ? { ...variant, [field]: value } : variant))
    );
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      alert("Please upload at least one product image");
      return;
    }
    const featuredError = validateFeaturedProduct({
      featured: form.featured,
      images,
      imageMeta,
    });
    if (featuredError) {
      alert(featuredError);
      return;
    }
    setIsLoading(true);
    try {
      const currentRes = await fetch(`/api/admin/products/${productId}`);
      if (!currentRes.ok) {
        throw new Error('Failed to refresh product quantity');
      }
      const currentProduct = await currentRes.json();
      const currentQuantity =
        typeof currentProduct.quantity === 'number' ? currentProduct.quantity : 0;
      const desiredQuantity = parseInt(form.quantity, 10);
      const inventoryAdjustment = desiredQuantity - currentQuantity;

      const payload: Record<string, unknown> = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
        unitLabel: form.unitLabel.trim() || undefined,
        category: form.category,
        variants: variants
          .filter((variant) => variant.label && variant.price)
          .map((variant) => ({
            label: variant.label,
            price: parseFloat(variant.price),
            comparePrice: variant.comparePrice ? parseFloat(variant.comparePrice) : undefined,
          })),
        images: images,
        imageMeta: syncImageMetaWithUrls(images, imageMeta),
        featured: form.featured,
      };

      if (inventoryAdjustment !== 0) {
        payload.inventoryAdjustment = inventoryAdjustment;
      }

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update product");
        throw new Error(errorData.error || "Failed to update product");
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      // error already shown in alert above
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-lg border">
        <div>
          <Label htmlFor="name">Product Name</Label>
          <Input id="name" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" value={form.slug} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" value={form.description} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="price">Price (₹)</Label>
          <Input id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required placeholder="Enter price in INR" />
        </div>
        <div>
          <Label htmlFor="comparePrice">Original Price / MRP (₹)</Label>
          <Input
            id="comparePrice"
            name="comparePrice"
            type="number"
            min="0"
            step="0.01"
            value={form.comparePrice}
            onChange={handleChange}
            placeholder="Optional: enter MRP to show discount"
          />
        </div>
        <div>
          <Label htmlFor="unitLabel">Pack Size / Weight Label</Label>
          <Input
            id="unitLabel"
            name="unitLabel"
            value={form.unitLabel}
            onChange={handleChange}
            placeholder="e.g. 250 g | 500 ml | Pack of 2"
          />
          <p className="text-xs text-muted-foreground mt-1">Shown with the product price across the storefront.</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Pack Variants (optional)</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddVariant}>
              Add Variant
            </Button>
          </div>
          {variants.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Add multiple pack sizes (e.g. 250 g / 500 g) with individual pricing.
            </p>
          )}
          {variants.map((variant, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end border rounded-lg p-3"
            >
              <div>
                <Label className="text-xs">Label</Label>
                <Input
                  value={variant.label}
                  onChange={(e) => handleVariantChange(index, 'label', e.target.value)}
                  placeholder="e.g. 250 g"
                />
              </div>
              <div>
                <Label className="text-xs">Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.price}
                  onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">MRP (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.comparePrice}
                    onChange={(e) => handleVariantChange(index, 'comparePrice', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-5 text-red-500"
                  onClick={() => handleRemoveVariant(index)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <select id="category" name="category" value={form.category} onChange={handleChange} className="w-full border rounded px-3 py-2">
            {categoryOptions.map((cat) => (
              <option key={cat.slug} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} required />
        </div>
        <ProductImageUploadPanel
          images={images}
          imageMeta={imageMeta}
          onChange={(nextImages, nextMeta) => {
            setImages(nextImages);
            setImageMeta(nextMeta);
          }}
        />
        <div>
          <Label htmlFor="featured">Featured Product</Label>
          <p className="text-xs text-muted-foreground mb-1">
            Requires main image status Approved or Featured Ready (score ≥ 7.5).
          </p>
          <input
            id="featured"
            name="featured"
            type="checkbox"
            checked={form.featured}
            onChange={handleChange}
            className="ml-2"
          />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Updating..." : "Update Product"}
        </Button>
      </form>
    </div>
  );
}
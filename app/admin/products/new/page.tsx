"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import Image from "next/image";
import { X } from "lucide-react";

const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ecommerce_preset";
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";

export default function AddProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    comparePrice: "",
    unitLabel: "",
    category: PRODUCT_CATEGORIES[0]?.id || "",
    quantity: "",
    featured: false,
  });
  const [variants, setVariants] = useState<
    { label: string; price: string; comparePrice: string }[]
  >([]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setImageUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.secure_url) {
          return data.secure_url;
        }
        return null;
      } catch {
        return null;
      }
    });

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url): url is string => url !== null);
      if (validUrls.length > 0) {
        setImages((prev) => [...prev, ...validUrls]);
      } else {
        alert("Image upload failed");
      }
    } catch {
      alert("Image upload failed");
    } finally {
      setImageUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      const [moved] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, moved);
      return newImages;
    });
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
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
          unitLabel: form.unitLabel.trim() || undefined,
          variants: variants
            .filter((variant) => variant.label && variant.price)
            .map((variant) => ({
              label: variant.label,
              price: parseFloat(variant.price),
              comparePrice: variant.comparePrice ? parseFloat(variant.comparePrice) : undefined,
            })),
          quantity: parseInt(form.quantity, 10),
          images: images,
          inStock: parseInt(form.quantity, 10) > 0,
          featured: form.featured,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Failed to add product");
        throw new Error(errorData.error || "Failed to add product");
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
      <h1 className="text-2xl font-bold mb-6">Add Product</h1>
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
                  placeholder="699"
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
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="images">Product Images</Label>
          <p className="text-sm text-muted-foreground mb-2">First image will be the main display image. You can upload multiple images at once.</p>
          <Input id="images" name="images" type="file" accept="image/*" multiple onChange={handleImageUpload} />
          {imageUploading && <div className="text-sm text-muted-foreground mt-1">Uploading...</div>}
          {images.length > 0 && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-square rounded border overflow-hidden bg-gray-100">
                      <Image 
                        src={image} 
                        alt={`Product image ${index + 1}`} 
                        fill
                        className="object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Main
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, 0)}
                        className="mt-1 text-xs text-primary hover:underline w-full text-center"
                      >
                        Set as main
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="featured">Featured Product</Label>
          <input
            id="featured"
            name="featured"
            type="checkbox"
            checked={form.featured}
            onChange={handleChange}
            className="ml-2"
          />
        </div>
        <Button type="submit" disabled={isLoading || imageUploading} className="w-full">
          {isLoading ? "Adding..." : "Add Product"}
        </Button>
      </form>
    </div>
  );
}

// Cloudinary image optimization helper
// Note: Next.js Image component handles optimization automatically, so this is mainly for non-Image use cases
export function getOptimizedCloudinaryUrl(url: string, width = 400) {
  if (!url || !url.includes('cloudinary.com')) return url;
  // Only add transformation if not already present
  if (url.includes('/upload/') && !url.includes('/upload/w_')) {
    // Use f_auto to allow Next.js to choose WebP/AVIF format
    return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`);
  }
  return url;
}
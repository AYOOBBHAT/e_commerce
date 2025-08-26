// Cloudinary image optimization helper
export function getOptimizedCloudinaryUrl(url: string, width = 400) {
  if (!url || !url.includes('cloudinary.com')) return url;
  // Only add transformation if not already present
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`);
  }
  return url;
}
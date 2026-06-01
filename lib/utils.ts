import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Normalizes an image path by handling backslashes, ensuring a leading slash,
 * and ignoring external URLs.
 * @param imagePath - The path or URL to normalize
 * @returns A normalized path or URL
 */
export function normalizeImagePath(imagePath: string): string {
  if (!imagePath) return "";
  let p = imagePath.replace(/\\/g, "/");
  if (p.startsWith("/")) return p;
  if (p.startsWith("http")) return p;
  return "/" + p;
}

/**
 * Generates a URL-friendly slug from text
 * @param text - The text to convert to slug
 * @returns A clean, URL-friendly slug
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Remove leading hyphens
    .replace(/-+$/, ''); // Remove trailing hyphens
}

/**
 * Generates a unique slug by appending a counter if the base slug exists
 * @param baseSlug - The base slug to make unique
 * @param checkExists - Function to check if slug exists
 * @returns A unique slug
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let finalSlug = baseSlug;
  let counter = 1;
  
  while (await checkExists(finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
    
    // Safety limit to prevent infinite loops
    if (counter > 1000) {
      throw new Error('Unable to generate unique slug after 1000 attempts');
    }
  }
  
  return finalSlug;
}








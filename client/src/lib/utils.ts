import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CSSProperties } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildBackgroundStyle({ imageUrl, color }: { imageUrl?: string | null; color?: string | null }): CSSProperties | undefined {
  const trimmedImageUrl = imageUrl?.trim();
  const trimmedColor = color?.trim();
  
  if (!trimmedImageUrl && !trimmedColor) {
    return undefined;
  }
  
  const style: CSSProperties = {};
  
  if (trimmedImageUrl) {
    if (trimmedImageUrl.startsWith('http://') || trimmedImageUrl.startsWith('https://') || trimmedImageUrl.startsWith('/')) {
      style.backgroundImage = `url(${trimmedImageUrl})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
      style.backgroundRepeat = "no-repeat";
      style.backgroundAttachment = "scroll";
    }
  }
  
  if (trimmedColor) {
    style.backgroundColor = trimmedColor;
  }
  
  if (Object.keys(style).length === 0) {
    return undefined;
  }
  
  return style;
}

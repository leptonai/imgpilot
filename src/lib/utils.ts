import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export function getRandomDifferent<T>(arr: T[], lastItem: T | null): T {
  if (arr.length === 1) {
    return arr[0];
  }

  let item: T;
  do {
    item = arr[Math.floor(Math.random() * arr.length)];
  } while (item === lastItem);

  return item;
}

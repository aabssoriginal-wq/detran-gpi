import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarDataBR(dataIso: string | undefined | null): string {
  if (!dataIso) return "N/D";
  // Suporta AAAA-MM-DD
  const parts = dataIso.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataIso;
}

import { clsx, type ClassValue } from "clsx";
import { CHAIN_DECIMALS } from "contract-instance";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function convertPrice(rawPrice: string): number {
  return Number(rawPrice) / Math.pow(10, CHAIN_DECIMALS);
}

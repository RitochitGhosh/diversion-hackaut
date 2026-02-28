import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { customAlphabet } from 'nanoid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

export function generateServiceCode(): string {
  return `SVC-${nanoid()}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING_AI: 'Processing',
  PENDING_REVIEW: 'Awaiting Review',
  APPROVED: 'Approved',
  EDITED: 'Edited',
  REJECTED: 'Rejected',
  ANSWERED: 'Answered',
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING_AI: 'bg-neo-purple border-neo-black',
  PENDING_REVIEW: 'bg-neo-yellow border-neo-black',
  APPROVED: 'bg-neo-green border-neo-black',
  EDITED: 'bg-neo-blue border-neo-black',
  REJECTED: 'bg-neo-orange border-neo-black',
  ANSWERED: 'bg-neo-green border-neo-black',
};
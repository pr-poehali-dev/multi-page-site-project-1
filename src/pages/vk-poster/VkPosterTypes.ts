import type { VKBridge } from '@vkontakte/vk-bridge';

export const bridge = (window as unknown as { vkBridge: VKBridge }).vkBridge;

export const CONTESTS_API = 'https://functions.poehali.dev/53be7002-a84e-4d38-9e81-96d7078f25b3';

export interface VkUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_100: string;
}

export interface Contest {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  pdf_url?: string;
  poster_url?: string;
  logo_url?: string;
  location?: string;
  event_date?: string;
  application_form_url?: string;
  blank_form_url?: string;
  application_type?: 'external' | 'internal';
}

export function formatDateShort(iso: string) {
  const d = new Date(iso);
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return { day: d.getDate(), month: months[d.getMonth()], year: d.getFullYear() };
}

export function siteUrl(path: string) {
  return `https://индиго-арт.рф${path}`;
}

export const palettes = [
  { from: '#7c3aed', to: '#a855f7' },
  { from: '#ec4899', to: '#f43f5e' },
  { from: '#4f46e5', to: '#7c3aed' },
  { from: '#d946ef', to: '#ec4899' },
  { from: '#9333ea', to: '#d946ef' },
  { from: '#3d6fa0', to: '#5a8fc0' },
];

export function paletteFor(index: number) {
  return palettes[index % palettes.length];
}
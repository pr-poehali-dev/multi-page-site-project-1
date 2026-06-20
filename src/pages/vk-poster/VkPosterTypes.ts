import type { VKBridge } from '@vkontakte/vk-bridge';

export const bridge = (window as unknown as { vkBridge: VKBridge }).vkBridge;

export const API_URL = 'https://functions.poehali.dev/be285661-455d-4c13-b45f-897f4395817d';
export const UPLOAD_URL = 'https://functions.poehali.dev/cfc99bc2-daff-4110-b9e4-c9699841a7d3';

export interface VkUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_100: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  deadline: string | null;
  location: string;
  poster_url: string | null;
  ticket_url: string | null;
  page_url: string | null;
  is_published: boolean;
}

export interface EventForm {
  title: string;
  description: string;
  event_date: string;
  deadline: string;
  location: string;
  poster_url: string;
  ticket_url: string;
  page_url: string;
  is_published: boolean;
}

export const emptyForm: EventForm = {
  title: '',
  description: '',
  event_date: '',
  deadline: '',
  location: '',
  poster_url: '',
  ticket_url: '',
  page_url: '',
  is_published: true,
};

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateShort(iso: string) {
  const d = new Date(iso);
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return { day: d.getDate(), month: months[d.getMonth()], year: d.getFullYear() };
}

export function getLaunchParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    groupId: params.get('vk_group_id') || params.get('group_id') || null,
    role: params.get('vk_viewer_group_role') || null,
  };
}

export const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#555',
};

// Единая точка отправки конверсионных событий в Яндекс.Метрику и VK Пиксель рекламных кабинетов.
// Используется во всех формах: заявка на конкурс, регистрация, заказ, обратная связь, отзыв.

declare global {
  interface Window {
    ym?: (counterId: number, method: string, goal: string, params?: Record<string, unknown>) => void;
    VK?: { Retargeting?: { Event: (eventName: string) => void } };
  }
}

const YM_COUNTER_ID = 109857351;

export type AnalyticsGoal =
  | 'application_submit'
  | 'register_complete'
  | 'order_start'
  | 'order_paid'
  | 'contact_submit'
  | 'review_submit'
  | 'apply_click';

export const trackGoal = (goal: AnalyticsGoal) => {
  try {
    window.ym?.(YM_COUNTER_ID, 'reachGoal', goal);
  } catch {
    /* Метрика могла не успеть загрузиться (блокировщики рекламы и т.п.) — не мешаем работе сайта */
  }
  try {
    window.VK?.Retargeting?.Event(goal);
  } catch {
    /* аналогично для VK Пикселя */
  }
};
export interface DiplomaTemplate {
  id: number;
  name: string;
  template_type: 'diploma' | 'thanks';
  orientation: 'portrait' | 'landscape';
  background_url: string;
  fields_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DiplomaTemplateField {
  id?: number;
  template_id?: number;
  data_key: string;
  custom_text: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  font_family: string;
  font_size: number;
  font_color: string;
  font_weight: string;
  line_height: number;
  text_align: 'left' | 'center' | 'right' | 'justify';
  sort_order?: number;
}

export interface DiplomaFont {
  id: number;
  name: string;
  font_url: string;
}

export interface DataFieldOption {
  key: string;
  label: string;
}

// Поля данных, доступные для подстановки в диплом/благодарность.
// Значения берутся из программы конкурса (contest_program) и результатов оценивания.
export const DIPLOMA_DATA_FIELDS: DataFieldOption[] = [
  { key: 'custom', label: 'Свой текст' },
  { key: 'participant_name', label: 'ФИО / Название коллектива' },
  { key: 'director_name', label: 'ФИО руководителя' },
  { key: 'region', label: 'Регион' },
  { key: 'directing_party', label: 'Направляющая сторона' },
  { key: 'age', label: 'Возрастная категория' },
  { key: 'nomination', label: 'Номинация' },
  { key: 'piece_title', label: 'Название номера' },
  { key: 'duration', label: 'Хронометраж' },
  { key: 'participation_format', label: 'Формат участия' },
  { key: 'diploma_number', label: 'Номер диплома' },
  { key: 'award', label: 'Звание (Лауреат, Дипломант и т.д.)' },
  { key: 'contest_title', label: 'Название конкурса' },
  { key: 'contest_location', label: 'Город конкурса' },
  { key: 'contest_event_date', label: 'Дата конкурса' },
];

export const FONT_OPTIONS = ['Montserrat', 'Open Sans', 'Playfair Display', 'Great Vibes', 'PT Serif', 'Cormorant Garamond'];

export const MM_TO_PX = 3.7795275591; // 96 dpi
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

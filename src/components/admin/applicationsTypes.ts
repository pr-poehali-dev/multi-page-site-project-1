export interface CustomFieldDef {
  field_name: string;
  field_label: string;
  field_type: string;
}

export interface Application {
  id: number;
  participant_id: number;
  contest_id: number;
  contest_title: string;
  full_name: string;
  contact_position?: string;
  email: string;
  phone: string;
  vk_link?: string;
  city: string;
  category: string;
  performance_title?: string;
  participation_format?: string;
  nomination?: string;
  experience: string;
  achievements: string;
  additional_info: string;
  custom_fields?: Record<string, string>;
  status: string;
  submitted_at: string;
  editing_locked?: boolean;
  applications_locked?: boolean;
  admin_comment?: string;
  files?: Array<{
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
  }>;
}

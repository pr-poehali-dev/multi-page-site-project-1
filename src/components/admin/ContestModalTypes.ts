export interface ContestFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  rules?: string;
  prizes?: string;
  categories?: string;
  pdf_url?: string;
  poster_url?: string;
  ticket_link?: string;
  details_link?: string;
  location?: string;
  event_date?: string;
  application_form_url?: string;
}

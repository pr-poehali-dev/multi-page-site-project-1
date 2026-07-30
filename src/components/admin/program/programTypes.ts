export interface ProgramRow {
  id: number;
  order_number: number;
  region: string;
  directing_party: string;
  participant_name: string;
  age: string;
  nomination: string;
  piece_title: string;
  duration: string;
  diploma_number: string;
  director_name: string;
  participation_format: string;
  nomination_id: number | null;
}

export interface NominationOption {
  id: number;
  name: string;
}

export interface Contest {
  id: number;
  title: string;
  location?: string;
  event_date?: string;
  end_date?: string;
}

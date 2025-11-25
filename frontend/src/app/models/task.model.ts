export type TaskStatus = 'zu_erledigen' | 'mach_ich_gerade' | 'erledigt';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'specific_date';

export interface Task {
  id: number;
  kid_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  recurrence_type: RecurrenceType;
  recurrence_date: Date | null;
  scheduled_time: string | null;
  last_reset: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  zu_erledigen: 'Zu erledigen',
  mach_ich_gerade: 'Mach ich gerade',
  erledigt: 'Erledigt'
};

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: 'Keine Wiederholung',
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
  specific_date: 'Bestimmtes Datum'
};

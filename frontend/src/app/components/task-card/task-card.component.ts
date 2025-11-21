import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, RECURRENCE_LABELS } from '../../models/task.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss']
})
export class TaskCardComponent {
  @Input() task!: Task;
  recurrenceLabels = RECURRENCE_LABELS;

  getRecurrenceInfo(): string {
    if (this.task.recurrence_type === 'none') {
      return '';
    }
    if (this.task.recurrence_type === 'specific_date' && this.task.recurrence_date) {
      const date = new Date(this.task.recurrence_date);
      return `Zurücksetzen am ${date.toLocaleDateString('de-DE')}`;
    }
    return this.recurrenceLabels[this.task.recurrence_type];
  }
}

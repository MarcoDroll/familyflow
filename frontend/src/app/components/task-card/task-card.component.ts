import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskStatus, RECURRENCE_LABELS, TASK_STATUS_LABELS } from '../../models/task.model';
import { LinkifyPipe } from '../../pipes/linkify.pipe';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, LinkifyPipe],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss']
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Output() statusChange = new EventEmitter<TaskStatus>();
  
  recurrenceLabels = RECURRENCE_LABELS;
  statusLabels = TASK_STATUS_LABELS;
  showActions = false;

  // Status flow: zu_erledigen -> mach_ich_gerade -> erledigt
  private statusOrder: TaskStatus[] = ['zu_erledigen', 'mach_ich_gerade', 'erledigt'];

  getRecurrenceInfo(): string {
    if (this.task.recurrence_type === 'none') {
      return '';
    }
    if (this.task.recurrence_type === 'specific_date' && this.task.recurrence_date) {
      const date = new Date(this.task.recurrence_date);
      return 'Zurücksetzen am ' + date.toLocaleDateString('de-DE');
    }
    return this.recurrenceLabels[this.task.recurrence_type];
  }

  toggleActions(event: Event): void {
    event.stopPropagation();
    this.showActions = !this.showActions;
  }

  getPrevStatus(): TaskStatus | null {
    const currentIndex = this.statusOrder.indexOf(this.task.status);
    if (currentIndex > 0) {
      return this.statusOrder[currentIndex - 1];
    }
    return null;
  }

  getNextStatus(): TaskStatus | null {
    const currentIndex = this.statusOrder.indexOf(this.task.status);
    if (currentIndex < this.statusOrder.length - 1) {
      return this.statusOrder[currentIndex + 1];
    }
    return null;
  }

  moveToStatus(status: TaskStatus, event: Event): void {
    event.stopPropagation();
    this.statusChange.emit(status);
    this.showActions = false;
  }
}

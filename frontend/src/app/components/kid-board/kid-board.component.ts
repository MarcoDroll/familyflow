import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Kid } from '../../models/kid.model';
import { Task, TaskStatus, TASK_STATUS_LABELS } from '../../models/task.model';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-kid-board',
  standalone: true,
  imports: [CommonModule, TaskCardComponent],
  templateUrl: './kid-board.component.html',
  styleUrls: ['./kid-board.component.scss']
})
export class KidBoardComponent implements OnInit {
  kid: Kid | null = null;
  tasks: Task[] = [];
  tasksByStatus: Map<TaskStatus, Task[]> = new Map();
  statusColumns: TaskStatus[] = ['zu_erledigen', 'mach_ich_gerade', 'erledigt'];
  statusLabels = TASK_STATUS_LABELS;
  draggedTask: Task | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const kidId = this.route.snapshot.paramMap.get('id');
    if (kidId) {
      this.loadKid(parseInt(kidId));
      this.loadTasks(parseInt(kidId));
    }
  }

  loadKid(kidId: number): void {
    this.apiService.getKid(kidId).subscribe({
      next: (kid) => {
        this.kid = kid;
      },
      error: (error) => {
        console.error('Error loading kid:', error);
      }
    });
  }

  loadTasks(kidId: number): void {
    this.apiService.getTasks(kidId).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.groupTasksByStatus();
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      }
    });
  }

  groupTasksByStatus(): void {
    this.tasksByStatus.clear();
    this.statusColumns.forEach(status => {
      this.tasksByStatus.set(status, []);
    });

    this.tasks.forEach(task => {
      const statusTasks = this.tasksByStatus.get(task.status) || [];
      statusTasks.push(task);
      this.tasksByStatus.set(task.status, statusTasks);
    });
  }

  onDragStart(event: DragEvent, task: Task): void {
    this.draggedTask = task;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, newStatus: TaskStatus): void {
    event.preventDefault();
    if (this.draggedTask && this.draggedTask.status !== newStatus) {
      this.updateTaskStatus(this.draggedTask, newStatus);
    }
    this.draggedTask = null;
  }

  updateTaskStatus(task: Task, newStatus: TaskStatus): void {
    this.apiService.updateTaskStatus(task.id, newStatus).subscribe({
      next: (updatedTask) => {
        const taskIndex = this.tasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = updatedTask;
          this.groupTasksByStatus();
        }
      },
      error: (error) => {
        console.error('Error updating task status:', error);
      }
    });
  }

  getColumnClass(status: TaskStatus): string {
    return `status-${status}`;
  }

  backToDashboard(): void {
    this.router.navigate(['/']);
  }

  getOpenTasksCount(): number {
    const todoCount = this.tasksByStatus.get('zu_erledigen')?.length || 0;
    const doingCount = this.tasksByStatus.get('mach_ich_gerade')?.length || 0;
    return todoCount + doingCount;
  }
}

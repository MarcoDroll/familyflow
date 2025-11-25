import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Kid } from '../../models/kid.model';
import { Task, RecurrenceType, TASK_STATUS_LABELS, RECURRENCE_LABELS } from '../../models/task.model';

interface KidStats {
  kid: Kid;
  totalTasks: number;
  zuErledigen: number;
  machIchGerade: number;
  erledigt: number;
  completionRate: number;
}

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './parent-dashboard.component.html',
  styleUrls: ['./parent-dashboard.component.scss']
})

export class ParentDashboardComponent implements OnInit {
  kids: Kid[] = [];
  selectedKid: Kid | null = null;
  tasks: Task[] = [];
  allTasks: Task[] = [];
  kidStats: KidStats[] = [];
  showKidDialog = false;
  showTaskDialog = false;
  statsCollapsed = false;
  statusLabels = TASK_STATUS_LABELS;
  recurrenceLabels = RECURRENCE_LABELS;

  kidForm = {
    id: null as number | null,
    name: '',
    color: '#4CAF50'
  };

  taskForm = {
    id: null as number | null,
    kid_id: null as number | null,
    title: '',
    description: '',
    recurrence_type: 'none' as RecurrenceType,
    recurrence_date: null as string | null,
    scheduled_time: null as string | null
  };

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadKids();
  }

  loadKids(): void {
    this.apiService.getKids().subscribe({
      next: (kids) => {
        this.kids = kids;
        this.loadAllTasksAndCalculateStats();
        if (kids.length > 0 && !this.selectedKid) {
          this.selectKid(kids[0]);
        }
      },
      error: (error) => {
        console.error('Error loading kids:', error);
      }
    });
  }

  loadAllTasksAndCalculateStats(): void {
    this.apiService.getTasks().subscribe({
      next: (tasks) => {
        this.allTasks = tasks;
        this.calculateKidStats();
      },
      error: (error) => {
        console.error('Error loading all tasks:', error);
      }
    });
  }

  calculateKidStats(): void {
    this.kidStats = this.kids.map(kid => {
      const kidTasks = this.allTasks.filter(task => task.kid_id === kid.id);
      const totalTasks = kidTasks.length;
      const zuErledigen = kidTasks.filter(task => task.status === 'zu_erledigen').length;
      const machIchGerade = kidTasks.filter(task => task.status === 'mach_ich_gerade').length;
      const erledigt = kidTasks.filter(task => task.status === 'erledigt').length;
      const completionRate = totalTasks > 0 ? Math.round((erledigt / totalTasks) * 100) : 0;

      return {
        kid,
        totalTasks,
        zuErledigen,
        machIchGerade,
        erledigt,
        completionRate
      };
    });
  }

  selectKid(kid: Kid): void {
    this.selectedKid = kid;
    this.loadTasks(kid.id);
  }

  loadTasks(kidId: number): void {
    this.apiService.getTasks(kidId).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      }
    });
  }

  openKidDialog(kid?: Kid): void {
    if (kid) {
      this.kidForm = { id: kid.id, name: kid.name, color: kid.color };
    } else {
      this.kidForm = { id: null, name: '', color: '#4CAF50' };
    }
    this.showKidDialog = true;
  }

  saveKid(): void {
    if (!this.kidForm.name.trim()) return;

    if (this.kidForm.id) {
      this.apiService.updateKid(this.kidForm.id, this.kidForm.name, this.kidForm.color).subscribe({
        next: () => {
          this.loadKids();
          this.closeKidDialog();
        },
        error: (error) => console.error('Error updating kid:', error)
      });
    } else {
      this.apiService.createKid(this.kidForm.name, this.kidForm.color).subscribe({
        next: () => {
          this.loadKids();
          this.closeKidDialog();
        },
        error: (error) => console.error('Error creating kid:', error)
      });
    }
  }

  deleteKid(kid: Kid): void {
    if (confirm(`Möchten Sie ${kid.name} und alle zugehörigen Aufgaben wirklich löschen?`)) {
      // Optimistic update: remove from local arrays immediately for instant UI feedback
      this.kids = this.kids.filter(k => k.id !== kid.id);
      this.allTasks = this.allTasks.filter(t => t.kid_id !== kid.id);
      this.kidStats = this.kidStats.filter(s => s.kid.id !== kid.id);
      if (this.selectedKid?.id === kid.id) {
        this.selectedKid = this.kids.length > 0 ? this.kids[0] : null;
        this.tasks = this.selectedKid ? this.allTasks.filter(t => t.kid_id === this.selectedKid!.id) : [];
      }

      this.apiService.deleteKid(kid.id).subscribe({
        error: (error) => {
          console.error('Error deleting kid:', error);
          // Revert on error: reload from server
          this.loadKids();
        }
      });
    }
  }

  closeKidDialog(): void {
    this.showKidDialog = false;
  }

  openTaskDialog(task?: Task): void {
    if (task) {
      this.taskForm = {
        id: task.id,
        kid_id: task.kid_id,
        title: task.title,
        description: task.description || '',
        recurrence_type: task.recurrence_type,
        recurrence_date: task.recurrence_date ? new Date(task.recurrence_date).toISOString().split('T')[0] : null,
        scheduled_time: task.scheduled_time || null
      };
    } else {
      this.taskForm = {
        id: null,
        kid_id: this.selectedKid?.id || null,
        title: '',
        description: '',
        recurrence_type: 'none',
        recurrence_date: null,
        scheduled_time: null
      };
    }
    this.showTaskDialog = true;
  }

  saveTask(): void {
    if (!this.taskForm.title.trim() || !this.taskForm.kid_id) return;

    const recurrenceDate = this.taskForm.recurrence_date ? new Date(this.taskForm.recurrence_date) : null;

    if (this.taskForm.id) {
      this.apiService.updateTask(
        this.taskForm.id,
        this.taskForm.title,
        this.taskForm.description || null,
        this.taskForm.recurrence_type,
        recurrenceDate,
        this.taskForm.scheduled_time
      ).subscribe({
        next: () => {
          if (this.selectedKid) {
            this.loadTasks(this.selectedKid.id);
          }
          this.loadAllTasksAndCalculateStats();
          this.closeTaskDialog();
        },
        error: (error) => console.error('Error updating task:', error)
      });
    } else {
      this.apiService.createTask(
        this.taskForm.kid_id!,
        this.taskForm.title,
        this.taskForm.description || null,
        this.taskForm.recurrence_type,
        recurrenceDate,
        this.taskForm.scheduled_time
      ).subscribe({
        next: () => {
          if (this.selectedKid) {
            this.loadTasks(this.selectedKid.id);
          }
          this.loadAllTasksAndCalculateStats();
          this.closeTaskDialog();
        },
        error: (error) => console.error('Error creating task:', error)
      });
    }
  }

  deleteTask(task: Task): void {
    if (confirm(`Möchten Sie die Aufgabe "${task.title}" wirklich löschen?`)) {
      // Optimistic update: remove from local arrays immediately for instant UI feedback
      this.tasks = this.tasks.filter(t => t.id !== task.id);
      this.allTasks = this.allTasks.filter(t => t.id !== task.id);
      this.calculateKidStats();

      this.apiService.deleteTask(task.id).subscribe({
        error: (error) => {
          console.error('Error deleting task:', error);
          // Revert on error: reload from server
          if (this.selectedKid) {
            this.loadTasks(this.selectedKid.id);
          }
          this.loadAllTasksAndCalculateStats();
        }
      });
    }
  }

  closeTaskDialog(): void {
    this.showTaskDialog = false;
  }

  viewKidBoard(kid: Kid): void {
    this.router.navigate(['/board', kid.id]);
  }

  getRecurrenceTypes(): RecurrenceType[] {
    return ['none', 'daily', 'weekly', 'monthly', 'specific_date'];
  }

  toggleStats(): void {
    this.statsCollapsed = !this.statsCollapsed;
  }
}

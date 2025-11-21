import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Kid } from '../models/kid.model';
import { Task, TaskStatus, RecurrenceType } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  // Kids endpoints
  getKids(): Observable<Kid[]> {
    return this.http.get<Kid[]>(`${this.apiUrl}/kids`);
  }

  getKid(id: number): Observable<Kid> {
    return this.http.get<Kid>(`${this.apiUrl}/kids/${id}`);
  }

  createKid(name: string, color: string): Observable<Kid> {
    return this.http.post<Kid>(`${this.apiUrl}/kids`, { name, color });
  }

  updateKid(id: number, name: string, color: string): Observable<Kid> {
    return this.http.put<Kid>(`${this.apiUrl}/kids/${id}`, { name, color });
  }

  deleteKid(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/kids/${id}`);
  }

  // Tasks endpoints
  getTasks(kidId?: number): Observable<Task[]> {
    const url = kidId
      ? `${this.apiUrl}/tasks?kid_id=${kidId}`
      : `${this.apiUrl}/tasks`;
    return this.http.get<Task[]>(url);
  }

  getTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`);
  }

  createTask(
    kidId: number,
    title: string,
    description: string | null,
    recurrenceType: RecurrenceType,
    recurrenceDate: Date | null
  ): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, {
      kid_id: kidId,
      title,
      description,
      recurrence_type: recurrenceType,
      recurrence_date: recurrenceDate
    });
  }

  updateTask(
    id: number,
    title: string,
    description: string | null,
    recurrenceType: RecurrenceType,
    recurrenceDate: Date | null
  ): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, {
      title,
      description,
      recurrence_type: recurrenceType,
      recurrence_date: recurrenceDate
    });
  }

  updateTaskStatus(id: number, status: TaskStatus): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/tasks/${id}/status`, { status });
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Kid } from '../../models/kid.model';
import { PinEntryComponent } from '../pin-entry/pin-entry.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, PinEntryComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  kids: Kid[] = [];
  showPinDialog = false;

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
      },
      error: (error) => {
        console.error('Error loading kids:', error);
      }
    });
  }

  goToKidBoard(kidId: number): void {
    this.router.navigate(['/board', kidId]);
  }

  openPinDialog(): void {
    this.showPinDialog = true;
  }

  closePinDialog(): void {
    this.showPinDialog = false;
  }

  onPinSuccess(): void {
    this.showPinDialog = false;
    this.router.navigate(['/dashboard']);
  }
}

import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pin-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pin-entry.component.html',
  styleUrl: './pin-entry.component.scss'
})
export class PinEntryComponent {
  @Output() onClose = new EventEmitter<void>();
  @Output() onSuccess = new EventEmitter<void>();

  pin = '';
  error = false;
  // Default PIN is "8956" - in production, this should be stored securely
  private readonly correctPin = '8956';

  enterDigit(digit: string): void {
    if (this.pin.length < 4) {
      this.pin += digit;
      if (this.pin.length === 4) {
        this.checkPin();
      }
    }
  }

  deleteDigit(): void {
    this.pin = this.pin.slice(0, -1);
    this.error = false;
  }

  checkPin(): void {
    if (this.pin === this.correctPin) {
      this.onSuccess.emit();
    } else {
      this.error = true;
      setTimeout(() => {
        this.pin = '';
        this.error = false;
      }, 800);
    }
  }

  close(): void {
    this.onClose.emit();
  }
}

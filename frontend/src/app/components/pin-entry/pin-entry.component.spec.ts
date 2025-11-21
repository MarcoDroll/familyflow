import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PinEntryComponent } from './pin-entry.component';

describe('PinEntryComponent', () => {
  let component: PinEntryComponent;
  let fixture: ComponentFixture<PinEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PinEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PinEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

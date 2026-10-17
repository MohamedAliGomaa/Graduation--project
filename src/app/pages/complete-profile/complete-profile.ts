import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-complete-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './complete-profile.html',
  styleUrl: './complete-profile.css',
})
export class CompleteProfile {
  profileForm;

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      height: ['', [Validators.required, Validators.min(1)]],
      weight: ['', [Validators.required, Validators.min(1)]],
      gender: ['', Validators.required],
      activityLevel: ['', Validators.required],
      primaryGoal: ['', Validators.required],
    });
  }

  onSubmit(): void {
    this.profileForm.markAllAsTouched();

    if (this.profileForm.invalid) {
      return;
    }

    console.log('Profile Data:', this.profileForm.value);
  }
}
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

/**
 * Réinitialisation du mot de passe en deux étapes :
 * 1. email → envoi d'un code à usage unique par email ;
 * 2. code + nouveau mot de passe → réinitialisation, puis retour au login.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  isCodeSent = false;
  isLoading = false;
  isDone = false;
  errorMessage = '';
  successMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(4), Validators.maxLength(8)]],
      newPassword: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSendCode(): void {
    const email = this.form.get('email');
    if (email?.invalid) {
      email.markAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.sendCode({ email: email!.value })
      .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.isCodeSent = true;
          this.successMessage = 'Code envoyé ! Vérifiez votre boîte email.';
          this.form.get('code')?.enable();
          this.form.get('newPassword')?.enable();
        },
        error: (err) => { this.errorMessage = err.message; }
      });
  }

  onResetPassword(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email, code, newPassword } = this.form.value;
    this.authService.resetPassword({ email, code, newPassword })
      .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.isDone = true;
          this.successMessage = 'Mot de passe réinitialisé ! Vous pouvez vous connecter.';
          setTimeout(() => this.router.navigate(['/login']), 2500);
        },
        error: (err) => { this.errorMessage = err.message; }
      });
  }

  onBackToEmail(): void {
    this.isCodeSent = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.form.get('code')?.disable();
    this.form.get('code')?.setValue('');
    this.form.get('newPassword')?.disable();
    this.form.get('newPassword')?.setValue('');
  }

  isFieldInvalid(name: string): boolean {
    const field = this.form.get(name);
    return !!(field?.invalid && field?.touched);
  }
}

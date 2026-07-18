import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-org-login',
  templateUrl: './org-login.component.html',
  styleUrls: ['./org-login.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ]
})
export class OrgLoginComponent implements OnInit {
  loginForm!: FormGroup;
  isCodeSent = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: [{value: '', disabled: true}, [Validators.required, Validators.minLength(4), Validators.maxLength(8)]]
    });
  }

  onSendCode(): void {
    if (this.loginForm.get('email')?.invalid) {
      this.markFieldAsTouched('email');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.loginForm.get('email')?.value;

    this.authService.sendCode({ email })
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.isCodeSent = true;
          this.successMessage = 'Code envoyé avec succès ! Vérifiez votre email.';
          this.loginForm.get('code')?.enable();
        },
        error: (error) => {
          this.errorMessage = error.message;
        }
      });
  }

  onVerifyCode(): void {
    if (this.loginForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email, code } = this.loginForm.value;

    this.authService.verifyCode({ email, code })
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          // JWT is set as httpOnly cookie by server; store only user/role in localStorage
          if (response.user) {
            this.authService.saveUserData(response);
          }

          this.successMessage = 'Connexion réussie ! Redirection...';
          setTimeout(() => {
            this.redirectBasedOnRole(response.user);
          }, 1500);
        },
        error: (error) => {
          this.errorMessage = error.message;
        }
      });
  }

  onBackToEmail(): void {
    this.isCodeSent = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.loginForm.get('code')?.disable();
    this.loginForm.get('code')?.setValue('');
  }

  private markFieldAsTouched(fieldName: string): void {
    this.loginForm.get(fieldName)?.markAsTouched();
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (field?.hasError('email')) {
      return 'Format d\'email invalide';
    }
    if (field?.hasError('minlength')) {
      return `Minimum ${field.errors?.['minlength'].requiredLength} caractères`;
    }
    if (field?.hasError('maxlength')) {
      return `Maximum ${field.errors?.['maxlength'].requiredLength} caractères`;
    }

    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  private redirectBasedOnRole(user: any): void {
    const userRole = user?.role?.toUpperCase();
    if (userRole === 'ORGANIZATION') {
      this.router.navigate(['/volunteering/opportunities/create']);
    } else {
      this.router.navigate(['/volunteering/opportunities']);
    }
  }
}

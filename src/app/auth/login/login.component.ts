import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  
  loginForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkExistingAuth();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private checkExistingAuth(): void {
    // Bonus : Rediriger automatiquement si déjà connecté
    // Vérifier que nous sommes dans un environnement navigateur
    if (typeof window !== 'undefined' && this.authService.isAuthenticated()) {
      this.router.navigate(['/volunteering/opportunities']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            // JWT is set as httpOnly cookie by server; store only user/role in localStorage
            if (response.user && response.role) {
              this.authService.saveUserData(response);
              this.showSuccessMessage();
              this.redirectBasedOnRole(response);
            } else {
              this.showErrorMessage('Réponse du serveur invalide');
            }
          },
          error: (error) => {
            this.isSubmitting = false;
            this.errorMessage = error.message;
            this.showErrorMessage(error.message);
          }
        });
    } else {
      this.markFormGroupTouched();
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccessMessage(): void {
    this.snackBar.open('Connexion réussie ✅', 'Fermer', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private redirectBasedOnRole(user: any): void {
    setTimeout(() => {
      // Vérifier le rôle de l'utilisateur
      const userRole = user?.role?.toUpperCase();
      
      if (userRole === 'ORGANIZATION') {
        // Organisation : rediriger vers la création d'opportunité
        this.router.navigate(['/volunteering/opportunities/create']);
      } else {
        // Volontaire ou autre : rediriger vers la liste des opportunités
        this.router.navigate(['/volunteering/opportunities']);
      }
    }, 1500);
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.loginForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (control.errors['email']) {
        return 'Format d\'email invalide';
      }
      if (control.errors['minlength']) {
        return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
      }
    }
    return '';
  }

  onForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import { ErrorComponent } from "../../shared/error/error/error.component";
import { OpportunityService } from '../services/opportunity.service';
import { Category } from '../../models/category.model';
import { Skill, SkillFormGroup } from '../../models/skill.model';
import { CreateOpportunityRequest } from '../../models/opportunity.model';

@Component({
  selector: 'app-opportunity-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ErrorComponent,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatTooltipModule
  ],
  templateUrl: './opportunity-create.component.html',
  styleUrl: './opportunity-create.component.css'
})
export class OpportunityCreateComponent implements OnInit, OnDestroy {
  
  // Propriétés du composant
  public opportunityForm!: FormGroup;
  public categories: Category[] = [];
  public isLoading = false;
  public isSubmitting = false;
  public errorMessage = '';
  public successMessage = '';
  
  // Niveaux de compétences disponibles
  public skillLevels = [
    { value: 'BEGINNER', label: 'Débutant' },
    { value: 'INTERMEDIATE', label: 'Intermédiaire' },
    { value: 'ADVANCED', label: 'Avancé' },
    { value: 'EXPERT', label: 'Expert' }
  ];

  // Subject pour la gestion de la destruction du composant
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private opportunityService: OpportunityService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCategories();
    this.setupFormValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise le formulaire réactif avec toutes les validations
   */
  private initializeForm(): void {
    this.opportunityForm = this.fb.group({
      title: ['', [
        Validators.required, 
        Validators.maxLength(100),
        Validators.minLength(3)
      ]],
      description: ['', [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(2000)
      ]],
      location: ['', [
        Validators.required,
        Validators.maxLength(255)
      ]],
      town: ['', [
        Validators.required,
        Validators.maxLength(100)
      ]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      requirements: ['', [
        Validators.maxLength(1000)
      ]],
      skillsRequired: this.fb.array([]),
      categories: [[], [Validators.required, Validators.minLength(1)]]
    });
  }

  /**
   * Configure les validations croisées (startDate <= endDate)
   */
  private setupFormValidation(): void {
    // Validation croisée pour les dates
    this.opportunityForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateDates();
      });
  }

  /**
   * Valide que la date de début est antérieure à la date de fin
   */
  private validateDates(): void {
    const startDate = this.opportunityForm.get('startDate')?.value;
    const endDate = this.opportunityForm.get('endDate')?.value;
    
    if (startDate && endDate && startDate > endDate) {
      this.opportunityForm.get('endDate')?.setErrors({ invalidDateRange: true });
    } else {
      this.opportunityForm.get('endDate')?.setErrors(null);
    }
  }

  /**
   * Charge la liste des catégories depuis l'API
   */
  private loadCategories(): void {
    this.isLoading = true;
    this.opportunityService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = `Erreur lors du chargement des catégories: ${error.message}`;
          this.isLoading = false;
        }
      });
  }

  /**
   * Getter pour accéder au FormArray des compétences
   */
  get skillsRequiredArray(): FormArray {
    return this.opportunityForm.get('skillsRequired') as FormArray;
  }

  /**
   * Ajoute une nouvelle compétence au formulaire
   */
  addSkill(): void {
    const skillGroup = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      level: ['BEGINNER', [Validators.required]]
    });

    this.skillsRequiredArray.push(skillGroup);
  }

  /**
   * Supprime une compétence du formulaire
   */
  removeSkill(index: number): void {
    this.skillsRequiredArray.removeAt(index);
  }

  /**
   * Soumet le formulaire
   */
  onSubmit(): void {
    if (this.opportunityForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.errorMessage = '';

      // Préparation des données pour l'API
      const formValue = this.opportunityForm.value;
      const opportunityData: CreateOpportunityRequest = {
        title: formValue.title,
        description: formValue.description,
        location: formValue.location,
        town: formValue.town,
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        requirements: formValue.requirements || '',
        orgId: 1, // TODO: Récupérer depuis le service d'authentification
        skillsRequired: formValue.skillsRequired,
        categories: formValue.categories
      };

      // Appel au service
      this.opportunityService.createOpportunity(opportunityData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.successMessage = 'Opportunité créée avec succès!';
            this.showSuccessMessage();
          },
          error: (error) => {
            this.isSubmitting = false;
            this.errorMessage = error.message;
            this.showErrorMessage();
          }
        });
    } else {
      this.markFormGroupTouched();
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
    }
  }

  /**
   * Marque tous les champs du formulaire comme touchés pour afficher les erreurs
   */
  private markFormGroupTouched(): void {
    Object.keys(this.opportunityForm.controls).forEach(key => {
      const control = this.opportunityForm.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched();
      } else {
        control?.markAsTouched();
      }
    });
  }

  /**
   * Affiche un message de succès
   */
  private showSuccessMessage(): void {
    this.snackBar.open(this.successMessage, 'Fermer', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Affiche un message d'erreur
   */
  private showErrorMessage(): void {
    this.snackBar.open(this.errorMessage, 'Fermer', {
      duration: 8000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Annule la création et retourne à la liste
   */
  onCancel(): void {
    this.router.navigate(['/opportunities']);
  }

  /**
   * Vérifie si un champ a des erreurs
   */
  hasError(controlName: string, errorType: string): boolean {
    const control = this.opportunityForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  /**
   * Obtient le message d'erreur pour un champ
   */
  getErrorMessage(controlName: string): string {
    const control = this.opportunityForm.get(controlName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (control.errors['minlength']) {
        return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
      }
      if (control.errors['maxlength']) {
        return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
      }
      if (control.errors['invalidDateRange']) {
        return 'La date de fin doit être postérieure à la date de début';
      }
    }
    return '';
  }
}

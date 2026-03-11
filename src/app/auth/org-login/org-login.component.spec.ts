import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { OrgLoginComponent } from './org-login.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('OrgLoginComponent', () => {
  let component: OrgLoginComponent;
  let fixture: ComponentFixture<OrgLoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['sendCode', 'verifyCode', 'saveToken']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ OrgLoginComponent ],
      imports: [
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrgLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with email and code controls', () => {
    expect(component.loginForm.get('email')).toBeTruthy();
    expect(component.loginForm.get('code')).toBeTruthy();
  });

  it('should have email validation', () => {
    const emailControl = component.loginForm.get('email');
    expect(emailControl?.hasError('required')).toBeTruthy();
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.valid).toBeTruthy();
  });

  it('should have code validation', () => {
    const codeControl = component.loginForm.get('code');
    expect(codeControl?.hasError('required')).toBeTruthy();
    
    codeControl?.setValue('123');
    expect(codeControl?.hasError('minlength')).toBeTruthy();
    
    codeControl?.setValue('123456789');
    expect(codeControl?.hasError('maxlength')).toBeTruthy();
    
    codeControl?.setValue('123456');
    expect(codeControl?.valid).toBeTruthy();
  });

  it('should send code successfully', () => {
    authService.sendCode.and.returnValue(of(void 0));
    
    component.loginForm.get('email')?.setValue('test@example.com');
    component.onSendCode();
    
    expect(authService.sendCode).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(component.isCodeSent).toBeTruthy();
    expect(component.successMessage).toContain('Code envoyé avec succès');
  });

  it('should handle send code error', () => {
    const errorMessage = 'Email invalide';
    authService.sendCode.and.returnValue(throwError(() => new Error(errorMessage)));
    
    component.loginForm.get('email')?.setValue('test@example.com');
    component.onSendCode();
    
    expect(component.errorMessage).toBe(errorMessage);
    expect(component.isCodeSent).toBeFalsy();
  });

  it('should verify code successfully', () => {
    const token = 'test-token';
    authService.verifyCode.and.returnValue(of(token));
    
    component.isCodeSent = true;
    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('code')?.setValue('123456');
    
    component.onVerifyCode();
    
    expect(authService.verifyCode).toHaveBeenCalledWith({ 
      email: 'test@example.com', 
      code: '123456' 
    });
    expect(authService.saveToken).toHaveBeenCalledWith(token);
    expect(component.successMessage).toContain('Connexion réussie');
  });

  it('should handle verify code error', () => {
    const errorMessage = 'Code invalide';
    authService.verifyCode.and.returnValue(throwError(() => new Error(errorMessage)));
    
    component.isCodeSent = true;
    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('code')?.setValue('123456');
    
    component.onVerifyCode();
    
    expect(component.errorMessage).toBe(errorMessage);
  });

  it('should go back to email step', () => {
    component.isCodeSent = true;
    component.errorMessage = 'test error';
    component.successMessage = 'test success';
    
    component.onBackToEmail();
    
    expect(component.isCodeSent).toBeFalsy();
    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
  });

  it('should return correct error messages', () => {
    const emailControl = component.loginForm.get('email');
    const codeControl = component.loginForm.get('code');
    
    emailControl?.markAsTouched();
    codeControl?.markAsTouched();
    
    expect(component.getErrorMessage('email')).toBe('Ce champ est requis');
    expect(component.getErrorMessage('code')).toBe('Ce champ est requis');
    
    emailControl?.setValue('invalid');
    expect(component.getErrorMessage('email')).toBe('Format d\'email invalide');
    
    codeControl?.setValue('123');
    expect(component.getErrorMessage('code')).toBe('Minimum 4 caractères');
  });

  it('should check field validity correctly', () => {
    const emailControl = component.loginForm.get('email');
    
    expect(component.isFieldInvalid('email')).toBeFalsy();
    
    emailControl?.markAsTouched();
    expect(component.isFieldInvalid('email')).toBeTruthy();
  });
});

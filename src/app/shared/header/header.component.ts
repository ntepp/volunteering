import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  
  isAuthenticated = false;
  user: any = null;
  isMenuOpen = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAuthStatus(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.user = this.authService.getUserData();
    }
  }

  onLogout(): void {
    this.authService.clearUserData();
    this.isAuthenticated = false;
    this.user = null;
    this.router.navigate(['/']);
  }

  onMyAccount(): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    const role = this.user?.role?.toUpperCase();
    if (role === 'ORGANIZATION') {
      this.router.navigate(['/volunteering/opportunities/my']);
    } else {
      this.router.navigate(['/applications']);
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  onPublishOpportunity(): void {
    // Vérifier si l'utilisateur est connecté
    if (!this.isAuthenticated) {
      // Non connecté : rediriger vers l'inscription organisation
      this.router.navigate(['/register/organisation']);
      return;
    }

    // Vérifier le rôle de l'utilisateur
    const userRole = this.user?.role?.toUpperCase();
    
    if (userRole === 'ORGANIZATION') {
      // Organisation : autoriser l'accès à la création
      this.router.navigate(['/volunteering/opportunities/create']);
    } else {
      // Volontaire ou autre : rediriger vers l'inscription organisation
      this.router.navigate(['/register/organisation']);
    }
  }
}

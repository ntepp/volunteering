import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const organizationGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier si l'utilisateur est connecté
  if (!authService.isAuthenticated()) {
    // Non connecté : redirection vers l'inscription organisation
    router.navigate(['/register/organisation']);
    return false;
  }

  // Récupérer les données utilisateur
  const userData = authService.getUserData();
console.log(userData);
  // Vérifier si les données utilisateur existent
  if (!userData || !userData.role) {
    // Données invalides : redirection vers l'inscription organisation
    router.navigate(['/register/organisation']);
    return false;
  }

  // Vérifier le rôle
  const userRole = userData.role.toUpperCase();

  if (userRole === 'ORGANIZATION') {
    // Organisation connectée : accès autorisé
    return true;
  }

  // Tous les autres cas (volontaire ou rôle inconnu) : redirection vers l'inscription organisation
  router.navigate(['/register/organisation']);
  return false;
};

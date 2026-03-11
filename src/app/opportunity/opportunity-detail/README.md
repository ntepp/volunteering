# Fonctionnalité d'Application aux Opportunités (UC4)

## Vue d'ensemble

Cette fonctionnalité permet aux volontaires connectés de postuler aux opportunités de bénévolat via une interface utilisateur moderne et intuitive. Le système gère complètement le cycle de vie des candidatures avec des états visuels clairs et une gestion d'erreurs robuste.

## Fonctionnalités implémentées

### ✅ Service de Candidature (`CandidatureService`)
- **POST `/api/applications`** : Soumission de candidature avec authentification JWT
- **GET `/api/applications/{id}`** : Récupération des candidatures d'un volontaire
- **Gestion d'erreurs** centralisée avec messages contextuels
- **Headers d'authentification** automatiques depuis localStorage

### ✅ Composant Opportunity Detail
- **Interface complète** avec toutes les informations de l'opportunité
- **Bouton "Postuler"** avec états de chargement et feedback visuel
- **Gestion des états** : Non postulé, En cours, Déjà postulé
- **Statuts de candidature** : PENDING, ACCEPTED, REJECTED avec couleurs distinctives

### ✅ Expérience Utilisateur
- **Design Material** cohérent avec le reste de l'application
- **Responsive design** adaptatif (Desktop/Tablet/Mobile)
- **Animations fluides** et transitions visuelles
- **Notifications** via MatSnackBar (succès/erreur)
- **Accessibilité** complète avec navigation clavier

## Structure technique

### Service de Candidature (`candidature.service.ts`)

```typescript
export class CandidatureService {
  // Postuler à une opportunité
  applyToOpportunity(opportunityId: string, volunteeringId: string): Observable<ApplicationResponse>
  
  // Récupérer les candidatures d'un volontaire
  getVolunteerApplications(volunteeringId: string): Observable<ApplicationResponse[]>
  
  // Gestion d'erreurs centralisée
  private handleError(error: HttpErrorResponse): Observable<never>
}
```

### Modèles de données (`application.model.ts`)

```typescript
export interface Application {
  id: string;
  volunteeringId: string;
  opportunityId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  appliedAt: string;
  updatedAt: string;
}

export interface ApplicationRequest {
  volunteeringId: string;
  opportunityId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}
```

### Composant Opportunity Detail (`opportunity-detail.component.ts`)

```typescript
export class OpportunityDetailComponent {
  opportunity: Opportunity | null = null;
  isApplying = false;
  hasApplied = false;
  applicationStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null = null;
  
  // Méthodes principales
  apply(): void                    // Soumission de candidature
  checkExistingApplication(): void  // Vérification des candidatures existantes
  getApplicationStatusText(): string // Texte du statut
  getApplicationStatusColor(): string // Couleur du statut
}
```

## API Integration

### Endpoint de candidature
```http
POST /api/applications
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "volunteeringId": "123",
  "opportunityId": "456",
  "status": "PENDING"
}
```

### Réponse de succès
```json
{
  "id": "789",
  "volunteeringId": "123",
  "opportunityId": "456",
  "status": "PENDING",
  "appliedAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Gestion des erreurs
- **400 Bad Request** : "Données de candidature invalides"
- **401 Unauthorized** : "Non autorisé. Veuillez vous reconnecter."
- **403 Forbidden** : "Accès refusé pour cette candidature"
- **404 Not Found** : "Opportunité non trouvée"
- **409 Conflict** : "Vous avez déjà postulé à cette opportunité"
- **422 Unprocessable Entity** : "Données de validation invalides"
- **500 Internal Server Error** : "Erreur serveur interne"

## Interface utilisateur

### États du bouton "Postuler"
1. **Disponible** : Bouton bleu "Postuler" avec icône send
2. **En cours** : Bouton avec spinner "Candidature en cours..."
3. **Déjà postulé** : Bouton désactivé "Déjà postulé" avec icône check_circle

### Statuts de candidature
- **PENDING** : Badge orange "En attente" avec icône schedule
- **ACCEPTED** : Badge vert "Acceptée" avec icône check_circle
- **REJECTED** : Badge rouge "Refusée" avec icône cancel

### Design responsive
- **Desktop** : Layout en grille avec cartes détaillées
- **Tablet** : Adaptation des espacements et tailles
- **Mobile** : Layout vertical optimisé pour le tactile

## Flux de candidature

### 1. Chargement de l'opportunité
```typescript
ngOnInit() → loadOpportunity() → simulateOpportunityLoad() → checkExistingApplication()
```

### 2. Vérification des candidatures existantes
```typescript
checkExistingApplication() → getVolunteerApplications() → updateUI()
```

### 3. Soumission de candidature
```typescript
apply() → applyToOpportunity() → showSuccessMessage() → updateUI()
```

### 4. Gestion des erreurs
```typescript
error → showErrorMessage() → resetUI()
```

## Sécurité et authentification

### Token JWT
- **Récupération** : `localStorage.getItem('authToken')`
- **Headers** : `Authorization: Bearer ${token}`
- **Validation** : Vérification côté serveur

### Vérifications côté client
- **Utilisateur connecté** : Vérification des données utilisateur
- **Candidature existante** : Prévention des doublons
- **États de chargement** : Prévention des soumissions multiples

## Notifications utilisateur

### Messages de succès
```typescript
MatSnackBar.open('Votre candidature a été soumise avec succès ✅', 'Fermer', {
  duration: 5000,
  horizontalPosition: 'center',
  verticalPosition: 'top',
  panelClass: ['success-snackbar']
});
```

### Messages d'erreur
```typescript
MatSnackBar.open(message, 'Fermer', {
  duration: 5000,
  horizontalPosition: 'center',
  verticalPosition: 'top',
  panelClass: ['error-snackbar']
});
```

## Accessibilité

### Navigation clavier
- **Tab** : Navigation entre les éléments interactifs
- **Enter** : Activation des boutons
- **Focus visible** : Indicateurs de focus clairs

### Lecteurs d'écran
- **Labels appropriés** pour tous les boutons
- **États annoncés** (chargement, succès, erreur)
- **Structure sémantique** avec headings et landmarks

## Performance et optimisation

### Gestion des subscriptions
```typescript
private destroy$ = new Subject<void>();

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

// Dans les appels HTTP
.pipe(takeUntil(this.destroy$))
```

### Lazy loading
- **Composant standalone** pour un chargement optimisé
- **Imports spécifiques** des modules Material nécessaires

## Tests et qualité

### Bonnes pratiques implémentées
- **Type safety** avec TypeScript strict
- **Error handling** robuste avec fallbacks
- **Memory leak prevention** avec OnDestroy
- **Responsive design** avec breakpoints CSS

### Compatibilité
- **Angular 17** avec standalone components
- **Angular Material** dernière version
- **SSR compatible** avec vérifications window
- **Build optimisé** sans erreurs critiques

## Utilisation

### Navigation vers le détail
```typescript
// Depuis la liste des opportunités
routerLink="/opportunity/123"
```

### Accès aux candidatures
```typescript
// Vérification automatique au chargement
checkExistingApplication() → getVolunteerApplications()
```

### Soumission de candidature
```typescript
// Clic sur le bouton "Postuler"
apply() → candidatureService.applyToOpportunity()
```

## Améliorations futures

### Fonctionnalités prévues
- [ ] **Notifications push** pour les changements de statut
- [ ] **Historique des candidatures** avec pagination
- [ ] **Filtres avancés** par statut et date
- [ ] **Export PDF** des candidatures

### Optimisations techniques
- [ ] **Cache** des candidatures avec invalidation
- [ ] **WebSocket** pour les mises à jour en temps réel
- [ ] **Offline support** avec Service Worker
- [ ] **Analytics** des taux de candidature

## Support et maintenance

### Dépendances
- Angular Material (UI components)
- RxJS (gestion des observables)
- Angular Router (navigation)
- Angular HTTP (appels API)

### Configuration requise
- Angular 17+
- Angular Material 17+
- Node.js 18+
- TypeScript 5+

---

**Développé avec ❤️ en Angular 17 et Angular Material**

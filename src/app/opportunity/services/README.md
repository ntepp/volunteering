# CandidatureService

## Vue d'ensemble

Le `CandidatureService` est un service Angular qui gère toutes les opérations liées aux candidatures aux opportunités de bénévolat. Il fournit une interface propre pour interagir avec l'API backend et gère automatiquement l'authentification JWT.

## Fonctionnalités

### ✅ Gestion des candidatures
- **Soumission de candidature** via POST `/api/applications`
- **Récupération des candidatures** via GET `/api/applications/{id}`
- **Authentification automatique** avec token JWT
- **Gestion d'erreurs centralisée** avec messages contextuels

### ✅ Sécurité
- **Headers d'authentification** automatiques
- **Validation côté client** des données
- **Gestion des tokens** depuis localStorage
- **Protection SSR** avec vérifications window

### ✅ Robustesse
- **Error handling** complet avec codes HTTP
- **Type safety** avec interfaces TypeScript
- **Observables** pour la gestion asynchrone
- **Compatible SSR** pour le prerendering

## API Methods

### `applyToOpportunity(opportunityId: string, volunteeringId: string): Observable<ApplicationResponse>`

Soumet une candidature à une opportunité.

**Paramètres :**
- `opportunityId` : ID de l'opportunité
- `volunteeringId` : ID du volontaire (utilisateur connecté)

**Payload :**
```json
{
  "volunteeringId": "123",
  "opportunityId": "456",
  "status": "PENDING"
}
```

**Réponse :**
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

### `getVolunteerApplications(volunteeringId: string): Observable<ApplicationResponse[]>`

Récupère toutes les candidatures d'un volontaire.

**Paramètres :**
- `volunteeringId` : ID du volontaire

**Réponse :**
```json
[
  {
    "id": "789",
    "volunteeringId": "123",
    "opportunityId": "456",
    "status": "PENDING",
    "appliedAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

## Gestion d'erreurs

### Codes d'erreur HTTP

| Code | Message | Description |
|------|---------|-------------|
| 400 | "Données de candidature invalides" | Payload malformé ou manquant |
| 401 | "Non autorisé. Veuillez vous reconnecter." | Token JWT invalide ou expiré |
| 403 | "Accès refusé pour cette candidature" | Permissions insuffisantes |
| 404 | "Opportunité non trouvée" | L'opportunité n'existe pas |
| 409 | "Vous avez déjà postulé à cette opportunité" | Candidature en doublon |
| 422 | "Données de validation invalides" | Erreurs de validation métier |
| 500 | "Erreur serveur interne" | Erreur côté serveur |

### Gestion des erreurs côté client

```typescript
private handleError(error: HttpErrorResponse): Observable<never> {
  let errorMessage = 'Une erreur est survenue lors de la candidature';
  
  if (error.error instanceof ErrorEvent) {
    // Erreur côté client
    errorMessage = error.error.message;
  } else {
    // Erreur côté serveur avec codes spécifiques
    switch (error.status) {
      case 400:
        errorMessage = error.error?.message || 'Données de candidature invalides';
        break;
      case 401:
        errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
        break;
      // ... autres codes
    }
  }
  
  return throwError(() => new Error(errorMessage));
}
```

## Authentification

### Récupération du token
```typescript
private getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}
```

### Headers d'authentification
```typescript
const headers = new HttpHeaders({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});
```

### Validation du token
```typescript
if (!token) {
  return throwError(() => new Error('Token d\'authentification manquant'));
}
```

## Modèles de données

### ApplicationRequest
```typescript
export interface ApplicationRequest {
  volunteeringId: string;
  opportunityId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}
```

### ApplicationResponse
```typescript
export interface ApplicationResponse {
  id: string;
  volunteeringId: string;
  opportunityId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  appliedAt: string;
  updatedAt: string;
}
```

## Utilisation

### Injection du service
```typescript
constructor(private candidatureService: CandidatureService) {}
```

### Soumission de candidature
```typescript
this.candidatureService.applyToOpportunity(opportunityId, userId)
  .pipe(takeUntil(this.destroy$))
  .subscribe({
    next: (response) => {
      console.log('Candidature soumise:', response);
      // Gérer le succès
    },
    error: (error) => {
      console.error('Erreur de candidature:', error.message);
      // Gérer l'erreur
    }
  });
```

### Récupération des candidatures
```typescript
this.candidatureService.getVolunteerApplications(userId)
  .pipe(takeUntil(this.destroy$))
  .subscribe({
    next: (applications) => {
      console.log('Candidatures:', applications);
      // Traiter les candidatures
    },
    error: (error) => {
      console.error('Erreur de récupération:', error.message);
      // Gérer l'erreur
    }
  });
```

## Configuration

### URL de base
```typescript
private readonly apiUrl = environment.apiUrl + '/api/applications';
```

### Headers par défaut
```typescript
const headers = new HttpHeaders({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});
```

## Bonnes pratiques

### Gestion des subscriptions
```typescript
// Toujours utiliser takeUntil pour éviter les fuites mémoire
.pipe(takeUntil(this.destroy$))
```

### Gestion d'erreurs
```typescript
// Toujours gérer les cas d'erreur
.subscribe({
  next: (response) => { /* succès */ },
  error: (error) => { /* erreur */ }
});
```

### Validation des données
```typescript
// Vérifier les données avant l'envoi
if (!opportunityId || !volunteeringId) {
  return throwError(() => new Error('Données manquantes'));
}
```

## Tests

### Tests unitaires recommandés
- **Méthode applyToOpportunity** : Succès et erreurs
- **Méthode getVolunteerApplications** : Succès et erreurs
- **Gestion d'erreurs** : Tous les codes HTTP
- **Authentification** : Token valide et invalide

### Mocking
```typescript
// Mock du HttpClient
const mockHttp = jasmine.createSpyObj('HttpClient', ['post', 'get']);

// Mock des réponses
mockHttp.post.and.returnValue(of(mockApplicationResponse));
mockHttp.get.and.returnValue(of([mockApplicationResponse]));
```

## Dépendances

### Angular Core
- `@angular/core` : Injectable decorator
- `@angular/common/http` : HttpClient, HttpHeaders, HttpErrorResponse

### RxJS
- `rxjs` : Observable, throwError
- `rxjs/operators` : catchError

### Environment
- `../../../environments/environment` : Configuration API

## Support et maintenance

### Versions supportées
- Angular 17+
- RxJS 7+
- TypeScript 5+

### Mises à jour
- Vérifier la compatibilité avec les nouvelles versions d'Angular
- Mettre à jour les types TypeScript si nécessaire
- Tester les changements d'API backend

---

**Service développé avec ❤️ en Angular 17**

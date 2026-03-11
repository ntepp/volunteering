# Configuration des Tests - OpportunityCreateComponent

## Prérequis

1. **Angular CLI** installé globalement
2. **Jasmine** et **Karma** configurés
3. **Angular Material** installé

## Commandes de test

### Lancer tous les tests
```bash
ng test
```

### Lancer les tests en mode watch
```bash
ng test --watch
```

### Lancer les tests avec couverture
```bash
ng test --code-coverage
```

### Lancer les tests spécifiques au composant
```bash
ng test --include="**/opportunity-create.component.spec.ts"
```

## Structure des tests

### Tests unitaires implémentés

1. **Création du composant**
   - Vérification que le composant se crée correctement

2. **Initialisation du formulaire**
   - Vérification des valeurs par défaut
   - Vérification de la structure du formulaire

3. **Chargement des catégories**
   - Test du succès de chargement
   - Test de la gestion d'erreur

4. **Gestion des compétences**
   - Test d'ajout de compétence
   - Test de suppression de compétence

5. **Validation du formulaire**
   - Test des champs obligatoires
   - Test de la validation des dates
   - Test des longueurs de champs

6. **Soumission du formulaire**
   - Test de soumission réussie
   - Test de gestion d'erreur
   - Test de validation avant soumission

7. **Navigation**
   - Test du bouton d'annulation

8. **Nettoyage des ressources**
   - Test de la destruction du composant

## Mocks utilisés

### OpportunityService
```typescript
const opportunityServiceSpy = jasmine.createSpyObj('OpportunityService', [
  'getCategories', 
  'createOpportunity'
]);
```

### Router
```typescript
const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
```

### Données de test
```typescript
const mockCategories: Category[] = [
  { id: '1', name: 'Santé' },
  { id: '2', name: 'Éducation' },
  { id: '3', name: 'Environnement' }
];
```

## Couverture de code cible

- **Statements** : > 90%
- **Branches** : > 85%
- **Functions** : > 95%
- **Lines** : > 90%

## Bonnes pratiques

1. **Isolation des tests** : Chaque test doit être indépendant
2. **Nommage descriptif** : Les noms de tests doivent décrire le comportement
3. **Arrange-Act-Assert** : Structure claire des tests
4. **Mocks appropriés** : Utiliser des mocks pour les dépendances externes
5. **Tests d'erreur** : Tester les cas d'erreur et d'exception

## Dépendances de test

```json
{
  "@angular/core/testing": "^18.1.0",
  "@angular/platform-browser/animations": "^18.1.0",
  "jasmine-core": "~5.1.0",
  "karma": "~6.4.0"
}
```

## Configuration Karma

Le fichier `karma.conf.js` doit inclure :

```javascript
module.exports = function (config) {
  config.set({
    // ... autres configurations
    files: [
      'src/**/*.spec.ts'
    ],
    preprocessors: {
      'src/**/*.spec.ts': ['webpack']
    }
  });
};
```

## Résolution des problèmes courants

### Erreur : "No provider for MatSnackBar"
```typescript
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Dans TestBed.configureTestingModule
imports: [MatSnackBarModule]
```

### Erreur : "No provider for Router"
```typescript
import { Router } from '@angular/router';

// Créer un mock
const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

// Dans les providers
{ provide: Router, useValue: routerSpy }
```

### Erreur : "No provider for HttpClient"
```typescript
import { HttpClientTestingModule } from '@angular/common/http/testing';

// Dans TestBed.configureTestingModule
imports: [HttpClientTestingModule]
```

## Tests d'intégration

Pour les tests d'intégration, créer un fichier séparé :

```typescript
// opportunity-create.integration.spec.ts
describe('OpportunityCreateComponent Integration', () => {
  // Tests avec de vrais services
});
```

## Tests E2E

Pour les tests end-to-end avec Cypress :

```typescript
// cypress/e2e/opportunity-create.cy.ts
describe('Opportunity Create', () => {
  it('should create a new opportunity', () => {
    cy.visit('/opportunities/create');
    // ... tests E2E
  });
});
```







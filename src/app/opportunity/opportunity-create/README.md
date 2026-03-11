# Composant de Création d'Opportunité

## Description

Le composant `OpportunityCreateComponent` permet aux organisations de créer de nouvelles opportunités de bénévolat avec une interface utilisateur moderne et intuitive.

## Fonctionnalités

### ✅ Fonctionnalités implémentées

1. **Formulaire réactif complet** avec Angular Reactive Forms
2. **Validations avancées** :
   - Champs obligatoires (title, description, location, town, startDate, endDate)
   - Validation des longueurs (min/max)
   - Validation croisée des dates (startDate <= endDate)
   - Validation des catégories (au moins une sélectionnée)

3. **Gestion des compétences dynamiques** :
   - Ajout/suppression de compétences en temps réel
   - Sélection du niveau (Débutant, Intermédiaire, Avancé, Expert)
   - Validation des champs de compétences

4. **Sélection multiple de catégories** :
   - Récupération depuis l'API `/api/v1/categories`
   - Interface de sélection intuitive

5. **Design moderne** :
   - Interface Material Design avec Angular Material
   - Design responsive sans Bootstrap
   - Animations et transitions fluides

6. **Gestion d'état** :
   - États de chargement (spinner)
   - États de soumission (bouton désactivé)
   - Messages d'erreur et de succès
   - Snackbars pour les notifications

7. **Intégration avec l'API** :
   - Authentification JWT (désactivée temporairement)
   - Gestion d'erreurs centralisée
   - Redirection après succès

## Structure du composant

### Fichiers
- `opportunity-create.component.ts` - Logique du composant
- `opportunity-create.component.html` - Template HTML
- `opportunity-create.component.css` - Styles personnalisés
- `README.md` - Documentation

### Modèles utilisés
- `Opportunity` - Modèle principal d'opportunité
- `CreateOpportunityRequest` - Interface pour la création
- `Category` - Modèle de catégorie
- `Skill` - Modèle de compétence

## Utilisation

### Import du composant
```typescript
import { OpportunityCreateComponent } from './opportunity-create/opportunity-create.component';
```

### Ajout dans les routes
```typescript
{
  path: 'opportunities/create',
  component: OpportunityCreateComponent
}
```

### Prérequis
- Service `OpportunityService` configuré
- Service `AuthService` pour l'authentification
- API backend accessible

## API Endpoints utilisés

### GET /api/v1/categories
Récupère la liste des catégories disponibles.

**Réponse :**
```json
[
  {
    "id": "1",
    "name": "Santé"
  },
  {
    "id": "2", 
    "name": "Éducation"
  }
]
```

### POST /api/v1/opportunities
Crée une nouvelle opportunité.

**Headers requis :**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Corps de la requête :**
```json
{
  "title": "string",
  "description": "string", 
  "location": "string",
  "town": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "requirements": "string",
  "orgId": 1,
  "skillsRequired": [
    {
      "name": "string",
      "level": "string"
    }
  ],
  "categories": [
    {
      "id": "string",
      "name": "string"
    }
  ]
}
```

## Validations

### Champs obligatoires
- **title** : 3-100 caractères
- **description** : 20-2000 caractères  
- **location** : 1-255 caractères
- **town** : 1-100 caractères
- **startDate** : Date valide
- **endDate** : Date valide et >= startDate
- **categories** : Au moins une sélectionnée

### Champs optionnels
- **requirements** : 0-1000 caractères
- **skillsRequired** : Array de compétences

## Gestion des erreurs

Le composant gère les erreurs suivantes :
- Erreurs de validation côté client
- Erreurs réseau (timeout, connexion)
- Erreurs d'authentification (401)
- Erreurs de validation côté serveur (400, 422)
- Erreurs serveur (500+)

## Styles et thème

### Couleurs principales
- **Primary** : #1976d2 (Bleu Material)
- **Success** : #4caf50 (Vert)
- **Error** : #f44336 (Rouge)
- **Warning** : #ff9800 (Orange)

### Responsive Design
- **Desktop** : Layout en colonnes multiples
- **Tablet** : Adaptation des grilles
- **Mobile** : Layout en colonne unique

## Améliorations futures

### Fonctionnalités à ajouter
- [ ] Upload d'images
- [ ] Prévisualisation de l'opportunité
- [ ] Sauvegarde automatique (draft)
- [ ] Templates d'opportunités
- [ ] Validation en temps réel
- [ ] Auto-complétion des adresses

### Optimisations techniques
- [ ] Lazy loading des catégories
- [ ] Cache des données
- [ ] Optimisation des performances
- [ ] Tests unitaires complets
- [ ] Tests d'intégration

## Dépendances

### Angular Material
- MatCardModule
- MatFormFieldModule
- MatInputModule
- MatSelectModule
- MatDatepickerModule
- MatButtonModule
- MatIconModule
- MatProgressSpinnerModule
- MatSnackBarModule
- MatChipsModule
- MatTooltipModule

### CSS personnalisé
- Layout responsive avec Flexbox
- Styles Material Design
- Animations et transitions

### RxJS
- Subject pour la gestion de la destruction
- takeUntil pour éviter les fuites mémoire

## Support

Pour toute question ou problème, consultez :
1. La documentation Angular Material
2. Les logs de la console navigateur
3. Les logs du serveur backend
4. La documentation de l'API

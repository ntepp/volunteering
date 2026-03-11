# Démonstration - Composant de Création d'Opportunité

## Vue d'ensemble

Ce composant permet aux organisations de créer de nouvelles opportunités de bénévolat avec une interface utilisateur moderne et intuitive.

## Fonctionnalités démontrées

### 1. Interface utilisateur moderne
- **Design Material Design** avec Angular Material
- **Layout responsive** avec CSS personnalisé
- **Animations fluides** et transitions
- **Interface intuitive** avec icônes et couleurs cohérentes

### 2. Formulaire réactif complet
- **Validation en temps réel** des champs
- **Messages d'erreur contextuels** en français
- **Compteurs de caractères** pour les champs longs
- **Validation croisée** des dates

### 3. Gestion des compétences dynamiques
- **Ajout/suppression** de compétences en temps réel
- **Sélection de niveau** (Débutant, Intermédiaire, Avancé, Expert)
- **Validation** des champs de compétences

### 4. Sélection multiple de catégories
- **Interface de sélection** intuitive
- **Chargement automatique** depuis l'API
- **Validation** (au moins une catégorie requise)

## Captures d'écran

### État initial
```
┌─────────────────────────────────────────────────────────────┐
│ ← Créer une nouvelle opportunité                            │
├─────────────────────────────────────────────────────────────┤
│ 📋 Informations générales                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Titre de l'opportunité *                                │ │
│ │ [Ex: Distribution de repas aux sans-abri]              │ │
│ │ 0/100                                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📝 Description détaillée *                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Décrivez en détail l'opportunité de bénévolat...]     │ │
│ │                                                         │ │
│ │ 0/2000                                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Formulaire rempli
```
┌─────────────────────────────────────────────────────────────┐
│ ← Créer une nouvelle opportunité                            │
├─────────────────────────────────────────────────────────────┤
│ 📋 Informations générales                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Titre de l'opportunité *                                │ │
│ │ [Distribution de repas aux sans-abri]                   │ │
│ │ 35/100                                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📅 Période de l'opportunité                                │
│ ┌─────────────────┐ ┌─────────────────┐                    │ │
│ │ Date de début * │ │ Date de fin *   │                    │ │
│ │ [2024-01-15]    │ │ [2024-01-31]    │                    │ │
│ └─────────────────┘ └─────────────────┘                    │ │
│                                                             │ │
│ 🏷️ Catégories *                                            │ │
│ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ [✓ Santé] [✓ Social] [Environnement]                   │ │ │
│ └─────────────────────────────────────────────────────────┘ │ │
│                                                             │ │
│ 🧠 Compétences requises                                    │ │
│ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ Communication    [Intermédiaire] [🗑️]                  │ │ │
│ │ Empathie         [Débutant]      [🗑️]                  │ │ │
│ │                                                         │ │ │
│ │ [+ Ajouter une compétence]                              │ │ │
│ └─────────────────────────────────────────────────────────┘ │ │
└─────────────────────────────────────────────────────────────┘ │
```

## Exemples d'utilisation

### 1. Création d'une opportunité simple

```typescript
// Dans le composant parent
import { OpportunityCreateComponent } from './opportunity-create/opportunity-create.component';

// Dans le template
<app-opportunity-create></app-opportunity-create>
```

### 2. Navigation vers le composant

```typescript
// Dans le service de navigation
this.router.navigate(['/opportunities/create']);
```

### 3. Écoute des événements

```typescript
// Le composant gère automatiquement :
// - Chargement des catégories
// - Validation du formulaire
// - Soumission vers l'API
// - Redirection après succès
```

## Flux d'utilisation

### 1. Accès au formulaire
- L'utilisateur navigue vers `/opportunities/create`
- Le composant se charge et affiche le spinner de chargement
- Les catégories sont récupérées depuis l'API

### 2. Remplissage du formulaire
- L'utilisateur remplit les champs obligatoires
- Les validations s'affichent en temps réel
- L'utilisateur peut ajouter des compétences dynamiquement

### 3. Validation et soumission
- Le bouton de soumission est activé quand le formulaire est valide
- L'utilisateur clique sur "Créer l'opportunité"
- Le formulaire est envoyé à l'API avec le token JWT

### 4. Confirmation
- En cas de succès : message de confirmation et redirection
- En cas d'erreur : message d'erreur détaillé

## Données d'exemple

### Catégories disponibles
```json
[
  { "id": "1", "name": "Santé" },
  { "id": "2", "name": "Éducation" },
  { "id": "3", "name": "Environnement" },
  { "id": "4", "name": "Social" },
  { "id": "5", "name": "Culture" },
  { "id": "6", "name": "Sport" }
]
```

### Niveaux de compétences
```typescript
[
  { value: 'BEGINNER', label: 'Débutant' },
  { value: 'INTERMEDIATE', label: 'Intermédiaire' },
  { value: 'ADVANCED', label: 'Avancé' },
  { value: 'EXPERT', label: 'Expert' }
]
```

### Exemple d'opportunité créée
```json
{
  "title": "Distribution de repas aux sans-abri",
  "description": "Aide à la distribution de repas chauds aux personnes sans-abri dans le centre-ville. Tâches : préparation des repas, service, nettoyage.",
  "location": "123 Rue de la Paix",
  "town": "Paris",
  "startDate": "2024-01-15",
  "endDate": "2024-01-31",
  "requirements": "Âge minimum 18 ans, formation en hygiène alimentaire souhaitée",
  "orgId": 1,
  "skillsRequired": [
    { "name": "Communication", "level": "INTERMEDIATE" },
    { "name": "Empathie", "level": "BEGINNER" }
  ],
  "categories": [
    { "id": "1", "name": "Santé" },
    { "id": "4", "name": "Social" }
  ]
}
```

## États du composant

### 1. État de chargement
- Spinner affiché
- Message "Chargement des catégories..."
- Formulaire masqué

### 2. État initial
- Formulaire vide
- Validations désactivées
- Bouton de soumission désactivé

### 3. État de remplissage
- Validations en temps réel
- Messages d'erreur contextuels
- Bouton de soumission activé si valide

### 4. État de soumission
- Spinner sur le bouton
- Formulaire désactivé
- Message "Création en cours..."

### 5. État de succès
- Snackbar de confirmation
- Redirection automatique

### 6. État d'erreur
- Snackbar d'erreur
- Formulaire réactivé
- Message d'erreur détaillé

## Responsive Design

### Desktop (> 1200px)
- Layout en 2 colonnes pour les dates
- Cartes côte à côte
- Espacement généreux

### Tablet (768px - 1200px)
- Adaptation des grilles
- Cartes empilées
- Espacement modéré

### Mobile (< 768px)
- Layout en colonne unique
- Boutons pleine largeur
- Espacement compact

## Accessibilité

### Fonctionnalités implémentées
- **Navigation au clavier** : Tab, Enter, Escape
- **Lecteurs d'écran** : Labels, descriptions, erreurs
- **Contraste** : Couleurs conformes WCAG
- **Focus visible** : Indicateurs de focus

### Améliorations possibles
- [ ] Support des raccourcis clavier
- [ ] Mode sombre
- [ ] Taille de police ajustable
- [ ] Support des technologies d'assistance avancées

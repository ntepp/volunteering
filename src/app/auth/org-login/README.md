# OrgLoginComponent

Composant Angular pour l'authentification d'organisation en deux étapes.

## Fonctionnalités

- Authentification en deux étapes : envoi de code par email puis vérification
- Formulaire réactif avec validation
- Interface utilisateur moderne avec Angular Material
- Gestion des états de chargement et d'erreurs
- Design responsive
- Stockage sécurisé du token d'authentification

## Utilisation

### 1. Import du module

```typescript
import { AuthModule } from './auth/auth.module';

@NgModule({
  imports: [
    AuthModule,
    // autres modules...
  ]
})
export class AppModule { }
```

### 2. Utilisation dans un template

```html
<app-org-login></app-org-login>
```

### 3. Route

```typescript
import { OrgLoginComponent } from './auth/org-login/org-login.component';

const routes: Routes = [
  { path: 'login/organisation', component: OrgLoginComponent }
];
```

## API Backend Requise

### Envoi de code
- **URL**: `POST /api/auth/send-code`
- **Payload**: `{ email: string }`
- **Response**: `200 OK` ou `400` avec message d'erreur

### Vérification de code
- **URL**: `POST /api/auth/verify-code`
- **Payload**: `{ email: string, code: string }`
- **Response**: `200 OK` avec `{ token: string }` ou `401`

## Configuration

### Variables d'environnement

Dans `src/environments/environment.ts` :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000' // URL de votre API
};
```

### Service d'authentification

Le composant utilise `AuthService` qui gère :
- Envoi de code par email
- Vérification du code
- Stockage du token dans localStorage
- Gestion des erreurs HTTP

## Flux d'authentification

1. **Étape 1** : L'utilisateur saisit son email et clique sur "Envoyer le code"
2. **Backend** : Envoie un code par email
3. **Étape 2** : L'utilisateur saisit le code reçu et clique sur "Se connecter"
4. **Backend** : Vérifie le code et retourne un token
5. **Frontend** : Stocke le token et redirige vers `/dashboard`

## Validation

- **Email** : Format email valide, champ requis
- **Code** : 4-8 caractères, champ requis

## États de l'interface

- **Chargement** : Spinner affiché pendant les appels API
- **Erreur** : Messages d'erreur en rouge
- **Succès** : Messages de confirmation en vert
- **Responsive** : Adaptation automatique sur mobile

## Sécurité

- Token stocké dans localStorage
- Validation côté client et serveur
- Messages d'erreur génériques pour éviter l'exposition d'informations sensibles

## Tests

Le composant inclut des tests unitaires complets dans `org-login.component.spec.ts` :

```bash
ng test --include="**/org-login.component.spec.ts"
```

## Styles

Le composant utilise des styles CSS personnalisés avec :
- Design moderne avec dégradé de fond
- Animations de transition
- Support responsive
- Thème Angular Material cohérent


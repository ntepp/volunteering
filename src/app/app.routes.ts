import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { OpportunityListComponent } from './opportunity/opportunity-list/opportunity-list.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterOrganisationComponent } from './auth/register/register-organisation/register-organisation.component';
import { RegisterVolonteerComponent } from './auth/register/register-volonteer/register-volonteer.component';
import { OpportunityDetailComponent } from './opportunity/opportunity-detail/opportunity-detail.component';
import { OpportunityCreateComponent } from './opportunity/opportunity-create/opportunity-create.component';
import { ApplicationDetailComponent } from './application/application-detail/application-detail.component';
import { ApplicationListComponent } from './application/application-list/application-list.component';
import { NotificationListComponent } from './notification/notification-list/notification-list.component';
import { OpportunityMyComponent } from './opportunity/opportunity-my/opportunity-my.component';
import { OpportunityEditComponent } from './opportunity/opportunity-edit/opportunity-edit.component';
import { OpportunityApplicationsComponent } from './opportunity/opportunity-applications/opportunity-applications.component';
import { VolunteerProfileComponent } from './user/volunteer-profile/volunteer-profile.component';
import { VolunteerPublicProfileComponent } from './user/volunteer-public-profile/volunteer-public-profile.component';
import { OrgLoginComponent } from './auth/org-login/org-login.component';
import { organizationGuard } from './auth/guards/organization.guard';
import { OrgProfileComponent } from './user/org-profile/org-profile.component';
import { MentionsLegalesComponent } from './shared/pages/mentions-legales/mentions-legales.component';
import { ContactComponent } from './shared/pages/contact/contact.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { MessageThreadComponent } from './messaging/message-thread/message-thread.component';

export const routes: Routes = [
    {path: '', component: OpportunityListComponent},
    {path: 'volunteering/opportunities', component: OpportunityListComponent, title: 'Opportunités'},
    {path: 'volunteering/opportunities/create', component: OpportunityCreateComponent, canActivate: [organizationGuard], title: 'Nouvelle opportunité'},
    {path: 'volunteering/opportunities/my', component: OpportunityMyComponent, title: 'Mes opportunités'},
    {path: 'volunteering/opportunities/:id/edit', component: OpportunityEditComponent, canActivate: [organizationGuard], title: 'Modifier l\'opportunité'},
    {path: 'volunteering/opportunities/:id/applications', component: OpportunityApplicationsComponent, canActivate: [organizationGuard], title: 'Candidatures reçues'},
    {path: 'volunteering/opportunities/:id', component: OpportunityDetailComponent, title: 'Détail de l\'opportunité'},
    {path: 'login', component: LoginComponent, title: 'Connexion'},
    {path: 'forgot-password', component: ForgotPasswordComponent, title: 'Mot de passe oublié'},
    {path: 'login/organisation', component: OrgLoginComponent, title: 'Connexion organisation'},
    {path: 'register/organisation', component: RegisterOrganisationComponent, title: 'Inscription organisation'},
    {path: 'register/volonteer', component: RegisterVolonteerComponent, title: 'Inscription volontaire'},
    {path: 'applications/:id', component: ApplicationDetailComponent, title: 'Candidature'},
    {path: 'applications', component: ApplicationListComponent, title: 'Mes candidatures'},
    {path: 'notifications', component: NotificationListComponent, title: 'Notifications'},
    {path: 'volunteer/:username', component: VolunteerPublicProfileComponent, title: 'Profil volontaire'},
    {path: 'profile', component: VolunteerProfileComponent, title: 'Mon profil'},
    {path: 'organization/:id', component: OrgProfileComponent, title: 'Profil organisation'},
    {path: 'mentions-legales', component: MentionsLegalesComponent, title: 'Mentions légales'},
    {path: 'contact', component: ContactComponent, title: 'Contact'},
    {path: 'messages/:candidatureId', component: MessageThreadComponent, title: 'Messages'}
];

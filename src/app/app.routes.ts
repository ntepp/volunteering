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
import { OrgLoginComponent } from './auth/org-login/org-login.component';
import { organizationGuard } from './auth/guards/organization.guard';

export const routes: Routes = [
    {path: '', component: OpportunityListComponent},
    {path: 'volunteering/opportunities', component: OpportunityListComponent},
    {path: 'volunteering/opportunities/create', component: OpportunityCreateComponent, canActivate: [organizationGuard]},
    {path: 'volunteering/opportunities/my', component: OpportunityMyComponent},
    {path: 'volunteering/opportunities/:id', component: OpportunityDetailComponent},
    {path: 'login', component:LoginComponent},
    {path: 'login/organisation', component: OrgLoginComponent},
    {path: 'register/organisation', component: RegisterOrganisationComponent },
    {path: 'register/volonteer', component: RegisterVolonteerComponent},
    {path: 'applications/:id', component: ApplicationDetailComponent},
    {path: 'applications', component: ApplicationListComponent},
    {path: 'notifications', component: NotificationListComponent}
];

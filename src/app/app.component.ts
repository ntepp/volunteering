import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { OpportunityListComponent } from './opportunity/opportunity-list/opportunity-list.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { OpportunityCreateComponent } from './opportunity/opportunity-create/opportunity-create.component';
import { OrgLoginComponent } from './auth/org-login/org-login.component';
import { ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,
    HeaderComponent,
    FooterComponent,
    OpportunityListComponent,
    LoginComponent,
    RegisterComponent,
    OpportunityCreateComponent,
    OrgLoginComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Rendez-vous utile';
}

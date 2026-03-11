import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ApplicationResponse } from '../../models/application.model';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.css'
})
export class ApplicationDetailComponent implements OnInit {
  application: ApplicationResponse | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Récupère les données passées en state lors de la navigation
    const nav = this.router.getCurrentNavigation();
    this.application = nav?.extras.state?.['application'] ?? null;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':  return 'En attente';
      case 'ACCEPTED': return 'Acceptée';
      case 'REJECTED': return 'Refusée';
      default:         return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING':  return 'schedule';
      case 'ACCEPTED': return 'check_circle';
      case 'REJECTED': return 'cancel';
      default:         return 'help_outline';
    }
  }

  goBack(): void {
    this.router.navigate(['/applications']);
  }
}

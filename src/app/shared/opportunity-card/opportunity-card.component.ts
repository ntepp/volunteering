import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { OpportunityResponseDto } from '../../models/opportunity.model';

/**
 * Carte d'opportunité réutilisable (accueil, feed, listes).
 * Affiche l'image de couverture (imageUrls), les tags d'urgence,
 * la catégorie, le type de travail et le nombre de bénévoles recherchés.
 */
@Component({
  selector: 'app-opportunity-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './opportunity-card.component.html',
  styleUrl: './opportunity-card.component.css'
})
export class OpportunityCardComponent {

  @Input({ required: true }) opportunity!: OpportunityResponseDto;

  constructor(private router: Router) {}

  get coverImage(): string | null {
    return this.opportunity.imageUrls?.length ? this.opportunity.imageUrls[0] : null;
  }

  get categoryNames(): string[] {
    if (this.opportunity.categoryNames?.length) {
      return this.opportunity.categoryNames;
    }
    return (this.opportunity.categories ?? []).map(c => c.name);
  }

  get workTypeLabel(): string | null {
    switch (this.opportunity.workType) {
      case 'REMOTE': return 'À distance';
      case 'ON_SITE': return 'Sur place';
      case 'HYBRID': return 'Hybride';
      default: return null;
    }
  }

  get isNew(): boolean {
    return !!this.opportunity.tags?.includes('NEW');
  }

  get isUrgent(): boolean {
    return !!this.opportunity.tags?.includes('URGENT');
  }

  openDetail(): void {
    if (this.opportunity.id) {
      this.router.navigate(['/volunteering/opportunities', this.opportunity.id]);
    }
  }
}

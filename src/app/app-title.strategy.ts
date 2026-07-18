import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/**
 * Suffixe chaque titre de route avec le nom du site.
 * Sans titre de route (accueil), garde la baseline complète.
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {

  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.title.setTitle(
      pageTitle
        ? `${pageTitle} — Je Suis Utile`
        : 'Je Suis Utile — Rendez-vous utile en quelques clics'
    );
  }
}

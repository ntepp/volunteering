import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { OpportunityCardComponent } from './opportunity-card.component';
import { OpportunityResponseDto } from '../../models/opportunity.model';

describe('OpportunityCardComponent', () => {
  let fixture: ComponentFixture<OpportunityCardComponent>;
  let component: OpportunityCardComponent;
  let router: jasmine.SpyObj<Router>;

  const baseOpportunity: OpportunityResponseDto = {
    id: 'opp-1',
    title: 'Distribution de repas',
    description: 'Aider à distribuer des repas chauds.',
    town: 'Paris',
    startDate: '2026-08-01',
    endDate: '2026-08-15'
  };

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [OpportunityCardComponent],
      providers: [{ provide: Router, useValue: router }]
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityCardComponent);
    component = fixture.componentInstance;
  });

  function setOpportunity(opp: OpportunityResponseDto): void {
    component.opportunity = opp;
    fixture.detectChanges();
  }

  it('should display the title and town', () => {
    setOpportunity(baseOpportunity);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Distribution de repas');
    expect(el.textContent).toContain('Paris');
  });

  it('should show the placeholder when there is no image', () => {
    setOpportunity(baseOpportunity);
    expect(component.coverImage).toBeNull();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('should show the first image as cover when imageUrls is provided', () => {
    setOpportunity({ ...baseOpportunity, imageUrls: ['http://x/img1.png', 'http://x/img2.png'] });
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.src).toContain('img1.png');
  });

  it('should display NEW and URGENT tags', () => {
    setOpportunity({ ...baseOpportunity, tags: ['NEW', 'URGENT'] });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Nouveau');
    expect(el.textContent).toContain('Urgent');
  });

  it('should display volunteersNeeded when present', () => {
    setOpportunity({ ...baseOpportunity, volunteersNeeded: 5 });
    expect(fixture.nativeElement.textContent).toContain('5 bénévoles');
  });

  it('should prefer categoryNames over categories', () => {
    setOpportunity({
      ...baseOpportunity,
      categoryNames: ['Éducation'],
      categories: [{ name: 'Autre' } as any]
    });
    expect(component.categoryNames).toEqual(['Éducation']);
  });

  it('should map workType to a French label', () => {
    setOpportunity({ ...baseOpportunity, workType: 'REMOTE' });
    expect(component.workTypeLabel).toBe('À distance');
  });

  it('should navigate to detail on click', () => {
    setOpportunity(baseOpportunity);
    fixture.nativeElement.querySelector('article').click();
    expect(router.navigate).toHaveBeenCalledWith(['/volunteering/opportunities', 'opp-1']);
  });

  it('should not navigate when the opportunity has no id', () => {
    setOpportunity({ ...baseOpportunity, id: undefined });
    component.openDetail();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

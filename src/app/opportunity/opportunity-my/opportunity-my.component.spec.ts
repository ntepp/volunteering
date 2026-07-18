import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { OpportunityMyComponent } from './opportunity-my.component';

describe('OpportunityMyComponent', () => {
  let component: OpportunityMyComponent;
  let fixture: ComponentFixture<OpportunityMyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunityMyComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpportunityMyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

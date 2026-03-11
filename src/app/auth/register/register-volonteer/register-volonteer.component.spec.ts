import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterVolonteerComponent } from './register-volonteer.component';

describe('RegisterVolonteerComponent', () => {
  let component: RegisterVolonteerComponent;
  let fixture: ComponentFixture<RegisterVolonteerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterVolonteerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterVolonteerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

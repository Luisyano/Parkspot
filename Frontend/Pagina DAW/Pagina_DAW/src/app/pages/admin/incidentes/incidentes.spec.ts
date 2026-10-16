import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Incidentes } from './incidentes';

describe('Incidentes', () => {
  let component: Incidentes;
  let fixture: ComponentFixture<Incidentes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Incidentes],
    }).compileComponents();

    fixture = TestBed.createComponent(Incidentes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

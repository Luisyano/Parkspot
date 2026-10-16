import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Movil } from './movil';

describe('Movil', () => {
  let component: Movil;
  let fixture: ComponentFixture<Movil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Movil],
    }).compileComponents();

    fixture = TestBed.createComponent(Movil);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Operadores } from './operadores';

describe('Operadores', () => {
  let component: Operadores;
  let fixture: ComponentFixture<Operadores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Operadores],
    }).compileComponents();

    fixture = TestBed.createComponent(Operadores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

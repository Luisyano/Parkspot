import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleSede } from './detalle-sede';

describe('DetalleSede', () => {
  let component: DetalleSede;
  let fixture: ComponentFixture<DetalleSede>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleSede],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleSede);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

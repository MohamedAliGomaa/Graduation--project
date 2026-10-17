import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompleteProfile } from './complete-profile';

describe('CompleteProfile', () => {
  let component: CompleteProfile;
  let fixture: ComponentFixture<CompleteProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompleteProfile],
    }).compileComponents();

    fixture = TestBed.createComponent(CompleteProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

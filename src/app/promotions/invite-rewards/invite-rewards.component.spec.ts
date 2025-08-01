import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteRewardsComponent } from './invite-rewards.component';

describe('InviteRewardsComponent', () => {
  let component: InviteRewardsComponent;
  let fixture: ComponentFixture<InviteRewardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviteRewardsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InviteRewardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditAgentComponent } from './credit-agent.component';

describe('CreditAgentComponent', () => {
  let component: CreditAgentComponent;
  let fixture: ComponentFixture<CreditAgentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditAgentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreditAgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

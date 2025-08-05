import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TelegramBonusComponent } from './telegram-bonus.component';

describe('TelegramBonusComponent', () => {
  let component: TelegramBonusComponent;
  let fixture: ComponentFixture<TelegramBonusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelegramBonusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TelegramBonusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

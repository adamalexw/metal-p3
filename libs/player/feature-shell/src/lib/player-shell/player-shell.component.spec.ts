import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerShellComponent } from './player-shell.component';

describe('PlayerShellComponent', () => {
  let component: PlayerShellComponent;
  let fixture: ComponentFixture<PlayerShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlayerShellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MikronAccountIdComponent } from './mikron-account-id.component';

describe('MikronAccountIdComponent', () => {
  let component: MikronAccountIdComponent;
  let fixture: ComponentFixture<MikronAccountIdComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MikronAccountIdComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MikronAccountIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

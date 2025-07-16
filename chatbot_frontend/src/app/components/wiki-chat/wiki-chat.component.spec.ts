import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WikiChatComponent } from './wiki-chat.component';

describe('WikiChatComponent', () => {
  let component: WikiChatComponent;
  let fixture: ComponentFixture<WikiChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WikiChatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WikiChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

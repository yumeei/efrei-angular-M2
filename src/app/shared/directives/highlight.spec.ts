import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { HighlightDirective } from './highlight';

@Component({
  template: '<div [appHighlight]="color" [appHighlightDelay]="delay">Test</div>',
  standalone: true,
  imports: [HighlightDirective],
  schemas: [NO_ERRORS_SCHEMA] // Permet d'ignorer les erreurs de binding
})
class TestComponent {
  color = 'yellow';
  delay = 0;
}

describe('HighlightDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HighlightDirective], // Import direct de la directive
      declarations: [], // Pas de déclarations pour les composants standalone
      schemas: [NO_ERRORS_SCHEMA] // Schema pour éviter les erreurs
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
  });

  it('should apply highlight color', fakeAsync(() => {
    component.color = 'yellow';
    component.delay = 0;

    fixture.detectChanges();
    tick(1);

    const divElement: HTMLElement = fixture.nativeElement.querySelector('div');
    expect(divElement.style.backgroundColor).toBe('yellow');
  }));
});
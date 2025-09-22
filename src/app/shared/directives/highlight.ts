import { Directive, ElementRef, inject, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
})
export class HighlightDirective implements OnInit {
  @Input() appHighlight?: string;
  @Input() appHighlightDelay?: number;

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  ngOnInit() {
    setTimeout(() => {
      this.renderer.setStyle(this.el.nativeElement, 'background-color', this.appHighlight);
    }, this.appHighlightDelay);
  }
}

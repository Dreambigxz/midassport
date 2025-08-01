import { Directive, ElementRef, Renderer2, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoaderService } from './loader.service';

@Directive({
  selector: '[appButtonLoader]',
  standalone: true
})
export class ButtonLoaderDirective implements OnInit, OnDestroy {
  private sub!: Subscription;
  private originalContent: string | null = null;
  private spinner = `<span class="spinner-button"></span>`;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    const button = this.el.nativeElement as HTMLButtonElement;

    this.sub = this.loaderService.getLoadingButton().subscribe(activeBtn => {
      if (activeBtn === button) {
        // Show loading
        this.originalContent ??= button.innerHTML;
        this.renderer.setProperty(button, 'disabled', true);
        this.renderer.setProperty(button, 'innerHTML', this.spinner);
      } else if (this.originalContent) {
        // Restore
        this.renderer.setProperty(button, 'disabled', false);
        this.renderer.setProperty(button, 'innerHTML', this.originalContent);
        this.originalContent = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}

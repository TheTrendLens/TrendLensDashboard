import {Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef} from '@angular/core';
import {Subscription} from 'rxjs';
import {FeatureAccessService} from '../services/feature-access.service';

@Directive({
  selector: '[appFeatureAccess]',
  standalone: true
})
export class FeatureAccessDirective implements OnInit, OnDestroy {
  @Input('appFeatureAccess') featureId!: string;

  private hasView = false;
  private subscription: Subscription | null = null;

  constructor(private templateRef: TemplateRef<any>,
              private viewContainer: ViewContainerRef,
              private featureAccessService: FeatureAccessService) {}

  ngOnInit(): void {
    if (!this.featureId) {
      console.warn('No feature ID specified for feature access directive');
      return;
    }

    this.subscription = this.featureAccessService.hasAccess(this.featureId).subscribe(hasAccess => {
      if (hasAccess && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!hasAccess && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    })
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

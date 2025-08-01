import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  RouteReuseStrategy
} from '@angular/router';
import { TransactionsComponent } from './wallet/transactions/transactions.component'; // <-- adjust path
import { TicketsComponent } from './tickets/tickets.component'; // <-- adjust path


export class CustomReuseStrategy implements RouteReuseStrategy {
  storedHandles = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    const path = route.routeConfig?.path;
    if (!path) return false;

    // ✅ Skip Transactions route (with or without filter param)
    if (['transactions','tickets','login','register'].includes(path)) {
    //   console.log('KEEP Running><', path);

    // if (path.startsWith('transactions')) {
      // console.log('KEEP Running><', path);
      return false;
    }

    return true;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const path = route.routeConfig?.path;
    if (path && !path.startsWith('transactions')) {
      this.storedHandles.set(path, handle);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const path = route.routeConfig?.path;
    return !!path && this.storedHandles.has(path);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const path = route.routeConfig?.path;
    if (!path || !this.storedHandles.has(path)) {
      return null;
    }
    return this.storedHandles.get(path)!;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}

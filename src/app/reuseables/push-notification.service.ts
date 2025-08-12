// src/app/push-notification.service.ts
import { Injectable } from '@angular/core';
import { environment } from './environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;

  async init() {

    console.log("INIT<<>>");

    if ('serviceWorker' in navigator) {
      this.swRegistration = await navigator.serviceWorker.ready;
      // Send VAPID key to SW
      this.swRegistration.active?.postMessage({
        type: 'SET_PUBLIC_KEY',
        key: environment.vapidPublicKey
      });
    }
  }

  async subscribeUser() {

    if (!this.swRegistration) return;

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(environment.vapidPublicKey)
      });
      let SEND_SUBSCRIPTION=subscription.toJSON()
      this.swRegistration.active?.postMessage({
        type: 'SUBSCRIBE',
        data: {subscription:SEND_SUBSCRIPTION,processor:'subscription'}
      });
      // TODO: Send subscription to backend to save it for push messages
      return subscription;
    } catch (err) {
      console.error('Failed to subscribe the user: ', err);
      return ;
    }
  }

  async unsubscribeUser() {
    if (!this.swRegistration) return;
    const subscription = await this.swRegistration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      // TODO: Notify backend to delete subscription
      this.swRegistration.active?.postMessage({
        type: 'UNSUBSCRIBE',
        data: {processor:'subscription'}
      });
    }
  }

  async isSubscribed() {
    if (!this.swRegistration) return false;
    const subscription = await this.swRegistration.pushManager.getSubscription();
    return !!subscription;
  }

  private urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

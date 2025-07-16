import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);

  getNotifications() {
    return this.notifications$.asObservable();
  }

  pop(type: 'success' | 'error' | 'warning' | 'info', message: string, duration: number = 2000) {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      duration
    };

    const currentNotifications = this.notifications$.value;
    this.notifications$.next([...currentNotifications, notification]);

    // Auto remove notification after duration
    setTimeout(() => {
      this.remove(notification.id);
    }, duration);
  }

  remove(id: string) {
    const currentNotifications = this.notifications$.value;
    const filtered = currentNotifications.filter(n => n.id !== id);
    this.notifications$.next(filtered);
  }

  clear() {
    this.notifications$.next([]);
  }
}

import { makeAutoObservable } from 'mobx';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    timestamp: Date;
}

class UIStore {
    rootStore: any;
    notifications: Notification[] = [];
    notificationCount = 0;
    isDrawerOpen = false;
    isLoading = false;

    constructor(rootStore: any) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    showNotification(message: string, type: NotificationType = 'info') {
        const notification: Notification = {
            id: Date.now().toString(),
            message,
            type,
            timestamp: new Date(),
        };

        this.notifications.push(notification);
        this.notificationCount++;

        // Автоматически удаляем уведомление через 5 секунд
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, 5000);
    }

    removeNotification(id: string) {
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    clearNotifications() {
        this.notifications = [];
        this.notificationCount = 0;
    }

    toggleDrawer() {
        this.isDrawerOpen = !this.isDrawerOpen;
    }

    setLoading(loading: boolean) {
        this.isLoading = loading;
    }
}

export default UIStore;
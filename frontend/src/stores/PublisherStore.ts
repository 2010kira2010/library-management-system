import { makeAutoObservable, runInAction } from 'mobx';
import api from '../services/api';

export interface Publisher {
    id: number;
    code: string;
    name: string;
    book_count: number;
    created_at: string;
}

class PublisherStore {
    rootStore: any;
    publishers: Publisher[] = [];
    isLoading = false;
    error: string | null = null;

    constructor(rootStore: any) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    async loadPublishers() {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await api.getPublishers();
            runInAction(() => {
                this.publishers = response.data || [];
                this.isLoading = false;
            });
        } catch (error: any) {
            runInAction(() => {
                this.error = error.response?.data?.error || 'Ошибка загрузки издательств';
                this.isLoading = false;
            });
        }
    }

    async createPublisher(publisherData: Partial<Publisher>) {
        try {
            const response = await api.createPublisher(publisherData);
            const newPublisher = response.data;

            runInAction(() => {
                this.publishers.push(newPublisher);
            });

            this.rootStore.uiStore.showNotification('Издательство успешно добавлено', 'success');
            return newPublisher;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при добавлении издательства',
                'error'
            );
            return null;
        }
    }

    async updatePublisher(id: number, publisherData: Partial<Publisher>) {
        try {
            const response = await api.updatePublisher(id, publisherData);
            const updatedPublisher = response.data;

            runInAction(() => {
                const index = this.publishers.findIndex(p => p.id === id);
                if (index !== -1) {
                    this.publishers[index] = updatedPublisher;
                }
            });

            this.rootStore.uiStore.showNotification('Издательство успешно обновлено', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при обновлении издательства',
                'error'
            );
            return false;
        }
    }

    async deletePublisher(id: number) {
        try {
            await api.deletePublisher(id);

            runInAction(() => {
                this.publishers = this.publishers.filter(p => p.id !== id);
            });

            this.rootStore.uiStore.showNotification('Издательство успешно удалено', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при удалении издательства',
                'error'
            );
            return false;
        }
    }

    getPublisherById(id: number): Publisher | undefined {
        return this.publishers.find(p => p.id === id);
    }

    searchPublishers(query: string): Publisher[] {
        if (!query) return this.publishers;

        const lowerQuery = query.toLowerCase();
        return this.publishers.filter(publisher =>
            publisher.name.toLowerCase().includes(lowerQuery) ||
            publisher.code.includes(query)
        );
    }

    getPublishersForSelect() {
        return this.publishers.map(publisher => ({
            value: publisher.id,
            label: publisher.name,
        }));
    }
}

export default PublisherStore;
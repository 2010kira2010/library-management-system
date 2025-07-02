import { makeAutoObservable, runInAction } from 'mobx';
import api from '../services/api';

export interface Disk {
    id: number;
    code: string;
    title: string;
    short_title: string;
    publisher_id?: number;
    publisher?: {
        id: number;
        name: string;
    };
    subject: string;
    resource_type: string;
    barcode: string;
    is_available: boolean;
    comments: string;
    created_at: string;
}

class DiskStore {
    rootStore: any;
    disks: Disk[] = [];
    filteredDisks: Disk[] = [];
    isLoading = false;
    error: string | null = null;
    searchQuery = '';

    // Предметы и типы ресурсов
    subjects: string[] = [
        'География',
        'История',
        'Обществознание',
        'Математика',
        'Алгебра',
        'Геометрия',
        'Черчение',
        'Физика',
        'Астрономия',
        'Химия',
        'Биология',
        'Природоведение',
        'Окружающий мир',
        'Естествознание',
        'Экология',
        'ОБЖ',
        'Информатика',
        'Русский язык',
        'Литература',
        'Английский язык',
        'Музыка',
        'ИЗО',
        'Труд',
    ];

    resourceTypes: string[] = [
        'Программа',
        'Электронные/интерактивные карты',
        'Видео к урокам',
        'Презентации',
        'Тесты',
        'Обучающие игры',
    ];

    constructor(rootStore: any) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    async loadDisks() {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await api.getDisks();
            runInAction(() => {
                this.disks = response.data || [];
                this.filteredDisks = this.disks;
                this.isLoading = false;
            });
        } catch (error: any) {
            runInAction(() => {
                this.error = error.response?.data?.error || 'Ошибка загрузки дисков';
                this.isLoading = false;
            });
        }
    }

    async createDisk(diskData: Partial<Disk>) {
        try {
            const response = await api.createDisk(diskData);
            const newDisk = response.data;

            runInAction(() => {
                this.disks.push(newDisk);
                this.searchDisks(this.searchQuery);
            });

            this.rootStore.uiStore.showNotification('Диск успешно добавлен', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при добавлении диска',
                'error'
            );
            return false;
        }
    }

    async updateDisk(id: number, diskData: Partial<Disk>) {
        try {
            const response = await api.updateDisk(id, diskData);
            const updatedDisk = response.data;

            runInAction(() => {
                const index = this.disks.findIndex(d => d.id === id);
                if (index !== -1) {
                    this.disks[index] = updatedDisk;
                    this.searchDisks(this.searchQuery);
                }
            });

            this.rootStore.uiStore.showNotification('Диск успешно обновлен', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при обновлении диска',
                'error'
            );
            return false;
        }
    }

    async deleteDisk(id: number) {
        try {
            await api.deleteDisk(id);

            runInAction(() => {
                this.disks = this.disks.filter(d => d.id !== id);
                this.searchDisks(this.searchQuery);
            });

            this.rootStore.uiStore.showNotification('Диск успешно удален', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при удалении диска',
                'error'
            );
            return false;
        }
    }

    searchDisks(query: string) {
        this.searchQuery = query;

        if (!query) {
            this.filteredDisks = this.disks;
            return;
        }

        const lowerQuery = query.toLowerCase();
        this.filteredDisks = this.disks.filter(disk =>
            disk.title.toLowerCase().includes(lowerQuery) ||
            disk.barcode.includes(query) ||
            disk.subject.toLowerCase().includes(lowerQuery) ||
            disk.resource_type.toLowerCase().includes(lowerQuery) ||
            disk.publisher?.name.toLowerCase().includes(lowerQuery)
        );
    }

    getDiskById(id: number): Disk | undefined {
        return this.disks.find(d => d.id === id);
    }

    getDiskByBarcode(barcode: string): Disk | undefined {
        return this.disks.find(d => d.barcode === barcode);
    }

    getAvailableDisks(): Disk[] {
        return this.disks.filter(d => d.is_available);
    }

    getDisksBySubject(subject: string): Disk[] {
        return this.disks.filter(d => d.subject === subject);
    }

    getDisksByType(resourceType: string): Disk[] {
        return this.disks.filter(d => d.resource_type === resourceType);
    }
}

export default DiskStore;
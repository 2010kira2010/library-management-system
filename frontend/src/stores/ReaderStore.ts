import { makeAutoObservable, runInAction } from 'mobx';
import api from '../services/api';

export interface Reader {
    id: number;
    code: string;
    barcode: string;
    last_name: string;
    first_name: string;
    middle_name: string;
    user_type: string;
    class_id?: number;
    grade?: number;
    gender: string;
    birth_date?: string;
    address: string;
    document_type: string;
    document_number: string;
    phone: string;
    email: string;
    photo?: any;
    parent_mother_name: string;
    parent_mother_phone: string;
    parent_father_name: string;
    parent_father_phone: string;
    guardian_name: string;
    guardian_phone: string;
    comments: string;
    active_loans_count: number;
    created_at: string;
}

class ReaderStore {
    rootStore: any;
    readers: Reader[] = [];
    filteredReaders: Reader[] = [];
    isLoading = false;
    error: string | null = null;
    searchQuery = '';

    constructor(rootStore: any) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    async loadReaders() {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await api.getReaders();
            runInAction(() => {
                this.readers = response.data.readers || [];
                this.filteredReaders = this.readers;
                this.isLoading = false;
            });
        } catch (error: any) {
            runInAction(() => {
                this.error = error.response?.data?.error || 'Ошибка загрузки читателей';
                this.isLoading = false;
            });
        }
    }

    async getReaderByBarcode(barcode: string): Promise<Reader | null> {
        try {
            const response = await api.getReaderByBarcode(barcode);
            return response.data;
        } catch (error) {
            this.rootStore.uiStore.showNotification('Читатель не найден', 'error');
            return null;
        }
    }

    async createReader(readerData: Partial<Reader>) {
        try {
            const response = await api.createReader(readerData);
            const newReader = response.data;

            runInAction(() => {
                this.readers.push(newReader);
                this.searchReaders(this.searchQuery);
            });

            this.rootStore.uiStore.showNotification('Читатель успешно добавлен', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при добавлении читателя',
                'error'
            );
            return false;
        }
    }

    async updateReader(id: number, readerData: Partial<Reader>) {
        try {
            const response = await api.updateReader(id, readerData);
            const updatedReader = response.data;

            runInAction(() => {
                const index = this.readers.findIndex(r => r.id === id);
                if (index !== -1) {
                    this.readers[index] = updatedReader;
                    this.searchReaders(this.searchQuery);
                }
            });

            this.rootStore.uiStore.showNotification('Читатель успешно обновлен', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при обновлении читателя',
                'error'
            );
            return false;
        }
    }

    async deleteReader(id: number) {
        try {
            await api.deleteReader(id);

            runInAction(() => {
                this.readers = this.readers.filter(r => r.id !== id);
                this.searchReaders(this.searchQuery);
            });

            this.rootStore.uiStore.showNotification('Читатель успешно удален', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при удалении читателя',
                'error'
            );
            return false;
        }
    }

    searchReaders(query: string) {
        this.searchQuery = query;

        if (!query) {
            this.filteredReaders = this.readers;
            return;
        }

        const lowerQuery = query.toLowerCase();
        this.filteredReaders = this.readers.filter(reader =>
            reader.last_name.toLowerCase().includes(lowerQuery) ||
            reader.first_name.toLowerCase().includes(lowerQuery) ||
            reader.barcode.includes(query) ||
            reader.code.includes(query) ||
            reader.phone.includes(query)
        );
    }

    getReaderById(id: number): Reader | undefined {
        return this.readers.find(r => r.id === id);
    }

    async printReaderCard(_readerId: number) {
        try {
            // TODO: Implement reader card printing
            this.rootStore.uiStore.showNotification('Печать читательского билета в разработке', 'info');
        } catch (error) {
            this.rootStore.uiStore.showNotification('Ошибка печати', 'error');
        }
    }

    async exportToExcel() {
        try {
            // TODO: Implement Excel export
            this.rootStore.uiStore.showNotification('Экспорт в разработке', 'info');
        } catch (error) {
            this.rootStore.uiStore.showNotification('Ошибка экспорта', 'error');
        }
    }
}

export default ReaderStore;
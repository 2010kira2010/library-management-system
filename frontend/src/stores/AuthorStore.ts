import { makeAutoObservable, runInAction } from 'mobx';
import api from '../services/api';

export interface Author {
    id: number;
    code: string;
    last_name: string;
    first_name: string;
    middle_name: string;
    short_name: string;
    book_count: number;
    created_at: string;
}

class AuthorStore {
    rootStore: any;
    authors: Author[] = [];
    isLoading = false;
    error: string | null = null;

    constructor(rootStore: any) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    async loadAuthors() {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await api.getAuthors();
            runInAction(() => {
                this.authors = response.data || [];
                this.isLoading = false;
            });
        } catch (error: any) {
            runInAction(() => {
                this.error = error.response?.data?.error || 'Ошибка загрузки авторов';
                this.isLoading = false;
            });
        }
    }

    async createAuthor(authorData: Partial<Author>) {
        try {
            // Формируем краткое имя если не указано
            if (!authorData.short_name && authorData.last_name) {
                const firstInitial = authorData.first_name ? authorData.first_name[0] + '.' : '';
                const middleInitial = authorData.middle_name ? authorData.middle_name[0] + '.' : '';
                authorData.short_name = `${authorData.last_name} ${firstInitial}${middleInitial}`.trim();
            }

            const response = await api.createAuthor(authorData);
            const newAuthor = response.data;

            runInAction(() => {
                this.authors.push(newAuthor);
            });

            this.rootStore.uiStore.showNotification('Автор успешно добавлен', 'success');
            return newAuthor;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при добавлении автора',
                'error'
            );
            return null;
        }
    }

    async updateAuthor(id: number, authorData: Partial<Author>) {
        try {
            const response = await api.updateAuthor(id, authorData);
            const updatedAuthor = response.data;

            runInAction(() => {
                const index = this.authors.findIndex(a => a.id === id);
                if (index !== -1) {
                    this.authors[index] = updatedAuthor;
                }
            });

            this.rootStore.uiStore.showNotification('Автор успешно обновлен', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при обновлении автора',
                'error'
            );
            return false;
        }
    }

    async deleteAuthor(id: number) {
        try {
            await api.deleteAuthor(id);

            runInAction(() => {
                this.authors = this.authors.filter(a => a.id !== id);
            });

            this.rootStore.uiStore.showNotification('Автор успешно удален', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при удалении автора',
                'error'
            );
            return false;
        }
    }

    getAuthorById(id: number): Author | undefined {
        return this.authors.find(a => a.id === id);
    }

    searchAuthors(query: string): Author[] {
        if (!query) return this.authors;

        const lowerQuery = query.toLowerCase();
        return this.authors.filter(author =>
            author.last_name.toLowerCase().includes(lowerQuery) ||
            author.first_name.toLowerCase().includes(lowerQuery) ||
            author.short_name.toLowerCase().includes(lowerQuery) ||
            author.code.includes(query)
        );
    }

    getAuthorsForSelect() {
        return this.authors.map(author => ({
            value: author.id,
            label: author.short_name,
        }));
    }
}

export default AuthorStore;
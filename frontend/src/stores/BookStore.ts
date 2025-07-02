import { makeAutoObservable, runInAction } from 'mobx';
import api from '../services/api';

export interface Book {
    id: number;
    code: string;
    title: string;
    short_title: string;
    author_id?: number;
    author?: {
        id: number;
        short_name: string;
    };
    publisher_id?: number;
    publisher?: {
        id: number;
        name: string;
    };
    publication_year?: number;
    barcode: string;
    isbn: string;
    bbk: string;
    udk: string;
    class_range: string;
    location: string;
    is_available: boolean;
    created_at: string;
}

class BookStore {
    rootStore: any;
    books: Book[] = [];
    filteredBooks: Book[] = [];
    isLoading = false;
    error: string | null = null;
    searchQuery = '';

    constructor(rootStore: any) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    async loadBooks() {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await api.getBooks();
            runInAction(() => {
                this.books = response.data.books || [];
                this.filteredBooks = this.books;
                this.isLoading = false;
            });
        } catch (error: any) {
            runInAction(() => {
                this.error = error.response?.data?.error || 'Ошибка загрузки книг';
                this.isLoading = false;
            });
        }
    }

    async createBook(bookData: Partial<Book>) {
        try {
            const response = await api.createBook(bookData);
            const newBook = response.data;

            runInAction(() => {
                this.books.push(newBook);
                this.searchBooks(this.searchQuery);
            });

            this.rootStore.uiStore.showNotification('Книга успешно добавлена', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при добавлении книги',
                'error'
            );
            return false;
        }
    }

    async updateBook(id: number, bookData: Partial<Book>) {
        try {
            const response = await api.updateBook(id, bookData);
            const updatedBook = response.data;

            runInAction(() => {
                const index = this.books.findIndex(b => b.id === id);
                if (index !== -1) {
                    this.books[index] = updatedBook;
                    this.searchBooks(this.searchQuery);
                }
            });

            this.rootStore.uiStore.showNotification('Книга успешно обновлена', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при обновлении книги',
                'error'
            );
            return false;
        }
    }

    async deleteBook(id: number) {
        try {
            await api.deleteBook(id);

            runInAction(() => {
                this.books = this.books.filter(b => b.id !== id);
                this.searchBooks(this.searchQuery);
            });

            this.rootStore.uiStore.showNotification('Книга успешно удалена', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при удалении книги',
                'error'
            );
            return false;
        }
    }

    searchBooks(query: string) {
        this.searchQuery = query;

        if (!query) {
            this.filteredBooks = this.books;
            return;
        }

        const lowerQuery = query.toLowerCase();
        this.filteredBooks = this.books.filter(book =>
            book.title.toLowerCase().includes(lowerQuery) ||
            book.barcode.includes(query) ||
            book.isbn.includes(query) ||
            book.author?.short_name.toLowerCase().includes(lowerQuery) ||
            book.publisher?.name.toLowerCase().includes(lowerQuery)
        );
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

export default BookStore;
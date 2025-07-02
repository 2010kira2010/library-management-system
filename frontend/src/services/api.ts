import axios, { AxiosInstance } from 'axios';

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: '/api',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Интерсептор для добавления токена
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Интерсептор для обработки ошибок
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Токен истек или недействителен
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    setAuthToken(token: string | null) {
        if (token) {
            this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.api.defaults.headers.common['Authorization'];
        }
    }

    // Auth
    async login(username: string, password: string) {
        return this.api.post('/auth/login', { username, password });
    }

    // Books
    async getBooks(params?: any) {
        return this.api.get('/books', { params });
    }

    async getBook(id: number) {
        return this.api.get(`/books/${id}`);
    }

    async getBookByBarcode(barcode: string) {
        return this.api.get(`/books/barcode/${barcode}`);
    }

    async createBook(data: any) {
        return this.api.post('/books', data);
    }

    async updateBook(id: number, data: any) {
        return this.api.put(`/books/${id}`, data);
    }

    async deleteBook(id: number) {
        return this.api.delete(`/books/${id}`);
    }

    // Readers
    async getReaders(params?: any) {
        return this.api.get('/readers', { params });
    }

    async getReader(id: number) {
        return this.api.get(`/readers/${id}`);
    }

    async getReaderByBarcode(barcode: string) {
        return this.api.get(`/readers/barcode/${barcode}`);
    }

    async createReader(data: any) {
        return this.api.post('/readers', data);
    }

    async updateReader(id: number, data: any) {
        return this.api.put(`/readers/${id}`, data);
    }

    async deleteReader(id: number) {
        return this.api.delete(`/readers/${id}`);
    }

    // Authors
    async getAuthors(params?: any) {
        return this.api.get('/authors', { params });
    }

    async createAuthor(data: any) {
        return this.api.post('/authors', data);
    }

    async updateAuthor(id: number, data: any) {
        return this.api.put(`/authors/${id}`, data);
    }

    async deleteAuthor(id: number) {
        return this.api.delete(`/authors/${id}`);
    }

    // Publishers
    async getPublishers(params?: any) {
        return this.api.get('/publishers', { params });
    }

    async createPublisher(data: any) {
        return this.api.post('/publishers', data);
    }

    async updatePublisher(id: number, data: any) {
        return this.api.put(`/publishers/${id}`, data);
    }

    async deletePublisher(id: number) {
        return this.api.delete(`/publishers/${id}`);
    }

    // Loans
    async issueBook(bookBarcode: string, readerBarcode: string) {
        return this.api.post('/loans/issue', {
            book_barcode: bookBarcode,
            reader_barcode: readerBarcode,
        });
    }

    async returnBook(bookBarcode: string) {
        return this.api.post('/loans/return', {
            book_barcode: bookBarcode,
        });
    }

    async getActiveLoans(search?: string) {
        return this.api.get('/loans/active', { params: { search } });
    }

    async getLoanHistory(params?: any) {
        return this.api.get('/loans/history', { params });
    }

    // Disks
    async getDisks(params?: any) {
        return this.api.get('/disks', { params });
    }

    async createDisk(data: any) {
        return this.api.post('/disks', data);
    }

    async updateDisk(id: number, data: any) {
        return this.api.put(`/disks/${id}`, data);
    }

    async deleteDisk(id: number) {
        return this.api.delete(`/disks/${id}`);
    }

    // Reports
    async getBookAvailabilityReport(params?: any) {
        return this.api.get('/reports/book-availability', { params });
    }

    async getLoanHistoryReport(params?: any) {
        return this.api.get('/reports/loan-history', { params });
    }

    async getClassLoansReport(classId: number) {
        return this.api.get(`/reports/class-loans/${classId}`);
    }

    // Settings
    async getSettings() {
        return this.api.get('/settings');
    }

    async updateSettings(data: any) {
        return this.api.post('/settings', data);
    }

    // Dashboard
    async getDashboardStats() {
        return this.api.get('/dashboard/stats');
    }

    // Utility methods
    post(url: string, data?: any) {
        return this.api.post(url, data);
    }

    get(url: string, params?: any) {
        return this.api.get(url, { params });
    }

    put(url: string, data?: any) {
        return this.api.put(url, data);
    }

    delete(url: string) {
        return this.api.delete(url);
    }
}

const api = new ApiService();
export default api;
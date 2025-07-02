import { makeAutoObservable, runInAction } from 'mobx';
import api from '../services/api';

interface User {
    id: number;
    username: string;
    full_name: string;
    role: string;
}

class AuthStore {
    rootStore: any;
    user: User | null = null;
    token: string | null = null;
    isAuthenticated = false;
    isLoading = false;
    error: string | null = null;

    constructor(rootStore: any) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
        this.loadTokenFromStorage();
    }

    loadTokenFromStorage() {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            this.token = token;
            this.user = JSON.parse(userStr);
            this.isAuthenticated = true;
            api.setAuthToken(token);
        }
    }

    async login(username: string, password: string) {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await api.post('/auth/login', { username, password });
            const { token, user } = response.data;

            runInAction(() => {
                this.token = token;
                this.user = user;
                this.isAuthenticated = true;
                this.isLoading = false;
            });

            // Сохраняем в localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            api.setAuthToken(token);

            return true;
        } catch (error: any) {
            runInAction(() => {
                this.error = error.response?.data?.message || 'Ошибка входа';
                this.isLoading = false;
            });
            return false;
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        api.setAuthToken(null);
    }
}

export default AuthStore;
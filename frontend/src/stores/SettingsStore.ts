import { makeAutoObservable, runInAction } from 'mobx';
import api from '../services/api';

export interface Settings {
    id: number;
    organization_name: string;
    organization_short_name: string;
    director_name: string;
    updated_at: string;
}

export interface Class {
    id: number;
    grade: number;
    letter: string;
    teacher_name: string;
    display_name?: string;
}

export interface LibraryUser {
    id: number;
    username: string;
    full_name: string;
    role: string;
}

class SettingsStore {
    rootStore: any;
    settings: Settings | null = null;
    classes: Class[] = [];
    libraryUsers: LibraryUser[] = [];
    isLoading = false;
    error: string | null = null;

    // API клиент для прямых запросов
    get apiClient() {
        return this.rootStore.apiClient || api;
    }

    // Типы документов
    documentTypes = [
        'Паспорт',
        'Свидетельство о рождении',
        'Ученический билет',
    ];

    // Типы пользователей
    userTypes = [
        { value: 'student', label: 'Ученик' },
        { value: 'teacher', label: 'Учитель' },
        { value: 'parent', label: 'Родитель' },
        { value: 'guardian', label: 'Опекун' },
        { value: 'social_pedagogue', label: 'Социальный педагог' },
        { value: 'educator', label: 'Воспитатель' },
        { value: 'psychologist', label: 'Психолог' },
        { value: 'speech_therapist', label: 'Логопед' },
    ];

    constructor(rootStore: any) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    async loadSettings() {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await api.getSettings();
            runInAction(() => {
                this.settings = response.data.settings;
                this.classes = response.data.classes || [];
                this.libraryUsers = response.data.users || [];
                this.isLoading = false;
            });
        } catch (error: any) {
            runInAction(() => {
                this.error = error.response?.data?.error || 'Ошибка загрузки настроек';
                this.isLoading = false;
            });
        }
    }

    async updateSettings(settingsData: Partial<Settings>) {
        try {
            const response = await api.updateSettings(settingsData);

            runInAction(() => {
                this.settings = response.data;
            });

            this.rootStore.uiStore.showNotification('Настройки успешно сохранены', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при сохранении настроек',
                'error'
            );
            return false;
        }
    }

    async addClass(classData: { grade: number; letter: string; teacher_name?: string }) {
        try {
            // TODO: Implement API call
            const newClass = {
                id: Date.now(), // временный ID
                ...classData,
                teacher_name: classData.teacher_name || '',
                display_name: `${classData.grade} "${classData.letter}"`,
            };

            runInAction(() => {
                this.classes.push(newClass);
            });

            this.rootStore.uiStore.showNotification('Класс успешно добавлен', 'success');
            return true;
        } catch (error) {
            this.rootStore.uiStore.showNotification('Ошибка при добавлении класса', 'error');
            return false;
        }
    }

    async updateClass(id: number, classData: Partial<Class>) {
        try {
            // TODO: Implement API call
            runInAction(() => {
                const index = this.classes.findIndex(c => c.id === id);
                if (index !== -1) {
                    this.classes[index] = { ...this.classes[index], ...classData };
                }
            });

            this.rootStore.uiStore.showNotification('Класс успешно обновлен', 'success');
            return true;
        } catch (error) {
            this.rootStore.uiStore.showNotification('Ошибка при обновлении класса', 'error');
            return false;
        }
    }

    async deleteClass(id: number) {
        try {
            // TODO: Implement API call
            runInAction(() => {
                this.classes = this.classes.filter(c => c.id !== id);
            });

            this.rootStore.uiStore.showNotification('Класс успешно удален', 'success');
            return true;
        } catch (error) {
            this.rootStore.uiStore.showNotification('Ошибка при удалении класса', 'error');
            return false;
        }
    }

    async addLibraryUser(userData: { username: string; password: string; full_name: string; role: string }) {
        try {
            // TODO: Implement API call
            const newUser: LibraryUser = {
                id: Date.now(),
                username: userData.username,
                full_name: userData.full_name,
                role: userData.role,
            };

            runInAction(() => {
                this.libraryUsers.push(newUser);
            });

            this.rootStore.uiStore.showNotification('Пользователь успешно добавлен', 'success');
            return true;
        } catch (error) {
            this.rootStore.uiStore.showNotification('Ошибка при добавлении пользователя', 'error');
            return false;
        }
    }

    async updateLibraryUser(id: number, userData: Partial<LibraryUser>) {
        try {
            // TODO: Implement API call
            runInAction(() => {
                const index = this.libraryUsers.findIndex(u => u.id === id);
                if (index !== -1) {
                    this.libraryUsers[index] = { ...this.libraryUsers[index], ...userData };
                }
            });

            this.rootStore.uiStore.showNotification('Пользователь успешно обновлен', 'success');
            return true;
        } catch (error) {
            this.rootStore.uiStore.showNotification('Ошибка при обновлении пользователя', 'error');
            return false;
        }
    }

    async deleteLibraryUser(id: number) {
        try {
            // TODO: Implement API call
            runInAction(() => {
                this.libraryUsers = this.libraryUsers.filter(u => u.id !== id);
            });

            this.rootStore.uiStore.showNotification('Пользователь успешно удален', 'success');
            return true;
        } catch (error) {
            this.rootStore.uiStore.showNotification('Ошибка при удалении пользователя', 'error');
            return false;
        }
    }

    getClassById(id: number): Class | undefined {
        return this.classes.find(c => c.id === id);
    }

    getClassByGradeAndLetter(grade: number, letter: string): Class | undefined {
        return this.classes.find(c => c.grade === grade && c.letter === letter);
    }

    getClassesForSelect() {
        return this.classes.map(cls => ({
            value: cls.id,
            label: `${cls.grade} "${cls.letter}"`,
        }));
    }

    getGrades(): number[] {
        const grades = new Set(this.classes.map(c => c.grade));
        return Array.from(grades).sort((a, b) => a - b);
    }

    getLettersByGrade(grade: number): string[] {
        return this.classes
            .filter(c => c.grade === grade)
            .map(c => c.letter)
            .sort();
    }
}

export default SettingsStore;
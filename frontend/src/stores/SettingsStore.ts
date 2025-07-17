import { makeAutoObservable, runInAction } from 'mobx';
import api from '../services/api';

export interface Settings {
    id: number;
    organization_name?: string;
    organization_short_name?: string;
    director_name?: string;
    updated_at?: string;
}

export interface Class {
    id: number;
    grade: number;
    letter: string;
    teacher_name?: string;
    display_name?: string;
    students_count?: number;
    is_active?: boolean;
}

export interface LibraryUser {
    id: number;
    username: string;
    full_name: string;
    email?: string;
    role: string;
    is_active?: boolean;
    last_login?: string;
    created_at?: string;
}

export interface OrganizationData {
    name: string;
    full_name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    director: string;
    librarian: string;
    inn: string;
    kpp: string;
    ogrn: string;
    bank_name: string;
    bank_account: string;
    bank_bik: string;
    logo_url?: string;
}

export interface EmailConfig {
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    smtp_from: string;
    smtp_from_name: string;
    smtp_encryption: string;
    smtp_enabled: boolean;
    notifications: {
        loan_reminder: boolean;
        overdue_notice: boolean;
        new_book_arrival: boolean;
        reader_registration: boolean;
    };
    reminder_days_before: number;
    overdue_check_time: string;
}

class SettingsStore {
    rootStore: any;
    settings: Settings | null = null;
    classes: Class[] = [];
    libraryUsers: LibraryUser[] = [];
    isLoading = false;
    error: string | null = null;

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
                this.error = null;
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

    // Методы для работы с классами
    async loadClasses() {
        try {
            const response = await api.getClasses();
            runInAction(() => {
                this.classes = response.data || [];
            });
        } catch (error: any) {
            this.rootStore.uiStore.showNotification('Ошибка загрузки классов', 'error');
        }
    }

    async createClass(classData: { grade: number; letter: string; teacher_name?: string }) {
        try {
            const response = await api.createClass(classData);
            const newClass = response.data;

            runInAction(() => {
                this.classes.push(newClass);
            });

            this.rootStore.uiStore.showNotification('Класс успешно добавлен', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при добавлении класса',
                'error'
            );
            return false;
        }
    }

    async updateClass(id: number, classData: Partial<Class>) {
        try {
            const response = await api.updateClass(id, classData);

            runInAction(() => {
                const index = this.classes.findIndex(c => c.id === id);
                if (index !== -1) {
                    this.classes[index] = response.data;
                }
            });

            this.rootStore.uiStore.showNotification('Класс успешно обновлен', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при обновлении класса',
                'error'
            );
            return false;
        }
    }

    async deleteClass(id: number) {
        try {
            await api.deleteClass(id);

            runInAction(() => {
                this.classes = this.classes.filter(c => c.id !== id);
            });

            this.rootStore.uiStore.showNotification('Класс успешно удален', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при удалении класса',
                'error'
            );
            return false;
        }
    }

    async toggleClassActive(id: number) {
        try {
            await api.toggleClassActive(id);
            await this.loadClasses();
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification('Ошибка изменения статуса класса', 'error');
            return false;
        }
    }

    // Методы для работы с сотрудниками
    async loadStaff() {
        try {
            const response = await api.getStaff();
            runInAction(() => {
                this.libraryUsers = response.data || [];
            });
        } catch (error: any) {
            this.rootStore.uiStore.showNotification('Ошибка загрузки сотрудников', 'error');
        }
    }

    async createStaff(userData: { username: string; password: string; full_name: string; role: string; email: string }) {
        try {
            const response = await api.createStaff(userData);
            const newUser = response.data;

            runInAction(() => {
                this.libraryUsers.push(newUser);
            });

            this.rootStore.uiStore.showNotification('Сотрудник успешно добавлен', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при добавлении сотрудника',
                'error'
            );
            return false;
        }
    }

    async updateStaff(id: number, userData: Partial<LibraryUser>) {
        try {
            const response = await api.updateStaff(id, userData);

            runInAction(() => {
                const index = this.libraryUsers.findIndex(u => u.id === id);
                if (index !== -1) {
                    this.libraryUsers[index] = response.data;
                }
            });

            this.rootStore.uiStore.showNotification('Сотрудник успешно обновлен', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при обновлении сотрудника',
                'error'
            );
            return false;
        }
    }

    async deleteStaff(id: number) {
        try {
            await api.deleteStaff(id);

            runInAction(() => {
                this.libraryUsers = this.libraryUsers.filter(u => u.id !== id);
            });

            this.rootStore.uiStore.showNotification('Сотрудник успешно удален', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при удалении сотрудника',
                'error'
            );
            return false;
        }
    }

    async updateStaffPassword(id: number, password: string) {
        try {
            await api.updateStaffPassword(id, { password });
            this.rootStore.uiStore.showNotification('Пароль успешно изменен', 'success');
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification('Ошибка при изменении пароля', 'error');
            return false;
        }
    }

    async toggleStaffActive(id: number) {
        try {
            await api.toggleStaffActive(id);
            await this.loadStaff();
            return true;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification('Ошибка изменения статуса сотрудника', 'error');
            return false;
        }
    }

    // Вспомогательные методы
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

    getUserById(id: number): LibraryUser | undefined {
        return this.libraryUsers.find(u => u.id === id);
    }

    getRoles() {
        return [
            { value: 'admin', label: 'Администратор' },
            { value: 'librarian', label: 'Библиотекарь' },
            { value: 'teacher', label: 'Учитель' },
        ];
    }
}

export default SettingsStore;
import { makeAutoObservable, runInAction } from 'mobx';
import api from '../services/api';

export interface Loan {
    id: number;
    book_id: number;
    book?: {
        id: number;
        title: string;
        barcode: string;
        author?: {
            short_name: string;
        };
    };
    reader_id: number;
    reader?: {
        id: number;
        last_name: string;
        first_name: string;
        middle_name: string;
        barcode: string;
        grade?: number;
    };
    issue_date: string;
    return_date?: string;
    issued_by: number;
    issued_by_user?: {
        full_name: string;
    };
    returned_by?: number;
    status: 'active' | 'returned';
    days_on_loan: number;
}

class LoanStore {
    rootStore: any;
    activeLoans: Loan[] = [];
    loanHistory: Loan[] = [];
    isLoading = false;
    error: string | null = null;

    constructor(rootStore: any) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    async loadActiveLoans(search?: string) {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await api.getActiveLoans(search);
            runInAction(() => {
                this.activeLoans = response.data || [];
                this.isLoading = false;
            });
        } catch (error: any) {
            runInAction(() => {
                this.error = error.response?.data?.error || 'Ошибка загрузки активных выдач';
                this.isLoading = false;
            });
        }
    }

    async loadLoanHistory(params?: any) {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await api.getLoanHistory(params);
            runInAction(() => {
                this.loanHistory = response.data || [];
                this.isLoading = false;
            });
        } catch (error: any) {
            runInAction(() => {
                this.error = error.response?.data?.error || 'Ошибка загрузки истории';
                this.isLoading = false;
            });
        }
    }

    async issueBook(bookBarcode: string, readerBarcode: string) {
        try {
            const response = await api.issueBook(bookBarcode, readerBarcode);
            const loan = response.data.loan;

            runInAction(() => {
                this.activeLoans.unshift(loan);
            });

            this.rootStore.uiStore.showNotification('Книга успешно выдана', 'success');
            return loan;
        } catch (error: any) {
            const errorData = error.response?.data;
            let errorMessage = 'Ошибка при выдаче книги';

            if (errorData?.error) {
                errorMessage = errorData.error;
                if (errorData.details) {
                    errorMessage += `. Выдана: ${errorData.details.reader} (${errorData.details.issue_date})`;
                }
            }

            this.rootStore.uiStore.showNotification(errorMessage, 'error');
            throw error;
        }
    }

    async returnBook(bookBarcode: string) {
        try {
            const response = await api.returnBook(bookBarcode);
            const returnedLoan = response.data.loan;

            runInAction(() => {
                // Удаляем из активных выдач
                this.activeLoans = this.activeLoans.filter(
                    loan => loan.book?.barcode !== bookBarcode
                );
            });

            this.rootStore.uiStore.showNotification(
                `Книга успешно возвращена. Была на руках ${returnedLoan.days_on_loan} дней`,
                'success'
            );

            return returnedLoan;
        } catch (error: any) {
            this.rootStore.uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при возврате книги',
                'error'
            );
            throw error;
        }
    }

    async returnBooksBatch(bookBarcodes: string[]) {
        const results = {
            success: [] as any[],
            failed: [] as { barcode: string; error: string }[],
        };

        for (const barcode of bookBarcodes) {
            try {
                const result = await this.returnBook(barcode);
                results.success.push(result);
            } catch (error: any) {
                results.failed.push({
                    barcode,
                    error: error.response?.data?.error || 'Ошибка возврата',
                });
            }
        }

        return results;
    }

    getActiveLoansByReader(readerId: number): Loan[] {
        return this.activeLoans.filter(loan => loan.reader_id === readerId);
    }

    getOverdueLoans(daysOverdue: number = 30): Loan[] {
        return this.activeLoans.filter(loan => loan.days_on_loan > daysOverdue);
    }

    async generateLoanReport() {
        try {
            // TODO: Implement loan report generation
            this.rootStore.uiStore.showNotification('Генерация отчета в разработке', 'info');
        } catch (error) {
            this.rootStore.uiStore.showNotification('Ошибка генерации отчета', 'error');
        }
    }
}

export default LoanStore;
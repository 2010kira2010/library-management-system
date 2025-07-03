import * as XLSX from 'xlsx';

export interface ExportOptions {
    fileName: string;
    sheetName?: string;
    headers: Record<string, string>;
    data: any[];
}

export interface ImportOptions {
    file: File;
    headers: Record<string, string>;
    validators?: Record<string, (value: any) => boolean>;
}

// Экспорт данных в Excel
export const exportToExcel = (options: ExportOptions) => {
    const { fileName, sheetName = 'Sheet1', headers, data } = options;

    // Преобразуем данные согласно заголовкам
    const exportData = data.map(item => {
        const row: any = {};
        Object.entries(headers).forEach(([key, label]) => {
            row[label] = getValue(item, key);
        });
        return row;
    });

    // Создаем книгу и лист
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Настраиваем ширину колонок
    const maxWidth = 50;
    const wscols = Object.keys(headers).map(() => ({ wch: maxWidth }));
    ws['!cols'] = wscols;

    // Сохраняем файл
    XLSX.writeFile(wb, fileName);
};

// Импорт данных из Excel
export const importFromExcel = async (options: ImportOptions): Promise<any[]> => {
    const { file, headers, validators } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                // Берем первый лист
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Преобразуем в JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Преобразуем согласно заголовкам
                const importedData = jsonData.map((row: any, index) => {
                    const item: any = {};
                    let isValid = true;

                    // Инвертируем headers для поиска по русским названиям
                    const invertedHeaders = Object.entries(headers).reduce((acc, [key, label]) => {
                        acc[label] = key;
                        return acc;
                    }, {} as Record<string, string>);

                    Object.entries(row).forEach(([colName, value]) => {
                        const fieldKey = invertedHeaders[colName];
                        if (fieldKey) {
                            // Валидация если есть
                            if (validators && validators[fieldKey]) {
                                if (!validators[fieldKey](value)) {
                                    isValid = false;
                                }
                            }
                            item[fieldKey] = value;
                        }
                    });

                    if (!isValid) {
                        throw new Error(`Ошибка валидации в строке ${index + 2}`);
                    }

                    return item;
                });

                resolve(importedData);
            } catch (error: any) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error('Ошибка чтения файла'));
        };

        reader.readAsBinaryString(file);
    });
};

// Генерация шаблона для импорта
export const generateImportTemplate = (fileName: string, headers: Record<string, string>) => {
    // Создаем пустую строку с заголовками
    const templateData = [{}];
    Object.values(headers).forEach(header => {
        templateData[0][header] = '';
    });

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    // Настраиваем ширину колонок
    const wscols = Object.keys(headers).map(() => ({ wch: 20 }));
    ws['!cols'] = wscols;

    // Сохраняем файл
    XLSX.writeFile(wb, fileName);
};

// Вспомогательная функция для получения вложенных значений
function getValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return '';
        }
    }

    // Форматирование даты
    if (value instanceof Date) {
        return value.toLocaleDateString('ru-RU');
    }

    // Форматирование boolean
    if (typeof value === 'boolean') {
        return value ? 'Да' : 'Нет';
    }

    return value || '';
}

// Экспорт списка книг
export const exportBooksToExcel = (books: any[]) => {
    const headers = {
        code: 'Код',
        title: 'Наименование',
        'author.short_name': 'Автор',
        'publisher.name': 'Издательство',
        publication_year: 'Год издания',
        barcode: 'Штрих-код',
        isbn: 'ISBN',
        bbk: 'ББК',
        udk: 'УДК',
        class_range: 'Класс',
        location: 'Место размещения',
        is_available: 'Доступна',
    };

    exportToExcel({
        fileName: `Книги_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Книги',
        headers,
        data: books,
    });
};

// Экспорт списка читателей
export const exportReadersToExcel = (readers: any[]) => {
    const headers = {
        code: 'Код',
        barcode: 'Штрих-код',
        last_name: 'Фамилия',
        first_name: 'Имя',
        middle_name: 'Отчество',
        user_type: 'Тип',
        grade: 'Класс',
        gender: 'Пол',
        birth_date: 'Дата рождения',
        address: 'Адрес',
        phone: 'Телефон',
        email: 'Email',
        parent_mother_name: 'ФИО матери',
        parent_mother_phone: 'Телефон матери',
        parent_father_name: 'ФИО отца',
        parent_father_phone: 'Телефон отца',
        active_loans_count: 'Книг на руках',
    };

    exportToExcel({
        fileName: `Читатели_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Читатели',
        headers,
        data: readers,
    });
};

// Экспорт истории выдач
export const exportLoansToExcel = (loans: any[]) => {
    const headers = {
        'book.title': 'Книга',
        'book.barcode': 'Штрих-код книги',
        'reader.last_name': 'Фамилия читателя',
        'reader.first_name': 'Имя читателя',
        'reader.grade': 'Класс',
        issue_date: 'Дата выдачи',
        return_date: 'Дата возврата',
        days_on_loan: 'Дней на руках',
        status: 'Статус',
    };

    exportToExcel({
        fileName: `История_выдач_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'История выдач',
        headers,
        data: loans,
    });
};
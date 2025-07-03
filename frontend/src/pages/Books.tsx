import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Box,
    Paper,
    Button,
    TextField,
    IconButton,
    Tooltip,
    Typography,
    InputAdornment,
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Print,
    FileUpload,
    FileDownload,
    Search,
    QrCodeScanner,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { useRootStore } from '../stores/RootStore';
import BookDialog from '../components/Books/BookDialog';
import BarcodeScanner from '../components/Common/BarcodeScanner';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import ExportDialog from '../components/Common/ExportDialog';
import ImportDialog from '../components/Common/ImportDialog';
import BarcodePrintDialog from '../components/Common/BarcodePrintDialog';
import { exportBooksToExcel, importFromExcel } from '../utils/excelUtils';
import { Book } from '../stores/BookStore';

const Books: React.FC = observer(() => {
    const { bookStore, uiStore } = useRootStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openScanner, setOpenScanner] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
    const [openExport, setOpenExport] = useState(false);
    const [openImport, setOpenImport] = useState(false);
    const [openPrint, setOpenPrint] = useState(false);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    useEffect(() => {
        bookStore.loadBooks();
    }, []);

    const columns: GridColDef[] = [
        { field: 'code', headerName: 'Код', width: 100 },
        { field: 'title', headerName: 'Наименование', flex: 1 },
        {
            field: 'author',
            headerName: 'Автор',
            width: 200,
            valueGetter: (params) => params.row.author?.short_name || '-'
        },
        {
            field: 'publisher',
            headerName: 'Издательство',
            width: 200,
            valueGetter: (params) => params.row.publisher?.name || '-'
        },
        { field: 'publication_year', headerName: 'Год издания', width: 120 },
        { field: 'barcode', headerName: 'Штрих код', width: 150 },
        { field: 'isbn', headerName: 'ISBN', width: 150 },
        { field: 'bbk', headerName: 'ББК', width: 100 },
        { field: 'udk', headerName: 'УДК', width: 100 },
        {
            field: 'is_available',
            headerName: 'Доступна',
            width: 100,
            type: 'boolean',
        },
        {
            field: 'actions',
            headerName: 'Действия',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <>
                    <IconButton
                        size="small"
                        onClick={() => handleEdit(params.row)}
                        color="primary"
                    >
                        <Edit />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => handleDelete(params.row)}
                        color="error"
                    >
                        <Delete />
                    </IconButton>
                </>
            ),
        },
    ];

    const handleAdd = () => {
        setSelectedBook(null);
        setOpenDialog(true);
    };

    const handleEdit = (book: Book) => {
        setSelectedBook(book);
        setOpenDialog(true);
    };

    const handleDelete = (book: Book) => {
        setBookToDelete(book);
        setOpenConfirm(true);
    };

    const confirmDelete = async () => {
        if (bookToDelete) {
            await bookStore.deleteBook(bookToDelete.id);
            setOpenConfirm(false);
            setBookToDelete(null);
        }
    };

    const handleScanBarcode = (barcode: string) => {
        setSearchQuery(barcode);
        bookStore.searchBooks(barcode);
        setOpenScanner(false);
    };

    const handlePrintBarcodes = () => {
        const selectedBooks = bookStore.filteredBooks.filter(book =>
            selectedRows.includes(book.id)
        );

        if (selectedBooks.length === 0) {
            uiStore.showNotification('Выберите книги для печати штрих-кодов', 'warning');
            return;
        }

        setOpenPrint(true);
    };

    const handleImport = async (file: File) => {
        try {
            const data = await importFromExcel({
                file,
                headers: {
                    code: 'Код',
                    title: 'Наименование',
                    barcode: 'Штрих-код',
                    isbn: 'ISBN',
                    publication_year: 'Год издания',
                    class_range: 'Класс',
                    location: 'Место размещения',
                    bbk: 'ББК',
                    udk: 'УДК',
                }
            });

            let success = 0;
            let failed = 0;
            const errors: Array<{ row: number; error: string }> = [];

            for (const item of data) {
                try {
                    await bookStore.createBook(item);
                    success++;
                } catch (error: any) {
                    failed++;
                    errors.push({
                        row: data.indexOf(item) + 2,
                        error: error.message || 'Неизвестная ошибка'
                    });
                }
            }

            return { success, failed, errors };
        } catch (error: any) {
            throw new Error(error.message || 'Ошибка импорта');
        }
    };

    const handleExport = async (selectedFields: string[]) => {
        const exportData = bookStore.filteredBooks.map(book => {
            const filtered: Record<string, any> = {};
            selectedFields.forEach(field => {
                // Обработка вложенных полей
                if (field.includes('.')) {
                    const [parent, child] = field.split('.');
                    filtered[field] = (book as any)[parent]?.[child] || '';
                } else {
                    filtered[field] = (book as any)[field] || '';
                }
            });
            return filtered;
        });

        exportBooksToExcel(exportData);
        uiStore.showNotification('Экспорт завершен', 'success');
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Книги
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAdd}
                    >
                        Добавить
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={handlePrintBarcodes}
                        disabled={selectedRows.length === 0}
                    >
                        Печать штрих кода ({selectedRows.length})
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<FileUpload />}
                        onClick={() => setOpenImport(true)}
                    >
                        Импорт из Excel
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownload />}
                        onClick={() => setOpenExport(true)}
                    >
                        Экспорт в Excel
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Поиск по названию, автору, штрих-коду..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            bookStore.searchBooks(e.target.value);
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Сканировать штрих-код">
                                        <IconButton onClick={() => setOpenScanner(true)}>
                                            <QrCodeScanner />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                <DataGrid
                    rows={bookStore.filteredBooks}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    checkboxSelection
                    disableSelectionOnClick
                    autoHeight
                    loading={bookStore.isLoading}
                    onRowSelectionModelChange={(newSelection) => {
                        setSelectedRows(newSelection as number[]);
                    }}
                    components={{
                        Toolbar: GridToolbar,
                    }}
                    localeText={{
                        toolbarDensity: 'Размер',
                        toolbarDensityCompact: 'Компактный',
                        toolbarDensityStandard: 'Стандартный',
                        toolbarDensityComfortable: 'Удобный',
                        toolbarColumns: 'Столбцы',
                        toolbarFilters: 'Фильтры',
                        toolbarExport: 'Экспорт',
                        toolbarExportCSV: 'Скачать как CSV',
                        toolbarExportPrint: 'Печать',
                    }}
                />
            </Paper>

            <BookDialog
                open={openDialog}
                book={selectedBook}
                onClose={() => setOpenDialog(false)}
                onSave={async (bookData) => {
                    if (selectedBook) {
                        await bookStore.updateBook(selectedBook.id, bookData);
                    } else {
                        await bookStore.createBook(bookData);
                    }
                    setOpenDialog(false);
                }}
            />

            <BarcodeScanner
                open={openScanner}
                onClose={() => setOpenScanner(false)}
                onScan={handleScanBarcode}
                title="Сканирование штрих-кода книги"
            />

            <ConfirmDialog
                open={openConfirm}
                title="Удалить книгу?"
                message={`Вы уверены, что хотите удалить книгу "${bookToDelete?.title}"?`}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setOpenConfirm(false);
                    setBookToDelete(null);
                }}
            />

            <ExportDialog
                open={openExport}
                onClose={() => setOpenExport(false)}
                title="Экспорт книг в Excel"
                fields={[
                    { key: 'code', label: 'Код', selected: true },
                    { key: 'title', label: 'Наименование', selected: true },
                    { key: 'author.short_name', label: 'Автор', selected: true },
                    { key: 'publisher.name', label: 'Издательство', selected: true },
                    { key: 'publication_year', label: 'Год издания', selected: true },
                    { key: 'barcode', label: 'Штрих-код', selected: true },
                    { key: 'isbn', label: 'ISBN', selected: true },
                    { key: 'bbk', label: 'ББК', selected: false },
                    { key: 'udk', label: 'УДК', selected: false },
                    { key: 'class_range', label: 'Класс', selected: true },
                    { key: 'location', label: 'Место размещения', selected: true },
                    { key: 'is_available', label: 'Доступна', selected: true },
                ]}
                onExport={handleExport}
            />

            <ImportDialog
                open={openImport}
                onClose={() => setOpenImport(false)}
                title="Импорт книг из Excel"
                templateUrl="/templates/books_template.xlsx"
                onImport={handleImport}
            />

            <BarcodePrintDialog
                open={openPrint}
                onClose={() => setOpenPrint(false)}
                items={bookStore.filteredBooks
                    .filter(book => selectedRows.includes(book.id))
                    .map(book => ({
                        id: book.id,
                        title: book.title,
                        barcode: book.barcode,
                        author: book.author?.short_name
                    }))}
            />
        </Box>
    );
});

export default Books;
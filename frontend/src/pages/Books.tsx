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

const Books: React.FC = observer(() => {
    const { bookStore, uiStore } = useRootStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBook, setSelectedBook] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openScanner, setOpenScanner] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [bookToDelete, setBookToDelete] = useState(null);

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

    const handleEdit = (book: any) => {
        setSelectedBook(book);
        setOpenDialog(true);
    };

    const handleDelete = (book: any) => {
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
        // Implement barcode printing
        uiStore.showNotification('Печать штрих-кодов в разработке', 'info');
    };

    const handleImport = () => {
        // Implement Excel import
        uiStore.showNotification('Импорт из Excel в разработке', 'info');
    };

    const handleExport = () => {
        // Implement Excel export
        bookStore.exportToExcel();
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
                    >
                        Печать штрих кода
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<FileUpload />}
                        onClick={handleImport}
                    >
                        Импорт из Excel
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownload />}
                        onClick={handleExport}
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
            />

            <ConfirmDialog
                open={openConfirm}
                title="Удалить книгу?"
                message={`Вы уверены, что хотите удалить книгу "${bookToDelete?.title}"?`}
                onConfirm={confirmDelete}
                onCancel={() => setOpenConfirm(false)}
            />
        </Box>
    );
});

export default Books;
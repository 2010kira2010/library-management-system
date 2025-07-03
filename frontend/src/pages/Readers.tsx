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
    Chip,
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
    CreditCard,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { useRootStore } from '../stores/RootStore';
import BarcodeScanner from '../components/Common/BarcodeScanner';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import ReaderDialog from '../components/Readers/ReaderDialog';
import ExportDialog from '../components/Common/ExportDialog';
import ImportDialog from '../components/Common/ImportDialog';
import BarcodePrintDialog from '../components/Common/BarcodePrintDialog';
import { exportReadersToExcel, importFromExcel } from '../utils/excelUtils';
import { Reader } from '../stores/ReaderStore';

const Readers: React.FC = observer(() => {
    const { readerStore, uiStore } = useRootStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openScanner, setOpenScanner] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [readerToDelete, setReaderToDelete] = useState<Reader | null>(null);
    const [openExport, setOpenExport] = useState(false);
    const [openImport, setOpenImport] = useState(false);
    const [openPrint, setOpenPrint] = useState(false);
    const [openPrintCards, setOpenPrintCards] = useState(false);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    useEffect(() => {
        readerStore.loadReaders();
    }, []);

    const columns: GridColDef[] = [
        { field: 'code', headerName: 'Код', width: 100 },
        {
            field: 'fullName',
            headerName: 'ФИО',
            flex: 1,
            valueGetter: (params) =>
                `${params.row.last_name} ${params.row.first_name} ${params.row.middle_name || ''}`.trim()
        },
        { field: 'user_type', headerName: 'Тип', width: 120 },
        { field: 'grade', headerName: 'Класс', width: 80 },
        { field: 'barcode', headerName: 'Штрих-код', width: 150 },
        { field: 'phone', headerName: 'Телефон', width: 150 },
        { field: 'email', headerName: 'Email', width: 200 },
        {
            field: 'active_loans_count',
            headerName: 'Книг на руках',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value || 0}
                    color={params.value > 0 ? 'primary' : 'default'}
                    size="small"
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Действия',
            width: 150,
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
                        onClick={() => handlePrintCard(params.row)}
                        color="default"
                    >
                        <CreditCard />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => handleDelete(params.row)}
                        color="error"
                        disabled={params.row.active_loans_count > 0}
                    >
                        <Delete />
                    </IconButton>
                </>
            ),
        },
    ];

    const handleAdd = () => {
        setSelectedReader(null);
        setOpenDialog(true);
    };

    const handleEdit = (reader: Reader) => {
        setSelectedReader(reader);
        setOpenDialog(true);
    };

    const handleDelete = (reader: Reader) => {
        setReaderToDelete(reader);
        setOpenConfirm(true);
    };

    const confirmDelete = async () => {
        if (readerToDelete) {
            await readerStore.deleteReader(readerToDelete.id);
            setOpenConfirm(false);
            setReaderToDelete(null);
        }
    };

    const handlePrintCard = (reader: Reader) => {
        setSelectedRows([reader.id]);
        setOpenPrintCards(true);
    };

    const handlePrintBarcodes = () => {
        const selectedReaders = readerStore.filteredReaders.filter(reader =>
            selectedRows.includes(reader.id)
        );

        if (selectedReaders.length === 0) {
            uiStore.showNotification('Выберите читателей для печати штрих-кодов', 'warning');
            return;
        }

        setOpenPrint(true);
    };

    const handlePrintCards = () => {
        const selectedReaders = readerStore.filteredReaders.filter(reader =>
            selectedRows.includes(reader.id)
        );

        if (selectedReaders.length === 0) {
            uiStore.showNotification('Выберите читателей для печати билетов', 'warning');
            return;
        }

        setOpenPrintCards(true);
    };

    const handleImport = async (file: File) => {
        try {
            const data = await importFromExcel({
                file,
                headers: {
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
                }
            });

            let success = 0;
            let failed = 0;
            const errors: Array<{ row: number; error: string }> = [];

            for (const item of data) {
                try {
                    await readerStore.createReader(item);
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
        const exportData = readerStore.filteredReaders.map(reader => {
            const filtered: Record<string, any> = {};
            selectedFields.forEach(field => {
                filtered[field] = (reader as any)[field] || '';
            });
            return filtered;
        });

        exportReadersToExcel(exportData);
        uiStore.showNotification('Экспорт завершен', 'success');
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        readerStore.searchReaders(query);
    };

    const handleScanBarcode = (barcode: string) => {
        handleSearch(barcode);
        setOpenScanner(false);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Абоненты
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
                        startIcon={<CreditCard />}
                        onClick={handlePrintCards}
                        disabled={selectedRows.length === 0}
                    >
                        Печать читательских билетов ({selectedRows.length})
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
                        placeholder="Поиск по ФИО, штрих-коду, телефону..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
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
                    rows={readerStore.filteredReaders}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    checkboxSelection
                    disableRowSelectionOnClick
                    autoHeight
                    loading={readerStore.isLoading}
                    onRowSelectionModelChange={(newSelection) => {
                        setSelectedRows(newSelection as number[]);
                    }}
                    slots={{
                        toolbar: GridToolbar,
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

            <ReaderDialog
                open={openDialog}
                reader={selectedReader}
                onClose={() => setOpenDialog(false)}
                onSave={async (readerData) => {
                    if (selectedReader) {
                        await readerStore.updateReader(selectedReader.id, readerData);
                    } else {
                        await readerStore.createReader(readerData);
                    }
                    setOpenDialog(false);
                }}
            />

            <BarcodeScanner
                open={openScanner}
                onClose={() => setOpenScanner(false)}
                onScan={handleScanBarcode}
                title="Сканирование штрих-кода читателя"
            />

            <ConfirmDialog
                open={openConfirm}
                title="Удалить читателя?"
                message={`Вы уверены, что хотите удалить читателя "${readerToDelete?.last_name} ${readerToDelete?.first_name}"?`}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setOpenConfirm(false);
                    setReaderToDelete(null);
                }}
            />

            <ExportDialog
                open={openExport}
                onClose={() => setOpenExport(false)}
                title="Экспорт читателей в Excel"
                fields={[
                    { key: 'code', label: 'Код', selected: true },
                    { key: 'barcode', label: 'Штрих-код', selected: true },
                    { key: 'last_name', label: 'Фамилия', selected: true },
                    { key: 'first_name', label: 'Имя', selected: true },
                    { key: 'middle_name', label: 'Отчество', selected: true },
                    { key: 'user_type', label: 'Тип', selected: true },
                    { key: 'grade', label: 'Класс', selected: true },
                    { key: 'gender', label: 'Пол', selected: false },
                    { key: 'birth_date', label: 'Дата рождения', selected: false },
                    { key: 'address', label: 'Адрес', selected: false },
                    { key: 'phone', label: 'Телефон', selected: true },
                    { key: 'email', label: 'Email', selected: true },
                    { key: 'parent_mother_name', label: 'ФИО матери', selected: false },
                    { key: 'parent_mother_phone', label: 'Телефон матери', selected: false },
                    { key: 'parent_father_name', label: 'ФИО отца', selected: false },
                    { key: 'parent_father_phone', label: 'Телефон отца', selected: false },
                    { key: 'active_loans_count', label: 'Книг на руках', selected: true },
                ]}
                onExport={handleExport}
            />

            <ImportDialog
                open={openImport}
                onClose={() => setOpenImport(false)}
                title="Импорт читателей из Excel"
                templateUrl="/templates/readers_template.xlsx"
                onImport={handleImport}
            />

            <BarcodePrintDialog
                open={openPrint}
                onClose={() => setOpenPrint(false)}
                items={readerStore.filteredReaders
                    .filter(reader => selectedRows.includes(reader.id))
                    .map(reader => ({
                        id: reader.id,
                        title: `${reader.last_name} ${reader.first_name}`,
                        barcode: reader.barcode,
                        author: `Класс: ${reader.grade || '-'}`
                    }))}
            />

            {/* Диалог печати читательских билетов */}
            <BarcodePrintDialog
                open={openPrintCards}
                onClose={() => setOpenPrintCards(false)}
                items={readerStore.filteredReaders
                    .filter(reader => selectedRows.includes(reader.id))
                    .map(reader => ({
                        id: reader.id,
                        title: `Читательский билет`,
                        barcode: reader.barcode,
                        author: `${reader.last_name} ${reader.first_name} ${reader.middle_name || ''}\nКласс: ${reader.grade || '-'}`
                    }))}
            />
        </Box>
    );
});

export default Readers;
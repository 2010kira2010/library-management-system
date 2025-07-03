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
import { exportReadersToExcel } from '../utils/excelUtils';
import ImportDialog from '../components/Common/ImportDialog';
import { importFromExcel } from '../utils/excelUtils';

const Readers: React.FC = observer(() => {
    const { readerStore, uiStore } = useRootStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReader, setSelectedReader] = useState<any>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openScanner, setOpenScanner] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [readerToDelete, setReaderToDelete] = useState<any>(null);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);

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
                `${params.row.last_name} ${params.row.first_name} ${params.row.middle_name}`.trim()
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
                    label={params.value}
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

    const handleEdit = (reader: any) => {
        setSelectedReader(reader);
        setOpenDialog(true);
    };

    const handleDelete = (reader: any) => {
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

    const handlePrintCard = (reader: any) => {
        readerStore.printReaderCard(reader.id);
    };

    const handlePrintBarcodes = () => {
        uiStore.showNotification('Печать штрих-кодов в разработке', 'info');
    };

    const handleImport = async (file: File) => {
        const data = await importFromExcel({
            file,
            headers: {
                code: 'Код',
                title: 'Название',
                // ... маппинг полей
            }
        });

        // Обработка импортированных данных
        let success = 0;
        let failed = 0;
        const errors = [];

        for (const item of data) {
            try {
                await readerStore.createReader(item);
                success++;
            } catch (error) {
                failed++;
                errors.push({ row: data.indexOf(item) + 2, error: error.message });
            }
        }

        return { success, failed, errors };
    };

    const handleExport = async (selectedFields: string[]) => {
        // Фильтруем данные по выбранным полям
        const exportData = readerStore.readers.map(reader => {
            const filtered: any = {};
            selectedFields.forEach(field => {
                filtered[field] = reader[field];
            });
            return filtered;
        });

        exportReadersToExcel(exportData);
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
                    >
                        Печать штрих кода
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<CreditCard />}
                    >
                        Печать читательских билетов
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<FileUpload />}
                        onClick={handleImport}
                    >
                        Импорт из Excel
                    </Button>
                    <ImportDialog
                        open={importDialogOpen}
                        onClose={() => setImportDialogOpen(false)}
                        title="Импорт читателей"
                        templateUrl="/templates/readers_template.xlsx"
                        onImport={handleImport}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<FileDownload />}
                        onClick={handleExport}
                    >
                        Экспорт в Excel
                    </Button>
                    <ExportDialog
                        open={exportDialogOpen}
                        onClose={() => setExportDialogOpen(false)}
                        title="Экспорт читателей"
                        fields={[
                            { key: 'code', label: 'Код', selected: true },
                            { key: 'title', label: 'Название', selected: true },
                            { key: 'author', label: 'Автор', selected: true },
                            // ... другие поля
                        ]}
                        onExport={handleExport}
                    />
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
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10, page: 0 },
                        },
                    }}
                    pageSizeOptions={[10, 25, 50]}
                    checkboxSelection
                    disableRowSelectionOnClick
                    autoHeight
                    loading={readerStore.isLoading}
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
        </Box>
    );
});

export default Readers;
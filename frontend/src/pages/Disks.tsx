import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Chip,
    TextField,
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
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useRootStore } from '../stores/RootStore';
import DiskDialog from '../components/Disks/DiskDialog';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import ExportDialog from '../components/Common/ExportDialog';
import ImportDialog from '../components/Common/ImportDialog';
import BarcodePrintDialog from '../components/Common/BarcodePrintDialog';
import { exportToExcel, importFromExcel } from '../utils/excelUtils';
import { Disk } from '../stores/DiskStore';

const Disks: React.FC = observer(() => {
    const { diskStore, uiStore } = useRootStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDisk, setSelectedDisk] = useState<Disk | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [diskToDelete, setDiskToDelete] = useState<Disk | null>(null);
    const [openExport, setOpenExport] = useState(false);
    const [openImport, setOpenImport] = useState(false);
    const [openPrint, setOpenPrint] = useState(false);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    useEffect(() => {
        diskStore.loadDisks();
    }, []);

    const handleAdd = () => {
        setSelectedDisk(null);
        setOpenDialog(true);
    };

    const handleEdit = (disk: Disk) => {
        setSelectedDisk(disk);
        setOpenDialog(true);
    };

    const handleDelete = (disk: Disk) => {
        setDiskToDelete(disk);
        setOpenConfirm(true);
    };

    const confirmDelete = async () => {
        if (diskToDelete) {
            await diskStore.deleteDisk(diskToDelete.id);
            setOpenConfirm(false);
            setDiskToDelete(null);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        diskStore.searchDisks(query);
    };

    const handlePrintBarcodes = () => {
        const selectedDisks = diskStore.filteredDisks.filter(disk =>
            selectedRows.includes(disk.id)
        );

        if (selectedDisks.length === 0) {
            uiStore.showNotification('Выберите диски для печати штрих-кодов', 'warning');
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
                    short_title: 'Краткое наименование',
                    subject: 'Предмет',
                    resource_type: 'Тип ЭОР',
                    barcode: 'Штрих-код',
                    comments: 'Комментарии',
                }
            });

            let success = 0;
            let failed = 0;
            const errors: Array<{ row: number; error: string }> = [];

            for (const item of data) {
                try {
                    await diskStore.createDisk(item);
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
        const exportData = diskStore.filteredDisks.map(disk => {
            const filtered: Record<string, any> = {};
            selectedFields.forEach(field => {
                if (field.includes('.')) {
                    const [parent, child] = field.split('.');
                    filtered[field] = (disk as any)[parent]?.[child] || '';
                } else {
                    filtered[field] = (disk as any)[field] || '';
                }
            });
            return filtered;
        });

        exportToExcel({
            fileName: `Диски_${new Date().toISOString().split('T')[0]}.xlsx`,
            sheetName: 'Диски',
            headers: {
                code: 'Код',
                title: 'Наименование',
                subject: 'Предмет',
                resource_type: 'Тип ЭОР',
                barcode: 'Штрих-код',
                'publisher.name': 'Издательство',
                is_available: 'Доступен',
                comments: 'Комментарии',
            },
            data: exportData,
        });

        uiStore.showNotification('Экспорт завершен', 'success');
    };

    const columns: GridColDef[] = [
        { field: 'code', headerName: 'Код', width: 100 },
        { field: 'title', headerName: 'Наименование', flex: 1 },
        { field: 'subject', headerName: 'Предмет', width: 150 },
        { field: 'resource_type', headerName: 'ЭОР', width: 200 },
        {
            field: 'publisher',
            headerName: 'Издательство',
            width: 150,
            valueGetter: (params) => params.row.publisher?.name || '-'
        },
        { field: 'barcode', headerName: 'Штрих код', width: 150 },
        {
            field: 'is_available',
            headerName: 'Доступен',
            width: 100,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Да' : 'Нет'}
                    color={params.value ? 'success' : 'error'}
                    size="small"
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Действия',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <>
                    <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)}>
                        <Edit />
                    </IconButton>
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(params.row)}
                        disabled={!params.row.is_available}
                    >
                        <Delete />
                    </IconButton>
                </>
            ),
        },
    ];

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Диски
            </Typography>

            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
                        Создать
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

                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Поиск по названию, предмету, типу..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                <DataGrid
                    rows={diskStore.filteredDisks}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    checkboxSelection
                    autoHeight
                    loading={diskStore.isLoading}
                    onRowSelectionModelChange={(newSelection) => {
                        setSelectedRows(newSelection as number[]);
                    }}
                />
            </Paper>

            <DiskDialog
                open={openDialog}
                disk={selectedDisk}
                onClose={() => setOpenDialog(false)}
                onSave={async (diskData) => {
                    if (selectedDisk) {
                        await diskStore.updateDisk(selectedDisk.id, diskData);
                    } else {
                        await diskStore.createDisk(diskData);
                    }
                    setOpenDialog(false);
                }}
            />

            <ConfirmDialog
                open={openConfirm}
                title="Удалить диск?"
                message={`Вы уверены, что хотите удалить диск "${diskToDelete?.title}"?`}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setOpenConfirm(false);
                    setDiskToDelete(null);
                }}
            />

            <ExportDialog
                open={openExport}
                onClose={() => setOpenExport(false)}
                title="Экспорт дисков в Excel"
                fields={[
                    { key: 'code', label: 'Код', selected: true },
                    { key: 'title', label: 'Наименование', selected: true },
                    { key: 'short_title', label: 'Краткое наименование', selected: false },
                    { key: 'subject', label: 'Предмет', selected: true },
                    { key: 'resource_type', label: 'Тип ЭОР', selected: true },
                    { key: 'publisher.name', label: 'Издательство', selected: true },
                    { key: 'barcode', label: 'Штрих-код', selected: true },
                    { key: 'is_available', label: 'Доступен', selected: true },
                    { key: 'comments', label: 'Комментарии', selected: false },
                ]}
                onExport={handleExport}
            />

            <ImportDialog
                open={openImport}
                onClose={() => setOpenImport(false)}
                title="Импорт дисков из Excel"
                templateUrl="/templates/disks_template.xlsx"
                onImport={handleImport}
            />

            <BarcodePrintDialog
                open={openPrint}
                onClose={() => setOpenPrint(false)}
                items={diskStore.filteredDisks
                    .filter(disk => selectedRows.includes(disk.id))
                    .map(disk => ({
                        id: disk.id,
                        title: disk.title,
                        barcode: disk.barcode,
                        author: `${disk.subject} - ${disk.resource_type}`
                    }))}
            />
        </Box>
    );
});

export default Disks;
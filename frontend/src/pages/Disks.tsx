import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Chip,
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Print,
    FileUpload,
    FileDownload,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useRootStore } from '../stores/RootStore';
import DiskDialog from '../components/Disks/DiskDialog';
import ConfirmDialog from '../components/Common/ConfirmDialog';

const Disks: React.FC = observer(() => {
    const { diskStore } = useRootStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDisk, setSelectedDisk] = useState<any>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [diskToDelete, setDiskToDelete] = useState<any>(null);

    useEffect(() => {
        diskStore.loadDisks();
    }, []);

    const handleAdd = () => {
        setSelectedDisk(null);
        setOpenDialog(true);
    };

    const handleEdit = (disk: any) => {
        setSelectedDisk(disk);
        setOpenDialog(true);
    };

    const handleDelete = (disk: any) => {
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

    const columns: GridColDef[] = [
        { field: 'code', headerName: 'Код', width: 100 },
        { field: 'title', headerName: 'Наименование', flex: 1 },
        { field: 'subject', headerName: 'Предмет', width: 150 },
        { field: 'resource_type', headerName: 'ЭОР', width: 200 },
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
                    <Button variant="outlined" startIcon={<Print />}>
                        Печать штрих кода
                    </Button>
                    <Button variant="outlined" startIcon={<FileUpload />}>
                        Импорт из Excel
                    </Button>
                    <Button variant="outlined" startIcon={<FileDownload />}>
                        Экспорт в Excel
                    </Button>
                </Box>

                <DataGrid
                    rows={diskStore.filteredDisks}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10, page: 0 },
                        },
                    }}
                    pageSizeOptions={[10, 25, 50]}
                    autoHeight
                    loading={diskStore.isLoading}
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
                message={`Вы уверены, что хотите удалить диск "${diskToDelete?.name}"?`}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setOpenConfirm(false);
                    setDiskToDelete(null);
                }}
            />
        </Box>
    );
});

export default Disks;
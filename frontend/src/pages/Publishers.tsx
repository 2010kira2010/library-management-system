import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    FileUpload,
    FileDownload,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useRootStore } from '../stores/RootStore';
import PublisherDialog from '../components/Publishers/PublisherDialog';
import ConfirmDialog from '../components/Common/ConfirmDialog';

const Publishers: React.FC = observer(() => {
    const { publisherStore } = useRootStore();
    const [selectedPublisher, setSelectedPublisher] = useState<any>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [publisherToDelete, setPublisherToDelete] = useState<any>(null);

    useEffect(() => {
        publisherStore.loadPublishers();
    }, []);

    const handleAdd = () => {
        setSelectedPublisher(null);
        setOpenDialog(true);
    };

    const handleEdit = (publisher: any) => {
        setSelectedPublisher(publisher);
        setOpenDialog(true);
    };

    const handleDelete = (publisher: any) => {
        setPublisherToDelete(publisher);
        setOpenConfirm(true);
    };

    const confirmDelete = async () => {
        if (publisherToDelete) {
            await publisherStore.deletePublisher(publisherToDelete.id);
            setOpenConfirm(false);
            setPublisherToDelete(null);
        }
    };

    const columns: GridColDef[] = [
        { field: 'code', headerName: 'Код', width: 100 },
        { field: 'name', headerName: 'Наименование', flex: 1 },
        { field: 'book_count', headerName: 'Количество книг', width: 150 },
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
                        disabled={params.row.book_count > 0}
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
                Издательства
            </Typography>

            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
                        Создать
                    </Button>
                    <Button variant="outlined" startIcon={<FileUpload />}>
                        Импорт из Excel
                    </Button>
                    <Button variant="outlined" startIcon={<FileDownload />}>
                        Экспорт в Excel
                    </Button>
                </Box>

                <DataGrid
                    rows={publisherStore.publishers}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10, page: 0 },
                        },
                    }}
                    pageSizeOptions={[10, 25, 50]}
                    autoHeight
                    loading={publisherStore.isLoading}
                />
            </Paper>

            <PublisherDialog
                open={openDialog}
                publisher={selectedPublisher}
                onClose={() => setOpenDialog(false)}
                onSave={async (publisherData) => {
                    if (selectedPublisher) {
                        await publisherStore.updatePublisher(selectedPublisher.id, publisherData);
                    } else {
                        await publisherStore.createPublisher(publisherData);
                    }
                    setOpenDialog(false);
                }}
            />

            <ConfirmDialog
                open={openConfirm}
                title="Удалить издательство?"
                message={`Вы уверены, что хотите удалить издательство "${publisherToDelete?.name}"?`}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setOpenConfirm(false);
                    setPublisherToDelete(null);
                }}
            />
        </Box>
    );
});

export default Publishers;
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
import AuthorDialog from '../components/Authors/AuthorDialog';
import ConfirmDialog from '../components/Common/ConfirmDialog';

const Authors: React.FC = observer(() => {
    const { authorStore } = useRootStore();
    const [selectedAuthor, setSelectedAuthor] = useState<any>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [authorToDelete, setAuthorToDelete] = useState<any>(null);

    useEffect(() => {
        authorStore.loadAuthors();
    }, []);

    const handleAdd = () => {
        setSelectedAuthor(null);
        setOpenDialog(true);
    };

    const handleEdit = (author: any) => {
        setSelectedAuthor(author);
        setOpenDialog(true);
    };

    const handleDelete = (author: any) => {
        setAuthorToDelete(author);
        setOpenConfirm(true);
    };

    const confirmDelete = async () => {
        if (authorToDelete) {
            await authorStore.deleteAuthor(authorToDelete.id);
            setOpenConfirm(false);
            setAuthorToDelete(null);
        }
    };

    const columns: GridColDef[] = [
        { field: 'code', headerName: 'Код', width: 100 },
        { field: 'short_name', headerName: 'Краткое имя', width: 200 },
        { field: 'last_name', headerName: 'Фамилия', width: 150 },
        { field: 'first_name', headerName: 'Имя', width: 150 },
        { field: 'middle_name', headerName: 'Отчество', width: 150 },
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
                Авторы
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
                    rows={authorStore.authors}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10, page: 0 },
                        },
                    }}
                    pageSizeOptions={[10, 25, 50]}
                    autoHeight
                    loading={authorStore.isLoading}
                />
            </Paper>

            <AuthorDialog
                open={openDialog}
                author={selectedAuthor}
                onClose={() => setOpenDialog(false)}
                onSave={async (authorData) => {
                    if (selectedAuthor) {
                        await authorStore.updateAuthor(selectedAuthor.id, authorData);
                    } else {
                        await authorStore.createAuthor(authorData);
                    }
                    setOpenDialog(false);
                }}
            />

            <ConfirmDialog
                open={openConfirm}
                title="Удалить автора?"
                message={`Вы уверены, что хотите удалить автора "${authorToDelete?.short_name}"?`}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setOpenConfirm(false);
                    setAuthorToDelete(null);
                }}
            />
        </Box>
    );
});

export default Authors;
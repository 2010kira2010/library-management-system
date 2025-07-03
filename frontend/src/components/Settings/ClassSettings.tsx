import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Box,
    Button,
    Typography,
    TextField,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Alert,
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Save,
    Cancel,
} from '@mui/icons-material';
import { useRootStore } from '../../stores/RootStore';

interface ClassItem {
    id: number;
    name: string;
    description?: string;
    students_count?: number;
    is_active: boolean;
}

const ClassSettings: React.FC = observer(() => {
    const { apiClient, uiStore } = useRootStore();
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            uiStore.setLoading(true);
            const response = await apiClient.get('/api/settings/classes');
            setClasses(response.data || []);
        } catch (error: any) {
            uiStore.showNotification('Ошибка загрузки классов', 'error');
        } finally {
            uiStore.setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingClass(null);
        setFormData({ name: '', description: '' });
        setErrors({});
        setDialogOpen(true);
    };

    const handleEdit = (classItem: ClassItem) => {
        setEditingClass(classItem);
        setFormData({
            name: classItem.name,
            description: classItem.description || '',
        });
        setErrors({});
        setDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Вы уверены, что хотите удалить этот класс?')) {
            return;
        }

        try {
            await apiClient.delete(`/api/settings/classes/${id}`);
            uiStore.showNotification('Класс успешно удален', 'success');
            loadClasses();
        } catch (error: any) {
            uiStore.showNotification(error.response?.data?.error || 'Ошибка удаления класса', 'error');
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Название класса обязательно';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        try {
            uiStore.setLoading(true);
            if (editingClass) {
                await apiClient.put(`/api/settings/classes/${editingClass.id}`, formData);
                uiStore.showNotification('Класс успешно обновлен', 'success');
            } else {
                await apiClient.post('/api/settings/classes', formData);
                uiStore.showNotification('Класс успешно добавлен', 'success');
            }
            setDialogOpen(false);
            loadClasses();
        } catch (error: any) {
            uiStore.showNotification(error.response?.data?.error || 'Ошибка сохранения класса', 'error');
        } finally {
            uiStore.setLoading(false);
        }
    };

    const toggleActive = async (classItem: ClassItem) => {
        try {
            await apiClient.patch(`/api/settings/classes/${classItem.id}/toggle-active`);
            uiStore.showNotification(
                classItem.is_active ? 'Класс деактивирован' : 'Класс активирован',
                'success'
            );
            loadClasses();
        } catch (error: any) {
            uiStore.showNotification('Ошибка изменения статуса класса', 'error');
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Управление классами</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAdd}
                >
                    Добавить класс
                </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
                Здесь вы можете настроить список классов для учебного заведения.
                Классы используются для группировки учащихся.
            </Alert>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Название</TableCell>
                            <TableCell>Описание</TableCell>
                            <TableCell align="center">Учеников</TableCell>
                            <TableCell align="center">Статус</TableCell>
                            <TableCell align="right">Действия</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {classes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        Классы не найдены
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            classes.map((classItem) => (
                                <TableRow key={classItem.id}>
                                    <TableCell>
                                        <Typography variant="subtitle2">
                                            {classItem.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {classItem.description || '—'}
                                    </TableCell>
                                    <TableCell align="center">
                                        {classItem.students_count || 0}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={classItem.is_active ? 'Активен' : 'Неактивен'}
                                            color={classItem.is_active ? 'success' : 'default'}
                                            size="small"
                                            onClick={() => toggleActive(classItem)}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEdit(classItem)}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(classItem.id)}
                                            disabled={classItem.students_count && classItem.students_count > 0}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingClass ? 'Редактировать класс' : 'Добавить класс'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="Название класса"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            error={!!errors.name}
                            helperText={errors.name}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Описание"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            multiline
                            rows={3}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} startIcon={<Cancel />}>
                        Отмена
                    </Button>
                    <Button onClick={handleSave} variant="contained" startIcon={<Save />}>
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
});

export default ClassSettings;
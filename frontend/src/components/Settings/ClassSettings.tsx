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
    CircularProgress,
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Save,
    Cancel,
} from '@mui/icons-material';
import { useRootStore } from '../../stores/RootStore';
import { Class } from '../../stores/SettingsStore';

const ClassSettings: React.FC = observer(() => {
    const { settingsStore } = useRootStore();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<Class | null>(null);
    const [formData, setFormData] = useState({
        grade: '',
        letter: '',
        teacher_name: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        setLoading(true);
        await settingsStore.loadClasses();
        setLoading(false);
    };

    const handleAdd = () => {
        setEditingClass(null);
        setFormData({ grade: '', letter: '', teacher_name: '' });
        setErrors({});
        setDialogOpen(true);
    };

    const handleEdit = (classItem: Class) => {
        setEditingClass(classItem);
        setFormData({
            grade: classItem.grade.toString(),
            letter: classItem.letter,
            teacher_name: classItem.teacher_name || '',
        });
        setErrors({});
        setDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Вы уверены, что хотите удалить этот класс?')) {
            return;
        }

        await settingsStore.deleteClass(id);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.grade) {
            newErrors.grade = 'Класс обязателен';
        } else if (parseInt(formData.grade) < 1 || parseInt(formData.grade) > 11) {
            newErrors.grade = 'Класс должен быть от 1 до 11';
        }

        if (!formData.letter.trim()) {
            newErrors.letter = 'Литера обязательна';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        const classData = {
            grade: parseInt(formData.grade),
            letter: formData.letter.trim(),
            teacher_name: formData.teacher_name.trim(),
        };

        const success = editingClass
            ? await settingsStore.updateClass(editingClass.id, classData)
            : await settingsStore.createClass(classData);

        if (success) {
            setDialogOpen(false);
        }
    };

    const toggleActive = async (classItem: Class) => {
        await settingsStore.toggleClassActive(classItem.id);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

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
                            <TableCell>Класс</TableCell>
                            <TableCell>Литера</TableCell>
                            <TableCell>Классный руководитель</TableCell>
                            <TableCell align="center">Учеников</TableCell>
                            <TableCell align="center">Статус</TableCell>
                            <TableCell align="right">Действия</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {settingsStore.classes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        Классы не найдены
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            settingsStore.classes.map((classItem) => (
                                <TableRow key={classItem.id}>
                                    <TableCell>
                                        <Typography variant="subtitle2">
                                            {classItem.grade}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        "{classItem.letter}"
                                    </TableCell>
                                    <TableCell>
                                        {classItem.teacher_name || '—'}
                                    </TableCell>
                                    <TableCell align="center">
                                        {classItem.students_count || 0}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={classItem.is_active !== false ? 'Активен' : 'Неактивен'}
                                            color={classItem.is_active !== false ? 'success' : 'default'}
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
                                            disabled={!!classItem.students_count && classItem.students_count > 0}
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
                            type="number"
                            label="Класс"
                            value={formData.grade}
                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                            error={!!errors.grade}
                            helperText={errors.grade}
                            sx={{ mb: 2 }}
                            inputProps={{ min: 1, max: 11 }}
                        />
                        <TextField
                            fullWidth
                            label="Литера"
                            value={formData.letter}
                            onChange={(e) => setFormData({ ...formData, letter: e.target.value.toUpperCase() })}
                            error={!!errors.letter}
                            helperText={errors.letter || 'Например: А, Б, В'}
                            sx={{ mb: 2 }}
                            inputProps={{ maxLength: 1 }}
                        />
                        <TextField
                            fullWidth
                            label="Классный руководитель"
                            value={formData.teacher_name}
                            onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                            helperText="ФИО классного руководителя"
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
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    MenuItem,
    Box,
    Typography,
    IconButton,
} from '@mui/material';
import { Close, AddPhotoAlternate } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '../../stores/RootStore';

interface DiskDialogProps {
    open: boolean;
    disk: any | null;
    onClose: () => void;
    onSave: (diskData: any) => Promise<void>;
}

const DiskDialog: React.FC<DiskDialogProps> = observer(({
                                                            open,
                                                            disk,
                                                            onClose,
                                                            onSave,
                                                        }) => {
    const { publisherStore, diskStore } = useRootStore();
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        short_title: '',
        publisher_id: '',
        subject: '',
        resource_type: '',
        barcode: '',
        comments: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (open) {
            publisherStore.loadPublishers();

            if (disk) {
                setFormData({
                    code: disk.code || '',
                    title: disk.title || '',
                    short_title: disk.short_title || '',
                    publisher_id: disk.publisher_id || '',
                    subject: disk.subject || '',
                    resource_type: disk.resource_type || '',
                    barcode: disk.barcode || '',
                    comments: disk.comments || '',
                });
            } else {
                setFormData({
                    code: '',
                    title: '',
                    short_title: '',
                    publisher_id: '',
                    subject: '',
                    resource_type: '',
                    barcode: '',
                    comments: '',
                });
            }
            setErrors({});
        }
    }, [open, disk]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        if (errors[field]) {
            setErrors((prev: any) => ({
                ...prev,
                [field]: '',
            }));
        }
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Название диска обязательно';
        }

        if (!formData.barcode.trim()) {
            newErrors.barcode = 'Штрих-код обязателен';
        }

        if (!formData.subject) {
            newErrors.subject = 'Выберите предмет';
        }

        if (!formData.resource_type) {
            newErrors.resource_type = 'Выберите тип ЭОР';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const dataToSave = {
                ...formData,
                publisher_id: formData.publisher_id || null,
            };

            await onSave(dataToSave);
            onClose();
        } catch (error) {
            console.error('Error saving disk:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={() => !loading && onClose()}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        {disk ? 'Редактировать диск' : 'Добавить диск'}
                    </Typography>
                    <IconButton onClick={onClose} disabled={loading}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Код"
                            value={formData.code}
                            onChange={(e) => handleChange('code', e.target.value)}
                            helperText="Оставьте пустым для автогенерации"
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Штрих-код"
                            value={formData.barcode}
                            onChange={(e) => handleChange('barcode', e.target.value)}
                            required
                            error={!!errors.barcode}
                            helperText={errors.barcode}
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Полное наименование"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            required
                            error={!!errors.title}
                            helperText={errors.title}
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Краткое наименование"
                            value={formData.short_title}
                            onChange={(e) => handleChange('short_title', e.target.value)}
                            helperText="Используется в отчетах"
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            select
                            label="Издательство"
                            value={formData.publisher_id}
                            onChange={(e) => handleChange('publisher_id', e.target.value)}
                            disabled={loading}
                        >
                            <MenuItem value="">
                                <em>Не указано</em>
                            </MenuItem>
                            {publisherStore.publishers.map((publisher) => (
                                <MenuItem key={publisher.id} value={publisher.id}>
                                    {publisher.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            select
                            label="Предмет"
                            value={formData.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                            required
                            error={!!errors.subject}
                            helperText={errors.subject}
                            disabled={loading}
                        >
                            <MenuItem value="">
                                <em>Выберите предмет</em>
                            </MenuItem>
                            {diskStore.subjects.map((subject) => (
                                <MenuItem key={subject} value={subject}>
                                    {subject}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            select
                            label="ЭОР (тип ресурса)"
                            value={formData.resource_type}
                            onChange={(e) => handleChange('resource_type', e.target.value)}
                            required
                            error={!!errors.resource_type}
                            helperText={errors.resource_type || 'Электронный образовательный ресурс'}
                            disabled={loading}
                        >
                            <MenuItem value="">
                                <em>Выберите тип</em>
                            </MenuItem>
                            {diskStore.resourceTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Комментарии"
                            value={formData.comments}
                            onChange={(e) => handleChange('comments', e.target.value)}
                            disabled={loading}
                            helperText="Дополнительная информация о диске"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button
                                variant="outlined"
                                startIcon={<AddPhotoAlternate />}
                                disabled={loading}
                            >
                                Загрузить скриншот
                            </Button>
                            <Typography variant="body2" color="text.secondary">
                                Скриншот будет отображаться в карточке диска
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Отмена
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !formData.title || !formData.barcode || !formData.subject || !formData.resource_type}
                >
                    {loading ? 'Сохранение...' : (disk ? 'Сохранить' : 'Добавить')}
                </Button>
            </DialogActions>
        </Dialog>
    );
});

export default DiskDialog;
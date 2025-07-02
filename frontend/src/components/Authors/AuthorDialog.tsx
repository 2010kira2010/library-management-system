import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Box,
    Typography,
    IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';

interface AuthorDialogProps {
    open: boolean;
    author: any | null;
    onClose: () => void;
    onSave: (authorData: any) => Promise<void>;
}

const AuthorDialog: React.FC<AuthorDialogProps> = ({
                                                       open,
                                                       author,
                                                       onClose,
                                                       onSave,
                                                   }) => {
    const [formData, setFormData] = useState({
        code: '',
        last_name: '',
        first_name: '',
        middle_name: '',
        short_name: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (open) {
            if (author) {
                setFormData({
                    code: author.code || '',
                    last_name: author.last_name || '',
                    first_name: author.first_name || '',
                    middle_name: author.middle_name || '',
                    short_name: author.short_name || '',
                });
            } else {
                setFormData({
                    code: '',
                    last_name: '',
                    first_name: '',
                    middle_name: '',
                    short_name: '',
                });
            }
            setErrors({});
        }
    }, [open, author]);

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Автоматически формируем краткое имя
        if (field === 'last_name' || field === 'first_name' || field === 'middle_name') {
            const newData = { ...formData, [field]: value };
            const shortName = generateShortName(newData);
            setFormData((prev) => ({
                ...prev,
                [field]: value,
                short_name: shortName,
            }));
        }

        if (errors[field]) {
            setErrors((prev: any) => ({
                ...prev,
                [field]: '',
            }));
        }
    };

    const generateShortName = (data: typeof formData) => {
        let shortName = data.last_name;
        if (data.first_name) {
            shortName += ` ${data.first_name[0]}.`;
        }
        if (data.middle_name) {
            shortName += `${data.middle_name[0]}.`;
        }
        return shortName;
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Фамилия обязательна';
        }

        if (!formData.short_name.trim()) {
            newErrors.short_name = 'Краткое имя обязательно';
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
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving author:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={() => !loading && onClose()}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        {author ? 'Редактировать автора' : 'Добавить автора'}
                    </Typography>
                    <IconButton onClick={onClose} disabled={loading}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Код"
                            value={formData.code}
                            onChange={(e) => handleChange('code', e.target.value)}
                            helperText="Оставьте пустым для автогенерации"
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Фамилия"
                            value={formData.last_name}
                            onChange={(e) => handleChange('last_name', e.target.value)}
                            required
                            error={!!errors.last_name}
                            helperText={errors.last_name}
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Имя"
                            value={formData.first_name}
                            onChange={(e) => handleChange('first_name', e.target.value)}
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Отчество"
                            value={formData.middle_name}
                            onChange={(e) => handleChange('middle_name', e.target.value)}
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Краткое наименование"
                            value={formData.short_name}
                            onChange={(e) => handleChange('short_name', e.target.value)}
                            required
                            error={!!errors.short_name}
                            helperText={errors.short_name || 'Используется в списках и отчетах'}
                            disabled={loading}
                        />
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
                    disabled={loading || !formData.last_name || !formData.short_name}
                >
                    {loading ? 'Сохранение...' : (author ? 'Сохранить' : 'Добавить')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AuthorDialog;
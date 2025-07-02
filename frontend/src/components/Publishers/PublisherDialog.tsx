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

interface PublisherDialogProps {
    open: boolean;
    publisher: any | null;
    onClose: () => void;
    onSave: (publisherData: any) => Promise<void>;
}

const PublisherDialog: React.FC<PublisherDialogProps> = ({
                                                             open,
                                                             publisher,
                                                             onClose,
                                                             onSave,
                                                         }) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (open) {
            if (publisher) {
                setFormData({
                    code: publisher.code || '',
                    name: publisher.name || '',
                });
            } else {
                setFormData({
                    code: '',
                    name: '',
                });
            }
            setErrors({});
        }
    }, [open, publisher]);

    const handleChange = (field: string, value: string) => {
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

        if (!formData.name.trim()) {
            newErrors.name = 'Название издательства обязательно';
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
            console.error('Error saving publisher:', error);
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
                        {publisher ? 'Редактировать издательство' : 'Добавить издательство'}
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
                            label="Наименование"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                            error={!!errors.name}
                            helperText={errors.name}
                            disabled={loading}
                            placeholder="Например: Просвещение, Дрофа, АСТ"
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
                    disabled={loading || !formData.name}
                >
                    {loading ? 'Сохранение...' : (publisher ? 'Сохранить' : 'Добавить')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PublisherDialog;
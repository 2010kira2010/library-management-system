import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Box,
    Button,
    Typography,
    TextField,
    Grid,
    Paper,
    Divider,
    Avatar,
    IconButton,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    Save,
    Cancel,
    Business,
    PhotoCamera,
} from '@mui/icons-material';
import { useRootStore } from '../../stores/RootStore';
import { OrganizationData } from '../../stores/SettingsStore';
import api from '../../services/api';

const OrganizationSettings: React.FC = observer(() => {
    const { uiStore } = useRootStore();
    const [formData, setFormData] = useState<OrganizationData>({
        name: '',
        full_name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        director: '',
        librarian: '',
        inn: '',
        kpp: '',
        ogrn: '',
        bank_name: '',
        bank_account: '',
        bank_bik: '',
        logo_url: '',
    });
    const [originalData, setOriginalData] = useState<OrganizationData | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadOrganizationData();
    }, []);

    const loadOrganizationData = async () => {
        try {
            setLoading(true);
            const response = await api.getOrganizationSettings();
            const data = response.data || {};
            setFormData({
                name: data.name || '',
                full_name: data.full_name || '',
                address: data.address || '',
                phone: data.phone || '',
                email: data.email || '',
                website: data.website || '',
                director: data.director || '',
                librarian: data.librarian || '',
                inn: data.inn || '',
                kpp: data.kpp || '',
                ogrn: data.ogrn || '',
                bank_name: data.bank_name || '',
                bank_account: data.bank_account || '',
                bank_bik: data.bank_bik || '',
                logo_url: data.logo_url || '',
            });
            setOriginalData(data);
        } catch (error: any) {
            uiStore.showNotification('Ошибка загрузки данных организации', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof OrganizationData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleCancel = () => {
        if (originalData) {
            setFormData(originalData);
        }
        setErrors({});
        setIsEditing(false);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Название организации обязательно';
        }
        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Полное название обязательно';
        }
        if (!formData.address.trim()) {
            newErrors.address = 'Адрес обязателен';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Телефон обязателен';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email обязателен';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Некорректный email';
        }
        if (formData.inn && !/^\d{10}$|^\d{12}$/.test(formData.inn)) {
            newErrors.inn = 'ИНН должен содержать 10 или 12 цифр';
        }
        if (formData.kpp && !/^\d{9}$/.test(formData.kpp)) {
            newErrors.kpp = 'КПП должен содержать 9 цифр';
        }
        if (formData.bank_bik && !/^\d{9}$/.test(formData.bank_bik)) {
            newErrors.bank_bik = 'БИК должен содержать 9 цифр';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        try {
            setLoading(true);
            await api.updateOrganizationSettings(formData);
            uiStore.showNotification('Данные организации успешно сохранены', 'success');
            setOriginalData(formData);
            setIsEditing(false);
        } catch (error: any) {
            uiStore.showNotification('Ошибка сохранения данных организации', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('logo', file);

        try {
            setLoading(true);
            const response = await api.uploadOrganizationLogo(formData);
            setFormData(prev => ({ ...prev, logo_url: response.data.logo_url }));
            uiStore.showNotification('Логотип успешно загружен', 'success');
        } catch (error: any) {
            uiStore.showNotification('Ошибка загрузки логотипа', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !formData.name) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Данные организации</Typography>
                <Box>
                    {isEditing ? (
                        <>
                            <Button
                                onClick={handleCancel}
                                startIcon={<Cancel />}
                                sx={{ mr: 1 }}
                                disabled={loading}
                            >
                                Отмена
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                startIcon={<Save />}
                                disabled={loading}
                            >
                                Сохранить
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={() => setIsEditing(true)}
                        >
                            Редактировать
                        </Button>
                    )}
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Основная информация
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Краткое название"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    disabled={!isEditing || loading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Полное название"
                                    value={formData.full_name}
                                    onChange={(e) => handleChange('full_name', e.target.value)}
                                    error={!!errors.full_name}
                                    helperText={errors.full_name}
                                    disabled={!isEditing || loading}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Адрес"
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    error={!!errors.address}
                                    helperText={errors.address}
                                    disabled={!isEditing || loading}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Телефон"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    error={!!errors.phone}
                                    helperText={errors.phone}
                                    disabled={!isEditing || loading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    disabled={!isEditing || loading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Веб-сайт"
                                    value={formData.website}
                                    onChange={(e) => handleChange('website', e.target.value)}
                                    disabled={!isEditing || loading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Директор"
                                    value={formData.director}
                                    onChange={(e) => handleChange('director', e.target.value)}
                                    disabled={!isEditing || loading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Библиотекарь"
                                    value={formData.librarian}
                                    onChange={(e) => handleChange('librarian', e.target.value)}
                                    disabled={!isEditing || loading}
                                />
                            </Grid>
                        </Grid>

                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                            Реквизиты
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="ИНН"
                                    value={formData.inn}
                                    onChange={(e) => handleChange('inn', e.target.value)}
                                    error={!!errors.inn}
                                    helperText={errors.inn}
                                    disabled={!isEditing || loading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="КПП"
                                    value={formData.kpp}
                                    onChange={(e) => handleChange('kpp', e.target.value)}
                                    error={!!errors.kpp}
                                    helperText={errors.kpp}
                                    disabled={!isEditing || loading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="ОГРН"
                                    value={formData.ogrn}
                                    onChange={(e) => handleChange('ogrn', e.target.value)}
                                    disabled={!isEditing || loading}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Наименование банка"
                                    value={formData.bank_name}
                                    onChange={(e) => handleChange('bank_name', e.target.value)}
                                    disabled={!isEditing || loading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Расчетный счет"
                                    value={formData.bank_account}
                                    onChange={(e) => handleChange('bank_account', e.target.value)}
                                    disabled={!isEditing || loading}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="БИК"
                                    value={formData.bank_bik}
                                    onChange={(e) => handleChange('bank_bik', e.target.value)}
                                    error={!!errors.bank_bik}
                                    helperText={errors.bank_bik}
                                    disabled={!isEditing || loading}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Логотип организации
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Avatar
                            sx={{
                                width: 150,
                                height: 150,
                                margin: '0 auto',
                                mb: 2,
                                bgcolor: 'grey.200',
                            }}
                            src={formData.logo_url}
                        >
                            <Business sx={{ fontSize: 60 }} />
                        </Avatar>

                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="logo-upload"
                            type="file"
                            onChange={handleLogoUpload}
                            disabled={!isEditing || loading}
                        />
                        <label htmlFor="logo-upload">
                            <IconButton
                                color="primary"
                                component="span"
                                disabled={!isEditing || loading}
                            >
                                <PhotoCamera />
                            </IconButton>
                        </label>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Рекомендуемый размер: 300x300px
                        </Typography>
                    </Paper>

                    <Alert severity="info" sx={{ mt: 2 }}>
                        Эти данные используются в отчетах и официальных документах библиотеки.
                    </Alert>
                </Grid>
            </Grid>
        </Box>
    );
});

export default OrganizationSettings;
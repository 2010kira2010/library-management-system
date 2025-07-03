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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Alert,
    IconButton,
    InputAdornment,
} from '@mui/material';
import {
    Save,
    Cancel,
    Send,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { useRootStore } from '../../stores/RootStore';

interface EmailConfig {
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    smtp_from: string;
    smtp_from_name: string;
    smtp_encryption: string;
    smtp_enabled: boolean;

    // Шаблоны уведомлений
    notifications: {
        loan_reminder: boolean;
        overdue_notice: boolean;
        new_book_arrival: boolean;
        reader_registration: boolean;
    };

    // Настройки напоминаний
    reminder_days_before: number;
    overdue_check_time: string;
}

const EmailSettings: React.FC = observer(() => {
    const { apiClient, uiStore } = useRootStore();
    const [formData, setFormData] = useState<EmailConfig>({
        smtp_host: '',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        smtp_from: '',
        smtp_from_name: '',
        smtp_encryption: 'tls',
        smtp_enabled: false,
        notifications: {
            loan_reminder: true,
            overdue_notice: true,
            new_book_arrival: false,
            reader_registration: true,
        },
        reminder_days_before: 3,
        overdue_check_time: '09:00',
    });
    const [originalData, setOriginalData] = useState<EmailConfig | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [testEmailSending, setTestEmailSending] = useState(false);

    useEffect(() => {
        loadEmailConfig();
    }, []);

    const loadEmailConfig = async () => {
        try {
            uiStore.setLoading(true);
            const response = await apiClient.get('/api/settings/email');
            const data = response.data || formData;
            setFormData(data);
            setOriginalData(data);
        } catch (error: any) {
            uiStore.showNotification('Ошибка загрузки настроек email', 'error');
        } finally {
            uiStore.setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        if (field.startsWith('notifications.')) {
            const notificationKey = field.split('.')[1];
            setFormData(prev => ({
                ...prev,
                notifications: {
                    ...prev.notifications,
                    [notificationKey]: value,
                },
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
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

        if (formData.smtp_enabled) {
            if (!formData.smtp_host.trim()) {
                newErrors.smtp_host = 'SMTP сервер обязателен';
            }
            if (!formData.smtp_username.trim()) {
                newErrors.smtp_username = 'Имя пользователя обязательно';
            }
            if (!formData.smtp_password.trim() && !originalData?.smtp_password) {
                newErrors.smtp_password = 'Пароль обязателен';
            }
            if (!formData.smtp_from.trim()) {
                newErrors.smtp_from = 'Email отправителя обязателен';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.smtp_from)) {
                newErrors.smtp_from = 'Некорректный email';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        try {
            uiStore.setLoading(true);
            await apiClient.put('/api/settings/email', formData);
            uiStore.showNotification('Настройки email успешно сохранены', 'success');
            setOriginalData(formData);
            setIsEditing(false);
        } catch (error: any) {
            uiStore.showNotification('Ошибка сохранения настроек email', 'error');
        } finally {
            uiStore.setLoading(false);
        }
    };

    const handleTestEmail = async () => {
        if (!validate()) return;

        setTestEmailSending(true);
        try {
            await apiClient.post('/api/settings/email/test', {
                config: formData,
                recipient: formData.smtp_from,
            });
            uiStore.showNotification('Тестовое письмо успешно отправлено', 'success');
        } catch (error: any) {
            uiStore.showNotification(
                error.response?.data?.error || 'Ошибка отправки тестового письма',
                'error'
            );
        } finally {
            setTestEmailSending(false);
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Настройки email</Typography>
                <Box>
                    {isEditing ? (
                        <>
                            <Button
                                onClick={handleTestEmail}
                                startIcon={<Send />}
                                sx={{ mr: 1 }}
                                disabled={!formData.smtp_enabled || testEmailSending}
                            >
                                Тест
                            </Button>
                            <Button
                                onClick={handleCancel}
                                startIcon={<Cancel />}
                                sx={{ mr: 1 }}
                            >
                                Отмена
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                startIcon={<Save />}
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
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="subtitle1">
                                SMTP настройки
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.smtp_enabled}
                                        onChange={(e) => handleChange('smtp_enabled', e.target.checked)}
                                        disabled={!isEditing}
                                    />
                                }
                                label="Включено"
                            />
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    fullWidth
                                    label="SMTP сервер"
                                    value={formData.smtp_host}
                                    onChange={(e) => handleChange('smtp_host', e.target.value)}
                                    error={!!errors.smtp_host}
                                    helperText={errors.smtp_host || 'Например: smtp.gmail.com'}
                                    disabled={!isEditing || !formData.smtp_enabled}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Порт"
                                    value={formData.smtp_port}
                                    onChange={(e) => handleChange('smtp_port', parseInt(e.target.value))}
                                    disabled={!isEditing || !formData.smtp_enabled}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth disabled={!isEditing || !formData.smtp_enabled}>
                                    <InputLabel>Шифрование</InputLabel>
                                    <Select
                                        value={formData.smtp_encryption}
                                        label="Шифрование"
                                        onChange={(e) => handleChange('smtp_encryption', e.target.value)}
                                    >
                                        <MenuItem value="none">Без шифрования</MenuItem>
                                        <MenuItem value="tls">TLS</MenuItem>
                                        <MenuItem value="ssl">SSL</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Имя пользователя"
                                    value={formData.smtp_username}
                                    onChange={(e) => handleChange('smtp_username', e.target.value)}
                                    error={!!errors.smtp_username}
                                    helperText={errors.smtp_username}
                                    disabled={!isEditing || !formData.smtp_enabled}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type={showPassword ? 'text' : 'password'}
                                    label="Пароль"
                                    value={formData.smtp_password}
                                    onChange={(e) => handleChange('smtp_password', e.target.value)}
                                    error={!!errors.smtp_password}
                                    helperText={errors.smtp_password}
                                    disabled={!isEditing || !formData.smtp_enabled}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Email отправителя"
                                    value={formData.smtp_from}
                                    onChange={(e) => handleChange('smtp_from', e.target.value)}
                                    error={!!errors.smtp_from}
                                    helperText={errors.smtp_from}
                                    disabled={!isEditing || !formData.smtp_enabled}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Имя отправителя"
                                    value={formData.smtp_from_name}
                                    onChange={(e) => handleChange('smtp_from_name', e.target.value)}
                                    helperText="Например: Библиотека школы №1"
                                    disabled={!isEditing || !formData.smtp_enabled}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Типы уведомлений
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.notifications.loan_reminder}
                                    onChange={(e) => handleChange('notifications.loan_reminder', e.target.checked)}
                                    disabled={!isEditing}
                                />
                            }
                            label="Напоминания о возврате книг"
                            sx={{ display: 'block', mb: 1 }}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.notifications.overdue_notice}
                                    onChange={(e) => handleChange('notifications.overdue_notice', e.target.checked)}
                                    disabled={!isEditing}
                                />
                            }
                            label="Уведомления о просрочке"
                            sx={{ display: 'block', mb: 1 }}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.notifications.new_book_arrival}
                                    onChange={(e) => handleChange('notifications.new_book_arrival', e.target.checked)}
                                    disabled={!isEditing}
                                />
                            }
                            label="Новые поступления книг"
                            sx={{ display: 'block', mb: 1 }}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.notifications.reader_registration}
                                    onChange={(e) => handleChange('notifications.reader_registration', e.target.checked)}
                                    disabled={!isEditing}
                                />
                            }
                            label="Регистрация читателей"
                            sx={{ display: 'block' }}
                        />
                    </Paper>

                    <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Настройки напоминаний
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Напоминать за (дней)"
                                    value={formData.reminder_days_before}
                                    onChange={(e) => handleChange('reminder_days_before', parseInt(e.target.value))}
                                    helperText="За сколько дней до возврата отправлять напоминание"
                                    disabled={!isEditing}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type="time"
                                    label="Время проверки просрочек"
                                    value={formData.overdue_check_time}
                                    onChange={(e) => handleChange('overdue_check_time', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    disabled={!isEditing}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            {formData.smtp_enabled && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Email уведомления будут автоматически отправляться читателям согласно настроенным правилам.
                    Убедитесь, что SMTP настройки корректны и протестированы.
                </Alert>
            )}
        </Box>
    );
});

export default EmailSettings;
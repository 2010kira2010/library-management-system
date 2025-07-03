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
    Tabs,
    Tab,
} from '@mui/material';
import { Close, PhotoCamera } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '../../stores/RootStore';

interface ReaderDialogProps {
    open: boolean;
    reader: any | null;
    onClose: () => void;
    onSave: (readerData: any) => Promise<void>;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

const ReaderDialog: React.FC<ReaderDialogProps> = observer(({
                                                                open,
                                                                reader,
                                                                onClose,
                                                                onSave,
                                                            }) => {
    const { settingsStore } = useRootStore();
    const [tabValue, setTabValue] = useState(0);
    const [formData, setFormData] = useState({
        code: '',
        barcode: '',
        last_name: '',
        first_name: '',
        middle_name: '',
        user_type: 'student',
        class_id: '',
        grade: '',
        gender: '',
        birth_date: null as Date | null,
        address: '',
        document_type: 'Свидетельство о рождении',
        document_number: '',
        phone: '',
        email: '',
        parent_mother_name: '',
        parent_mother_phone: '',
        parent_father_name: '',
        parent_father_phone: '',
        guardian_name: '',
        guardian_phone: '',
        comments: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (open) {
            settingsStore.loadSettings();

            if (reader) {
                setFormData({
                    code: reader.code || '',
                    barcode: reader.barcode || '',
                    last_name: reader.last_name || '',
                    first_name: reader.first_name || '',
                    middle_name: reader.middle_name || '',
                    user_type: reader.user_type || 'student',
                    class_id: reader.class_id || '',
                    grade: reader.grade || '',
                    gender: reader.gender || '',
                    birth_date: reader.birth_date ? new Date(reader.birth_date) : null,
                    address: reader.address || '',
                    document_type: reader.document_type || 'Свидетельство о рождении',
                    document_number: reader.document_number || '',
                    phone: reader.phone || '',
                    email: reader.email || '',
                    parent_mother_name: reader.parent_mother_name || '',
                    parent_mother_phone: reader.parent_mother_phone || '',
                    parent_father_name: reader.parent_father_name || '',
                    parent_father_phone: reader.parent_father_phone || '',
                    guardian_name: reader.guardian_name || '',
                    guardian_phone: reader.guardian_phone || '',
                    comments: reader.comments || '',
                });
            } else {
                // Сброс формы для нового читателя
                setFormData({
                    code: '',
                    barcode: '',
                    last_name: '',
                    first_name: '',
                    middle_name: '',
                    user_type: 'student',
                    class_id: '',
                    grade: '',
                    gender: '',
                    birth_date: null,
                    address: '',
                    document_type: 'Свидетельство о рождении',
                    document_number: '',
                    phone: '',
                    email: '',
                    parent_mother_name: '',
                    parent_mother_phone: '',
                    parent_father_name: '',
                    parent_father_phone: '',
                    guardian_name: '',
                    guardian_phone: '',
                    comments: '',
                });
            }
            setErrors({});
            setTabValue(0);
        }
    }, [open, reader]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: typeof formData) => ({
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

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Фамилия обязательна';
        }

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'Имя обязательно';
        }

        if (!formData.barcode.trim()) {
            newErrors.barcode = 'Штрих-код обязателен';
        }

        if (formData.user_type === 'student' && !formData.class_id) {
            newErrors.class_id = 'Выберите класс для ученика';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Некорректный email';
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
                class_id: formData.class_id || null,
                grade: formData.grade ? parseInt(formData.grade) : null,
                birth_date: formData.birth_date?.toISOString() || null,
            };

            await onSave(dataToSave);
            onClose();
        } catch (error) {
            console.error('Error saving reader:', error);
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
                        {reader ? 'Редактировать абонента' : 'Добавить абонента'}
                    </Typography>
                    <IconButton onClick={onClose} disabled={loading}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                    <Tab label="Основные данные" />
                    <Tab label="Представители" />
                    <Tab label="Дополнительно" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
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
                        <Grid item xs={12} sm={4}>
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
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Имя"
                                value={formData.first_name}
                                onChange={(e) => handleChange('first_name', e.target.value)}
                                required
                                error={!!errors.first_name}
                                helperText={errors.first_name}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Отчество"
                                value={formData.middle_name}
                                onChange={(e) => handleChange('middle_name', e.target.value)}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                select
                                label="Тип пользователя"
                                value={formData.user_type}
                                onChange={(e) => handleChange('user_type', e.target.value)}
                                disabled={loading}
                            >
                                {settingsStore.userTypes.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                select
                                label="Класс"
                                value={formData.class_id}
                                onChange={(e) => handleChange('class_id', e.target.value)}
                                error={!!errors.class_id}
                                helperText={errors.class_id}
                                disabled={loading || formData.user_type !== 'student'}
                            >
                                <MenuItem value="">
                                    <em>Не указан</em>
                                </MenuItem>
                                {(settingsStore.classes || []).map((cls) => (
                                    <MenuItem key={cls.id} value={cls.id}>
                                        {cls.grade} "{cls.letter}"
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                select
                                label="Пол"
                                value={formData.gender}
                                onChange={(e) => handleChange('gender', e.target.value)}
                                disabled={loading}
                            >
                                <MenuItem value="">Не указан</MenuItem>
                                <MenuItem value="М">Мужской</MenuItem>
                                <MenuItem value="Ж">Женский</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <DatePicker
                                label="Дата рождения"
                                value={formData.birth_date}
                                onChange={(date) => handleChange('birth_date', date)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        disabled={loading}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label="Адрес проживания"
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Документ"
                                value={formData.document_type}
                                onChange={(e) => handleChange('document_type', e.target.value)}
                                disabled={loading}
                            >
                                {settingsStore.documentTypes.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Номер документа"
                                value={formData.document_number}
                                onChange={(e) => handleChange('document_number', e.target.value)}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Контактный телефон"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="E-mail"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                error={!!errors.email}
                                helperText={errors.email}
                                disabled={loading}
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Мама
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label="ФИО"
                                value={formData.parent_mother_name}
                                onChange={(e) => handleChange('parent_mother_name', e.target.value)}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Телефон"
                                value={formData.parent_mother_phone}
                                onChange={(e) => handleChange('parent_mother_phone', e.target.value)}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Папа
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label="ФИО"
                                value={formData.parent_father_name}
                                onChange={(e) => handleChange('parent_father_name', e.target.value)}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Телефон"
                                value={formData.parent_father_phone}
                                onChange={(e) => handleChange('parent_father_phone', e.target.value)}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Опекун
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label="ФИО"
                                value={formData.guardian_name}
                                onChange={(e) => handleChange('guardian_name', e.target.value)}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Телефон"
                                value={formData.guardian_phone}
                                onChange={(e) => handleChange('guardian_phone', e.target.value)}
                                disabled={loading}
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Комментарии"
                                value={formData.comments}
                                onChange={(e) => handleChange('comments', e.target.value)}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<PhotoCamera />}
                                    disabled={loading}
                                >
                                    Загрузить фото
                                </Button>
                                <Typography variant="body2" color="text.secondary">
                                    Фото будет использоваться для читательского билета
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </TabPanel>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Отмена
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !formData.last_name || !formData.first_name || !formData.barcode}
                >
                    {loading ? 'Сохранение...' : (reader ? 'Сохранить' : 'Добавить')}
                </Button>
            </DialogActions>
        </Dialog>
    );
});

export default ReaderDialog;
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
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    CircularProgress,
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Save,
    Cancel,
    Lock,
} from '@mui/icons-material';
import { useRootStore } from '../../stores/RootStore';
import { LibraryUser } from '../../stores/SettingsStore';

const StaffSettings: React.FC = observer(() => {
    const { settingsStore } = useRootStore();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<LibraryUser | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<LibraryUser | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        email: '',
        role: 'librarian',
        password: '',
    });
    const [passwordData, setPasswordData] = useState({
        new_password: '',
        confirm_password: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        setLoading(true);
        await settingsStore.loadStaff();
        setLoading(false);
    };

    const handleAdd = () => {
        setEditingStaff(null);
        setFormData({
            username: '',
            full_name: '',
            email: '',
            role: 'librarian',
            password: '',
        });
        setErrors({});
        setDialogOpen(true);
    };

    const handleEdit = (staffMember: LibraryUser) => {
        setEditingStaff(staffMember);
        setFormData({
            username: staffMember.username,
            full_name: staffMember.full_name,
            email: staffMember.email || '',
            role: staffMember.role,
            password: '',
        });
        setErrors({});
        setDialogOpen(true);
    };

    const handleChangePassword = (staffMember: LibraryUser) => {
        setSelectedStaff(staffMember);
        setPasswordData({ new_password: '', confirm_password: '' });
        setErrors({});
        setPasswordDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
            return;
        }

        await settingsStore.deleteStaff(id);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Имя пользователя обязательно';
        }
        if (!formData.full_name.trim()) {
            newErrors.full_name = 'ФИО обязательно';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email обязателен';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Некорректный email';
        }
        if (!editingStaff && !formData.password.trim()) {
            newErrors.password = 'Пароль обязателен';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePassword = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!passwordData.new_password.trim()) {
            newErrors.new_password = 'Новый пароль обязателен';
        } else if (passwordData.new_password.length < 6) {
            newErrors.new_password = 'Пароль должен содержать минимум 6 символов';
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
            newErrors.confirm_password = 'Пароли не совпадают';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        const success = editingStaff
            ? await settingsStore.updateStaff(editingStaff.id, formData)
            : await settingsStore.createStaff(formData);

        if (success) {
            setDialogOpen(false);
        }
    };

    const handleSavePassword = async () => {
        if (!validatePassword() || !selectedStaff) return;

        const success = await settingsStore.updateStaffPassword(
            selectedStaff.id,
            passwordData.new_password
        );

        if (success) {
            setPasswordDialogOpen(false);
        }
    };

    const toggleActive = async (staffMember: LibraryUser) => {
        await settingsStore.toggleStaffActive(staffMember.id);
    };

    const getRoleLabel = (role: string) => {
        const roles = settingsStore.getRoles();
        const roleObj = roles.find(r => r.value === role);
        return roleObj ? roleObj.label : role;
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
                <Typography variant="h6">Управление сотрудниками</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAdd}
                >
                    Добавить сотрудника
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Сотрудник</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Роль</TableCell>
                            <TableCell>Последний вход</TableCell>
                            <TableCell align="center">Статус</TableCell>
                            <TableCell align="right">Действия</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {settingsStore.libraryUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        Сотрудники не найдены
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            settingsStore.libraryUsers.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar sx={{ width: 32, height: 32 }}>
                                                {member.full_name[0]}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2">
                                                    {member.full_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    @{member.username}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{member.email || '—'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getRoleLabel(member.role)}
                                            size="small"
                                            color={member.role === 'admin' ? 'error' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {member.last_login
                                            ? new Date(member.last_login).toLocaleString('ru-RU')
                                            : '—'
                                        }
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={member.is_active !== false ? 'Активен' : 'Заблокирован'}
                                            color={member.is_active !== false ? 'success' : 'default'}
                                            size="small"
                                            onClick={() => toggleActive(member)}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEdit(member)}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleChangePassword(member)}
                                        >
                                            <Lock />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(member.id)}
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

            {/* Диалог добавления/редактирования */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingStaff ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ pt: 2 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Имя пользователя"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                error={!!errors.username}
                                helperText={errors.username}
                                disabled={!!editingStaff}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="ФИО"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                error={!!errors.full_name}
                                helperText={errors.full_name}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                error={!!errors.email}
                                helperText={errors.email}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Роль</InputLabel>
                                <Select
                                    value={formData.role}
                                    label="Роль"
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    {settingsStore.getRoles().map((role) => (
                                        <MenuItem key={role.value} value={role.value}>
                                            {role.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {!editingStaff && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type="password"
                                    label="Пароль"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    error={!!errors.password}
                                    helperText={errors.password}
                                />
                            </Grid>
                        )}
                    </Grid>
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

            {/* Диалог изменения пароля */}
            <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    Изменить пароль
                    {selectedStaff && (
                        <Typography variant="body2" color="text.secondary">
                            {selectedStaff.full_name}
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ pt: 2 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="password"
                                label="Новый пароль"
                                value={passwordData.new_password}
                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                error={!!errors.new_password}
                                helperText={errors.new_password}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="password"
                                label="Подтвердите пароль"
                                value={passwordData.confirm_password}
                                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                error={!!errors.confirm_password}
                                helperText={errors.confirm_password}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPasswordDialogOpen(false)}>
                        Отмена
                    </Button>
                    <Button onClick={handleSavePassword} variant="contained">
                        Изменить пароль
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
});

export default StaffSettings;
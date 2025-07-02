import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
} from '@mui/material';
import {
    Save,
    Add,
    Edit,
    Delete,
} from '@mui/icons-material';
import { useRootStore } from '../stores/RootStore';

const Settings: React.FC = observer(() => {
    const { settingsStore } = useRootStore();
    const [organizationData, setOrganizationData] = useState({
        organization_name: '',
        organization_short_name: '',
        director_name: '',
    });

    useEffect(() => {
        settingsStore.loadSettings();
    }, []);

    useEffect(() => {
        if (settingsStore.settings) {
            setOrganizationData({
                organization_name: settingsStore.settings.organization_name || '',
                organization_short_name: settingsStore.settings.organization_short_name || '',
                director_name: settingsStore.settings.director_name || '',
            });
        }
    }, [settingsStore.settings]);

    const handleSaveOrganization = async () => {
        await settingsStore.updateSettings(organizationData);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Настройка
            </Typography>

            <Grid container spacing={3}>
                {/* Настройки организации */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Наименование организации
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Полное наименование"
                                    value={organizationData.organization_name}
                                    onChange={(e) => setOrganizationData({
                                        ...organizationData,
                                        organization_name: e.target.value,
                                    })}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Краткое наименование"
                                    value={organizationData.organization_short_name}
                                    onChange={(e) => setOrganizationData({
                                        ...organizationData,
                                        organization_short_name: e.target.value,
                                    })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Руководитель"
                                    value={organizationData.director_name}
                                    onChange={(e) => setOrganizationData({
                                        ...organizationData,
                                        director_name: e.target.value,
                                    })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    startIcon={<Save />}
                                    onClick={handleSaveOrganization}
                                >
                                    Сохранить
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Настройка классов */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Настройка классов
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<Add />}
                                onClick={() => console.log('Add class')}
                            >
                                Добавить класс
                            </Button>
                        </Box>

                        <List>
                            {settingsStore.classes.map((cls) => (
                                <ListItem key={cls.id}>
                                    <ListItemText
                                        primary={`${cls.grade} "${cls.letter}"`}
                                        secondary={cls.teacher_name || 'Классный руководитель не указан'}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton edge="end" size="small">
                                            <Edit />
                                        </IconButton>
                                        <IconButton edge="end" size="small">
                                            <Delete />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* Сотрудники библиотеки */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Сотрудники библиотеки
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<Add />}
                                onClick={() => console.log('Add user')}
                            >
                                Добавить
                            </Button>
                        </Box>

                        <List>
                            {settingsStore.libraryUsers.map((user) => (
                                <ListItem key={user.id}>
                                    <ListItemText
                                        primary={user.full_name}
                                        secondary={`Логин: ${user.username} • Роль: ${user.role}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton edge="end" size="small">
                                            <Edit />
                                        </IconButton>
                                        <IconButton edge="end" size="small">
                                            <Delete />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
});

export default Settings;
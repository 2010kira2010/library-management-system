import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    CardActions,
    Button,
    CircularProgress,
} from '@mui/material';
import {
    LibraryBooks,
    People,
    Assignment,
    AssignmentReturn,
    TrendingUp,
    Warning,
    CheckCircle,
    Book,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import api from '../services/api';

interface DashboardStats {
    total_books: number;
    available_books: number;
    total_readers: number;
    active_loans: number;
    today_issued: number;
    today_returned: number;
    overdue_loans: number;
}

const Dashboard: React.FC = observer(() => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await api.getDashboardStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    const statCards = [
        {
            title: 'Всего книг',
            value: stats?.total_books || 0,
            icon: <LibraryBooks />,
            color: '#1976d2',
        },
        {
            title: 'Доступно книг',
            value: stats?.available_books || 0,
            icon: <CheckCircle />,
            color: '#4caf50',
        },
        {
            title: 'Читателей',
            value: stats?.total_readers || 0,
            icon: <People />,
            color: '#ff9800',
        },
        {
            title: 'Активных выдач',
            value: stats?.active_loans || 0,
            icon: <Book />,
            color: '#9c27b0',
        },
    ];

    const actionCards = [
        {
            title: 'Выдача книг',
            description: 'Выдать книгу читателю',
            icon: <Assignment sx={{ fontSize: 48 }} />,
            action: () => navigate('/loans'),
            color: '#2196f3',
        },
        {
            title: 'Возврат книг',
            description: 'Принять возврат книги',
            icon: <AssignmentReturn sx={{ fontSize: 48 }} />,
            action: () => navigate('/returns'),
            color: '#4caf50',
        },
        {
            title: 'Новый читатель',
            description: 'Зарегистрировать нового читателя',
            icon: <People sx={{ fontSize: 48 }} />,
            action: () => navigate('/readers'),
            color: '#ff9800',
        },
        {
            title: 'Добавить книгу',
            description: 'Добавить новую книгу в библиотеку',
            icon: <LibraryBooks sx={{ fontSize: 48 }} />,
            action: () => navigate('/books'),
            color: '#9c27b0',
        },
    ];

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Главная страница
            </Typography>

            <Typography variant="h6" color="text.secondary" gutterBottom>
                {format(new Date(), 'EEEE, d MMMM yyyy', { locale: ru })}
            </Typography>

            {/* Статистика */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statCards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Paper
                            sx={{
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                height: 140,
                                backgroundColor: card.color,
                                color: 'white',
                            }}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                    <Typography variant="h3" component="div">
                                        {card.value}
                                    </Typography>
                                    <Typography variant="subtitle1">
                                        {card.title}
                                    </Typography>
                                </Box>
                                <Box sx={{ opacity: 0.7 }}>
                                    {card.icon}
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Сегодняшняя активность */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Box display="flex" alignItems="center" mb={2}>
                            <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                            <Typography variant="h6">Выдано сегодня</Typography>
                        </Box>
                        <Typography variant="h3" color="success.main">
                            {stats?.today_issued || 0}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Box display="flex" alignItems="center" mb={2}>
                            <AssignmentReturn sx={{ mr: 1, color: 'info.main' }} />
                            <Typography variant="h6">Возвращено сегодня</Typography>
                        </Box>
                        <Typography variant="h3" color="info.main">
                            {stats?.today_returned || 0}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Box display="flex" alignItems="center" mb={2}>
                            <Warning sx={{ mr: 1, color: 'error.main' }} />
                            <Typography variant="h6">Просроченных</Typography>
                        </Box>
                        <Typography variant="h3" color="error.main">
                            {stats?.overdue_loans || 0}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Быстрые действия */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Быстрые действия
            </Typography>

            <Grid container spacing={3}>
                {actionCards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ textAlign: 'center', pt: 3 }}>
                                <Box sx={{ color: card.color, mb: 2 }}>
                                    {card.icon}
                                </Box>
                                <Typography variant="h6" component="div" gutterBottom>
                                    {card.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {card.description}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                                <Button
                                    size="large"
                                    onClick={card.action}
                                    sx={{ color: card.color }}
                                >
                                    Перейти
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
});

export default Dashboard;
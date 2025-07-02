import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
} from '@mui/material';
import { LibraryBooks } from '@mui/icons-material';
import { useRootStore } from '../stores/RootStore';

const Login: React.FC = observer(() => {
    const navigate = useNavigate();
    const { authStore } = useRootStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const success = await authStore.login(username, password);
        if (success) {
            navigate('/');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ padding: 4, width: '100%', borderRadius: '12px' }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            mb: 3,
                        }}
                    >
                        <LibraryBooks sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography component="h1" variant="h4" fontWeight="bold">
                            БИБЛИОТЕКА
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Система управления
                        </Typography>
                    </Box>

                    {authStore.error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {authStore.error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Имя пользователя"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={authStore.isLoading}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Пароль"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={authStore.isLoading}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={authStore.isLoading || !username || !password}
                        >
                            {authStore.isLoading ? (
                                <CircularProgress size={24} />
                            ) : (
                                'Войти'
                            )}
                        </Button>
                    </Box>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            Версия 1.0.0
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
});

export default Login;
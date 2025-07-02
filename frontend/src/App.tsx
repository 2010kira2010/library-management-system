import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ruRU } from '@mui/material/locale';
import { observer } from 'mobx-react-lite';
import CssBaseline from '@mui/material/CssBaseline';

import { useRootStore } from './stores/RootStore';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Readers from './pages/Readers';
import Loans from './pages/Loans';
import Returns from './pages/Returns';
import Authors from './pages/Authors';
import Publishers from './pages/Publishers';
import Disks from './pages/Disks';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Тема Material-UI
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#f5f5f5',
        },
    },
}, ruRU);

const App: React.FC = observer(() => {
    const { authStore } = useRootStore();

    return (
        <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <CssBaseline />
                <Router>
                    <Routes>
                        <Route path="/login" element={!authStore.isAuthenticated ? <Login /> : <Navigate to="/" />} />
                        <Route
                            path="/"
                            element={authStore.isAuthenticated ? <Layout /> : <Navigate to="/login" />}
                        >
                            <Route index element={<Dashboard />} />
                            <Route path="books" element={<Books />} />
                            <Route path="readers" element={<Readers />} />
                            <Route path="loans" element={<Loans />} />
                            <Route path="returns" element={<Returns />} />
                            <Route path="authors" element={<Authors />} />
                            <Route path="publishers" element={<Publishers />} />
                            <Route path="disks" element={<Disks />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="settings" element={<Settings />} />
                        </Route>
                    </Routes>
                </Router>
            </LocalizationProvider>
        </ThemeProvider>
    );
});

export default App;
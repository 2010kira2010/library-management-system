import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Menu,
    MenuItem,
    Badge,
    CssBaseline,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard,
    LibraryBooks,
    People,
    Assignment,
    AssignmentReturn,
    Person,
    Business,
    Album,
    Assessment,
    Settings,
    Logout,
    Notifications,
    Mail,
    CalendarMonth,
} from '@mui/icons-material';
import { useRootStore } from '../../stores/RootStore';
import NotificationManager from '../Common/NotificationManager';

const drawerWidth = 240;

const menuItems = [
    { text: 'Главная', icon: <Dashboard />, path: '/' },
    { text: 'Книги', icon: <LibraryBooks />, path: '/books' },
    { text: 'Абоненты', icon: <People />, path: '/readers' },
    { text: 'Выдача книг', icon: <Assignment />, path: '/loans' },
    { text: 'Возврат книг', icon: <AssignmentReturn />, path: '/returns' },
    { text: 'Авторы', icon: <Person />, path: '/authors' },
    { text: 'Издательства', icon: <Business />, path: '/publishers' },
    { text: 'Диски', icon: <Album />, path: '/disks' },
    { text: 'Отчеты', icon: <Assessment />, path: '/reports' },
    { text: 'Настройка', icon: <Settings />, path: '/settings' },
];

const Layout: React.FC = observer(() => {
    const navigate = useNavigate();
    const location = useLocation();
    const { authStore, uiStore } = useRootStore();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
        setNotificationAnchorEl(event.currentTarget);
        // Сбрасываем счетчик уведомлений
        uiStore.notificationCount = 0;
    };

    const handleNotificationClose = () => {
        setNotificationAnchorEl(null);
    };

    const handleLogout = () => {
        handleMenuClose();
        authStore.logout();
        navigate('/login');
    };

    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    БИБЛИОТЕКА
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                setMobileOpen(false);
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Библиотечная система
                    </Typography>

                    <IconButton
                        color="inherit"
                        sx={{ mr: 1 }}
                        onClick={handleNotificationClick}
                    >
                        <Badge badgeContent={uiStore.notificationCount} color="error">
                            <Notifications />
                        </Badge>
                    </IconButton>

                    <IconButton color="inherit" sx={{ mr: 1 }}>
                        <CalendarMonth />
                    </IconButton>

                    <IconButton color="inherit" sx={{ mr: 2 }} onClick={() => navigate('/email')}>
                        <Mail />
                    </IconButton>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                            {authStore.user?.full_name}
                        </Typography>
                        <IconButton onClick={handleMenuClick} color="inherit">
                            <Avatar sx={{ width: 32, height: 32 }}>
                                {authStore.user?.full_name[0]}
                            </Avatar>
                        </IconButton>
                    </Box>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={handleMenuClose}>Профиль</MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <Logout fontSize="small" />
                            </ListItemIcon>
                            Выйти
                        </MenuItem>
                    </Menu>

                    {/* Меню уведомлений */}
                    <Menu
                        anchorEl={notificationAnchorEl}
                        open={Boolean(notificationAnchorEl)}
                        onClose={handleNotificationClose}
                        PaperProps={{
                            style: {
                                maxHeight: 400,
                                width: '300px',
                            },
                        }}
                    >
                        {uiStore.notifications.length === 0 ? (
                            <MenuItem disabled>
                                <Typography variant="body2" color="text.secondary">
                                    Нет новых уведомлений
                                </Typography>
                            </MenuItem>
                        ) : (
                            <>
                                <MenuItem disabled>
                                    <Typography variant="subtitle2">
                                        Уведомления ({uiStore.notifications.length})
                                    </Typography>
                                </MenuItem>
                                <Divider />
                                {uiStore.notifications.map((notification) => (
                                    <MenuItem
                                        key={notification.id}
                                        onClick={() => {
                                            uiStore.removeNotification(notification.id);
                                            if (uiStore.notifications.length === 1) {
                                                handleNotificationClose();
                                            }
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="body2">
                                                {notification.message}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(notification.timestamp).toLocaleTimeString()}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                                <Divider />
                                <MenuItem
                                    onClick={() => {
                                        uiStore.clearNotifications();
                                        handleNotificationClose();
                                    }}
                                >
                                    <Typography variant="body2" color="primary">
                                        Очистить все
                                    </Typography>
                                </MenuItem>
                            </>
                        )}
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    mt: 8,
                }}
            >
                <Outlet />
            </Box>

            {/* Компонент для отображения уведомлений */}
            <NotificationManager />
        </Box>
    );
});

export default Layout;
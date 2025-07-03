import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    IconButton,
    Button,
    Badge,
    TextField,
    InputAdornment,
    Drawer,
    Grid,
} from '@mui/material';
import {
    Inbox,
    Send,
    Drafts,
    Delete,
    Create,
    Search,
    Star,
    StarBorder,
    MoreVert,
    AttachFile,
    Refresh,
    Archive,
    Label,
} from '@mui/icons-material';
import { useRootStore } from '../stores/RootStore';
import ComposeEmail from '../components/Email/ComposeEmail';
import EmailView from '../components/Email/EmailView';

interface EmailMessage {
    id: number;
    from: string;
    from_name: string;
    to: string;
    subject: string;
    body: string;
    date: string;
    is_read: boolean;
    is_starred: boolean;
    has_attachment: boolean;
    folder: 'inbox' | 'sent' | 'drafts' | 'trash';
    labels: string[];
}

const EmailClient: React.FC = observer(() => {
    const { apiClient, uiStore } = useRootStore();
    const [emails, setEmails] = useState<EmailMessage[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string>('inbox');
    const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [composeOpen, setComposeOpen] = useState(false);
    const [replyTo, setReplyTo] = useState<EmailMessage | null>(null);
    const [loading, setLoading] = useState(false);
    const [drawerOpen] = useState(true);

    const folders = [
        { id: 'inbox', label: 'Входящие', icon: <Inbox />, badge: 5 },
        { id: 'sent', label: 'Отправленные', icon: <Send />, badge: 0 },
        { id: 'drafts', label: 'Черновики', icon: <Drafts />, badge: 2 },
        { id: 'trash', label: 'Корзина', icon: <Delete />, badge: 0 },
    ];

    const labels = [
        { id: 'important', label: 'Важное', color: 'error' },
        { id: 'work', label: 'Работа', color: 'primary' },
        { id: 'personal', label: 'Личное', color: 'success' },
        { id: 'library', label: 'Библиотека', color: 'warning' },
    ];

    useEffect(() => {
        loadEmails();
    }, [selectedFolder]);

    const loadEmails = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/api/email/${selectedFolder}`);
            setEmails(response.data || []);
        } catch (error: any) {
            uiStore.showNotification('Ошибка загрузки писем', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailClick = async (email: EmailMessage) => {
        setSelectedEmail(email);

        // Отметить как прочитанное
        if (!email.is_read && email.folder === 'inbox') {
            try {
                await apiClient.patch(`/api/email/${email.id}/read`);
                setEmails(emails.map(e =>
                    e.id === email.id ? { ...e, is_read: true } : e
                ));
            } catch (error) {
                console.error('Error marking email as read:', error);
            }
        }
    };

    const handleStarToggle = async (email: EmailMessage, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            await apiClient.patch(`/api/email/${email.id}/star`);
            setEmails(emails.map(e =>
                e.id === email.id ? { ...e, is_starred: !e.is_starred } : e
            ));
        } catch (error) {
            uiStore.showNotification('Ошибка при изменении статуса', 'error');
        }
    };

    const handleDelete = async (email: EmailMessage) => {
        try {
            if (email.folder === 'trash') {
                // Окончательное удаление
                await apiClient.delete(`/api/email/${email.id}`);
                setEmails(emails.filter(e => e.id !== email.id));
                uiStore.showNotification('Письмо удалено', 'success');
            } else {
                // Переместить в корзину
                await apiClient.patch(`/api/email/${email.id}/trash`);
                setEmails(emails.filter(e => e.id !== email.id));
                uiStore.showNotification('Письмо перемещено в корзину', 'info');
            }
            setSelectedEmail(null);
        } catch (error) {
            uiStore.showNotification('Ошибка при удалении письма', 'error');
        }
    };

    const handleReply = (email: EmailMessage) => {
        setReplyTo(email);
        setComposeOpen(true);
    };

    const handleCompose = () => {
        setReplyTo(null);
        setComposeOpen(true);
    };

    const handleRefresh = () => {
        loadEmails();
    };

    const filteredEmails = emails.filter(email => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            email.subject.toLowerCase().includes(query) ||
            email.from.toLowerCase().includes(query) ||
            email.from_name.toLowerCase().includes(query) ||
            email.body.toLowerCase().includes(query)
        );
    });

    const drawer = (
        <Box sx={{ width: 250, p: 2 }}>
            <Button
                fullWidth
                variant="contained"
                startIcon={<Create />}
                onClick={handleCompose}
                sx={{ mb: 2 }}
            >
                Написать
            </Button>

            <List>
                {folders.map((folder) => (
                    <ListItem key={folder.id} disablePadding>
                        <ListItemButton
                            selected={selectedFolder === folder.id}
                            onClick={() => {
                                setSelectedFolder(folder.id);
                                setSelectedEmail(null);
                            }}
                        >
                            <ListItemIcon>
                                <Badge badgeContent={folder.badge} color="primary">
                                    {folder.icon}
                                </Badge>
                            </ListItemIcon>
                            <ListItemText primary={folder.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ px: 2, mb: 1 }}>
                Метки
            </Typography>
            <List>
                {labels.map((label) => (
                    <ListItem key={label.id} disablePadding>
                        <ListItemButton>
                            <ListItemIcon>
                                <Label color={label.color as any} />
                            </ListItemIcon>
                            <ListItemText primary={label.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 112px)' }}>
            <Drawer
                variant="persistent"
                anchor="left"
                open={drawerOpen}
                sx={{
                    width: drawerOpen ? 250 : 0,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: 250,
                        boxSizing: 'border-box',
                        position: 'relative',
                        height: '100%',
                    },
                }}
            >
                {drawer}
            </Drawer>

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Поиск писем..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item>
                            <IconButton onClick={handleRefresh}>
                                <Refresh />
                            </IconButton>
                            <IconButton>
                                <Archive />
                            </IconButton>
                            <IconButton>
                                <MoreVert />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Paper>

                <Paper sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex' }}>
                    <Box sx={{ width: selectedEmail ? '40%' : '100%', borderRight: selectedEmail ? 1 : 0, borderColor: 'divider', overflow: 'auto' }}>
                        <List>
                            {loading ? (
                                <ListItem>
                                    <ListItemText primary="Загрузка..." />
                                </ListItem>
                            ) : filteredEmails.length === 0 ? (
                                <ListItem>
                                    <ListItemText primary="Нет писем" secondary="В этой папке пока нет писем" />
                                </ListItem>
                            ) : (
                                filteredEmails.map((email) => (
                                    <React.Fragment key={email.id}>
                                        <ListItem
                                            onClick={() => handleEmailClick(email)}
                                            sx={{
                                                cursor: 'pointer',
                                                bgcolor: selectedEmail?.id === email.id ? 'action.selected' : 'inherit',
                                                '&:hover': { bgcolor: 'action.hover' },
                                            }}
                                        >
                                            <ListItemIcon>
                                                <IconButton size="small" onClick={(e) => handleStarToggle(email, e)}>
                                                    {email.is_starred ? <Star color="warning" /> : <StarBorder />}
                                                </IconButton>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{ fontWeight: email.is_read ? 'normal' : 'bold' }}
                                                        >
                                                            {email.from_name || email.from}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(email.date).toLocaleDateString('ru-RU')}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ fontWeight: email.is_read ? 'normal' : 'bold' }}
                                                            noWrap
                                                        >
                                                            {email.subject}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" noWrap>
                                                            {email.body}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                            {email.has_attachment && (
                                                <ListItemSecondaryAction>
                                                    <AttachFile fontSize="small" />
                                                </ListItemSecondaryAction>
                                            )}
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ))
                            )}
                        </List>
                    </Box>

                    {selectedEmail && (
                        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                            <EmailView
                                email={selectedEmail}
                                onClose={() => setSelectedEmail(null)}
                                onReply={() => handleReply(selectedEmail)}
                                onDelete={() => handleDelete(selectedEmail)}
                            />
                        </Box>
                    )}
                </Paper>
            </Box>

            <ComposeEmail
                open={composeOpen}
                onClose={() => {
                    setComposeOpen(false);
                    setReplyTo(null);
                }}
                replyTo={replyTo}
                onSend={async (emailData) => {
                    try {
                        await apiClient.post('/api/email/send', emailData);
                        uiStore.showNotification('Письмо отправлено', 'success');
                        setComposeOpen(false);
                        if (selectedFolder === 'sent') {
                            loadEmails();
                        }
                    } catch (error) {
                        uiStore.showNotification('Ошибка отправки письма', 'error');
                    }
                }}
            />
        </Box>
    );
});

export default EmailClient;
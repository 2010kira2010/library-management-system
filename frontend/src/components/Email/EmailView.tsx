import React from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Avatar,
    Chip,
    Divider,
    Button,
    Menu,
    MenuItem,
    Tooltip,
} from '@mui/material';
import {
    Close,
    Reply,
    ReplyAll,
    Forward,
    Delete,
    Archive,
    Print,
    MoreVert,
    StarBorder,
    Star,
    AttachFile,
    GetApp,
    Label,
} from '@mui/icons-material';

interface EmailViewProps {
    email: any;
    onClose: () => void;
    onReply: () => void;
    onDelete: () => void;
}

const EmailView: React.FC<EmailViewProps> = ({
                                                 email,
                                                 onClose,
                                                 onReply,
                                                 onDelete,
                                             }) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleForward = () => {
        // TODO: Implement forward functionality
        console.log('Forward email');
    };

    const handleReplyAll = () => {
        // TODO: Implement reply all functionality
        console.log('Reply to all');
    };

    const formatEmailBody = (body: string) => {
        // Простое форматирование текста
        return body
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/\n/g, '<br />');
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Заголовок */}
            <Paper sx={{ p: 2, borderRadius: 0 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
                        {email.subject}
                    </Typography>
                    <Box>
                        <IconButton size="small" onClick={onClose}>
                            <Close />
                        </IconButton>
                    </Box>
                </Box>

                {/* Действия */}
                <Box display="flex" gap={1} mt={2}>
                    <Button
                        size="small"
                        startIcon={<Reply />}
                        onClick={onReply}
                    >
                        Ответить
                    </Button>
                    <Button
                        size="small"
                        startIcon={<ReplyAll />}
                        onClick={handleReplyAll}
                    >
                        Ответить всем
                    </Button>
                    <Button
                        size="small"
                        startIcon={<Forward />}
                        onClick={handleForward}
                    >
                        Переслать
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton size="small">
                        {email.is_starred ? <Star color="warning" /> : <StarBorder />}
                    </IconButton>
                    <IconButton size="small" onClick={onDelete}>
                        <Delete />
                    </IconButton>
                    <IconButton size="small">
                        <Archive />
                    </IconButton>
                    <IconButton size="small" onClick={handlePrint}>
                        <Print />
                    </IconButton>
                    <IconButton size="small" onClick={handleMenuClick}>
                        <MoreVert />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={handleMenuClose}>
                            <Label sx={{ mr: 1 }} />
                            Добавить метку
                        </MenuItem>
                        <MenuItem onClick={handleMenuClose}>
                            Пометить как спам
                        </MenuItem>
                        <MenuItem onClick={handleMenuClose}>
                            Показать оригинал
                        </MenuItem>
                    </Menu>
                </Box>
            </Paper>

            {/* Информация об отправителе */}
            <Paper sx={{ p: 2, mt: 1, borderRadius: 0 }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 48, height: 48 }}>
                        {email.from_name?.[0] || email.from[0]}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                                {email.from_name || email.from}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                &lt;{email.from}&gt;
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" color="text.secondary">
                                Кому: {email.to}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date(email.date).toLocaleString('ru-RU')}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Метки */}
                {email.labels && email.labels.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        {email.labels.map((label: string, index: number) => (
                            <Chip
                                key={index}
                                label={label}
                                size="small"
                                color={
                                    label === 'Важное' ? 'error' :
                                        label === 'Работа' ? 'primary' :
                                            label === 'Личное' ? 'success' :
                                                'default'
                                }
                            />
                        ))}
                    </Box>
                )}
            </Paper>

            {/* Тело письма */}
            <Paper sx={{ flexGrow: 1, p: 3, mt: 1, borderRadius: 0, overflow: 'auto' }}>
                <Typography
                    variant="body1"
                    dangerouslySetInnerHTML={{ __html: formatEmailBody(email.body) }}
                    sx={{
                        '& strong': { fontWeight: 'bold' },
                        '& em': { fontStyle: 'italic' },
                        '& u': { textDecoration: 'underline' },
                    }}
                />

                {/* Вложения */}
                {email.attachments && email.attachments.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="subtitle2" gutterBottom>
                            Вложения ({email.attachments.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {email.attachments.map((attachment: any, index: number) => (
                                <Paper
                                    key={index}
                                    variant="outlined"
                                    sx={{
                                        p: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    <AttachFile fontSize="small" />
                                    <Box>
                                        <Typography variant="body2">
                                            {attachment.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {(attachment.size / 1024).toFixed(1)} KB
                                        </Typography>
                                    </Box>
                                    <Tooltip title="Скачать">
                                        <IconButton size="small">
                                            <GetApp fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Paper>
                            ))}
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default EmailView;
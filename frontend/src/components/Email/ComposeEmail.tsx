import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    IconButton,
    Typography,
    Chip,
    Paper,
    Divider,
} from '@mui/material';
import {
    Close,
    Send,
    AttachFile,
    Save,
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    FormatListBulleted,
    FormatListNumbered,
    Link,
} from '@mui/icons-material';

interface ComposeEmailProps {
    open: boolean;
    onClose: () => void;
    replyTo?: any;
    onSend: (emailData: EmailData) => Promise<void>;
}

interface EmailData {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    attachments?: File[];
    is_draft?: boolean;
}

const ComposeEmail: React.FC<ComposeEmailProps> = ({
                                                       open,
                                                       onClose,
                                                       replyTo,
                                                       onSend,
                                                   }) => {
    const [emailData, setEmailData] = useState<EmailData>({
        to: [],
        cc: [],
        bcc: [],
        subject: '',
        body: '',
        attachments: [],
    });
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);
    const [sending, setSending] = useState(false);
    const [toInput, setToInput] = useState('');
    const [ccInput, setCcInput] = useState('');
    const [bccInput, setBccInput] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            if (replyTo) {
                setEmailData({
                    to: [replyTo.from],
                    cc: [],
                    bcc: [],
                    subject: `Re: ${replyTo.subject}`,
                    body: `\n\n-------- Исходное сообщение --------\nОт: ${replyTo.from_name} <${replyTo.from}>\nДата: ${new Date(replyTo.date).toLocaleString('ru-RU')}\nТема: ${replyTo.subject}\n\n${replyTo.body}`,
                    attachments: [],
                });
                setToInput(replyTo.from);
            } else {
                setEmailData({
                    to: [],
                    cc: [],
                    bcc: [],
                    subject: '',
                    body: '',
                    attachments: [],
                });
                setToInput('');
                setCcInput('');
                setBccInput('');
            }
            setErrors({});
            setShowCc(false);
            setShowBcc(false);
        }
    }, [open, replyTo]);

    const handleAddEmail = (field: 'to' | 'cc' | 'bcc', email: string) => {
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailData(prev => ({
                ...prev,
                [field]: [...(prev[field] || []), email],
            }));
            if (field === 'to') setToInput('');
            if (field === 'cc') setCcInput('');
            if (field === 'bcc') setBccInput('');
        }
    };

    const handleRemoveEmail = (field: 'to' | 'cc' | 'bcc', index: number) => {
        setEmailData(prev => ({
            ...prev,
            [field]: prev[field]?.filter((_, i) => i !== index) || [],
        }));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setEmailData(prev => ({
            ...prev,
            attachments: [...(prev.attachments || []), ...files],
        }));
    };

    const handleRemoveAttachment = (index: number) => {
        setEmailData(prev => ({
            ...prev,
            attachments: prev.attachments?.filter((_, i) => i !== index) || [],
        }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (emailData.to.length === 0 && toInput.trim() === '') {
            newErrors.to = 'Укажите хотя бы одного получателя';
        }

        if (!emailData.subject.trim()) {
            newErrors.subject = 'Укажите тему письма';
        }

        if (!emailData.body.trim()) {
            newErrors.body = 'Напишите текст письма';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSend = async () => {
        // Добавляем незавершенные email адреса
        if (toInput.trim()) handleAddEmail('to', toInput.trim());
        if (ccInput.trim()) handleAddEmail('cc', ccInput.trim());
        if (bccInput.trim()) handleAddEmail('bcc', bccInput.trim());

        if (!validate()) return;

        setSending(true);
        try {
            await onSend(emailData);
            onClose();
        } catch (error) {
            console.error('Error sending email:', error);
        } finally {
            setSending(false);
        }
    };

    const handleSaveDraft = async () => {
        try {
            await onSend({ ...emailData, is_draft: true });
            onClose();
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    };

    const formatText = (format: string) => {
        // Простая реализация форматирования текста
        const textarea = document.getElementById('email-body') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = emailData.body.substring(start, end);

        let formattedText = '';
        switch (format) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                break;
            case 'underline':
                formattedText = `__${selectedText}__`;
                break;
            default:
                return;
        }

        const newText =
            emailData.body.substring(0, start) +
            formattedText +
            emailData.body.substring(end);

        setEmailData(prev => ({ ...prev, body: newText }));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { height: '80vh' }
            }}
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        {replyTo ? 'Ответить на письмо' : 'Новое письмо'}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Получатели */}
                    <Box>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" sx={{ minWidth: 60 }}>
                                Кому:
                            </Typography>
                            <Box sx={{ flexGrow: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {emailData.to.map((email, index) => (
                                    <Chip
                                        key={index}
                                        label={email}
                                        size="small"
                                        onDelete={() => handleRemoveEmail('to', index)}
                                    />
                                ))}
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={toInput}
                                    onChange={(e) => setToInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddEmail('to', toInput);
                                        }
                                    }}
                                    placeholder="Введите email"
                                    error={!!errors.to}
                                    helperText={errors.to}
                                    variant="standard"
                                />
                            </Box>
                            <Box>
                                <Button size="small" onClick={() => setShowCc(!showCc)}>
                                    Копия
                                </Button>
                                <Button size="small" onClick={() => setShowBcc(!showBcc)}>
                                    Скрытая
                                </Button>
                            </Box>
                        </Box>
                    </Box>

                    {/* Копия */}
                    {showCc && (
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" sx={{ minWidth: 60 }}>
                                Копия:
                            </Typography>
                            <Box sx={{ flexGrow: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {emailData.cc?.map((email, index) => (
                                    <Chip
                                        key={index}
                                        label={email}
                                        size="small"
                                        onDelete={() => handleRemoveEmail('cc', index)}
                                    />
                                ))}
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={ccInput}
                                    onChange={(e) => setCcInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddEmail('cc', ccInput);
                                        }
                                    }}
                                    placeholder="Введите email"
                                    variant="standard"
                                />
                            </Box>
                        </Box>
                    )}

                    {/* Скрытая копия */}
                    {showBcc && (
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" sx={{ minWidth: 60 }}>
                                Скрытая:
                            </Typography>
                            <Box sx={{ flexGrow: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {emailData.bcc?.map((email, index) => (
                                    <Chip
                                        key={index}
                                        label={email}
                                        size="small"
                                        onDelete={() => handleRemoveEmail('bcc', index)}
                                    />
                                ))}
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={bccInput}
                                    onChange={(e) => setBccInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddEmail('bcc', bccInput);
                                        }
                                    }}
                                    placeholder="Введите email"
                                    variant="standard"
                                />
                            </Box>
                        </Box>
                    )}

                    {/* Тема */}
                    <TextField
                        fullWidth
                        label="Тема"
                        value={emailData.subject}
                        onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                        error={!!errors.subject}
                        helperText={errors.subject}
                    />

                    {/* Панель форматирования */}
                    <Paper variant="outlined" sx={{ p: 1, display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => formatText('bold')}>
                            <FormatBold />
                        </IconButton>
                        <IconButton size="small" onClick={() => formatText('italic')}>
                            <FormatItalic />
                        </IconButton>
                        <IconButton size="small" onClick={() => formatText('underline')}>
                            <FormatUnderlined />
                        </IconButton>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                        <IconButton size="small">
                            <FormatListBulleted />
                        </IconButton>
                        <IconButton size="small">
                            <FormatListNumbered />
                        </IconButton>
                        <IconButton size="small">
                            <Link />
                        </IconButton>
                    </Paper>

                    {/* Текст письма */}
                    <TextField
                        id="email-body"
                        fullWidth
                        multiline
                        rows={10}
                        value={emailData.body}
                        onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                        error={!!errors.body}
                        helperText={errors.body}
                        placeholder="Напишите ваше сообщение..."
                    />

                    {/* Вложения */}
                    <Box>
                        <input
                            type="file"
                            multiple
                            style={{ display: 'none' }}
                            id="email-attachments"
                            onChange={handleFileUpload}
                        />
                        <label htmlFor="email-attachments">
                            <Button
                                component="span"
                                startIcon={<AttachFile />}
                                size="small"
                            >
                                Прикрепить файлы
                            </Button>
                        </label>
                        {emailData.attachments && emailData.attachments.length > 0 && (
                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {emailData.attachments.map((file, index) => (
                                    <Chip
                                        key={index}
                                        label={`${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                                        onDelete={() => handleRemoveAttachment(index)}
                                        size="small"
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleSaveDraft} startIcon={<Save />}>
                    Сохранить черновик
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button onClick={onClose}>
                    Отмена
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={sending}
                    startIcon={<Send />}
                >
                    {sending ? 'Отправка...' : 'Отправить'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ComposeEmail;
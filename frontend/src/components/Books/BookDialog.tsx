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
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useRootStore } from '../../stores/RootStore';

interface BookDialogProps {
    open: boolean;
    book: any | null;
    onClose: () => void;
    onSave: (bookData: any) => Promise<void>;
}

const BookDialog: React.FC<BookDialogProps> = observer(({
                                                            open,
                                                            book,
                                                            onClose,
                                                            onSave,
                                                        }) => {
    const { authorStore, publisherStore } = useRootStore();
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        short_title: '',
        author_id: '',
        publisher_id: '',
        publication_year: '',
        barcode: '',
        isbn: '',
        bbk: '',
        udk: '',
        class_range: '',
        location: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (open) {
            // Загружаем авторов и издательства
            authorStore.loadAuthors();
            publisherStore.loadPublishers();

            // Заполняем форму данными книги или очищаем
            if (book) {
                setFormData({
                    code: book.code || '',
                    title: book.title || '',
                    short_title: book.short_title || '',
                    author_id: book.author_id || '',
                    publisher_id: book.publisher_id || '',
                    publication_year: book.publication_year || '',
                    barcode: book.barcode || '',
                    isbn: book.isbn || '',
                    bbk: book.bbk || '',
                    udk: book.udk || '',
                    class_range: book.class_range || '',
                    location: book.location || '',
                });
            } else {
                setFormData({
                    code: '',
                    title: '',
                    short_title: '',
                    author_id: '',
                    publisher_id: '',
                    publication_year: '',
                    barcode: '',
                    isbn: '',
                    bbk: '',
                    udk: '',
                    class_range: '',
                    location: '',
                });
            }
            setErrors({});
        }
    }, [open, book]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: typeof formData) => ({
            ...prev,
            [field]: value,
        }));
        // Очищаем ошибку поля при изменении
        if (errors[field]) {
            setErrors((prev: any) => ({
                ...prev,
                [field]: '',
            }));
        }
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Название книги обязательно';
        }

        if (!formData.barcode.trim()) {
            newErrors.barcode = 'Штрих-код обязателен';
        }

        if (formData.publication_year && (
            parseInt(formData.publication_year) < 1900 ||
            parseInt(formData.publication_year) > new Date().getFullYear()
        )) {
            newErrors.publication_year = 'Некорректный год издания';
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
            // Преобразуем пустые строки в null для числовых полей
            const dataToSave = {
                ...formData,
                author_id: formData.author_id || null,
                publisher_id: formData.publisher_id || null,
                publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
            };

            await onSave(dataToSave);
            onClose();
        } catch (error) {
            console.error('Error saving book:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            disableEscapeKeyDown={loading}
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        {book ? 'Редактировать книгу' : 'Добавить книгу'}
                    </Typography>
                    <IconButton onClick={handleClose} disabled={loading}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mt: 1 }}>
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
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Полное наименование"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                required
                                error={!!errors.title}
                                helperText={errors.title}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Краткое наименование"
                                value={formData.short_title}
                                onChange={(e) => handleChange('short_title', e.target.value)}
                                helperText="Используется в отчетах"
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Автор"
                                value={formData.author_id}
                                onChange={(e) => handleChange('author_id', e.target.value)}
                                disabled={loading}
                            >
                                <MenuItem value="">
                                    <em>Не указан</em>
                                </MenuItem>
                                {authorStore.authors.map((author) => (
                                    <MenuItem key={author.id} value={author.id}>
                                        {author.short_name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Издательство"
                                value={formData.publisher_id}
                                onChange={(e) => handleChange('publisher_id', e.target.value)}
                                disabled={loading}
                            >
                                <MenuItem value="">
                                    <em>Не указано</em>
                                </MenuItem>
                                {publisherStore.publishers.map((publisher) => (
                                    <MenuItem key={publisher.id} value={publisher.id}>
                                        {publisher.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Год издания"
                                type="number"
                                value={formData.publication_year}
                                onChange={(e) => handleChange('publication_year', e.target.value)}
                                error={!!errors.publication_year}
                                helperText={errors.publication_year}
                                InputProps={{
                                    inputProps: {
                                        min: 1900,
                                        max: new Date().getFullYear()
                                    }
                                }}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="ISBN"
                                value={formData.isbn}
                                onChange={(e) => handleChange('isbn', e.target.value)}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Класс"
                                value={formData.class_range}
                                onChange={(e) => handleChange('class_range', e.target.value)}
                                helperText="Например: 5-7"
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="ББК"
                                value={formData.bbk}
                                onChange={(e) => handleChange('bbk', e.target.value)}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="УДК"
                                value={formData.udk}
                                onChange={(e) => handleChange('udk', e.target.value)}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Место размещения"
                                value={formData.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                helperText="Шкаф, полка и т.д."
                                disabled={loading}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Отмена
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !formData.title || !formData.barcode}
                >
                    {loading ? 'Сохранение...' : (book ? 'Сохранить' : 'Добавить')}
                </Button>
            </DialogActions>
        </Dialog>
    );
});

export default BookDialog;
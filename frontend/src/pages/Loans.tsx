import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
} from '@mui/material';
import {
    QrCodeScanner,
    Person,
    Book,
    CheckCircle,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useRootStore } from '../stores/RootStore';
import BarcodeScanner from '../components/Common/BarcodeScanner';
import api from '../services/api';
//import ExportDialog from '../components/Common/ExportDialog';
//import { exportLoansToExcel } from '../utils/excelUtils';
//import loanStore from "../stores/LoanStore";

const Loans: React.FC = observer(() => {
    const { uiStore } = useRootStore();
    const [scanMode, setScanMode] = useState<'reader' | 'book' | null>(null);
    const [readerData, setReaderData] = useState<any>(null);
    const [bookData, setBookData] = useState<any>(null);
    const [issuedBooks, setIssuedBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    //const [exportDialogOpen, setExportDialogOpen] = useState(false);

    const handleScanReader = async (barcode: string) => {
        try {
            const response = await api.getReaderByBarcode(barcode);
            setReaderData(response.data);
            setScanMode(null);
            uiStore.showNotification('Абонент найден', 'success');
        } catch (error) {
            uiStore.showNotification('Абонент не найден', 'error');
            setScanMode(null);
        }
    };

    const handleScanBook = async (barcode: string) => {
        try {
            const response = await api.getBookByBarcode(barcode);
            const book = response.data;

            if (!book.is_available) {
                uiStore.showNotification('Книга уже выдана', 'error');
                setScanMode(null);
                return;
            }

            setBookData(book);
            setScanMode(null);

            // Если абонент уже выбран, сразу выдаем книгу
            if (readerData) {
                await issueBook();
            }
        } catch (error) {
            uiStore.showNotification('Книга не найдена', 'error');
            setScanMode(null);
        }
    };

    const issueBook = async () => {
        if (!readerData || !bookData) return;

        setLoading(true);
        try {
            const response = await api.issueBook(bookData.barcode, readerData.barcode);

            setIssuedBooks([...issuedBooks, response.data.loan]);
            uiStore.showNotification('Книга успешно выдана', 'success');

            // Очищаем данные о книге для следующей выдачи
            setBookData(null);
        } catch (error: any) {
            uiStore.showNotification(
                error.response?.data?.error || 'Ошибка при выдаче книги',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const startNewSession = () => {
        setReaderData(null);
        setBookData(null);
        setIssuedBooks([]);
    };


    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Выдача книг
            </Typography>

            <Grid container spacing={3}>
                {/* Левая панель - Абонент */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Абонент
                            </Typography>

                            {!readerData ? (
                                <Box>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<QrCodeScanner />}
                                        onClick={() => setScanMode('reader')}
                                        size="large"
                                    >
                                        Сканировать карту абонента
                                    </Button>
                                </Box>
                            ) : (
                                <Box>
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        Абонент выбран
                                    </Alert>

                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <Avatar sx={{ width: 56, height: 56 }}>
                                            <Person />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6">
                                                {readerData.last_name} {readerData.first_name} {readerData.middle_name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Класс: {readerData.grade} • Штрих-код: {readerData.barcode}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Книг на руках: {readerData.active_loans_count || 0}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Button onClick={startNewSession} size="small">
                                        Выбрать другого абонента
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Правая панель - Книга */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Книга
                            </Typography>

                            {!bookData ? (
                                <Box>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<QrCodeScanner />}
                                        onClick={() => setScanMode('book')}
                                        size="large"
                                        disabled={!readerData}
                                    >
                                        Сканировать штрих-код книги
                                    </Button>
                                    {!readerData && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            Сначала выберите абонента
                                        </Typography>
                                    )}
                                </Box>
                            ) : (
                                <Box>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        Книга готова к выдаче
                                    </Alert>

                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <Avatar sx={{ width: 56, height: 56 }}>
                                            <Book />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6">
                                                {bookData.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Автор: {bookData.author?.short_name || '-'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Штрих-код: {bookData.barcode}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box display="flex" gap={2}>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            onClick={issueBook}
                                            disabled={loading || !readerData}
                                            fullWidth
                                        >
                                            Выдать книгу
                                        </Button>
                                        <Button
                                            onClick={() => setBookData(null)}
                                            disabled={loading}
                                        >
                                            Отмена
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Список выданных книг */}
                {issuedBooks.length > 0 && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Выданные книги в этой сессии
                            </Typography>

                            <List>
                                {issuedBooks.map((loan, index) => (
                                    <ListItem key={index}>
                                        <ListItemAvatar>
                                            <Avatar>
                                                <CheckCircle color="success" />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={loan.book.title}
                                            secondary={`Выдано: ${format(new Date(loan.issue_date), 'dd.MM.yyyy HH:mm', { locale: ru })}`}
                                        />
                                        <Chip
                                            label={loan.book.barcode}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* Сканер штрих-кодов */}
            <BarcodeScanner
                open={scanMode !== null}
                onClose={() => setScanMode(null)}
                onScan={scanMode === 'reader' ? handleScanReader : handleScanBook}
                title={scanMode === 'reader' ? 'Сканирование карты абонента' : 'Сканирование книги'}
            />
        </Box>
    );
});

export default Loans;
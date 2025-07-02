import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Box,
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Alert,
    Divider,
    Card,
    CardContent,
    IconButton,
} from '@mui/material';
import {
    QrCodeScanner,
    Book,
    CheckCircle,
    Delete,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useRootStore } from '../stores/RootStore';
import BarcodeScanner from '../components/Common/BarcodeScanner';
import api from '../services/api';

const Returns: React.FC = observer(() => {
    const { uiStore, loanStore } = useRootStore();
    const [scanMode, setScanMode] = useState(false);
    const [returnMode, setReturnMode] = useState<'single' | 'batch'>('single');
    const [scannedBooks, setScannedBooks] = useState<any[]>([]);
    const [returnedBooks, setReturnedBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleScanBook = async (barcode: string) => {
        if (returnMode === 'single') {
            // Одиночный возврат - сразу возвращаем
            await returnSingleBook(barcode);
        } else {
            // Массовый возврат - добавляем в список
            try {
                const response = await api.getBookByBarcode(barcode);
                const book = response.data;

                // Проверяем, не добавлена ли уже эта книга
                if (scannedBooks.some(b => b.barcode === barcode)) {
                    uiStore.showNotification('Эта книга уже в списке', 'warning');
                    return;
                }

                setScannedBooks([...scannedBooks, book]);
                uiStore.showNotification('Книга добавлена в список возврата', 'info');
            } catch (error) {
                uiStore.showNotification('Книга не найдена', 'error');
            }
        }
        setScanMode(false);
    };

    const returnSingleBook = async (barcode: string) => {
        setLoading(true);
        try {
            const result = await loanStore.returnBook(barcode);
            setReturnedBooks([...returnedBooks, result]);
        } catch (error: any) {
            // Ошибка уже обработана в store
        } finally {
            setLoading(false);
        }
    };

    const processBatchReturn = async () => {
        if (scannedBooks.length === 0) return;

        setLoading(true);
        const barcodes = scannedBooks.map(book => book.barcode);

        try {
            const results = await loanStore.returnBooksBatch(barcodes);

            // Добавляем успешно возвращенные книги
            setReturnedBooks([...returnedBooks, ...results.success]);

            // Очищаем список отсканированных книг
            setScannedBooks([]);

            // Показываем результаты
            if (results.failed.length > 0) {
                uiStore.showNotification(
                    `Возвращено: ${results.success.length}, Ошибок: ${results.failed.length}`,
                    'warning'
                );
            } else {
                uiStore.showNotification(
                    `Все книги успешно возвращены (${results.success.length})`,
                    'success'
                );
            }
        } catch (error) {
            uiStore.showNotification('Ошибка при массовом возврате', 'error');
        } finally {
            setLoading(false);
        }
    };

    const removeFromScannedList = (barcode: string) => {
        setScannedBooks(scannedBooks.filter(book => book.barcode !== barcode));
    };

    const clearAll = () => {
        setScannedBooks([]);
        setReturnedBooks([]);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Возврат книг
            </Typography>

            {/* Выбор режима */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Режим возврата
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant={returnMode === 'single' ? 'contained' : 'outlined'}
                        onClick={() => {
                            setReturnMode('single');
                            setScannedBooks([]);
                        }}
                    >
                        Одиночный возврат
                    </Button>
                    <Button
                        variant={returnMode === 'batch' ? 'contained' : 'outlined'}
                        onClick={() => setReturnMode('batch')}
                    >
                        Массовый возврат (без абонента)
                    </Button>
                </Box>
            </Paper>

            {/* Основная область */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<QrCodeScanner />}
                        onClick={() => setScanMode(true)}
                        disabled={loading}
                        sx={{ mb: 2 }}
                    >
                        Сканировать штрих-код книги
                    </Button>

                    {returnMode === 'single' ? (
                        <Alert severity="info">
                            Отсканируйте штрих-код книги для мгновенного возврата
                        </Alert>
                    ) : (
                        <Alert severity="info">
                            Отсканируйте все книги, затем нажмите "Оформить возврат"
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Список отсканированных книг для массового возврата */}
            {returnMode === 'batch' && scannedBooks.length > 0 && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Книги для возврата ({scannedBooks.length})
                    </Typography>
                    <List>
                        {scannedBooks.map((book, index) => (
                            <ListItem
                                key={index}
                                secondaryAction={
                                    <IconButton
                                        edge="end"
                                        onClick={() => removeFromScannedList(book.barcode)}
                                    >
                                        <Delete />
                                    </IconButton>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar>
                                        <Book />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={book.title}
                                    secondary={`Штрих-код: ${book.barcode}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={processBatchReturn}
                            disabled={loading}
                            fullWidth
                        >
                            Оформить возврат всех книг
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => setScannedBooks([])}
                            disabled={loading}
                        >
                            Очистить список
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Список возвращенных книг */}
            {returnedBooks.length > 0 && (
                <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Возвращенные книги ({returnedBooks.length})
                        </Typography>
                        <Button size="small" onClick={clearAll}>
                            Очистить историю
                        </Button>
                    </Box>
                    <List>
                        {returnedBooks.map((loan, index) => (
                            <ListItem key={index}>
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'success.main' }}>
                                        <CheckCircle />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={loan.book.title}
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" component="span">
                                                Читатель: {loan.reader.last_name} {loan.reader.first_name}
                                            </Typography>
                                            <br />
                                            <Typography variant="body2" component="span">
                                                Возвращено: {format(new Date(loan.return_date), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <Chip
                                    label={`${loan.days_on_loan} дней`}
                                    color={loan.days_on_loan > 30 ? 'error' : 'default'}
                                    size="small"
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            {/* Сканер штрих-кодов */}
            <BarcodeScanner
                open={scanMode}
                onClose={() => setScanMode(false)}
                onScan={handleScanBook}
                title="Сканирование книги для возврата"
            />
        </Box>
    );
});

export default Returns;
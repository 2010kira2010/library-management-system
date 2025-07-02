import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Alert,
    Divider,
} from '@mui/material';
import { QrCodeScanner } from '@mui/icons-material';

interface BarcodeScannerProps {
    open: boolean;
    onClose: () => void;
    onScan: (barcode: string) => void;
    title?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
                                                           open,
                                                           onClose,
                                                           onScan,
                                                           title = 'Сканирование штрих-кода',
                                                       }) => {
    const [manualBarcode, setManualBarcode] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState('');
    const barcodeBuffer = useRef('');
    const lastKeyTime = useRef(0);

    useEffect(() => {
        if (open) {
            setIsListening(true);
            barcodeBuffer.current = '';
            setScannedBarcode('');
            setManualBarcode('');
        } else {
            setIsListening(false);
        }
    }, [open]);

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (!isListening || !open) return;

            const currentTime = Date.now();

            // Если прошло больше 100мс с последнего нажатия, сбрасываем буфер
            if (currentTime - lastKeyTime.current > 100) {
                barcodeBuffer.current = '';
            }

            lastKeyTime.current = currentTime;

            // Enter означает конец сканирования
            if (event.key === 'Enter' && barcodeBuffer.current.length > 0) {
                const barcode = barcodeBuffer.current;
                setScannedBarcode(barcode);
                barcodeBuffer.current = '';

                // Автоматически вызываем onScan через небольшую задержку
                setTimeout(() => {
                    onScan(barcode);
                    onClose();
                }, 500);
            } else if (event.key.length === 1) {
                // Добавляем символ в буфер
                barcodeBuffer.current += event.key;
            }
        };

        if (isListening) {
            window.addEventListener('keypress', handleKeyPress);
            return () => {
                window.removeEventListener('keypress', handleKeyPress);
            };
        }
    }, [isListening, open, onScan, onClose]);

    const handleManualSubmit = () => {
        if (manualBarcode.trim()) {
            onScan(manualBarcode.trim());
            onClose();
        }
    };

    const handleClose = () => {
        setIsListening(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <QrCodeScanner />
                    {title}
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    {scannedBarcode ? (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            Штрих-код отсканирован: <strong>{scannedBarcode}</strong>
                        </Alert>
                    ) : (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Поднесите штрих-код к сканеру или введите вручную
                        </Alert>
                    )}

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Ожидание сканирования...
                    </Typography>

                    <Divider sx={{ my: 3 }}>или</Divider>

                    <TextField
                        fullWidth
                        label="Введите штрих-код вручную"
                        value={manualBarcode}
                        onChange={(e) => setManualBarcode(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleManualSubmit();
                            }
                        }}
                        autoFocus
                        helperText="Нажмите Enter для подтверждения"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Отмена</Button>
                <Button
                    onClick={handleManualSubmit}
                    variant="contained"
                    disabled={!manualBarcode.trim()}
                >
                    Подтвердить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BarcodeScanner;
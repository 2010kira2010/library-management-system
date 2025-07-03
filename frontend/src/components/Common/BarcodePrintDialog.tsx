import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Paper,
} from '@mui/material';
import { Print, Settings } from '@mui/icons-material';
import JsBarcode from 'jsbarcode';

interface BarcodePrintDialogProps {
    open: boolean;
    onClose: () => void;
    items: Array<{
        id: number;
        title: string;
        barcode: string;
        author?: string;
    }>;
}

interface PrintSettings {
    width: number;
    height: number;
    fontSize: number;
    format: string;
    showText: boolean;
    columns: number;
    margin: number;
}

const BarcodePrintDialog: React.FC<BarcodePrintDialogProps> = ({
                                                                   open,
                                                                   onClose,
                                                                   items,
                                                               }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [settings, setSettings] = useState<PrintSettings>({
        width: 200,
        height: 100,
        fontSize: 10,
        format: 'CODE128',
        showText: true,
        columns: 3,
        margin: 5,
    });

    const handleSettingChange = (field: keyof PrintSettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const generateBarcodes = () => {
        if (!printRef.current) return;

        // Очищаем предыдущие штрих-коды
        printRef.current.innerHTML = '';

        items.forEach((item, index) => {
            const container = document.createElement('div');
            container.style.padding = `${settings.margin}px`;
            container.style.display = 'inline-block';
            container.style.width = `${settings.width}px`;
            container.style.textAlign = 'center';
            container.style.pageBreakInside = 'avoid';

            // Заголовок
            if (item.title) {
                const title = document.createElement('div');
                title.style.fontSize = `${settings.fontSize}px`;
                title.style.marginBottom = '5px';
                title.style.overflow = 'hidden';
                title.style.textOverflow = 'ellipsis';
                title.style.whiteSpace = 'nowrap';
                title.textContent = item.title;
                container.appendChild(title);
            }

            // Canvas для штрих-кода
            const canvas = document.createElement('canvas');
            container.appendChild(canvas);

            // Генерация штрих-кода
            try {
                JsBarcode(canvas, item.barcode, {
                    format: settings.format,
                    width: 2,
                    height: settings.height,
                    displayValue: settings.showText,
                    fontSize: settings.fontSize,
                    margin: 0,
                });
            } catch (error) {
                console.error('Error generating barcode:', error);
            }

            printRef.current?.appendChild(container);
        });
    };

    useEffect(() => {
        if (open) {
            generateBarcodes();
        }
    }, [open, items, settings]);

    const handlePrint = () => {
        const printContent = printRef.current?.innerHTML;
        if (!printContent) return;

        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Печать штрих-кодов</title>
                    <style>
                        @media print {
                            body { margin: 0; }
                            @page { margin: 10mm; }
                        }
                        body {
                            font-family: Arial, sans-serif;
                        }
                        .barcode-container {
                            display: flex;
                            flex-wrap: wrap;
                            justify-content: flex-start;
                        }
                    </style>
                </head>
                <body>
                    <div class="barcode-container">
                        ${printContent}
                    </div>
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        Печать штрих-кодов ({items.length} шт.)
                    </Typography>
                    <Settings />
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={3}>
                    {/* Настройки печати */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Настройки печати
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Ширина (px)"
                                        value={settings.width}
                                        onChange={(e) => handleSettingChange('width', parseInt(e.target.value))}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Высота (px)"
                                        value={settings.height}
                                        onChange={(e) => handleSettingChange('height', parseInt(e.target.value))}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Формат</InputLabel>
                                        <Select
                                            value={settings.format}
                                            label="Формат"
                                            onChange={(e) => handleSettingChange('format', e.target.value)}
                                        >
                                            <MenuItem value="CODE128">CODE128</MenuItem>
                                            <MenuItem value="CODE39">CODE39</MenuItem>
                                            <MenuItem value="EAN13">EAN13</MenuItem>
                                            <MenuItem value="UPC">UPC</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Размер шрифта"
                                        value={settings.fontSize}
                                        onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Отступ (px)"
                                        value={settings.margin}
                                        onChange={(e) => handleSettingChange('margin', parseInt(e.target.value))}
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Предпросмотр */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 2, minHeight: 400, overflow: 'auto' }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Предпросмотр
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box
                                ref={printRef}
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    justifyContent: 'flex-start',
                                }}
                            />
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Отмена</Button>
                <Button
                    onClick={handlePrint}
                    variant="contained"
                    startIcon={<Print />}
                >
                    Печать
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BarcodePrintDialog;
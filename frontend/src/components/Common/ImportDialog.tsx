import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    LinearProgress,
    Alert,
    Stepper,
    Step,
    StepLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
} from '@mui/material';
import { FileUpload, CloudUpload, CheckCircle, Error } from '@mui/icons-material';

interface ImportDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    templateUrl?: string;
    onImport: (file: File) => Promise<ImportResult>;
}

interface ImportResult {
    success: number;
    failed: number;
    errors?: Array<{
        row: number;
        error: string;
    }>;
}

const ImportDialog: React.FC<ImportDialogProps> = ({
                                                       open,
                                                       onClose,
                                                       title,
                                                       templateUrl,
                                                       onImport,
                                                   }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const steps = ['Выбор файла', 'Импорт данных', 'Результат'];

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                setError('Пожалуйста, выберите файл Excel (.xlsx или .xls)');
                return;
            }
            setSelectedFile(file);
            setError(null);
            setActiveStep(1);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        setIsImporting(true);
        setError(null);

        try {
            const result = await onImport(selectedFile);
            setImportResult(result);
            setActiveStep(2);
        } catch (err: any) {
            setError(err.message || 'Ошибка при импорте данных');
        } finally {
            setIsImporting(false);
        }
    };

    const handleReset = () => {
        setActiveStep(0);
        setSelectedFile(null);
        setImportResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />
                        <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Выберите файл для импорта
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Поддерживаются файлы Excel (.xlsx, .xls)
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<FileUpload />}
                            onClick={() => fileInputRef.current?.click()}
                            size="large"
                        >
                            Выбрать файл
                        </Button>
                        {templateUrl && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    <a href={templateUrl} download>
                                        Скачать шаблон для импорта
                                    </a>
                                </Typography>
                            </Box>
                        )}
                    </Box>
                );

            case 1:
                return (
                    <Box sx={{ py: 3 }}>
                        {selectedFile && (
                            <Alert severity="info" sx={{ mb: 3 }}>
                                Выбран файл: <strong>{selectedFile.name}</strong>
                            </Alert>
                        )}

                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        {isImporting ? (
                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Импорт данных...
                                </Typography>
                                <LinearProgress />
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body1" paragraph>
                                    Нажмите "Импортировать" для начала импорта данных
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={handleImport}
                                    size="large"
                                >
                                    Импортировать
                                </Button>
                            </Box>
                        )}
                    </Box>
                );

            case 2:
                return (
                    <Box sx={{ py: 3 }}>
                        {importResult && (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 3 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
                                        <Typography variant="h6">
                                            {importResult.success}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Успешно импортировано
                                        </Typography>
                                    </Box>
                                    {importResult.failed > 0 && (
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Error sx={{ fontSize: 48, color: 'error.main' }} />
                                            <Typography variant="h6">
                                                {importResult.failed}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                С ошибками
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {importResult.errors && importResult.errors.length > 0 && (
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Детали ошибок:
                                        </Typography>
                                        <TableContainer component={Paper} variant="outlined">
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Строка</TableCell>
                                                        <TableCell>Ошибка</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {importResult.errors.slice(0, 10).map((error, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>
                                                                <Chip
                                                                    label={error.row}
                                                                    size="small"
                                                                    color="error"
                                                                />
                                                            </TableCell>
                                                            <TableCell>{error.error}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        {importResult.errors.length > 10 && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mt: 1, textAlign: 'center' }}
                                            >
                                                ...и еще {importResult.errors.length - 10} ошибок
                                            </Typography>
                                        )}
                                    </Box>
                                )}

                                <Box sx={{ textAlign: 'center', mt: 3 }}>
                                    <Button variant="outlined" onClick={handleReset}>
                                        Импортировать еще
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 3 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {renderStepContent()}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    {activeStep === 2 ? 'Закрыть' : 'Отмена'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ImportDialog;
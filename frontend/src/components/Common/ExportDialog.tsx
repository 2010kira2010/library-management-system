import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    FormControlLabel,
    Checkbox,
    Box,
    Typography,
    LinearProgress,
    Alert,
} from '@mui/material';
import { FileDownload } from '@mui/icons-material';

interface ExportDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    fields: Array<{
        key: string;
        label: string;
        selected?: boolean;
    }>;
    onExport: (selectedFields: string[]) => Promise<void>;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
                                                       open,
                                                       onClose,
                                                       title,
                                                       fields,
                                                       onExport,
                                                   }) => {
    const [selectedFields, setSelectedFields] = useState<string[]>(
        fields.filter(f => f.selected !== false).map(f => f.key)
    );
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleToggleField = (fieldKey: string) => {
        setSelectedFields(prev => {
            if (prev.includes(fieldKey)) {
                return prev.filter(key => key !== fieldKey);
            }
            return [...prev, fieldKey];
        });
    };

    const handleSelectAll = () => {
        if (selectedFields.length === fields.length) {
            setSelectedFields([]);
        } else {
            setSelectedFields(fields.map(f => f.key));
        }
    };

    const handleExport = async () => {
        if (selectedFields.length === 0) {
            setError('Выберите хотя бы одно поле для экспорта');
            return;
        }

        setIsExporting(true);
        setError(null);

        try {
            await onExport(selectedFields);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Ошибка при экспорте данных');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Выберите поля для экспорта:
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedFields.length === fields.length}
                                indeterminate={
                                    selectedFields.length > 0 &&
                                    selectedFields.length < fields.length
                                }
                                onChange={handleSelectAll}
                            />
                        }
                        label="Выбрать все"
                        sx={{ mb: 1 }}
                    />

                    <Box sx={{ ml: 2 }}>
                        {fields.map(field => (
                            <FormControl key={field.key} fullWidth>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={selectedFields.includes(field.key)}
                                            onChange={() => handleToggleField(field.key)}
                                            disabled={isExporting}
                                        />
                                    }
                                    label={field.label}
                                />
                            </FormControl>
                        ))}
                    </Box>
                </Box>

                {isExporting && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Экспорт данных...
                        </Typography>
                        <LinearProgress />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isExporting}>
                    Отмена
                </Button>
                <Button
                    onClick={handleExport}
                    variant="contained"
                    startIcon={<FileDownload />}
                    disabled={isExporting || selectedFields.length === 0}
                >
                    Экспортировать
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ExportDialog;
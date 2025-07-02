import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    TextField,
    MenuItem,
} from '@mui/material';
import {
    Description,
    History,
    Class,
    Print,
    Download,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { useRootStore } from '../stores/RootStore';

const Reports: React.FC = () => {
    const { settingsStore } = useRootStore();
    const [selectedReport, setSelectedReport] = useState('');
    const [dateFrom, setDateFrom] = useState<Date | null>(null);
    const [dateTo, setDateTo] = useState<Date | null>(null);
    const [selectedClass, setSelectedClass] = useState('');

    const reports = [
        {
            id: 'book-availability',
            title: 'Остатки книг',
            description: 'Отчет о количестве, выдаче и остатке книг',
            icon: <Description sx={{ fontSize: 48 }} />,
            color: '#2196f3',
        },
        {
            id: 'loan-history',
            title: 'История пользования',
            description: 'История выдачи и возврата книг за период',
            icon: <History sx={{ fontSize: 48 }} />,
            color: '#4caf50',
        },
        {
            id: 'class-loans',
            title: 'Ведомость по классам',
            description: 'Ведомость выданных книг по классам',
            icon: <Class sx={{ fontSize: 48 }} />,
            color: '#ff9800',
        },
    ];

    const generateReport = (reportId: string) => {
        setSelectedReport(reportId);
        // TODO: Implement report generation
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Отчеты
            </Typography>

            <Grid container spacing={3}>
                {/* Карточки отчетов */}
                {reports.map((report) => (
                    <Grid item xs={12} sm={6} md={4} key={report.id}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Box sx={{ color: report.color, mb: 2 }}>
                                    {report.icon}
                                </Box>
                                <Typography variant="h6" component="div" gutterBottom>
                                    {report.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {report.description}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'center' }}>
                                <Button
                                    size="small"
                                    onClick={() => generateReport(report.id)}
                                >
                                    Сформировать
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}

                {/* Параметры отчета */}
                {selectedReport && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Параметры отчета
                            </Typography>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                {(selectedReport === 'loan-history') && (
                                    <>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <DatePicker
                                                label="Дата от"
                                                value={dateFrom}
                                                onChange={setDateFrom}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <DatePicker
                                                label="Дата до"
                                                value={dateTo}
                                                onChange={setDateTo}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                    </>
                                )}

                                {selectedReport === 'class-loans' && (
                                    <Grid item xs={12} sm={6} md={3}>
                                        <TextField
                                            fullWidth
                                            select
                                            label="Класс"
                                            value={selectedClass}
                                            onChange={(e) => setSelectedClass(e.target.value)}
                                        >
                                            {settingsStore.classes.map((cls) => (
                                                <MenuItem key={cls.id} value={cls.id}>
                                                    {cls.grade} "{cls.letter}"
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                )}
                            </Grid>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<Description />}
                                    onClick={() => console.log('Generate report')}
                                >
                                    Сформировать отчет
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<Print />}
                                >
                                    Печать
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<Download />}
                                >
                                    Экспорт в Excel
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default Reports;
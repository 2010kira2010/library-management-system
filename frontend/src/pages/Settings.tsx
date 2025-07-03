import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Box,
    Paper,
    Tabs,
    Tab,
    Typography,
    CircularProgress,
} from '@mui/material';
import {
    School,
    People,
    Business,
    Email,
} from '@mui/icons-material';
import { useRootStore } from '../stores/RootStore';
import ClassSettings from '../components/Settings/ClassSettings';
import StaffSettings from '../components/Settings/StaffSettings';
import OrganizationSettings from '../components/Settings/OrganizationSettings';
import EmailSettings from '../components/Settings/EmailSettings';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `settings-tab-${index}`,
        'aria-controls': `settings-tabpanel-${index}`,
    };
}

const Settings: React.FC = observer(() => {
    const { settingsStore } = useRootStore();
    const [value, setValue] = useState(0);

    // Загружаем настройки при монтировании компонента
    useEffect(() => {
        settingsStore.loadSettings();
    }, [settingsStore]);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    // Показываем загрузчик пока идет загрузка
    if (settingsStore.isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    // Показываем ошибку если она есть
    if (settingsStore.error) {
        return (
            <Box>
                <Typography variant="h4" gutterBottom>
                    Настройки системы
                </Typography>
                <Paper sx={{ p: 3, mt: 3 }}>
                    <Typography color="error">
                        Ошибка загрузки настроек: {settingsStore.error}
                    </Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Настройки системы
            </Typography>

            <Paper sx={{ width: '100%', mt: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={value}
                        onChange={handleChange}
                        aria-label="settings tabs"
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab
                            icon={<School />}
                            iconPosition="start"
                            label="Классы"
                            {...a11yProps(0)}
                        />
                        <Tab
                            icon={<People />}
                            iconPosition="start"
                            label="Сотрудники"
                            {...a11yProps(1)}
                        />
                        <Tab
                            icon={<Business />}
                            iconPosition="start"
                            label="Организация"
                            {...a11yProps(2)}
                        />
                        <Tab
                            icon={<Email />}
                            iconPosition="start"
                            label="Email"
                            {...a11yProps(3)}
                        />
                    </Tabs>
                </Box>

                <TabPanel value={value} index={0}>
                    <ClassSettings />
                </TabPanel>
                <TabPanel value={value} index={1}>
                    <StaffSettings />
                </TabPanel>
                <TabPanel value={value} index={2}>
                    <OrganizationSettings />
                </TabPanel>
                <TabPanel value={value} index={3}>
                    <EmailSettings />
                </TabPanel>
            </Paper>
        </Box>
    );
});

export default Settings;
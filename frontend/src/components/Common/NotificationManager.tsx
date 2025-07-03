import React from 'react';
import { observer } from 'mobx-react-lite';
import {
    Snackbar,
    Alert,
    AlertTitle,
    Slide,
    Box,
    IconButton,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { Close } from '@mui/icons-material';
import { useRootStore } from '../../stores/RootStore';

function SlideTransition(props: TransitionProps & {
    children: React.ReactElement<any, any>;
}) {
    return <Slide {...props} direction="up" />;
}

const NotificationManager: React.FC = observer(() => {
    const { uiStore } = useRootStore();

    if (uiStore.notifications.length === 0) {
        return null;
    }

    // Показываем только последнее уведомление
    const latestNotification = uiStore.notifications[uiStore.notifications.length - 1];

    const handleClose = () => {
        uiStore.removeNotification(latestNotification.id);
    };

    const getSeverity = () => {
        switch (latestNotification.type) {
            case 'success':
                return 'success';
            case 'error':
                return 'error';
            case 'warning':
                return 'warning';
            case 'info':
            default:
                return 'info';
        }
    };

    const getTitle = () => {
        switch (latestNotification.type) {
            case 'success':
                return 'Успешно';
            case 'error':
                return 'Ошибка';
            case 'warning':
                return 'Внимание';
            case 'info':
            default:
                return 'Информация';
        }
    };

    return (
        <>
            <Snackbar
                open={true}
                autoHideDuration={5000}
                onClose={handleClose}
                TransitionComponent={SlideTransition}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity={getSeverity()}
                    variant="filled"
                    onClose={handleClose}
                    sx={{
                        minWidth: '300px',
                        maxWidth: '500px',
                        boxShadow: 3,
                    }}
                    action={
                        <IconButton
                            size="small"
                            aria-label="close"
                            color="inherit"
                            onClick={handleClose}
                        >
                            <Close fontSize="small" />
                        </IconButton>
                    }
                >
                    <AlertTitle>{getTitle()}</AlertTitle>
                    {latestNotification.message}
                </Alert>
            </Snackbar>

            {/* Показываем счетчик оставшихся уведомлений */}
            {uiStore.notifications.length > 1 && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 100,
                        right: 24,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        boxShadow: 2,
                        zIndex: 1400,
                    }}
                >
                    Еще {uiStore.notifications.length - 1} уведомлений
                </Box>
            )}
        </>
    );
});

export default NotificationManager;
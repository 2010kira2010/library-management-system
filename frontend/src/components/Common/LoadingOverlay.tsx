import React from 'react';
import { observer } from 'mobx-react-lite';
import {
    Backdrop,
    CircularProgress,
    Box,
    Typography,
} from '@mui/material';
import { useRootStore } from '../../stores/RootStore';

const LoadingOverlay: React.FC = observer(() => {
    const { uiStore } = useRootStore();

    return (
        <Backdrop
            sx={{
                color: '#fff',
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
            }}
            open={uiStore.isLoading}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <CircularProgress color="inherit" size={60} />
                <Typography variant="h6" component="div">
                    Загрузка...
                </Typography>
            </Box>
        </Backdrop>
    );
});

export default LoadingOverlay;
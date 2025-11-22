import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    Button,
    Box,
    Typography,
    Switch,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Link,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const CookiePolicyPopup = () => {
    const { isDarkMode } = useTheme();
    const [open, setOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState({
        essential: true,
        analytics: false,
        marketing: false,
    });

    useEffect(() => {
        const cookieConsent = localStorage.getItem('cookieConsent');
        if (!cookieConsent) {
            setOpen(true);
        } else {
            try {
                const saved = JSON.parse(cookieConsent);
                setPreferences(saved);
            } catch (e) {
                console.error('Error loading cookie preferences:', e);
            }
        }
    }, []);

    const handleAcceptAll = () => {
        const allAccepted = {
            essential: true,
            analytics: true,
            marketing: true,
        };
        setPreferences(allAccepted);
        localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
        setOpen(false);
    };

    const handleRejectAll = () => {
        const essentialOnly = {
            essential: true,
            analytics: false,
            marketing: false,
        };
        setPreferences(essentialOnly);
        localStorage.setItem('cookieConsent', JSON.stringify(essentialOnly));
        setOpen(false);
    };

    const handleSaveSettings = () => {
        localStorage.setItem('cookieConsent', JSON.stringify(preferences));
        setOpen(false);
    };

    const handleToggle = (category) => {
        if (category === 'essential') return;
        setPreferences((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    return (
        <Dialog
            open={open}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    position: 'fixed',
                    bottom: 0,
                    m: 0,
                    borderRadius: '16px 16px 0 0',
                    maxHeight: showSettings ? '80vh' : '200px',
                    overflow: 'auto',
                    bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
                    color: isDarkMode ? '#e0e0e0' : '#000000',
                },
            }}
            sx={{
                '& .MuiBackdrop-root': {
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.7)',
                },
            }}
        >
            <DialogTitle sx={{ pb: showSettings ? 1 : 0, pt: 1.5, px: 2.5 }}>
                {showSettings && (
                    <>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.8, fontSize: '0.875rem' }}>
                            Choose how we use your personal information
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                            Privacy, Cookies & Data Storage
                        </Typography>
                    </>
                )}
            </DialogTitle>
            <DialogContent sx={{ pb: 1.5, px: 2.5 }}>
                {!showSettings ? (
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, fontSize: '0.875rem' }}>
                            Privacy, Cookies & Data Storage
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 1.5, fontSize: '0.75rem', lineHeight: 1.4, color: isDarkMode ? '#b0b0b0' : '#666666' }}>
                            DIHAC values your privacy. We use cookies and similar technologies to provide you with the best possible experience.
                            You have full control over how your data is collected and used. Review our{' '}
                            <Link href="/privacy-policy" target="_blank" sx={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                                Privacy Policy
                            </Link>{' '}
                            for complete details on our data practices.
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleAcceptAll}
                                sx={{
                                    bgcolor: '#2563eb',
                                    color: 'white',
                                    textTransform: 'none',
                                    py: 1,
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    '&:hover': {
                                        bgcolor: '#1d4ed8',
                                    },
                                }}
                            >
                                Accept All
                            </Button>

                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => setShowSettings(true)}
                                sx={{
                                    borderColor: isDarkMode ? '#555555' : '#e5e7eb',
                                    color: '#2563eb',
                                    textTransform: 'none',
                                    py: 0.8,
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    '&:hover': {
                                        bgcolor: 'rgba(37, 99, 235, 0.04)',
                                        borderColor: '#2563eb',
                                    },
                                }}
                            >
                                Cookies settings
                            </Button>

                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleRejectAll}
                                sx={{
                                    borderColor: isDarkMode ? '#555555' : '#e5e7eb',
                                    color: '#2563eb',
                                    textTransform: 'none',
                                    py: 0.8,
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    '&:hover': {
                                        borderColor: '#2563eb',
                                        bgcolor: 'rgba(37, 99, 235, 0.04)',
                                    },
                                }}
                            >
                                Accept Essential
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="body2" sx={{ mb: 2, color: isDarkMode ? '#b0b0b0' : '#666666' }}>
                            Customize your privacy preferences below. You can enable or disable specific cookie categories based on your comfort level.
                            For detailed information about our data handling practices, please review our{' '}
                            <Link href="/privacy-policy" target="_blank" sx={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                                Privacy Policy
                            </Link>.
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight={700}>
                                Cookie Categories
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleRejectAll}
                                    sx={{
                                        borderColor: '#e5e7eb',
                                        color: 'text.primary',
                                        textTransform: 'none',
                                        px: 3,
                                        fontWeight: 600,
                                        '&:hover': {
                                            borderColor: '#d1d5db',
                                        },
                                    }}
                                >
                                    Accept Essential
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleAcceptAll}
                                    sx={{
                                        bgcolor: '#2563eb',
                                        color: 'white',
                                        textTransform: 'none',
                                        px: 3,
                                        fontWeight: 600,
                                        '&:hover': {
                                            bgcolor: '#1d4ed8',
                                        },
                                    }}
                                >
                                    Accept All
                                </Button>
                            </Box>
                        </Box>

                        <Typography
                            variant="body2"
                            sx={{
                                mb: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                fontWeight: 600,
                                cursor: 'pointer',
                                '&:hover': { color: '#2563eb' },
                            }}
                        >
                            View Vendors <ArrowForwardIcon sx={{ fontSize: 16 }} />
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                            <Accordion
                                sx={{
                                    boxShadow: 'none',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px !important',
                                    mb: 2,
                                    '&:before': { display: 'none' },
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        '& .MuiAccordionSummary-content': {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            my: 1,
                                        },
                                    }}
                                >
                                    <Typography variant="body1" fontWeight={600}>
                                        Analytics
                                    </Typography>
                                    <Switch
                                        checked={preferences.analytics}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleToggle('analytics');
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: '#2563eb',
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: '#2563eb',
                                            },
                                        }}
                                    />
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" sx={{ mb: 2, color: isDarkMode ? '#b0b0b0' : '#666666' }}>
                                        We collect and analyze usage data to improve DIHAC's services and user experience. This includes
                                        understanding how you interact with our platform, identifying popular features, and measuring the
                                        effectiveness of our communications.
                                    </Typography>
                                    <Link
                                        href="#"
                                        sx={{
                                            color: '#2563eb',
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            fontWeight: 600,
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        Cookies <ArrowForwardIcon sx={{ fontSize: 16 }} />
                                    </Link>
                                </AccordionDetails>
                            </Accordion>

                            <Accordion
                                sx={{
                                    boxShadow: 'none',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px !important',
                                    mb: 2,
                                    '&:before': { display: 'none' },
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        '& .MuiAccordionSummary-content': {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            my: 1,
                                        },
                                    }}
                                >
                                    <Typography variant="body1" fontWeight={600}>
                                        Essential Services
                                    </Typography>
                                    <Switch
                                        checked={preferences.essential}
                                        disabled
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: '#2563eb',
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: '#2563eb',
                                            },
                                        }}
                                    />
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" sx={{ mb: 2, color: isDarkMode ? '#b0b0b0' : '#666666' }}>
                                        These cookies are necessary for DIHAC to function properly. They enable core features like secure login,
                                        session management, security protection, and basic site functionality. Essential cookies cannot be disabled
                                        as they are required for the platform to operate.
                                    </Typography>
                                    <Link
                                        href="#"
                                        sx={{
                                            color: '#2563eb',
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            fontWeight: 600,
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        Cookies <ArrowForwardIcon sx={{ fontSize: 16 }} />
                                    </Link>
                                </AccordionDetails>
                            </Accordion>

                            <Accordion
                                sx={{
                                    boxShadow: 'none',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px !important',
                                    '&:before': { display: 'none' },
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        '& .MuiAccordionSummary-content': {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            my: 1,
                                        },
                                    }}
                                >
                                    <Typography variant="body1" fontWeight={600}>
                                        Targeted Advertising
                                    </Typography>
                                    <Switch
                                        checked={preferences.marketing}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleToggle('marketing');
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: '#2563eb',
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: '#2563eb',
                                            },
                                        }}
                                    />
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" sx={{ mb: 2, color: isDarkMode ? '#b0b0b0' : '#666666' }}>
                                        These cookies help us show you relevant content and advertisements. We may use information about your
                                        preferences and behavior to personalize your experience and deliver more relevant communications.
                                    </Typography>
                                    <Link
                                        href="#"
                                        sx={{
                                            color: '#2563eb',
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            fontWeight: 600,
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        Cookies <ArrowForwardIcon sx={{ fontSize: 16 }} />
                                    </Link>
                                </AccordionDetails>
                            </Accordion>
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleSaveSettings}
                            sx={{
                                bgcolor: '#2563eb',
                                color: 'white',
                                textTransform: 'none',
                                py: 1.5,
                                mt: 2,
                                fontWeight: 600,
                                '&:hover': {
                                    bgcolor: '#1d4ed8',
                                },
                            }}
                        >
                            Confirm
                        </Button>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CookiePolicyPopup;

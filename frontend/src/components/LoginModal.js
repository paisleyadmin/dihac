import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import { Close, Google, Facebook } from '@mui/icons-material';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const LoginModal = ({ open, onClose, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // Handle Google OAuth login
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const result = await axios.post(`${API_URL}/api/oauth/google`, {
        credential: credentialResponse.credential
      });
      login(result.data.access_token);
      onClose();
    } catch (error) {
      setError('Google login failed. Please try again.');
      console.error('Google OAuth error:', error);
    }
  };

  const handleFacebookLogin = () => {
    // TODO: Implement Facebook OAuth
    console.log('Facebook login clicked');
    setError('Facebook login coming soon');
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: '#1a1a1a',
          color: '#fff',
        }
      }}
    >
      <Box sx={{ p: 3, position: 'relative' }}>
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: '#9ca3af',
          }}
        >
          <Close />
        </IconButton>

        <DialogContent sx={{ p: 0 }}>
          <Typography 
            variant="h5" 
            component="h2" 
            gutterBottom 
            align="center"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            Welcome to DIHAC
          </Typography>
          <Typography 
            variant="body2" 
            align="center" 
            color="#9ca3af"
            sx={{ mb: 3 }}
          >
            Sign in to continue
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* OAuth Buttons */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ mb: 1.5 }}>
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  setError('Google login failed. Please try again.');
                }}
                theme="filled_black"
                size="large"
                width="100%"
                text="continue_with"
              />
            </Box>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Facebook />}
              onClick={handleFacebookLogin}
              sx={{
                color: '#fff',
                borderColor: '#3a3a3a',
                textTransform: 'none',
                py: 1.2,
                '&:hover': {
                  borderColor: '#4a4a4a',
                  bgcolor: '#2a2a2a',
                },
              }}
            >
              Continue with Facebook
            </Button>
          </Box>

          <Divider sx={{ mb: 3, borderColor: '#3a3a3a' }}>
            <Typography variant="body2" sx={{ color: '#6b7280', px: 2 }}>
              or
            </Typography>
          </Divider>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#262626',
                  color: '#fff',
                  '& fieldset': {
                    borderColor: '#3a3a3a',
                  },
                  '&:hover fieldset': {
                    borderColor: '#4a4a4a',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2563eb',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#9ca3af',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#2563eb',
                },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#262626',
                  color: '#fff',
                  '& fieldset': {
                    borderColor: '#3a3a3a',
                  },
                  '&:hover fieldset': {
                    borderColor: '#4a4a4a',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2563eb',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#9ca3af',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#2563eb',
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                bgcolor: '#2563eb',
                textTransform: 'none',
                py: 1.2,
                '&:hover': { bgcolor: '#1d4ed8' },
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Typography variant="body2" align="center" sx={{ color: '#9ca3af' }}>
            Don't have an account?{' '}
            <Box
              component="span"
              onClick={onSwitchToRegister}
              sx={{
                color: '#2563eb',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Create one
            </Box>
          </Typography>
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default LoginModal;

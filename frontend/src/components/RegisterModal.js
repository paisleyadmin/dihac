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
import { Close, Facebook } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const RegisterModal = ({ open, onClose, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login, loginWithToken } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(formData);
    if (result.success) {
      // Auto-login after registration
      const loginResult = await login(formData.email, formData.password);
      if (loginResult.success) {
        onClose();
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const result = await axios.post(`${API_URL}/api/user/oauth/google`, {
        credential: credentialResponse.credential
      });
      loginWithToken(result.data.access_token);
      onClose();
    } catch (error) {
      setError('Google signup failed. Please try again.');
      console.error('Google OAuth error:', error);
    }
  };

  const handleFacebookLogin = () => {
    // TODO: Implement Facebook OAuth
    console.log('Facebook login clicked');
  };

  const handleClose = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
    });
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
            Create Account
          </Typography>
          <Typography
            variant="body2"
            align="center"
            color="#9ca3af"
            sx={{ mb: 3 }}
          >
            Get started with DIHAC
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
                  setError('Google signup failed. Please try again.');
                }}
                theme="filled_black"
                size="large"
                width="100%"
                text="signup_with"
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
              Sign up with Facebook
            </Button>
          </Box>

          <Divider sx={{ mb: 3, borderColor: '#3a3a3a' }}>
            <Typography variant="body2" sx={{ color: '#6b7280', px: 2 }}>
              or
            </Typography>
          </Divider>

          {/* Registration Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              margin="dense"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#262626',
                  color: '#fff',
                  '& fieldset': { borderColor: '#3a3a3a' },
                  '&:hover fieldset': { borderColor: '#4a4a4a' },
                  '&.Mui-focused fieldset': { borderColor: '#2563eb' },
                },
                '& .MuiInputLabel-root': { color: '#9ca3af' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb' },
              }}
            />
            <TextField
              fullWidth
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              margin="dense"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#262626',
                  color: '#fff',
                  '& fieldset': { borderColor: '#3a3a3a' },
                  '&:hover fieldset': { borderColor: '#4a4a4a' },
                  '&.Mui-focused fieldset': { borderColor: '#2563eb' },
                },
                '& .MuiInputLabel-root': { color: '#9ca3af' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb' },
              }}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              margin="dense"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#262626',
                  color: '#fff',
                  '& fieldset': { borderColor: '#3a3a3a' },
                  '&:hover fieldset': { borderColor: '#4a4a4a' },
                  '&.Mui-focused fieldset': { borderColor: '#2563eb' },
                },
                '& .MuiInputLabel-root': { color: '#9ca3af' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb' },
              }}
            />
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              margin="dense"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#262626',
                  color: '#fff',
                  '& fieldset': { borderColor: '#3a3a3a' },
                  '&:hover fieldset': { borderColor: '#4a4a4a' },
                  '&.Mui-focused fieldset': { borderColor: '#2563eb' },
                },
                '& .MuiInputLabel-root': { color: '#9ca3af' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb' },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              margin="dense"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#262626',
                  color: '#fff',
                  '& fieldset': { borderColor: '#3a3a3a' },
                  '&:hover fieldset': { borderColor: '#4a4a4a' },
                  '&.Mui-focused fieldset': { borderColor: '#2563eb' },
                },
                '& .MuiInputLabel-root': { color: '#9ca3af' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb' },
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <Typography variant="body2" align="center" sx={{ color: '#9ca3af' }}>
            Already have an account?{' '}
            <Box
              component="span"
              onClick={onSwitchToLogin}
              sx={{
                color: '#2563eb',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Sign in
            </Box>
          </Typography>
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default RegisterModal;

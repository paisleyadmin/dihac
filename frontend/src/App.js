import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './components/Dashboard';
import CaseChat from './components/CaseChat';
import CaseAnalysis from './components/CaseAnalysis';
import PrivateRoute from './components/PrivateRoute';
import CookiePolicyPopup from './components/CookiePolicyPopup';



const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e',
    },
    secondary: {
      main: '#994bff',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <div>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <ThemeProvider>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/case/:caseId"
                  element={
                    <PrivateRoute>
                      <CaseChat />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/case/:caseId/analysis"
                  element={
                    <PrivateRoute>
                      <CaseAnalysis />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </Router>

            {/* Cookie Policy Popup */}
            <CookiePolicyPopup />
          </AuthProvider>
        </ThemeProvider>
      </MuiThemeProvider>
    </div>
  );
}

export default App;
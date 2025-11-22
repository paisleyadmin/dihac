import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  InputAdornment,
  Drawer,
  Divider,
  Avatar,
  Collapse,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Chip,
} from '@mui/material';
import {
  Add,
  History,
  Search,
  Send,
  Mic,
  AccountCircle,
  ChevronLeft,
  ChevronRight,
  Settings,
  Task,
  Folder,
  HelpOutline,
  Upgrade,
  Logout,
  Close,
  ThumbUp,
  Description,
  Gavel,
  PersonOutline,
  ExpandMore,
  Brightness4,
  Brightness7,
  Menu,
  AttachFile,
  InsertPhoto,
  Videocam,
  CloseOutlined,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DRAWER_WIDTH = 240;

const Dashboard = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false); // Track message sending state
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]); // Store conversation messages
  const [currentCaseId, setCurrentCaseId] = useState(null); // Track current case
  const [guestMessageCount, setGuestMessageCount] = useState(0); // Track guest messages
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false); // For mobile drawer
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [caseAnalysis, setCaseAnalysis] = useState(null); // Store analysis results
  const [attachedFiles, setAttachedFiles] = useState([]); // Store attached files (images/videos)
  const { user, logout, token } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Theme colors
  const colors = {
    bg: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    bgSecondary: isDarkMode ? '#262626' : '#fff',
    bgTertiary: isDarkMode ? '#0d0d0d' : '#fafafa',
    text: isDarkMode ? '#f9fafb' : '#111',
    textSecondary: isDarkMode ? '#9ca3af' : '#666',
    border: isDarkMode ? '#2a2a2a' : '#e0e0e0',
    borderLight: isDarkMode ? '#3a3a3a' : '#d1d5db',
    userMessage: '#2563eb',
    aiMessage: isDarkMode ? '#2d2d2d' : '#f3f4f6',
  };

  // Don't auto-show login modal - let users try the app first
  // Login modal will appear after 2 guest messages

  useEffect(() => {
    if (token) {
      fetchCases();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCases = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/conversation/cases`);
      setCases(response.data);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCase = async (caseId, event) => {
    event.stopPropagation(); // Prevent case selection when clicking delete

    if (!window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/conversation/cases/${caseId}`);

      // Remove case from local state
      setCases(prevCases => prevCases.filter(c => c.id !== caseId));

      // If the deleted case was the current one, clear the conversation
      if (currentCaseId === caseId) {
        setCurrentCaseId(null);
        setConversation([]);
      }
    } catch (error) {
      console.error('Error deleting case:', error);
      alert('Failed to delete case. Please try again.');
    }
  };

  const createNewCase = async () => {
    // Simply clear the current conversation and start fresh
    setCurrentCaseId(null);
    setConversation([]);
    setMessage('');
    setCaseAnalysis(null); // Clear the analysis panel
  };

  const handleLogout = () => {
    // Clear all state before logging out
    setCases([]);
    setConversation([]);
    setCurrentCaseId(null);
    setCaseAnalysis(null);
    setMessage('');
    setSearchQuery('');
    // Call the actual logout function from AuthContext
    logout();
  };

  const loadCaseConversation = async (caseId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/conversation/conversations/${caseId}`);

      if (response.data && response.data.conversations) {
        // Convert the conversation history to our format
        const loadedConversation = [];
        response.data.conversations.forEach(conv => {
          loadedConversation.push({ role: 'user', content: conv.user_message });
          if (conv.system_response) {
            loadedConversation.push({ role: 'assistant', content: conv.system_response });
          }
        });

        setConversation(loadedConversation);
        setCurrentCaseId(caseId);

        // Load analysis data if available
        if (response.data.analysis) {
          setCaseAnalysis(response.data.analysis);
        } else {
          setCaseAnalysis(null); // Clear analysis if not available
        }
      }
    } catch (error) {
      console.error('Error loading case conversation:', error);
      alert('Failed to load case history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && attachedFiles.length === 0) return;

    // Check if guest user has reached the limit (2 free messages)
    if (!token && guestMessageCount >= 2) {
      setLoginModalOpen(true);
      return;
    }

    // Add user message to conversation immediately
    const userMsg = {
      role: 'user',
      content: message,
      attachments: attachedFiles.map(f => ({ name: f.name, type: f.type }))
    };
    setConversation(prev => [...prev, userMsg]);
    const currentMessage = message;
    const currentFiles = attachedFiles;
    setMessage(''); // Clear input immediately
    setAttachedFiles([]); // Clear attachments

    setSending(true); // Show loading state
    try {
      console.log('Sending message:', currentMessage);
      console.log('With files:', currentFiles.length);

      // For logged-in users, save to backend
      if (token) {
        // Create FormData to handle file uploads
        const formData = new FormData();
        formData.append('message', currentMessage || '');
        formData.append('message_type', 'text');
        if (currentCaseId) {
          formData.append('case_id', currentCaseId.toString());
        }

        // Add files to FormData
        currentFiles.forEach((fileObj) => {
          formData.append('files', fileObj.file);
        });

        const response = await axios.post(`${API_URL}/api/conversation/message`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type - let axios set it with boundary
          },
        });

        console.log('Response:', response.data);

        if (response.data) {
          // Add AI response to conversation
          const aiMsg = {
            role: 'assistant',
            content: response.data.system_response
          };
          setConversation(prev => [...prev, aiMsg]);

          // Store case_id for subsequent messages and refresh cases list if new case
          const isNewCase = !currentCaseId && response.data.case_id;
          if (response.data.case_id) {
            setCurrentCaseId(response.data.case_id);
          }

          // Refresh cases list if a new case was created
          if (isNewCase) {
            fetchCases();
          }

          // Set analysis data from API response
          if (response.data.analysis) {
            setCaseAnalysis(response.data.analysis);
          }
        }
      } else {
        // For guest users, call analysis service directly (no history saving)
        // Note: File upload for guests could be restricted or handled differently
        const response = await axios.post(`${API_URL}/api/llm/analyze`, {
          user_message: currentMessage,
          conversation_history: [],
          case_context: {}
        });

        console.log('Guest response:', response.data);

        if (response.data && response.data.response) {
          const aiMsg = {
            role: 'assistant',
            content: response.data.response
          };
          setConversation(prev => [...prev, aiMsg]);
          setGuestMessageCount(prev => prev + 1);

          // Set analysis data from API response for guest users too
          if (response.data.analysis) {
            setCaseAnalysis(response.data.analysis);
          }

          // After first message, show a prompt to sign in
          if (guestMessageCount === 0) {
            setTimeout(() => {
              const shouldLogin = window.confirm(
                '💡 Sign in to save your conversation history and continue chatting!\n\nYou can ask one more question without signing in, but your conversation won\'t be saved.'
              );
              if (shouldLogin) {
                setLoginModalOpen(true);
              }
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Full error:', JSON.stringify(error.response?.data));

      if (error.response?.status === 401) {
        alert('Please log in to continue');
        setLoginModalOpen(true);
      } else {
        const errorMessage = error.response?.data?.detail ||
          JSON.stringify(error.response?.data) ||
          error.message ||
          'Unknown error';
        alert(`Failed to send message: ${errorMessage}`);
      }
    } finally {
      setSending(false); // Hide loading state
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    console.log('Files selected:', files.length);

    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isDocument = file.type === 'application/pdf' ||
        file.type === 'application/msword' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'text/plain' ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.doc') ||
        file.name.endsWith('.docx') ||
        file.name.endsWith('.txt');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit

      if (!isImage && !isVideo && !isDocument) {
        alert(`${file.name} is not a valid file type. Supported: Images, Videos, PDF, DOC, DOCX, TXT`);
        return false;
      }
      if (!isValidSize) {
        alert(`${file.name} is too large. Maximum size is 50MB`);
        return false;
      }
      return true;
    });

    console.log('Valid files:', validFiles.length);

    // Create preview URLs for valid files
    const newFiles = validFiles.map(file => {
      let fileType = 'document';
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('video/')) fileType = 'video';

      return {
        file,
        preview: fileType === 'image' ? URL.createObjectURL(file) : null,
        type: fileType,
        name: file.name
      };
    });

    console.log('New files to attach:', newFiles);
    setAttachedFiles(prev => [...prev, ...newFiles]);
    console.log('Attached files state updated');
  };

  const removeAttachedFile = (index) => {
    setAttachedFiles(prev => {
      const newFiles = [...prev];
      // Revoke the preview URL to free memory (only for images with preview URLs)
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const generateCaseReport = () => {
    if (!caseAnalysis) {
      alert('No case analysis available to generate report');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = 20;

      // Helper function to add text with word wrap
      const addText = (text, fontSize, isBold = false, color = [0, 0, 0]) => {
        doc.setFontSize(fontSize);
        doc.setTextColor(...color);
        if (isBold) doc.setFont(undefined, 'bold');
        else doc.setFont(undefined, 'normal');

        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach(line => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
        yPosition += 5;
      };

      // Header
      doc.setFillColor(37, 99, 235); // Blue background
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('DIHAC Legal Case Report', pageWidth / 2, 25, { align: 'center' });

      yPosition = 50;
      doc.setTextColor(0, 0, 0);

      // Date
      addText(`Generated: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`, 10, false, [100, 100, 100]);

      yPosition += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Case Description - Professional Summary (moved to top)
      if (conversation && conversation.length > 0) {
        addText('Case Description', 16, true, [37, 99, 235]);

        // Extract user messages to create a professional summary
        const userMessages = conversation
          .filter(msg => msg.role === 'user')
          .map(msg => msg.content)
          .join(' ');

        // Create a structured summary
        const summaryParts = [];

        // Problem statement (first user message)
        if (conversation.length > 0 && conversation[0].role === 'user') {
          summaryParts.push({
            label: 'Problem Statement',
            content: conversation[0].content
          });
        }

        // Additional details (subsequent user messages)
        const additionalDetails = conversation
          .filter((msg, idx) => msg.role === 'user' && idx > 0)
          .map(msg => msg.content);

        if (additionalDetails.length > 0) {
          summaryParts.push({
            label: 'Additional Information Provided',
            content: additionalDetails.join('. ')
          });
        }

        // Key facts extracted from AI analysis
        const aiResponses = conversation
          .filter(msg => msg.role === 'assistant')
          .map(msg => msg.content);

        if (aiResponses.length > 0) {
          // Extract key facts from first AI response
          const firstResponse = aiResponses[0];
          const keyFactsMatch = firstResponse.match(/key facts|important|note|consider/i);
          if (keyFactsMatch) {
            summaryParts.push({
              label: 'Analysis Notes',
              content: 'Based on the information provided, this case involves potential legal claims that require professional evaluation. Key factors have been identified and are detailed in the assessment below.'
            });
          }
        }

        // Render summary sections
        summaryParts.forEach((part, index) => {
          addText(part.label + ':', 11, true, [0, 0, 0]);
          addText(part.content, 10);
          yPosition += 2;
        });

        yPosition += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      }

      // Win Probability Section
      addText('Legal Assessment', 16, true, [37, 99, 235]);
      addText(`Estimated Win Probability: ${caseAnalysis.winProbability}`, 12, true);
      addText(caseAnalysis.winMessage || 'Assessment pending', 11);
      yPosition += 5;

      // Potentially Relevant Laws
      if (caseAnalysis.laws && caseAnalysis.laws.length > 0) {
        addText('Potentially Applicable Laws & Statutes', 16, true, [37, 99, 235]);
        addText('The following laws may be relevant to this case:', 10, false, [80, 80, 80]);
        yPosition += 2;

        caseAnalysis.laws.forEach((law, index) => {
          addText(`${index + 1}. ${law.title}`, 11, true);
          if (law.description) {
            addText(`   ${law.description}`, 10);
          }
          yPosition += 2;
        });
        yPosition += 5;
      }

      // Precedent Cases
      if (caseAnalysis.precedents && caseAnalysis.precedents.length > 0) {
        addText('Relevant Precedent Cases', 16, true, [37, 99, 235]);
        addText('The following cases may provide relevant legal precedent:', 10, false, [80, 80, 80]);
        yPosition += 2;

        caseAnalysis.precedents.forEach((precedent, index) => {
          addText(`${index + 1}. ${precedent.name}`, 11, true);
          if (precedent.description) {
            addText(`   ${precedent.description}`, 10);
          }
          yPosition += 2;
        });
        yPosition += 5;
      }

      // Recommended Next Steps
      addText('Recommended Next Steps', 16, true, [37, 99, 235]);
      addText('1. Consult with a licensed attorney specializing in this area of law', 10);
      addText('2. Gather and organize all relevant documentation and evidence', 10);
      addText('3. Note important deadlines and statutes of limitations', 10);
      addText('4. Do not discuss the case publicly or on social media', 10);
      addText('5. Keep detailed records of all related expenses and communications', 10);
      yPosition += 10;

      // Attorney Listings
      if (caseAnalysis.lawyers && caseAnalysis.lawyers.length > 0) {
        addText('Attorney Referrals (Public Records)', 16, true, [37, 99, 235]);
        addText('IMPORTANT: These attorneys are sourced from public state bar records. This is NOT a recommendation or endorsement. You must independently verify credentials, experience, and suitability for your specific case.', 9, false, [200, 0, 0]);
        yPosition += 5;

        caseAnalysis.lawyers.forEach((lawyer, index) => {
          if (!lawyer.isSearchLink) {
            addText(`${index + 1}. ${lawyer.name}`, 11, true);
            addText(`   Practice Area: ${lawyer.specialty}`, 10);
            addText(`   Location: ${lawyer.location}`, 10);
            if (lawyer.barNumber) {
              addText(`   Bar Number: ${lawyer.barNumber}`, 10);
            }
            if (lawyer.yearsExperience) {
              addText(`   Years of Experience: ${lawyer.yearsExperience} years`, 10);
            }
            addText(`   Source: State Bar Directory (verify independently)`, 9, false, [100, 100, 100]);
            yPosition += 4;
          }
        });
      }

      // Footer disclaimer on last page
      const finalY = doc.internal.pageSize.getHeight() - 30;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont(undefined, 'italic');
      const disclaimerText = 'DISCLAIMER: This report provides informational analysis only and is NOT legal advice. No attorney-client relationship is created. Independently verify all information. Consult a licensed attorney for legal advice specific to your situation.';
      const disclaimerLines = doc.splitTextToSize(disclaimerText, maxWidth);
      let disclaimerY = finalY;
      disclaimerLines.forEach(line => {
        doc.text(line, margin, disclaimerY);
        disclaimerY += 4;
      });

      // Save the PDF
      const fileName = `DIHAC_Case_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      console.log('Case report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const filteredCases = cases.filter(caseItem =>
    caseItem.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caseItem.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }}>
      {/* Login Modal */}
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
      />

      {/* Register Modal */}
      <RegisterModal
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
      />

      {/* Sidebar - Desktop permanent, Mobile temporary */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: sidebarOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: isDarkMode ? '#0d0d0d' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            borderRight: `1px solid ${isDarkMode ? '#2a2a2a' : '#e0e0e0'}`,
          },
        }}
        open={sidebarOpen}
      >
        {/* Logo */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#2563eb',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              component="span"
              sx={{
                width: 16,
                height: 16,
                border: '2px solid white',
                borderRadius: 0.5,
              }}
            />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            dihac
          </Typography>
          <Box
            sx={{
              ml: 1,
              px: 1,
              py: 0.3,
              bgcolor: '#2563eb',
              borderRadius: 1,
              fontSize: '0.7rem',
            }}
          >
            beta
          </Box>
        </Box>

        {/* New Case Button */}
        <Box sx={{ px: 2, mb: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Add />}
            onClick={createNewCase}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              textTransform: 'none',
              py: 1.2,
              borderRadius: 2,
            }}
          >
            New Case
          </Button>
        </Box>

        {/* Case History */}
        <Box sx={{ px: 2, mb: 1 }}>
          <Button
            fullWidth
            startIcon={<History />}
            sx={{
              color: '#9ca3af',
              textTransform: 'none',
              justifyContent: 'flex-start',
              '&:hover': { bgcolor: '#1a1a1a' },
            }}
          >
            Case History
          </Button>
        </Box>

        {/* Search */}
        <Box sx={{ px: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: colors.textSecondary }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                color: colors.text,
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.border,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.borderLight,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#2563eb',
                },
              },
            }}
          />
        </Box>

        {/* Cases List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
          <List>
            {filteredCases.map((caseItem) => (
              <ListItem
                key={caseItem.id}
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => deleteCase(caseItem.id, e)}
                    sx={{
                      color: '#6b7280',
                      '&:hover': {
                        color: '#ef4444',
                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                      },
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemButton
                  onClick={() => loadCaseConversation(caseItem.id)}
                  selected={currentCaseId === caseItem.id}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    '&:hover': { bgcolor: isDarkMode ? '#1a1a1a' : '#e5e7eb' },
                    '&.Mui-selected': {
                      bgcolor: isDarkMode ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.15)',
                      '&:hover': { bgcolor: isDarkMode ? 'rgba(37, 99, 235, 0.4)' : 'rgba(37, 99, 235, 0.25)' },
                    },
                    pr: 6, // Add padding to prevent text overlapping with delete button
                  }}
                >
                  <ListItemText
                    primary={caseItem.title || `Case #${caseItem.id}`}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      color: colors.text,
                      noWrap: true,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ borderColor: '#2a2a2a' }} />

        {/* User Menu Panel - Only show when logged in */}
        {token && (
          <Collapse in={userMenuOpen}>
            <Box
              sx={{
                bgcolor: colors.bgSecondary,
                borderRadius: 3,
                m: 1.5,
                p: 1,
                boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <List dense>
                <ListItem disablePadding>
                  <ListItemButton
                    sx={{
                      borderRadius: 2,
                      color: colors.text,
                      '&:hover': { bgcolor: isDarkMode ? '#1a1a1a' : '#e5e5e5' },
                    }}
                  >
                    <Settings sx={{ mr: 2, fontSize: 20 }} />
                    <ListItemText primary="Settings" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={toggleTheme}
                    sx={{
                      borderRadius: 2,
                      color: colors.text,
                      '&:hover': { bgcolor: isDarkMode ? '#1a1a1a' : '#e5e5e5' },
                    }}
                  >
                    {isDarkMode ? (
                      <Brightness7 sx={{ mr: 2, fontSize: 20 }} />
                    ) : (
                      <Brightness4 sx={{ mr: 2, fontSize: 20 }} />
                    )}
                    <ListItemText primary="Theme" />
                    <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 1 }}>
                      {isDarkMode ? 'Dark' : 'Light'}
                    </Typography>
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    sx={{
                      borderRadius: 2,
                      color: colors.text,
                      '&:hover': { bgcolor: isDarkMode ? '#1a1a1a' : '#e5e5e5' },
                    }}
                  >
                    <Folder sx={{ mr: 2, fontSize: 20 }} />
                    <ListItemText primary="Files" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    sx={{
                      borderRadius: 2,
                      color: colors.text,
                      '&:hover': { bgcolor: isDarkMode ? '#1a1a1a' : '#e5e5e5' },
                    }}
                  >
                    <HelpOutline sx={{ mr: 2, fontSize: 20 }} />
                    <ListItemText primary="Help" />
                    <ChevronRight sx={{ fontSize: 16, color: colors.textSecondary }} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    sx={{
                      borderRadius: 2,
                      color: colors.text,
                      '&:hover': { bgcolor: isDarkMode ? '#1a1a1a' : '#e5e5e5' },
                    }}
                  >
                    <Upgrade sx={{ mr: 2, fontSize: 20 }} />
                    <ListItemText primary="Upgrade plan" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleLogout}
                    sx={{
                      borderRadius: 2,
                      color: colors.text,
                      '&:hover': { bgcolor: isDarkMode ? '#1a1a1a' : '#e5e5e5' },
                    }}
                  >
                    <Logout sx={{ mr: 2, fontSize: 20 }} />
                    <ListItemText primary="Sign Out" />
                  </ListItemButton>
                </ListItem>
              </List>
            </Box>
          </Collapse>
        )}

        {/* User Profile / Sign In */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            '&:hover': { bgcolor: isDarkMode ? '#1a1a1a' : '#e5e7eb' },
          }}
          onClick={() => {
            if (token) {
              setUserMenuOpen(!userMenuOpen);
            } else {
              setLoginModalOpen(true);
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: token ? '#2563eb' : '#6b7280' }}>
              {token ? (
                user?.first_name?.[0] || user?.email?.[0] || <AccountCircle />
              ) : (
                <AccountCircle />
              )}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {token ? (
                  user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.first_name || user?.email || 'User Profile'
                ) : (
                  'Sign In'
                )}
              </Typography>
            </Box>
          </Box>
          {token && (
            userMenuOpen ? (
              <ChevronRight sx={{ fontSize: 20, color: '#6b7280' }} />
            ) : (
              <ChevronLeft sx={{ fontSize: 20, color: '#6b7280' }} />
            )
          )}
          {!token && (
            <ChevronRight sx={{ fontSize: 20, color: '#6b7280' }} />
          )}
        </Box>
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: colors.bgSecondary,
            color: colors.text,
            borderRight: `1px solid ${colors.border}`,
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#2563eb',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              component="span"
              sx={{
                width: 16,
                height: 16,
                border: '2px solid white',
                borderRadius: 0.5,
              }}
            />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            dihac
          </Typography>
          <Box
            sx={{
              ml: 1,
              px: 1,
              py: 0.3,
              bgcolor: '#2563eb',
              borderRadius: 1,
              fontSize: '0.7rem',
            }}
          >
            beta
          </Box>
        </Box>

        {/* New Case Button */}
        <Box sx={{ px: 2, mb: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              createNewCase();
              setMobileDrawerOpen(false);
            }}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              textTransform: 'none',
              py: 1.2,
              borderRadius: 2,
            }}
          >
            New Case
          </Button>
        </Box>

        {/* Case History */}
        <Box sx={{ px: 2, mb: 1 }}>
          <Button
            fullWidth
            startIcon={<History />}
            sx={{
              color: colors.textSecondary,
              textTransform: 'none',
              justifyContent: 'flex-start',
              '&:hover': { bgcolor: isDarkMode ? '#1a1a1a' : '#e5e7eb' },
            }}
          >
            Case History
          </Button>
        </Box>

        {/* Search */}
        <Box sx={{ px: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: colors.textSecondary }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                color: colors.text,
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.border,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.borderLight,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#2563eb',
                },
              },
            }}
          />
        </Box>

        {/* Cases List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
          <List>
            {filteredCases.map((caseItem) => (
              <ListItem
                key={caseItem.id}
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => deleteCase(caseItem.id, e)}
                    sx={{
                      color: '#6b7280',
                      '&:hover': {
                        color: '#ef4444',
                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                      },
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemButton
                  onClick={() => {
                    loadCaseConversation(caseItem.id);
                    setMobileDrawerOpen(false);
                  }}
                  selected={currentCaseId === caseItem.id}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    '&:hover': { bgcolor: isDarkMode ? '#1a1a1a' : '#e5e7eb' },
                    '&.Mui-selected': {
                      bgcolor: isDarkMode ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.15)',
                      '&:hover': { bgcolor: isDarkMode ? 'rgba(37, 99, 235, 0.4)' : 'rgba(37, 99, 235, 0.25)' },
                    },
                    pr: 6,
                  }}
                >
                  <ListItemText
                    primary={caseItem.title || `Case #${caseItem.id}`}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      color: colors.text,
                      noWrap: true,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ borderColor: colors.border }} />

        {/* User Profile / Sign In */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            '&:hover': { bgcolor: isDarkMode ? '#1a1a1a' : '#e5e7eb' },
          }}
          onClick={() => {
            if (token) {
              setUserMenuOpen(!userMenuOpen);
            } else {
              setLoginModalOpen(true);
              setMobileDrawerOpen(false);
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: token ? '#2563eb' : '#6b7280' }}>
              {token ? (
                user?.first_name?.[0] || user?.email?.[0] || <AccountCircle />
              ) : (
                <AccountCircle />
              )}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {token ? (
                  user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.first_name || user?.email || 'User Profile'
                ) : (
                  'Sign In'
                )}
              </Typography>
            </Box>
          </Box>
          {token && (
            userMenuOpen ? (
              <ChevronRight sx={{ fontSize: 20, color: colors.textSecondary }} />
            ) : (
              <ChevronLeft sx={{ fontSize: 20, color: colors.textSecondary }} />
            )
          )}
          {!token && (
            <ChevronRight sx={{ fontSize: 20, color: colors.textSecondary }} />
          )}
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: colors.bg,
          color: colors.text,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Mobile Header with Menu Button */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            gap: 2,
            p: 2,
            borderBottom: `1px solid ${colors.border}`,
            bgcolor: colors.bgSecondary,
          }}
        >
          <IconButton
            onClick={() => setMobileDrawerOpen(true)}
            sx={{ color: colors.text }}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
            dihac
          </Typography>
          {token && (
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#2563eb' }}>
              {user?.first_name?.[0] || user?.email?.[0] || <AccountCircle />}
            </Avatar>
          )}
        </Box>

        {/* Content Row (Chat + Analysis Panel) */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            overflow: 'hidden',
          }}
        >
          {/* Chat Section (Center) */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              maxWidth: { xs: '100%', lg: caseAnalysis ? '50%' : '100%' },
            }}
          >
            {/* Messages Area */}
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: conversation.length === 0 && !sending ? 'center' : 'flex-start',
                px: { xs: 2, sm: 3 },
                py: { xs: 2, sm: 3 },
                overflowY: 'auto',
                width: '100%',
              }}
            >
              {sending && conversation.length === 0 ? (
                <>
                  <CircularProgress size={60} sx={{ color: '#2563eb', mb: 3, mt: 20 }} />
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      color: '#f9fafb',
                    }}
                  >
                    Analyzing Your Case...
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#9ca3af',
                      textAlign: 'center',
                    }}
                  >
                    Our AI is processing your request. This may take 2-3 minutes.
                    <br />
                    Please wait...
                  </Typography>
                </>
              ) : conversation.length === 0 ? (
                <>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      color: '#f9fafb',
                    }}
                  >
                    Start Your Case
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#9ca3af',
                      mb: 2,
                    }}
                  >
                    Describe your situation by typing below or use the microphone to talk.
                  </Typography>

                  {/* Legal Disclaimer */}
                  <Box sx={{
                    bgcolor: isDarkMode ? '#1a1a1a' : '#f9fafb',
                    border: `1px solid ${colors.border}`,
                    p: 1.5,
                    borderRadius: 1,
                    mb: 4,
                  }}>
                    <Typography sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, color: colors.textSecondary }}>
                      ⚠️ <strong>DISCLAIMER:</strong> This tool provides informational analysis only and is NOT legal advice.
                      No attorney-client relationship is created. All case assessments, legal information, and attorney listings
                      are for informational purposes only. Independently verify all information. Consult a licensed attorney
                      for legal advice specific to your situation.
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box sx={{ width: '100%' }}>
                  {conversation.map((msg, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: { xs: '90%', sm: '80%', md: '70%' },
                          bgcolor: msg.role === 'user' ? colors.userMessage : colors.aiMessage,
                          color: msg.role === 'user' ? '#fff' : colors.text,
                          px: { xs: 2, sm: 3 },
                          py: 2,
                          borderRadius: 2,
                          boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                          {msg.content}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  {sending && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                      <Box
                        sx={{
                          bgcolor: colors.aiMessage,
                          px: 3,
                          py: 2,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <CircularProgress size={20} sx={{ color: '#2563eb' }} />
                        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                          AI is thinking...
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* Bottom Input Area */}
            <Box
              sx={{
                p: 3,
                borderTop: `1px solid ${colors.border}`,
                bgcolor: colors.bg,
              }}
            >
              {/* File Preview Area */}
              {attachedFiles.length > 0 && (
                <Box
                  sx={{
                    maxWidth: 800,
                    mx: 'auto',
                    mb: 2,
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  {attachedFiles.map((fileObj, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 80,
                        height: 80,
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: `2px solid ${colors.border}`,
                        bgcolor: colors.bgSecondary,
                      }}
                    >
                      {fileObj.type === 'image' ? (
                        <img
                          src={fileObj.preview}
                          alt={fileObj.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : fileObj.type === 'video' ? (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: colors.bgTertiary,
                          }}
                        >
                          <Videocam sx={{ fontSize: 32, color: '#2563eb' }} />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: colors.bgTertiary,
                          }}
                        >
                          <DocumentIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />
                        </Box>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => removeAttachedFile(index)}
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          padding: '2px',
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.9)',
                          },
                        }}
                      >
                        <CloseOutlined sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Typography
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          fontSize: '0.6rem',
                          px: 0.5,
                          py: 0.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {fileObj.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <Box
                sx={{
                  maxWidth: 800,
                  mx: 'auto',
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  width: '100%',
                  px: { xs: 0, sm: 2 },
                }}
              >
                {/* File Attachment Button */}
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,video/*,application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,text/plain,.txt"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-upload">
                  <IconButton
                    component="span"
                    sx={{
                      bgcolor: colors.bgSecondary,
                      border: `1px solid ${colors.border}`,
                      width: { xs: 48, sm: 56 },
                      height: { xs: 48, sm: 56 },
                      '&:hover': {
                        bgcolor: colors.bgTertiary,
                        borderColor: '#2563eb',
                      },
                    }}
                  >
                    <AttachFile sx={{ color: colors.text }} />
                  </IconButton>
                </label>

                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Tell me about your situation..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: colors.bgSecondary,
                      color: colors.text,
                      borderRadius: 2,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      '& fieldset': {
                        borderColor: colors.border,
                      },
                      '&:hover fieldset': {
                        borderColor: colors.borderLight,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#2563eb',
                      },
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: colors.textSecondary,
                      opacity: 1,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={(!message.trim() && attachedFiles.length === 0) || sending}
                  sx={{
                    bgcolor: isDarkMode ? '#6b7280' : '#2563eb',
                    minWidth: { xs: 60, sm: 80 },
                    height: 56,
                    borderRadius: 2,
                    display: { xs: 'none', sm: 'flex' },
                    '&:hover': { bgcolor: isDarkMode ? '#4b5563' : '#1d4ed8' },
                    '&.Mui-disabled': {
                      bgcolor: isDarkMode ? '#374151' : '#9ca3af',
                      color: isDarkMode ? '#6b7280' : '#d1d5db',
                    },
                  }}
                >
                  {sending ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Send'}
                </Button>
                <IconButton
                  onClick={handleSendMessage}
                  disabled={(!message.trim() && attachedFiles.length === 0) || sending}
                  sx={{
                    display: { xs: 'flex', sm: 'none' },
                    bgcolor: isDarkMode ? '#6b7280' : '#2563eb',
                    color: '#fff',
                    width: 48,
                    height: 48,
                    '&:hover': {
                      bgcolor: isDarkMode ? '#4b5563' : '#1d4ed8',
                    },
                    '&.Mui-disabled': {
                      bgcolor: isDarkMode ? '#374151' : '#9ca3af',
                    },
                  }}
                >
                  {sending ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <Send />}
                </IconButton>
                <IconButton
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    bgcolor: '#2563eb',
                    color: '#fff',
                    width: 56,
                    height: 56,
                    '&:hover': { bgcolor: '#1d4ed8' },
                  }}
                >
                  <Mic />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Right Analysis Panel */}
          {caseAnalysis && (
            <Box
              sx={{
                flex: 1,
                maxWidth: { xs: '100%', lg: '50%' },
                bgcolor: colors.bg,
                borderLeft: { xs: 'none', lg: `1px solid ${colors.border}` },
                borderTop: { xs: `1px solid ${colors.border}`, lg: 'none' },
                overflowY: 'auto',
                p: { xs: 2, sm: 3 },
              }}
            >
              {/* Win Probability */}
              <Box
                sx={{
                  bgcolor: colors.bgSecondary,
                  borderRadius: 2,
                  p: { xs: 2, sm: 3 },
                  mb: 2,
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ThumbUp sx={{ color: '#10b981', fontSize: 20 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      Win Probability
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 1, fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                    {caseAnalysis.winMessage || 'You may have a strong case.'}
                  </Typography>
                  <Button
                    startIcon={<Description />}
                    size="small"
                    onClick={generateCaseReport}
                    sx={{
                      textTransform: 'none',
                      color: '#8b5cf6',
                      bgcolor: colors.bgTertiary,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      '&:hover': { bgcolor: isDarkMode ? '#3a3a3a' : '#e5e5e5' },
                    }}
                  >
                    Case Report
                  </Button>
                </Box>
                <Box
                  sx={{
                    position: 'relative',
                    width: { xs: 70, sm: 80 },
                    height: { xs: 70, sm: 80 },
                    flexShrink: 0,
                  }}
                >
                  <CircularProgress
                    variant="determinate"
                    value={parseInt(caseAnalysis.winProbability) || 65}
                    size={window.innerWidth < 600 ? 70 : 80}
                    thickness={6}
                    sx={{
                      color: '#4f46e5',
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      {caseAnalysis.winProbability || '65%'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Potentially Relevant Laws */}
              <Accordion
                defaultExpanded
                sx={{
                  bgcolor: colors.bgSecondary,
                  border: `1px solid ${colors.border}`,
                  boxShadow: 'none',
                  mb: 2,
                  '&:before': { display: 'none' },
                  color: colors.text,
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: colors.textSecondary }} />}
                  sx={{
                    '&:hover': { bgcolor: isDarkMode ? '#2d2d2d' : '#f9fafb' },
                    px: { xs: 2, sm: 3 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Gavel sx={{ color: colors.textSecondary, fontSize: { xs: 18, sm: 20 } }} />
                    <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                      Potentially Relevant Laws
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: colors.bgTertiary, borderTop: `1px solid ${colors.border}`, px: { xs: 2, sm: 3 } }}>
                  <List dense>
                    {(caseAnalysis.laws || []).map((law, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 1 }}>
                        <ListItemText
                          primary={
                            <Link
                              href={law.url || '#'}
                              target="_blank"
                              sx={{
                                color: '#2563eb',
                                textDecoration: 'none',
                                '&:hover': {
                                  textDecoration: 'underline',
                                  color: '#3b82f6',
                                },
                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                              }}
                            >
                              {law.title}
                            </Link>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>

              {/* Precedent Cases */}
              <Accordion
                sx={{
                  bgcolor: colors.bgSecondary,
                  border: `1px solid ${colors.border}`,
                  boxShadow: 'none',
                  mb: 2,
                  '&:before': { display: 'none' },
                  color: colors.text,
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: colors.textSecondary }} />}
                  sx={{
                    '&:hover': { bgcolor: isDarkMode ? '#2d2d2d' : '#f9fafb' },
                    px: { xs: 2, sm: 3 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Description sx={{ color: colors.textSecondary, fontSize: { xs: 18, sm: 20 } }} />
                    <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                      Precedent Cases
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: colors.bgTertiary, borderTop: `1px solid ${colors.border}`, px: { xs: 2, sm: 3 } }}>
                  <List dense>
                    {(caseAnalysis.precedents || []).map((precedent, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          px: 0,
                          py: 1,
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', flexWrap: 'wrap' }}>
                          <Link
                            href={precedent.url || '#'}
                            target="_blank"
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: '0.8rem', sm: '0.875rem' },
                              color: '#2563eb',
                              textDecoration: 'none',
                              '&:hover': {
                                textDecoration: 'underline',
                                color: '#3b82f6',
                              },
                              flexGrow: 1,
                              minWidth: { xs: '100%', sm: 'auto' },
                              mb: { xs: 0.5, sm: 0 },
                            }}
                          >
                            {precedent.name}
                          </Link>
                          <Chip
                            label={`Relevance: ${precedent.relevance}`}
                            size="small"
                            sx={{
                              bgcolor: isDarkMode ? '#1e3a8a' : '#dbeafe',
                              color: isDarkMode ? '#93c5fd' : '#1e40af',
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              height: { xs: 18, sm: 20 },
                            }}
                          />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>

              {/* Recommended Lawyers */}
              <Box
                sx={{
                  bgcolor: colors.bgSecondary,
                  borderRadius: 2,
                  p: { xs: 2, sm: 2 },
                  border: `1px solid ${colors.border}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <PersonOutline sx={{ color: colors.textSecondary, fontSize: { xs: 18, sm: 20 } }} />
                  <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                    Attorney Listings (Public Records)
                  </Typography>
                </Box>

                {/* STRONG LEGAL DISCLAIMER */}
                <Box sx={{
                  bgcolor: isDarkMode ? '#1f1f1f' : '#fef3c7',
                  border: `1px solid ${isDarkMode ? '#444' : '#fbbf24'}`,
                  borderRadius: 1,
                  p: 1.5,
                  mb: 2
                }}>
                  <Typography sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, color: isDarkMode ? '#fbbf24' : '#92400e', fontWeight: 600, mb: 0.5 }}>
                    ⚠️ IMPORTANT DISCLAIMER
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' }, color: isDarkMode ? '#d1d5db' : '#78350f', lineHeight: 1.4 }}>
                    The attorneys listed below are sourced from public records and state bar directories. This is NOT a recommendation or endorsement.
                    We do not verify credentials, specializations, or current standing. You MUST independently verify all information, including
                    bar status, disciplinary records, and qualifications before contacting any attorney. No attorney-client relationship is created
                    by viewing this information. Consult your state bar association for verified attorney directories.
                  </Typography>
                </Box>

                <List dense>
                  {(caseAnalysis.lawyers || []).map((lawyer, index) => (
                    lawyer.isSearchLink ? (
                      // Search link card
                      <ListItem
                        key={index}
                        component="a"
                        href={lawyer.searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          px: { xs: 1.5, sm: 2 },
                          py: 2,
                          bgcolor: colors.bgTertiary,
                          borderRadius: 1,
                          border: `2px solid #2563eb`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          textDecoration: 'none',
                          '&:hover': {
                            bgcolor: isDarkMode ? '#2d2d2d' : '#f0f7ff',
                            borderColor: '#3b82f6',
                          },
                        }}
                      >
                        <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '0.95rem' }, color: '#2563eb', textAlign: 'center' }}>
                          🔍 {lawyer.name}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, color: colors.textSecondary, textAlign: 'center' }}>
                          {lawyer.description}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, color: colors.textSecondary, mt: 0.5 }}>
                          📍 {lawyer.location} • {lawyer.specialty}
                        </Typography>
                      </ListItem>
                    ) : (
                      // Real lawyer card
                      <ListItem
                        key={index}
                        sx={{
                          px: { xs: 1.5, sm: 2 },
                          py: 1.5,
                          mb: 1,
                          bgcolor: colors.bgTertiary,
                          borderRadius: 1,
                          border: `1px solid ${colors.border}`,
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'flex-start' },
                          gap: { xs: 1, sm: 0 },
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 1.5, flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
                          <Avatar
                            sx={{
                              width: { xs: 36, sm: 40 },
                              height: { xs: 36, sm: 40 },
                              bgcolor: '#2563eb'
                            }}
                          >
                            {lawyer.name.charAt(0)}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' }, color: colors.text }}>
                              {lawyer.name}
                            </Typography>
                            <Typography sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, color: colors.textSecondary }}>
                              {lawyer.specialty}
                            </Typography>
                            <Typography sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, color: colors.textSecondary }}>
                              📍 {lawyer.location}
                            </Typography>
                            {lawyer.barNumber && (
                              <Typography sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, color: colors.textSecondary, mt: 0.5, fontFamily: 'monospace' }}>
                                🎓 {lawyer.barNumber}
                              </Typography>
                            )}
                            {lawyer.yearsExperience && (
                              <Typography sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, color: colors.textSecondary, mt: 0.5 }}>
                                ⚖️ {lawyer.yearsExperience} years experience
                              </Typography>
                            )}
                            {lawyer.isRealLawyer && (
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                <Chip
                                  label={`${lawyer.source || 'Public Record'}`}
                                  size="small"
                                  sx={{
                                    bgcolor: '#10b981',
                                    color: '#fff',
                                    fontSize: { xs: '0.6rem', sm: '0.65rem' },
                                    height: { xs: 16, sm: 18 },
                                  }}
                                />
                                <Chip
                                  label="Verify Independently"
                                  size="small"
                                  sx={{
                                    bgcolor: '#f59e0b',
                                    color: '#fff',
                                    fontSize: { xs: '0.6rem', sm: '0.65rem' },
                                    height: { xs: 16, sm: 18 },
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                        </Box>
                        <Button
                          component="a"
                          href={`https://www.google.com/search?q=${encodeURIComponent(lawyer.name + ' ' + lawyer.barNumber)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          variant="outlined"
                          sx={{
                            textTransform: 'none',
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            borderColor: colors.border,
                            color: colors.textSecondary,
                            minWidth: { xs: 60, sm: 70 },
                            width: { xs: '100%', sm: 'auto' },
                            '&:hover': {
                              borderColor: colors.borderLight,
                              bgcolor: isDarkMode ? '#2d2d2d' : '#f9fafb',
                            },
                          }}
                        >
                          Search Online
                        </Button>
                      </ListItem>
                    )
                  ))}
                </List>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Login Modal */}
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
      />

      {/* Register Modal */}
      <RegisterModal
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
      />
    </Box>
  );
};

export default Dashboard;


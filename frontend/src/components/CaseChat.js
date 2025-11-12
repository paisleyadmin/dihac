import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/material';
import { Send, ArrowBack, FileUpload, PersonAdd } from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const CaseChat = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, [caseId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/conversation/conversations/${caseId}`
      );
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setLoading(true);

    // Add user message to UI immediately
    const tempUserMsg = {
      id: Date.now(),
      user_message: userMessage,
      system_response: null,
      created_at: new Date().toISOString(),
    };
    setConversations((prev) => [...prev, tempUserMsg]);

    try {
      const response = await axios.post(`${API_URL}/api/conversation/message`, {
        case_id: parseInt(caseId),
        message: userMessage,
        message_type: 'text',
      });

      // Update with actual response
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === tempUserMsg.id
            ? {
                ...conv,
                id: response.data.conversation_id,
                system_response: response.data.system_response,
              }
            : conv
        )
      );

      // Show clarifying questions if any
      if (response.data.clarifying_questions?.length > 0) {
        // Questions are included in the response
        console.log('Clarifying questions:', response.data.clarifying_questions);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== tempUserMsg.id)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await axios.post(`${API_URL}/api/analysis/analyze-case`, {
        case_id: parseInt(caseId),
      });
      navigate(`/case/${caseId}/analysis`);
    } catch (error) {
      console.error('Error analyzing case:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('case_id', caseId);
      formData.append('description', `Uploaded: ${file.name}`);

      await axios.post(`${API_URL}/api/evidence/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Evidence uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    }
  };

  return (
    <Container maxWidth="md" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: 2 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate('/dashboard')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, ml: 1 }}>
          Case #{caseId}
        </Typography>
        <Button
          variant="contained"
          onClick={handleAnalyze}
          disabled={analyzing || conversations.length === 0}
          sx={{ mr: 1 }}
        >
          {analyzing ? <CircularProgress size={20} /> : 'Analyze Case'}
        </Button>
      </Box>

      <Paper
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          mb: 2,
          overflow: 'auto',
        }}
      >
        {conversations.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography variant="body1" color="text.secondary">
              Start a conversation by describing your situation...
            </Typography>
          </Box>
        ) : (
          <>
            {conversations.map((conv) => (
              <Box key={conv.id} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    mb: 1,
                    bgcolor: 'primary.light',
                    color: 'white',
                    borderRadius: 2,
                    maxWidth: '80%',
                    ml: 'auto',
                  }}
                >
                  <Typography variant="body1">{conv.user_message}</Typography>
                </Box>
                {conv.system_response && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'grey.100',
                      borderRadius: 2,
                      maxWidth: '80%',
                    }}
                  >
                    <Typography variant="body1">{conv.system_response}</Typography>
                  </Box>
                )}
                {!conv.system_response && loading && (
                  <Box sx={{ p: 2 }}>
                    <CircularProgress size={20} />
                  </Box>
                )}
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </Paper>

      <Box display="flex" gap={1}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <IconButton
          onClick={() => fileInputRef.current?.click()}
          color="primary"
        >
          <FileUpload />
        </IconButton>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Describe your situation..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          disabled={loading}
        />
        <Button
          variant="contained"
          onClick={sendMessage}
          disabled={loading || !message.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <Send />}
        >
          Send
        </Button>
      </Box>
    </Container>
  );
};

export default CaseChat;


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  Link,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  ThumbUp,
  ThumbDown,
  Download,
  Email,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const CaseAnalysis = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [laws, setLaws] = useState([]);
  const [precedents, setPrecedents] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchAnalysis();
  }, [caseId]);

  const fetchAnalysis = async () => {
    try {
      // Fetch analysis
      const analysisRes = await axios.post(
        `${API_URL}/api/analysis/analyze-case`,
        { case_id: parseInt(caseId) }
      );
      setAnalysis(analysisRes.data);

      // Fetch laws
      const lawsRes = await axios.get(
        `${API_URL}/api/legal_research/laws/${caseId}`
      );
      setLaws(lawsRes.data);

      // Fetch precedents
      const precRes = await axios.get(
        `${API_URL}/api/legal_research/precedents/${caseId}`
      );
      setPrecedents(precRes.data);

      // Fetch contacts
      const contactsRes = await axios.get(
        `${API_URL}/api/legal_research/contacts/${caseId}`
      );
      setContacts(contactsRes.data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/report/generate-report`,
        { case_id: parseInt(caseId) },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `case_report_${caseId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!analysis) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>No analysis available. Please analyze the case first.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(`/case/${caseId}`)}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1, ml: 1 }}>
          Case Analysis
        </Typography>
        <Button
          variant="contained"
          startIcon={downloading ? <CircularProgress size={20} /> : <Download />}
          onClick={downloadReport}
          disabled={downloading}
        >
          Download Report
        </Button>
      </Box>

      {/* Case Indicator and Win Probability */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              {analysis.case_indicator === 'thumbs_up' ? (
                <ThumbUp sx={{ fontSize: 60, color: 'success.main' }} />
              ) : (
                <ThumbDown sx={{ fontSize: 60, color: 'error.main' }} />
              )}
              <Box>
                <Typography variant="h5">
                  {analysis.case_indicator === 'thumbs_up'
                    ? 'Strong Case'
                    : 'Weak Case'}
                </Typography>
                <Typography variant="h3" color="primary">
                  {analysis.win_probability}% Win Probability
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Analysis Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analysis Summary
              </Typography>
              <Typography variant="body1">{analysis.analysis_summary}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Strengths */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                Strengths
              </Typography>
              <Typography variant="body1">{analysis.strengths}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Weaknesses */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error.main">
                Weaknesses
              </Typography>
              <Typography variant="body1">{analysis.weaknesses}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              <Typography variant="body1">{analysis.recommendations}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Relevant Laws */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Relevant Laws
              </Typography>
              {laws.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No relevant laws found.
                </Typography>
              ) : (
                <List>
                  {laws.map((law, index) => (
                    <React.Fragment key={law.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="subtitle1">
                                {law.law_title}
                              </Typography>
                              {law.law_code && (
                                <Chip
                                  label={law.law_code}
                                  size="small"
                                  sx={{ mt: 0.5, mr: 1 }}
                                />
                              )}
                              {law.law_url && (
                                <Link
                                  href={law.law_url}
                                  target="_blank"
                                  rel="noopener"
                                  sx={{ ml: 1 }}
                                >
                                  View Law
                                </Link>
                              )}
                            </Box>
                          }
                          secondary={law.description}
                        />
                      </ListItem>
                      {index < laws.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Precedent Cases */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Precedent Cases
              </Typography>
              {precedents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No precedent cases found.
                </Typography>
              ) : (
                <List>
                  {precedents.map((prec, index) => (
                    <React.Fragment key={prec.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="subtitle1">
                                {prec.case_name}
                              </Typography>
                              {prec.case_citation && (
                                <Chip
                                  label={prec.case_citation}
                                  size="small"
                                  sx={{ mt: 0.5, mr: 1 }}
                                />
                              )}
                              {prec.case_url && (
                                <Link
                                  href={prec.case_url}
                                  target="_blank"
                                  rel="noopener"
                                  sx={{ ml: 1 }}
                                >
                                  View Case
                                </Link>
                              )}
                            </Box>
                          }
                          secondary={prec.relevance_description}
                        />
                      </ListItem>
                      {index < precedents.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Legal Contacts */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recommended Legal Contacts
              </Typography>
              {contacts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No legal contacts found.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {contacts.map((contact) => (
                    <Grid item xs={12} md={6} key={contact.id}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {contact.firm_name}
                        </Typography>
                        {contact.contact_person && (
                          <Typography variant="body2" color="text.secondary">
                            Contact: {contact.contact_person}
                          </Typography>
                        )}
                        {contact.phone && (
                          <Typography variant="body2">
                            Phone: {contact.phone}
                          </Typography>
                        )}
                        {contact.email && (
                          <Typography variant="body2">
                            Email: {contact.email}
                          </Typography>
                        )}
                        {contact.website && (
                          <Link
                            href={contact.website}
                            target="_blank"
                            rel="noopener"
                            variant="body2"
                          >
                            Website
                          </Link>
                        )}
                        {contact.specialization && (
                          <Chip
                            label={contact.specialization}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CaseAnalysis;


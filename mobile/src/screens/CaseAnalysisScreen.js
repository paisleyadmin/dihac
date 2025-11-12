import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import axios from 'axios';

const API_URL = 'http://localhost:8000'; // Update with your API URL

const CaseAnalysisScreen = ({ navigation, route }) => {
  const { caseId } = route.params;
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
      const analysisRes = await axios.post(
        `${API_URL}/api/analysis/analyze-case`,
        { case_id: parseInt(caseId) }
      );
      setAnalysis(analysisRes.data);

      const lawsRes = await axios.get(
        `${API_URL}/api/legal_research/laws/${caseId}`
      );
      setLaws(lawsRes.data);

      const precRes = await axios.get(
        `${API_URL}/api/legal_research/precedents/${caseId}`
      );
      setPrecedents(precRes.data);

      const contactsRes = await axios.get(
        `${API_URL}/api/legal_research/contacts/${caseId}`
      );
      setContacts(contactsRes.data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      Alert.alert('Error', 'Failed to load analysis');
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
      // Handle PDF download (implementation depends on file handling library)
      Alert.alert('Success', 'Report downloaded');
    } catch (error) {
      console.error('Error downloading report:', error);
      Alert.alert('Error', 'Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={styles.centerContainer}>
        <Text>No analysis available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.indicator}>
          {analysis.case_indicator === 'thumbs_up' ? '👍' : '👎'}
        </Text>
        <Text style={styles.probability}>
          {analysis.win_probability}% Win Probability
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analysis Summary</Text>
        <Text style={styles.sectionContent}>{analysis.analysis_summary}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.strengthTitle]}>Strengths</Text>
        <Text style={styles.sectionContent}>{analysis.strengths}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.weaknessTitle]}>Weaknesses</Text>
        <Text style={styles.sectionContent}>{analysis.weaknesses}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        <Text style={styles.sectionContent}>{analysis.recommendations}</Text>
      </View>

      {laws.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relevant Laws</Text>
          {laws.map((law) => (
            <View key={law.id} style={styles.lawItem}>
              <Text style={styles.lawTitle}>{law.law_title}</Text>
              {law.law_code && (
                <Text style={styles.lawCode}>{law.law_code}</Text>
              )}
              {law.description && (
                <Text style={styles.lawDescription}>{law.description}</Text>
              )}
              {law.law_url && (
                <TouchableOpacity onPress={() => Linking.openURL(law.law_url)}>
                  <Text style={styles.link}>View Law</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {precedents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Precedent Cases</Text>
          {precedents.map((prec) => (
            <View key={prec.id} style={styles.precedentItem}>
              <Text style={styles.precedentName}>{prec.case_name}</Text>
              {prec.case_citation && (
                <Text style={styles.precedentCitation}>{prec.case_citation}</Text>
              )}
              {prec.relevance_description && (
                <Text style={styles.precedentDescription}>
                  {prec.relevance_description}
                </Text>
              )}
              {prec.case_url && (
                <TouchableOpacity onPress={() => Linking.openURL(prec.case_url)}>
                  <Text style={styles.link}>View Case</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {contacts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Legal Contacts</Text>
          {contacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <Text style={styles.contactName}>{contact.firm_name}</Text>
              {contact.contact_person && (
                <Text>Contact: {contact.contact_person}</Text>
              )}
              {contact.phone && <Text>Phone: {contact.phone}</Text>}
              {contact.email && <Text>Email: {contact.email}</Text>}
              {contact.website && (
                <TouchableOpacity onPress={() => Linking.openURL(contact.website)}>
                  <Text style={styles.link}>Website</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.downloadButton}
        onPress={downloadReport}
        disabled={downloading}
      >
        {downloading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.downloadButtonText}>Download Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  indicator: {
    fontSize: 60,
    marginBottom: 10,
  },
  probability: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a237e',
  },
  strengthTitle: {
    color: '#4caf50',
  },
  weaknessTitle: {
    color: '#f44336',
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  lawItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lawTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  lawCode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  lawDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  precedentItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  precedentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  precedentCitation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  precedentDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  contactItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  link: {
    color: '#1a237e',
    textDecorationLine: 'underline',
    marginTop: 5,
  },
  downloadButton: {
    backgroundColor: '#1a237e',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CaseAnalysisScreen;


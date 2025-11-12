import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://localhost:8000'; // Update with your API URL

const DashboardScreen = ({ navigation }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchCases();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCases();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchCases = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/conversation/cases`);
      setCases(response.data);
    } catch (error) {
      console.error('Error fetching cases:', error);
      Alert.alert('Error', 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const createNewCase = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/conversation/message`, {
        message: 'I want to start a new case analysis.',
      });
      navigation.navigate('CaseChat', { caseId: response.data.case_id });
    } catch (error) {
      console.error('Error creating case:', error);
      Alert.alert('Error', 'Failed to create new case');
    }
  };

  const renderCaseItem = ({ item }) => {
    const indicator = item.case_indicator === 'thumbs_up' ? '👍' : 
                     item.case_indicator === 'thumbs_down' ? '👎' : '⏳';
    
    return (
      <TouchableOpacity
        style={styles.caseCard}
        onPress={() => navigation.navigate('CaseChat', { caseId: item.id })}
      >
        <View style={styles.caseHeader}>
          <Text style={styles.caseTitle}>
            {item.title || `Case #${item.id}`}
          </Text>
          <Text style={styles.indicator}>{indicator}</Text>
        </View>
        <Text style={styles.caseDescription} numberOfLines={2}>
          {item.description || 'No description'}
        </Text>
        <View style={styles.caseFooter}>
          <Text style={styles.status}>{item.status}</Text>
          {item.win_probability && (
            <Text style={styles.probability}>
              {item.win_probability}% win probability
            </Text>
          )}
        </View>
        {item.case_indicator !== 'pending' && (
          <TouchableOpacity
            style={styles.analysisButton}
            onPress={() => navigation.navigate('CaseAnalysis', { caseId: item.id })}
          >
            <Text style={styles.analysisButtonText}>View Analysis</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.first_name || user?.email}!
        </Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.newCaseButton} onPress={createNewCase}>
        <Text style={styles.newCaseButtonText}>+ New Case</Text>
      </TouchableOpacity>

      {cases.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            No cases yet. Start a new case to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={cases}
          renderItem={renderCaseItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutText: {
    color: '#1a237e',
    fontSize: 16,
  },
  newCaseButton: {
    backgroundColor: '#1a237e',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  newCaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    padding: 20,
  },
  caseCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  caseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  indicator: {
    fontSize: 24,
  },
  caseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
  },
  probability: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: 'bold',
  },
  analysisButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 5,
    alignItems: 'center',
  },
  analysisButtonText: {
    color: '#1a237e',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default DashboardScreen;


import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';

const API_URL = 'http://localhost:8000'; // Update with your API URL

const CaseChatScreen = ({ navigation, route }) => {
  const { caseId } = route.params;
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, [caseId]);

  useEffect(() => {
    if (conversations.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [conversations]);

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
    } catch (error) {
      console.error('Error sending message:', error);
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== tempUserMsg.id)
      );
      Alert.alert('Error', 'Failed to send message');
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
      navigation.navigate('CaseAnalysis', { caseId });
    } catch (error) {
      console.error('Error analyzing case:', error);
      Alert.alert('Error', 'Failed to analyze case');
    } finally {
      setAnalyzing(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={styles.messageContainer}>
      <View style={styles.userMessage}>
        <Text style={styles.userMessageText}>{item.user_message}</Text>
      </View>
      {item.system_response ? (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.system_response}</Text>
        </View>
      ) : loading && item.id === conversations[conversations.length - 1]?.id ? (
        <View style={styles.systemMessage}>
          <ActivityIndicator size="small" />
        </View>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Case #{caseId}</Text>
        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={handleAnalyze}
          disabled={analyzing || conversations.length === 0}
        >
          {analyzing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.analyzeButtonText}>Analyze</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={conversations}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Start a conversation by describing your situation...
            </Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Describe your situation..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={loading || !message.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  analyzeButton: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  analyzeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messagesList: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 15,
  },
  userMessage: {
    backgroundColor: '#1a237e',
    padding: 12,
    borderRadius: 10,
    alignSelf: 'flex-end',
    maxWidth: '80%',
    marginBottom: 5,
  },
  userMessageText: {
    color: '#fff',
    fontSize: 14,
  },
  systemMessage: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  systemMessageText: {
    color: '#000',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CaseChatScreen;


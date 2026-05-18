import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { runAICommand } from '../api/ai.api';

type AIAssistantScreenProps = {
  token: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const EXAMPLES = [
  'Create a property named Sunrise PG in Bengaluru near the metro',
  'What details do you need before creating a new property?',
  'Help me plan units for a 5 floor PG with 4 rooms per floor',
];

export default function AIAssistantScreen({ token }: AIAssistantScreenProps) {
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Tell me what you want to do in Tenant Living. For now I can guide and clarify; action tools come next.',
    },
  ]);
  const [isSending, setIsSending] = React.useState(false);

  const sendMessage = React.useCallback(async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || isSending) {
      return;
    }

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: trimmedText,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await runAICommand({ message: trimmedText }, token);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: response.message || 'I received the command, but no message came back.',
        },
      ]);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          text: error?.message || 'AI request failed. Check backend AI config and try again.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [isSending, token]);

  return (
    <LinearGradient
      colors={['#edf7f8', '#f7fbfc', '#f4efe7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>AI Command</Text>
              <Text style={styles.subtitle}>Test natural-language operations</Text>
            </View>
            <View style={styles.statusPill}>
              <MaterialIcons name="auto-awesome" size={16} color="#006875" />
              <Text style={styles.statusText}>Gemini</Text>
            </View>
          </View>

          <ScrollView
            style={styles.messageList}
            contentContainerStyle={styles.messageContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.examples}>
              {EXAMPLES.map((example) => (
                <TouchableOpacity
                  key={example}
                  style={styles.exampleButton}
                  activeOpacity={0.75}
                  onPress={() => sendMessage(example)}
                  disabled={isSending}
                >
                  <Text style={styles.exampleText}>{example}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user' ? styles.userText : styles.assistantText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            ))}

            {isSending ? (
              <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color="#006875" />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask AI to help with a property task..."
              placeholderTextColor="#7d8b8e"
              multiline
              maxLength={1000}
              editable={!isSending}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || isSending) && styles.sendButtonDisabled]}
              activeOpacity={0.8}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || isSending}
            >
              <MaterialIcons name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: '#151d1e',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#607174',
    fontSize: 15,
    marginTop: 4,
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 104, 117, 0.1)',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    color: '#006875',
    fontSize: 12,
    fontWeight: '800',
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  examples: {
    gap: 10,
    marginBottom: 18,
    marginTop: 8,
  },
  exampleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(0, 104, 117, 0.16)',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  exampleText: {
    color: '#263638',
    fontSize: 14,
    lineHeight: 20,
  },
  messageBubble: {
    borderRadius: 8,
    marginBottom: 12,
    maxWidth: '88%',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#006875',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderColor: 'rgba(0, 104, 117, 0.12)',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#172426',
  },
  loadingBubble: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  loadingText: {
    color: '#006875',
    fontSize: 14,
    fontWeight: '700',
  },
  inputBar: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(0, 104, 117, 0.12)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 18,
  },
  input: {
    backgroundColor: '#eef6f7',
    borderColor: '#d5e4e7',
    borderRadius: 8,
    borderWidth: 1,
    color: '#172426',
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 120,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#006875',
    borderRadius: 8,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  sendButtonDisabled: {
    backgroundColor: '#9db0b4',
  },
});

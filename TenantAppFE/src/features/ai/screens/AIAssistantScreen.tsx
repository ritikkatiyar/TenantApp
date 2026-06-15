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
import { BlurView } from 'expo-blur';

import { getAIJobStatus, runAICommand } from '@/src/features/ai/api/ai.api';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';

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
  const router = useRouter();
  const { isDesktop } = useResponsive();
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
      
      if (response.jobId && response.status === 'PENDING') {
        const jobId = response.jobId;
        let pollCount = 0;
        const maxPolls = 40; // 40 * 1.5s = 60s timeout limit

        const poll = async (): Promise<string> => {
          return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
              pollCount++;
              if (pollCount > maxPolls) {
                clearInterval(interval);
                reject(new Error('AI command execution timed out. Please try again.'));
                return;
              }

              try {
                const jobStatus = await getAIJobStatus(jobId, token);
                if (jobStatus.status === 'COMPLETED') {
                  clearInterval(interval);
                  resolve(jobStatus.response || 'Command completed successfully.');
                } else if (jobStatus.status === 'FAILED') {
                  clearInterval(interval);
                  reject(new Error(jobStatus.errorMessage || 'AI execution failed.'));
                }
              } catch (pollErr) {
                console.warn('AI polling transient error:', pollErr);
              }
            }, 1500);
          });
        };

        const resultText = await poll();
        setMessages((current) => [
          ...current,
          {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            text: resultText,
          },
        ]);
      } else {
        setMessages((current) => [
          ...current,
          {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            text: response.message || 'I received the command, but no response was returned.',
          },
        ]);
      }
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          text: error?.message || 'AI request failed. Check backend configuration.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [isSending, token]);

  const renderHeader = () => {
    if (isDesktop) return null;
    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>AI Command</Text>
          </View>
        </View>
        <View style={styles.statusPill}>
          <MaterialIcons name="auto-awesome" size={16} color="#006875" />
          <Text style={styles.statusText}>Gemini</Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {isDesktop && (
          <DesktopNavBar 
            hideTabs={true}
            title="AI Command"
            onBack={() => router.back()}
            backText="Back"
          />
        )}
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.mainContainer, isDesktop && styles.mainContainerDesktop]}>
            {renderHeader()}

            <ScrollView
              style={styles.messageList}
              contentContainerStyle={styles.messageContent}
              keyboardShouldPersistTaps="handled"
            >
              {isDesktop && (
                <View style={styles.desktopHero}>
                  <Text style={styles.desktopHeroTitle}>AI Command</Text>
                </View>
              )}

              <View style={[styles.examples, isDesktop && styles.examplesDesktop]}>
                {EXAMPLES.map((example) => (
                  <TouchableOpacity
                    key={example}
                    onPress={() => sendMessage(example)}
                    disabled={isSending}
                    activeOpacity={0.75}
                    style={[{ borderRadius: 20, overflow: 'hidden' }, isDesktop && styles.exampleButtonDesktop]}
                  >
                    <BlurView
                      intensity={60}
                      tint="light"
                      style={[styles.exampleButton, isDesktop && { flex: 1, justifyContent: 'center' }]}
                    >
                      <MaterialIcons name="auto-awesome" size={14} color="#006875" />
                      <Text style={[styles.exampleText, { flexShrink: 1 }]}>{example}</Text>
                    </BlurView>
                  </TouchableOpacity>
                ))}
              </View>

              {messages.map((message) => (
                <BlurView
                  key={message.id}
                  intensity={95}
                  tint="light"
                  style={[
                    styles.messageBubble,
                    message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    isDesktop && styles.messageBubbleDesktop,
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
                </BlurView>
              ))}

              {isSending ? (
                <BlurView
                  intensity={95}
                  tint="light"
                  style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}
                >
                  <ActivityIndicator size="small" color="#006875" />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </BlurView>
              ) : null}
            </ScrollView>

            <BlurView intensity={60} tint="light" style={[styles.inputBar, isDesktop && styles.inputBarDesktop]}>
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
                onPress={() => sendMessage(input)}
                disabled={!input.trim() || isSending}
                activeOpacity={0.8}
                style={{ borderRadius: 20, overflow: 'hidden' }}
              >
                {(!input.trim() || isSending) ? (
                  <View style={[styles.sendButton, styles.sendButtonDisabled]}>
                    <MaterialIcons name="arrow-upward" size={20} color="rgba(0, 104, 117, 0.3)" />
                  </View>
                ) : (
                  <LinearGradient
                    colors={['#008394', '#005b66']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.sendButton}
                  >
                    <MaterialIcons name="arrow-upward" size={20} color="#fff" />
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </BlurView>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
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
    flexDirection: 'column',
    gap: 10,
    marginBottom: 18,
    marginTop: 8,
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  exampleText: {
    color: '#004b57',
    fontSize: 13,
    fontWeight: '600',
  },
  messageBubble: {
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: '88%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 104, 117, 0.32)',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: '#004b57',
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
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderRadius: 30,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: Platform.OS === 'ios' ? 24 : 20,
    marginHorizontal: 16,
    boxShadow: '0px 8px 32px rgba(0, 104, 117, 0.08)',
    overflow: 'hidden',
  },
  input: {
    backgroundColor: 'transparent',
    color: '#172426',
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 120,
    minHeight: 40,
    paddingHorizontal: 4,
    paddingVertical: 10,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  sendButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
    boxShadow: '0px 4px 12px rgba(0, 104, 117, 0.25)',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    boxShadow: 'none',
  },
  mainContainer: {
    flex: 1,
  },
  mainContainerDesktop: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingTop: 16,
  },
  examplesDesktop: {
    flexDirection: 'row',
    gap: 16,
  },
  exampleButtonDesktop: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 60,
  },
  inputBarDesktop: {
    marginBottom: 24,
    marginHorizontal: 0,
  },
  messageBubbleDesktop: {
    maxWidth: '75%',
  },
  desktopHero: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  desktopHeroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#151d1e',
  },
  desktopHeroSubtitle: {
    fontSize: 15,
    color: '#607174',
    marginTop: 6,
  },
});

import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef, useEffect, useState, useCallback } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { getJobStatus, runAICommand } from '@/src/features/ai/api/ai.api';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { Theme } from '@/src/theme/Theme';
import { logger } from '@/src/utils/logger';
import { createStyles } from './AIAssistantScreen.styles';

type AIAssistantScreenProps = {
  token: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
};

const QUICK_COMMANDS = [
  { icon: 'add-business', label: 'Create Property', prompt: 'Create a property named Sunrise PG in Bengaluru near the metro' },
  { icon: 'help-outline', label: 'Property Checklist', prompt: 'What details do you need before creating a new property?' },
  { icon: 'grid-view', label: 'Plan Units', prompt: 'Help me plan units for a 5 floor PG with 4 rooms per floor' },
  { icon: 'payments', label: 'Billing Summary', prompt: 'Summarize overdue rent cycles and draft invoices for this month' },
];

export default function AIAssistantScreen({ token }: AIAssistantScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop } = useResponsive();
  const scrollViewRef = useRef<ScrollView>(null);

  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your AI Property Assistant. I can help manage properties, automate rent billing worksheets, structure floor unit plans, and draft communications. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  // Auto scroll to latest message
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isSending]);

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: 'Chat history cleared. What would you like to work on next?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText || isSending) return;

      const userMessage: Message = {
        id: `${Date.now()}-user`,
        role: 'user',
        text: trimmedText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((current) => [...current, userMessage]);
      setInput('');
      setIsSending(true);

      try {
        const response = await runAICommand({ message: trimmedText }, token);

        if (response.jobId && response.status === 'PENDING') {
          const jobId = response.jobId;
          let pollCount = 0;
          const maxPolls = 40;

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
                  const jobStatus = await getJobStatus(jobId, token);
                  if (jobStatus.status === 'COMPLETED') {
                    clearInterval(interval);
                    resolve(jobStatus.response || 'Command completed successfully.');
                  } else if (jobStatus.status === 'FAILED') {
                    clearInterval(interval);
                    reject(new Error(jobStatus.errorMessage || 'AI execution failed.'));
                  }
                } catch (pollErr) {
                  logger.warn('AI polling transient error:', pollErr);
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
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else {
          setMessages((current) => [
            ...current,
            {
              id: `${Date.now()}-assistant`,
              role: 'assistant',
              text: response.message || 'I received the command, but no response was returned.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } catch (error: any) {
        setMessages((current) => [
          ...current,
          {
            id: `${Date.now()}-error`,
            role: 'assistant',
            text: error?.message || 'AI request failed. Check backend service configuration.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [isSending, token]
  );

  return (
    <PageShell
      scrollable={false}
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
    >

      {/* Main AI Workspace Card */}
      <GlassCard style={[styles.chatWorkspace, isDesktop && styles.chatWorkspaceDesktop]}>
        {/* Workspace Header */}
        <View style={styles.workspaceHeader}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#00F2FE', '#4FACFE', '#7F00FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiOrbIcon}
            >
              <MaterialIcons name="auto-awesome" size={20} color={theme.Colors.surfaceContainerLowest} />
            </LinearGradient>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.workspaceTitle}>AI Command Desk</Text>
                <View style={styles.modelBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.modelBadgeText}>Gemini 1.5 Pro</Text>
                </View>
              </View>
              <Text style={styles.workspaceSubtitle}>
                Autonomous assistant for property setups, lease worksheets, and unit management
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleClearChat}
              style={styles.headerBtn}
              activeOpacity={0.7}
            >
              <MaterialIcons name="refresh" size={18} color={theme.Colors.onSurfaceVariant} />
              <Text style={styles.headerBtnText}>Clear Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Command Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsLabel}>QUICK PROMPTS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {QUICK_COMMANDS.map((cmd, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => sendMessage(cmd.prompt)}
                disabled={isSending}
                activeOpacity={0.75}
                style={styles.suggestionChip}
              >
                <MaterialIcons name={cmd.icon as any} size={16} color={theme.Colors.primary} />
                <Text style={styles.suggestionChipText}>{cmd.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Message Stream */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesListContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                message.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant,
              ]}
            >
              {message.role === 'assistant' && (
                <View style={styles.assistantAvatar}>
                  <MaterialIcons name="auto-awesome" size={16} color={theme.Colors.primary} />
                </View>
              )}

              <View
                style={[
                  styles.bubbleWrapper,
                  message.role === 'user' && { alignItems: 'flex-end' },
                ]}
              >
                {message.role === 'user' ? (
                  <LinearGradient
                    colors={['#008394', '#005b66']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.bubble, styles.userBubble]}
                  >
                    <Text style={styles.userMessageText}>{message.text}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.bubble, styles.assistantBubble]}>
                    <Text style={styles.assistantMessageText}>{message.text}</Text>
                  </View>
                )}

                {message.timestamp && (
                  <Text style={styles.timestampText}>{message.timestamp}</Text>
                )}
              </View>
            </View>
          ))}

          {isSending && (
            <View style={[styles.messageRow, styles.messageRowAssistant]}>
              <View style={styles.assistantAvatar}>
                <MaterialIcons name="auto-awesome" size={16} color={theme.Colors.primary} />
              </View>
              <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={theme.Colors.primary} />
                <Text style={styles.loadingText}>Processing command with Gemini 1.5 Pro...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Dock */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={[styles.inputDock, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                placeholder="Ask AI to execute a task, create a property, or analyze worksheets..."
                placeholderTextColor="#7d8b8e"
                multiline
                maxLength={1000}
                editable={!isSending}
                onSubmitEditing={() => {
                  if (Platform.OS === 'web') {
                    sendMessage(input);
                  }
                }}
              />
              <TouchableOpacity
                onPress={() => sendMessage(input)}
                disabled={!input.trim() || isSending}
                activeOpacity={0.8}
                style={styles.sendButton}
              >
                {!input.trim() || isSending ? (
                  <View style={styles.sendIconDisabled}>
                    <MaterialIcons name="arrow-upward" size={20} color={theme.Colors.onSurfaceVariant} />
                  </View>
                ) : (
                  <LinearGradient
                    colors={['#00e0ff', '#0072ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sendIconActive}
                  >
                    <MaterialIcons name="arrow-upward" size={20} color={theme.Colors.surfaceContainerLowest} />
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.inputHintRow}>
              <Text style={styles.inputHint}>Press Enter to execute • Gemini 1.5 Pro Autonomous Agent</Text>
              <Text style={styles.charCount}>{input.length}/1000</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </GlassCard>
    </PageShell>
  );
}


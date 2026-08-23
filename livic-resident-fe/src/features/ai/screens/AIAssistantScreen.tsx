import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef, useEffect } from 'react';
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
  Pressable,
  Animated,
  PanResponder,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { getJobStatus, runAICommand } from '@/src/features/ai/api/ai.api';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/src/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { logger } from '@/src/utils/logger';
import { createStyles } from './AIAssistantScreen.styles';

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
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your AI Property Assistant. How can I assist with your properties, billing, or unit planning today?',
    },
  ]);
  const [isSending, setIsSending] = React.useState(false);

  // Animations & Gestures
  const translateY = useRef(new Animated.Value(500)).current;

  // Slide up on mount
  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      tension: 60,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, []);

  const animateClose = React.useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: 550,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  }, [router, translateY]);

  // PanResponder for drag-down-to-dismiss handle gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.5) {
          animateClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Auto scroll to latest message
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isSending]);

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

  return (
    <View style={styles.outerWrapper}>
      {/* Translucent Frosted Glass Background */}
      <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFillObject} />

      {isDesktop && (
        <DesktopNavBar 
          hideTabs={true}
          title="AI Command"
          onBack={() => router.back()}
          backText="Back"
        />
      )}

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        pointerEvents="box-none"
      >
        {/* Backdrop overlay listener to collapse panel when tapping anywhere outside */}
        <Pressable 
          style={styles.backdropOverlay} 
          onPress={animateClose} 
        />

        <Animated.View 
          style={[
            styles.dialogueContainer,
            isDesktop && styles.dialogueContainerDesktop,
            { 
              transform: [{ translateY }],
              paddingBottom: isDesktop ? 0 : Math.max(insets.bottom, 8) 
            }
          ]}
          pointerEvents="auto"
        >
          <BlurView intensity={95} tint="light" style={styles.glassCard}>
            {/* Drag Handle Container with PanResponder */}
            <View {...panResponder.panHandlers} style={styles.dragHandleZone}>
              <View style={styles.dragBar} />
            </View>

            {/* Header */}
            <View style={styles.dialogueHeader}>
              <View style={styles.headerTitleGroup}>
                <LinearGradient
                  colors={['#00F2FE', '#4FACFE', '#7F00FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.aiOrbIcon}
                >
                  <MaterialIcons name="auto-awesome" size={16} color={theme.Colors.surfaceContainerLowest} />
                </LinearGradient>
                <View>
                  <Text style={styles.dialogueTitle}>AI Command Desk</Text>
                  <View style={styles.onlineBadge}>
                    <View style={styles.greenDot} />
                    <Text style={styles.onlineText}>Gemini 1.5 Pro</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Message Stream */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messageStream}
              contentContainerStyle={styles.messageStreamContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {/* Quick Command Suggestions */}
              <View style={styles.suggestionBlock}>
                <Text style={styles.suggestionTitle}>QUICK COMMANDS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.Spacing.sm }}>
                  {EXAMPLES.map((example) => (
                    <TouchableOpacity
                      key={example}
                      onPress={() => sendMessage(example)}
                      disabled={isSending}
                      activeOpacity={0.75}
                      style={styles.chipButton}
                    >
                      <MaterialIcons name="bolt" size={14} color={theme.Colors.primary} />
                      <Text style={styles.chipText}>{example}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Chat Messages */}
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.msgRow,
                    message.role === 'user' ? styles.msgRowUser : styles.msgRowAssistant,
                  ]}
                >
                  {message.role === 'assistant' && (
                    <View style={styles.assistantAvatar}>
                      <MaterialIcons name="auto-awesome" size={14} color={theme.Colors.primary} />
                    </View>
                  )}

                  {message.role === 'user' ? (
                    <LinearGradient
                      colors={['#008394', '#005b66']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.bubble, styles.userBubble]}
                    >
                      <Text style={styles.userText}>{message.text}</Text>
                    </LinearGradient>
                  ) : (
                    <BlurView intensity={95} tint="light" style={[styles.bubble, styles.assistantBubble]}>
                      <Text style={styles.assistantText}>{message.text}</Text>
                    </BlurView>
                  )}
                </View>
              ))}

              {isSending && (
                <View style={[styles.msgRow, styles.msgRowAssistant]}>
                  <View style={styles.assistantAvatar}>
                    <MaterialIcons name="auto-awesome" size={14} color={theme.Colors.primary} />
                  </View>
                  <BlurView intensity={95} tint="light" style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
                    <ActivityIndicator size="small" color={theme.Colors.primary} />
                    <Text style={styles.loadingText}>Analyzing command...</Text>
                  </BlurView>
                </View>
              )}
            </ScrollView>

            {/* Input Bar */}
            <View style={[styles.dialogueFooter, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask AI to execute a task..."
                  placeholderTextColor="#7d8b8e"
                  multiline
                  maxLength={1000}
                  editable={!isSending}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 150);
                  }}
                />
                <TouchableOpacity
                  onPress={() => sendMessage(input)}
                  disabled={!input.trim() || isSending}
                  activeOpacity={0.8}
                  style={styles.sendButtonWrapper}
                >
                  {(!input.trim() || isSending) ? (
                    <View style={styles.sendButtonDisabled}>
                      <MaterialIcons name="arrow-upward" size={18} color="rgba(0, 104, 117, 0.3)" />
                    </View>
                  ) : (
                    <LinearGradient
                      colors={['#00e0ff', '#0072ff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.sendButtonActive}
                    >
                      <MaterialIcons name="arrow-upward" size={18} color={theme.Colors.surfaceContainerLowest} />
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}


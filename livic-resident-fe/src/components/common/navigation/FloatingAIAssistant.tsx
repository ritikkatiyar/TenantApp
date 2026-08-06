import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useResponsive } from '@/hooks/useResponsive';
import { usePathname } from 'expo-router';
import { runAICommand, getJobStatus } from '@/src/features/ai/api/ai.api';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const EXAMPLES = [
  'Generate rent roll for this month',
  'Send billing notification to all defaulters',
  'Help me plan units for a 5 floor PG with 4 rooms per floor',
];

export default function FloatingAIAssistant() {
  const { isDesktop } = useResponsive();
  const { accessToken } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Tell me what you want to do in Tenant Living. I can guide and perform tasks for you!',
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  
  // Animations
  const animValue = useRef(new Animated.Value(0)).current; // 0: closed, 1: open
  const bubbleScale = useRef(new Animated.Value(1)).current; // For bounce effect

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isOpen ? 1 : 0,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  // Keyboard height listener for mobile keyboard compensation
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const pathname = usePathname();

  if (isDesktop || !accessToken || pathname === '/ai' || pathname.startsWith('/ai') || pathname === '/ai-assistant') {
    return null;
  }

  const handleOpen = () => {
    Animated.sequence([
      Animated.timing(bubbleScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.spring(bubbleScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start(() => {
      setIsOpen(true);
    });
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setIsOpen(false);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMsg: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: trimmed,
    };

    setMessages((current) => [...current, userMsg]);
    setInput('');
    setIsSending(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await runAICommand({ message: trimmed }, accessToken);
      
      if (response.jobId && response.status === 'PENDING') {
        const jobId = response.jobId;
        let pollCount = 0;
        const maxPolls = 40;

        const poll = (): Promise<string> => {
          return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
              pollCount++;
              if (pollCount > maxPolls) {
                clearInterval(interval);
                reject(new Error('AI command execution timed out. Please try again.'));
                return;
              }

              try {
                const jobStatus = await getJobStatus(jobId, accessToken);
                if (jobStatus.status === 'COMPLETED') {
                  clearInterval(interval);
                  resolve(jobStatus.response || 'Command completed successfully.');
                } else if (jobStatus.status === 'FAILED') {
                  clearInterval(interval);
                  reject(new Error(jobStatus.errorMessage || 'AI command execution failed.'));
                }
              } catch (err) {
                clearInterval(interval);
                reject(err);
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
            text: response.message || 'Success!',
          },
        ]);
      }
    } catch (err: any) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: err.message || 'Sorry, I hit an error executing that request.',
        },
      ]);
    } finally {
      setIsSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  const cardWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [56, windowWidth * 0.92],
  });

  const cardMaxHeight = keyboardHeight > 0 
    ? Math.min(360, windowHeight * 0.42) 
    : Math.min(520, windowHeight * 0.65);

  const cardHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [56, cardMaxHeight],
  });

  const cardBorderRadius = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 24],
  });

  const cardRight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [20, (windowWidth * 0.08) / 2],
  });

  const cardBottom = keyboardHeight > 0 ? keyboardHeight + 10 : 20;

  const contentOpacity = animValue.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0, 0, 1],
  });

  const triggerOpacity = animValue.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [1, 0, 0],
  });

  return (
    <>
      {/* Translucent Backdrop when open */}
      {isOpen && (
        <Pressable 
          style={styles.backdrop} 
          onPress={handleClose} 
        />
      )}

      <Animated.View
        style={[
          styles.container,
          {
            width: cardWidth,
            height: cardHeight,
            borderRadius: cardBorderRadius,
            right: cardRight,
            bottom: cardBottom,
          },
        ]}
      >
        <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFillObject} />

        {/* 1. Closed State Floating Bubble Trigger */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { opacity: triggerOpacity, pointerEvents: isOpen ? 'none' : 'auto' },
          ]}
        >
          <TouchableOpacity
            style={styles.bubbleTrigger}
            onPress={handleOpen}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ scale: bubbleScale }] }}>
              <LinearGradient
                colors={['#00F2FE', '#4FACFE', '#7F00FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bubbleGradient}
              >
                <MaterialIcons name="auto-awesome" size={24} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* 2. Open State AI Desk Sheet */}
        <Animated.View
          style={[
            styles.chatContent,
            { opacity: contentOpacity, pointerEvents: isOpen ? 'auto' : 'none' },
          ]}
        >
          {/* Header with Drag / Minimize Bar */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.dragBarWrapper} 
              activeOpacity={0.6}
              onPress={handleClose}
            >
              <View style={styles.dragBar} />
            </TouchableOpacity>

            <View style={styles.headerTitleRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.headerIconWrapper}>
                  <MaterialIcons name="auto-awesome" size={16} color="#006875" />
                </View>
                <Text style={styles.headerTitle}>AI Assistant</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <MaterialIcons name="close" size={20} color="#4f6073" />
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            {/* Scrollable Message History */}
            <ScrollView
              ref={scrollRef}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {/* Example Queries */}
              <View style={styles.examplesWrapper}>
                <Text style={styles.examplesHeader}>Try asking:</Text>
                {EXAMPLES.map((ex) => (
                  <TouchableOpacity
                    key={ex}
                    style={styles.examplePill}
                    onPress={() => sendMessage(ex)}
                    disabled={isSending}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="bolt" size={14} color="#006875" />
                    <Text style={styles.exampleText} numberOfLines={1}>{ex}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Chat Bubbles */}
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.msgWrapper,
                    msg.role === 'user' ? styles.msgUser : styles.msgAssistant,
                  ]}
                >
                  <BlurView
                    intensity={95}
                    tint="light"
                    style={[
                      styles.msgBubble,
                      msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                    ]}
                  >
                    <Text
                      style={[
                        styles.msgText,
                        msg.role === 'user' ? styles.textUser : styles.textAssistant,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </BlurView>
                </View>
              ))}

              {isSending && (
                <View style={[styles.msgWrapper, styles.msgAssistant]}>
                  <BlurView intensity={90} tint="light" style={[styles.msgBubble, styles.bubbleAssistant, styles.loadingBubble]}>
                    <ActivityIndicator size="small" color="#006875" />
                    <Text style={styles.loadingText}>Thinking...</Text>
                  </BlurView>
                </View>
              )}
            </ScrollView>

            {/* Chat Footer Input */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                placeholder="Ask AI to help..."
                placeholderTextColor="#7d8b8e"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={1000}
                editable={!isSending}
                onFocus={() => {
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
                }}
              />
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => sendMessage(input)}
                disabled={isSending || !input.trim()}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#00F2FE', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendGradient}
                >
                  <MaterialIcons name="send" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 28, 48, 0.35)',
    zIndex: 99998,
  },
  container: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    overflow: 'hidden',
    shadowColor: '#006677',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 99999,
  },
  bubbleTrigger: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContent: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  dragBarWrapper: {
    alignSelf: 'center',
    width: 60,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragBar: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0, 104, 117, 0.25)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  headerIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#006875',
  },
  closeBtn: {
    padding: 6,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    gap: 12,
  },
  examplesWrapper: {
    gap: 8,
    marginBottom: 8,
  },
  examplesHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7a7d',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  examplePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  exampleText: {
    fontSize: 12,
    color: '#006875',
    fontWeight: '600',
    flex: 1,
  },
  msgWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
  msgUser: {
    justifyContent: 'flex-end',
  },
  msgAssistant: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bubbleUser: {
    backgroundColor: '#006875',
    borderColor: '#006875',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  textUser: {
    color: '#fff',
    fontWeight: '600',
  },
  textAssistant: {
    color: '#151d1e',
    fontWeight: '500',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#6b7a7d',
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13.5,
    color: '#151d1e',
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  sendGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

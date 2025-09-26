import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './Button';
import * as Clipboard from 'expo-clipboard';

interface TotpCodeProps {
  code?: string;
  timeRemaining?: number;
  period?: number;
  onRefresh?: () => void;
  onCopy?: () => void;
}

export const TotpCode: React.FC<TotpCodeProps> = ({
  code,
  timeRemaining = 0,
  period = 30,
  onRefresh,
  onCopy,
}) => {
  const { isDark } = useTheme();
  const [currentTimeRemaining, setCurrentTimeRemaining] = useState(timeRemaining);

  useEffect(() => {
    setCurrentTimeRemaining(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (currentTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setCurrentTimeRemaining(prev => {
        if (prev <= 1) {
          onRefresh?.();
          return period;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTimeRemaining, period, onRefresh]);

  const formattedCode = code ? code.replace(/(.{3})/g, '$1 ').trim() : '------';
  const progress = (currentTimeRemaining / period) * 100;

  const handleCopy = async () => {
    if (code) {
      try {
        await Clipboard.setStringAsync(code);
        onCopy?.();
      } catch (error) {
        console.error('Erro ao copiar código:', error);
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      padding: 16,
      gap: 16,
    },
    codeWrapper: {
      position: 'relative',
      alignItems: 'center',
    },
    code: {
      fontFamily: 'monospace',
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
      backgroundColor: isDark ? '#374151' : '#f9fafb',
      borderRadius: 8,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: isDark ? '#4b5563' : '#d1d5db',
      letterSpacing: 4,
      color: isDark ? '#f9fafb' : '#111827',
      opacity: currentTimeRemaining < 5 ? 0.7 : 1,
    },
    timerContainer: {
      position: 'absolute',
      top: -8,
      right: -8,
    },
    timer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderWidth: 2,
      borderColor: isDark ? '#4b5563' : '#d1d5db',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    timerInner: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    timerText: {
      fontSize: 10,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
    },
    progressRing: {
      position: 'absolute',
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    actionButton: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.codeWrapper}>
        <Text style={styles.code}>{formattedCode}</Text>
        
        <View style={styles.timerContainer}>
          <View style={styles.timer}>
            <View style={styles.timerInner}>
              <Text style={styles.timerText}>{currentTimeRemaining}s</Text>
            </View>
            {/* Progress ring would go here if needed */}
          </View>
        </View>
      </View>
      
      <View style={styles.actions}>
        <Button
          title="Copiar"
          onPress={handleCopy}
          variant="secondary"
          size="sm"
          style={styles.actionButton}
          disabled={!code}
        />
        <Button
          title="Atualizar"
          onPress={onRefresh || (() => {})}
          variant="secondary"
          size="sm"
          style={styles.actionButton}
        />
      </View>
    </View>
  );
};

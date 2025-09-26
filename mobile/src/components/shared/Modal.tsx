import React from 'react';
import { View, Text, TouchableOpacity, Modal as RNModal, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const { isDark } = useTheme();

  const getModalStyle = () => {
    const baseStyle = {
      ...styles.modal,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
    };
    switch (size) {
      case 'sm':
        return [baseStyle, styles.modalSm];
      case 'lg':
        return [baseStyle, styles.modalLg];
      default:
        return [baseStyle, styles.modalMd];
    }
  };

  const getHeaderStyle = () => ({
    ...styles.header,
    borderBottomColor: isDark ? '#374151' : '#e5e7eb',
  });

  const getTitleStyle = () => ({
    ...styles.title,
    color: isDark ? '#f9fafb' : '#111827',
  });

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={getModalStyle()}>
          <View style={getHeaderStyle()}>
            <Text style={getTitleStyle()}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSm: {
    width: '80%',
    maxHeight: '60%',
  },
  modalMd: {
    width: '90%',
    maxHeight: '80%',
  },
  modalLg: {
    width: '95%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
});

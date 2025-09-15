import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label && (
        <Text style={{
          fontSize: 14,
          fontWeight: '500',
          color: '#374151',
          marginBottom: 8,
        }}>
          {label}
        </Text>
      )}
      
      <View style={{
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <TextInput
          style={[{
            flex: 1,
            borderWidth: 1,
            borderColor: error ? '#ef4444' : '#d1d5db',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 12,
            fontSize: 16,
            color: '#111827',
            backgroundColor: disabled ? '#f9fafb' : '#ffffff',
            minHeight: multiline ? 80 : 44,
            textAlignVertical: multiline ? 'top' : 'center',
          }, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              right: 12,
              padding: 4,
            }}
            onPress={togglePasswordVisibility}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={{
          fontSize: 12,
          color: '#ef4444',
          marginTop: 4,
        }}>
          {error}
        </Text>
      )}
    </View>
  );
};

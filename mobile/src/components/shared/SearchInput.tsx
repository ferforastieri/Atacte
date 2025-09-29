import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface SearchInputProps {
  value?: string;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  showClearButton?: boolean;
  minLength?: number;
  onChangeText?: (text: string) => void;
  onSearch?: (text: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onEnter?: (text: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  placeholder = 'Pesquisar...',
  debounceMs = 300,
  disabled = false,
  autoFocus = false,
  showClearButton = true,
  minLength = 1,
  onChangeText,
  onSearch,
  onClear,
  onFocus,
  onBlur,
  onEnter,
}) => {
  const { isDark } = useTheme();
  const [inputValue, setInputValue] = useState<string>(value);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const inputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Debounce function
  const debounce = useCallback((func: Function, delay: number) => {
    return (...args: any[]) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      if (searchValue.length >= minLength) {
        setIsSearching(true);
        onSearch?.(searchValue);
        
        // Simulate search completion
        searchTimeout.current = setTimeout(() => {
          setIsSearching(false);
        }, 200);
      } else if (searchValue.length === 0) {
        // Clear search immediately when input is empty
        setIsSearching(false);
        onSearch?.('');
      }
    }, debounceMs),
    [debounceMs, minLength, onSearch]
  );

  // Handle input changes
  const handleInputChange = useCallback((text: string) => {
    setInputValue(text);
    onChangeText?.(text);
    debouncedSearch(text);
  }, [onChangeText, debouncedSearch]);

  // Handle clear button
  const handleClear = useCallback(() => {
    setInputValue('');
    onChangeText?.('');
    onClear?.();
    onSearch?.('');
    setIsSearching(false);
    
    // Clear any pending debounced calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    
    // Focus back to input
    inputRef.current?.focus();
  }, [onChangeText, onClear, onSearch]);

  // Handle submit (enter key equivalent)
  const handleSubmit = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    onEnter?.(inputValue);
    onSearch?.(inputValue);
  }, [inputValue, onEnter, onSearch]);

  // Handle focus
  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  // Handle blur
  const handleBlur = useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  // Update internal value when prop changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  // Auto focus on mount
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const styles = StyleSheet.create({
    container: {
      width: '100%',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    input: {
      flex: 1,
      paddingLeft: 40,
      paddingRight: showClearButton ? 40 : 12,
      paddingVertical: 12,
      fontSize: 16,
      borderRadius: 8,
      borderWidth: 1,
      backgroundColor: isDark ? '#374151' : '#ffffff',
      borderColor: isDark ? '#4b5563' : '#d1d5db',
      color: isDark ? '#f9fafb' : '#111827',
    },
    inputFocused: {
      borderColor: '#3b82f6',
      borderWidth: 2,
    },
    inputDisabled: {
      backgroundColor: isDark ? '#1f2937' : '#f9fafb',
      color: isDark ? '#6b7280' : '#9ca3af',
    },
    searchIcon: {
      position: 'absolute',
      left: 12,
      zIndex: 1,
    },
    clearButton: {
      position: 'absolute',
      right: 12,
      padding: 4,
      borderRadius: 4,
      backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
    },
    loadingContainer: {
      position: 'absolute',
      right: showClearButton ? 44 : 12,
      top: '50%',
      transform: [{ translateY: -10 }],
    },
    placeholderText: {
      color: isDark ? '#9ca3af' : '#6b7280',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Ionicons
          name="search"
          size={20}
          color={isDark ? '#9ca3af' : '#6b7280'}
          style={styles.searchIcon}
        />
        
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            disabled && styles.inputDisabled,
          ]}
          value={inputValue}
          onChangeText={handleInputChange}
          onSubmitEditing={handleSubmit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
          editable={!disabled}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never" // We handle clear button manually
        />
        
        {showClearButton && inputValue.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            disabled={disabled}
          >
            <Ionicons
              name="close"
              size={16}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
          </TouchableOpacity>
        )}
        
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
              color={isDark ? '#3b82f6' : '#3b82f6'}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default SearchInput;

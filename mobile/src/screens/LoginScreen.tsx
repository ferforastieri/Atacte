import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { Button, Input, Card, Logo } from '../components/shared';
import { authService } from '../services/auth/authService';
import { useToast } from '../hooks/useToast';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleLogin = async () => {
    if (!email || !masterPassword) {
      showError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({ email, masterPassword });
      
      if (response.success) {
        showSuccess('Login realizado com sucesso!');
        onLogin();
      } else {
        showError(response.message || 'Erro ao fazer login');
      }
    } catch (error) {
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !masterPassword) {
      showError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.register({ email, masterPassword });
      
      if (response.success) {
        showSuccess('Conta criada com sucesso!');
        onLogin();
      } else {
        showError(response.message || 'Erro ao criar conta');
      }
    } catch (error) {
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Logo size={48} showText={true} textSize={32} />
        <Text style={styles.subtitle}>Gerenciador de Senhas</Text>
      </View>

      <Card style={styles.formCard}>
        <Text style={styles.formTitle}>
          {isRegisterMode ? 'Criar Conta' : 'Fazer Login'}
        </Text>

        <Input
          label="Email"
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Input
          label="Senha Mestra"
          placeholder="Sua senha mestra"
          value={masterPassword}
          onChangeText={setMasterPassword}
          secureTextEntry
        />

        <Button
          title={isRegisterMode ? 'Criar Conta' : 'Entrar'}
          onPress={isRegisterMode ? handleRegister : handleLogin}
          loading={isLoading}
          style={styles.submitButton}
        />

        <Button
          title={isRegisterMode ? 'Já tenho uma conta' : 'Criar nova conta'}
          onPress={() => setIsRegisterMode(!isRegisterMode)}
          variant="ghost"
          style={styles.toggleButton}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  formCard: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 12,
  },
  toggleButton: {
    marginTop: 8,
  },
});

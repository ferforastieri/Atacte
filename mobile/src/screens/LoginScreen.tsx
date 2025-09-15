import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { Button, Input, Card } from '../components/shared';
import { authService } from '../services/auth/authService';
import { useToast } from '../hooks/useToast';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const { showSuccess, showError } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      
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
    if (!name || !email || !password) {
      showError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.register({ name, email, password });
      
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
        <Text style={styles.title}>Atacte</Text>
        <Text style={styles.subtitle}>Gerenciador de Senhas</Text>
      </View>

      <Card style={styles.formCard}>
        <Text style={styles.formTitle}>
          {isRegisterMode ? 'Criar Conta' : 'Fazer Login'}
        </Text>

        {isRegisterMode && (
          <Input
            label="Nome"
            placeholder="Seu nome completo"
            value={name}
            onChangeText={setName}
          />
        )}

        <Input
          label="Email"
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Input
          label="Senha"
          placeholder="Sua senha"
          value={password}
          onChangeText={setPassword}
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
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
    color: '#1f2937',
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

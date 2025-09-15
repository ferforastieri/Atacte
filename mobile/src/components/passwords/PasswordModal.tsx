import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { Modal, Button, Input } from '../shared';
import { passwordService } from '../../services/passwords/passwordService';
import { useToast } from '../../hooks/useToast';

interface PasswordEntry {
  id: string;
  name: string;
  website?: string;
  username?: string;
  password: string;
  folder?: string;
  notes?: string;
  isFavorite: boolean;
  totpEnabled: boolean;
}

interface PasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  password?: PasswordEntry | null;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
  password,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    username: '',
    password: '',
    folder: '',
    notes: '',
    isFavorite: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (password) {
      setFormData({
        name: password.name,
        website: password.website || '',
        username: password.username || '',
        password: password.password,
        folder: password.folder || '',
        notes: password.notes || '',
        isFavorite: password.isFavorite,
      });
    } else {
      setFormData({
        name: '',
        website: '',
        username: '',
        password: '',
        folder: '',
        notes: '',
        isFavorite: false,
      });
    }
  }, [password, visible]);

  const handleSave = async () => {
    if (!formData.name || !formData.password) {
      showError('Nome e senha são obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      let response;
      
      if (password) {
        // Editar senha existente
        response = await passwordService.updatePassword(password.id, formData);
      } else {
        // Criar nova senha
        response = await passwordService.createPassword(formData);
      }

      if (response.success) {
        showSuccess(password ? 'Senha atualizada!' : 'Senha criada!');
        onSuccess();
        onClose();
      } else {
        showError(response.message || 'Erro ao salvar senha');
      }
    } catch (error) {
      showError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!password) return;

    Alert.alert(
      'Excluir Senha',
      'Tem certeza que deseja excluir esta senha?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await passwordService.deletePassword(password.id);
              if (response.success) {
                showSuccess('Senha excluída!');
                onSuccess();
                onClose();
              } else {
                showError(response.message || 'Erro ao excluir senha');
              }
            } catch (error) {
              showError('Erro de conexão. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={password ? 'Editar Senha' : 'Nova Senha'}
      size="lg"
    >
      <View style={styles.form}>
        <Input
          label="Nome *"
          placeholder="Nome da senha"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />

        <Input
          label="Website"
          placeholder="https://exemplo.com"
          value={formData.website}
          onChangeText={(text) => setFormData({ ...formData, website: text })}
          keyboardType="url"
        />

        <Input
          label="Username"
          placeholder="Nome de usuário"
          value={formData.username}
          onChangeText={(text) => setFormData({ ...formData, username: text })}
        />

        <Input
          label="Senha *"
          placeholder="Sua senha"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
        />

        <Input
          label="Pasta"
          placeholder="Pasta (opcional)"
          value={formData.folder}
          onChangeText={(text) => setFormData({ ...formData, folder: text })}
        />

        <Input
          label="Notas"
          placeholder="Notas adicionais"
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          multiline
          numberOfLines={3}
        />

        <View style={styles.actions}>
          {password && (
            <Button
              title="Excluir"
              onPress={handleDelete}
              variant="danger"
              style={styles.deleteButton}
            />
          )}
          
          <View style={styles.saveActions}>
            <Button
              title="Cancelar"
              onPress={onClose}
              variant="ghost"
              style={styles.cancelButton}
            />
            <Button
              title={password ? 'Atualizar' : 'Criar'}
              onPress={handleSave}
              loading={isLoading}
              style={styles.saveButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  actions: {
    marginTop: 24,
    gap: 16,
  },
  deleteButton: {
    alignSelf: 'flex-start',
  },
  saveActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import passwordsApi, { type PasswordEntry, type CreatePasswordRequest, type UpdatePasswordRequest, type PasswordSearchFilters } from '@/api/passwords'
import importExportApi from '@/api/importExport'
import totpApi, { type TOTPCode } from '@/api/totp'

export const usePasswordsStore = defineStore('passwords', () => {
  // Estado
  const passwords = ref<PasswordEntry[]>([])
  const currentPassword = ref<PasswordEntry | null>(null)
  const folders = ref<string[]>([])
  const isLoading = ref(false)
  const pagination = ref({
    total: 0,
    limit: 50,
    offset: 0,
    currentPage: 1
  })
  const searchFilters = ref<PasswordSearchFilters>({
    query: '',
    folder: '',
    isFavorite: undefined,
    limit: 50,
    offset: 0,
    sortBy: 'name',
    sortOrder: 'asc'
  })

  // Getters
  const favoritePasswords = computed(() => 
    passwords.value.filter(p => p.isFavorite)
  )

  // Estatísticas completas (não apenas da página atual)
  const allFavoritePasswords = ref<PasswordEntry[]>([])
  const allTotpEnabledPasswords = ref<PasswordEntry[]>([])
  const statsLoaded = ref(false)

  const passwordsByFolder = computed(() => {
    const grouped = passwords.value.reduce((acc, password) => {
      const folder = password.folder || 'Sem pasta'
      if (!acc[folder]) {
        acc[folder] = []
      }
      acc[folder].push(password)
      return acc
    }, {} as Record<string, PasswordEntry[]>)
    
    return Object.entries(grouped).map(([folder, passwords]) => ({
      folder,
      passwords,
      count: passwords.length
    }))
  })

  const totalCount = computed(() => pagination.value.total)

  // Agora usamos as senhas diretamente do backend (já filtradas e paginadas)
  const searchResults = computed(() => passwords.value)

  // Actions
  const fetchPasswords = async (filters?: Partial<PasswordSearchFilters>) => {
    isLoading.value = true
    try {
      const currentFilters = { ...searchFilters.value, ...filters }
      const response = await passwordsApi.searchPasswords(currentFilters)
      
      if (response.success) {
        passwords.value = response.data
        // Atualizar informações de paginação
        if (response.pagination) {
          pagination.value = {
            total: response.pagination.total,
            limit: response.pagination.limit,
            offset: response.pagination.offset,
            currentPage: Math.floor(response.pagination.offset / response.pagination.limit) + 1
          }
        }
        return response.data
      }
      throw new Error(response.message || 'Erro ao buscar senhas')
    } catch (error) {
      console.error('Erro ao buscar senhas:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchPasswordById = async (id: string) => {
    isLoading.value = true
    try {
      const response = await passwordsApi.getPasswordById(id)
      if (response.success) {
        currentPassword.value = response.data
        return response.data
      }
      throw new Error(response.message || 'Erro ao buscar senha')
    } finally {
      isLoading.value = false
    }
  }

  const createPassword = async (passwordData: CreatePasswordRequest) => {
    isLoading.value = true
    try {
      const response = await passwordsApi.createPassword(passwordData)
      if (response.success) {
        passwords.value.push(response.data)
        await fetchFolders() // Atualizar lista de pastas
        return response.data
      }
      throw new Error(response.message || 'Erro ao criar senha')
    } finally {
      isLoading.value = false
    }
  }

  const updatePassword = async (id: string, passwordData: UpdatePasswordRequest) => {
    isLoading.value = true
    try {
      // Separar dados TOTP dos dados da senha
      const { totpEnabled, totpSecret, ...passwordFields } = passwordData
      
      // Atualizar dados da senha (sem TOTP)
      const response = await passwordsApi.updatePassword(id, passwordFields)
      
      if (response.success) {
        // Se há mudanças no TOTP, gerenciar separadamente
        if (totpEnabled && totpSecret) {
          // Adicionar ou atualizar TOTP
          await addTotp(id, totpSecret)
        } else if (totpEnabled === false) {
          // Remover TOTP se foi desabilitado
          await removeTotp(id)
        }
        
        // Atualizar a senha na lista
        const index = passwords.value.findIndex(p => p.id === id)
        if (index !== -1) {
          passwords.value[index] = response.data
        }
        if (currentPassword.value?.id === id) {
          currentPassword.value = response.data
        }
        await fetchFolders() // Atualizar lista de pastas
        return response.data
      }
      throw new Error(response.message || 'Erro ao atualizar senha')
    } finally {
      isLoading.value = false
    }
  }

  const deletePassword = async (id: string) => {
    isLoading.value = true
    try {
      const response = await passwordsApi.deletePassword(id)
      if (response.success) {
        passwords.value = passwords.value.filter(p => p.id !== id)
        if (currentPassword.value?.id === id) {
          currentPassword.value = null
        }
        await fetchFolders() // Atualizar lista de pastas
        return response.data
      }
      throw new Error(response.message || 'Erro ao deletar senha')
    } finally {
      isLoading.value = false
    }
  }

  const fetchFolders = async () => {
    try {
      const response = await passwordsApi.searchPasswords({})
      if (response.success) {
        const foldersSet = new Set<string>()
        response.data.forEach((password: PasswordEntry) => {
          if (password.folder) {
            foldersSet.add(password.folder)
          }
        })
        folders.value = Array.from(foldersSet).sort()
      }
    } catch (error) {
      console.error('Erro ao buscar pastas:', error)
    }
  }

  const generatePassword = async (options: any = {}) => {
    try {
      const response = await passwordsApi.generatePassword(options)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Erro ao gerar senha')
    } catch (error) {
      throw error
    }
  }

  // TOTP Actions
  const getTotpCode = async (id: string) => {
    try {
      const response = await totpApi.getTotpCode(id)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Erro ao buscar código TOTP')
    } catch (error) {
      throw error
    }
  }

  const addTotp = async (id: string, totpInput: string) => {
    isLoading.value = true
    try {
      const response = await totpApi.addTotpToPassword(id, totpInput)
      if (response.success) {
        // Atualizar a senha na lista
        const index = passwords.value.findIndex(p => p.id === id)
        if (index !== -1) {
          passwords.value[index] = response.data
        }
        if (currentPassword.value?.id === id) {
          currentPassword.value = response.data
        }
        return response.data
      }
      throw new Error(response.message || 'Erro ao adicionar TOTP')
    } finally {
      isLoading.value = false
    }
  }

  const removeTotp = async (id: string) => {
    isLoading.value = true
    try {
      const response = await totpApi.removeTotpFromPassword(id)
      if (response.success) {
        // Atualizar a senha na lista
        const index = passwords.value.findIndex(p => p.id === id)
        if (index !== -1) {
          passwords.value[index] = response.data
        }
        if (currentPassword.value?.id === id) {
          currentPassword.value = response.data
        }
        return response.data
      }
      throw new Error(response.message || 'Erro ao remover TOTP')
    } finally {
      isLoading.value = false
    }
  }

  // Importação
  const importPasswords = async (jsonData: any) => {
    isLoading.value = true
    try {
      const response = await importExportApi.importPasswords(jsonData)
      if (response.success) {
        // Recarregar lista de senhas e pastas
        await fetchPasswords()
        await fetchFolders()
        return response.data
      }
      throw new Error(response.message || 'Erro ao importar senhas')
    } finally {
      isLoading.value = false
    }
  }

  // Exportação
  const exportToBitwarden = async () => {
    try {
      const result = await importExportApi.exportToBitwarden()
      return result
    } catch (error) {
      throw error
    }
  }

  const exportToCSV = async () => {
    try {
      const result = await importExportApi.exportToCSV()
      return result
    } catch (error) {
      throw error
    }
  }

  // Carregar estatísticas completas
  const loadCompleteStats = async () => {
    try {
      // Buscar todas as senhas favoritas
      const favoritesResponse = await passwordsApi.searchPasswords({
        isFavorite: true,
        limit: 1000, // Buscar muitas senhas favoritas
        offset: 0
      })
      
      if (favoritesResponse.success) {
        allFavoritePasswords.value = favoritesResponse.data.passwords
      }

      // Buscar todas as senhas com TOTP
      const totpResponse = await passwordsApi.searchPasswords({
        totpEnabled: true,
        limit: 1000, // Buscar muitas senhas com TOTP
        offset: 0
      })
      
      if (totpResponse.success) {
        allTotpEnabledPasswords.value = totpResponse.data
      }

      statsLoaded.value = true
    } catch (error) {
      console.error('Erro ao carregar estatísticas completas:', error)
    }
  }

  // Utilitários
  const setSearchFilters = (filters: Partial<PasswordSearchFilters>) => {
    searchFilters.value = { ...searchFilters.value, ...filters }
  }

  const clearSearch = () => {
    searchFilters.value = {
      query: '',
      folder: '',
      isFavorite: undefined,
      limit: 50,
      offset: 0,
      sortBy: 'name',
      sortOrder: 'asc'
    }
  }

  const clearCurrentPassword = () => {
    currentPassword.value = null
  }

  // Funções de paginação
  const goToPage = async (page: number) => {
    const newOffset = (page - 1) * pagination.value.limit
    await fetchPasswords({ offset: newOffset })
  }

  const nextPage = async () => {
    const totalPages = Math.ceil(pagination.value.total / pagination.value.limit)
    if (pagination.value.currentPage < totalPages) {
      await goToPage(pagination.value.currentPage + 1)
    }
  }

  const previousPage = async () => {
    if (pagination.value.currentPage > 1) {
      await goToPage(pagination.value.currentPage - 1)
    }
  }

  const setPageSize = async (size: number) => {
    await fetchPasswords({ limit: size, offset: 0 })
  }


  return {
    // Estado
    passwords,
    currentPassword,
    folders,
    isLoading,
    searchFilters,
    pagination,
    
    // Getters
    favoritePasswords,
    passwordsByFolder,
    totalCount,
    searchResults,
    
    // Estatísticas completas
    allFavoritePasswords,
    allTotpEnabledPasswords,
    statsLoaded,
    loadCompleteStats,
    
    // Actions
    fetchPasswords,
    fetchPasswordById,
    createPassword,
    updatePassword,
    deletePassword,
    fetchFolders,
    generatePassword,
    
    // TOTP Actions
    getTotpCode,
    addTotp,
    removeTotp,
    
    // Importação
    importPasswords,
    
    // Exportação
    exportToBitwarden,
    exportToCSV,
    
    // Paginação
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    
    // Utilitários
    setSearchFilters,
    clearSearch,
    clearCurrentPassword
  }
})

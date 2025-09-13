import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import passwordsApi, { type PasswordEntry, type CreatePasswordRequest, type UpdatePasswordRequest, type PasswordSearchFilters } from '@/api/passwords'

export const usePasswordsStore = defineStore('passwords', () => {
  // Estado
  const passwords = ref<PasswordEntry[]>([])
  const currentPassword = ref<PasswordEntry | null>(null)
  const folders = ref<string[]>([])
  const isLoading = ref(false)
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

  const totalCount = computed(() => passwords.value.length)

  const searchResults = computed(() => {
    let filtered = passwords.value

    if (searchFilters.value.query) {
      const query = searchFilters.value.query.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.website?.toLowerCase().includes(query) ||
        p.username?.toLowerCase().includes(query) ||
        p.notes?.toLowerCase().includes(query)
      )
    }

    if (searchFilters.value.folder) {
      filtered = filtered.filter(p => p.folder === searchFilters.value.folder)
    }

    if (searchFilters.value.isFavorite !== undefined) {
      filtered = filtered.filter(p => p.isFavorite === searchFilters.value.isFavorite)
    }

    // Ordenar
    filtered.sort((a, b) => {
      const field = searchFilters.value.sortBy || 'name'
      const order = searchFilters.value.sortOrder || 'asc'
      
      let aValue = a[field as keyof PasswordEntry]
      let bValue = b[field as keyof PasswordEntry]
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase()
      if (typeof bValue === 'string') bValue = bValue.toLowerCase()
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  })

  // Actions
  const fetchPasswords = async (filters?: Partial<PasswordSearchFilters>) => {
    isLoading.value = true
    try {
      const currentFilters = { ...searchFilters.value, ...filters }
      const response = await passwordsApi.searchPasswords(currentFilters)
      
      if (response.success) {
        passwords.value = response.data
        return response.data
      }
      throw new Error(response.message || 'Erro ao buscar senhas')
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
      const response = await passwordsApi.updatePassword(id, passwordData)
      if (response.success) {
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
      const response = await passwordsApi.getTotpCode(id)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Erro ao buscar código TOTP')
    } catch (error) {
      throw error
    }
  }

  const addTotp = async (id: string, totpSecret: string) => {
    isLoading.value = true
    try {
      const response = await passwordsApi.addTotp(id, totpSecret)
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
      const response = await passwordsApi.removeTotp(id)
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

  return {
    // Estado
    passwords,
    currentPassword,
    folders,
    isLoading,
    searchFilters,
    
    // Getters
    favoritePasswords,
    passwordsByFolder,
    totalCount,
    searchResults,
    
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
    
    // Utilitários
    setSearchFilters,
    clearSearch,
    clearCurrentPassword
  }
})

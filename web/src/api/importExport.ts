import api from './index'

// API de import/export
const importExportApi = {
  // === IMPORTAÇÃO ===
  // Importar senhas do Bitwarden
  async importPasswords(jsonData: any) {
    const response = await api.post('/import-export/import', jsonData)
    return response.data
  },

  // === EXPORTAÇÃO ===
  // Exportar para formato Bitwarden
  async exportToBitwarden() {
    const response = await api.get('/import-export/export/bitwarden', {
      responseType: 'blob'
    })
    
    // Criar link de download
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    
    // Extrair nome do arquivo do header Content-Disposition
    const contentDisposition = response.headers['content-disposition']
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `atacte-passwords-${new Date().toISOString().split('T')[0]}.json`
    
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return { success: true, filename }
  },

  // Exportar para formato CSV
  async exportToCSV() {
    const response = await api.get('/import-export/export/csv', {
      responseType: 'blob'
    })
    
    // Criar link de download
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    
    // Extrair nome do arquivo do header Content-Disposition
    const contentDisposition = response.headers['content-disposition']
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `atacte-passwords-${new Date().toISOString().split('T')[0]}.csv`
    
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return { success: true, filename }
  }
}

export default importExportApi

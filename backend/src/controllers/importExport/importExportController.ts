import { Router, Request, Response } from 'express'
import importExportService from '../../services/importExport/importExportService'
import { ImportExportRepository } from '../../repositories/importExport/importExportRepository'
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth'

const router = Router()
const importExportRepository = new ImportExportRepository()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// === IMPORTAÇÃO ===
// POST /api/import-export/import - Importar senhas do Bitwarden
router.post('/import', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id
    const importData = req.body

    // Validar dados de entrada
    const validation = importExportService.validateImportData(importData)
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Dados de importação inválidos',
        errors: validation.errors
      })
    }

    // Processar importação
    const result = await importExportService.importFromBitwarden(userId, importData)

    // Log da importação
    await importExportRepository.createAuditLog({
      userId,
      action: 'IMPORT_PASSWORDS',
      details: `Importação de ${result.imported} senhas, ${result.duplicates} duplicatas ignoradas`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    })

    res.json({
      success: true,
      data: result,
      message: `Importação concluída: ${result.imported} senhas importadas, ${result.duplicates} duplicatas ignoradas`
    })

  } catch (error: any) {
    console.error('Erro na importação:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor durante a importação',
      error: error.message
    })
  }
})

// === EXPORTAÇÃO ===
// GET /api/import-export/export/bitwarden - Exportar para formato Bitwarden
router.get('/export/bitwarden', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id

    // Processar exportação
    const result = await importExportService.exportToBitwarden(userId)

    // Log da exportação
    await importExportRepository.createAuditLog({
      userId,
      action: 'EXPORT_PASSWORDS',
      details: `Exportação de ${result.total} senhas para formato Bitwarden`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    })

    // Configurar headers para download
    const filename = `atacte-passwords-${new Date().toISOString().split('T')[0]}.json`
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    res.json({
      success: true,
      data: result.data,
      message: `Exportação concluída: ${result.total} senhas exportadas`
    })

  } catch (error: any) {
    console.error('Erro na exportação:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor durante a exportação',
      error: error.message
    })
  }
})

// GET /api/import-export/export/csv - Exportar para formato CSV
router.get('/export/csv', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id

    // Processar exportação
    const result = await importExportService.exportToCSV(userId)

    // Log da exportação
    await importExportRepository.createAuditLog({
      userId,
      action: 'EXPORT_PASSWORDS',
      details: `Exportação de ${result.total} senhas para formato CSV`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    })

    // Configurar headers para download
    const filename = `atacte-passwords-${new Date().toISOString().split('T')[0]}.csv`
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    res.send(result.data)

  } catch (error: any) {
    console.error('Erro na exportação CSV:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor durante a exportação CSV',
      error: error.message
    })
  }
})

export default router

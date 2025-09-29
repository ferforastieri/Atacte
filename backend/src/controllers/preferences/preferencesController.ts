import express from 'express';
import { PreferencesService } from '../../services/preferences/preferencesService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();
const preferencesService = new PreferencesService();


router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const preferences = await preferencesService.getUserPreferences(req.user.id);
    
    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Preferências não encontradas'
      });
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar preferências'
    });
  }
});


router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { theme, language, autoLock } = req.body;
    
    const preferences = await preferencesService.createUserPreferences(req.user.id, {
      userId: req.user.id,
      theme,
      language,
      autoLock,
    });

    res.status(201).json({
      success: true,
      data: preferences,
      message: 'Preferências criadas com sucesso'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Erro ao criar preferências',
      error: error.message
    });
  }
});


router.put('/', authenticateToken, async (req: any, res) => {
  try {
    
    const { theme, language, autoLock } = req.body;
    
    
    const preferences = await preferencesService.updateUserPreferences(req.user.id, {
      theme,
      language,
      autoLock,
    });


    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Preferências não encontradas'
      });
    }

    res.json({
      success: true,
      data: preferences,
      message: 'Preferências atualizadas com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao atualizar preferências:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao atualizar preferências',
      error: error.message
    });
  }
});


router.patch('/', authenticateToken, async (req: any, res) => {
  try {
    
    const { theme, language, autoLock } = req.body;
    
    
    const preferences = await preferencesService.upsertUserPreferences(req.user.id, {
      userId: req.user.id,
      theme,
      language,
      autoLock,
    });


    res.json({
      success: true,
      data: preferences,
      message: 'Preferências salvas com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao fazer upsert das preferências:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao salvar preferências',
      error: error.message
    });
  }
});


router.delete('/', authenticateToken, async (req: any, res) => {
  try {
    const deleted = await preferencesService.deleteUserPreferences(req.user.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Preferências não encontradas'
      });
    }

    res.json({
      success: true,
      message: 'Preferências deletadas com sucesso'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar preferências'
    });
  }
});

export default router;

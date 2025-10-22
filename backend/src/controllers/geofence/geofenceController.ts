import { Router, Request, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { GeofenceService } from '../../services/geofence/geofenceService';

const router = Router();
const geofenceService = new GeofenceService();

// POST /api/geofence/zones
router.post('/zones', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, description, latitude, longitude, radius, notifyOnEnter, notifyOnExit } = req.body;

    // Validações
    if (!name || !latitude || !longitude || !radius) {
      res.status(400).json({
        success: false,
        message: 'Nome, latitude, longitude e raio são obrigatórios',
      });
      return;
    }

    if (radius < 50 || radius > 10000) {
      res.status(400).json({
        success: false,
        message: 'O raio deve estar entre 50 e 10000 metros',
      });
      return;
    }

    const zone = await geofenceService.createZone(
      userId,
      {
        name,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseFloat(radius),
        notifyOnEnter,
        notifyOnExit,
      },
      req
    );

    res.status(201).json({
      success: true,
      data: zone,
    });
  } catch (error: any) {
    console.error('Erro ao criar zona:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar zona',
    });
  }
});

// GET /api/geofence/zones
router.get('/zones', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { active } = req.query;

    const zones = active === 'true'
      ? await geofenceService.getActiveUserZones(userId)
      : await geofenceService.getUserZones(userId);

    res.json({
      success: true,
      data: zones,
    });
  } catch (error: any) {
    console.error('Erro ao buscar zonas:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar zonas',
    });
  }
});

// GET /api/geofence/zones/:id
router.get('/zones/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const zone = await geofenceService.getZoneById(userId, id);

    if (!zone) {
      res.status(404).json({
        success: false,
        message: 'Zona não encontrada',
      });
      return;
    }

    res.json({
      success: true,
      data: zone,
    });
  } catch (error: any) {
    console.error('Erro ao buscar zona:', error);
    res.status(error.message.includes('permissão') ? 403 : 500).json({
      success: false,
      message: error.message || 'Erro ao buscar zona',
    });
  }
});

// PATCH /api/geofence/zones/:id
router.patch('/zones/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, description, latitude, longitude, radius, isActive, notifyOnEnter, notifyOnExit } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (radius !== undefined) {
      const radiusValue = parseFloat(radius);
      if (radiusValue < 50 || radiusValue > 10000) {
        res.status(400).json({
          success: false,
          message: 'O raio deve estar entre 50 e 10000 metros',
        });
        return;
      }
      updateData.radius = radiusValue;
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notifyOnEnter !== undefined) updateData.notifyOnEnter = notifyOnEnter;
    if (notifyOnExit !== undefined) updateData.notifyOnExit = notifyOnExit;

    const zone = await geofenceService.updateZone(userId, id, updateData, req);

    res.json({
      success: true,
      data: zone,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar zona:', error);
    res.status(error.message.includes('permissão') ? 403 : 500).json({
      success: false,
      message: error.message || 'Erro ao atualizar zona',
    });
  }
});

// DELETE /api/geofence/zones/:id
router.delete('/zones/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await geofenceService.deleteZone(userId, id, req);

    res.json({
      success: true,
      message: 'Zona deletada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao deletar zona:', error);
    res.status(error.message.includes('permissão') ? 403 : 500).json({
      success: false,
      message: error.message || 'Erro ao deletar zona',
    });
  }
});

// POST /api/geofence/check
router.post('/check', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      res.status(400).json({
        success: false,
        message: 'Latitude e longitude são obrigatórias',
      });
      return;
    }

    const zonesInRange = await geofenceService.checkLocationInZones(
      userId,
      parseFloat(latitude),
      parseFloat(longitude)
    );

    res.json({
      success: true,
      data: {
        inZones: zonesInRange.length > 0,
        zones: zonesInRange,
      },
    });
  } catch (error: any) {
    console.error('Erro ao verificar localização:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao verificar localização',
    });
  }
});

export default router;

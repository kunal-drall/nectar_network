import { Router, Request, Response } from 'express';
import { injectServices } from '../utils/middleware';

const router = Router();

// Use service injection middleware
router.use(injectServices);

/**
 * GET /api/providers
 * Get all providers or filter by status
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, capability } = req.query;

    if (!(req as any).providerManager) {
      return res.status(503).json({ error: 'Service not available' });
    }

    let providers;

    if (status === 'online') {
      providers = (req as any).providerManager.getOnlineProviders();
    } else if (status === 'available') {
      providers = (req as any).providerManager.getAvailableProviders();
    } else if (capability) {
      providers = (req as any).providerManager.getProvidersByCapability(capability as string);
    } else {
      providers = (req as any).providerManager.getAllProviders();
    }

    return res.json({
      success: true,
      data: providers,
      total: providers.length
    });

  } catch (error) {
    console.error('Error fetching providers:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/providers/:address
 * Get specific provider by address
 */
router.get('/:address', (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!(req as any).providerManager) {
      return res.status(503).json({ error: 'Service not available' });
    }

    const provider = (req as any).providerManager.getProvider(address);

    if (!provider) {
      return res.status(404).json({ 
        success: false, 
        error: 'Provider not found' 
      });
    }

    return res.json({
      success: true,
      data: provider
    });

  } catch (error) {
    console.error('Error fetching provider:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/providers/:address/heartbeat
 * Update provider heartbeat
 */
router.post('/:address/heartbeat', (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!(req as any).providerManager) {
      return res.status(503).json({ error: 'Service not available' });
    }

    if (!(req as any).providerManager.isProviderRegistered(address)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Provider not registered' 
      });
    }

    (req as any).providerManager.updateProviderHeartbeat(address);

    return res.json({
      success: true,
      message: 'Heartbeat updated'
    });

  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/providers/:address/capabilities
 * Update provider capabilities
 */
router.put('/:address/capabilities', (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { capabilities } = req.body;

    if (!(req as any).providerManager) {
      return res.status(503).json({ error: 'Service not available' });
    }

    if (!Array.isArray(capabilities)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Capabilities must be an array' 
      });
    }

    const success = (req as any).providerManager.updateProviderCapabilities(address, capabilities);

    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: 'Provider not found' 
      });
    }

    return res.json({
      success: true,
      message: 'Capabilities updated'
    });

  } catch (error) {
    console.error('Error updating capabilities:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/providers/:address/status
 * Update provider online/offline status
 */
router.post('/:address/status', (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { isOnline } = req.body;

    if (!(req as any).providerManager) {
      return res.status(503).json({ error: 'Service not available' });
    }

    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        error: 'isOnline must be a boolean' 
      });
    }

    if (isOnline) {
      (req as any).providerManager.setProviderOnline(address);
    } else {
      (req as any).providerManager.setProviderOffline(address);
    }

    return res.json({
      success: true,
      message: `Provider status updated to ${isOnline ? 'online' : 'offline'}`
    });

  } catch (error) {
    console.error('Error updating provider status:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/providers/stats/overview
 * Get provider statistics
 */
router.get('/stats/overview', (req: Request, res: Response) => {
  try {
    if (!(req as any).providerManager) {
      return res.status(503).json({ error: 'Service not available' });
    }

    const stats = (req as any).providerManager.getProviderStats();

    return res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching provider stats:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/providers/top/:limit?
 * Get top providers by rating
 */
router.get('/top/:limit?', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.params.limit) || 10;

    if (!(req as any).providerManager) {
      return res.status(503).json({ error: 'Service not available' });
    }

    const topProviders = (req as any).providerManager.getTopProviders(limit);

    return res.json({
      success: true,
      data: topProviders,
      total: topProviders.length
    });

  } catch (error) {
    console.error('Error fetching top providers:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/providers/:address/jobs
 * Get jobs assigned to a provider
 */
router.get('/:address/jobs', (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!(req as any).providerManager) {
      return res.status(503).json({ error: 'Service not available' });
    }

    const jobIds = (req as any).providerManager.getProviderJobs(address);

    return res.json({
      success: true,
      data: jobIds,
      total: jobIds.length
    });

  } catch (error) {
    console.error('Error fetching provider jobs:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/providers/find-best
 * Find best provider for job requirements
 */
router.post('/find-best', (req: Request, res: Response) => {
  try {
    const { requirements, preferHighRating = true } = req.body;

    if (!(req as any).providerManager) {
      return res.status(503).json({ error: 'Service not available' });
    }

    if (!Array.isArray(requirements)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Requirements must be an array' 
      });
    }

    const bestProvider = (req as any).providerManager.findBestProviderForJob(requirements, preferHighRating);

    if (!bestProvider) {
      return res.status(404).json({ 
        success: false, 
        error: 'No suitable provider found' 
      });
    }

    return res.json({
      success: true,
      data: bestProvider
    });

  } catch (error) {
    console.error('Error finding best provider:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
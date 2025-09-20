import { Router, Request, Response } from 'express';

const router = Router();

// This would be injected in a real application
let jobDispatchService: any = null;

// Middleware to inject services (would be done properly in real app)
router.use((req: any, res, next) => {
  // In a real app, services would be injected via dependency injection
  jobDispatchService = (req as any).app.get('jobDispatchService');
  next();
});

/**
 * GET /api/jobs
 * Get all jobs or filter by status
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, provider } = req.query;

    if (!jobDispatchService) {
      return res.status(503).json({ error: 'Service not available' });
    }

    let jobs;

    if (status !== undefined) {
      jobs = jobDispatchService.getJobsByStatus(parseInt(status as string));
    } else if (provider) {
      jobs = jobDispatchService.getJobsForProvider(provider as string);
    } else {
      jobs = jobDispatchService.getJobQueueStatus().jobs;
    }

    res.json({
      success: true,
      data: jobs,
      total: jobs.length
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/jobs/:id
 * Get specific job by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!jobDispatchService) {
      return res.status(503).json({ error: 'Service not available' });
    }

    const job = jobDispatchService.getJob(id);

    if (!job) {
      return res.status(404).json({ 
        success: false, 
        error: 'Job not found' 
      });
    }

    res.json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/jobs/:id/assign
 * Force assign a job to a provider (admin function)
 */
router.post('/:id/assign', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { providerAddress } = req.body;

    if (!jobDispatchService) {
      return res.status(503).json({ error: 'Service not available' });
    }

    if (!providerAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Provider address is required' 
      });
    }

    const success = await jobDispatchService.forceAssignJob(id, providerAddress);

    if (!success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to assign job' 
      });
    }

    res.json({
      success: true,
      message: `Job ${id} assigned to provider ${providerAddress}`
    });

  } catch (error) {
    console.error('Error assigning job:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/jobs/status/queue
 * Get job queue status
 */
router.get('/status/queue', (req: Request, res: Response) => {
  try {
    if (!jobDispatchService) {
      return res.status(503).json({ error: 'Service not available' });
    }

    const queueStatus = jobDispatchService.getJobQueueStatus();

    res.json({
      success: true,
      data: queueStatus
    });

  } catch (error) {
    console.error('Error fetching queue status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/jobs/stats
 * Get job statistics
 */
router.get('/stats/overview', (req: Request, res: Response) => {
  try {
    if (!jobDispatchService) {
      return res.status(503).json({ error: 'Service not available' });
    }

    const queueStatus = jobDispatchService.getJobQueueStatus();
    const jobs = queueStatus.jobs;

    const stats = {
      total: jobs.length,
      byStatus: {
        posted: jobs.filter((j: any) => j.status === 0).length,
        assigned: jobs.filter((j: any) => j.status === 1).length,
        inProgress: jobs.filter((j: any) => j.status === 2).length,
        completed: jobs.filter((j: any) => j.status === 3).length,
        cancelled: jobs.filter((j: any) => j.status === 4).length,
        disputed: jobs.filter((j: any) => j.status === 5).length,
      },
      totalRewardPool: jobs.reduce((sum: number, job: any) => 
        sum + parseFloat(job.reward || '0'), 0
      ).toFixed(6),
      averageReward: jobs.length > 0 
        ? (jobs.reduce((sum: number, job: any) => 
            sum + parseFloat(job.reward || '0'), 0) / jobs.length).toFixed(6)
        : '0',
      activeAssignments: queueStatus.activeAssignments
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
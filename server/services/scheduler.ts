import { storage } from "../storage";
import { socialMediaService } from "./socialMedia";
import { safetyService } from "./safety";

interface ScheduledJob {
  id: string;
  userId: string;
  postId: number;
  scheduledTime: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  platform: string;
  content: string;
}

class SchedulerService {
  private jobs: Map<string, ScheduledJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private emergencyStopUsers: Set<string> = new Set();

  async schedulePost(
    userId: string,
    postId: number,
    scheduledTime: Date,
    platformId: number
  ): Promise<string> {
    const jobId = `${userId}-${postId}-${Date.now()}`;
    const platform = await storage.getPlatform(platformId);
    const post = await storage.getUserPosts(userId, 1000);
    const targetPost = post.find(p => p.id === postId);

    if (!platform || !targetPost) {
      throw new Error('Platform or post not found');
    }

    const job: ScheduledJob = {
      id: jobId,
      userId,
      postId,
      scheduledTime,
      status: 'pending',
      platform: platform.name,
      content: targetPost.content,
    };

    this.jobs.set(jobId, job);

    // Schedule the execution
    const delay = scheduledTime.getTime() - Date.now();
    if (delay > 0) {
      const timer = setTimeout(() => {
        this.executeJob(jobId);
      }, delay);
      
      this.timers.set(jobId, timer);
    } else {
      // Execute immediately if scheduled time is in the past
      this.executeJob(jobId);
    }

    // Log activity
    await storage.createActivityLog({
      userId,
      action: 'Post Scheduled',
      description: `Scheduled post for ${platform.displayName} at ${scheduledTime.toISOString()}`,
      platformId,
      status: 'success',
      metadata: { jobId, scheduledTime: scheduledTime.toISOString() },
    });

    return jobId;
  }

  async executeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'pending') {
      return;
    }

    // Check if user has emergency stop active
    if (this.emergencyStopUsers.has(job.userId)) {
      job.status = 'cancelled';
      await this.logJobResult(job, 'cancelled', 'Emergency stop active');
      return;
    }

    job.status = 'running';

    try {
      // Perform safety check before posting
      const safetyCheck = await safetyService.performSafetyCheck(job.userId);
      if (safetyCheck.issues.length > 0) {
        // Check if any issues are critical for this platform
        const criticalIssues = safetyCheck.issues.filter(issue => 
          issue.includes(job.platform) && issue.includes('critical')
        );
        
        if (criticalIssues.length > 0) {
          job.status = 'failed';
          await this.logJobResult(job, 'failed', `Safety check failed: ${criticalIssues.join(', ')}`);
          return;
        }
      }

      // Get user accounts to initialize social media APIs
      const userAccounts = await storage.getUserAccounts(job.userId);
      socialMediaService.initializeAPIs(userAccounts);

      // Get the post details
      const posts = await storage.getUserPosts(job.userId, 1000);
      const post = posts.find(p => p.id === job.postId);
      
      if (!post) {
        throw new Error('Post not found');
      }

      // Post to social media
      const result = await socialMediaService.postContent(
        job.platform,
        post.content,
        post.mediaUrls || undefined
      );

      // Update post status
      await storage.updatePost(job.postId, {
        status: 'published',
        publishedAt: new Date(),
        externalPostId: result.id,
      });

      // Record the action for safety tracking
      await safetyService.recordAction(job.userId, post.platformId, 'post');

      job.status = 'completed';
      await this.logJobResult(job, 'completed', `Posted successfully: ${result.url}`);

    } catch (error) {
      job.status = 'failed';
      await this.logJobResult(job, 'failed', error.message);
    } finally {
      // Clean up timer
      const timer = this.timers.get(jobId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(jobId);
      }
    }
  }

  async getUserJobs(userId: string): Promise<ScheduledJob[]> {
    const userJobs: ScheduledJob[] = [];
    
    for (const [jobId, job] of this.jobs) {
      if (job.userId === userId) {
        userJobs.push(job);
      }
    }

    // Also get scheduled posts from database
    const scheduledPosts = await storage.getScheduledPosts(userId);
    
    for (const post of scheduledPosts) {
      if (!userJobs.find(job => job.postId === post.id)) {
        const platform = await storage.getPlatform(post.platformId);
        const existingJobId = `db-${post.id}`;
        
        const dbJob: ScheduledJob = {
          id: existingJobId,
          userId: post.userId,
          postId: post.id,
          scheduledTime: post.scheduledAt!,
          status: 'pending',
          platform: platform?.name || 'unknown',
          content: post.content,
        };
        
        userJobs.push(dbJob);
        
        // Schedule this job if not already scheduled
        if (!this.jobs.has(existingJobId)) {
          await this.schedulePost(userId, post.id, post.scheduledAt!, post.platformId);
        }
      }
    }

    return userJobs.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === 'running') {
      throw new Error('Cannot cancel running job');
    }

    if (job.status === 'pending') {
      job.status = 'cancelled';
      
      // Clear timer
      const timer = this.timers.get(jobId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(jobId);
      }

      await this.logJobResult(job, 'cancelled', 'Cancelled by user');
    }
  }

  async emergencyStop(userId: string): Promise<void> {
    this.emergencyStopUsers.add(userId);

    // Cancel all pending jobs for this user
    for (const [jobId, job] of this.jobs) {
      if (job.userId === userId && job.status === 'pending') {
        await this.cancelJob(jobId);
      }
    }

    // Log emergency stop
    await storage.createActivityLog({
      userId,
      action: 'Emergency Stop',
      description: 'All automation stopped by emergency stop',
      status: 'warning',
    });
  }

  async resumeUser(userId: string): Promise<void> {
    this.emergencyStopUsers.delete(userId);

    // Log resume
    await storage.createActivityLog({
      userId,
      action: 'Automation Resumed',
      description: 'Automation resumed after emergency stop',
      status: 'success',
    });
  }

  async pauseAllUser(userId: string): Promise<void> {
    // Similar to emergency stop but less severe
    for (const [jobId, job] of this.jobs) {
      if (job.userId === userId && job.status === 'pending') {
        // Delay all jobs by 1 hour
        const newScheduledTime = new Date(job.scheduledTime.getTime() + 60 * 60 * 1000);
        job.scheduledTime = newScheduledTime;
        
        // Clear existing timer
        const timer = this.timers.get(jobId);
        if (timer) {
          clearTimeout(timer);
        }

        // Reschedule
        const delay = newScheduledTime.getTime() - Date.now();
        if (delay > 0) {
          const newTimer = setTimeout(() => {
            this.executeJob(jobId);
          }, delay);
          
          this.timers.set(jobId, newTimer);
        }
      }
    }

    await storage.createActivityLog({
      userId,
      action: 'Automation Paused',
      description: 'All scheduled posts delayed by 1 hour',
      status: 'warning',
    });
  }

  private async logJobResult(
    job: ScheduledJob,
    status: string,
    message: string
  ): Promise<void> {
    await storage.createActivityLog({
      userId: job.userId,
      action: `Scheduled Post ${status}`,
      description: `${job.platform}: ${message}`,
      status: status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'warning',
      metadata: { jobId: job.id, platform: job.platform },
    });
  }

  // Background task to process scheduled posts
  async processScheduledPosts(): Promise<void> {
    try {
      const allUsers = await storage.getPlatforms(); // This would need a method to get all users
      
      for (const user of []) { // Placeholder - need to implement getUsersWithScheduledPosts
        const scheduledPosts = await storage.getScheduledPosts(user.id);
        
        for (const post of scheduledPosts) {
          const jobId = `bg-${post.id}`;
          
          if (!this.jobs.has(jobId) && post.scheduledAt && post.scheduledAt <= new Date()) {
            await this.schedulePost(post.userId, post.id, post.scheduledAt, post.platformId);
          }
        }
      }
    } catch (error) {
      console.error('Error processing scheduled posts:', error);
    }
  }

  // Start background processing
  startBackgroundProcessing(): void {
    // Check for scheduled posts every minute
    setInterval(() => {
      this.processScheduledPosts();
    }, 60 * 1000);

    console.log('Scheduler background processing started');
  }
}

export const schedulerService = new SchedulerService();

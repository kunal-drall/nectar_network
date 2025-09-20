'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import { Job, JobStatus } from '@/types';
import { CONTRACT_ADDRESSES } from '@/lib/utils';
import { JOB_MANAGER_ABI } from '@/lib/abis';
import { toast } from 'react-hot-toast';

export function useJobs() {
  const { provider, signer, user } = useWeb3();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const jobManagerContract = provider
    ? new ethers.Contract(CONTRACT_ADDRESSES.jobManager, JOB_MANAGER_ABI, provider)
    : null;

  const jobManagerWithSigner = signer
    ? new ethers.Contract(CONTRACT_ADDRESSES.jobManager, JOB_MANAGER_ABI, signer)
    : null;

  const fetchJobs = async () => {
    if (!jobManagerContract) return;

    try {
      setIsLoading(true);
      const totalJobs = await jobManagerContract.getTotalJobs();
      const jobPromises = [];

      for (let i = 1; i <= totalJobs.toNumber(); i++) {
        jobPromises.push(jobManagerContract.getJob(i));
      }

      const jobResults = await Promise.all(jobPromises);
      const formattedJobs: Job[] = jobResults.map((job, index) => ({
        id: index + 1,
        client: job.client,
        provider: job.provider,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        reward: ethers.utils.formatEther(job.reward),
        deadline: job.deadline.toNumber(),
        status: job.status,
        resultHash: job.resultHash,
        createdAt: job.createdAt.toNumber(),
        completedAt: job.completedAt.toNumber(),
      }));

      setJobs(formattedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const postJob = async (
    title: string,
    description: string,
    requirements: string,
    reward: string,
    deadline: number
  ) => {
    if (!jobManagerWithSigner) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      const rewardWei = ethers.utils.parseEther(reward);
      
      const tx = await jobManagerWithSigner.postJob(
        title,
        description,
        requirements,
        deadline,
        { value: rewardWei }
      );

      await tx.wait();
      toast.success('Job posted successfully!');
      await fetchJobs();
    } catch (error: any) {
      console.error('Error posting job:', error);
      toast.error(error.reason || 'Failed to post job');
    } finally {
      setIsLoading(false);
    }
  };

  const assignJob = async (jobId: number, providerAddress: string) => {
    if (!jobManagerWithSigner) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      const tx = await jobManagerWithSigner.assignJob(jobId, providerAddress);
      await tx.wait();
      toast.success('Job assigned successfully!');
      await fetchJobs();
    } catch (error: any) {
      console.error('Error assigning job:', error);
      toast.error(error.reason || 'Failed to assign job');
    } finally {
      setIsLoading(false);
    }
  };

  const startJob = async (jobId: number) => {
    if (!jobManagerWithSigner) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      const tx = await jobManagerWithSigner.startJob(jobId);
      await tx.wait();
      toast.success('Job started successfully!');
      await fetchJobs();
    } catch (error: any) {
      console.error('Error starting job:', error);
      toast.error(error.reason || 'Failed to start job');
    } finally {
      setIsLoading(false);
    }
  };

  const completeJob = async (jobId: number, resultHash: string) => {
    if (!jobManagerWithSigner) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      const tx = await jobManagerWithSigner.completeJob(jobId, resultHash);
      await tx.wait();
      toast.success('Job completed successfully!');
      await fetchJobs();
    } catch (error: any) {
      console.error('Error completing job:', error);
      toast.error(error.reason || 'Failed to complete job');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelJob = async (jobId: number) => {
    if (!jobManagerWithSigner) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      const tx = await jobManagerWithSigner.cancelJob(jobId);
      await tx.wait();
      toast.success('Job cancelled successfully!');
      await fetchJobs();
    } catch (error: any) {
      console.error('Error cancelling job:', error);
      toast.error(error.reason || 'Failed to cancel job');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableJobs = () => {
    return jobs.filter(job => job.status === JobStatus.Posted);
  };

  const getClientJobs = () => {
    if (!user.address) return [];
    return jobs.filter(job => job.client.toLowerCase() === user.address.toLowerCase());
  };

  const getProviderJobs = () => {
    if (!user.address) return [];
    return jobs.filter(job => job.provider.toLowerCase() === user.address.toLowerCase());
  };

  useEffect(() => {
    if (jobManagerContract) {
      fetchJobs();
    }
  }, [jobManagerContract]);

  return {
    jobs,
    isLoading,
    fetchJobs,
    postJob,
    assignJob,
    startJob,
    completeJob,
    cancelJob,
    getAvailableJobs,
    getClientJobs,
    getProviderJobs,
  };
}
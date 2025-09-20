'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useJobs } from '@/hooks/useJobs';
import { useUSDC } from '@/hooks/useUSDC';
import JobCard from '@/components/JobCard';
import { Server, Play, CheckCircle, TrendingUp, DollarSign, Hexagon, Zap } from 'lucide-react';

export default function ProviderDashboard() {
  const { user } = useWeb3();
  const { getAvailableJobs, getProviderJobs, startJob, completeJob, isLoading } = useJobs();
  const { balance } = useUSDC();
  const [activeTab, setActiveTab] = useState<'available' | 'assigned' | 'completed'>('available');
  const [resultHash, setResultHash] = useState('');
  const [selectedJobForCompletion, setSelectedJobForCompletion] = useState<number | null>(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState(0);

  // Simulate real-time updates by incrementing counter
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeUpdates(prev => prev + 1);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!user.isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="relative mb-6">
            <Hexagon className="w-20 h-20 text-secondary-400 mx-auto animate-pulse-glow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🐝</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Connect Your Wallet</h2>
          <p className="text-neutral-600">
            Please connect your wallet to access the provider dashboard.
          </p>
        </div>
      </div>
    );
  }

  const availableJobs = getAvailableJobs();
  const providerJobs = getProviderJobs();
  const assignedJobs = providerJobs.filter(job => job.status === 1 || job.status === 2); // Assigned or InProgress
  const completedJobs = providerJobs.filter(job => job.status >= 3); // Completed+

  const stats = [
    {
      icon: Server,
      label: 'Available Jobs',
      value: availableJobs.length,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      icon: Play,
      label: 'My Active Jobs',
      value: assignedJobs.length,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100',
    },
    {
      icon: CheckCircle,
      label: 'Completed Jobs',
      value: completedJobs.length,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: DollarSign,
      label: 'USDC Balance',
      value: `${parseFloat(balance).toFixed(2)} USDC`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  const handleStartJob = async (jobId: number) => {
    await startJob(jobId);
  };

  const handleCompleteJob = async (jobId: number | null) => {
    if (!jobId || !resultHash) return;
    
    await completeJob(jobId, resultHash);
    setSelectedJobForCompletion(null);
    setResultHash('');
  };

  const renderJobsList = () => {
    let jobs;
    let emptyMessage;

    switch (activeTab) {
      case 'available':
        jobs = availableJobs;
        emptyMessage = 'No jobs available at the moment.';
        break;
      case 'assigned':
        jobs = assignedJobs;
        emptyMessage = 'No assigned jobs yet.';
        break;
      case 'completed':
        jobs = completedJobs;
        emptyMessage = 'No completed jobs yet.';
        break;
    }

    if (jobs.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Server className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid gap-6">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onStart={activeTab === 'available' ? undefined : handleStartJob}
            onComplete={(jobId) => setSelectedJobForCompletion(jobId)}
            userType="provider"
            showActions={true}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="relative">
              <Hexagon className="w-8 h-8 text-secondary-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg">🐝</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">Provider Dashboard</h1>
          </div>
          <p className="text-neutral-600">Execute compute jobs and earn rewards</p>
        </div>
        
        {/* Real-time status indicator */}
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Live Updates</span>
            <Zap className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-xs text-gray-500">
            Updates: {realTimeUpdates}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'available', label: 'Available Jobs', count: availableJobs.length },
            { key: 'assigned', label: 'My Jobs', count: assignedJobs.length },
            { key: 'completed', label: 'Completed', count: completedJobs.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-secondary-500 text-secondary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.key
                    ? 'bg-secondary-100 text-secondary-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Jobs List */}
      {renderJobsList()}

      {/* Complete Job Modal */}
      {selectedJobForCompletion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Complete Job #{selectedJobForCompletion}
            </h3>
            
            <div className="mb-4">
              <label htmlFor="resultHash" className="block text-sm font-medium text-gray-700 mb-2">
                Result Hash
              </label>
              <input
                type="text"
                id="resultHash"
                value={resultHash}
                onChange={(e) => setResultHash(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                placeholder="Enter the result hash"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedJobForCompletion(null);
                  setResultHash('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCompleteJob(selectedJobForCompletion)}
                className="flex-1 px-4 py-2 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 transition-colors disabled:opacity-50"
                disabled={!resultHash || isLoading}
              >
                {isLoading ? 'Completing...' : 'Complete Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useJobs } from '@/hooks/useJobs';
import { useUSDC } from '@/hooks/useUSDC';
import JobCard from '@/components/JobCard';
import JobPostForm from '@/components/JobPostForm';
import { Briefcase, Plus, DollarSign, Clock, CheckCircle, Hexagon, Zap, RefreshCw } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useWeb3();
  const { getClientJobs, assignJob, cancelJob, isLoading } = useJobs();
  const { balance } = useUSDC();
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Real-time update indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 10000); // Update timestamp every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (!user.isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="relative mb-6">
            <Hexagon className="w-20 h-20 text-primary-400 mx-auto animate-pulse-glow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🐝</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Connect Your Wallet</h2>
          <p className="text-neutral-600">
            Please connect your wallet to view your dashboard and manage your jobs.
          </p>
        </div>
      </div>
    );
  }

  const clientJobs = getClientJobs();
  const activeJobs = clientJobs.filter(job => job.status < 3); // Not completed
  const completedJobs = clientJobs.filter(job => job.status >= 3); // Completed or cancelled

  const stats = [
    {
      icon: Briefcase,
      label: 'Total Jobs',
      value: clientJobs.length,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      icon: Clock,
      label: 'Active Jobs',
      value: activeJobs.length,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100',
    },
    {
      icon: CheckCircle,
      label: 'Completed',
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

  const handleAssignJob = async (jobId: number) => {
    // In a real implementation, this would open a modal to select a provider
    // For demo purposes, we'll just show a message
    alert('In a full implementation, this would open a provider selection modal.');
  };

  const renderJobsList = () => {
    const jobs = activeTab === 'active' ? activeJobs : completedJobs;
    const emptyMessage = activeTab === 'active' 
      ? 'No active jobs. Post a new job to get started!' 
      : 'No completed jobs yet.';

    if (jobs.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Briefcase className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-500 mb-4">{emptyMessage}</p>
          {activeTab === 'active' && (
            <button
              onClick={() => setIsPostJobModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post Your First Job
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-6">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onAssign={handleAssignJob}
            onCancel={cancelJob}
            userType="client"
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
              <Hexagon className="w-8 h-8 text-primary-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg">🐝</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
          </div>
          <p className="text-neutral-600">Manage your compute jobs and track progress</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {/* Real-time status indicator */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Live</span>
            <RefreshCw className="w-4 h-4 text-green-600" />
          </div>
          
          <button
            onClick={() => setIsPostJobModalOpen(true)}
            disabled={isLoading}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Post Job</span>
          </button>
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

      {/* Real-time update info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Real-time Status Updates</span>
          </div>
          <div className="text-sm text-blue-700">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          Job statuses are automatically updated when providers interact with your jobs.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'active', label: 'Active Jobs', count: activeJobs.length },
            { key: 'completed', label: 'Completed', count: completedJobs.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.key
                    ? 'bg-primary-100 text-primary-600'
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

      {/* Post Job Modal */}
      <JobPostForm
        isOpen={isPostJobModalOpen}
        onClose={() => setIsPostJobModalOpen(false)}
      />
    </div>
  );
}
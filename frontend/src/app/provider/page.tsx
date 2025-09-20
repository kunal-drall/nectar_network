'use client';

import { useState } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useJobs } from '@/hooks/useJobs';
import JobCard from '@/components/JobCard';
import { Server, Play, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';

export default function ProviderPage() {
  const { user } = useWeb3();
  const { getAvailableJobs, getProviderJobs, startJob, completeJob, isLoading } = useJobs();
  const [activeTab, setActiveTab] = useState<'available' | 'assigned' | 'completed'>('available');
  const [resultHash, setResultHash] = useState('');
  const [selectedJobForCompletion, setSelectedJobForCompletion] = useState<number | null>(null);

  if (!user.isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <Server className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Play,
      label: 'My Active Jobs',
      value: assignedJobs.length,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
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
      label: 'Total Earned',
      value: `${completedJobs.reduce((sum, job) => sum + parseFloat(job.reward), 0).toFixed(3)} ETH`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const handleCompleteJob = async (jobId: number) => {
    if (!resultHash) {
      alert('Please enter a result hash');
      return;
    }
    
    await completeJob(jobId, resultHash);
    setResultHash('');
    setSelectedJobForCompletion(null);
  };

  const handleJobAction = (jobId: number, action: 'start' | 'complete') => {
    if (action === 'start') {
      startJob(jobId);
    } else if (action === 'complete') {
      setSelectedJobForCompletion(jobId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Dashboard</h1>
        <p className="text-gray-600">Browse available jobs and manage your compute tasks</p>
      </div>

      {/* Provider Registration Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Server className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Provider Registration
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              In a full implementation, providers would register through the Reputation contract to build their profile and ratings.
              For this demo, you can browse and interact with jobs directly.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${stat.bgColor} mb-4`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('available')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'available'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Available Jobs ({availableJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assigned'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Jobs ({assignedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'completed'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Completed ({completedJobs.length})
          </button>
        </nav>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeTab === 'available' &&
            availableJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                userType="provider"
                showActions={false}
              />
            ))}
          
          {activeTab === 'assigned' &&
            assignedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onStart={() => handleJobAction(job.id, 'start')}
                onComplete={() => handleJobAction(job.id, 'complete')}
                userType="provider"
              />
            ))}
          
          {activeTab === 'completed' &&
            completedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                userType="provider"
                showActions={false}
              />
            ))}
        </div>
      )}

      {/* Empty States */}
      {!isLoading && (
        <>
          {activeTab === 'available' && availableJobs.length === 0 && (
            <div className="text-center py-12">
              <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No available jobs at the moment.</p>
            </div>
          )}

          {activeTab === 'assigned' && assignedJobs.length === 0 && (
            <div className="text-center py-12">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No assigned jobs. Browse available jobs to get started.</p>
            </div>
          )}

          {activeTab === 'completed' && completedJobs.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No completed jobs yet.</p>
            </div>
          )}
        </>
      )}

      {/* Complete Job Modal */}
      {selectedJobForCompletion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Job</h3>
            <p className="text-gray-600 mb-4">
              Enter the result hash for job #{selectedJobForCompletion}
            </p>
            <input
              type="text"
              value={resultHash}
              onChange={(e) => setResultHash(e.target.value)}
              placeholder="Result hash (e.g., QmHashOfResults...)"
              className="input-field w-full mb-4"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setSelectedJobForCompletion(null);
                  setResultHash('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCompleteJob(selectedJobForCompletion)}
                className="btn-success"
                disabled={!resultHash}
              >
                Complete Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
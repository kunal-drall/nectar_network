'use client';

import { useState } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useJobs } from '@/hooks/useJobs';
import JobCard from '@/components/JobCard';
import PostJobModal from '@/components/PostJobModal';
import { Briefcase, Plus, DollarSign, Clock, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useWeb3();
  const { getClientJobs, assignJob, cancelJob, isLoading } = useJobs();
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  if (!user.isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">
            Please connect your wallet to view your dashboard and manage your jobs.
          </p>
        </div>
      </div>
    );
  }

  const clientJobs = getClientJobs();
  const activeJobs = clientJobs.filter(job => job.status < 3); // Posted, Assigned, InProgress
  const completedJobs = clientJobs.filter(job => job.status >= 3); // Completed, Cancelled, Disputed

  const stats = [
    {
      icon: Briefcase,
      label: 'Total Jobs',
      value: clientJobs.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Clock,
      label: 'Active Jobs',
      value: activeJobs.length,
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
      label: 'Total Spent',
      value: `${clientJobs.reduce((sum, job) => sum + parseFloat(job.reward), 0).toFixed(3)} ETH`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const handleAssignJob = async (jobId: number) => {
    // In a real implementation, this would open a modal to select a provider
    // For demo purposes, we'll just show a message
    alert('In a full implementation, this would open a provider selection modal.');
  };

  return (
    <div className="dashboard-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Dashboard</h1>
          <p className="text-gray-600">Manage your compute jobs and track progress</p>
        </div>
        <button
          onClick={() => setIsPostJobModalOpen(true)}
          className="btn-primary inline-flex items-center space-x-2 mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Job</span>
        </button>
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
            onClick={() => setActiveTab('active')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Jobs ({activeJobs.length})
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
          {activeTab === 'active' &&
            activeJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onAssign={handleAssignJob}
                onCancel={cancelJob}
                userType="client"
              />
            ))}
          
          {activeTab === 'completed' &&
            completedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                userType="client"
                showActions={false}
              />
            ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (
        <>
          {activeTab === 'active' && activeJobs.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No active jobs found.</p>
              <button
                onClick={() => setIsPostJobModalOpen(true)}
                className="btn-primary mt-4"
              >
                Post Your First Job
              </button>
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

      {/* Post Job Modal */}
      <PostJobModal
        isOpen={isPostJobModalOpen}
        onClose={() => setIsPostJobModalOpen(false)}
      />
      </div>
    </div>
  );
}
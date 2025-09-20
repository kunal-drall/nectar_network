'use client';

import { useState } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useJobs } from '@/hooks/useJobs';
import JobCard from '@/components/JobCard';
import PostJobModal from '@/components/PostJobModal';
import NetworkStatus from '@/components/NetworkStatus';
import { Zap, TrendingUp, Users, Briefcase, Plus, Search } from 'lucide-react';

export default function HomePage() {
  const { user } = useWeb3();
  const { jobs, getAvailableJobs, assignJob, isLoading } = useJobs();
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const availableJobs = getAvailableJobs();
  const filteredJobs = availableJobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    {
      icon: Briefcase,
      label: 'Total Jobs',
      value: jobs.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: TrendingUp,
      label: 'Available Jobs',
      value: availableJobs.length,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Users,
      label: 'Active Providers',
      value: 0, // Will be updated when reputation system is integrated
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Network Status - Show when wallet is connected */}
      {user.isConnected && (
        <div className="mb-6">
          <NetworkStatus />
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Zap className="w-16 h-16 text-primary-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Nectar Network
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          A decentralized compute marketplace where you can post compute jobs or 
          provide computing resources to earn rewards on the Avalanche network.
        </p>
        
        {user.isConnected ? (
          <button
            onClick={() => setIsPostJobModalOpen(true)}
            className="btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Post a Job</span>
          </button>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="font-semibold text-blue-900 mb-2">
              🚀 Get Started with Avalanche
            </h3>
            <p className="text-blue-800 text-sm mb-4">
              Connect any Avalanche-compatible wallet to start posting jobs or providing compute resources!
            </p>
            <div className="text-xs text-blue-600">
              Supported: MetaMask, Core Wallet, Coinbase Wallet, Trust Wallet, and more
            </div>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${stat.bgColor} mb-4`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Available Jobs Section */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
            Available Jobs ({availableJobs.length})
          </h2>
          
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full sm:w-80"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading jobs...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onAssign={assignJob}
                userType="client"
                showActions={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'No jobs found matching your search.' : 'No jobs available at the moment.'}
            </p>
            {user.isConnected && (
              <button
                onClick={() => setIsPostJobModalOpen(true)}
                className="btn-primary mt-4"
              >
                Post the First Job
              </button>
            )}
          </div>
        )}
      </div>

      {/* How It Works Section */}
      <div className="bg-white rounded-lg p-8 shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Post a Job</h3>
            <p className="text-gray-600">
              Describe your compute requirements and set a reward in AVAX.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Provider Executes</h3>
            <p className="text-gray-600">
              Compute providers pick up your job and execute it securely.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Get Results</h3>
            <p className="text-gray-600">
              Receive your results and the provider gets paid automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Post Job Modal */}
      <PostJobModal
        isOpen={isPostJobModalOpen}
        onClose={() => setIsPostJobModalOpen(false)}
      />
    </div>
  );
}
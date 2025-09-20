'use client';

import { useState } from 'react';
import JobPostForm from '@/components/JobPostForm';
import { DollarSign, Zap, Clock, CheckCircle } from 'lucide-react';

export default function DemoPage() {
  const [isJobPostFormOpen, setIsJobPostFormOpen] = useState(false);

  const features = [
    {
      icon: DollarSign,
      title: 'USDC Payment Support',
      description: 'Pay for jobs using USDC stablecoins with automatic approval flow',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Get instant notifications when job status changes via contract events',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Clock,
      title: 'Enhanced Job Management',
      description: 'Improved dashboard with better job tracking and provider selection',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      icon: CheckCircle,
      title: 'Error Handling',
      description: 'Comprehensive error handling and loading states for all operations',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Enhanced Nectar Network Components
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Functional React components with USDC support, real-time updates, and enhanced user experience
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {features.map((feature, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className={`p-3 rounded-lg ${feature.bgColor} inline-block mb-4`}>
              <feature.icon className={`w-6 h-6 ${feature.color}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Demo Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 mb-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Try the Enhanced Job Post Form
          </h2>
          <p className="text-gray-600 mb-6">
            Experience the new USDC-enabled job posting with approval flow and enhanced error handling
          </p>
          <button
            onClick={() => setIsJobPostFormOpen(true)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Demo Job Post Form
          </button>
        </div>
      </div>

      {/* Implementation Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Implementation Highlights</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">JobPostForm Component</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• USDC and ETH payment options</li>
              <li>• Automatic USDC approval flow</li>
              <li>• Balance checking and validation</li>
              <li>• Enhanced error messages</li>
              <li>• Loading states for all operations</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Enhancements</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Real-time job status updates</li>
              <li>• USDC balance display</li>
              <li>• Enhanced provider dashboard</li>
              <li>• Live update indicators</li>
              <li>• Improved job management</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-md font-semibold text-blue-900 mb-2">Technical Implementation</h4>
          <p className="text-blue-700 text-sm">
            The components leverage ethers.js for blockchain interactions, implement event listeners for real-time updates,
            and include comprehensive error handling. USDC integration uses ERC-20 approve/transferFrom pattern with 
            user-friendly approval flow.
          </p>
        </div>
      </div>

      {/* Job Post Form Modal */}
      <JobPostForm
        isOpen={isJobPostFormOpen}
        onClose={() => setIsJobPostFormOpen(false)}
      />
    </div>
  );
}
'use client';

import { Job } from '@/types';
import { formatAddress, formatDate, formatDateTime, getJobStatusText, getJobStatusColor, calculateTimeRemaining } from '@/lib/utils';
import { Calendar, Clock, DollarSign, User } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onAssign?: (jobId: number) => void;
  onStart?: (jobId: number) => void;
  onComplete?: (jobId: number) => void;
  onCancel?: (jobId: number) => void;
  showActions?: boolean;
  userType?: 'client' | 'provider';
}

export default function JobCard({ 
  job, 
  onAssign, 
  onStart, 
  onComplete, 
  onCancel, 
  showActions = true,
  userType 
}: JobCardProps) {
  const statusText = getJobStatusText(job.status);
  const statusColor = getJobStatusColor(job.status);
  const timeRemaining = calculateTimeRemaining(job.deadline);

  const renderActions = () => {
    if (!showActions) return null;

    if (userType === 'client' && job.status === 0) {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => onAssign?.(job.id)}
            className="btn-primary text-sm"
          >
            Assign
          </button>
          <button
            onClick={() => onCancel?.(job.id)}
            className="btn-secondary text-sm"
          >
            Cancel
          </button>
        </div>
      );
    }

    if (userType === 'provider' && job.status === 1) {
      return (
        <button
          onClick={() => onStart?.(job.id)}
          className="btn-success text-sm"
        >
          Start Job
        </button>
      );
    }

    if (userType === 'provider' && job.status === 2) {
      return (
        <button
          onClick={() => onComplete?.(job.id)}
          className="btn-success text-sm"
        >
          Complete Job
        </button>
      );
    }

    return null;
  };

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
          <span className={statusColor}>{statusText}</span>
        </div>
        <div className="text-right">
          <div className="flex items-center text-primary-600 font-semibold">
            <DollarSign className="w-4 h-4 mr-1" />
            {job.reward} ETH
          </div>
        </div>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-3">{job.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-500">
          <User className="w-4 h-4 mr-2" />
          <span>Client: {formatAddress(job.client)}</span>
        </div>
        
        {job.provider !== '0x0000000000000000000000000000000000000000' && (
          <div className="flex items-center text-sm text-gray-500">
            <User className="w-4 h-4 mr-2" />
            <span>Provider: {formatAddress(job.provider)}</span>
          </div>
        )}

        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Created: {formatDate(job.createdAt)}</span>
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-4 h-4 mr-2" />
          <span>Deadline: {formatDateTime(job.deadline)}</span>
        </div>

        <div className="flex items-center text-sm">
          <Clock className="w-4 h-4 mr-2" />
          <span className={timeRemaining === 'Expired' ? 'text-red-500' : 'text-green-600'}>
            {timeRemaining === 'Expired' ? 'Expired' : `${timeRemaining} remaining`}
          </span>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Job #{job.id}
          </div>
          {renderActions()}
        </div>
      </div>

      {job.requirements && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Requirements:</h4>
          <p className="text-sm text-gray-600">{job.requirements}</p>
        </div>
      )}

      {job.resultHash && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Result:</h4>
          <p className="text-sm text-gray-600 break-all">{job.resultHash}</p>
        </div>
      )}
    </div>
  );
}
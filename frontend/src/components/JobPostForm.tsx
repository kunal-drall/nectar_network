'use client';

import { useState, useEffect } from 'react';
import { useJobs } from '@/hooks/useJobs';
import { useUSDC } from '@/hooks/useUSDC';
import { validateJobForm, CONTRACT_ADDRESSES } from '@/lib/utils';
import { X, DollarSign, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface JobPostFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JobPostForm({ isOpen, onClose }: JobPostFormProps) {
  const { postJob, isLoading } = useJobs();
  const { balance, approveUSDC, hasEnoughBalance, hasEnoughAllowance, isLoading: usdcLoading } = useUSDC();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    reward: '',
    deadline: '',
    paymentType: 'ETH' as 'ETH' | 'USDC',
  });
  
  const [isApproving, setIsApproving] = useState(false);
  const [approvalComplete, setApprovalComplete] = useState(false);

  const [needsUSDCApproval, setNeedsUSDCApproval] = useState(false);

  const checkApprovalNeeded = async () => {
    if (formData.paymentType !== 'USDC' || !formData.reward) {
      setNeedsUSDCApproval(false);
      return;
    }
    
    try {
      const hasAllowance = await hasEnoughAllowance(CONTRACT_ADDRESSES.escrow, formData.reward);
      setNeedsUSDCApproval(!hasAllowance);
    } catch {
      setNeedsUSDCApproval(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateJobForm(formData);
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    try {
      // Check USDC balance and approval if paying with USDC
      if (formData.paymentType === 'USDC') {
        if (!hasEnoughBalance(formData.reward)) {
          toast.error(`Insufficient USDC balance. You have ${balance} USDC`);
          return;
        }

        const hasAllowance = await hasEnoughAllowance(CONTRACT_ADDRESSES.escrow, formData.reward);
        if (!hasAllowance) {
          toast.error('Please approve USDC spending first');
          return;
        }
      }

      const deadlineTimestamp = Math.floor(new Date(formData.deadline).getTime() / 1000);
      
      await postJob(
        formData.title,
        formData.description,
        formData.requirements,
        formData.reward,
        deadlineTimestamp,
        formData.paymentType
      );

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        requirements: '',
        reward: '',
        deadline: '',
        paymentType: 'ETH',
      });
      setApprovalComplete(false);
      onClose();
    } catch (error) {
      console.error('Error posting job:', error);
    }
  };

  const handleApproveUSDC = async () => {
    setIsApproving(true);
    try {
      const success = await approveUSDC(CONTRACT_ADDRESSES.escrow, formData.reward);
      if (success) {
        setApprovalComplete(true);
        toast.success('USDC approved successfully! You can now post the job.');
      }
    } catch (error) {
      console.error('Error approving USDC:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset approval status when payment type or amount changes
    if (name === 'paymentType' || name === 'reward') {
      setApprovalComplete(false);
      
      // Check if approval is needed when amount or payment type changes
      if (name === 'reward' && formData.paymentType === 'USDC' && value) {
        checkApprovalNeeded();
      }
    }
  };

  const needsApproval = () => {
    return formData.paymentType === 'USDC' && formData.reward && needsUSDCApproval;
  };

  const canSubmit = () => {
    if (formData.paymentType === 'USDC') {
      return approvalComplete && hasEnoughBalance(formData.reward);
    }
    return true;
  };

  // Check approval status when form data changes
  useEffect(() => {
    if (formData.paymentType === 'USDC' && formData.reward) {
      checkApprovalNeeded();
    }
  }, [formData.paymentType, formData.reward]);

  if (!isOpen) return null;

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Post New Job</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Job Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter job title"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the job requirements and deliverables"
              required
            />
          </div>

          <div>
            <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
              Technical Requirements
            </label>
            <textarea
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Specify technical requirements (CPU, RAM, etc.)"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Type
              </label>
              <select
                id="paymentType"
                name="paymentType"
                value={formData.paymentType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
              </select>
            </div>

            <div>
              <label htmlFor="reward" className="block text-sm font-medium text-gray-700 mb-2">
                Reward Amount
                {formData.paymentType === 'USDC' && (
                  <span className="text-sm text-gray-500 ml-2">
                    (Balance: {balance} USDC)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="reward"
                  name="reward"
                  value={formData.reward}
                  onChange={handleChange}
                  step="0.000001"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                  placeholder="0.00"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm font-medium">
                    {formData.paymentType}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline
            </label>
            <input
              type="datetime-local"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              min={minDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* USDC Approval Section */}
          {formData.paymentType === 'USDC' && formData.reward && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-900 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    USDC Approval Required
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    You need to approve the escrow contract to spend {formData.reward} USDC
                  </p>
                </div>
                {!approvalComplete && (
                  <button
                    type="button"
                    onClick={handleApproveUSDC}
                    disabled={isApproving || !formData.reward}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isApproving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-1" />
                        Approve USDC
                      </>
                    )}
                  </button>
                )}
                {approvalComplete && (
                  <div className="flex items-center text-green-600">
                    <Zap className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Approved!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || usdcLoading || !canSubmit()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
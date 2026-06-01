"use client";
import React from 'react';
import BlogEditor from './createBlog';
import { X } from 'lucide-react';

interface CreateBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenKey: "clinicToken" | "doctorToken";
}

const CreateBlogModal: React.FC<CreateBlogModalProps> = ({ isOpen, onClose, tokenKey }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative bg-white rounded-lg shadow-xl w-full h-full flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Create New Blog</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Blog Editor - Full Screen */}
        <div className="flex-1 overflow-hidden">
          <BlogEditor tokenKey={tokenKey} />
        </div>
      </div>
    </div>
  );
};

export default CreateBlogModal;


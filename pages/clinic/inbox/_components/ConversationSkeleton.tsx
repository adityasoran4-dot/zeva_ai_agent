import React from 'react';

const ConversationSkeleton = () => {
  return (
    <div className="animate-pulse flex items-center p-4 border-b border-gray-100">
      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
      <div className="ml-3 flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export default ConversationSkeleton;
import React from "react";

const MessageSkeleton = () => {
  // Randomly choose between incoming and outgoing for variety
  const isOutgoing = true;

  return (
    <>
      {/* Incoming Message Skeleton */}
      {!isOutgoing && (
        <div className="flex justify-start mb-4">
          <div className="flex items-start space-x-3 max-w-full sm:max-w-[85%]">
            {/* Avatar skeleton */}
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>

            {/* Message bubble skeleton */}
            <div className="relative group">
              <div className="relative bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 max-w-[600px] animate-pulse">
                {/* Top bar skeleton */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                    <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>

                {/* Message content skeleton */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>

                {/* Status skeleton */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outgoing Message Skeleton */}
      {isOutgoing && (
        <div className="flex justify-end mb-4">
          <div className="flex items-start justify-end space-x-3 max-w-full sm:max-w-[85%]">
            {/* Message bubble skeleton */}
            <div className="relative group">
              <div className="relative bg-gradient-to-r from-blue-50 to-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm border border-blue-100 max-w-[600px] animate-pulse">
                {/* Top bar skeleton */}
                <div className="flex items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                    <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>

                {/* Message content skeleton */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>

                {/* Status skeleton */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/50">
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar skeleton */}
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageSkeleton;

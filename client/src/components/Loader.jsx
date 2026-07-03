import React from 'react';

export const CardSkeleton = () => {
  return (
    <div className="border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4 rounded-2xl animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-full w-24"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full w-12"></div>
      </div>
      <div className="space-y-1.5">
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded-lg w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-4/5"></div>
      </div>
      <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-dark-border/40">
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full w-16"></div>
        <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-700"></div>
      </div>
    </div>
  );
};

export const BoardSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2">
      {[1, 2, 3, 4].map((col) => (
        <div key={col} className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-6 animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((card) => (
              <CardSkeleton key={card} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const PageSkeleton = () => {
  return (
    <div className="p-6 space-y-6 w-full h-full">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-72 animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-xl w-32 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((card) => (
          <div key={card} className="h-28 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl animate-pulse p-4"></div>
        ))}
      </div>
      <div className="h-80 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl animate-pulse"></div>
    </div>
  );
};

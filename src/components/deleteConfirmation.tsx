'use client';

import { useState } from "react";

interface DeleteConfirmationProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  itemName?: string;
}

export function DeleteConfirmation({ isOpen, onCancel, onConfirm, itemName }: DeleteConfirmationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 shadow-lg text-center">
        <p className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
          {`Are you sure you want to delete ${itemName || "this item"}?`}
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
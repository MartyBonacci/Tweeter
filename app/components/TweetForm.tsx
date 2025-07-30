import React, { useState } from 'react';
import { Form, useActionData } from 'react-router';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tweetContentSchema, type TweetContent } from '../lib/schemas';
import { Avatar } from './Avatar';

interface ActionData {
  error?: string;
  errors?: Array<{field: string; message: string}>;
  success?: boolean;
  tweet?: {
    id: string;
    content: string;
    createdAt: string;
  };
}

export function TweetForm() {
  const [token, setToken] = useState('');
  const { user } = useCurrentUser();
  const actionData = useActionData() as ActionData;
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    setError
  } = useForm<TweetContent>({
    resolver: zodResolver(tweetContentSchema),
    defaultValues: { content: '' }
  });
  
  const content = watch('content') || '';
  const charCount = content.length;
  const isOverLimit = charCount > 140;
  const remainingChars = 140 - charCount;

  // Set token from localStorage on client side only
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token') || '');
    }
  }, []);

  // Handle server-side validation errors
  React.useEffect(() => {
    if (actionData?.errors) {
      actionData.errors.forEach(error => {
        setError(error.field as keyof TweetContent, { message: error.message });
      });
    }
  }, [actionData?.errors, setError]);

  // Clear form content on successful tweet creation and trigger page refresh
  React.useEffect(() => {
    if (actionData?.tweet) {
      reset();
      // Trigger a page refresh to show the new tweet
      window.location.reload();
    }
  }, [actionData, reset]);


  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <Avatar 
            src={user?.avatar}
            alt={user?.displayName || user?.username || 'User'}
            size="md"
          />
        </div>
        
        <div className="flex-1">
          <Form method="post">
            <input type="hidden" name="token" value={token} />
            <textarea
              {...register("content")}
              placeholder="What's happening?"
              className={`w-full resize-none border-0 focus:ring-0 text-lg placeholder-gray-500 p-0 min-h-[60px] ${
                errors.content ? 'text-red-500' : ''
              }`}
              rows={3}
            />
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <span 
                  className={`text-sm ${isOverLimit ? 'text-red-500' : remainingChars <= 20 ? 'text-orange-500' : 'text-gray-500'}`}
                >
                  {remainingChars}
                </span>
              </div>
              
              <button
                type="submit"
                disabled={!content.trim() || isOverLimit || isSubmitting}
                className="bg-blue-500 text-white px-4 py-2 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                {isSubmitting ? 'Tweeting...' : 'Tweet'}
              </button>
            </div>
          </Form>
          
          {actionData?.error && (
            <p className="text-red-500 text-sm mt-2">{actionData.error}</p>
          )}
          {errors.content && (
            <p className="text-red-500 text-sm mt-2">{errors.content.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
import { Form } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userProfileUpdateSchema, type UserProfileUpdate } from '../lib/schemas';
import { useEffect, useState, useRef } from 'react';

interface ProfileEditFormProps {
  userData: {
    username: string;
    displayName: string;
    bio?: string;
    avatar?: string;
  };
  token: string;
  actionData?: {
    error?: string;
    errors?: Array<{field: string; message: string}>;
    success?: boolean;
  };
  onCancel: () => void;
}

export function ProfileEditForm({ userData, token, actionData, onCancel }: ProfileEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    watch
  } = useForm<UserProfileUpdate>({
    resolver: zodResolver(userProfileUpdateSchema),
    defaultValues: {
      username: userData.username,
      displayName: userData.displayName,
      bio: userData.bio || '',
      avatar: userData.avatar || ''
    }
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(userData.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAvatar = watch('avatar');

  // Handle server-side validation errors
  useEffect(() => {
    if (actionData?.errors) {
      actionData.errors.forEach(error => {
        setError(error.field as keyof UserProfileUpdate, { message: error.message });
      });
    }
  }, [actionData?.errors, setError]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File size too large. Maximum size is 5MB.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setValue('avatar', result.url);
      setPreviewUrl(result.url);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setPreviewUrl(currentAvatar || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Form method="post" className="space-y-6">
      <input type="hidden" name="token" value={token} />
      
      {actionData?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {actionData.error}
        </div>
      )}
      
      {actionData?.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Profile updated successfully!
        </div>
      )}

      {/* Display Name */}
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
          Display name
        </label>
        <input
          {...register("displayName")}
          type="text"
          id="displayName"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.displayName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.displayName && (
          <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
        )}
      </div>

      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
          Username
        </label>
        <input
          {...register("username")}
          type="text"
          id="username"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.username ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
          Bio
        </label>
        <textarea
          {...register("bio")}
          id="bio"
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.bio ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Tell us about yourself..."
        />
        {errors.bio && (
          <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
        )}
      </div>

      {/* Avatar Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Picture
        </label>
        
        <div className="flex items-start space-x-4">
          {/* Avatar Preview */}
          <div className="relative">
            <div 
              onClick={handleAvatarClick}
              className="w-24 h-24 rounded-full border-2 border-gray-300 cursor-pointer hover:border-blue-500 transition-colors overflow-hidden bg-gray-50 flex items-center justify-center"
            >
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Profile preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs">Click to upload</span>
                </div>
              )}
            </div>
            
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
              </div>
            )}
          </div>
          
          {/* Upload Controls */}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <input
              {...register("avatar")}
              type="hidden"
            />
            
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Choose file'}
            </button>
            
            <p className="mt-1 text-xs text-gray-500">
              JPEG, PNG, WebP, or GIF. Max 5MB.
            </p>
            
            {uploadError && (
              <p className="mt-1 text-sm text-red-600">{uploadError}</p>
            )}
          </div>
        </div>
        
        {errors.avatar && (
          <p className="mt-1 text-sm text-red-600">{errors.avatar.message}</p>
        )}
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </Form>
  );
}
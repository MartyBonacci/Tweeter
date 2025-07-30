import { Form, useActionData } from 'react-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userRegistrationSchema, type UserRegistration } from '../lib/schemas';

interface ActionData {
  error?: string;
  errors?: Array<{field: string; message: string}>;
  success?: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    displayName: string;
  };
  token?: string;
}

export default function RegisterForm() {
  const actionData = useActionData() as ActionData;
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<UserRegistration>({
    resolver: zodResolver(userRegistrationSchema)
  });
  
  // Handle server-side validation errors
  React.useEffect(() => {
    if (actionData?.errors) {
      actionData.errors.forEach(error => {
        setError(error.field as keyof UserRegistration, { message: error.message });
      });
    }
  }, [actionData?.errors, setError]);
  
  React.useEffect(() => {
    if (actionData?.token && actionData?.user) {
      localStorage.setItem('token', actionData.token);
      localStorage.setItem('user', JSON.stringify(actionData.user));
      window.location.href = '/home';
    }
  }, [actionData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        
        <Form method="post" className="mt-8 space-y-6">
          {actionData?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {actionData.error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                {...register("username")}
                id="username"
                type="text"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Choose a username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                {...register("displayName")}
                id="displayName"
                type="text"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.displayName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Your display name (optional)"
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register("password")}
                id="password"
                type="password"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center">
            <a href="/login" className="text-blue-600 hover:text-blue-500">
              Already have an account? Sign in
            </a>
          </div>
        </Form>
      </div>
    </div>
  );
}
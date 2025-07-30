import { Form, useActionData } from 'react-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userLoginSchema, type UserLogin } from '../lib/schemas';

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

export default function LoginForm() {
  const actionData = useActionData() as ActionData;
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<UserLogin>({
    resolver: zodResolver(userLoginSchema)
  });
  
  // Handle server-side validation errors
  React.useEffect(() => {
    if (actionData?.errors) {
      actionData.errors.forEach(error => {
        setError(error.field as keyof UserLogin, { message: error.message });
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
            Sign in to your account
          </h2>
        </div>
        
        <Form method="post" className="mt-8 space-y-6">
          {actionData?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {actionData.error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                {...register("username")}
                id="username"
                type="text"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                {...register("password")}
                id="password"
                type="password"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Password"
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
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <a href="/register" className="text-blue-600 hover:text-blue-500">
              Don't have an account? Sign up
            </a>
          </div>
        </Form>
      </div>
    </div>
  );
}
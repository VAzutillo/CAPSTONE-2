import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import type { UserRole } from '../types/rbac';

import { API_BASE_URL } from '../config';

async function safeJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) {
    throw new Error('Backend did not respond. Is the server running on port 5000?');
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      response.ok
        ? 'Invalid response from server.'
        : `Server error (${response.status}). Backend may be down or returning an error page. Start it with: npm run dev (in backend folder).`
    );
  }
}

export function LoginForm({
  onLogin,
  onForgot,
  forcedRole,
  showRoleSelector = false,
  title = 'Portal Login',
  subtitle = 'Enter your credentials to continue',
}: {
  onLogin?: (user: { email: string; role: UserRole }) => void;
  onForgot?: () => void;
  forcedRole?: UserRole;
  showRoleSelector?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getEmailPlaceholder = () => {
    switch (forcedRole) {
      case 'student':
        return 'Student Email';
      case 'admin':
        return 'ADMIN ID';
      case 'super_admin':
        return 'This is a prohibited area';
      case 'program_head':
        return 'Program Head email';
      default:
        return 'email@example.com';
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const requestBody: { email: string; password: string; expectedRole?: string } = {
        email,
        password,
      };

      if (forcedRole) {
        requestBody.expectedRole = forcedRole;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.user && onLogin) {
        onLogin(data.user as { email: string; role: UserRole });
      }
    } catch (err) {
      let message = 'An error occurred during login';
      if (err instanceof Error) {
        message =
          err.message === 'Failed to fetch'
            ? 'Cannot reach server. Start the backend (npm run dev in backend folder) and ensure it runs on port 5000.'
            : err.message;
      }
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 mb-4">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">{title}</h1>
          <p className="text-neutral-500">{subtitle}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={getEmailPlaceholder()}
                required
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-11 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 placeholder:text-neutral-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-900/10 cursor-pointer"
              />
              <span className="ml-2 text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">
                Remember me
              </span>
            </label>
            <button
              type="button"
              onClick={onForgot}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 focus:ring-4 focus:ring-neutral-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <p className="text-center text-sm text-neutral-500">
            Authorized access only. Your role controls available features.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';

export function ForgotPasswordForm({ onBack }: { onBack?: () => void }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock reset simulation
    setTimeout(() => {
      console.log('Password reset requested for:', { email });
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 mb-4">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Forgot Password</h1>
          <p className="text-neutral-500">We'll send a reset link to your email.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-neutral-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isSubmitted}
            className="w-full py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 focus:ring-4 focus:ring-neutral-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : isSubmitted ? (
              'Email sent'
            ) : (
              'Send reset link'
            )}
          </button>

          {/* Back to Login */}
          <button
            type="button"
            onClick={onBack}
            className="w-full text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Back to login
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <p className="text-center text-sm text-neutral-500">
            If you no longer have access to this email, contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

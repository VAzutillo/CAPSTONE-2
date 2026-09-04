import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface NotFoundProps {
  isAuthenticated?: boolean;
  onGoHome?: () => void;
  gifUrl?: string;
}

export function NotFound({ 
  isAuthenticated = false, 
  onGoHome,
  gifUrl = 'https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif'
}: NotFoundProps) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (isAuthenticated && onGoHome) {
      onGoHome();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle radial gradient background effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(245, 245, 245, 0.8) 0%, rgba(229, 229, 229, 0.9) 50%, rgba(212, 212, 212, 1) 100%)'
        }}
      ></div>
      
      {/* Soft blurred element in center */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-neutral-300/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-lg w-full text-center px-4">
        {/* Animated GIF */}
        <div className="mb-6 flex justify-center">
          <img 
            src={gifUrl} 
            alt="404 animated character" 
            className="max-w-full h-auto"
            style={{ maxHeight: '300px', width: 'auto' }}
          />
        </div>

        {/* 404 Error Code */}
        <h1 className="text-8xl font-bold text-neutral-900 mb-4">404</h1>

        {/* Primary Error Message */}
        <h2 className="text-3xl font-bold text-neutral-900 mb-4">
          Oops! You seem to be lost in space.
        </h2>

        {/* Secondary Explanatory Text */}
        <p className="text-lg text-neutral-600 mb-8">
          The page you are looking for doesn't exist or has been moved. Let's get you back to familiar territory.
        </p>

        {/* Back to Dashboard Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleGoHome}
            className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 px-6 py-3 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

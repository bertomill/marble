'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.7)' }}
      >
        <source src="/marble_ball.mp4" type="video/mp4" />
      </video>

      {/* Overlay with glass effect */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4 rounded-2xl backdrop-blur-xl bg-white/10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/marble-logo.svg"
            alt="Marble Logo"
            width={80}
            height={80}
            className="drop-shadow-lg"
          />
        </div>

        {/* Auth Form */}
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold text-center text-white mb-8">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>

          <button className="w-full py-3 px-4 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>

          <p className="text-center text-white/80">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-white underline hover:text-white/80 transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
} 
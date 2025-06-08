import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import ConversationSummary from "./components/ConversationSummary";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://quirky-maxwell.emergent.host';
const API = `${BACKEND_URL}/api`;
const VAPI_PUBLIC_KEY = process.env.REACT_APP_VAPI_PUBLIC_KEY || '54bc38a3-ee48-4196-aca1-9c69eab79d1e';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '854027414985-6rm434tqail2661j4tv9kgl0350bn8rf.apps.googleusercontent.com';

// Header Component with Credits Display
const Header = ({ user, onShowAuth, onNavigate }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <button 
              onClick={() => onNavigate('dashboard')}
              className="ml-3 text-xl sm:text-2xl font-bold text-gray-900 hover:text-indigo-600"
            >
              Juggy AI
            </button>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-6">
            {user && (
              <>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => onNavigate('interview')}
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  New Interview
                </button>
                
                <div className="flex items-center bg-indigo-50 px-3 py-2 rounded-lg">
                  <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs text-white font-bold">C</span>
                  </div>
                  <span className="font-semibold text-indigo-700">{user.credits}</span>
                  <span className="text-sm text-indigo-600 ml-1">credits</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Welcome, {user.name}</span>
                  <button 
                    onClick={() => onShowAuth('logout')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
            
            {!user && (
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => onShowAuth('login')}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Login
                </button>
                <button 
                  onClick={() => onShowAuth('signup')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Welcome Credits Modal
const WelcomeCreditsModal = ({ isOpen, onClose, onGetStarted }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center relative">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto flex items-center justify-center mb-4 animate-bounce">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Juggy AI!</h2>
          <p className="text-gray-600">Congratulations! You've received</p>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-xl text-white font-bold">C</span>
            </div>
            <span className="text-4xl font-bold text-indigo-600">10</span>
          </div>
          <p className="text-indigo-700 font-semibold">Free Credits</p>
          <p className="text-sm text-gray-600 mt-2">That's 10 minutes of free interview practice!</p>
        </div>
        
        <button
          onClick={onGetStarted}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

// Landing Page Component
const LandingPage = ({ onSelectUseCase, onShowAuth, user, onNavigate }) => {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const handleGetStarted = () => {
    setShowWelcomeModal(false);
    onSelectUseCase('mock-interview');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header user={user} onShowAuth={onShowAuth} onNavigate={onNavigate} />
      
      <WelcomeCreditsModal 
        isOpen={showWelcomeModal} 
        onClose={() => setShowWelcomeModal(false)}
        onGetStarted={handleGetStarted}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Master Your 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> PM Interviews</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Practice product management interviews with AI-powered voice conversations. 
            Get real-time feedback, improve your storytelling, and land your dream PM role.
          </p>
          
          {user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => onSelectUseCase('mock-interview')}
                className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Start Mock Interview
              </button>
              <div className="text-sm text-gray-600">
                You have <span className="font-semibold text-indigo-600">{user.credits} credits</span> remaining
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onShowAuth('signup')}
                className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Get Started Free
              </button>
              <button
                onClick={() => onShowAuth('login')}
                className="border border-indigo-600 text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Juggy AI?</h2>
          <p className="text-xl text-gray-600">The most realistic interview practice experience</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">AI-Powered Conversations</h3>
            <p className="text-gray-600">Practice with advanced AI that adapts to your responses and provides realistic interview scenarios.</p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">Real-time Analytics</h3>
            <p className="text-gray-600">Get detailed feedback on confidence, fluency, and communication style with actionable insights.</p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">Job-Specific Prep</h3>
            <p className="text-gray-600">Paste any job description and get customized interview questions tailored to the specific role.</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Pay only for what you use. No subscriptions.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Starter</h3>
              <div className="text-4xl font-bold text-indigo-600 mb-6">$10</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  60 credits (60 minutes)
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Full analytics
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  All interview types
                </li>
              </ul>
            </div>

            <div className="bg-indigo-600 text-white rounded-xl p-8 shadow-lg relative">
              <div className="absolute top-0 right-0 bg-yellow-400 text-black px-3 py-1 rounded-bl-lg rounded-tr-xl text-sm font-semibold">
                BEST VALUE
              </div>
              <h3 className="text-2xl font-bold mb-4">Pro</h3>
              <div className="text-4xl font-bold mb-6">$45</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  300 credits (300 minutes)
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Advanced analytics
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Priority support
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  25% bonus credits
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Authentication Component
const AuthComponent = ({ authType, onBack, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(authType === 'login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API}${endpoint}`, formData);
      
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        onAuthSuccess(response.data.user);
      } else {
        setError(response.data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.response?.data?.message || 'Authentication failed. Please try again.');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API}/auth/google`, {
        credential: credentialResponse.credential
      });
      
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        onAuthSuccess(response.data.user);
      } else {
        setError(response.data.message || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setError(error.response?.data?.message || 'Google authentication failed. Please try again.');
    }
    setLoading(false);
  };

  const handleGoogleError = () => {
    setError('Google authentication failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center mb-6">
            <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-3xl font-bold text-gray-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
                minLength="6"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              disabled={loading}
              text={isLogin ? "signin_with" : "signup_with"}
              shape="rectangular"
              theme="outline"
              size="large"
              width="100%"
            />
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Low Credits Modal Component
const LowCreditsModal = ({ isOpen, onClose, currentCredits, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-600 rounded-full mx-auto flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Credits Exhausted!</h2>
          <p className="text-gray-600">You have {currentCredits} credits remaining</p>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-6 mb-6">
          <p className="text-orange-700 font-semibold mb-2">Continue your interview preparation!</p>
          <p className="text-sm text-gray-600">Choose a plan to get more practice time</p>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="border-2 border-indigo-200 rounded-lg p-4 hover:border-indigo-400 transition-colors">
            <h3 className="font-semibold text-lg text-gray-900">Starter Pack</h3>
            <p className="text-2xl font-bold text-indigo-600">$10</p>
            <p className="text-sm text-gray-600">60 credits (60 minutes)</p>
            <p className="text-xs text-gray-500">1 credit = 1 minute</p>
            <button
              onClick={() => onUpgrade('starter')}
              className="mt-3 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Starter Pack
            </button>
          </div>
          
          <div className="border-2 border-green-200 rounded-lg p-4 hover:border-green-400 transition-colors relative">
            <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              BEST VALUE
            </div>
            <h3 className="font-semibold text-lg text-gray-900">Pro Pack</h3>
            <p className="text-2xl font-bold text-green-600">$45</p>
            <p className="text-sm text-gray-600">300 credits (300 minutes)</p>
            <p className="text-xs text-gray-500">1 credit = 1 minute</p>
            <button
              onClick={() => onUpgrade('pro')}
              className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Get Pro Pack
            </button>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

// Payment Success Component
const PaymentSuccess = ({ user, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [creditsAdded, setCreditsAdded] = useState(0);
  const [showRecoveryButton, setShowRecoveryButton] = useState(false);

  const tryRecoveryManually = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/payments/recover-payment`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(true);
        setCreditsAdded(response.data.credits_added);
        setMessage(response.data.message);
        setShowRecoveryButton(false);
        
        // Update user data and refresh
        setTimeout(async () => {
          try {
            const userResponse = await axios.get(`${API}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (userResponse.data) {
              localStorage.setItem('user', JSON.stringify(userResponse.data));
              window.location.reload();
            }
          } catch (error) {
            console.error('Error refreshing user data:', error);
          }
        }, 2000);
      } else {
        setMessage(`Recovery failed: ${response.data.message}. Please contact support.`);
        setShowRecoveryButton(false);
      }
    } catch (error) {
      console.error('Manual recovery failed:', error);
      setMessage('Manual recovery failed. Please contact support with your payment details.');
      setShowRecoveryButton(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        // Check if credits were just added manually
        const lastCreditAction = localStorage.getItem('lastCreditAction');
        if (lastCreditAction) {
          const creditData = JSON.parse(lastCreditAction);
          if (creditData.timestamp && (Date.now() - creditData.timestamp) < 60000) { // Within last minute
            setSuccess(true);
            setCreditsAdded(creditData.credits || 60);
            setMessage('Payment recovered! Credits have been added to your account.');
            localStorage.removeItem('lastCreditAction');
            setLoading(false);
            
            setTimeout(() => {
              window.location.reload();
            }, 3000);
            return;
          }
        }

        // Get session_id from URL parameters - try multiple possible parameter names
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id') || urlParams.get('sessionId') || urlParams.get('checkout_session_id');
        
        console.log('Current URL:', window.location.href);
        console.log('URL Parameters:', Object.fromEntries(urlParams));
        console.log('Session ID found:', sessionId);
        
        if (!sessionId) {
          // Show all URL parameters for debugging
          const allParams = Object.fromEntries(urlParams);
          console.error('No session ID found. All URL parameters:', allParams);
          setMessage(`No payment session found. URL parameters: ${JSON.stringify(allParams)}`);
          
          // Try to recover payment automatically
          try {
            console.log('Attempting automatic payment recovery...');
            const token = localStorage.getItem('token');
            const recoveryResponse = await axios.post(`${API}/payments/recover-payment`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (recoveryResponse.data.success) {
              setSuccess(true);
              setCreditsAdded(recoveryResponse.data.credits_added);
              setMessage(recoveryResponse.data.message);
              
              // Update user data and trigger refresh
              setTimeout(async () => {
                try {
                  const userResponse = await axios.get(`${API}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  
                  if (userResponse.data) {
                    localStorage.setItem('user', JSON.stringify(userResponse.data));
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Error refreshing user data:', error);
                }
              }, 2000);
              return;
            } else {
              setMessage(`Payment recovery failed: ${recoveryResponse.data.message}`);
            }
          } catch (recoveryError) {
            console.error('Automatic payment recovery failed:', recoveryError);
            // Check if it was a successful manual addition
            if (recoveryError.response?.data?.success) {
              setSuccess(true);
              setCreditsAdded(recoveryError.response.data.credits_added);
              setMessage(recoveryError.response.data.message);
              setShowRecoveryButton(false);
              
              setTimeout(async () => {
                try {
                  const userResponse = await axios.get(`${API}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  
                  if (userResponse.data) {
                    localStorage.setItem('user', JSON.stringify(userResponse.data));
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Error refreshing user data:', error);
                }
              }, 2000);
              return;
            }
            
            setMessage('No payment session found. If you were charged, use the recovery button below.');
            setShowRecoveryButton(true);
          }
          
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('token');
        console.log('Attempting to confirm payment with session ID:', sessionId);
        
        const response = await axios.post(`${API}/payments/confirm-checkout`, {
          session_id: sessionId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Payment confirmation response:', response.data);

        if (response.data.success) {
          setSuccess(true);
          setCreditsAdded(response.data.credits_added);
          setMessage(response.data.message);
          
          // Update user data and trigger a refresh
          setTimeout(async () => {
            try {
              const userResponse = await axios.get(`${API}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (userResponse.data) {
                localStorage.setItem('user', JSON.stringify(userResponse.data));
                // Trigger a page reload to ensure all components get updated user data
                window.location.reload();
              }
            } catch (error) {
              console.error('Error refreshing user data:', error);
            }
          }, 2000);
        } else {
          setMessage('Payment confirmation failed');
        }
      } catch (error) {
        console.error('Payment confirmation error:', error);
        setMessage('Failed to confirm payment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        {success ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-semibold">+{creditsAdded} Credits Added</p>
              <p className="text-green-700 text-sm">Ready for more interview practice!</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Issue</h2>
            <p className="text-gray-600 mb-4">{message}</p>
          </>
        )}
        
        <div className="space-y-3">
          {!success && showRecoveryButton && (
            <button
              onClick={tryRecoveryManually}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Recovering Payment...' : 'Try Payment Recovery'}
            </button>
          )}
          
          <div className="space-y-3">
            {!success && showRecoveryButton && (
              <button
                onClick={tryRecoveryManually}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Recovering Payment...' : 'Try Payment Recovery'}
              </button>
            )}
            
            <button
              onClick={onComplete}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Payment Cancelled Component
const PaymentCancelled = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h2>
        <p className="text-gray-600 mb-6">Your payment was cancelled. No charges were made.</p>
        
        <button
          onClick={onBack}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

const Dashboard = ({ user, onShowAuth, onNavigate, onSelectUseCase, onViewConversation }) => {
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [conversationsRes, statsRes, transactionsRes] = await Promise.all([
        axios.get(`${API}/conversations`, { headers }),
        axios.get(`${API}/dashboard/stats`, { headers }),
        axios.get(`${API}/credits/transactions`, { headers })
      ]);

      setConversations(conversationsRes.data);
      setStats(statsRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onShowAuth={onShowAuth} onNavigate={onNavigate} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onShowAuth={onShowAuth} onNavigate={onNavigate} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Track your progress and practice sessions</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_conversations || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Practice Time</p>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.total_minutes || 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Average Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(stats.average_score || 0)}`}>
                  {stats.average_score || 0}/10
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-sm text-white font-bold">C</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Credits Remaining</p>
                <p className="text-2xl font-bold text-indigo-600">{user.credits}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'conversations', name: 'Practice Sessions', icon: '🎯' },
                { id: 'credits', name: 'Credits History', icon: '💳' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => onSelectUseCase('mock-interview')}
                      className="p-6 border-2 border-dashed border-indigo-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">🎤</div>
                        <h4 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">Start New Interview</h4>
                        <p className="text-gray-600">Practice with AI-powered mock interviews</p>
                      </div>
                    </button>

                    <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-center">
                        <div className="text-3xl mb-2">📈</div>
                        <h4 className="text-lg font-semibold text-gray-900">Your Progress</h4>
                        <p className="text-gray-600">
                          {stats.total_conversations > 0 
                            ? `${stats.total_conversations} sessions completed with ${stats.average_score}/10 average score`
                            : 'Start your first practice session to see progress'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Sessions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Practice Sessions</h3>
                  {conversations.length > 0 ? (
                    <div className="space-y-3">
                      {conversations.slice(0, 3).map((conversation) => (
                        <div key={conversation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {conversation.type === 'mock_interview' ? 'Mock Interview' : 'Practice Session'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {formatDate(conversation.created_at)} • {conversation.duration_minutes}m
                              {conversation.analysis && (
                                <span className={`ml-2 ${getScoreColor(conversation.analysis.overall_score)}`}>
                                  Score: {conversation.analysis.overall_score}/10
                                </span>
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() => onViewConversation(conversation)}
                            className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🎯</div>
                      <p>No practice sessions yet. Start your first interview!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'conversations' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">All Practice Sessions</h3>
                  <button
                    onClick={() => onSelectUseCase('mock-interview')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    New Session
                  </button>
                </div>

                {conversations.length > 0 ? (
                  <div className="space-y-4">
                    {conversations.map((conversation) => (
                      <div key={conversation.id} className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {conversation.type === 'mock_interview' ? 'Mock Interview' : 'Practice Session'}
                              </h4>
                              <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                                conversation.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {conversation.status}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>📅 {formatDate(conversation.created_at)}</p>
                              <p>⏱️ Duration: {conversation.duration_minutes} minutes</p>
                              <p>💰 Credits used: {conversation.credits_used}</p>
                              {conversation.analysis && (
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className={`font-medium ${getScoreColor(conversation.analysis.overall_score)}`}>
                                    Overall: {conversation.analysis.overall_score}/10
                                  </span>
                                  <span className="text-gray-500">
                                    Confidence: {conversation.analysis.confidence_score}/10
                                  </span>
                                  <span className="text-gray-500">
                                    Fluency: {conversation.analysis.fluency_score}/10
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => onViewConversation(conversation)}
                              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🎯</div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No practice sessions yet</h4>
                    <p className="text-gray-600 mb-4">Start your first mock interview to see your progress</p>
                    <button
                      onClick={() => onSelectUseCase('mock-interview')}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Start First Interview
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'credits' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Credits History</h3>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Current Balance</p>
                    <p className="text-2xl font-bold text-indigo-600">{user.credits} credits</p>
                  </div>
                </div>

                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(transaction.created_at)} • {transaction.type}
                          </p>
                        </div>
                        <div className={`text-lg font-semibold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">💳</div>
                    <p>No credit transactions yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = ({ user, onShowAuth, onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onShowAuth={onShowAuth} onNavigate={onNavigate} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users and system settings</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Admin Features</h2>
          <p className="text-gray-600">Admin functionality coming soon...</p>
        </div>
      </div>
    </div>
  );
};

// Mock Interview Form Component with Resume Upload
const MockInterviewForm = ({ onBack, onStartInterview }) => {
  const [formData, setFormData] = useState({
    current_role: '',
    current_company: '',
    pm_experience: '',
    total_experience: '',
    target_role: '',
    target_company: '',
    job_description: ''
  });
  const [jobLink, setJobLink] = useState('');
  const [useJobLink, setUseJobLink] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleJobLinkScrape = async () => {
    if (!jobLink) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/scrape-job`, {
        job_link: jobLink,
        current_role: formData.current_role,
        current_company: formData.current_company,
        pm_experience: parseInt(formData.pm_experience),
        total_experience: parseInt(formData.total_experience)
      });
      
      setFormData({
        ...formData,
        target_role: response.data.target_role,
        target_company: response.data.target_company,
        job_description: response.data.job_description
      });
    } catch (error) {
      alert('Failed to scrape job details. Please fill manually.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const requestData = {
        ...formData,
        pm_experience: parseInt(formData.pm_experience),
        total_experience: parseInt(formData.total_experience)
      };

      const response = await axios.post(`${API}/generate-mock-interview-prompt`, requestData);
      
      onStartInterview(response.data.prompt, 'mock_interview', requestData);
    } catch (error) {
      console.error('Failed to generate interview prompt:', error);
      alert('Failed to generate interview prompt');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center mb-6">
            <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-3xl font-bold text-gray-900">Mock Interview Setup</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Role</label>
                <input
                  type="text"
                  name="current_role"
                  value={formData.current_role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Company</label>
                <input
                  type="text"
                  name="current_company"
                  value={formData.current_company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Product management experience (yrs)</label>
                <input
                  type="number"
                  name="pm_experience"
                  value={formData.pm_experience}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total work experience (yrs)</label>
                <input
                  type="number"
                  name="total_experience"
                  value={formData.total_experience}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="useJobLink"
                  checked={useJobLink}
                  onChange={(e) => setUseJobLink(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="useJobLink" className="text-sm font-medium text-gray-700">
                  I have a job posting URL to auto-fill details
                </label>
              </div>

              {useJobLink && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Posting URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={jobLink}
                      onChange={(e) => setJobLink(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleJobLinkScrape}
                      disabled={loading || !jobLink}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                    >
                      {loading ? 'Scraping...' : 'Auto-fill'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Role <span className="text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  name="target_role"
                  value={formData.target_role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Company <span className="text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  name="target_company"
                  value={formData.target_company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Description <span className="text-gray-400">(optional)</span></label>
              <textarea
                name="job_description"
                value={formData.job_description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Paste the job description here..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Setting up interview...' : 'Start Mock Interview'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Voice Conversation Component  
const VoiceConversation = ({ prompt, type, conversation, viewMode = false, user, onBack, onUserUpdate, additionalData }) => {
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState('ready');
  const [vapiInstance, setVapiInstance] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showLowCreditsModal, setShowLowCreditsModal] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [completedConversation, setCompletedConversation] = useState(null);

  // Timer for tracking conversation duration
  useEffect(() => {
    let interval;
    if (isCallActive && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
        
        // Check if we've crossed a minute boundary for credit deduction
        const minutesElapsed = Math.floor(elapsed / 60);
        const lastMinuteDeducted = Math.floor((elapsed - 1) / 60);
        
        if (minutesElapsed > lastMinuteDeducted && minutesElapsed > 0) {
          deductCredit();
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive, startTime]);

  // Load existing conversation for view mode
  useEffect(() => {
    if (viewMode && conversation) {
      setShowSummary(true);
      setCompletedConversation(conversation);
      if (conversation.transcript) {
        setTranscript(conversation.transcript);
      }
    }
  }, [viewMode, conversation]);

  const deductCredit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/deduct-credit`, {
        conversation_id: conversationId,
        amount: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const updatedUser = { ...user, credits: response.data.remaining_credits };
        onUserUpdate(updatedUser);
        
        // Check if credits are running low
        if (response.data.remaining_credits <= 0) {
          // End call and show payment modal
          endCall();
          setShowLowCreditsModal(true);
        } else if (response.data.remaining_credits <= 2) {
          // Show warning but continue
          setTranscript(prev => prev + `\n⚠️ Low credits warning: ${response.data.remaining_credits} credits remaining\n`);
        }
      }
    } catch (error) {
      console.error('Error deducting credit:', error);
      if (error.response?.status === 402) {
        // No credits left
        endCall();
        setShowLowCreditsModal(true);
      }
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      setShowLowCreditsModal(false);
      const token = localStorage.getItem('token');
      
      // Create Stripe Checkout session
      const response = await axios.post(`${API}/payments/create-checkout-session`, {
        plan_id: planId,
        success_url: `${window.location.origin}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}?payment=cancelled`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkout_url;
      } else {
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Payment processing failed. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (viewMode) return; // Skip initialization for view mode
    
    const initializeVapi = async () => {
      try {
        console.log('Initializing Vapi with key:', VAPI_PUBLIC_KEY);
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            setTranscript('🔍 Checking microphone permissions...\n');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setTranscript(prev => prev + '✅ Microphone access granted.\n');
          } catch (micError) {
            console.warn('Microphone access denied:', micError);
            setTranscript(prev => prev + '⚠️ Microphone access required for voice calls.\n');
          }
        }
        
        const Vapi = (await import('@vapi-ai/web')).default;
        const vapi = new Vapi(VAPI_PUBLIC_KEY);
        
        vapi.on('call-start', async () => {
          console.log('Call started');
          setCallStatus('connected');
          setIsCallActive(true);
          setCallStartTime(Date.now());
          setStartTime(Date.now());
          setTranscript(prev => prev + '🟢 Call connected. Interview starting...\n');
          
          // Create conversation record
          try {
            const token = localStorage.getItem('token');
            const conversationData = {
              type: type || 'mock_interview',
              prompt: prompt,
              status: 'active',
              metadata: additionalData || {}
            };
            
            const response = await axios.post(`${API}/conversations`, conversationData, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.id) {
              setConversationId(response.data.id);
              console.log('Conversation created:', response.data.id);
            }
          } catch (error) {
            console.error('Error creating conversation:', error);
          }
        });
        
        vapi.on('call-end', async () => {
          console.log('Call ended');
          setCallStatus('ended');
          setIsCallActive(false);
          setTranscript(prev => prev + '\n\n🔴 Call ended.\n');
          
          // Save conversation with transcript and analysis
          if (conversationId) {
            try {
              const token = localStorage.getItem('token');
              const callDuration = Math.floor((Date.now() - callStartTime) / 1000 / 60); // Duration in minutes
              
              const conversationUpdate = {
                status: 'completed',
                transcript: transcript,
                duration_minutes: callDuration,
                credits_used: callDuration,
                completed_at: new Date().toISOString()
              };
              
              // Update conversation
              await axios.put(`${API}/conversations/${conversationId}`, conversationUpdate, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              // Generate analysis
              const analysisResponse = await axios.post(`${API}/conversations/${conversationId}/analyze`, {
                transcript: transcript
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              // Get complete conversation with analysis
              const response = await axios.get(`${API}/conversations/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (response.data) {
                setCompletedConversation(response.data);
                setShowSummary(true);
                console.log('Conversation saved and analyzed successfully');
              }
            } catch (error) {
              console.error('Error saving conversation:', error);
              // Show summary anyway with basic data
              setCompletedConversation({
                id: conversationId,
                transcript: transcript,
                duration_minutes: Math.floor((Date.now() - callStartTime) / 1000 / 60),
                analysis: {
                  overall_score: 7,
                  confidence_score: 7,
                  fluency_score: 8,
                  patience_score: 6,
                  preparedness_score: 7,
                  strengths: ['Good communication', 'Clear responses'],
                  improvements: ['More specific examples', 'Better structured answers'],
                  recommendations: ['Practice STAR method', 'Research the company more']
                }
              });
              setShowSummary(true);
            }
          }
        });
        
        vapi.on('transcript', (transcript) => {
          console.log('Transcript:', transcript);
          setTranscript(prev => {
            // Add speaker labels and format transcript
            const formattedTranscript = `${transcript.speaker === 'assistant' ? '🤖 AI: ' : '👤 You: '}${transcript.text}\n\n`;
            return prev + formattedTranscript;
          });
        });
        
        vapi.on('error', (error) => {
          console.error('Vapi error:', error);
          setTranscript(prev => prev + `\n❌ Error: ${error.message || 'Unknown error occurred'}\n`);
          setCallStatus('error');
          setIsCallActive(false);
        });
        
        setVapiInstance(vapi);
        setTranscript('✅ Voice system initialized. Ready to start call.\n');
      } catch (error) {
        console.error('Error initializing Vapi:', error);
        setTranscript(`❌ Failed to initialize voice system: ${error.message}\n`);
      }
    };
    
    initializeVapi();
    
    return () => {
      // Cleanup
      if (vapiInstance) {
        try {
          if (isCallActive) {
            vapiInstance.stop();
          }
        } catch (error) {
          console.error('Error stopping call:', error);
        }
      }
    };
  }, [viewMode, prompt, type]);
  
  const startCall = async () => {
    if (!vapiInstance) {
      setTranscript(prev => prev + '❌ Voice system not initialized yet. Please wait or refresh the page.\n');
      return;
    }
    
    try {
      setCallStatus('connecting');
      setTranscript(prev => prev + '🔄 Connecting to voice assistant...\n');
      
      // Check if user has enough credits
      if (user.credits <= 0) {
        setShowLowCreditsModal(true);
        return;
      }
      
      // Log the complete prompt being sent to VAPI
      console.log('=== SENDING COMPLETE PROMPT TO VAPI ===');
      console.log('Prompt length:', prompt?.length || 0);
      console.log('Prompt preview:', prompt?.substring(0, 500) + '...');
      console.log('Additional Data:', additionalData);
      console.log('==========================================');
      
      // Start the call with the Vapi assistant
      // Note: We'll use the existing assistant and the prompt gets included in metadata
      console.log('Starting VAPI call with assistant ID: 92fe2ebc-86dc-46bc-b018-9bd2a88c0c8c');
      console.log('VAPI instance:', vapiInstance);
      console.log('User credits:', user.credits);
      
      // Verify VAPI instance is ready
      if (!vapiInstance || typeof vapiInstance.start !== 'function') {
        throw new Error('VAPI instance not properly initialized');
      }
      
      await vapiInstance.start('92fe2ebc-86dc-46bc-b018-9bd2a88c0c8c');
    } catch (error) {
      console.error('Error starting call:', error);
      setTranscript(prev => prev + `❌ Failed to start call: ${error.message}\n`);
      setCallStatus('error');
    }
  };
  
  const endCall = async () => {
    if (!vapiInstance || !isCallActive) {
      return;
    }
    
    try {
      await vapiInstance.stop();
      setCallStatus('ending');
      setTranscript(prev => prev + '🔄 Ending call...\n');
    } catch (error) {
      console.error('Error ending call:', error);
      setTranscript(prev => prev + `❌ Error ending call: ${error.message}\n`);
      setCallStatus('error');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onShowAuth={() => {}} onNavigate={() => {}} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-3xl font-bold text-gray-900">
            {viewMode ? 'Conversation Details' : 'Voice Interview'}
          </h2>
        </div>
        
        {showSummary && completedConversation ? (
          <ConversationSummary 
            conversation={completedConversation}
            transcript={transcript}
            onBack={onBack}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 bg-indigo-600 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">
                    {type === 'mock_interview' ? 'Mock Interview' : 'Practice Session'}
                  </h3>
                  <p className="text-indigo-100">
                    {isCallActive ? (
                      <span>Duration: {formatTime(elapsedTime)}</span>
                    ) : (
                      <span>Ready to start</span>
                    )}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-indigo-500 px-3 py-1 rounded-full text-sm">
                    <span className="font-semibold">{user.credits}</span> credits remaining
                  </div>
                  
                  {!viewMode && (
                    callStatus === 'ready' ? (
                      <button
                        onClick={startCall}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Start Call
                      </button>
                    ) : (callStatus === 'active' || callStatus === 'connected') ? (
                      <button
                        onClick={endCall}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        End Call
                      </button>
                    ) : (
                      <button
                        disabled
                        className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
                      >
                        {callStatus === 'connecting' ? 'Connecting...' : 
                         callStatus === 'ending' ? 'Ending...' : 
                         callStatus === 'ended' ? 'Call Ended' : 'Error'}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Live Transcript</h4>
                <div className="bg-gray-50 p-4 rounded-lg h-96 overflow-y-auto text-gray-700 whitespace-pre-wrap">
                  {transcript || 'Transcript will appear here during the conversation...'}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {showLowCreditsModal && (
          <LowCreditsModal
            isOpen={showLowCreditsModal}
            onClose={() => setShowLowCreditsModal(false)}
            currentCredits={user.credits}
            onUpgrade={handleUpgrade}
          />
        )}
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [authType, setAuthType] = useState('signup');
  const [user, setUser] = useState(null);
  const [conversationData, setConversationData] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Check for payment status in URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');
    
    // Handle Stripe success redirect
    if (sessionId || paymentStatus === 'success') {
      setCurrentView('payment-success');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    } else if (paymentStatus === 'cancelled') {
      setCurrentView('payment-cancelled');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Check if this is a new user (just registered) by checking if they haven't seen welcome modal
        if (userData.credits === 10 && !localStorage.getItem('welcomeModalShown')) {
          setShowWelcomeModal(true);
          localStorage.setItem('welcomeModalShown', 'true');
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleSelectUseCase = (useCase) => {
    if (useCase === 'mock-interview') {
      setCurrentView('mock-interview-form');
    }
  };

  const handleShowAuth = (type) => {
    if (type === 'logout') {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('welcomeModalShown');
      setCurrentView('landing');
    } else {
      setAuthType(type);
      setCurrentView('auth');
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('welcomeModalShown', 'false'); // Reset for new users
    // Show welcome modal for new signups (users with exactly 10 credits)
    if (userData.credits === 10) {
      setShowWelcomeModal(true);
    }
    setCurrentView('landing');
  };

  const handleWelcomeModalComplete = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('welcomeModalShown', 'true');
    setCurrentView('dashboard'); // Go to dashboard after welcome
  };

  const handleNavigate = (view) => {
    if (view === 'dashboard') {
      setCurrentView('dashboard');
    } else if (view === 'interview') {
      setCurrentView('mock-interview-form');
    } else if (view === 'admin' && user?.role === 'admin') {
      setCurrentView('admin');
    }
  };

  const handleStartInterview = (prompt, type, additionalData) => {
    setConversationData({ prompt, type, additionalData });
    setCurrentView('voice-conversation');
  };

  const handleBack = () => {
    setCurrentView('landing');
    setConversationData(null);
  };

  const handleViewConversation = (conversation) => {
    setConversationData({ 
      prompt: "", 
      type: conversation.type,
      conversation: conversation,
      viewMode: true 
    });
    setCurrentView('voice-conversation');
  };

  useEffect(() => {
    const testApi = async () => {
      try {
        const response = await axios.get(`${API}/`);
        console.log('API Connected:', response.data.message);
      } catch (error) {
        console.error('API Connection failed:', error);
      }
    };
    testApi();
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="App">
        <WelcomeCreditsModal 
          isOpen={showWelcomeModal} 
          onClose={() => setShowWelcomeModal(false)}
          onGetStarted={handleWelcomeModalComplete}
        />
        
        {currentView === 'landing' && (
          <LandingPage 
            onSelectUseCase={handleSelectUseCase} 
            onShowAuth={handleShowAuth}
            onNavigate={handleNavigate}
            user={user}
          />
        )}
        
        {currentView === 'auth' && (
          <AuthComponent 
            authType={authType}
            onBack={handleBack} 
            onAuthSuccess={handleAuthSuccess} 
          />
        )}
        
        {currentView === 'dashboard' && user && (
          <Dashboard 
            user={user}
            onShowAuth={handleShowAuth}
            onNavigate={handleNavigate}
            onSelectUseCase={handleSelectUseCase}
            onViewConversation={handleViewConversation}
          />
        )}
        
        {currentView === 'admin' && user?.role === 'admin' && (
          <AdminDashboard 
            user={user}
            onShowAuth={handleShowAuth}
            onNavigate={handleNavigate}
          />
        )}
        
        {currentView === 'mock-interview-form' && (
          <MockInterviewForm onBack={handleBack} onStartInterview={handleStartInterview} />
        )}
        
        {currentView === 'voice-conversation' && conversationData && (
          <VoiceConversation 
            prompt={conversationData.prompt} 
            type={conversationData.type} 
            conversation={conversationData.conversation}
            viewMode={conversationData.viewMode}
            additionalData={conversationData.additionalData}
            user={user}
            onBack={handleBack} 
            onUserUpdate={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }}
          />
        )}
        
        {currentView === 'payment-success' && (
          <PaymentSuccess 
            user={user}
            onComplete={() => {
              // Refresh user data and go to dashboard
              const refreshUser = async () => {
                try {
                  const token = localStorage.getItem('token');
                  const response = await axios.get(`${API}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (response.data) {
                    setUser(response.data);
                    localStorage.setItem('user', JSON.stringify(response.data));
                  }
                } catch (error) {
                  console.error('Error refreshing user:', error);
                }
                setCurrentView('dashboard');
              };
              refreshUser();
            }}
          />
        )}
        
        {currentView === 'payment-cancelled' && (
          <PaymentCancelled 
            onBack={() => setCurrentView('dashboard')}
          />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
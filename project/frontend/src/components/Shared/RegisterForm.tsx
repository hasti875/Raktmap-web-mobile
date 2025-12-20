import React, { useState } from "react";
import { User, Lock, Shield, Key, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Loader from "./Loader";
import { useAuth } from "../../contexts/AuthContext";
import axios from "../../utils/axios";

const RegisterForm: React.FC = () => {
  const [step, setStep] = useState<'register' | 'verify' | 'success'>('register');
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Step 1: Register and send OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Frontend validation
    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required.' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (form.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/register', form);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'OTP sent to your email! Please check your inbox.' });
        setStep('verify');
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and create account
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const response = await axios.post('/verify-registration', {
        email: form.email,
        otp: otp,
        password: form.password,
        name: form.name
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Account created successfully!' });
        setStep('success');
        
        // Auto login after successful registration
        setTimeout(async () => {
          try {
            await login(form.email, form.password);
          } catch (loginError) {
            navigate("/login");
          }
        }, 2000);
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Invalid OTP. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const response = await axios.post('/resend-otp', { email: form.email });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'New OTP sent to your email!' });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to resend OTP.' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-10 w-10 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {step === 'register' && 'Register'}
              {step === 'verify' && 'Verify Email'}
              {step === 'success' && 'Success!'}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {step === 'register' && 'Create your hospital account'}
            {step === 'verify' && 'Enter the code sent to your email'}
            {step === 'success' && 'Your account has been created'}
          </p>
        </div>

        {/* Step 1: Registration Form */}
        {step === 'register' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hospital Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter hospital name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {message.text && (
              <div className={`rounded-lg p-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <p className={`text-sm ${
                  message.type === 'success' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {message.text}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Send Verification Code</span>
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter OTP
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Code sent to: {form.email}
              </p>
            </div>

            {message.text && (
              <div className={`rounded-lg p-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <p className={`text-sm ${
                  message.type === 'success' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {message.text}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-6">
                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Logging you in...
            </p>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-red-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;

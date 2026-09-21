import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import PrimaryButton from '../components/PrimaryButton.jsx';
import { brand } from '../theme/brand.js';
import { NOT_APPLICABLE_VALUE } from '../lib/kyIdentity.js';

const ease = [0.22, 1, 0.36, 1];

const premiumWhite = brand.premiumWhite;

const NORMAL_USERS = [
  { username: 'vamshi', password: 'vamshi123' },
  { username: 'rksir', password: 'rksir123' },
  { username: 'divya', password: 'divya123' },
  { username: 'kruthika', password: 'kruthika123' },
  { username: 'aishwarya', password: 'aishwarya123' },
];

function validateNormalUser(username, password) {
  return NORMAL_USERS.find(
    (u) => u.username === username && u.password === password
  );
}

export default function LoginScreen({ onLogin, onAdminLogin, errorText = '' }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (errorText) setLoginError(errorText);
  }, [errorText]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    const user = username.trim();
    const pass = password;

    if (!user || !pass) {
      setLoginError('Please enter both username and password');
      setLoading(false);
      return;
    }

    if (isAdminMode) {
      try {
        const res = await fetch('/api/v1/admin/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user, password: pass }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        onAdminLogin(data.token, data.admin);
      } catch (err) {
        setLoginError(err.message || 'Invalid admin credentials');
      } finally {
        setLoading(false);
      }
      return;
    }

    const matchedUser = validateNormalUser(user, pass);
    if (matchedUser) {
      onLogin(matchedUser.username);
    } else {
      setLoginError('Invalid username or password');
    }
    setLoading(false);
  };

  const handleToggleMode = () => {
    setIsAdminMode((prev) => !prev);
    setLoginError('');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img
            src="/byrgop_logo_1.jpeg"
            alt="BYRGOP"
            className="mx-auto h-20 w-auto object-contain drop-shadow-lg mb-4"
          />
          <h1 className="font-display text-2xl font-bold tracking-tight" style={{ color: premiumWhite.bright }}>
            {isAdminMode ? 'Admin Sign In' : 'Sign In'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: premiumWhite.soft }}>
            {isAdminMode
              ? 'Enter your admin credentials to access the dashboard'
              : 'Enter your credentials to continue'}
          </p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor={isAdminMode ? 'email' : 'username'}
              className="block text-sm font-medium mb-1.5"
              style={{ color: premiumWhite.bright }}
            >
              {isAdminMode ? 'Email' : 'Username'}
            </label>
            <input
              type={isAdminMode ? 'email' : 'text'}
              id={isAdminMode ? 'email' : 'username'}
              autoComplete={isAdminMode ? 'email' : 'username'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isAdminMode ? 'admin@byrgop.com' : 'e.g., vamshi'}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1.5"
              style={{ color: premiumWhite.bright }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              disabled={loading}
            />
          </div>

          {loginError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-center"
              style={{ color: brand.palette.red[500] }}
            >
              {loginError}
            </motion.p>
          )}

          <PrimaryButton
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-base font-bold tracking-[0.05em]"
          >
            {loading ? 'Signing in...' : 'SIGN IN'}
          </PrimaryButton>
        </form>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-5"
        >
          <a
            href="https://byrgop.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 rounded-full px-9 py-4 text-sm font-semibold uppercase tracking-[0.16em] border border-white/15 text-mist hover:border-white/35 hover:bg-white/5 transition-all duration-300"
          >
            Please visit byrgop.com
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 text-center"
        >
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-sm font-medium transition-colors hover:underline"
            style={{ color: brand.accent }}
          >
            {isAdminMode ? 'Switch to user sign in' : 'Switch to admin sign in'}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 text-center text-xs"
          style={{ color: premiumWhite.soft }}
        >
          <p>BYRGOP Testing Environment</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
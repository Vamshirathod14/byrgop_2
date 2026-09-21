import { useState } from 'react';
import { adminBrand } from '../theme/brand.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setErr(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <img
            src="/byrgop-logo.png"
            alt="BYRGOP"
            style={{ height: 40 }}
            className="w-auto object-contain"
          />
          <h1 className="font-display mt-4 text-2xl font-semibold text-mist">Admin Console</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-mist-muted">
            {adminBrand.tagline}
          </p>
        </div>
        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
              Email
            </label>
            <input
              type="email"
              className="input"
              placeholder="admin@byrgop.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
              Password
            </label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {err && (
            <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-700">
              {err}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
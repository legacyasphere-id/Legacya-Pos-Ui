import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/layout/Logo';
import { useAuthStore } from '../store/auth.store';

export default function Login() {
  const navigate = useNavigate();
  const { session, signIn, configured } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-app text-ink flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <div className="bg-card border border-line rounded-2xl p-6 shadow-token-md">
          <h1 className="text-[18px] font-bold text-ink" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Sign in
          </h1>
          <p className="text-[12.5px] text-ink-muted mt-1 mb-5">Welcome back to LegacyaPOS</p>

          {!configured && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-warning-soft text-warning-text p-3 text-[12px]">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>Supabase isn’t configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            <Input label="Email" type="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            <Input label="Password" type="password" autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-danger-soft text-danger-text p-3 text-[12px]">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" icon={LogIn}
              disabled={busy || !configured}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
        <p className="text-center text-[11.5px] text-ink-muted mt-4">
          LegacyaPOS · Restaurant OS
        </p>
      </div>
    </div>
  );
}

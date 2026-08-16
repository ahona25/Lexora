'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const redirect = searchParams.get('redirect');
      if (redirect) { router.push(redirect); return; }
      const role = user?.role?.toLowerCase();
      if (role === 'admin') router.push('/admin/dashboard');
      else if (role === 'lawyer') router.push('/lawyer/dashboard');
      else router.push('/client/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.logo}>⚖️</div>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to your Lexora account</p>
      </div>

      {error && <div className={styles.errorAlert}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            required
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Your password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            required
            autoComplete="current-password"
          />
        </div>
        <div className={styles.formRow}>
          <label className={styles.remember}>
            <input type="checkbox" /> Remember me
          </label>
          <Link href="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In →'}
        </button>
      </form>

      <p className={styles.registerLink} style={{ marginTop: '1.75rem' }}>
        Don't have an account?{' '}
        <Link href="/register" className={styles.link}>Create one free</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <Suspense fallback={<div style={{ color: '#6B7280' }}>Loading...</div>}>
          <LoginContent />
        </Suspense>
      </main>
    </>
  );
}

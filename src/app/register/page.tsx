'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const defaultType = searchParams.get('type') || 'client';

  const [type, setType] = useState(defaultType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', city: '',
    professionalTitle: '', barNumber: '', yearsOfExperience: '',
    consultationFee: '', biography: '',
    terms: false,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!form.terms) {
      setError('You must accept the Terms of Service.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await register(type, form);
      if (type === 'lawyer') router.push('/lawyer/dashboard');
      else router.push('/client/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.logo}>⚖️</div>
        <h1 className={styles.title}>Create Your Account</h1>

        <div className={styles.typeToggle}>
          <button
            className={`${styles.typeBtn} ${type === 'client' ? styles.typeActive : ''}`}
            onClick={() => setType('client')}
          >
            👤 Client
          </button>
          <button
            className={`${styles.typeBtn} ${type === 'lawyer' ? styles.typeActive : ''}`}
            onClick={() => setType('lawyer')}
          >
            ⚖️ Lawyer
          </button>
        </div>

        {type === 'lawyer' && (
          <div className={styles.lawyerNotice}>
            ℹ️ Lawyer accounts require verification (24-48 hrs) before becoming publicly bookable.
          </div>
        )}
      </div>

      {error && <div className={styles.errorAlert}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow2}>
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input className="form-input" value={form.firstName} onChange={e => set('firstName', e.target.value)} required placeholder="First name" />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input className="form-input" value={form.lastName} onChange={e => set('lastName', e.target.value)} required placeholder="Last name" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="your@email.com" />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+8801XXXXXXXXX" />
        </div>

        <div className="form-group">
          <label className="form-label">City</label>
          <select className="form-input" value={form.city} onChange={e => set('city', e.target.value)}>
            <option value="">Select City</option>
            <option>Dhaka</option>
            <option>Chittagong</option>
            <option>Sylhet</option>
            <option>Rajshahi</option>
            <option>Khulna</option>
          </select>
        </div>

        {type === 'lawyer' && (
          <>
            <div className={styles.divider}><span>Professional Information</span></div>
            <div className="form-group">
              <label className="form-label">Professional Title *</label>
              <input className="form-input" value={form.professionalTitle} onChange={e => set('professionalTitle', e.target.value)} placeholder="e.g. Senior Advocate, Barrister" />
            </div>
            <div className={styles.formRow2}>
              <div className="form-group">
                <label className="form-label">Bar/License Number *</label>
                <input className="form-input" value={form.barNumber} onChange={e => set('barNumber', e.target.value)} required={type === 'lawyer'} placeholder="BD-BAR-XXXXX" />
              </div>
              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input type="number" className="form-input" value={form.yearsOfExperience} onChange={e => set('yearsOfExperience', e.target.value)} placeholder="e.g. 10" min={0} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Consultation Fee (৳/session)</label>
              <input type="number" className="form-input" value={form.consultationFee} onChange={e => set('consultationFee', e.target.value)} placeholder="e.g. 2000" min={0} />
            </div>
            <div className="form-group">
              <label className="form-label">Professional Biography</label>
              <textarea className="form-input" value={form.biography} onChange={e => set('biography', e.target.value)} placeholder="Describe your expertise, achievements, and practice areas..." rows={3} />
            </div>
          </>
        )}

        <div className={styles.divider}><span>Security</span></div>
        <div className="form-group">
          <label className="form-label">Password *</label>
          <input type="password" className="form-input" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="Min. 8 characters" minLength={8} />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm Password *</label>
          <input type="password" className="form-input" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required placeholder="Repeat password" />
        </div>

        <label className={styles.termsCheck}>
          <input type="checkbox" checked={form.terms} onChange={e => set('terms', e.target.checked)} />
          <span>
            I agree to the{' '}
            <Link href="/terms" className={styles.link}>Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy" className={styles.link}>Privacy Policy</Link>
          </span>
        </label>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
          {loading ? 'Creating Account...' : type === 'lawyer' ? 'Submit Lawyer Application →' : 'Create Free Account →'}
        </button>
      </form>

      <p className={styles.loginLink}>
        Already have an account?{' '}
        <Link href="/login" className={styles.link}>Sign in</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <Suspense fallback={<div style={{ color: '#6B7280' }}>Loading...</div>}>
          <RegisterContent />
        </Suspense>
      </main>
    </>
  );
}

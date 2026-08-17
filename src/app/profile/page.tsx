'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase/client';
import styles from './page.module.css';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [lawyerData, setLawyerData] = useState<any>(null);
  const [practiceAreas, setPracticeAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Lawyer specific fields
  const [barNumber, setBarNumber] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState(1);
  const [consultationFee, setConsultationFee] = useState(1500);
  const [practiceAreaId, setPracticeAreaId] = useState('');

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Please select an image smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      setSuccessMsg('Photo selected! Click "Save Profile Changes" below to update your profile.');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // 1. Fetch practice areas for dropdown
        const { data: areas } = await supabase.from('practice_areas').select('*').order('name');
        if (isMounted && areas) setPracticeAreas(areas);

        // 2. Fetch User Profile
        const { data: prof, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (pError) console.warn('Profile fetch note:', pError.message);

        if (isMounted && prof) {
          setProfile(prof);
          setFirstName(prof.first_name || '');
          setLastName(prof.last_name || '');
          setPhone(prof.phone || '');
          setCity(prof.city || '');
          setAvatarUrl(prof.avatar_url || '');
        }

        // 3. If user is lawyer, fetch lawyer table details
        if (user.role?.toLowerCase() === 'lawyer') {
          const { data: lData } = await supabase
            .from('lawyers')
            .select('*, practice_areas(*)')
            .eq('id', user.id)
            .single();

          if (isMounted && lData) {
            setLawyerData(lData);
            setBarNumber(lData.bar_number || '');
            setBio(lData.bio || '');
            setYearsExperience(lData.years_experience || 1);
            setConsultationFee(lData.consultation_fee || 1500);
            setPracticeAreaId(lData.practice_area_id || '');
          }
        }
      } catch (err: any) {
        if (isMounted) setErrorMsg(err.message || 'Failed to load profile.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfileData();
    return () => { isMounted = false; };
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      if (!user) return;

      // 1. Update Profiles table
      const { error: pError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          city: city,
          avatar_url: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=111&color=fff`,
          email: user.email,
        });

      if (pError) throw pError;

      // 2. If Lawyer, update lawyers table
      if (user.role?.toLowerCase() === 'lawyer') {
        const { error: lError } = await supabase
          .from('lawyers')
          .upsert({
            id: user.id,
            bar_number: barNumber,
            bio: bio,
            years_experience: Number(yearsExperience),
            consultation_fee: Number(consultationFee),
            practice_area_id: practiceAreaId || null,
          });

        if (lError) throw lError;
      }

      setSuccessMsg('Your profile has been saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div style={{ textAlign: 'center', color: '#6B7280', padding: '5rem 0' }}>
            Loading your profile...
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const roleName = user?.role?.toUpperCase() || 'CLIENT';
  const roleBadgeClass = roleName === 'ADMIN' 
    ? styles.badgeAdmin 
    : roleName === 'LAWYER' 
      ? styles.badgeLawyer 
      : styles.badgeClient;

  const currentAvatar = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent((firstName || 'User') + ' ' + (lastName || ''))}&background=111&color=fff`;

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Account Profile</h1>
              <p className={styles.subtitle}>View and manage your personal credentials and account details.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {roleName === 'LAWYER' && (
                <Link href={`/lawyers/${user?.id}`} className="btn btn-secondary btn-sm">
                  View Public Profile ↗
                </Link>
              )}
              <Link 
                href={roleName === 'ADMIN' ? '/admin/dashboard' : roleName === 'LAWYER' ? '/lawyer/dashboard' : '/client/dashboard'} 
                className="btn btn-primary btn-sm"
              >
                Go to Dashboard →
              </Link>
            </div>
          </div>

          {successMsg && <div className={styles.alertSuccess}>✓ {successMsg}</div>}
          {errorMsg && <div className={styles.alertError}>⚠️ {errorMsg}</div>}

          <form onSubmit={handleSave} className={styles.profileCard}>
            {/* HIDDEN FILE INPUT */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              style={{ display: 'none' }}
            />

            {/* HERO OVERVIEW */}
            <div className={styles.heroRow}>
              <div
                className={styles.avatarBox}
                onClick={() => fileInputRef.current?.click()}
                title="Click to choose a new profile photo"
              >
                <img src={currentAvatar} alt="Profile Avatar" className={styles.avatarImg} />
                <div className={styles.avatarOverlay}>
                  <span>📷 Change</span>
                </div>
              </div>
              <div className={styles.heroInfo}>
                <div className={styles.name}>
                  {firstName} {lastName}
                  <span className={`${styles.badge} ${roleBadgeClass}`}>{roleName}</span>
                </div>
                <div className={styles.email}>✉️ {user?.email}</div>
                <div className={styles.metaRow}>
                  <span>📍 {city || 'Bangladesh'}</span>
                  <span>📱 {phone || 'No phone set'}</span>
                  {roleName === 'LAWYER' && lawyerData && (
                    <>
                      <span>⚖️ Bar: {lawyerData.bar_number || 'Pending'}</span>
                      <span>⭐ {Number(lawyerData.rating || 5.0).toFixed(1)} ({lawyerData.total_reviews || 0} reviews)</span>
                      <span>৳ {Number(lawyerData.consultation_fee || 1500).toLocaleString()} / session</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* GENERAL USER INFORMATION */}
            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Registered)</label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+880 1700-000000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City / Division</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dhaka, Chittagong, Sylhet"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Profile Picture</label>
                <div
                  className={styles.photoUploadBox}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📷</span>
                    <div>
                      <strong style={{ display: 'block', color: '#FFF', fontSize: '0.88rem' }}>Upload photo from device</strong>
                      <small style={{ color: '#888', fontSize: '0.75rem' }}>JPG, PNG, WEBP (Max 5MB)</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    Choose Photo
                  </button>
                </div>
                {avatarUrl && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: '#10B981' }}>✓ Photo selected</span>
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Remove photo
                    </button>
                  </div>
                )}
              </div>

              {/* LAWYER SPECIFIC SECTION */}
              {roleName === 'LAWYER' && (
                <>
                  <div className={styles.sectionHeading}>
                    ⚖️ Advocate & Practice Details
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bar Registration Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. BD-BAR-12345"
                      value={barNumber}
                      onChange={e => setBarNumber(e.target.value)}
                      required={roleName === 'LAWYER'}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Primary Practice Area *</label>
                    <select
                      className="form-input"
                      value={practiceAreaId}
                      onChange={e => setPracticeAreaId(e.target.value)}
                      required={roleName === 'LAWYER'}
                    >
                      <option value="">Select Specialization...</option>
                      {practiceAreas.map(area => (
                        <option key={area.id} value={area.id}>
                          {area.icon} {area.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Years of Experience</label>
                    <input
                      type="number"
                      className="form-input"
                      min={0}
                      max={60}
                      value={yearsExperience}
                      onChange={e => setYearsExperience(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Consultation Fee (৳ BDT per session)</label>
                    <input
                      type="number"
                      className="form-input"
                      min={500}
                      step={100}
                      value={consultationFee}
                      onChange={e => setConsultationFee(Number(e.target.value))}
                    />
                  </div>

                  <div className={`form-group ${styles.fullWidth}`}>
                    <label className="form-label">Professional Biography & Chamber Information</label>
                    <textarea
                      className="form-input"
                      rows={4}
                      placeholder="Describe your legal experience, court practice, chambers, and areas of excellence..."
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className={styles.actions}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ minWidth: '160px' }}
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

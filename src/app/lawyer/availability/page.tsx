'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase/client';

export default function LawyerAvailabilityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [days, setDays] = useState([
    { day: 'Sunday', active: true, slots: ['09:00 AM', '10:30 AM', '02:30 PM', '04:00 PM'] },
    { day: 'Monday', active: true, slots: ['09:00 AM', '10:30 AM', '02:30 PM', '04:00 PM'] },
    { day: 'Tuesday', active: true, slots: ['09:00 AM', '10:30 AM', '02:30 PM', '04:00 PM'] },
    { day: 'Wednesday', active: true, slots: ['09:00 AM', '10:30 AM', '02:30 PM', '04:00 PM'] },
    { day: 'Thursday', active: true, slots: ['09:00 AM', '10:30 AM', '02:30 PM', '04:00 PM'] },
    { day: 'Friday', active: false, slots: ['03:00 PM', '05:00 PM'] },
    { day: 'Saturday', active: true, slots: ['10:00 AM', '11:30 AM', '03:00 PM'] },
  ]);

  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/lawyer/availability');
    }
  }, [user, authLoading, router]);

  const toggleDay = (idx: number) => {
    setDays(prev => prev.map((d, i) => i === idx ? { ...d, active: !d.active } : d));
  };

  const handleSave = () => {
    setSavedMsg('Availability schedule updated successfully!');
    setTimeout(() => setSavedMsg(''), 4000);
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '100px 1.5rem 5rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-gold" style={{ marginBottom: '0.5rem' }}>Schedule Settings</span>
              <h1 className="font-serif" style={{ fontSize: '2rem', color: '#FFF', marginBottom: '0.35rem' }}>
                Manage Consultation Availability
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
                Set the days and time slots when clients can book virtual and chamber consultations.
              </p>
            </div>
            <button onClick={handleSave} className="btn btn-primary">
              Save Schedule Changes
            </button>
          </div>

          {savedMsg && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              âœ“ {savedMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {days.map((d, idx) => (
              <div
                key={d.day}
                className="card"
                style={{
                  padding: '1.5rem',
                  border: `1px solid ${d.active ? '#333' : '#1E1E1E'}`,
                  background: d.active ? '#121212' : '#0D0D0D',
                  opacity: d.active ? 1 : 0.6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="checkbox"
                      checked={d.active}
                      onChange={() => toggleDay(idx)}
                      style={{ transform: 'scale(1.3)', cursor: 'pointer' }}
                    />
                    <strong style={{ color: '#FFF', fontSize: '1.1rem' }}>{d.day}</strong>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: d.active ? '#10B981' : '#666' }}>
                    {d.active ? 'â— AVAILABLE' : 'â—‹ CLOSED'}
                  </span>
                </div>

                {d.active && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {d.slots.map(s => (
                      <span
                        key={s}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: '#1C1C1C',
                          border: '1px solid #333',
                          borderRadius: '8px',
                          color: '#FFF',
                          fontSize: '0.85rem',
                        }}
                      >
                        ðŸ•’ {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

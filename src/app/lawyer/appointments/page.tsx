'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase/client';

export default function LawyerAppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/lawyer/appointments');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadLawyerApts = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, profiles(*)')
          .eq('lawyer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAppointments(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadLawyerApts();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await supabase.from('bookings').update({ status }).eq('id', id);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '100px 1.5rem 5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-gold" style={{ marginBottom: '0.5rem' }}>Advocate Console</span>
              <h1 className="font-serif" style={{ fontSize: '2rem', color: '#FFF', marginBottom: '0.35rem' }}>
                Client Appointments & Consultations
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
                Manage upcoming legal hearings, virtual sessions, and chamber consults.
              </p>
            </div>
            <Link href="/lawyer/availability" className="btn btn-primary">
              ⚙️ Manage Availability Slots
            </Link>
          </div>

          <div className="card" style={{ padding: '1.5rem', border: '1px solid #222' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                No client bookings scheduled yet. Make sure your availability slots are set.
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Token Pass</th>
                      <th>Client Name</th>
                      <th>Case Description</th>
                      <th>Consultation Type</th>
                      <th>Fee</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(apt => {
                      const clientName = apt.profiles ? `${apt.profiles.first_name} ${apt.profiles.last_name}` : 'Client';
                      return (
                        <tr key={apt.id}>
                          <td>
                            <strong style={{ fontFamily: 'monospace', color: '#FFF' }}>
                              {apt.consultation_token || 'PENDING'}
                            </strong>
                          </td>
                          <td>
                            <strong style={{ color: '#FFF', display: 'block' }}>{clientName}</strong>
                            <small style={{ color: '#666' }}>{apt.profiles?.city || 'Bangladesh'}</small>
                          </td>
                          <td>
                            <span style={{ color: '#AAA', fontSize: '0.85rem' }}>{apt.case_title || apt.case_description || 'General Advice'}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', background: '#1A1A1A', padding: '0.2rem 0.5rem', borderRadius: '6px', color: '#CCC' }}>
                              {apt.consultation_type || 'VIDEO'}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: '#FFF' }}>৳ {Number(apt.amount || 1500).toLocaleString()}</strong>
                          </td>
                          <td>
                            <span className={`badge ${apt.status === 'confirmed' ? 'badge-success' : apt.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                              {apt.status?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {apt.status === 'pending' && (
                              <button onClick={() => updateStatus(apt.id, 'confirmed')} className="btn btn-primary btn-sm">
                                Accept
                              </button>
                            )}
                            {apt.status === 'confirmed' && (
                              <button onClick={() => updateStatus(apt.id, 'completed')} className="btn btn-secondary btn-sm">
                                Mark Completed
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

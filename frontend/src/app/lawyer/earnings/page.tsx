'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase/client';

export default function LawyerEarningsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/lawyer/earnings');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadEarnings = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, profiles(*)')
          .eq('lawyer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadEarnings();
  }, [user]);

  const totalEarnings = bookings.reduce((sum, b) => {
    if (b.status === 'confirmed' || b.status === 'completed') return sum + Number(b.amount || 1500);
    return sum;
  }, 0);

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '100px 1.5rem 5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-gold" style={{ marginBottom: '0.5rem' }}>Financial Overview</span>
              <h1 className="font-serif" style={{ fontSize: '2rem', color: '#FFF', marginBottom: '0.35rem' }}>
                Consultation Earnings & Payouts
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
                Track your consultation income, chamber fee distributions, and bank transfers.
              </p>
            </div>
            <button onClick={() => alert('Payout request submitted to platform administrator.')} className="btn btn-primary">
              💳 Request Payout
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <span style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Gross Revenue</span>
              <strong style={{ display: 'block', fontSize: '1.75rem', color: '#FFF', marginTop: '0.25rem' }}>
                ৳ {totalEarnings.toLocaleString()} BDT
              </strong>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <span style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Completed Sessions</span>
              <strong style={{ display: 'block', fontSize: '1.75rem', color: '#10B981', marginTop: '0.25rem' }}>
                {bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length} Paid
              </strong>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <span style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Available for Payout</span>
              <strong style={{ display: 'block', fontSize: '1.75rem', color: '#FFF', marginTop: '0.25rem' }}>
                ৳ {(totalEarnings * 0.9).toLocaleString()} BDT
              </strong>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', border: '1px solid #222' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Loading earnings history...</div>
            ) : bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                No completed client consultations yet.
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Client Name</th>
                      <th>Date</th>
                      <th>Gross Amount</th>
                      <th>Net Payout (90%)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => {
                      const clientName = b.profiles ? `${b.profiles.first_name} ${b.profiles.last_name}` : 'Client';
                      const fee = Number(b.amount || 1500);
                      return (
                        <tr key={b.id}>
                          <td>
                            <strong style={{ fontFamily: 'monospace', color: '#FFF' }}>{b.consultation_token || 'PENDING'}</strong>
                          </td>
                          <td>
                            <strong style={{ color: '#FFF' }}>{clientName}</strong>
                          </td>
                          <td style={{ color: '#888', fontSize: '0.85rem' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                          <td>
                            <strong style={{ color: '#FFF' }}>৳ {fee.toLocaleString()}</strong>
                          </td>
                          <td>
                            <strong style={{ color: '#10B981' }}>৳ {(fee * 0.9).toLocaleString()}</strong>
                          </td>
                          <td>
                            <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : b.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                              {b.status === 'confirmed' ? 'PAID' : b.status?.toUpperCase()}
                            </span>
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

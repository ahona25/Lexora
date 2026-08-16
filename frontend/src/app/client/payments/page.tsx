'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase/client';

export default function ClientPaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/client/payments');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadPayments = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, lawyers(*, profiles(*))')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, [user]);

  const totalSpent = bookings.reduce((sum, b) => {
    if (b.status === 'confirmed') return sum + Number(b.amount || 1500);
    if (b.status === 'cancelled') return sum + Number(b.cancellation_fee || 375);
    return sum;
  }, 0);

  const totalRefunded = bookings.reduce((sum, b) => {
    if (b.status === 'cancelled') return sum + Number(b.refund_amount || 1125);
    return sum;
  }, 0);

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '100px 1.5rem 5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <span className="badge badge-gold" style={{ marginBottom: '0.5rem' }}>Financial Ledger</span>
            <h1 className="font-serif" style={{ fontSize: '2rem', color: '#FFF', marginBottom: '0.35rem' }}>
              Payment History & Receipts
            </h1>
            <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
              Track all legal consultation transactions, card/wallet charges, and refund receipts.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <span style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Net Paid</span>
              <strong style={{ display: 'block', fontSize: '1.75rem', color: '#FFF', marginTop: '0.25rem' }}>
                ৳ {totalSpent.toLocaleString()} BDT
              </strong>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <span style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Refunded (75%)</span>
              <strong style={{ display: 'block', fontSize: '1.75rem', color: '#10B981', marginTop: '0.25rem' }}>
                ৳ {totalRefunded.toLocaleString()} BDT
              </strong>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <span style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Security Protocol</span>
              <strong style={{ display: 'block', fontSize: '1.75rem', color: '#FFF', marginTop: '0.25rem' }}>
                SSL / PCI-DSS
              </strong>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid #222' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#666' }}>Loading transaction history...</div>
            ) : bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#666' }}>
                No payments or consultations on record yet.
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Transaction ID / Token</th>
                      <th>Advocate / Consultation</th>
                      <th>Payment Method</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => {
                      const lawyerName = b.lawyers?.profiles 
                        ? `${b.lawyers.profiles.first_name} ${b.lawyers.profiles.last_name}` 
                        : 'Advocate';
                      const fee = Number(b.amount || 1500);

                      return (
                        <tr key={b.id}>
                          <td>
                            <strong style={{ fontFamily: 'monospace', color: '#FFF', fontSize: '0.85rem' }}>
                              {b.consultation_token || b.id.slice(0, 8).toUpperCase()}
                            </strong>
                            <small style={{ display: 'block', color: '#666', fontSize: '0.72rem' }}>
                              {new Date(b.created_at).toLocaleDateString()}
                            </small>
                          </td>
                          <td>
                            <span style={{ color: '#FFF', fontWeight: 600 }}>{lawyerName}</span>
                            <small style={{ display: 'block', color: '#888' }}>{b.case_title || 'Legal Consultation'}</small>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', background: '#1A1A1A', padding: '0.2rem 0.5rem', borderRadius: '6px', color: '#CCC' }}>
                              {b.payment_method || 'CARD / BKASH'}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: '#FFF' }}>৳ {fee.toLocaleString()}</strong>
                            {b.status === 'cancelled' && (
                              <small style={{ display: 'block', color: '#10B981', fontSize: '0.75rem' }}>
                                Refunded: ৳{Number(b.refund_amount || (fee * 0.75)).toLocaleString()}
                              </small>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${
                              b.status === 'confirmed' 
                                ? 'badge-success' 
                                : b.status === 'cancelled' 
                                  ? 'badge-danger' 
                                  : 'badge-warning'
                            }`}>
                              {b.status === 'confirmed' ? 'PAID' : b.status?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <Link href={`/payments/checkout?appointmentId=${b.id}`} className="btn btn-secondary btn-sm">
                              View Receipt ↗
                            </Link>
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

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase/client';
import styles from '../dashboard/page.module.css';

export default function ClientAppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedCancelApt, setSelectedCancelApt] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/client/appointments');
    }
  }, [user, authLoading, router]);

  const loadAppointments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, lawyers(*, profiles(*), practice_areas(*))')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const handleCancel = async () => {
    if (!selectedCancelApt) return;
    setCancelling(true);
    try {
      const amount = Number(selectedCancelApt.amount || selectedCancelApt.lawyers?.consultation_fee || 1500);
      const cancellationFee = amount * 0.25;
      const refundAmount = amount * 0.75;

      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_fee: cancellationFee,
          refund_amount: refundAmount,
        })
        .eq('id', selectedCancelApt.id);

      if (error) throw error;

      // Add notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Appointment Cancelled',
        message: `Your booking for ${selectedCancelApt.lawyers?.profiles?.first_name || 'Advocate'} has been cancelled. 75% (৳${refundAmount.toLocaleString()}) has been refunded.`,
        type: 'cancellation'
      });

      setSelectedCancelApt(null);
      await loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const filteredList = appointments.filter(a => {
    if (filter === 'ALL') return true;
    return a.status?.toUpperCase() === filter;
  });

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '100px 1.5rem 5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-gold" style={{ marginBottom: '0.5rem' }}>Client Portal</span>
              <h1 className="font-serif" style={{ fontSize: '2rem', color: '#FFF', marginBottom: '0.35rem' }}>
                My Consultations & Appointments
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
                Track your active legal sessions, consultation tokens, and refund receipts.
              </p>
            </div>
            <Link href="/find-lawyer" className="btn btn-primary">
              + Book New Lawyer
            </Link>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `All (${appointments.length})` },
              { id: 'CONFIRMED', label: `Confirmed (${appointments.filter(a => a.status === 'confirmed').length})` },
              { id: 'PENDING', label: `Pending Payment (${appointments.filter(a => a.status === 'pending').length})` },
              { id: 'CANCELLED', label: `Cancelled (${appointments.filter(a => a.status === 'cancelled').length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  border: `1px solid ${filter === tab.id ? '#FFF' : '#222'}`,
                  background: filter === tab.id ? '#FFF' : '#111',
                  color: filter === tab.id ? '#000' : '#888',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Appointments Table Card */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid #222' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6B7280' }}>
                Loading your appointments...
              </div>
            ) : filteredList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                <h3 style={{ color: '#FFF', fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Consultations Found</h3>
                <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  {filter === 'ALL' ? "You haven't booked any lawyer consultations yet." : `No ${filter.toLowerCase()} appointments found.`}
                </p>
                <Link href="/find-lawyer" className="btn btn-primary btn-sm">
                  Find a Verified Advocate →
                </Link>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Consultation Token</th>
                      <th>Advocate</th>
                      <th>Specialization</th>
                      <th>Type</th>
                      <th>Fee</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map(apt => {
                      const lawyer = apt.lawyers;
                      const lawyerName = lawyer?.profiles 
                        ? `${lawyer.profiles.first_name} ${lawyer.profiles.last_name}` 
                        : 'Advocate';
                      const specName = lawyer?.practice_areas?.name || 'General Practice';
                      const fee = apt.amount || lawyer?.consultation_fee || 1500;

                      return (
                        <tr key={apt.id}>
                          <td>
                            {apt.consultation_token ? (
                              <span style={{
                                fontFamily: 'monospace',
                                background: '#000',
                                border: '1px solid #333',
                                padding: '0.3rem 0.6rem',
                                borderRadius: '6px',
                                color: '#FFF',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                letterSpacing: '0.05em'
                              }}>
                                {apt.consultation_token}
                              </span>
                            ) : (
                              <span style={{ color: '#666', fontSize: '0.8rem' }}>Pending Payment</span>
                            )}
                          </td>
                          <td>
                            <strong style={{ color: '#FFF', display: 'block' }}>{lawyerName}</strong>
                            <small style={{ color: '#666' }}>{apt.case_title || 'Legal Advice'}</small>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', color: '#BBB' }}>{specName}</span>
                          </td>
                          <td>
                            <span className={styles.typeTag}>{apt.consultation_type || 'VIDEO'}</span>
                          </td>
                          <td>
                            <strong style={{ color: '#FFF' }}>৳ {Number(fee).toLocaleString()}</strong>
                          </td>
                          <td>
                            <span className={`badge ${
                              apt.status === 'confirmed' 
                                ? 'badge-success' 
                                : apt.status === 'cancelled' 
                                  ? 'badge-danger' 
                                  : 'badge-warning'
                            }`}>
                              {apt.status?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {apt.status === 'confirmed' && (
                                <>
                                  <Link href={`/payments/checkout?appointmentId=${apt.id}`} className="btn btn-secondary btn-sm">
                                    Token Pass
                                  </Link>
                                  <button
                                    onClick={() => setSelectedCancelApt(apt)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ color: '#EF4444', borderColor: '#442222' }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {apt.status === 'pending' && (
                                <Link href={`/payments/checkout?appointmentId=${apt.id}`} className="btn btn-primary btn-sm">
                                  Pay Now →
                                </Link>
                              )}
                              {apt.status === 'cancelled' && (
                                <span style={{ fontSize: '0.75rem', color: '#10B981' }}>
                                  Refunded: ৳{Number(apt.refund_amount || (fee * 0.75)).toLocaleString()}
                                </span>
                              )}
                            </div>
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

      {/* CANCELLATION MODAL */}
      {selectedCancelApt && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', border: '1px solid #442222', background: '#121212' }}>
            <h2 className="font-serif" style={{ fontSize: '1.4rem', color: '#FFF', marginBottom: '0.5rem' }}>
              Confirm Cancellation?
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              25% cancellation charge applies, and 75% will be refunded immediately:
            </p>

            {(() => {
              const amount = Number(selectedCancelApt.amount || selectedCancelApt.lawyers?.consultation_fee || 1500);
              return (
                <div style={{ background: '#1A1A1A', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#888' }}>Total Paid</span>
                    <span style={{ color: '#FFF' }}>৳ {amount.toLocaleString()} BDT</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#EF4444' }}>
                    <span>25% Cancellation Fee</span>
                    <strong>- ৳ {(amount * 0.25).toLocaleString()} BDT</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '0.5rem', color: '#10B981' }}>
                    <span>75% Refund Amount</span>
                    <strong style={{ fontSize: '1.15rem' }}>৳ {(amount * 0.75).toLocaleString()} BDT</strong>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSelectedCancelApt(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={cancelling}
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-primary"
                style={{ flex: 1, background: '#EF4444', color: '#FFF' }}
                disabled={cancelling}
              >
                {cancelling ? 'Processing...' : 'Confirm (Cancel & Refund)'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

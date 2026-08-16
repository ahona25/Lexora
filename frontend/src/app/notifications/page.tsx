'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase/client';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/notifications');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch user's bookings to generate real live activity notifications
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*, lawyers(*, profiles(*))')
          .or(`client_id.eq.${user.id},lawyer_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        const dynamicNotifs: any[] = [];

        bookings?.forEach(b => {
          const lName = b.lawyers?.profiles ? `${b.lawyers.profiles.first_name} ${b.lawyers.profiles.last_name}` : 'Advocate';
          
          if (b.status === 'confirmed') {
            dynamicNotifs.push({
              id: 'notif-conf-' + b.id,
              title: 'Consultation Confirmed & Token Issued',
              message: `Your appointment with Advocate ${lName} is verified. Token Pass: ${b.consultation_token || 'LEX-TK-ONLINE'}.`,
              type: 'booking',
              icon: '🏛️',
              date: new Date(b.created_at).toLocaleDateString(),
              link: `/payments/checkout?appointmentId=${b.id}`,
              isRead: false
            });
          } else if (b.status === 'cancelled') {
            dynamicNotifs.push({
              id: 'notif-canc-' + b.id,
              title: 'Consultation Cancelled & Refund Initiated',
              message: `Appointment cancelled. 25% administrative fee (৳${Number(b.cancellation_fee || 375).toLocaleString()}) applied. 75% refund (৳${Number(b.refund_amount || 1125).toLocaleString()}) has been sent.`,
              type: 'cancellation',
              icon: '🔄',
              date: new Date(b.created_at).toLocaleDateString(),
              link: `/client/payments`,
              isRead: true
            });
          } else {
            dynamicNotifs.push({
              id: 'notif-pend-' + b.id,
              title: 'Awaiting Consultation Payment',
              message: `Slot booked for Advocate ${lName}. Complete payment to issue your official consultation token pass.`,
              type: 'payment',
              icon: '💳',
              date: new Date(b.created_at).toLocaleDateString(),
              link: `/payments/checkout?appointmentId=${b.id}`,
              isRead: false
            });
          }
        });

        // Add welcome notification
        dynamicNotifs.push({
          id: 'notif-welcome',
          title: 'Welcome to Lexora Legal Network',
          message: 'Your account is connected to Bangladesh’s Supreme Court advocates and verified practitioners.',
          type: 'system',
          icon: '⚖️',
          date: 'Account Active',
          link: '/find-lawyer',
          isRead: true
        });

        setNotifications(dynamicNotifs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '100px 1.5rem 5rem' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-gold" style={{ marginBottom: '0.5rem' }}>Activity Feed</span>
              <h1 className="font-serif" style={{ fontSize: '2rem', color: '#FFF', marginBottom: '0.35rem' }}>
                Notifications & Alerts
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
                Live updates regarding your bookings, token passes, payments, and advocate replies.
              </p>
            </div>
            {notifications.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={markAllRead} className="btn btn-secondary btn-sm">
                  ✓ Mark all as read
                </button>
                <button onClick={clearNotifications} className="btn btn-secondary btn-sm" style={{ color: '#EF4444' }}>
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
                <h3 style={{ color: '#FFF', fontSize: '1.2rem', marginBottom: '0.5rem' }}>No New Notifications</h3>
                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                  You are all caught up! When consultations are booked, tokens issued, or messages received, they will show up here.
                </p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className="card"
                  style={{
                    padding: '1.25rem 1.5rem',
                    border: `1px solid ${n.isRead ? '#222' : '#444'}`,
                    background: n.isRead ? '#111' : '#161616',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1.25rem',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '2rem', flexShrink: 0 }}>
                    {n.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ color: '#FFF', fontSize: '0.95rem' }}>{n.title}</strong>
                      <small style={{ color: '#666', fontSize: '0.75rem' }}>{n.date}</small>
                    </div>
                    <p style={{ color: '#9CA3AF', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                      {n.message}
                    </p>
                    {n.link && (
                      <Link href={n.link} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem' }}>
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase/client';
import styles from './page.module.css';

const SIDEBAR_LINKS = [
  { href: '/client/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/profile', icon: '👤', label: 'My Profile' },
  { href: '/find-lawyer', icon: '🔍', label: 'Find Lawyer' },
  { href: '/client/appointments', icon: '📅', label: 'Appointments' },
  { href: '/client/messages', icon: '💬', label: 'Messages' },
  { href: '/client/documents', icon: '📁', label: 'Documents' },
  { href: '/client/payments', icon: '💳', label: 'Payments' },
  { href: '/notifications', icon: '🔔', label: 'Notifications' },
];

export default function ClientDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role?.toLowerCase() !== 'client')) {
      router.push('/login?redirect=/client/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      const load = async () => {
        try {
          const { data, error } = await supabase
            .from('bookings')
            .select('*, lawyers(*, profiles(*), practice_areas(*))')
            .eq('client_id', user.id)
            .order('created_at', { ascending: false });

          if (error) console.warn('Dashboard bookings note:', error.message);
          if (isMounted) {
            setAppointments(data || []);
            setLoading(false);
          }
        } catch (err) {
          console.error(err);
        }
      };
      load();
    }
    return () => { isMounted = false; };
  }, [user]);

  if (authLoading) return <div className={styles.loading}>Loading...</div>;
  if (!user) return null;

  const upcoming = appointments.filter(a => ['confirmed', 'pending', 'awaiting_payment'].includes(a.status?.toLowerCase()));
  const completed = appointments.filter(a => a.status?.toLowerCase() === 'completed');
  const paid = appointments.filter(a => a.status?.toLowerCase() === 'confirmed' || Boolean(a.consultation_token));
  const reviewsCount = appointments.filter(a => a.review || a.rating).length;
  const recent = appointments.slice(0, 5);

  return (
    <div className={styles.dashboardLayout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logoLink}>
            Lex<span className={styles.logoAccent}>ora</span>
          </Link>
          <button className={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>✖</button>
        </div>

        <div className={styles.sidebarUser}>
          <div className={styles.sidebarAvatar} style={{ overflow: 'hidden', padding: 0 }}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              (user?.first_name?.[0] || user?.profile?.firstName?.[0] || 'C').toUpperCase()
            )}
          </div>
          <div>
            <strong>{user?.first_name || user?.profile?.firstName || 'Client'} {user?.last_name || user?.profile?.lastName || ''}</strong>
            <span>Client Account</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {SIDEBAR_LINKS.map(link => (
            <Link key={link.href} href={link.href} className={styles.sidebarLink}>
              <span className={styles.sidebarIcon}>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={() => { logout(); router.push('/'); }}>
          🚪 Sign Out
        </button>
      </aside>

      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>☰</button>
          <h1 className={styles.pageTitle}>Client Dashboard</h1>
          <Link href="/notifications" className={styles.notifBtn}>🔔</Link>
        </header>

        <div className={styles.dashContent}>
          {/* Welcome */}
          <div className={styles.welcomeBanner}>
            <div>
              <h2>Welcome back, {user?.first_name || user?.profile?.firstName || 'Client'}! 👋</h2>
              <p>Manage your legal consultations and upcoming appointments.</p>
            </div>
            <Link href="/find-lawyer" className="btn btn-primary">
              Find a Lawyer →
            </Link>
          </div>

          {/* Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>📅</span>
              <div>
                <strong>{upcoming.length}</strong>
                <span>Upcoming</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>✅</span>
              <div>
                <strong>{completed.length}</strong>
                <span>Completed</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>💳</span>
              <div>
                <strong>{paid.length}</strong>
                <span>Paid</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>⭐</span>
              <div>
                <strong>{reviewsCount}</strong>
                <span>Reviews Given</span>
              </div>
            </div>
          </div>

          {/* Upcoming Appointment */}
          {upcoming.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🕒 Upcoming Appointment</h3>
              {upcoming.slice(0, 1).map(apt => {
                const lName = apt.lawyers?.profiles ? `${apt.lawyers.profiles.first_name} ${apt.lawyers.profiles.last_name}` : 'Advocate';
                return (
                  <div key={apt.id} className={styles.upcomingCard}>
                    <div className={styles.upcomingLeft}>
                      <div className={styles.upcomingDate}>
                        <strong>{new Date(apt.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</strong>
                        <span>Confirmed</span>
                      </div>
                      <div>
                        <h4>{lName}</h4>
                        <p>{apt.case_title || 'Legal Consultation'}</p>
                        {apt.consultation_token && (
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#222', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#FFF' }}>
                            Token: {apt.consultation_token}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.upcomingRight}>
                      <span className={`badge ${apt.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>{apt.status.toUpperCase()}</span>
                      <span className={styles.consultType}>{apt.consultation_type}</span>
                      <Link href={`/payments/checkout?appointmentId=${apt.id}`} className="btn btn-secondary btn-sm">
                        View Token / Cancel
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent Appointments */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>📋 Recent Appointments</h3>
              <Link href="/find-lawyer" className={styles.viewAll}>Book Lawyer →</Link>
            </div>
            {loading ? (
              <div className={styles.tableLoading}>Loading appointments...</div>
            ) : recent.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-title">No Appointments Yet</div>
                <p>You haven't booked any legal consultations yet.</p>
                <Link href="/find-lawyer" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Find a Lawyer
                </Link>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Token / ID</th>
                      <th>Lawyer</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(apt => {
                      const lName = apt.lawyers?.profiles ? `${apt.lawyers.profiles.first_name} ${apt.lawyers.profiles.last_name}` : 'Advocate';
                      const fee = apt.amount || apt.lawyers?.consultation_fee || 1500;
                      return (
                        <tr key={apt.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#FFFFFF' }}>
                            {apt.consultation_token || apt.id.slice(0, 8)}
                          </td>
                          <td>{lName}</td>
                          <td>
                            <span className={styles.typeTag}>{apt.consultation_type}</span>
                          </td>
                          <td style={{ color: '#FFFFFF' }}>৳ {Number(fee).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${apt.status === 'confirmed' ? 'badge-success' : apt.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                              {apt.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <Link href={`/payments/checkout?appointmentId=${apt.id}`} className="btn btn-secondary btn-sm">
                              {apt.status === 'confirmed' ? 'Token & Pass' : 'View'}
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

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <h3 className={styles.sectionTitle}>⚡ Quick Actions</h3>
            <div className={styles.actionsGrid}>
              <Link href="/find-lawyer" className={styles.actionCard}>
                <span>🔍</span>
                <strong>Find a Lawyer</strong>
                <small>Browse verified lawyers</small>
              </Link>
              <Link href="/client/appointments" className={styles.actionCard}>
                <span>📅</span>
                <strong>My Appointments</strong>
                <small>View & manage bookings</small>
              </Link>
              <Link href="/client/documents" className={styles.actionCard}>
                <span>📁</span>
                <strong>Documents</strong>
                <small>Upload & manage files</small>
              </Link>
              <Link href="/client/payments" className={styles.actionCard}>
                <span>💳</span>
                <strong>Payment History</strong>
                <small>Invoices & receipts</small>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    CONFIRMED: 'badge-success',
    COMPLETED: 'badge-success',
    AWAITING_PAYMENT: 'badge-warning',
    PENDING: 'badge-warning',
    CANCELLED: 'badge-danger',
    REJECTED: 'badge-danger',
    IN_PROGRESS: 'badge-info',
  };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status?.replace(/_/g, ' ')}</span>;
}

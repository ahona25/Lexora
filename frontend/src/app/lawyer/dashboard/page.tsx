'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase/client';
import styles from '../../client/dashboard/page.module.css'; // Reuse base styles
import lawyerStyles from './page.module.css';

const SIDEBAR_LINKS = [
  { href: '/lawyer/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/profile', icon: '👤', label: 'My Profile' },
  { href: '/lawyer/appointments', icon: '📅', label: 'Appointments' },
  { href: '/lawyer/availability', icon: '🕒', label: 'Availability' },
  { href: '/client/messages', icon: '💬', label: 'Messages' },
  { href: '/lawyer/earnings', icon: '💰', label: 'Earnings' },
  { href: '/notifications', icon: '🔔', label: 'Notifications' },
];

export default function LawyerDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'lawyer')) {
      router.push('/login?redirect=/lawyer/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    let isMounted = true;
    if (user && user.role === 'lawyer') {
      const loadLawyerBookings = async () => {
        try {
          const { data } = await supabase
            .from('bookings')
            .select('*, profiles!bookings_client_id_fkey(*)')
            .eq('lawyer_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
          if (isMounted) setAppointments(data || []);
        } catch (err) {
          console.error(err);
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      loadLawyerBookings();
    }
    return () => { isMounted = false; };
  }, [user]);

  if (authLoading) return <div className={styles.loading}>Loading...</div>;
  if (!user || user.role !== 'lawyer') return null;

  const profile = user.profile;
  const isVerified = profile?.verificationStatus === 'APPROVED';
  const upcoming = appointments.filter(a => a.status === 'CONFIRMED');
  const pending = appointments.filter(a => a.status === 'AWAITING_PAYMENT' || a.status === 'PENDING');

  return (
    <div className={styles.dashboardLayout}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logoLink}>
            Lex<span className={styles.logoAccent}>ora</span>
          </Link>
          <button className={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>✖</button>
        </div>

        <div className={styles.sidebarUser}>
          <div className={styles.sidebarAvatar} style={{ overflow: 'hidden', padding: 0 }}>
            {user?.avatar_url || profile?.avatarUrl ? (
              <img src={user?.avatar_url || profile?.avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              (user?.first_name?.[0] || profile?.firstName?.[0] || 'L').toUpperCase()
            )}
          </div>
          <div>
            <strong>{user?.first_name || profile?.firstName} {user?.last_name || profile?.lastName}</strong>
            <span className={isVerified ? lawyerStyles.verifiedTag : lawyerStyles.pendingTag}>
              {isVerified ? '✓ Verified' : '⏳ Pending'}
            </span>
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

      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>☰</button>
          <h1 className={styles.pageTitle}>Lawyer Dashboard</h1>
          <Link href="/notifications" className={styles.notifBtn}>🔔</Link>
        </header>

        <div className={styles.dashContent}>
          {/* Verification Banner */}
          {!isVerified && (
            <div className={lawyerStyles.verificationBanner}>
              <span>⏳</span>
              <div>
                <strong>Account Pending Verification</strong>
                <p>Your profile is under review by our legal team (24-48 hours). You'll be notified once approved and your profile becomes publicly bookable.</p>
              </div>
            </div>
          )}

          {/* Welcome */}
          <div className={styles.welcomeBanner}>
            <div>
              <h2>Welcome, {profile?.firstName}! </h2>
              <p>{profile?.professionalTitle} · {profile?.yearsOfExperience} years experience</p>
            </div>
            <div className={lawyerStyles.earningsWidget}>
              <span>Total Earnings</span>
              <strong>৳ {Number(profile?.totalEarnings || 0).toLocaleString()}</strong>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>📅</span>
              <div>
                <strong>{upcoming.length}</strong>
                <span>Confirmed</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>⏳</span>
              <div>
                <strong>{pending.length}</strong>
                <span>Pending</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>✅</span>
              <div>
                <strong>{profile?.totalConsultations || 0}</strong>
                <span>Completed</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>⭐</span>
              <div>
                <strong>{Number(profile?.averageRating || 0).toFixed(1)}</strong>
                <span>{profile?.totalReviews || 0} Reviews</span>
              </div>
            </div>
          </div>

          {/* Recent Appointments */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>📋 Recent Appointments</h3>
              <Link href="/lawyer/appointments" className={styles.viewAll}>View All →</Link>
            </div>
            {loading ? (
              <div className={styles.tableLoading}>Loading...</div>
            ) : appointments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-title">No Appointments Yet</div>
                <p>Once your profile is verified and clients book consultations, they'll appear here.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Apt. Number</th>
                      <th>Client</th>
                      <th>Date & Time</th>
                      <th>Type</th>
                      <th>Fee</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.slice(0, 8).map(apt => (
                      <tr key={apt.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#FFFFFF' }}>{apt.appointmentNumber}</td>
                        <td>{apt.clientProfile?.firstName} {apt.clientProfile?.lastName}</td>
                        <td>{new Date(apt.appointmentDate).toLocaleDateString()} {apt.startTime}</td>
                        <td><span className={styles.typeTag}>{apt.consultationType}</span></td>
                        <td style={{ color: '#FFFFFF' }}>৳ {Number(apt.consultationFee).toLocaleString()}</td>
                        <td>
                          <span className={`badge ${apt.status === 'COMPLETED' ? 'badge-success' : apt.status === 'CONFIRMED' ? 'badge-success' : apt.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`}>
                            {apt.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <h3 className={styles.sectionTitle}>⚡ Quick Actions</h3>
            <div className={styles.actionsGrid}>
              <Link href="/lawyer/availability" className={styles.actionCard}>
                <span>🕒</span>
                <strong>Manage Availability</strong>
                <small>Set schedule & slots</small>
              </Link>
              <Link href="/lawyer/appointments" className={styles.actionCard}>
                <span>📅</span>
                <strong>Appointments</strong>
                <small>View client bookings</small>
              </Link>
              <Link href="/lawyer/earnings" className={styles.actionCard}>
                <span>💰</span>
                <strong>Earnings</strong>
                <small>Track your income</small>
              </Link>
              <Link href="/notifications" className={styles.actionCard}>
                <span>🔔</span>
                <strong>Notifications</strong>
                <small>Messages & alerts</small>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

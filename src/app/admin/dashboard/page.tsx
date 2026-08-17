'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase/client';
import styles from '../../client/dashboard/page.module.css';

const SIDEBAR_LINKS = [
  { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/admin/lawyers', icon: '⚖️', label: 'Lawyer Verification' },
  { href: '/admin/users', icon: '👥', label: 'User Management' },
  { href: '/admin/appointments', icon: '📅', label: 'Appointments' },
  { href: '/admin/payments', icon: '💳', label: 'Payments & Revenue' },
  { href: '/admin/reviews', icon: '⭐', label: 'Review Moderation' },
  { href: '/notifications', icon: '🔔', label: 'Notifications' },
];

export default function AdminDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [pendingLawyers, setPendingLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login?redirect=/admin/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    let isMounted = true;
    if (user && user.role === 'admin') {
      Promise.all([
        supabase.from('bookings').select('id, amount, status', { count: 'exact' }),
        supabase.from('lawyers').select('*, profiles!lawyers_id_fkey(*)').eq('verification_status', 'PENDING'),
      ]).then(([bookingsRes, lawyersRes]) => {
        if (isMounted) {
          setStats({
            totalBookings: bookingsRes.count || 0,
            totalRevenue: bookingsRes.data?.reduce((acc, b) => acc + (b.amount || 0), 0) || 0,
            pendingVerifications: lawyersRes.data?.length || 0
          });
          setPendingLawyers(lawyersRes.data || []);
          setLoading(false);
        }
      }).catch(err => {
        console.error(err);
        if (isMounted) setLoading(false);
      });
    }
    return () => { isMounted = false; };
  }, [user]);

  const handleVerify = async (lawyerId, status) => {
    setActionLoading(prev => ({ ...prev, [lawyerId]: true }));
    try {
      await supabase.from('lawyers').update({ verification_status: status }).eq('id', lawyerId);
      
      setPendingLawyers(prev => prev.filter(l => l.id !== lawyerId));
      setStats(prev => ({ ...prev, pendingVerifications: prev.pendingVerifications - 1 }));
    } catch (err) {
      alert(err.message || 'Failed to update lawyer status');
    } finally {
      setActionLoading(prev => ({ ...prev, [lawyerId]: false }));
    }
  };

  if (authLoading || loading) return <div className={styles.loading}>Loading Admin Console...</div>;
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem', color: '#FFF', background: '#0A0A0A', fontFamily: 'sans-serif' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🔒 Admin Access Required</h2>
        <p style={{ color: '#9CA3AF', fontSize: '0.95rem' }}>
          {user ? `You are currently logged in as a ${user.role} (${user.email || 'User'}).` : 'You are not signed in.'}
        </p>
        <Link href="/login?redirect=/admin/dashboard" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: '#C9A84C', color: '#000', textDecoration: 'none', fontWeight: 600 }}>
          Sign In as Admin →
        </Link>
      </div>
    );
  }

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
          <div className={styles.sidebarAvatar}>👑</div>
          <div>
            <strong>Super Admin</strong>
            <span style={{ color: '#C9A84C', fontSize: '0.72rem', fontWeight: 600 }}>PLATFORM ADMIN</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {SIDEBAR_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navItem} ${link.href === '/admin/dashboard' ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{link.icon}</span>
              <span>{link.label}</span>
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
          <h1 className={styles.pageTitle}>Admin Control Center</h1>
          <Link href="/notifications" className={styles.notifBtn}>🔔</Link>
        </header>

        <div className={styles.dashContent}>
          {/* STATS OVERVIEW */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>👥</span>
              <div>
                <strong>{stats?.totalUsers || 0}</strong>
                <span>Total Users</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>⚖️</span>
              <div>
                <strong>{stats?.totalLawyers || 0}</strong>
                <span>Total Lawyers ({stats?.pendingLawyers || 0} pending)</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>📅</span>
              <div>
                <strong>{stats?.totalAppointments || 0}</strong>
                <span>Appointments</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>💰</span>
              <div>
                <strong>৳ {Number(stats?.totalRevenue || 0).toLocaleString()}</strong>
                <span>Platform Volume</span>
              </div>
            </div>
          </div>

          {/* Pending Verification Queue */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>⏳ Lawyer Verification Queue ({pendingLawyers.length})</h3>
              <Link href="/admin/lawyers" className={styles.viewAll}>Manage All Lawyers →</Link>
            </div>

            {pendingLawyers.length === 0 ? (
              <div className="empty-state" style={{ background: '#111', borderRadius: '14px', border: '1px solid #1A1A1A' }}>
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-title">Verification Queue Clean</div>
                <p>There are no pending lawyer applications awaiting review.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Lawyer Name</th>
                      <th>Title & Bar No.</th>
                      <th>Experience</th>
                      <th>City</th>
                      <th>Applied Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingLawyers.map(lawyer => (
                      <tr key={lawyer.id}>
                        <td>
                          <strong style={{ color: '#FFF' }}>{lawyer.firstName} {lawyer.lastName}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{lawyer.user?.email}</div>
                        </td>
                        <td>
                          <div>{lawyer.professionalTitle || 'Advocate'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#FFFFFF', fontFamily: 'monospace' }}>{lawyer.barNumber}</div>
                        </td>
                        <td>{lawyer.yearsOfExperience} years</td>
                        <td>{lawyer.city || 'N/A'}</td>
                        <td>{new Date(lawyer.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={actionLoading[lawyer.id]}
                              onClick={() => handleVerify(lawyer.id, 'APPROVED')}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={actionLoading[lawyer.id]}
                              onClick={() => handleVerify(lawyer.id, 'REJECTED')}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* QUICK LINKS */}
          <div className={styles.quickActions}>
            <h3 className={styles.sectionTitle}>⚡ Quick Admin Actions</h3>
            <div className={styles.actionsGrid}>
              <Link href="/admin/lawyers" className={styles.actionCard}>
                <span>⚖️</span>
                <strong>Verify Lawyers</strong>
                <small>{stats?.pendingLawyers || 0} applications awaiting approval</small>
              </Link>
              <Link href="/admin/users" className={styles.actionCard}>
                <span>👥</span>
                <strong>Manage Users</strong>
                <small>Clients and advocate accounts</small>
              </Link>
              <Link href="/admin/appointments" className={styles.actionCard}>
                <span>📅</span>
                <strong>Consultation Audit</strong>
                <small>View platform booking logs</small>
              </Link>
              <Link href="/admin/payments" className={styles.actionCard}>
                <span>💳</span>
                <strong>Financials</strong>
                <small>SSLCommerz transactions & payouts</small>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

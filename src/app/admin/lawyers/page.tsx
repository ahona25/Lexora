'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase/client';
import styles from '../dashboard/page.module.css';

const SIDEBAR_LINKS = [
  { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/admin/lawyers', icon: '⚖️', label: 'Lawyer Verification' },
  { href: '/admin/users', icon: '👥', label: 'User Management' },
  { href: '/admin/appointments', icon: '📅', label: 'Appointments' },
  { href: '/admin/payments', icon: '💳', label: 'Payments & Revenue' },
  { href: '/admin/reviews', icon: '⭐', label: 'Review Moderation' },
  { href: '/notifications', icon: '🔔', label: 'Notifications' },
];

export default function AdminLawyersPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role?.toLowerCase() !== 'admin')) {
      router.push('/login?redirect=/admin/lawyers');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    let isMounted = true;
    if (user && user.role?.toLowerCase() === 'admin') {
      supabase
        .from('lawyers')
        .select('*, profiles!lawyers_id_fkey(*), practice_areas(*)')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (isMounted) {
            if (!error && data) setLawyers(data);
            setLoading(false);
          }
        });
    }
    return () => { isMounted = false; };
  }, [user]);

  const handleUpdateStatus = async (lawyerId, newStatus) => {
    setActionLoading(prev => ({ ...prev, [lawyerId]: true }));
    try {
      const { error } = await supabase
        .from('lawyers')
        .update({ verification_status: newStatus })
        .eq('id', lawyerId);

      if (error) throw error;

      setLawyers(prev =>
        prev.map(l => (l.id === lawyerId ? { ...l, verification_status: newStatus } : l))
      );
    } catch (err) {
      alert(err.message || 'Failed to update lawyer status');
    } finally {
      setActionLoading(prev => ({ ...prev, [lawyerId]: false }));
    }
  };

  if (authLoading || loading) return <div className={styles.loading}>Loading Lawyers Directory...</div>;
  if (!user || user.role?.toLowerCase() !== 'admin') return null;

  const filteredLawyers = lawyers.filter(l => {
    const profile = l.profiles || {};
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
    const bar = (l.bar_number || '').toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || bar.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || l.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

        <nav className={styles.sidebarNav}>
          {SIDEBAR_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.sidebarLink} ${link.href === '/admin/lawyers' ? styles.sidebarLinkActive : ''}`}
            >
              <span className={styles.sidebarIcon}>{link.icon}</span>
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
          <h1 className={styles.pageTitle}>Lawyer Verification & Directory</h1>
          <Link href="/notifications" className={styles.notifBtn}>🔔</Link>
        </header>

        <div className={styles.dashContent}>
          {/* FILTER BAR */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: '#111', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #1A1A1A' }}>
            <input
              type="text"
              placeholder="Search by lawyer name or bar number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: '240px', background: '#1A1A1A', border: '1px solid #2A2A2A', padding: '0.65rem 1rem', borderRadius: '8px', color: '#FFF', fontSize: '0.9rem', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: statusFilter === status ? '#C9A84C' : '#1A1A1A',
                    color: statusFilter === status ? '#000' : '#9CA3AF',
                    border: '1px solid #2A2A2A'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* LAWYERS TABLE */}
          <div style={{ overflowX: 'auto', background: '#111', borderRadius: '14px', border: '1px solid #1A1A1A' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1A1A1A', color: '#6B7280' }}>
                  <th style={{ padding: '1rem' }}>LAWYER</th>
                  <th style={{ padding: '1rem' }}>PRACTICE AREA & BAR NO</th>
                  <th style={{ padding: '1rem' }}>EXPERIENCE</th>
                  <th style={{ padding: '1rem' }}>FEE</th>
                  <th style={{ padding: '1rem' }}>STATUS</th>
                  <th style={{ padding: '1rem' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredLawyers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                      No lawyers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLawyers.map(lawyer => {
                    const profile = lawyer.profiles || {};
                    const firstName = profile.first_name || 'Advocate';
                    const lastName = profile.last_name || '';
                    const area = lawyer.practice_areas?.name || 'General Practice';
                    const bar = lawyer.bar_number || 'N/A';
                    const fee = lawyer.consultation_fee || 1000;
                    const status = lawyer.verification_status || 'PENDING';

                    const statusBg = status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : status === 'PENDING' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)';
                    const statusColor = status === 'APPROVED' ? '#10B981' : status === 'PENDING' ? '#F59E0B' : '#EF4444';

                    return (
                      <tr key={lawyer.id} style={{ borderBottom: '1px solid #1A1A1A' }}>
                        <td style={{ padding: '1rem' }}>
                          <strong style={{ color: '#FFF', display: 'block' }}>{firstName} {lastName}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>📍 {profile.city || 'Dhaka'}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ color: '#E5E7EB', fontWeight: 500 }}>{area}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontFamily: 'monospace' }}>{bar}</div>
                        </td>
                        <td style={{ padding: '1rem', color: '#D1D5DB' }}>{lawyer.years_experience || 0} yrs</td>
                        <td style={{ padding: '1rem', color: '#C9A84C', fontWeight: 600 }}>৳ {Number(fee).toLocaleString()}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: statusBg, color: statusColor, border: `1px solid ${statusColor}44` }}>
                            {status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {status !== 'APPROVED' && (
                              <button
                                style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}
                                disabled={actionLoading[lawyer.id]}
                                onClick={() => handleUpdateStatus(lawyer.id, 'APPROVED')}
                              >
                                Approve
                              </button>
                            )}
                            {status !== 'REJECTED' && (
                              <button
                                style={{ background: '#EF4444', color: '#FFF', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}
                                disabled={actionLoading[lawyer.id]}
                                onClick={() => handleUpdateStatus(lawyer.id, 'REJECTED')}
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

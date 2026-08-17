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

export default function AdminUsersPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role?.toLowerCase() !== 'admin')) {
      router.push('/login?redirect=/admin/users');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    let isMounted = true;
    if (user && user.role?.toLowerCase() === 'admin') {
      supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (isMounted) {
            if (!error && data) setProfiles(data);
            setLoading(false);
          }
        });
    }
    return () => { isMounted = false; };
  }, [user]);

  if (authLoading || loading) return <div className={styles.loading}>Loading Users Directory...</div>;
  if (!user || user.role?.toLowerCase() !== 'admin') return null;

  const filteredProfiles = profiles.filter(p => {
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    const city = (p.city || '').toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || city.includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || (p.role || 'client').toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
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
              className={`${styles.sidebarLink} ${link.href === '/admin/users' ? styles.sidebarLinkActive : ''}`}
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
          <h1 className={styles.pageTitle}>User Management Directory ({profiles.length})</h1>
          <Link href="/notifications" className={styles.notifBtn}>🔔</Link>
        </header>

        <div className={styles.dashContent}>
          {/* FILTER BAR */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: '#111', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #1A1A1A' }}>
            <input
              type="text"
              placeholder="Search users by name or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: '240px', background: '#1A1A1A', border: '1px solid #2A2A2A', padding: '0.65rem 1rem', borderRadius: '8px', color: '#FFF', fontSize: '0.9rem', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['ALL', 'client', 'lawyer', 'admin'].map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: roleFilter === role ? '#C9A84C' : '#1A1A1A',
                    color: roleFilter === role ? '#000' : '#9CA3AF',
                    border: '1px solid #2A2A2A',
                    textTransform: 'capitalize'
                  }}
                >
                  {role === 'ALL' ? 'All Roles' : `${role}s`}
                </button>
              ))}
            </div>
          </div>

          {/* USERS TABLE */}
          <div style={{ overflowX: 'auto', background: '#111', borderRadius: '14px', border: '1px solid #1A1A1A' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1A1A1A', color: '#6B7280' }}>
                  <th style={{ padding: '1rem' }}>NAME</th>
                  <th style={{ padding: '1rem' }}>ROLE</th>
                  <th style={{ padding: '1rem' }}>CITY</th>
                  <th style={{ padding: '1rem' }}>PHONE</th>
                  <th style={{ padding: '1rem' }}>JOINED DATE</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map(p => {
                    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'User';
                    const role = (p.role || 'client').toUpperCase();
                    const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A';

                    const roleBg = role === 'ADMIN' ? 'rgba(201, 168, 76, 0.2)' : role === 'LAWYER' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(156, 163, 175, 0.15)';
                    const roleColor = role === 'ADMIN' ? '#C9A84C' : role === 'LAWYER' ? '#60A5FA' : '#9CA3AF';

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #1A1A1A' }}>
                        <td style={{ padding: '1rem' }}>
                          <strong style={{ color: '#FFF', display: 'block' }}>{fullName}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>ID: {p.id.slice(0, 8)}...</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: roleBg, color: roleColor, border: `1px solid ${roleColor}44` }}>
                            {role}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: '#D1D5DB' }}>📍 {p.city || 'Dhaka'}</td>
                        <td style={{ padding: '1rem', color: '#D1D5DB' }}>{p.phone || 'N/A'}</td>
                        <td style={{ padding: '1rem', color: '#D1D5DB' }}>{dateStr}</td>
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

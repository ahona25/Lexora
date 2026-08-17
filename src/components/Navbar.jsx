'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/find-lawyer', label: 'Find a Lawyer' },
  { href: '/categories', label: 'Practice Areas' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    const role = user.role?.toLowerCase();
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'lawyer') return '/lawyer/dashboard';
    return '/client/dashboard';
  };

  const displayName = user?.first_name || user?.profile?.firstName || user?.email?.split('@')[0] || 'User';
  const initial = (displayName?.[0] || 'U').toUpperCase();

  const userAvatar = user?.avatar_url || user?.profile?.avatarUrl;

  const isLinkActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚖️</span>
          <span className={styles.logoText}>
            Lex<span className={styles.logoAccent}>ora</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <ul className={styles.navLinks}>
          {NAV_LINKS.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.navLink} ${isLinkActive(item.href) ? styles.navLinkActive : ''}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.navActions}>
          {user ? (
            <div className={styles.profileMenu}>
              <button className={styles.profileBtn} onClick={() => setProfileOpen(!profileOpen)}>
                <div className={styles.profileAvatar}>
                  {userAvatar ? (
                    <img src={userAvatar} alt="Profile" className={styles.avatarImg} />
                  ) : (
                    initial
                  )}
                </div>
                <span className={styles.profileName}>{displayName}</span>
                <span className={styles.chevron}>▾</span>
              </button>
              {profileOpen && (
                <div className={styles.profileDropdown}>
                  <Link href="/profile" className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                    👤 My Profile
                  </Link>
                  <Link href={getDashboardPath()} className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                    📊 Dashboard
                  </Link>
                  <Link href="/notifications" className={styles.dropdownItem} onClick={() => setProfileOpen(false)}>
                    🔔 Notifications
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <button
                    className={`${styles.dropdownItem} ${styles.logoutBtn}`}
                    onClick={() => { logout(); setProfileOpen(false); }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className={`btn btn-secondary ${styles.loginBtn}`}>Sign In</Link>
              <Link href="/register" className={`btn btn-primary`}>Get Started</Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button className={styles.hamburger} onClick={() => setMobileOpen(!mobileOpen)}>
            <span className={mobileOpen ? styles.barOpen : ''} />
            <span className={mobileOpen ? styles.barOpen : ''} />
            <span className={mobileOpen ? styles.barOpen : ''} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.mobileLink} ${isLinkActive(item.href) ? styles.mobileLinkActive : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className={styles.mobileDivider} />
          {user ? (
            <>
              <Link href="/profile" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>👤 My Profile</Link>
              <Link href={getDashboardPath()} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>📊 Dashboard</Link>
              <button className={`${styles.mobileLink} ${styles.mobileLogout}`} onClick={() => { logout(); setMobileOpen(false); }}>🚪 Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link href="/register" className={`btn btn-primary ${styles.mobileRegister}`} onClick={() => setMobileOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

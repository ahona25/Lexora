import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <span>⚖️</span>
              <span>Legal<span className={styles.logoAccent}>Connect</span></span>
            </Link>
            <p className={styles.tagline}>
              Bangladesh's most trusted digital platform for verified legal consultations. Justice made accessible.
            </p>
            <div className={styles.socials}>
              <a href="#" className={styles.social} aria-label="Facebook">f</a>
              <a href="#" className={styles.social} aria-label="LinkedIn">in</a>
              <a href="#" className={styles.social} aria-label="Twitter">𝕏</a>
            </div>
          </div>

          <div className={styles.links}>
            <h4 className={styles.linkTitle}>Platform</h4>
            <ul>
              <li><Link href="/find-lawyer">Find a Lawyer</Link></li>
              <li><Link href="/categories">Practice Areas</Link></li>
              <li><Link href="/how-it-works">How It Works</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className={styles.links}>
            <h4 className={styles.linkTitle}>For Lawyers</h4>
            <ul>
              <li><Link href="/register?type=lawyer">Join as Lawyer</Link></li>
              <li><Link href="/lawyer/dashboard">Lawyer Dashboard</Link></li>
              <li><Link href="/how-it-works">Getting Verified</Link></li>
            </ul>
          </div>

          <div className={styles.links}>
            <h4 className={styles.linkTitle}>Legal</h4>
            <ul>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Lexora. All rights reserved.</p>
          <p>Made for Bangladesh's legal community 🇧🇩</p>
        </div>
      </div>
    </footer>
  );
}

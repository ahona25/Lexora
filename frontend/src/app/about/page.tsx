import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '7rem 1.5rem 4rem' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>Our Mission</span>
            <h1 className="font-serif" style={{ fontSize: '2.5rem', color: '#FFF', marginBottom: '0.75rem' }}>
              About Lexora
            </h1>
            <p className="subtitle" style={{ color: '#6B7280', fontSize: '1.1rem', lineHeight: 1.7 }}>
              Lexora is Bangladesh's premiere lawyer booking and digital legal consultation platform, dedicated to bridging the gap between citizens and verified legal experts.
            </p>

            <div className="content" style={{ marginTop: '2rem', textAlign: 'left' }}>
              <section className="section" style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#FFFFFF', marginBottom: '1rem' }}>Our Mission</h2>
                <p style={{ color: '#D1D5DB', lineHeight: 1.7 }}>
                  To democratize access to justice in Bangladesh. We believe that finding reliable legal counsel shouldn't be a privilege, but a basic right. Lexora was built to eliminate the opacity traditionally associated with legal services.
                </p>
              </section>

              <section className="section" style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#FFFFFF', marginBottom: '1rem' }}>The Problem We Solve</h2>
                <p style={{ color: '#D1D5DB', lineHeight: 1.7, marginBottom: '1rem' }}>
                  Finding a trustworthy lawyer, evaluating their expertise, agreeing on fees, and coordinating meetings traditionally involved immense friction and uncertainty. Lexora solves this by digitizing the entire legal consultation journey.
                </p>
                <p style={{ color: '#D1D5DB', lineHeight: 1.7 }}>
                  Every advocate listed on Lexora undergoes strict background and Bar credentials verification. Whether you require criminal defense, family advice, property deed verification, or corporate compliance counsel, Lexora provides transparent, high-integrity legal access.
                </p>
              </section>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>ðŸ›¡ï¸</div>
                <strong style={{ color: '#FFF', display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem' }}>100% Verified</strong>
                <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>Verified Bar numbers and certificates.</span>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>ðŸ”’</div>
                <strong style={{ color: '#FFF', display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Confidential</strong>
                <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>Encrypted document vault and calls.</span>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>ðŸ“±</div>
                <strong style={{ color: '#FFF', display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Instant bKash</strong>
                <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>Seamless mobile payment & receipts.</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link href="/find-lawyer" className="btn btn-primary btn-lg">Explore Lawyers â†’</Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

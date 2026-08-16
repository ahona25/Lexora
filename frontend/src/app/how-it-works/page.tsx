import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HowItWorksPage() {
  const steps = [
    { num: '01', title: 'Search & Compare Lawyers', desc: 'Browse 500+ verified advocates across Bangladesh by practice area, location, language, and consultation fee.' },
    { num: '02', title: 'Select Consultation Type', desc: 'Choose from Video Consultation, Audio Call, Instant Chat, or In-Person Chamber Visit.' },
    { num: '03', title: 'Pick an Available Slot', desc: 'View the lawyerâ€™s real-time schedule and pick a date and time slot that fits your agenda.' },
    { num: '04', title: 'Provide Case Brief & Files', desc: 'Summarize your case title and optionally upload relevant documents (deeds, contracts, court orders).' },
    { num: '05', title: 'Pay Securely via bKash / Card', desc: 'Complete your booking with bKash, Nagad, card, or bank transfer. Receive instant confirmation.' },
    { num: '06', title: 'Attend & Rate Consultation', desc: 'Join your secure video room or visit chamber. Rate your experience to help future clients.' },
  ];

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '7rem 1.5rem 4rem' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>Step-by-Step Guide</span>
            <h1 className="font-serif" style={{ fontSize: '2.5rem', color: '#FFF', marginBottom: '0.75rem' }}>
              How Lexora Works
            </h1>
            <p style={{ color: '#6B7280', fontSize: '1rem' }}>
              Simple, transparent, and secure legal consultations in 6 easy steps.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {steps.map((s, i) => (
              <div key={i} className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  background: 'rgba(255, 255, 255,0.1)',
                  border: '1px solid rgba(255, 255, 255,0.25)',
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {s.num}
                </div>
                <div>
                  <h3 className="font-serif" style={{ fontSize: '1.2rem', color: '#FFF', marginBottom: '0.35rem' }}>{s.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#6B7280', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/find-lawyer" className="btn btn-primary btn-lg">
              Find a Lawyer Now â†’
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

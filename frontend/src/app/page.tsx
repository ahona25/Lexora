'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/utils/supabase/client';
import CustomSelect from '@/components/CustomSelect';
import styles from './page.module.css';

const STATS = [
  { value: '500+', label: 'Verified Lawyers' },
  { value: '12,000+', label: 'Clients Served' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '18', label: 'Practice Areas' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: '🔍', title: 'Search & Filter', desc: 'Find the right lawyer by specialization, location, fee range, language, and availability.' },
  { step: '02', icon: '📋', title: 'View & Compare', desc: 'Review detailed lawyer profiles including credentials, experience, reviews, and consultation fees.' },
  { step: '03', icon: '📅', title: 'Book Instantly', desc: 'Select your consultation type — video, audio, chat, or in-person — and choose an available slot.' },
  { step: '04', icon: '💳', title: 'Secure Payment', desc: 'Pay securely via bKash, Nagad, card, or bank transfer. Your appointment is confirmed instantly.' },
  { step: '05', icon: '⚖️', title: 'Get Legal Help', desc: 'Attend your consultation from anywhere. Share documents securely and get professional legal advice.' },
];

const TESTIMONIALS = [
  { name: 'Tariqul Islam', role: 'Business Owner, Dhaka', rating: 5, text: 'Found an amazing property lawyer within minutes. The video consultation saved me hours of travel and the outcome was excellent.' },
  { name: 'Sadia Rahman', role: 'HR Manager, Chittagong', rating: 5, text: 'Lexora connected me with a brilliant employment lawyer. I got all the answers about my wrongful termination case clearly and professionally.' },
  { name: 'Md. Karim', role: 'Family Man, Sylhet', rating: 5, text: 'The family law consultation was handled with great sensitivity. The lawyer explained everything in simple Bangla which was incredibly helpful.' },
];

const CATEGORIES = [
  { icon: '🛡️', name: 'Criminal Law' },
  { icon: '⚖️', name: 'Civil Law' },
  { icon: '👨‍👩‍👧', name: 'Family Law' },
  { icon: '💔', name: 'Divorce Law' },
  { icon: '🏠', name: 'Property Law' },
  { icon: '🏢', name: 'Corporate Law' },
  { icon: '👷', name: 'Employment Law' },
  { icon: '💻', name: 'Cyber Law' },
  { icon: '💰', name: 'Tax Law' },
  { icon: '💡', name: 'Intellectual Property' },
];

const FAQ = [
  { q: 'Are the lawyers on Lexora verified?', a: 'Yes. Every lawyer undergoes a strict verification process including bar number validation, document review, and credential checks before their profile becomes bookable.' },
  { q: 'How do I pay for a consultation?', a: 'We accept bKash, Nagad, Debit/Credit cards, and bank transfers. All payments are secured and processed through our trusted gateway partners.' },
  { q: 'Can I have a consultation in Bangla?', a: 'Absolutely. You can filter lawyers by language. Many of our lawyers offer consultations in Bangla, English, or both.' },
  { q: 'What if I need to cancel or reschedule?', a: 'You can cancel or reschedule an appointment from your dashboard. Cancellation policies vary by lawyer — refunds are processed per the platform\'s refund policy.' },
  { q: 'Is my case information confidential?', a: 'Yes. All communication, documents, and case details are handled with strict confidentiality under professional legal ethics standards.' },
];

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [city, setCity] = useState('');
  const [categories, setCategories] = useState([]);
  const [featuredLawyers, setFeaturedLawyers] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Fetch specializations / practice areas
    supabase.from('practice_areas').select('*')
      .then(({ data }) => { if (isMounted && data) setCategories(data); });
      
    // Fetch featured lawyers with full profile
    supabase.from('lawyers')
      .select(`
        id,
        bio,
        years_experience,
        consultation_fee,
        rating,
        total_reviews,
        verification_status,
        practice_areas (name, icon),
        profiles (first_name, last_name, avatar_url, city)
      `)
      .eq('verification_status', 'APPROVED')
      .order('rating', { ascending: false })
      .limit(12)
      .then(({ data }) => { if (isMounted && data) setFeaturedLawyers(data); });

    return () => { isMounted = false; };
  }, []);

  const CARDS_PER_SLIDE = 3;
  const totalSlides = Math.max(1, Math.ceil(featuredLawyers.length / CARDS_PER_SLIDE));

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, totalSlides]);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);

  const slides = [];
  for (let i = 0; i < featuredLawyers.length; i += CARDS_PER_SLIDE) {
    slides.push(featuredLawyers.slice(i, i + CARDS_PER_SLIDE));
  }

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (specialization) params.set('specializationId', specialization);
    if (city) params.set('city', city);
    router.push(`/find-lawyer?${params.toString()}`);
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* HERO SECTION */}
        <section className={styles.hero}>
          <div className={styles.heroBg}>
            <div className={styles.heroGlow} />
            <div className={styles.heroLines} />
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              Bangladesh's #1 Legal Services Platform
            </div>

            <h1 className={styles.heroTitle}>
              Find the Right Lawyer<br />
              <span className={styles.heroTitleAccent}>For Your Legal Needs</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Connect with 500+ verified lawyers across Bangladesh. Book instant video,
              audio, or in-person consultations with complete transparency and security.
            </p>

            {/* Search Box */}
            <form className={styles.searchBox} onSubmit={handleSearch}>
              <div className={styles.searchField}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search by lawyer name or keyword..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.searchDivider} />
              <div className={styles.searchField}>
                <span className={styles.searchIcon}>⚖️</span>
                <CustomSelect
                  value={specialization}
                  onChange={setSpecialization}
                  placeholder="All Practice Areas"
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                />
              </div>
              <div className={styles.searchDivider} />
              <div className={styles.searchField}>
                <span className={styles.searchIcon}>📍</span>
                <CustomSelect
                  value={city}
                  onChange={setCity}
                  placeholder="All Locations"
                  options={['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna'].map(c => ({ value: c, label: c }))}
                />
              </div>
              <button type="submit" className={styles.searchBtn}>
                Find Lawyers →
              </button>
            </form>

            <div className={styles.heroTags}>
              {['Criminal Defense', 'Property Law', 'Divorce', 'Corporate', 'Cyber Law'].map(tag => (
                <button
                  key={tag}
                  className={styles.heroTag}
                  onClick={() => router.push(`/find-lawyer?search=${tag}`)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Hero Image — Justice Statue inspired */}
          <div className={styles.heroVisual}>
            <div className={styles.heroImageContainer}>
              <div className={styles.heroImageBg} />
              <div className={styles.heroImageGlow} />
              <div className={styles.justiceImageWrapper}>
                <img 
                  src="/media_1786862323106.png" 
                  alt="Lady Justice" 
                  className={styles.justiceImage}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=600&auto=format&fit=crop";
                  }}
                />
              </div>
              <div className={styles.heroCard1}>
                <span>✅</span>
                <div>
                  <strong>500+</strong>
                  <small>Verified Lawyers</small>
                </div>
              </div>
              <div className={styles.heroCard2}>
                <span>⭐</span>
                <div>
                  <strong>4.9 / 5</strong>
                  <small>Client Rating</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className={styles.stats}>
          <div className={styles.container}>
            <div className={styles.statsGrid}>
              {STATS.map((s, i) => (
                <div key={i} className={styles.statItem}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRACTICE AREAS */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>Practice Areas</span>
              <h2 className={styles.sectionTitle}>Legal Categories</h2>
              <p className={styles.sectionSubtitle}>
                From criminal defense to intellectual property — our platform covers every area of law practiced in Bangladesh.
              </p>
            </div>
            <div className={styles.categoriesGrid}>
              {(categories.length > 0 ? categories : CATEGORIES).slice(0, 10).map((cat, i) => (
                <Link
                  key={cat.id || i}
                  href={`/find-lawyer?specializationId=${cat.id || ''}&search=${cat.name}`}
                  className={styles.categoryCard}
                >
                  <span className={styles.categoryIcon}>{cat.icon || CATEGORIES[i % CATEGORIES.length]?.icon}</span>
                  <span className={styles.categoryName}>{cat.name}</span>
                  {cat._count && <span className={styles.categoryCount}>{cat._count.lawyers} lawyers</span>}
                </Link>
              ))}
            </div>
            <div className={styles.sectionCta}>
              <Link href="/categories" className="btn btn-secondary">View All Practice Areas →</Link>
            </div>
          </div>
        </section>

        {/* FEATURED LAWYERS (AUTO-SWITCHING CAROUSEL) */}
        <section className={`${styles.section} ${styles.darkSection}`}>
          <div className={styles.container}>
            <div className={styles.carouselHeader}>
              <div>
                <span className={styles.sectionTag}>Top Rated</span>
                <h2 className={styles.sectionTitle}>Featured Lawyers</h2>
                <p className={styles.sectionSubtitle}>
                  Our most experienced and highest-rated verified legal professionals ready to help you.
                </p>
              </div>
              <div className={styles.carouselControls}>
                <button 
                  type="button"
                  onClick={prevSlide} 
                  className={styles.carouselNavBtn} 
                  aria-label="Previous Featured Lawyers"
                  title="Previous Lawyers"
                >
                  ←
                </button>
                <button 
                  type="button"
                  onClick={nextSlide} 
                  className={styles.carouselNavBtn} 
                  aria-label="Next Featured Lawyers"
                  title="Next Lawyers"
                >
                  →
                </button>
              </div>
            </div>

            <div 
              className={styles.carouselWrapper}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {featuredLawyers.length > 0 ? (
                <div 
                  className={styles.carouselTrack}
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {slides.map((group, slideIdx) => (
                    <div key={slideIdx} className={styles.carouselSlide}>
                      {group.map((lawyer) => (
                        <LawyerCard key={lawyer.id} lawyer={lawyer} />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.lawyersGrid}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={styles.lawyerCardSkeleton}>
                      <div className={`skeleton ${styles.skeletonAvatar}`} />
                      <div className={`skeleton ${styles.skeletonLine}`} />
                      <div className={`skeleton ${styles.skeletonLineSm}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Carousel Dots */}
            {totalSlides > 1 && (
              <div className={styles.carouselPagination}>
                {Array.from({ length: totalSlides }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`${styles.carouselDot} ${currentSlide === idx ? styles.carouselDotActive : ''}`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            <div className={styles.sectionCta} style={{ marginTop: '2.5rem' }}>
              <Link href="/find-lawyer" className="btn btn-primary">Browse All Lawyers →</Link>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>Simple Process</span>
              <h2 className={styles.sectionTitle}>How Lexora Works</h2>
              <p className={styles.sectionSubtitle}>
                Getting the legal help you need has never been easier. Five simple steps to your consultation.
              </p>
            </div>
            <div className={styles.stepsGrid}>
              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} className={styles.stepCard}>
                  <div className={styles.stepNumber}>{step.step}</div>
                  <div className={styles.stepIcon}>{step.icon}</div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                  {i < HOW_IT_WORKS.length - 1 && <div className={styles.stepConnector}>→</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE */}
        <section className={`${styles.section} ${styles.darkSection}`}>
          <div className={styles.container}>
            <div className={styles.whyGrid}>
              <div className={styles.whyContent}>
                <span className={styles.sectionTag}>Why Lexora</span>
                <h2 className={styles.sectionTitle}>Justice Made Accessible</h2>
                <p className={styles.whySubtitle}>
                  We're on a mission to make professional legal services accessible to every Bangladeshi — regardless of geography, time, or background.
                </p>
                <ul className={styles.whyList}>
                  {[
                    { icon: '🔒', title: 'Verified Professionals', desc: 'Every lawyer is thoroughly verified against bar credentials before listing.' },
                    { icon: '💳', title: 'Transparent Pricing', desc: 'See exact consultation fees upfront. No hidden charges, ever.' },
                    { icon: '📹', title: 'Flexible Consultation', desc: 'Video, audio, chat, or in-person — you choose what works for you.' },
                    { icon: '🛡️', title: 'Secure & Confidential', desc: 'Military-grade encryption protects all your documents and communications.' },
                  ].map((item, i) => (
                    <li key={i} className={styles.whyItem}>
                      <span className={styles.whyItemIcon}>{item.icon}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="btn btn-primary">Start Your Free Consultation →</Link>
              </div>
              <div className={styles.whyVisual}>
                <div className={styles.whyCard}>
                  <div className={styles.whyCardHeader}>
                    <div className={styles.whyCardAvatar}>RA</div>
                    <div>
                      <strong>Adv. Rahul Amin</strong>
                      <span>Senior Advocate, Supreme Court</span>
                    </div>
                    <span className={styles.verifiedBadge}>✓ Verified</span>
                  </div>
                  <div className={styles.whyCardStats}>
                    <div><strong>14</strong><span>Years Exp.</span></div>
                    <div><strong>120+</strong><span>Cases</span></div>
                    <div><strong>4.9⭐</strong><span>Rating</span></div>
                  </div>
                  <div className={styles.whyCardTypes}>
                    {['Video', 'Audio', 'Chat', 'In-Person'].map(t => (
                      <span key={t} className={styles.consultType}>{t}</span>
                    ))}
                  </div>
                  <div className={styles.whyCardFee}>
                    <span>Consultation Fee</span>
                    <strong>৳ 2,500</strong>
                  </div>
                  <Link href="/find-lawyer" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Book Consultation
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>Client Stories</span>
              <h2 className={styles.sectionTitle}>What Our Clients Say</h2>
            </div>
            <div className={styles.testimonialsGrid}>
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className={styles.testimonialCard}>
                  <div className={styles.testimonialStars}>{'⭐'.repeat(t.rating)}</div>
                  <p className={styles.testimonialText}>"{t.text}"</p>
                  <div className={styles.testimonialAuthor}>
                    <div className={styles.testimonialAvatar}>{t.name[0]}</div>
                    <div>
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={`${styles.section} ${styles.darkSection}`}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>FAQ</span>
              <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            </div>
            <div className={styles.faqList}>
              {FAQ.map((item, i) => (
                <div key={i} className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}>
                  <button className={styles.faqQuestion} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{item.q}</span>
                    <span className={styles.faqChevron}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <div className={styles.faqAnswer}>{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <div className={styles.ctaBanner}>
              <div className={styles.ctaContent}>
                <h2 className={styles.ctaTitle}>Ready to Get Legal Help?</h2>
                <p className={styles.ctaSubtitle}>Join 12,000+ clients who've resolved their legal matters with Lexora.</p>
              </div>
              <div className={styles.ctaActions}>
                <Link href="/find-lawyer" className="btn btn-primary btn-lg">Find a Lawyer Now</Link>
                <Link href="/register?type=lawyer" className="btn btn-secondary btn-lg">Join as a Lawyer</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function LawyerCard({ lawyer }) {
  const firstName = lawyer.profiles?.first_name || lawyer.firstName || 'Advocate';
  const lastName = lawyer.profiles?.last_name || lawyer.lastName || '';
  const avatarUrl = lawyer.profiles?.avatar_url || lawyer.avatar_url || lawyer.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=111&color=fff`;
  const city = lawyer.profiles?.city || lawyer.city || 'Dhaka, Bangladesh';
  const rating = lawyer.rating || lawyer.averageRating || 4.8;
  const reviews = lawyer.total_reviews ?? lawyer.totalReviews ?? 12;
  const experience = lawyer.years_experience ?? lawyer.yearsOfExperience ?? 5;
  const fee = lawyer.consultation_fee ?? lawyer.consultationFee ?? 1500;
  const specName = lawyer.practice_areas?.name || (lawyer.specializations?.[0]?.specialization?.name) || 'General Practice';

  return (
    <Link href={`/lawyers/${lawyer.id}`} className={styles.lawyerCard}>
      <div className={styles.lawyerCardTop}>
        <div className={styles.lawyerAvatar}>
          <img src={avatarUrl} alt={`${firstName} ${lastName}`} />
        </div>
        <div className={styles.verifiedIcon} title="Verified Lawyer">✓</div>
      </div>
      <div className={styles.lawyerCardBody}>
        <h3 className={styles.lawyerName}>{firstName} {lastName}</h3>
        <p className={styles.lawyerTitle}>{lawyer.bio ? (lawyer.bio.length > 60 ? lawyer.bio.slice(0, 60) + '...' : lawyer.bio) : 'Supreme Court Advocate'}</p>
        <div className={styles.lawyerSpecializations}>
          <span className={styles.specTag}>{specName}</span>
        </div>
        <div className={styles.lawyerMeta}>
          <span className={styles.lawyerRating}>⭐ {Number(rating).toFixed(1)} ({reviews})</span>
          <span className={styles.lawyerExp}>{experience} yrs exp.</span>
        </div>
        <div className={styles.lawyerFee}>
          <span className={styles.feeLabel}>From</span>
          <span className={styles.feeAmount}>৳ {Number(fee).toLocaleString()}</span>
          <span className={styles.feeUnit}>/ session</span>
        </div>
      </div>
      <div className={styles.lawyerCardFooter}>
        <span className={styles.lawyerLocation}>📍 {city}</span>
        <span className={styles.bookNow}>Book Now →</span>
      </div>
    </Link>
  );
}

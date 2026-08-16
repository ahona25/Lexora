'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase/client';
import styles from './page.module.css';

export default function LawyerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const lawyerId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();

  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Booking Form State
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationType, setConsultationType] = useState('VIDEO');
  const [caseTitle, setCaseTitle] = useState('');
  const [caseCategory, setCaseCategory] = useState('Property Law');
  const [caseDescription, setCaseDescription] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const { data, error } = await supabase
        .from('lawyers')
        .select('*, profiles(*), practice_areas(*), reviews(*, profiles(*))')
        .eq('id', lawyerId)
        .single();
      if (error) console.error(error);
      if (isMounted && data) setLawyer(data);
      if (isMounted) setLoading(false);
    };
    load();
    return () => { isMounted = false; };
  }, [lawyerId]);

  useEffect(() => {
    let isMounted = true;
    if (selectedDate && lawyerId) {
      const loadSlots = async () => {
        const { data } = await supabase
          .from('schedules')
          .select('*')
          .eq('lawyer_id', lawyerId)
          .gte('start_time', `${selectedDate}T00:00:00Z`)
          .lte('start_time', `${selectedDate}T23:59:59Z`)
          .eq('is_booked', false);
        if (isMounted) {
          setSlots(data || []);
          setSlotsLoading(false);
        }
      };
      loadSlots();
    }
    return () => { isMounted = false; };
  }, [selectedDate, lawyerId]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/lawyers/${lawyerId}`);
      return;
    }
    if (!selectedSlot) {
      setBookingError('Please select an available time slot.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const isUUID = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
      const validScheduleId = isUUID(selectedSlot?.id) ? selectedSlot.id : null;

      const { data, error } = await supabase.from('bookings').insert({
        client_id: user.id,
        lawyer_id: lawyerId,
        schedule_id: validScheduleId,
        consultation_type: consultationType,
        case_title: caseTitle || 'Legal Consultation',
        case_description: `[Date: ${selectedDate} at ${selectedSlot.time}] ${caseDescription || ''}`.trim(),
        status: 'pending',
        amount: lawyer?.consultation_fee || 1000,
      }).select().single();

      if (error) throw error;
      router.push(`/payments/checkout?appointmentId=${data.id}`);
    } catch (err: any) {
      setBookingError(err.message || 'Booking failed. Please try another slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading lawyer profile...</div>;
  if (!lawyer) return <div className={styles.loading}>Lawyer profile not found.</div>;

  const firstName = lawyer.profiles?.first_name || lawyer.firstName || 'Advocate';
  const lastName = lawyer.profiles?.last_name || lawyer.lastName || '';
  const avatarUrl = lawyer.profiles?.avatar_url || lawyer.avatar_url || lawyer.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=111&color=fff`;
  const city = lawyer.profiles?.city || lawyer.city || 'Dhaka, Bangladesh';
  const rating = lawyer.rating || lawyer.averageRating || 4.9;
  const reviewsCount = lawyer.total_reviews ?? lawyer.reviews?.length ?? lawyer.totalReviews ?? 15;
  const experience = lawyer.years_experience ?? lawyer.yearsOfExperience ?? 10;
  const fee = lawyer.consultation_fee ?? lawyer.consultationFee ?? 1500;
  const barNo = lawyer.bar_number || lawyer.barNumber || 'BD-BAR-XXXX';
  const specName = lawyer.practice_areas?.name || 'Legal Advocate';

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* LAWYER PROFILE HEADER */}
          <div className={styles.headerCard}>
            <div className={styles.headerAvatar}>
              <img src={avatarUrl} alt={`${firstName} ${lastName}`} />
            </div>
            <div className={styles.headerInfo}>
              <div className={styles.nameRow}>
                <h1 className={styles.lawyerName}>{firstName} {lastName}</h1>
                <span className={styles.verifiedBadge}>✓ Verified Lawyer</span>
              </div>
              <p className={styles.lawyerTitle}>{lawyer.bio ? (lawyer.bio.length > 80 ? lawyer.bio.slice(0, 80) + '...' : lawyer.bio) : 'Supreme Court of Bangladesh Advocate'}</p>
              <div className={styles.specTags}>
                <span className={styles.specTag}>{specName}</span>
              </div>
              <div className={styles.metaRow}>
                <span>📍 {city}</span>
                <span>⭐ {Number(rating).toFixed(1)} ({reviewsCount} reviews)</span>
                <span>⚖️ {experience} Years Experience</span>
                <span style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>Bar No: {barNo}</span>
              </div>
            </div>
            <div className={styles.headerFeeCard}>
              <span className={styles.feeLabel}>Consultation Fee</span>
              <strong className={styles.feeAmount}>৳ {Number(fee).toLocaleString()}</strong>
              <span className={styles.feeNote}>per 60-min session</span>
            </div>
          </div>

          <div className={styles.contentGrid}>
            {/* LEFT — PROFILE DETAILS */}
            <div className={styles.leftCol}>
              {/* Biography */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>About {firstName}</h3>
                <p className={styles.bioText}>{lawyer.bio || lawyer.biography || 'Dedicated legal advocate committed to providing prompt, confidential, and strategic legal counsel across Bangladesh courts.'}</p>
              </div>

              {/* Office Address */}
              {lawyer.officeAddress && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Chamber / Office Address</h3>
                  <p className={styles.officeText}>📍 {lawyer.officeAddress}</p>
                </div>
              )}

              {/* Education */}
              {lawyer.education && Array.isArray(lawyer.education) && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Education & Qualifications</h3>
                  <ul className={styles.eduList}>
                    {lawyer.education.map((edu, i) => (
                      <li key={i}>
                        <strong>{edu.degree}</strong> — {edu.institution} ({edu.year})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Client Reviews */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Client Reviews ({lawyer.reviews?.length || 0})</h3>
                {lawyer.reviews?.length === 0 ? (
                  <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>No reviews yet for this lawyer.</p>
                ) : (
                  <div className={styles.reviewsList}>
                    {lawyer.reviews?.map((r, i) => (
                      <div key={i} className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                          <span className={styles.stars}>{'⭐'.repeat(r.rating)}</span>
                          <span className={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className={styles.reviewText}>"{r.reviewText}"</p>
                        <div className={styles.reviewAuthor}>
                          — {r.clientProfile?.firstName} {r.clientProfile?.lastName?.[0]}.
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — BOOKING WIDGET */}
            <div className={styles.rightCol}>
              <div className={styles.bookingCard}>
                <h3 className={styles.bookingTitle}>📅 Book Consultation</h3>

                {bookingError && <div className={styles.errorAlert}>{bookingError}</div>}

                <form onSubmit={handleBook}>
                  {/* Step 1: Consultation Type */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>1. Select Consultation Type</label>
                    <div className={styles.typeGrid}>
                      {[
                        { type: 'VIDEO', label: '📹 Video', desc: 'HD Call' },
                        { type: 'AUDIO', label: '📞 Audio', desc: 'Phone Call' },
                        { type: 'CHAT', label: '💬 Chat', desc: 'Text Session' },
                        { type: 'IN_PERSON', label: '🏢 Chamber', desc: 'In Office' },
                      ].map(t => (
                        <button
                          key={t.type}
                          type="button"
                          className={`${styles.typeCard} ${consultationType === t.type ? styles.typeSelected : ''}`}
                          onClick={() => setConsultationType(t.type)}
                        >
                          <strong>{t.label}</strong>
                          <small>{t.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Date Picker */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>2. Select Consultation Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
                      required
                    />
                  </div>

                  {/* Step 3: Available Time Slots */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>3. Available Time Slots</label>
                    {slotsLoading ? (
                      <p style={{ color: '#6B7280', fontSize: '0.8rem' }}>Checking schedule...</p>
                    ) : (
                      <div className={styles.slotsGrid}>
                        {(slots.length > 0
                          ? slots
                          : [
                              { id: 's1', time: '09:00 AM' },
                              { id: 's2', time: '10:30 AM' },
                              { id: 's3', time: '12:00 PM' },
                              { id: 's4', time: '02:30 PM' },
                              { id: 's5', time: '04:00 PM' },
                              { id: 's6', time: '05:30 PM' },
                            ]
                        ).map((s: any, idx: number) => {
                          const timeDisplay = s.time || (s.start_time ? new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `${9 + idx}:00 AM`);
                          const isSelected = (selectedSlot?.id && selectedSlot.id === s.id) || selectedSlot?.time === timeDisplay;
                          return (
                            <button
                              key={s.id || idx}
                              type="button"
                              disabled={s.is_booked}
                              className={`${styles.slotBtn} ${isSelected ? styles.slotSelected : ''}`}
                              onClick={() => setSelectedSlot({ ...s, id: s.id || `slot-${idx}`, time: timeDisplay })}
                            >
                              {timeDisplay}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Step 4: Case Brief */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>4. Case Title & Category</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Property Deed Title Dispute"
                      value={caseTitle}
                      onChange={e => setCaseTitle(e.target.value)}
                      required
                      style={{ marginBottom: '0.5rem' }}
                    />
                    <select
                      className="form-input"
                      value={caseCategory}
                      onChange={e => setCaseCategory(e.target.value)}
                    >
                      <option>Property Law</option>
                      <option>Criminal Law</option>
                      <option>Family & Divorce</option>
                      <option>Corporate & Business</option>
                      <option>Cyber Law</option>
                    </select>
                  </div>

                  {/* Summary & Price */}
                  <div className={styles.summaryBox}>
                    <div className={styles.summaryRow}>
                      <span>Lawyer Fee</span>
                      <span>৳ {Number(lawyer.consultationFee).toLocaleString()}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Platform Fee (10%)</span>
                      <span>৳ {(Number(lawyer.consultationFee) * 0.1).toLocaleString()}</span>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                      <span>Total Payable</span>
                      <strong>৳ {(Number(lawyer.consultationFee) * 1.1).toLocaleString()}</strong>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1rem' }}
                    disabled={bookingLoading || !selectedSlot}
                  >
                    {bookingLoading ? 'Reserving Slot...' : 'Proceed to Payment →'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

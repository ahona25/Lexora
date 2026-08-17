'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/utils/supabase/client';
import styles from './page.module.css';

const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'experience', label: 'Most Experienced' },
  { value: 'lowest_fee', label: 'Lowest Fee' },
  { value: 'highest_fee', label: 'Highest Fee' },
  { value: 'most_reviewed', label: 'Most Reviewed' },
];

function FindLawyerContent() {
  const searchParams = useSearchParams();
  const [allLawyers, setAllLawyers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    specializationId: searchParams.get('specializationId') || '',
    city: searchParams.get('city') || '',
    minFee: '',
    maxFee: '',
    minExperience: '',
    rating: '',
    sortBy: 'rating',
  });

  // Load practice areas
  useEffect(() => {
    let isMounted = true;
    supabase.from('practice_areas').select('*').then(({ data }) => {
      if (isMounted && data) setCategories(data);
    });
    return () => { isMounted = false; };
  }, []);

  // Fetch all lawyers from database
  useEffect(() => {
    let isMounted = true;
    const fetchLawyers = async () => {
      try {
        const { data, error } = await supabase
          .from('lawyers')
          .select('*, profiles(*), practice_areas(*)');

        if (error) throw error;
        if (isMounted) {
          setAllLawyers(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching lawyers:', err);
        if (isMounted) setLoading(false);
      }
    };
    fetchLawyers();
    return () => { isMounted = false; };
  }, []);

  // Filter & Sort logic
  const filteredAndSortedLawyers = useMemo(() => {
    return allLawyers.filter(lawyer => {
      const profile = lawyer.profiles || {};
      const area = lawyer.practice_areas || {};
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
      const bio = (lawyer.bio || '').toLowerCase();
      const bar = (lawyer.bar_number || '').toLowerCase();
      const areaName = (area.name || '').toLowerCase();
      const city = (profile.city || lawyer.city || '').toLowerCase();

      // Search query filter (matches name, bio, bar no, practice area, or city)
      if (filters.search) {
        const q = filters.search.trim().toLowerCase();
        const matchesSearch =
          fullName.includes(q) ||
          bio.includes(q) ||
          bar.includes(q) ||
          areaName.includes(q) ||
          city.includes(q);
        if (!matchesSearch) return false;
      }

      // Specialization filter
      if (filters.specializationId && lawyer.practice_area_id !== filters.specializationId) {
        return false;
      }

      // City filter
      if (filters.city && !city.includes(filters.city.toLowerCase())) {
        return false;
      }

      // Fee filters
      const fee = lawyer.consultation_fee || lawyer.consultationFee || 0;
      if (filters.minFee && fee < Number(filters.minFee)) return false;
      if (filters.maxFee && fee > Number(filters.maxFee)) return false;

      // Experience filter
      const exp = lawyer.years_experience || lawyer.yearsOfExperience || 0;
      if (filters.minExperience && exp < Number(filters.minExperience)) return false;

      // Rating filter
      const rating = lawyer.rating || 4.8;
      if (filters.rating && rating < Number(filters.rating)) return false;

      return true;
    }).sort((a, b) => {
      const ratingA = a.rating || 4.8;
      const ratingB = b.rating || 4.8;
      const expA = a.years_experience || 0;
      const expB = b.years_experience || 0;
      const feeA = a.consultation_fee || 0;
      const feeB = b.consultation_fee || 0;
      const reviewsA = a.total_reviews || 0;
      const reviewsB = b.total_reviews || 0;

      if (filters.sortBy === 'experience') return expB - expA;
      if (filters.sortBy === 'lowest_fee') return feeA - feeB;
      if (filters.sortBy === 'highest_fee') return feeB - feeA;
      if (filters.sortBy === 'most_reviewed') return reviewsB - reviewsA;
      return ratingB - ratingA; // default: highest rated
    });
  }, [allLawyers, filters]);

  // Pagination calculation
  const LIMIT = 12;
  const total = filteredAndSortedLawyers.length;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const paginatedLawyers = useMemo(() => {
    const from = (page - 1) * LIMIT;
    return filteredAndSortedLawyers.slice(from, from + LIMIT);
  }, [filteredAndSortedLawyers, page]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      specializationId: '',
      city: '',
      minFee: '',
      maxFee: '',
      minExperience: '',
      rating: '',
      sortBy: 'rating',
    });
    setPage(1);
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>Find a Lawyer</h1>
          <p className={styles.pageSubtitle}>
            Search from verified legal professionals across Bangladesh
          </p>
          <div className={styles.quickSearch}>
            <input
              type="text"
              placeholder="Search by name, specialization, keyword..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className={styles.quickSearchInput}
            />
            <select
              value={filters.city}
              onChange={e => handleFilterChange('city', e.target.value)}
              className={styles.quickSearchSelect}
            >
              <option value="">All Cities</option>
              <option value="Dhaka">Dhaka</option>
              <option value="Chittagong">Chittagong</option>
              <option value="Sylhet">Sylhet</option>
              <option value="Rajshahi">Rajshahi</option>
              <option value="Khulna">Khulna</option>
            </select>
          </div>
        </div>
      </div>

      <div className={`${styles.container} ${styles.layoutGrid}`}>
        <aside className={`${styles.sidebar} ${filtersOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHeader}>
            <h3>Filters</h3>
            <button onClick={resetFilters} className={styles.resetBtn}>Reset All</button>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Practice Area</label>
            <select
              value={filters.specializationId}
              onChange={e => handleFilterChange('specializationId', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Areas</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Consultation Fee (৳)</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                placeholder="Min"
                value={filters.minFee}
                onChange={e => handleFilterChange('minFee', e.target.value)}
                className={styles.filterInput}
              />
              <span className={styles.rangeSep}>—</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxFee}
                onChange={e => handleFilterChange('maxFee', e.target.value)}
                className={styles.filterInput}
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Min. Experience (years)</label>
            <input
              type="number"
              placeholder="e.g. 5"
              value={filters.minExperience}
              onChange={e => handleFilterChange('minExperience', e.target.value)}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Minimum Rating</label>
            <div className={styles.ratingOptions}>
              {[4.5, 4, 3.5, 3].map(r => (
                <button
                  key={r}
                  type="button"
                  className={`${styles.ratingBtn} ${filters.rating === String(r) ? styles.ratingActive : ''}`}
                  onClick={() => handleFilterChange('rating', filters.rating === String(r) ? '' : String(r))}
                >
                  ⭐ {r}+
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <p className={styles.resultCount}>
              {loading ? 'Searching...' : `${total} lawyers found`}
            </p>
            <div className={styles.sortBar}>
              <button type="button" className={styles.filterToggle} onClick={() => setFiltersOpen(!filtersOpen)}>
                ⚙️ Filters
              </button>
              <select
                value={filters.sortBy}
                onChange={e => handleFilterChange('sortBy', e.target.value)}
                className={styles.sortSelect}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className={styles.lawyersGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.lawyerCardSkeleton}>
                  <div className={`skeleton ${styles.skeletonAvatar}`} />
                  <div style={{ flex: 1 }}>
                    <div className={`skeleton ${styles.skeletonTitle}`} />
                    <div className={`skeleton ${styles.skeletonSubtitle}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedLawyers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3 className="empty-state-title">No Lawyers Found</h3>
              <p>No lawyers match your current search or filter criteria.</p>
              <button onClick={resetFilters} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className={styles.lawyersGrid}>
                {paginatedLawyers.map(lawyer => (
                  <LawyerCard key={lawyer.id} lawyer={lawyer} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    ← Previous
                  </button>
                  <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
                  <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function FindLawyerPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem', color: '#6B7280' }}>Loading lawyer search...</div>}>
          <FindLawyerContent />
        </Suspense>
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
  const reviews = lawyer.total_reviews ?? lawyer.totalReviews ?? 15;
  const experience = lawyer.years_experience ?? lawyer.yearsOfExperience ?? 5;
  const fee = lawyer.consultation_fee ?? lawyer.consultationFee ?? 1500;
  const specName = lawyer.practice_areas?.name || (lawyer.specializations?.[0]?.specialization?.name) || 'General Practice';

  return (
    <div className={styles.lawyerCard}>
      <div className={styles.lawyerCardLeft}>
        <div className={styles.lawyerAvatar}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt={`${firstName} ${lastName}`} />
        </div>
      </div>
      <div className={styles.lawyerCardRight}>
        <div className={styles.lawyerCardRow1}>
          <div>
            <h3 className={styles.lawyerName}>
              {firstName} {lastName}
              <span className={styles.verifiedTag}>✓ Verified</span>
            </h3>
            <p className={styles.lawyerTitle}>{lawyer.bio ? (lawyer.bio.length > 70 ? lawyer.bio.slice(0, 70) + '...' : lawyer.bio) : 'Supreme Court Advocate'}</p>
          </div>
          <div className={styles.lawyerFee}>
            <span className={styles.feeAmount}>৳ {Number(fee).toLocaleString()}</span>
            <span className={styles.feeUnit}>/session</span>
          </div>
        </div>

        <div className={styles.lawyerCardRow2}>
          <div className={styles.lawyerSpecializations}>
            <span className={styles.specTag}>{specName}</span>
          </div>
          <div className={styles.lawyerMeta}>
            <span>📍 {city}</span>
            <span>⭐ {Number(rating).toFixed(1)} ({reviews} reviews)</span>
            <span>⚖️ {experience} years</span>
          </div>
        </div>

        <div className={styles.lawyerCardRow3}>
          <div className={styles.consultTypes}>
            <span className={styles.consultTag}>📹 Video</span>
            <span className={styles.consultTag}>📞 Audio</span>
            <span className={styles.consultTag}>💬 Chat</span>
            <span className={styles.consultTag}>🏢 In-Person</span>
          </div>
          <Link href={`/lawyers/${lawyer.id}`} className="btn btn-primary btn-sm">
            View Profile & Book
          </Link>
        </div>
      </div>
    </div>
  );
}

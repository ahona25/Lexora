'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/utils/supabase/client';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Fetch practice areas with lawyer count per category
      const { data: areas } = await supabase.from('practice_areas').select('*');
      const { data: lawyerCounts } = await supabase.from('lawyers').select('practice_area_id');

      if (areas) {
        const withCounts = areas.map(area => ({
          ...area,
          lawyerCount: lawyerCounts?.filter(l => l.practice_area_id === area.id).length || 0
        }));
        setCategories(withCounts);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '7rem 1.5rem 4rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
            <span className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>Practice Areas</span>
            <h1 className="font-serif" style={{ fontSize: '2.5rem', color: '#FFF', marginBottom: '0.75rem' }}>
              Legal Categories
            </h1>
            <p style={{ color: '#6B7280', fontSize: '1rem' }}>
              Explore our full range of legal specializations practiced by Bangladeshâ€™s top advocates.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#6B7280', padding: '3rem' }}>Loading categories...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/find-lawyer?specializationId=${cat.id}`}
                  className="card card-hover"
                  style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                >
                  <div style={{ fontSize: '2rem' }}>{cat.icon || '⚖️'}</div>
                  <h3 className="font-serif" style={{ fontSize: '1.2rem', color: '#FFF' }}>{cat.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.5, flex: 1 }}>
                    {cat.description || 'Expert legal advice and representation.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #1A1A1A', fontSize: '0.8rem' }}>
                    <span style={{ color: '#FFFFFF' }}>{cat.lawyerCount || 1} Lawyers Available</span>
                    <span style={{ color: '#FFF', fontWeight: 600 }}>Explore →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

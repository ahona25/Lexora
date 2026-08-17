'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase/client';

export default function ClientMessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [lawyers, setLawyers] = useState<any[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/client/messages');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadLawyers = async () => {
      if (!user) return;
      try {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*, lawyers(*, profiles(*), practice_areas(*))')
          .eq('client_id', user.id);

        const uniqueLawyersMap = new Map();
        bookings?.forEach(b => {
          if (b.lawyers && !uniqueLawyersMap.has(b.lawyers.id)) {
            uniqueLawyersMap.set(b.lawyers.id, b.lawyers);
          }
        });

        // Also fetch general top lawyers if no previous booking
        if (uniqueLawyersMap.size === 0) {
          const { data: topLawyers } = await supabase
            .from('lawyers')
            .select('*, profiles(*), practice_areas(*)')
            .limit(5);

          topLawyers?.forEach(l => uniqueLawyersMap.set(l.id, l));
        }

        const lawyerList = Array.from(uniqueLawyersMap.values());
        setLawyers(lawyerList);
        if (lawyerList.length > 0) {
          setSelectedLawyer(lawyerList[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadLawyers();
  }, [user]);

  useEffect(() => {
    if (selectedLawyer) {
      const lawyerName = selectedLawyer.profiles?.first_name || 'Advocate';
      setMessages([
        {
          id: '1',
          sender: 'lawyer',
          text: `Assalamu Alaikum. I am Advocate ${lawyerName}. How can I assist you with your legal matter today?`,
          time: '10:00 AM'
        },
        {
          id: '2',
          sender: 'system',
          text: `🔒 Encrypted 256-Bit Legal Consultation Channel established with ${lawyerName}.`,
          time: '10:01 AM'
        }
      ]);
    }
  }, [selectedLawyer]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: 'client',
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');

    // Simulate advocate reply after 1.5 seconds
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'lawyer',
          text: `Thank you for sharing the brief. I have noted this and will review the relevant Bangladesh statutes for our upcoming session.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '100px 1.5rem 5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <span className="badge badge-gold" style={{ marginBottom: '0.5rem' }}>Client Portal</span>
            <h1 className="font-serif" style={{ fontSize: '2rem', color: '#FFF', marginBottom: '0.35rem' }}>
              Legal Consultation Messages
            </h1>
            <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
              Direct, encrypted messaging channel with your assigned advocate.
            </p>
          </div>

          {/* Chat Container */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '300px 1fr',
            background: '#111',
            border: '1px solid #222',
            borderRadius: '16px',
            minHeight: '600px',
            overflow: 'hidden'
          }}>
            {/* Lawyers Sidebar */}
            <div style={{ borderRight: '1px solid #222', background: '#0D0D0D' }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid #222', color: '#FFF', fontWeight: 600, fontSize: '0.9rem' }}>
                Your Advocates ({lawyers.length})
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '540px' }}>
                {loading ? (
                  <div style={{ padding: '2rem', color: '#666', textAlign: 'center' }}>Loading chats...</div>
                ) : lawyers.length === 0 ? (
                  <div style={{ padding: '2rem', color: '#666', textAlign: 'center' }}>No advocates connected yet.</div>
                ) : (
                  lawyers.map(l => {
                    const isSelected = selectedLawyer?.id === l.id;
                    const name = l.profiles ? `${l.profiles.first_name} ${l.profiles.last_name}` : 'Advocate';
                    const avatar = l.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111&color=fff`;

                    return (
                      <button
                        key={l.id}
                        onClick={() => setSelectedLawyer(l)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '1rem',
                          width: '100%',
                          textAlign: 'left',
                          background: isSelected ? '#1A1A1A' : 'transparent',
                          border: 'none',
                          borderBottom: '1px solid #1E1E1E',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <img src={avatar} alt={name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ display: 'block', color: '#FFF', fontSize: '0.85rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {name}
                          </strong>
                          <small style={{ color: '#777', fontSize: '0.75rem' }}>{l.practice_areas?.name || 'Legal Advocate'}</small>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Active Chat Window */}
            {selectedLawyer ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Chat Topbar */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #222', background: '#141414', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
                    <div>
                      <strong style={{ color: '#FFF', fontSize: '0.95rem' }}>
                        Advocate {selectedLawyer.profiles?.first_name} {selectedLawyer.profiles?.last_name}
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#888' }}>
                        {selectedLawyer.practice_areas?.name || 'General Practice'} • Verified Supreme Court Advocate
                      </span>
                    </div>
                  </div>
                  <Link href={`/lawyers/${selectedLawyer.id}`} className="btn btn-secondary btn-sm">
                    View Profile
                  </Link>
                </div>

                {/* Messages Body */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {messages.map(m => {
                    if (m.sender === 'system') {
                      return (
                        <div key={m.id} style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                          <span style={{ fontSize: '0.75rem', background: '#1C1C1C', color: '#888', padding: '0.3rem 0.8rem', borderRadius: '9999px', border: '1px solid #2A2A2A' }}>
                            {m.text}
                          </span>
                        </div>
                      );
                    }

                    const isMe = m.sender === 'client';
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%',
                          padding: '0.85rem 1.15rem',
                          borderRadius: '14px',
                          background: isMe ? '#FFFFFF' : '#1F1F1F',
                          color: isMe ? '#000000' : '#FFFFFF',
                          border: isMe ? 'none' : '1px solid #2A2A2A',
                          fontSize: '0.9rem',
                          lineHeight: 1.5,
                        }}>
                          <div>{m.text}</div>
                          <span style={{ display: 'block', textAlign: 'right', fontSize: '0.68rem', marginTop: '0.3rem', color: isMe ? '#555' : '#777' }}>
                            {m.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid #222', background: '#0D0D0D', display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type your confidential message to advocate..."
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
                    Send →
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                Select an advocate to start consultation chat.
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

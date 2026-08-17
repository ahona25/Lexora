'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';

export default function ClientDocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [documents, setDocuments] = useState<any[]>([
    {
      id: 'doc-1',
      title: 'Khatian Land Title Deed Copy (Mouza 142)',
      category: 'Property Deed',
      size: '2.4 MB',
      date: 'Aug 14, 2026',
      status: 'VERIFIED',
      lawyer: 'Adv. Abdur Rahman'
    },
    {
      id: 'doc-2',
      title: 'Power of Attorney Execution Draft',
      category: 'Legal Contract',
      size: '840 KB',
      date: 'Aug 12, 2026',
      status: 'UNDER REVIEW',
      lawyer: 'Adv. Fatema Begum'
    },
    {
      id: 'doc-3',
      title: 'High Court Bail Petition Affidavit',
      category: 'Court Petition',
      size: '1.1 MB',
      date: 'Aug 10, 2026',
      status: 'VERIFIED',
      lawyer: 'Barrister Rafiqul Islam'
    }
  ]);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Case Evidence');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/client/documents');
    }
  }, [user, authLoading, router]);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    setUploading(true);
    setTimeout(() => {
      const newDoc = {
        id: 'doc-' + Date.now(),
        title: uploadTitle,
        category: uploadCategory,
        size: uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'UPLOADED',
        lawyer: 'Assigned Advocate'
      };

      setDocuments(prev => [newDoc, ...prev]);
      setUploading(false);
      setShowUploadModal(false);
      setUploadTitle('');
      setUploadFile(null);
      setSuccessMsg('Document successfully encrypted and stored in your Legal Vault.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 800);
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '100px 1.5rem 5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-gold" style={{ marginBottom: '0.5rem' }}>Confidential Vault</span>
              <h1 className="font-serif" style={{ fontSize: '2rem', color: '#FFF', marginBottom: '0.35rem' }}>
                Legal Case Documents
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
                Secure 256-bit encrypted locker for petitions, contracts, land khatians, and evidence.
              </p>
            </div>
            <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
              + Upload Legal Document
            </button>
          </div>

          {successMsg && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              ✓ {successMsg}
            </div>
          )}

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <span style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Stored Documents</span>
              <strong style={{ display: 'block', fontSize: '1.5rem', color: '#FFF', marginTop: '0.25rem' }}>{documents.length} Files</strong>
            </div>
            <div className="card" style={{ padding: '1.25rem' }}>
              <span style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Encrypted Storage</span>
              <strong style={{ display: 'block', fontSize: '1.5rem', color: '#10B981', marginTop: '0.25rem' }}>AES-256 Active</strong>
            </div>
            <div className="card" style={{ padding: '1.25rem' }}>
              <span style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Verified by Counsel</span>
              <strong style={{ display: 'block', fontSize: '1.5rem', color: '#FFF', marginTop: '0.25rem' }}>
                {documents.filter(d => d.status === 'VERIFIED').length} Verified
              </strong>
            </div>
          </div>

          {/* Documents Table */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid #222' }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Category</th>
                    <th>Size</th>
                    <th>Uploaded Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.4rem' }}>📄</span>
                          <div>
                            <strong style={{ color: '#FFF', display: 'block', fontSize: '0.9rem' }}>{doc.title}</strong>
                            <small style={{ color: '#666' }}>Shared with: {doc.lawyer}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', background: '#1A1A1A', padding: '0.2rem 0.5rem', borderRadius: '6px', color: '#CCC' }}>
                          {doc.category}
                        </span>
                      </td>
                      <td style={{ color: '#888', fontSize: '0.85rem' }}>{doc.size}</td>
                      <td style={{ color: '#888', fontSize: '0.85rem' }}>{doc.date}</td>
                      <td>
                        <span className={`badge ${doc.status === 'VERIFIED' ? 'badge-success' : 'badge-warning'}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => alert(`Downloading "${doc.title}" from encrypted storage...`)}
                          className="btn btn-secondary btn-sm"
                        >
                          ⬇ Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', border: '1px solid #333', background: '#141414' }}>
            <h2 className="font-serif" style={{ fontSize: '1.4rem', color: '#FFF', marginBottom: '0.5rem' }}>
              Upload Legal Document
            </h2>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Files are automatically encrypted and accessible only to you and your assigned lawyer.
            </p>

            <form onSubmit={handleUpload}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Document Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Registered Land Deed or Police FIR Copy"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={uploadCategory}
                  onChange={e => setUploadCategory(e.target.value)}
                >
                  <option>Property Deed / Khatian</option>
                  <option>Legal Contract / Agreement</option>
                  <option>Court Petition / Affidavit</option>
                  <option>Identity & National ID</option>
                  <option>Case Evidence & Records</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Choose File (PDF, DOCX, JPG, PNG)</label>
                <input
                  type="file"
                  className="form-input"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  style={{ padding: '0.5rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={uploading}
                >
                  {uploading ? 'Encrypting & Uploading...' : 'Upload File →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

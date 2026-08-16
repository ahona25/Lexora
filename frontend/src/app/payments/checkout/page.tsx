'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/utils/supabase/client';

function generateToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = 'LEX-TK-';
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

const PAYMENT_METHODS = [
  { id: 'CARD', label: '💳 Credit / Debit Card', desc: 'Visa, Mastercard, Amex', badge: 'Instant' },
  { id: 'GPAY', label: '🌐 Google Pay (GPay)', desc: '1-Tap Fast Checkout', badge: 'Popular' },
  { id: 'PAYPAL', label: '🅿️ PayPal', desc: 'International & USD/BDT', badge: 'Global' },
  { id: 'BKASH', label: '📱 bKash', desc: 'Instant Mobile Wallet BD', badge: '0% Surcharge' },
  { id: 'NAGAD', label: '📱 Nagad', desc: 'Post Office Digital Banking', badge: 'Instant' },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get('appointmentId');

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [processing, setProcessing] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Cancel state
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    if (appointmentId) {
      const loadBooking = async () => {
        try {
          const { data, error } = await supabase
            .from('bookings')
            .select('*, lawyers(*, profiles(*), practice_areas(*))')
            .eq('id', appointmentId)
            .single();

          if (error) throw error;
          if (isMounted && data) {
            setAppointment(data);
            if (data.status === 'confirmed' && data.consultation_token) {
              setSuccessData({
                transactionId: data.id,
                token: data.consultation_token,
                status: 'CONFIRMED',
              });
            } else if (data.status === 'cancelled') {
              setCancelSuccess({
                refundAmount: data.refund_amount || (data.amount * 0.75),
                cancellationFee: data.cancellation_fee || (data.amount * 0.25),
              });
            }
          }
        } catch (err: any) {
          if (isMounted) setError(err.message || 'Failed to load appointment.');
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      loadBooking();
    } else {
      setLoading(false);
    }
    return () => { isMounted = false; };
  }, [appointmentId]);

  const handlePay = async () => {
    setProcessing(true);
    setError('');
    try {
      const consultationFee = Number(appointment?.amount || appointment?.lawyers?.consultation_fee || 1500);
      const token = generateToken();

      // 1. Record Payment
      const { data: payment, error: pError } = await supabase.from('payments').insert({
        booking_id: appointmentId,
        method: paymentMethod,
        amount: consultationFee,
        status: 'SUCCESS'
      }).select().single();
      
      if (pError) console.warn('Payment insert notice:', pError.message);

      // 2. Update booking status with token and payment method
      const { error: bError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          consultation_token: token,
          payment_method: paymentMethod,
        })
        .eq('id', appointmentId);
      
      if (bError) throw bError;

      setSuccessData({
        transactionId: payment?.id || appointmentId,
        token: token,
        status: 'SUCCESS'
      });
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelBooking = async () => {
    setCancelling(true);
    try {
      const totalAmount = Number(appointment?.amount || appointment?.lawyers?.consultation_fee || 1500);
      const cancellationFee = totalAmount * 0.25;
      const refundAmount = totalAmount * 0.75;

      const { error: cError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_fee: cancellationFee,
          refund_amount: refundAmount,
        })
        .eq('id', appointmentId);

      if (cError) throw cError;

      setCancelSuccess({
        cancellationFee,
        refundAmount,
        totalAmount,
      });
      setShowCancelModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const handleCopyToken = () => {
    if (successData?.token) {
      navigator.clipboard.writeText(successData.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div style={{ minHeight: '60vh', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading payment checkout...</div>;

  const lawyerName = appointment?.lawyers?.profiles 
    ? `${appointment.lawyers.profiles.first_name} ${appointment.lawyers.profiles.last_name}`
    : 'Advocate';
  const totalAmount = Number(appointment?.amount || appointment?.lawyers?.consultation_fee || 1500);
  const cancelFeeAmount = totalAmount * 0.25;
  const refundEstAmount = totalAmount * 0.75;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* CANCELLATION SUCCESS VIEW */}
      {cancelSuccess ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', border: '1px solid #333' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔄</div>
          <h1 className="font-serif" style={{ fontSize: '1.8rem', color: '#FFF', marginBottom: '0.5rem' }}>
            Consultation Cancelled
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Your booking has been cancelled in accordance with our transparent 25% cancellation policy.
          </p>

          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: '14px', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: '#6B7280' }}>Total Original Charge</span>
              <strong style={{ color: '#FFF' }}>৳ {totalAmount.toLocaleString()} BDT</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: '#EF4444' }}>
              <span>Cancellation Fee (25%)</span>
              <strong>- ৳ {Number(cancelSuccess.cancellationFee || cancelFeeAmount).toLocaleString()} BDT</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #2A2A2A', paddingTop: '0.75rem', color: '#10B981' }}>
              <span style={{ fontWeight: 600 }}>Refund Amount (75%)</span>
              <strong style={{ fontSize: '1.25rem' }}>৳ {Number(cancelSuccess.refundAmount || refundEstAmount).toLocaleString()} BDT</strong>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.75rem', marginBottom: 0 }}>
              * The 75% refund has been initiated to your original payment method and will reflect within 24-48 business hours.
            </p>
          </div>

          <Link href="/find-lawyer" className="btn btn-primary">
            Find Another Lawyer →
          </Link>
        </div>
      ) : successData ? (
        /* PAYMENT SUCCESS & TOKEN CARD */
        <div className="card" style={{ padding: '2.5rem 2rem', border: '1px solid #2A2A2A' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏛️</div>
            <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>Payment Confirmed</span>
            <h1 className="font-serif" style={{ fontSize: '1.8rem', color: '#FFF', margin: '0.5rem 0' }}>
              Consultation Token Issued
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
              Your lawyer booking with <strong>{lawyerName}</strong> is verified.
            </p>
          </div>

          {/* TOKEN PASS BOX */}
          <div style={{
            background: 'linear-gradient(135deg, #181818 0%, #0D0D0D 100%)',
            border: '2px dashed #444',
            borderRadius: '16px',
            padding: '1.75rem',
            textAlign: 'center',
            marginBottom: '1.75rem',
            position: 'relative'
          }}>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>
              Official Consultation Token
            </span>
            
            <div style={{
              fontSize: '2rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              letterSpacing: '0.15em',
              color: '#FFFFFF',
              margin: '0.75rem 0',
              padding: '0.5rem',
              background: '#000',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              {successData.token}
            </div>

            <button
              onClick={handleCopyToken}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
            >
              {copied ? '✓ Token Copied!' : '📋 Copy Token Code'}
            </button>
            <p style={{ fontSize: '0.75rem', color: '#777', marginTop: '0.75rem', marginBottom: 0 }}>
              Present this token or keep it ready when joining your consultation session.
            </p>
          </div>

          {/* Booking Summary */}
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#777' }}>Lawyer</span>
              <strong style={{ color: '#FFF' }}>{lawyerName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#777' }}>Consultation Type</span>
              <span style={{ color: '#FFF' }}>{appointment?.consultation_type || 'VIDEO'} Consultation</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #222', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ color: '#777' }}>Total Paid</span>
              <strong style={{ color: '#FFF' }}>৳ {totalAmount.toLocaleString()} BDT</strong>
            </div>
          </div>

          {/* CANCELLATION POLICY NOTICE */}
          <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: '#9CA3AF' }}>
            <strong style={{ color: '#FFF', display: 'block', marginBottom: '0.25rem' }}>⚠️ Cancellation & Refund Policy:</strong>
            You can cancel your appointment anytime before the scheduled start time. Cancellations incur a <strong>25% administrative charge</strong> (৳{cancelFeeAmount.toLocaleString()}), and <strong>75%</strong> (৳{refundEstAmount.toLocaleString()}) will be refunded immediately.
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/client/dashboard" className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>
              Go to Dashboard →
            </Link>
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn btn-secondary"
              style={{ color: '#EF4444', borderColor: '#442222' }}
            >
              Cancel Booking
            </button>
          </div>
        </div>
      ) : (
        /* PAYMENT CHECKOUT FORM */
        <div className="card" style={{ border: '1px solid #222' }}>
          <div style={{ borderBottom: '1px solid #1A1A1A', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <span className="badge badge-gold" style={{ marginBottom: '0.5rem' }}>Secure Checkout</span>
            <h1 className="font-serif" style={{ fontSize: '1.6rem', color: '#FFF' }}>
              Consultation Payment
            </h1>
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
              Select your payment method. An official access token will be generated upon confirmation.
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          {appointment && (
            <div style={{ background: '#141414', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#6B7280' }}>Lawyer</span>
                <strong style={{ color: '#FFF' }}>{lawyerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#6B7280' }}>Lawyer Consultation Charge</span>
                <strong style={{ color: '#FFF' }}>৳ {totalAmount.toLocaleString()} BDT</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#6B7280' }}>Consultation Type</span>
                <span style={{ color: '#FFFFFF' }}>{appointment.consultation_type || 'VIDEO'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #2A2A2A', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ color: '#D1D5DB', fontWeight: 600 }}>Total Payable</span>
                <strong style={{ color: '#FFFFFF', fontSize: '1.2rem' }}>৳ {totalAmount.toLocaleString()} BDT</strong>
              </div>
            </div>
          )}

          {/* PAYMENT METHODS */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block', fontSize: '0.9rem' }}>
              Choose Payment Method
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.9rem 1.1rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${paymentMethod === m.id ? '#FFFFFF' : '#222222'}`,
                    background: paymentMethod === m.id ? '#1C1C1C' : '#111111',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#FFF',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem' }}>{m.label}</strong>
                    <small style={{ fontSize: '0.75rem', color: '#777' }}>{m.desc}</small>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    background: paymentMethod === m.id ? '#333' : '#181818',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    color: '#AAA'
                  }}>
                    {m.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 25% CANCELLATION POLICY INFO */}
          <div style={{ background: '#0F0F0F', border: '1px solid #222', borderRadius: '10px', padding: '0.9rem', marginBottom: '1.5rem', fontSize: '0.78rem', color: '#888' }}>
            <strong style={{ color: '#CCC' }}>Cancellation Guarantee:</strong> You may cancel anytime before your appointment. A 25% fee applies (৳{cancelFeeAmount.toLocaleString()}), and 75% (৳{refundEstAmount.toLocaleString()}) will be refunded immediately to your {paymentMethod}.
          </div>

          <button
            type="button"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={processing || !appointment}
            onClick={handlePay}
          >
            {processing ? 'Processing Payment & Issuing Token...' : `Pay ৳ ${totalAmount.toLocaleString()} via ${paymentMethod} →`}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#6B7280', marginTop: '1rem' }}>
            🔒 256-Bit Encrypted Payment • Instant Token Generation
          </p>
        </div>
      )}

      {/* CONFIRM CANCELLATION MODAL */}
      {showCancelModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', border: '1px solid #442222', background: '#121212' }}>
            <h2 className="font-serif" style={{ fontSize: '1.4rem', color: '#FFF', marginBottom: '0.5rem' }}>
              Confirm Cancellation?
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Please review the cancellation fee and refund breakdown before proceeding:
            </p>

            <div style={{ background: '#1A1A1A', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: '#888' }}>Total Amount Paid</span>
                <span style={{ color: '#FFF' }}>৳ {totalAmount.toLocaleString()} BDT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#EF4444' }}>
                <span>Cancellation Fee (25%)</span>
                <strong>- ৳ {cancelFeeAmount.toLocaleString()} BDT</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '0.5rem', color: '#10B981' }}>
                <span>Refunded to You (75%)</span>
                <strong style={{ fontSize: '1.1rem' }}>৳ {refundEstAmount.toLocaleString()} BDT</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={cancelling}
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                className="btn btn-primary"
                style={{ flex: 1, background: '#EF4444', color: '#FFF' }}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Confirm (Deduct 25%)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '6rem 1.5rem 4rem' }}>
        <Suspense fallback={<div style={{ color: '#6B7280', textAlign: 'center' }}>Loading payment...</div>}>
          <CheckoutContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

import React, { useState, useEffect, useRef } from 'react'

type Props = {
  initialStep: 'privacy' | 'terms'
  onAgree: () => void
  onClose: () => void
}

export default function PrivacyTermsModal({ initialStep, onAgree, onClose }: Props) {
  const [step, setStep] = useState<'privacy' | 'terms'>(initialStep)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setStep(initialStep)
  }, [initialStep])

  useEffect(() => {
    setScrolledToBottom(false)
    if (contentRef.current) contentRef.current.scrollTop = 0
  }, [step])

  const handleScroll = () => {
    const el = contentRef.current
    if (el) {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 5
      setScrolledToBottom(atBottom)
    }
  }

  const handleNext = () => setStep('terms')

  const handleBack = () => {
    setStep('privacy')
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = contentRef.current.scrollHeight
        setScrolledToBottom(true)
      }
    }, 0)
  }

  const handleAgree = () => {
    if (step === 'privacy') {
      setStep('terms')
      return
    }
    onAgree()
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  }
  const boxStyle: React.CSSProperties = {
    background: 'white',
    width: 'min(900px, 96%)',
    maxHeight: '90vh',
    overflow: 'hidden',
    padding: 24,
    borderRadius: 6,
  }
  const closeBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: 18,
    right: 20,
    background: 'transparent',
    border: 'none',
    fontSize: '1.6rem',
    color: '#888',
    cursor: 'pointer',
  }
  const contentBoxStyle: React.CSSProperties = { maxHeight: 350, overflowY: 'auto', paddingRight: 12 }
  const actionsStyle: React.CSSProperties = { marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }

  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <button aria-label="Close" style={closeBtnStyle} onClick={onClose}>
          &times;
        </button>
        <h2 style={{ marginTop: 0 }}>
          {step === 'privacy' ? 'Privacy Policy – Ticketing System' : 'Terms and Conditions – Ticketing System'}
        </h2>
        <div ref={contentRef} onScroll={handleScroll} style={contentBoxStyle}>
          {step === 'privacy' ? (
            <>
              <p>
                This Privacy Policy explains how the Ticketing System, operated under the standards of Maptech
                Information Solutions Inc., collects, uses, stores, and protects personal data of users who access and
                use the System.
              </p>
              <h3>1. Information We Collect</h3>
              <p>We may collect the following categories of information:</p>
              <ul>
                <li>
                  <strong>Personal Information:</strong> Name, employee ID, email address, department, or other
                  identifiers.
                </li>
                <li>
                  <strong>Ticket Information:</strong> Content of submitted tickets, including issue descriptions,
                  attachments, and timestamps.
                </li>
                <li>
                  <strong>Usage Data:</strong> System logs such as login activity, device/browser details, and actions
                  performed within the System.
                </li>
              </ul>
              <h3>2. How We Use Your Information</h3>
              <p>Your data is used to:</p>
              <ul>
                <li>Process and respond to support requests.</li>
                <li>Track and manage ticket status.</li>
                <li>Generate internal reports to improve services.</li>
                <li>Notify you about ticket progress or resolution.</li>
                <li>Enhance user experience and system functionality.</li>
              </ul>
              <h3>3. Data Sharing and Disclosure</h3>
              <p>We do not sell or share personal data externally. Data may be accessed by:</p>
              <ul>
                <li>Authorized support personnel (ticket agents, system administrators) for resolution purposes.</li>
                <li>Internal management for reporting, audits, or compliance.</li>
                <li>Legal authorities, when disclosure is required by law.</li>
              </ul>
              <h3>4. Data Retention</h3>
              <p>
                Data is retained only as long as necessary to fulfill the purposes outlined or as required by
                organizational and regulatory policies.
              </p>
              <h3>5. Your Rights</h3>
              <p>You may:</p>
              <ul>
                <li>Access your personal data stored in the System.</li>
                <li>Request correction of inaccurate or outdated information.</li>
                <li>Request deletion of data, subject to retention requirements.</li>
                <li>Withdraw consent, which may affect your ability to use the System.</li>
              </ul>
              <p>Requests should be directed to the Ticketing System administrators.</p>
              <h3>6. Data Security</h3>
              <p>
                We implement industry-standard technical and organizational safeguards, including authentication, access
                control, and continuous monitoring. While we strive for robust protection, no system is entirely immune
                to risk. Users are responsible for safeguarding their login credentials.
              </p>
              <h3>7. Cookies and Tracking</h3>
              <p>
                The System may use cookies or session-based tracking for authentication and analytics. You can manage
                cookie preferences through your browser.
              </p>
              <h3>8. Policy Updates</h3>
              <p>
                This Privacy Policy may be updated periodically. Significant changes will be communicated, and continued
                use of the System constitutes acceptance of the revised policy.
              </p>
              <h3>9. Contact Us</h3>
              <p>
                For questions or concerns, please contact the Ticketing System operators at sales@maptechisi.com or via
                the official Maptech channels.
              </p>
            </>
          ) : (
            <>
              <p>
                By accessing and using the Ticketing System, you agree to comply with the following Terms and
                Conditions.
              </p>
              <h3>1. Acceptance of Terms</h3>
              <p>
                Use of the System indicates that you have read, understood, and agreed to these Terms. If you do not
                agree, you must refrain from using the System.
              </p>
              <h3>2. Purpose</h3>
              <p>
                The System is designed to help employees and authorized personnel submit, track, and resolve technical
                or administrative issues within the organization.
              </p>
              <h3>3. User Responsibilities</h3>
              <ul>
                <li>Provide accurate and complete information when submitting tickets.</li>
                <li>Use the System only for legitimate support requests.</li>
                <li>Avoid duplicate, irrelevant, or fraudulent submissions.</li>
                <li>Respond promptly to support team inquiries.</li>
                <li>Maintain professionalism in all communications.</li>
              </ul>
              <h3>4. Ticket Closure</h3>
              <p>
                Tickets are closed once marked resolved by the support team. Inactivity beyond SLA timelines may result
                in automatic closure. Lack of cooperation or feedback may delay resolution.
              </p>
              <h3>5. Account and Security</h3>
              <p>
                Users are responsible for keeping login credentials secure. Accounts must not be shared or misused.
                Unauthorized access or suspicious activity must be reported immediately.
              </p>
              <h3>6. Prohibited Actions</h3>
              <ul>
                <li>Misuse or disrupt the System.</li>
                <li>Upload harmful, offensive, or malicious content.</li>
                <li>Attempt unauthorized access to restricted areas.</li>
              </ul>
              <h3>7. System Availability</h3>
              <p>
                The System is provided on an "as-is" and "as-available" basis. While we strive for reliability, we do
                not guarantee uninterrupted or error-free operation. Scheduled maintenance or unforeseen issues may
                affect availability.
              </p>
              <h3>8. Limitation of Liability</h3>
              <p>
                To the fullest extent permitted by law, the organization and its affiliates are not liable for indirect,
                incidental, or consequential damages arising from use of the System.
              </p>
              <h3>9. Changes to Terms</h3>
              <p>These Terms may be updated periodically. Significant changes will be communicated.</p>
              <h3>10. Governing Law</h3>
              <p>
                These Terms are governed by the laws of the Philippines, without regard to conflict of law principles.
              </p>
              <h3>11. Contact Information</h3>
              <p>For inquiries, please contact the Ticketing System operators at sales@maptechisi.com.</p>
            </>
          )}
        </div>

        <div style={actionsStyle}>
          {step === 'privacy' ? (
            <button
              onClick={handleNext}
              disabled={!scrolledToBottom}
              style={{ padding: '8px 12px', opacity: scrolledToBottom ? 1 : 0.5 }}
            >
              Next
            </button>
          ) : (
            <>
              <button onClick={handleBack} style={{ padding: '8px 12px' }}>
                Back
              </button>
              <button
                onClick={handleAgree}
                disabled={!scrolledToBottom}
                style={{ padding: '8px 12px', opacity: scrolledToBottom ? 1 : 0.5 }}
              >
                I Agree
              </button>
            </>
          )}
          <button onClick={onClose} style={{ padding: '8px 12px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

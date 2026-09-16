import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';

/**
 * Parses base64 data URI or returns null if remote/invalid
 */
function extractBuffer(dataUrlOrRaw) {
  if (!dataUrlOrRaw) return null;
  if (dataUrlOrRaw.startsWith('data:')) {
    const parts = dataUrlOrRaw.split(';base64,');
    if (parts.length < 2) return null;
    const binaryString = window.atob(parts[1]);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  return null;
}

/**
 * Creates a safe Blob URL for iframe rendering
 */
function createBlobUrl(dataUrlOrRaw, defaultType = 'application/pdf') {
  try {
    if (!dataUrlOrRaw) return '';
    if (!dataUrlOrRaw.startsWith('data:')) return dataUrlOrRaw;
    const parts = dataUrlOrRaw.split(';base64,');
    if (parts.length < 2) return dataUrlOrRaw;
    const contentType = parts[0].split(':')[1] || defaultType;
    const binaryString = window.atob(parts[1]);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: contentType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Error creating blob URL:', err);
    return dataUrlOrRaw;
  }
}

/**
 * Detect file format from name, data URL mime, or magic base64 bytes
 */
function detectFileType(url = '', name = '') {
  const lowerName = (name || '').toLowerCase().trim();
  const lowerUrl = (url || '').toLowerCase().trim();

  if (lowerName.endsWith('.docx')) return 'docx';
  if (lowerName.endsWith('.doc')) return 'doc';
  if (lowerName.endsWith('.pdf')) return 'pdf';
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(lowerName)) return 'image';
  if (lowerName.endsWith('.txt')) return 'txt';

  if (lowerUrl.includes('wordprocessingml') || lowerUrl.includes('officedocument.wordprocessingml')) return 'docx';
  if (lowerUrl.includes('application/msword')) return 'doc';
  if (lowerUrl.includes('application/pdf')) return 'pdf';
  if (lowerUrl.includes('data:image/')) return 'image';
  if (lowerUrl.includes('text/plain')) return 'txt';

  // Base64 magic headers
  if (url.includes(';base64,')) {
    const rawBase64 = url.split(';base64,')[1] || '';
    if (rawBase64.startsWith('JVBERi0')) return 'pdf'; // %PDF-
    if (rawBase64.startsWith('UEsDB')) return 'docx';   // PK ZIP (docx)
    if (rawBase64.startsWith('0M8R4')) return 'doc';    // OLE Compound (doc)
    if (rawBase64.startsWith('/9j/')) return 'image';   // JPEG
    if (rawBase64.startsWith('iVBORw0KGgo')) return 'image'; // PNG
  }

  return 'pdf';
}

export default function ResumePreviewModal({ previewResume, onClose }) {
  const docxContainerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');

  const name = previewResume?.name || 'Candidate';
  const resumeName = previewResume?.resumeName || 'Resume';
  const resumeUrl = previewResume?.resumeUrl || '';
  const fileType = detectFileType(resumeUrl, resumeName);

  useEffect(() => {
    if (!previewResume) {
      return;
    }

    if (!resumeUrl) {
      setLoading(true);
      setError(null);
      return;
    }

    let isCancelled = false;
    let blobUrlToRevoke = null;

    const renderDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!resumeUrl) {
          setError('No resume file data available to preview.');
          setLoading(false);
          return;
        }

        if (fileType === 'docx') {
          let buffer = extractBuffer(resumeUrl);
          if (!buffer && (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://'))) {
            const resp = await fetch(resumeUrl);
            buffer = await resp.arrayBuffer();
          }

          if (!buffer) {
            throw new Error('Could not parse Word document content.');
          }

          if (docxContainerRef.current) {
            docxContainerRef.current.innerHTML = '';
            await renderAsync(buffer, docxContainerRef.current, null, {
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              breakPages: true,
              renderChanges: false,
              useBase64URL: true,
            });
          }
          if (!isCancelled) setLoading(false);
        } else if (fileType === 'pdf') {
          const url = createBlobUrl(resumeUrl, 'application/pdf');
          if (!isCancelled) {
            setPdfBlobUrl(url);
            blobUrlToRevoke = url;
            setLoading(false);
          }
        } else if (fileType === 'image' || fileType === 'doc') {
          if (!isCancelled) setLoading(false);
        } else {
          // Fallback to iframe blob
          const url = createBlobUrl(resumeUrl, 'application/pdf');
          if (!isCancelled) {
            setPdfBlobUrl(url);
            blobUrlToRevoke = url;
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error rendering document preview:', err);
        if (!isCancelled) {
          setError(err.message || 'Failed to render DOCX preview in browser.');
          setLoading(false);
        }
      }
    };

    renderDocument();

    return () => {
      isCancelled = true;
      if (blobUrlToRevoke && blobUrlToRevoke.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrlToRevoke);
      }
    };
  }, [previewResume, resumeUrl, fileType]);

  const handleOpenInNewTab = () => {
    if (!resumeUrl) return;
    if (fileType === 'pdf') {
      const url = pdfBlobUrl || createBlobUrl(resumeUrl, 'application/pdf');
      window.open(url, '_blank');
    } else if (fileType === 'image') {
      const url = createBlobUrl(resumeUrl, 'image/jpeg');
      window.open(url, '_blank');
    } else {
      // For DOCX/DOC, create a temporary link to open/download
      const a = document.createElement('a');
      a.href = resumeUrl;
      a.download = resumeName || 'document.docx';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getBadgeInfo = () => {
    switch (fileType) {
      case 'docx':
        return { label: 'DOCX Document', icon: '📝', color: '#2563eb', bg: '#eff6ff' };
      case 'doc':
        return { label: 'Legacy Word DOC', icon: '📄', color: '#d97706', bg: '#fef3c7' };
      case 'pdf':
        return { label: 'PDF Document', icon: '🔴', color: '#dc2626', bg: '#fef2f2' };
      case 'image':
        return { label: 'Image Document', icon: '🖼️', color: '#059669', bg: '#ecfdf5' };
      default:
        return { label: 'Document', icon: '📄', color: '#475569', bg: '#f1f5f9' };
    }
  };

  const badge = getBadgeInfo();

  if (!previewResume) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal-content resume-preview-dialog"
        style={{
          maxWidth: '900px',
          width: '94%',
          height: '90vh',
          maxHeight: '90vh',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <span>👁️ Resume Preview</span>
                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>({name})</span>
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  color: badge.color,
                  backgroundColor: badge.bg,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: `1px solid ${badge.color}30`,
                }}
              >
                {badge.icon} {badge.label}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              File: <strong style={{ color: '#334155' }}>{resumeName}</strong>
            </p>
          </div>

          <button
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Close preview modal"
            style={{ position: 'static', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* Content Viewer Area */}
        <div
          className="resume-preview-body"
          style={{
            flex: 1,
            minHeight: '350px',
            background: '#f1f5f9',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid #cbd5e1',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {loading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255, 255, 255, 0.92)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <div className="resume-loading-spinner" />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                Rendering {fileType.toUpperCase()} document preview...
              </p>
            </div>
          )}

          {error ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#64748b', margin: 'auto' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>⚠️</span>
              <h4 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '16px' }}>Inline Preview Unavailable</h4>
              <p style={{ margin: '0 0 16px', fontSize: '13px', maxWidth: '420px' }}>
                {error} You can download the file directly to view it on your device.
              </p>
              <a
                href={resumeUrl}
                download={resumeName || 'resume'}
                className="btn-action-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                ⬇️ Download & Open File
              </a>
            </div>
          ) : fileType === 'docx' ? (
            <div
              className="docx-render-container"
              ref={docxContainerRef}
              style={{
                width: '100%',
                height: '100%',
                overflowY: 'auto',
                padding: '16px',
                background: '#e2e8f0',
                boxSizing: 'border-box',
              }}
            />
          ) : fileType === 'doc' ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#64748b', margin: 'auto' }}>
              <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '12px' }}>📝</span>
              <h4 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '16px' }}>Microsoft Word Document (.doc)</h4>
              <p style={{ margin: '0 0 16px', fontSize: '13px', maxWidth: '420px', lineHeight: 1.5 }}>
                Legacy .doc format requires Word or desktop office software. Download the file or upload modern .docx / .pdf for in-browser interactive rendering.
              </p>
              <a
                href={resumeUrl}
                download={resumeName || 'resume.doc'}
                className="btn-action-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                ⬇️ Download & Open in Word
              </a>
            </div>
          ) : fileType === 'image' ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                overflowY: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                boxSizing: 'border-box',
              }}
            >
              <img
                src={resumeUrl}
                alt={`Resume preview for ${name}`}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            </div>
          ) : (
            <iframe
              src={pdfBlobUrl || createBlobUrl(resumeUrl, 'application/pdf')}
              title={`Resume preview for ${name}`}
              style={{ width: '100%', height: '100%', border: 'none', flex: 1 }}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #e2e8f0',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            className="btn-action-preview"
            onClick={handleOpenInNewTab}
            style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            🔗 Open in New Tab
          </button>
          <a
            href={resumeUrl}
            download={resumeName || (fileType === 'docx' ? 'resume.docx' : 'resume.pdf')}
            className="btn-action-primary"
            style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            ⬇️ Download Resume
          </a>
          <button
            type="button"
            className="btn-action-outline"
            onClick={onClose}
            style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

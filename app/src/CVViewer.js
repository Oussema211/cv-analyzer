import React, { useState, useEffect } from 'react';

function CVViewer({ cv, onAnalyzeCV }) {
  const [pdfError, setPdfError] = useState('');

  useEffect(() => {
    if (!cv.pdfUrl) {
      setPdfError('No PDF available for this CV. Try re-uploading the file or check the server logs for missing file_id.');
      console.warn('CVViewer: Missing pdfUrl for CV:', cv);
      return;
    }

    console.log('CVViewer: Attempting to load PDF from:', cv.pdfUrl);
    fetch(cv.pdfUrl, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        setPdfError('');
      })
      .catch(error => {
        console.error('CVViewer: Error accessing PDF:', error.message);
        setPdfError(`Failed to load PDF: ${error.message}. Verify the file_id in the server logs.`);
      });
  }, [cv.pdfUrl, cv]);

  return (
    <div style={{
      background: '#FFFFFF',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: '#737569ff',
        color: '#232323',
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        {cv.name || 'Unnamed CV'}'s CV
      </div>
      {pdfError ? (
        <div style={{ textAlign: 'center', color: '#FF0000', marginTop: '20px' }}>
          <p>{pdfError}</p>
          {cv.pdfUrl && (
            <p>
              Try <a href={cv.pdfUrl} style={{ color: '#191918ff' }} target="_blank" rel="noopener noreferrer">
                opening the PDF in a new tab
              </a> or check the server.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', height: '600px' }}>
          <div style={{ flex: 1, borderRight: '1px solid #555555' }}>
            <object
              data={cv.pdfUrl}
              type="application/pdf"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              onError={() => {
                setPdfError('Failed to render PDF in browser. The file may be corrupted or inaccessible.');
                console.error('CVViewer: Object tag failed to render PDF for URL:', cv.pdfUrl);
              }}
            >
              <p>
                Unable to display PDF.{' '}
                <a href={cv.pdfUrl} style={{ color: '#191918ff' }} target="_blank" rel="noopener noreferrer">
                  Click here to download
                </a>{' '}
                or view in a new tab.
              </p>
            </object>
          </div>
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            <button
              onClick={onAnalyzeCV}
              style={{
                padding: '10px 20px',
                background: '#191918ff',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              Analyze CV with AI
            </button>
            {cv.analysisResult && (
              <div style={{
                background: '#f5f5f5',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ color: '#000000ff', marginTop: 0 }}>CV Analysis Result</h3>
                <p style={{ color: cv.analysisResult.score >= 80 ? '#008000' : cv.analysisResult.score >= 60 ? '#FFA500' : '#FF0000' }}>
                  {cv.analysisResult.message}
                </p>
                {cv.analysisResult.suggestions && cv.analysisResult.suggestions.length > 0 && (
                  <>
                    <h4 style={{ color: '#000000ff' }}>Suggestions for Improvement:</h4>
                    <ul style={{ paddingLeft: '20px' }}>
                      {cv.analysisResult.suggestions.map((suggestion, index) => (
                        <li key={index} style={{ color: '#333' }}>{suggestion}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CVViewer;
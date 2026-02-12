import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
      setExtractedText('');
    } else {
      setError('אנא בחר קובץ PDF בלבד');
      setFile(null);
    }
  };

  const convertPDFToText = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError('');
    setExtractedText('');

    try {
      setProcessingStep('קורא את הקובץ...');
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
        reader.readAsDataURL(file);
      });

      setProcessingStep('DocuPipe מעבד את המסמך...');
      const ocrResponse = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64Data, filename: file.name })
      });
      if (!ocrResponse.ok) throw new Error('שגיאה ב-DocuPipe');
      const ocrData = await ocrResponse.json();

      setProcessingStep('Claude מתקן ומשפר...');
      const claudeResponse = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ocrData.text })
      });
      if (!claudeResponse.ok) throw new Error('שגיאה ב-Claude');
      const claudeData = await claudeResponse.json();

      setExtractedText(claudeData.text);
      setProcessingStep('');
    } catch (err) {
      setError(err.message || 'שגיאה בהמרת הקובץ');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '24px', direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>המרת PDF לטקסט</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>DocuPipe OCR + Claude</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '16px' }}>העלאת קובץ</h2>
            
            <div style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '40px', textAlign: 'center', marginBottom: '16px', cursor: 'pointer' }} onClick={() => document.getElementById('fileInput').click()}>
              <p>לחץ להעלאת קובץ PDF</p>
              <input id="fileInput" type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>

            {file && <p style={{ color: '#2563eb', marginBottom: '16px' }}>נבחר: {file.name}</p>}
            {error && <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p>}
            {processingStep && <p style={{ color: '#ca8a04', marginBottom: '16px' }}>{processingStep}</p>}

            <button onClick={convertPDFToText} disabled={!file || isProcessing} style={{ width: '100%', padding: '12px', backgroundColor: (!file || isProcessing) ? '#ccc' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: (!file || isProcessing) ? 'not-allowed' : 'pointer', fontSize: '16px' }}>
              {isProcessing ? 'מעבד...' : 'המר לטקסט'}
            </button>
          </div>

          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2>טקסט מחולץ</h2>
              {extractedText && <button onClick={copyToClipboard} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>העתק</button>}
            </div>
            <div style={{ minHeight: '300px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', whiteSpace: 'pre-wrap', textAlign: 'right' }}>
              {extractedText || 'הטקסט יופיע כאן'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (showEditor && typeof window !== 'undefined') {
      const editor = document.getElementById('editor');
      if (editor) {
        editor.focus();
      }
    }
  }, [showEditor]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('אנא בחר קובץ PDF בלבד');
      setFile(null);
    }
  };

  const convertPDFToText = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError('');

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

      setShowEditor(true);
      setProcessingStep('');
      
      setTimeout(() => {
        const editor = document.getElementById('editor');
        if (editor) {
          editor.innerHTML = ocrData.text.replace(/\n/g, '<br>');
        }
      }, 100);

    } catch (err) {
      setError(err.message || 'שגיאה בהמרת הקובץ');
    } finally {
      setIsProcessing(false);
    }
  };

  const execCommand = (command, value) => {
    document.execCommand(command, false, value);
    document.getElementById('editor')?.focus();
  };

  const copyToClipboard = () => {
    const editor = document.getElementById('editor');
    if (editor) {
      navigator.clipboard.writeText(editor.innerText);
    }
  };

  const saveToWord = () => {
    const editor = document.getElementById('editor');
    if (!editor) return;
    const content = editor.innerHTML;
    const header = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>body{direction:rtl;font-family:David,Arial;font-size:12pt;}</style></head><body>';
    const footer = '</body></html>';
    const blob = new Blob([header + content + footer], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'extracted-text.doc';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '24px', direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>המרת PDF לטקסט</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>DocuPipe OCR</p>

        {!showEditor ? (
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '24px' }}>העלאת קובץ PDF</h2>
            
            <div style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '40px', marginBottom: '16px', cursor: 'pointer' }} onClick={() => document.getElementById('fileInput').click()}>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>📄</p>
              <p>לחץ להעלאת קובץ PDF</p>
              <input id="fileInput" type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>

            {file && <p style={{ color: '#2563eb', marginBottom: '16px' }}>נבחר: {file.name}</p>}
            {error && <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p>}
            {processingStep && <p style={{ color: '#ca8a04', marginBottom: '16px' }}>{processingStep}</p>}

            <button onClick={convertPDFToText} disabled={!file || isProcessing} style={{ width: '100%', padding: '14px', backgroundColor: (!file || isProcessing) ? '#ccc' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: (!file || isProcessing) ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
              {isProcessing ? 'מעבד...' : 'המר לטקסט'}
            </button>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '10px 16px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={copyToClipboard} title="העתק" style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>📋 העתק</button>
              <button onClick={saveToWord} title="שמור ל-Word" style={{ padding: '8px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>💾 שמור ל-Word</button>
              
              <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 8px' }} />
              
              <button onClick={() => execCommand('bold')} style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>B</button>
              <button onClick={() => execCommand('italic')} style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontStyle: 'italic' }}>I</button>
              <button onClick={() => execCommand('underline')} style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', textDecoration: 'underline' }}>U</button>
              
              <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 8px' }} />
              
              <select onChange={(e) => execCommand('fontSize', e.target.value)} defaultValue="3" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                <option value="1">קטן</option>
                <option value="2">קטן+</option>
                <option value="3">רגיל</option>
                <option value="4">גדול</option>
                <option value="5">גדול+</option>
                <option value="6">כותרת</option>
              </select>
              
              <input type="color" onChange={(e) => execCommand('foreColor', e.target.value)} title="צבע טקסט" defaultValue="#000000" style={{ width: '32px', height: '32px', padding: '0', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }} />
              <input type="color" onChange={(e) => execCommand('hiliteColor', e.target.value)} title="צבע סימון" defaultValue="#ffff00" style={{ width: '32px', height: '32px', padding: '0', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }} />
              
              <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 8px' }} />
              
              <button onClick={() => execCommand('justifyRight')} style={{ padding: '6px 10px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>⫢</button>
              <button onClick={() => execCommand('justifyCenter')} style={{ padding: '6px 10px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>☰</button>
              <button onClick={() => execCommand('justifyLeft')} style={{ padding: '6px 10px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>⫤</button>
              
              <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 8px' }} />
              
              <button onClick={() => execCommand('undo')} style={{ padding: '6px 10px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>↩ בטל</button>
              <button onClick={() => execCommand('redo')} style={{ padding: '6px 10px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>↪ חזור</button>
              
              <div style={{ marginRight: 'auto' }} />
              
              <button onClick={() => { setShowEditor(false); setFile(null); }} style={{ padding: '8px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>קובץ חדש</button>
            </div>

            <div
              id="editor"
              contentEditable="true"
              dir="rtl"
              style={{
                minHeight: '500px',
                padding: '24px',
                outline: 'none',
                fontSize: '14px',
                lineHeight: '1.8',
                fontFamily: 'David, Arial, sans-serif'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');
  const [hasText, setHasText] = useState(false);

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

      setProcessingStep('');
      setHasText(true);
      
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

  const makeRunningText = () => {
    const editor = document.getElementById('editor');
    if (!editor) return;
    const text = editor.innerText;
    const runningText = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    editor.innerHTML = runningText;
  };

  const clearAll = () => {
    setFile(null);
    setHasText(false);
    setError('');
    const editor = document.getElementById('editor');
    if (editor) {
      editor.innerHTML = '';
    }
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '24px', direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>המרת PDF לטקסט</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>DocuPipe OCR</p>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
          
          {/* צד ימין - העלאת קובץ */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>העלאת קובץ PDF</h2>
            
            <div style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '30px', textAlign: 'center', marginBottom: '16px', cursor: 'pointer' }} onClick={() => document.getElementById('fileInput').click()}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>📄</p>
              <p>לחץ להעלאת קובץ</p>
              <input id="fileInput" type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>

            {file && <p style={{ color: '#2563eb', marginBottom: '16px', fontSize: '14px', wordBreak: 'break-all' }}>נבחר: {file.name}</p>}
            {error && <p style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}
            {processingStep && <p style={{ color: '#ca8a04', marginBottom: '16px', fontSize: '14px' }}>{processingStep}</p>}

            <button onClick={convertPDFToText} disabled={!file || isProcessing} style={{ width: '100%', padding: '14px', backgroundColor: (!file || isProcessing) ? '#ccc' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: (!file || isProcessing) ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
              {isProcessing ? 'מעבד...' : 'המר לטקסט'}
            </button>

            {hasText && (
              <button onClick={clearAll} style={{ width: '100%', padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                נקה הכל
              </button>
            )}
          </div>

          {/* צד שמאל - עורך טקסט */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            
            {/* סרגל כלים */}
            <div style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '10px 16px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={copyToClipboard} disabled={!hasText} style={{ padding: '8px 12px', backgroundColor: hasText ? 'white' : '#eee', border: '1px solid #d1d5db', borderRadius: '4px', cursor: hasText ? 'pointer' : 'not-allowed', opacity: hasText ? 1 : 0.5 }}>📋 העתק</button>
              <button onClick={saveToWord} disabled={!hasText} style={{ padding: '8px 12px', backgroundColor: hasText ? '#16a34a' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: hasText ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>💾 שמור ל-Word</button>
              <button onClick={makeRunningText} disabled={!hasText} style={{ padding: '8px 12px', backgroundColor: hasText ? '#8b5cf6' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: hasText ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>⟷ הפוך לטקסט רץ</button>
              
              <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 8px' }} />
              
              <button onClick={() => execCommand('bold')} disabled={!hasText} style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: hasText ? 'pointer' : 'not-allowed', fontWeight: 'bold', opacity: hasText ? 1 : 0.5 }}>B</button>
              <button onClick={() => execCommand('italic')} disabled={!hasText} style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: hasText ? 'pointer' : 'not-allowed', fontStyle: 'italic', opacity: hasText ? 1 : 0.5 }}>I</button>
              <button onClick={() => execCommand('underline')} disabled={!hasText} style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: hasText ? 'pointer' : 'not-allowed', textDecoration: 'underline', opacity: hasText ? 1 : 0.5 }}>U</button>
              
              <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 8px' }} />
              
              <select onChange={(e) => execCommand('fontSize', e.target.value)} disabled={!hasText} defaultValue="3" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', opacity: hasText ? 1 : 0.5 }}>
                <option value="1">קטן</option>
                <option value="2">קטן+</option>
                <option value="3">רגיל</option>
                <option value="4">גדול</option>
                <option value="5">גדול+</option>
                <option value="6">כותרת</option>
              </select>
              
              <input type="color" onChange={(e) => execCommand('foreColor', e.target.value)} disabled={!hasText} title="צבע טקסט" defaultValue="#000000" style={{ width: '32px', height: '32px', padding: '0', border: '1px solid #d1d5db', borderRadius: '4px', cursor: hasText ? 'pointer' : 'not-allowed', opacity: hasText ? 1 : 0.5 }} />
              <input type="color" onChange={(e) => execCommand('hiliteColor', e.target.value)} disabled={!hasText} title="צבע סימון" defaultValue="#ffff00" style={{ width: '32px', height: '32px', padding: '0', border: '1px solid #d1d5db', borderRadius: '4px', cursor: hasText ? 'pointer' : 'not-allowed', opacity: hasText ? 1 : 0.5 }} />
              
              <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 8px' }} />
              
              <button onClick={() => execCommand('justifyRight')} disabled={!hasText} style={{ padding: '6px 10px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: hasText ? 'pointer' : 'not-allowed', opacity: hasText ? 1 : 0.5 }}>⫢</button>
              <button onClick={() => execCommand('justifyCenter')} disabled={!hasText} style={{ padding: '6px 10px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: hasText ? 'pointer' : 'not-allowed', opacity: hasText ? 1 : 0.5 }}>☰</button>
              <button onClick={() => execCommand('justifyLeft')} disabled={!hasText} style={{ padding: '6px 10px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: hasText ? 'pointer' : 'not-allowed', opacity: hasText ? 1 : 0.5 }}>⫤</button>
              
              <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 8px' }} />
              
              <button onClick={() => execCommand('undo')} disabled={!hasText} style={{ padding: '6px 10px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: hasText ? 'pointer' : 'not-allowed', opacity: hasText ? 1 : 0.5 }}>↩</button>
              <button onClick={() => execCommand('redo')} disabled={!hasText} style={{ padding: '6px 10px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: hasText ? 'pointer' : 'not-allowed', opacity: hasText ? 1 : 0.5 }}>↪</button>
            </div>

            {/* אזור העריכה */}
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
                fontFamily: 'David, Arial, sans-serif',
                color: hasText ? '#000' : '#999'
              }}
            >
              {!hasText && 'הטקסט המחולץ יופיע כאן...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

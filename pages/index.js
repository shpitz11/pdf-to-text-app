import { useState, useRef } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');
  const [hasContent, setHasContent] = useState(false);
  const editorRef = useRef(null);

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

      if (editorRef.current) {
        editorRef.current.innerHTML = ocrData.text.replace(/\n/g, '<br>');
        setHasContent(true);
      }
      setProcessingStep('');
    } catch (err) {
      setError(err.message || 'שגיאה בהמרת הקובץ');
    } finally {
      setIsProcessing(false);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const copyToClipboard = () => {
    const text = editorRef.current?.innerText || '';
    navigator.clipboard.writeText(text);
  };

  const saveToWord = () => {
    const content = editorRef.current?.innerHTML || '';
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

  const ToolbarButton = ({ onClick, title, children, active }) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '6px 10px',
        backgroundColor: active ? '#e5e7eb' : 'white',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold'
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '24px', direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>המרת PDF לטקסט</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>DocuPipe OCR</p>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
          {/* צד שמאל - העלאת קובץ */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
            <h2 style={{ marginBottom: '16px' }}>העלאת קובץ</h2>
            
            <div style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '30px', textAlign: 'center', marginBottom: '16px', cursor: 'pointer' }} onClick={() => document.getElementById('fileInput').click()}>
              <p>לחץ להעלאת קובץ PDF</p>
              <input id="fileInput" type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>

            {file && <p style={{ color: '#2563eb', marginBottom: '16px', fontSize: '14px' }}>נבחר: {file.name}</p>}
            {error && <p style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}
            {processingStep && <p style={{ color: '#ca8a04', marginBottom: '16px', fontSize: '14px' }}>{processingStep}</p>}

            <button onClick={convertPDFToText} disabled={!file || isProcessing} style={{ width: '100%', padding: '12px', backgroundColor: (!file || isProcessing) ? '#ccc' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: (!file || isProcessing) ? 'not-allowed' : 'pointer', fontSize: '16px' }}>
              {isProcessing ? 'מעבד...' : 'המר לטקסט'}
            </button>
          </div>

          {/* צד ימין - עורך טקסט */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {/* סרגל כלים */}
            <div style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '8px 16px', display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* פעולות קובץ */}
              <ToolbarButton onClick={copyToClipboard} title="העתק">📋</ToolbarButton>
              <ToolbarButton onClick={saveToWord} title="שמור ל-Word">💾</ToolbarButton>
              
              <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 8px' }} />
              
              {/* עיצוב טקסט */}
              <ToolbarButton onClick={() => execCommand('bold')} title="מודגש">B</ToolbarButton>
              <ToolbarButton onClick={() => execCommand('italic')} title="נטוי">I</ToolbarButton>
              <ToolbarButton onClick={() => execCommand('underline')} title="קו תחתון">U</ToolbarButton>
              <ToolbarButton onClick={() => execCommand('strikeThrough')} title="קו חוצה">S̶</ToolbarButton>
              
              <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 8px' }} />
              
              {/* גודל טקסט */}
              <select onChange={(e) => execCommand('fontSize', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                <option value="3">רגיל</option>
                <option value="1">קטן</option>
                <option value="2">קטן+</option>
                <option value="4">גדול</option>
                <option value="5">גדול+</option>
                <option value="6">כותרת</option>
                <option value="7">כותרת גדולה</option>
              </select>
              
              {/* צבע טקסט */}
              <input type="color" onChange={(e) => execCommand('foreColor', e.target.value)} title="צבע טקסט" style={{ width: '32px', height: '32px', padding: '0', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }} />
              
              {/* צבע רקע */}
              <input type="color" onChange={(e) => execCommand('hiliteColor', e.target.value)} title="צבע סימון" defaultValue="#ffff00" style={{ width: '32px', height: '32px', padding: '0', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }} />
              
              <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 8px' }} />
              
              {/* יישור */}
              <ToolbarButton onClick={() => execCommand('justifyRight')} title="יישור לימין">⫢</ToolbarButton>
              <ToolbarButton onClick={() => execCommand('justifyCenter')} title="מרכז">☰</ToolbarButton>
              <ToolbarButton onClick={() => execCommand('justifyLeft')} title="יישור לשמאל">⫤</ToolbarButton>
              
              <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 8px' }} />
              
              {/* רשימות */}
              <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="רשימה">•</ToolbarButton>
              <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="רשימה ממוספרת">1.</ToolbarButton>
              
              <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 8px' }} />
              
              {/* בטל/חזור */}
              <ToolbarButton onClick={() => execCommand('undo')} title="בטל">↩</ToolbarButton>
              <ToolbarButton onClick={() => execCommand('redo')} title="חזור">↪</ToolbarButton>
            </div>

            {/* אזור העריכה */}
            <div
              ref={editorRef}
              contentEditable
              dir="rtl"
              style={{
                minHeight: '500px',
                padding: '24px',
                outline: 'none',
                fontSize: '14px',
                lineHeight: '1.8',
                fontFamily: 'David, Arial, sans-serif'
              }}
              onInput={() => setHasContent(editorRef.current?.innerText?.trim().length > 0)}
              suppressContentEditableWarning
            >
              {!hasContent && <span style={{ color: '#9ca3af' }}>הטקסט יופיע כאן לאחר ההמרה. ניתן גם לכתוב ולערוך ישירות.</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

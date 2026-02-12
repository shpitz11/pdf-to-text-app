export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileData, filename } = req.body;
    const apiKey = process.env.DOCUPIPE_API_KEY;

    const uploadResponse = await fetch('https://app.docupipe.ai/document', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        document: {
          file: {
            contents: fileData,
            filename: filename
          }
        }
      })
    });

    if (!uploadResponse.ok) {
      throw new Error('DocuPipe upload failed');
    }

    const uploadData = await uploadResponse.json();
    const documentId = uploadData.documentId;

    let attempts = 0;
    while (attempts < 30) {
      const resultResponse = await fetch("https://app.docupipe.ai/document/" + documentId, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'X-API-Key': apiKey
        }
      });

      const resultData = await resultResponse.json();

      if (resultData.status === 'completed') {
        const text = resultData.result?.text || '';
        return res.status(200).json({ text: text });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Timeout waiting for DocuPipe');

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

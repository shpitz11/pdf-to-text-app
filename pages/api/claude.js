export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    const apiKey = process.env.CLAUDE_API_KEY;

    const promptText = "קיבלתי טקסט שחולץ מ-PDF באמצעות OCR. אנא בדוק ותקן אותו בדיוק לפי הכללים הבאים. החזר רק את הטקסט המתוקן, ללא הסברים. כללים: 1. אל תוסיף מילים שלא קיימות בטקסט המקורי. 2. אל תשנה את המבנה או הסדר. 3. תקן רק שגיאות OCR ברורות. זיהוי קריטי - ה מול ח: ה פתוחה בצד שמאל למטה. ח סגורה למטה עם קו תחתון רציף. זיהוי קריטי - י מול גרשיים: י נוגעת בשורת הבסיס, עבה, אות מלאה. גרשיים מרחפות מעל השורה, דקות מאוד, לא נוגעות בבסיס. דוגמאות: יחד (לא יחיד), תא (לא תא), מר (לא מר). הטקסט בגופן David. הנה הטקסט לתיקון:\n\n" + text;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content: promptText }]
      })
    });

    if (!response.ok) {
      throw new Error('Claude API failed');
    }

    const data = await response.json();
    const resultText = data.content
      .map(item => (item.type === "text" ? item.text : ""))
      .filter(Boolean)
      .join("\n");

    return res.status(200).json({ text: resultText });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

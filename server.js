const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// استدعاء مفتاح الجيمناي الذي أضفناه في متغيرات ريلوي
const aiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI(aiKey);

app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        
        if (!userMessage) {
            return res.status(400).json({ error: "الرسالة فارغة!" });
        }

        // تحديد موديل جيميناي السريع والمجاني
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const replyText = response.text();

        // إرجاع الرد بنفس الصيغة المتوقعة في موقعك (data.reply)
        res.json({ reply: replyText });

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: "حدث خطأ داخلي في السيرفر" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(Server is running on port ${PORT});
});

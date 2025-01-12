const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// المسار لتحويل الفيديو إلى MP3
app.post('/convert', async (req, res) => {
    const { url } = req.body;

    // تحقق من صلاحية رابط YouTube
    if (!ytdl.validateURL(url)) {
        return res.status(400).json({ success: false, message: 'Invalid YouTube URL.' });
    }

    const videoId = ytdl.getURLVideoID(url); // استخراج معرف الفيديو
    const outputFileName = `${videoId}.mp3`; // اسم الملف الناتج

    try {
        const stream = ytdl(url, { filter: 'audioonly' }); // تحميل الصوت فقط
        const outputPath = path.resolve(__dirname, 'downloads', outputFileName);

        // تحقق من وجود مجلد التنزيلات
        if (!fs.existsSync(path.resolve(__dirname, 'downloads'))) {
            fs.mkdirSync(path.resolve(__dirname, 'downloads'));
        }

        // استخدام ffmpeg لتحويل الصوت إلى MP3
        ffmpeg(stream)
            .audioBitrate(128) // ضبط جودة الصوت
            .save(outputPath) // حفظ الملف
            .on('end', () => {
                console.log(`File saved: ${outputPath}`);
                res.json({
                    success: true,
                    message: 'Conversion completed!',
                    downloadLink: `/downloads/${outputFileName}`,
                });
            })
            .on('error', (err) => {
                console.error('Error:', err.message);
                res.status(500).json({ success: false, message: 'Conversion failed.' });
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
    }
});

// تقديم الملفات المحولة كروابط قابلة للتنزيل
app.use('/downloads', express.static(path.resolve(__dirname, 'downloads')));

// تشغيل الخادم
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

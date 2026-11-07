//Thanks to gemini for the server code!
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve your frontend files from a folder named 'public'
app.use(express.static(__dirname));
// Secure backend endpoint for Genius search
app.get('/api/search-songs', async (req, res) => {
    const query = req.query.q || "hello";
    const token = process.env.ACCESS_TOKEN; // Stored safely on Render

    try {
        const response = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
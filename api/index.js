const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const baseUrl = 'https://otakudesu.best';
const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

// Endpoint Home (Trending / Ongoing)
app.get('/api/home', async (req, res) => {
    try {
        const { data } = await axios.get(`${baseUrl}/ongoing-anime/`, { headers });
        const $ = cheerio.load(data);
        const result = [];
        $('.venz ul li').each((i, el) => {
            result.push({
                title: $(el).find('h2').text().trim(),
                thumb: $(el).find('img').attr('src'),
                episode: $(el).find('.epz').text().trim(),
                url: $(el).find('a').attr('href')
            });
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint Detail Anime
app.get('/api/detail', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        const { data } = await axios.get(url, { headers });
        const $ = cheerio.load(data);
        const info = $('.infozin .infozingle');
        
        const detail = {
            thumb: $('.fotoanime img').attr('src'),
            title: info.find('p:contains("Judul")').text().split(':')[1]?.trim(),
            score: info.find('p:contains("Skor")').text().split(':')[1]?.trim() || "N/A",
            status: info.find('p:contains("Status")').text().split(':')[1]?.trim(),
            genre: info.find('p:contains("Genre")').text().split(':')[1]?.trim(),
            sinopsis: $('.sinopc').text().trim(),
            episodes: []
        };

        $('.episodelist ul li').each((i, el) => {
            detail.episodes.push({
                title: $(el).find('a').text().trim(),
                url: $(el).find('a').attr('href'),
                date: $(el).find('.zeebr').text().trim()
            });
        });
        
        // Reverse agar episode 1 ada di atas (opsional)
        detail.episodes.reverse();
        res.json(detail);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint Watch (Ambil Iframe & Download)
app.get('/api/watch', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        const { data } = await axios.get(url, { headers });
        const $ = cheerio.load(data);
        
        // Coba cari iframe dari script atau tag iframe langsung
        let videoUrl = $('#pembed iframe').attr('src');
        
        res.json({
            title: $('.venser h1').text().trim(),
            videoUrl: videoUrl,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;

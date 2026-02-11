const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const baseUrl = 'https://otakudesu.best';

// HEADERS SUPER LENGKAP UNTUK BYPASS CLOUDFLARE/403
const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://otakudesu.best/',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
};

const getSafeText = ($, element, keyword) => {
    const text = $(element).find(`p:contains("${keyword}")`).text();
    if (!text) return "N/A";
    const parts = text.split(':');
    return parts.length > 1 ? parts.slice(1).join(':').trim() : text.trim();
};

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
        res.status(500).json({ error: 'Gagal mengambil data Home: ' + error.message });
    }
});

app.get('/api/detail', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'URL anime tidak ditemukan' });

        const { data } = await axios.get(url, { headers });
        const $ = cheerio.load(data);
        const info = $('.infozin .infozingle');
        
        const detail = {
            thumb: $('.fotoanime img').attr('src') || '',
            title: getSafeText($, info, "Judul"),
            score: getSafeText($, info, "Skor"),
            status: getSafeText($, info, "Status"),
            genre: getSafeText($, info, "Genre"),
            sinopsis: $('.sinopc').text().trim() || 'Sinopsis belum tersedia.',
            episodes: []
        };

        $('.episodelist ul li').each((i, el) => {
            detail.episodes.push({
                title: $(el).find('a').text().trim(),
                url: $(el).find('a').attr('href'),
                date: $(el).find('.zeebr').text().trim()
            });
        });
        
        detail.episodes.reverse();
        res.json(detail);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil Detail: ' + error.message });
    }
});

app.get('/api/watch', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'URL episode tidak ditemukan' });

        const { data } = await axios.get(url, { headers });
        const $ = cheerio.load(data);
        
        let videoUrl = $('#pembed iframe').attr('src') || $('.responsive-embed-container iframe').attr('src') || $('iframe').first().attr('src');
        
        if (!videoUrl) throw new Error('Link video iframe tidak ditemukan.');

        res.json({
            title: $('.venser h1').text().trim() || 'Sedang Menonton',
            videoUrl: videoUrl,
        });
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat Video: ' + error.message });
    }
});

module.exports = app;

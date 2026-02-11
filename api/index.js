const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const baseUrl = 'https://otakudesu.best';

// ==========================================================
// SISTEM PROXY BAJA (Anti Cloudflare Captcha)
// ==========================================================
async function fetchWithBypass(targetUrl) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    };

    // Daftar jalur rahasia (Proxy) yang akan dicoba satu per satu
    const proxies = [
        targetUrl, // 1. Coba jalur normal dulu
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, // 2. Jalur bypass khusus CORS
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`, // 3. Jalur AllOrigins
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}` // 4. Jalur CodeTabs
    ];

    for (const url of proxies) {
        try {
            const { data } = await axios.get(url, { headers, timeout: 15000 });
            
            // VALIDASI PENTING: Pastikan ini bukan halaman Cloudflare / Captcha
            if (data && !data.includes('Just a moment...') && !data.includes('cf-browser-verification')) {
                return data; // Jika aman, kembalikan data HTML-nya
            }
            console.log(`Jalur ${url} terkena Captcha Cloudflare, mencoba jalur lain...`);
        } catch (error) {
            console.log(`Jalur ${url} gagal/timeout, mencoba jalur lain...`);
        }
    }
    
    throw new Error('Semua jalur diblokir oleh sistem keamanan web sumber saat ini.');
}

// Fungsi pengaman agar teks tidak "undefined" jika gagal split
const getSafeText = (info, keyword) => {
    const text = info.find(`p:contains("${keyword}")`).text();
    if (!text) return ""; // Kembalikan string kosong, bukan undefined
    const parts = text.split(':');
    return parts.length > 1 ? parts.slice(1).join(':').trim() : text.trim();
};

// ==========================================================
// CLASS OTAKUDESU (Sudah Dimodifikasi Agar Aman)
// ==========================================================
class Otakudesu {
    async home() {
        const data = await fetchWithBypass(`${baseUrl}/ongoing-anime/`);
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
        return result;
    }

    async detail(url) {
        const data = await fetchWithBypass(url);
        const $ = cheerio.load(data);
        const info = $('.infozin .infozingle');
        
        const detail = {
            thumb: $('.fotoanime img').attr('src') || '',
            title: getSafeText(info, "Judul"),
            score: getSafeText(info, "Skor") || "N/A",
            producer: getSafeText(info, "Produser"),
            status: getSafeText(info, "Status"),
            totalEpisode: getSafeText(info, "Total Episode"),
            duration: getSafeText(info, "Durasi"),
            releaseDate: getSafeText(info, "Tanggal Rilis"),
            studio: getSafeText(info, "Studio"),
            genre: getSafeText(info, "Genre"),
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
        
        return detail;
    }

    async episode(url) {
        const data = await fetchWithBypass(url);
        const $ = cheerio.load(data);
        const download = [];
        $('.download ul li').each((i, el) => {
            const resolusi = $(el).find('strong').text().trim();
            const links = [];
            $(el).find('a').each((j, link) => {
                links.push({ server: $(link).text().trim(), url: $(link).attr('href') });
            });
            download.push({ resolusi, links });
        });
        
        // Cari iframe video secara agresif
        let videoUrl = $('#pembed iframe').attr('src') || $('.responsive-embed-container iframe').attr('src') || $('iframe').first().attr('src');

        return {
            title: $('.venser h1').text().trim(),
            videoUrl: videoUrl,
            download
        };
    }
}

const otaku = new Otakudesu();

// ==========================================================
// ROUTING EXPRESS API
// ==========================================================

app.get('/api/home', async (req, res) => {
    try {
        const data = await otaku.home();
        if (!data || data.length === 0) throw new Error("Gagal memuat daftar anime.");
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/detail', async (req, res) => {
    try {
        if (!req.query.url) throw new Error("URL anime dibutuhkan");
        const data = await otaku.detail(req.query.url);
        
        // Validasi ekstra: Jika judul kosong, berarti gagal parsing HTML
        if (!data.title) throw new Error("Data anime tidak ditemukan, halaman mungkin terblokir.");
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/watch', async (req, res) => {
    try {
        if (!req.query.url) throw new Error("URL episode dibutuhkan");
        const data = await otaku.episode(req.query.url);
        if (!data.videoUrl) throw new Error("Link video tidak ditemukan.");
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;

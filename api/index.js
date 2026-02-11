const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const baseUrl = 'https://otakudesu.best';

// Helper Anti-Blokir Vercel (Hanya bekerja jika Vercel diblokir 403)
async function fetchWithBypass(targetUrl) {
    try {
        const { data } = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 10000
        });
        return data;
    } catch (error) {
        if (error.response && error.response.status === 403) {
            // Jika kena 403, kita tembus pakai proxy AllOrigins
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
            const { data } = await axios.get(proxyUrl, { timeout: 10000 });
            return data;
        }
        throw error;
    }
}

// ==========================================================
// CLASS OTAKUDESU ASLI MILIKMU (DENGAN TAMBAHAN BYPASS 403)
// ==========================================================
class Otakudesu {
    async home() {
        const data = await fetchWithBypass(baseUrl);
        const $ = cheerio.load(data);
        const result = [];
        $('.venz ul li').each((i, el) => {
            result.push({
                title: $(el).find('h2').text().trim(),
                thumb: $(el).find('img').attr('src'),
                episode: $(el).find('.epz').text().trim(),
                uploadedOn: $(el).find('.newnime').text().trim(),
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
            thumb: $('.fotoanime img').attr('src'),
            title: info.find('p:contains("Judul")').text().split(':')[1]?.trim(),
            score: info.find('p:contains("Skor")').text().split(':')[1]?.trim(),
            producer: info.find('p:contains("Produser")').text().split(':')[1]?.trim(),
            status: info.find('p:contains("Status")').text().split(':')[1]?.trim(),
            totalEpisode: info.find('p:contains("Total Episode")').text().split(':')[1]?.trim(),
            duration: info.find('p:contains("Durasi")').text().split(':')[1]?.trim(),
            releaseDate: info.find('p:contains("Tanggal Rilis")').text().split(':')[1]?.trim(),
            studio: info.find('p:contains("Studio")').text().split(':')[1]?.trim(),
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
                links.push({
                    server: $(link).text().trim(),
                    url: $(link).attr('href')
                });
            });
            download.push({ resolusi, links });
        });
        return {
            title: $('.venser h1').text().trim(),
            videoUrl: $('#pembed iframe').attr('src'),
            download
        };
    }
}

const otaku = new Otakudesu();

// ==========================================================
// ROUTING EXPRESS (Menghubungkan Frontend dengan Class milikmu)
// ==========================================================

app.get('/api/home', async (req, res) => {
    try {
        const data = await otaku.home();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil Home: ' + error.message });
    }
});

app.get('/api/detail', async (req, res) => {
    try {
        if (!req.query.url) throw new Error("URL dibutuhkan");
        const data = await otaku.detail(req.query.url);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil Detail: ' + error.message });
    }
});

app.get('/api/watch', async (req, res) => {
    try {
        if (!req.query.url) throw new Error("URL episode dibutuhkan");
        const data = await otaku.episode(req.query.url);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat Video: ' + error.message });
    }
});

module.exports = app;

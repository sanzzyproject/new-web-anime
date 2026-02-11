const app = document.getElementById('app-content');

// Fungsi Routing sederhana
async function goHome() {
    app.innerHTML = '<div class="loader"><i class="ph ph-spinner-gap ph-spin"></i> Memuat Rekomendasi...</div>';
    try {
        const res = await fetch('/api/home');
        const data = await res.json();
        
        let html = `<h2 class="section-title">✨ Baru Rilis & Trending</h2><div class="anime-grid">`;
        data.forEach(anime => {
            html += `
                <div class="anime-card" onclick="goDetail('${anime.url}')">
                    <img src="${anime.thumb}" class="anime-cover" loading="lazy">
                    <div class="anime-info">
                        <div class="anime-title">${anime.title}</div>
                        <div class="anime-meta">
                            <span>${anime.episode}</span>
                            <span style="color: var(--star)"><i class="ph-fill ph-star"></i> Top</span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        app.innerHTML = html;
        window.scrollTo(0, 0);
    } catch (err) {
        app.innerHTML = `<div class="loader">Gagal memuat data.</div>`;
    }
}

async function goDetail(url) {
    app.innerHTML = '<div class="loader"><i class="ph ph-spinner-gap ph-spin"></i> Memuat Detail...</div>';
    try {
        const res = await fetch(`/api/detail?url=${encodeURIComponent(url)}`);
        const data = await res.json();

        let epHtml = '';
        data.episodes.forEach(ep => {
            epHtml += `
                <a href="javascript:void(0)" onclick="goWatch('${ep.url}', '${url}')" class="ep-btn">
                    <span><i class="ph-fill ph-play-circle"></i> ${ep.title}</span>
                    <span style="font-size: 0.8rem; color: #94a3b8">${ep.date}</span>
                </a>
            `;
        });

        app.innerHTML = `
            <div class="detail-header">
                <img src="${data.thumb}" class="detail-cover">
                <div class="detail-info">
                    <h1>${data.title}</h1>
                    <div class="rating"><i class="ph-fill ph-star"></i> Rating: ${data.score}</div>
                    <div style="margin-bottom: 10px;"><span style="background: var(--primary); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem;">${data.status}</span></div>
                    <p style="font-size: 0.9rem; margin-bottom: 10px;"><strong>Genre:</strong> ${data.genre}</p>
                    <p class="sinopsis">${data.sinopsis}</p>
                </div>
            </div>
            <div class="episodes-container">
                <h3>Daftar Episode</h3>
                <br>
                <div class="ep-list">${epHtml}</div>
            </div>
        `;
        window.scrollTo(0, 0);
    } catch (err) {
        app.innerHTML = `<div class="loader">Gagal memuat detail anime.</div>`;
    }
}

async function goWatch(episodeUrl, animeUrl) {
    app.innerHTML = '<div class="loader"><i class="ph ph-spinner-gap ph-spin"></i> Menyiapkan Video...</div>';
    try {
        const res = await fetch(`/api/watch?url=${encodeURIComponent(episodeUrl)}`);
        const data = await res.json();

        app.innerHTML = `
            <div class="player-container">
                <iframe src="${data.videoUrl}" allowfullscreen="true" scrolling="no"></iframe>
            </div>
            <div class="watch-title">${data.title}</div>
            
            <div style="padding: 20px;">
                <button onclick="goDetail('${animeUrl}')" style="background: var(--card-bg); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                    <i class="ph ph-arrow-left"></i> Kembali ke Daftar Episode
                </button>
            </div>
        `;
        window.scrollTo(0, 0);
    } catch (err) {
        app.innerHTML = `<div class="loader">Gagal memuat video.</div>`;
    }
}

// Inisialisasi awal
goHome();

// ==========================================
// 🎁 Module: Reward & Gacha System
// ==========================================

async function handleRedeem(productId, pointsReq) { 
    if (!currentUser) return openAuth('login'); 
    if (parseFloat(currentUser.points) < parseFloat(pointsReq)) { return Swal.fire('แต้มไม่พอ!', 'แต้มของคุณไม่เพียงพอสำหรับการแลกรางวัลนี้ครับ', 'warning'); }
    
    const confirm = await Swal.fire({ 
        title: 'ยืนยันแลกรางวัล?', html: `ใช้ <b>${pointsReq} แต้ม</b><br><small class="text-danger">* แลกแล้วห้ามคืนแต้มทุกกรณี</small>`, icon: 'question', 
        showCancelButton: true, confirmButtonColor: '#1a237e', confirmButtonText: 'ยืนยันแลกเลย!', cancelButtonText: 'ยกเลิก'
    }); 
    
    if (confirm.isConfirmed) { 
        Swal.fire({ title: t('processing'), allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        const res = await API.post({ action: 'redeemReward', phone: currentUser.phone, productId: productId, points: pointsReq }); 
        
        if (res.status === 'success') { 
            currentUser.points = res.remainPoints; localStorage.setItem('currentUser', JSON.stringify(currentUser)); 
            updateNav(); showPage('home'); 
            
            let isRemote = remoteZipCodes.includes(currentUser.zipcode);
            let emsFee = isRemote ? 60 : 40; let codFee = isRemote ? 70 : 50;
            let remoteBadge = isRemote ? `<br><span class="badge bg-warning text-dark mt-1"><i class="fas fa-truck"></i> รหัส ปณ. ${currentUser.zipcode} บวกพื้นที่ห่างไกล 20฿ แล้ว</span>` : '';

            const chatObj = await Swal.fire({ 
                title: '🎉 แลกรางวัลสำเร็จ!', 
                html: `<div class="text-start small mt-2">
                          <p class="mb-2">เพื่อความรวดเร็ว รบกวนลูกค้ากด <b>"ทักแชท LINE"</b> ด้านล่าง แล้วแจ้งแอดมินดังนี้นะครับ:</p>
                          <ul class="text-primary fw-bold" style="line-height: 1.8;">
                              <li>แจ้งชื่อ: ${currentUser.fname || currentUser.name}</li>
                              <li>แจ้งชื่อของที่แลก: ${productId}</li>
                              <li>ระบุว่า: <span class="text-success border-bottom border-success">"รับเองหน้าร้าน"</span> หรือ <span class="text-danger border-bottom border-danger">"ให้จัดส่ง"</span></li>
                          </ul>
                          <div class="alert alert-info p-2 mt-3 mb-0 border-info text-dark" style="font-size: 0.85rem;">
                              <b>ยอดโอนค่าจัดส่งของคุณ:</b><br>โอนปกติ ${emsFee}฿ / ปลายทาง ${codFee}฿ ${remoteBadge}
                          </div>
                       </div>`, 
                icon: 'success', confirmButtonText: '💬 ทักแชท LINE ร้าน', confirmButtonColor: '#00B900', showCancelButton: true, cancelButtonText: 'ปิดหน้าต่าง'
            }); 
            if (chatObj.isConfirmed) window.open('https://lin.ee/NZjv3Aj', '_blank'); 
        } else { Swal.fire(t('error'), res.message, 'error'); syncPoints(); } 
    } 
}

async function startGacha(price) {
    if (parseFloat(currentUser.points) < parseFloat(price)) return Swal.fire('แต้มไม่พอ!', `ต้องใช้ ${price} แต้มครับ`, 'warning');
    const conf = await Swal.fire({ title: 'พร้อมสุ่มรางวัล?', html: `หักแต้ม: <b>${price} แต้ม</b><br><small class="text-danger">*กดแล้วห้ามคืนแต้มทุกกรณี</small>`, icon: 'question', showCancelButton: true, confirmButtonColor: '#1a237e', confirmButtonText: 'ลุยเลย!' });
    if (!conf.isConfirmed) return;

    const gachaArea = document.getElementById('gachaArea');
    gachaArea.innerHTML = `<div class="text-center py-5"><h3 class="text-primary fw-bold mb-4">กำลังเตรียมกล่องสุ่ม...</h3><div class="shuffling-deck"></div></div>`;

    const res = await API.post({ action: 'spinGacha', phone: currentUser.phone });
    if (res.status !== 'success') { Swal.fire(t('error'), res.message, 'error'); showPage('gacha'); return; }

    currentUser.points = res.remainPoints; localStorage.setItem('currentUser', JSON.stringify(currentUser)); updateNav();

    let winImg = res.wonItem.image;
    if (!winImg || winImg.trim() === '') { winImg = res.prizeType === 'Points' ? `https://ui-avatars.com/api/?name=${res.wonItem.value}+Pts&background=FFD700&color=000&size=512&font-size=0.33&bold=true` : 'https://placehold.co/400x400/eeeeee/31343C?text=No+Image'; }

    setTimeout(() => {
        let cardsHtml = `<h4 class="text-success fw-bold mb-3 text-center">เลือกการ์ด 1 ใบ!</h4><div class="gacha-board">`;
        for(let i=1; i<=9; i++) {
            cardsHtml += `
            <div class="gacha-card dealing" style="animation-delay: ${i * 0.08}s" onclick="flipCard(this, '${res.wonItem.name}', '${winImg}', '${res.prizeType}', '${res.message}')">
                <div class="gacha-card-inner">
                    <div class="card-face card-front"><span class="card-number">${i}</span></div>
                    <div class="card-face card-back"><img src="" class="prize-img"><div class="prize-name"></div></div>
                </div>
            </div>`;
        }
        gachaArea.innerHTML = cardsHtml + `</div>`;
    }, 1500);
}

async function startGacha10(price) {
    const totalCost = price * 10;
    if (parseFloat(currentUser.points) < totalCost) return Swal.fire('แต้มไม่พอ!', `การสุ่ม 10 ครั้ง ต้องใช้ ${totalCost} แต้มครับ`, 'warning');
    const confirm = await Swal.fire({ title: 'ยืนยันสุ่ม 10 ครั้ง?', text: `ระบบจะหัก ${totalCost} แต้มทันที ยืนยันหรือไม่?`, icon: 'question', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'ลุยเลย! (x10)' });
    if (!confirm.isConfirmed) return;

    const gachaArea = document.getElementById('gachaArea');
    gachaArea.innerHTML = `<div class="text-center py-5"><h3 class="text-primary fw-bold mb-4">กำลังเปิดกล่อง 10 ใบ...</h3><div class="spinner-border text-danger" style="width: 4rem; height: 4rem;"></div></div>`;

    const res = await API.post({ action: 'spinGacha10', phone: currentUser.phone });
    if (res.status !== 'success') { Swal.fire(t('error'), res.message, 'error'); showPage('gacha'); return; }

    currentUser.points = res.remainPoints; localStorage.setItem('currentUser', JSON.stringify(currentUser)); updateNav();

    setTimeout(() => {
        let html = `<h4 class="text-danger fw-bold mb-3 text-center">🎉 ผลการเปิดกล่อง 10 ใบ! 🎉</h4><div class="row justify-content-center g-2 mb-4" style="max-width: 500px; margin: 0 auto;">`;
        res.results.forEach((item, index) => {
            let winImg = item.image;
            if (!winImg || winImg.trim() === '') winImg = (item.type === 'Points') ? `https://ui-avatars.com/api/?name=${item.value}+Pts&background=FFD700&color=000&size=512&font-size=0.33&bold=true` : 'https://placehold.co/400x400/eeeeee/31343C?text=No+Image';
            let borderClass = item.type === 'Product' ? 'border-success bg-success bg-opacity-10' : 'border-warning';
            let textClass = item.type === 'Product' ? 'text-success fw-bold' : 'text-dark';
            html += `<div class="col-4 col-md-3"><div class="card h-100 shadow-sm border ${borderClass} animate-pop" style="animation-delay: ${index * 0.1}s"><img src="${winImg}" class="card-img-top p-1" style="height:60px; object-fit:contain;"><div class="card-body p-1 text-center d-flex align-items-center justify-content-center"><small class="${textClass}" style="font-size:0.65rem; line-height:1.2;">${item.name}</small></div></div></div>`;
        });
        html += `</div>`;
        if (res.totalPointsWon > 0) html += `<div class="alert alert-warning small text-center mb-3">🪙 ได้รับโบนัสคืนรวม: <b>${res.totalPointsWon} แต้ม</b></div>`;
        if (res.wonProducts.length > 0) {
            let productNames = res.wonProducts.map(p => p.name).join('<br>🚗 ');
            html += `<div class="alert alert-success small text-start shadow-sm border-success"><b class="text-success">แจ็คพอตแตก! คุณได้รับ:</b><br>🚗 ${productNames}<br><br><span class="text-danger fw-bold">⚠️ รบกวนแคปหน้าจอนี้ไว้ แล้วทักแชท LINE แอดมินภายใน 48 ชม. เพื่อยืนยันสิทธิ์นะครับ!</span></div><button class="btn btn-success fw-bold w-100 mb-2 py-2 shadow-sm" onclick="window.open('https://lin.ee/NZjv3Aj', '_blank')">💬 ทักแชท LINE ยืนยันรับของ</button>`;
        }
        html += `<button class="btn btn-outline-primary w-100 fw-bold py-2 mt-2" onclick="showPage('gacha')">🔄 กลับไปสุ่มใหม่</button><style>.animate-pop { animation: popIn 0.4s both cubic-bezier(0.175, 0.885, 0.32, 1.275); } @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }</style>`;
        gachaArea.innerHTML = html;
    }, 1200);
}

function flipCard(cardEl, name, img, type, msg) {
    if (document.querySelector('.gacha-card.flipped')) return;
    cardEl.querySelector('.prize-img').src = img; cardEl.querySelector('.prize-name').innerText = name; cardEl.classList.add('flipped');
    document.querySelectorAll('.gacha-card:not(.flipped)').forEach(c => c.classList.add('disabled'));
    setTimeout(async () => {
        if (type === 'Product') {
            const chat = await Swal.fire({ 
                title: '🎉 ยินดีด้วยครับ!', html: `<div class="text-center mb-2"><b class="text-dark fs-5">${name}</b></div><div class="text-start small mt-3"><p class="mb-2">รบกวนลูกค้ากด <b>"ทักแชท LINE"</b> ด้านล่างเพื่อยืนยันรับของนะครับ:</p><ul class="text-primary fw-bold" style="line-height: 1.8;"><li>แจ้งชื่อ-นามสกุล และ เบอร์โทร</li><li class="text-danger">ส่งรูปแคปหน้าจอหน้านี้ให้แอดมิน</li><li>ระบุว่า: <span class="text-success border-bottom border-success">"รับเองหน้าร้าน"</span> หรือ <span class="text-danger border-bottom border-danger">"ให้จัดส่ง"</span></li></ul></div>`, 
                imageUrl: img, imageWidth: 150, confirmButtonText: '💬 ทักแชท LINE ร้าน', confirmButtonColor: '#00B900', showCancelButton: true, cancelButtonText: 'ปิดหน้าต่าง'
            });
            if (chat.isConfirmed) window.open('https://lin.ee/NZjv3Aj', '_blank');
        } else { Swal.fire({ title: '✨ โบนัส!', text: msg, icon: 'success', imageUrl: img, imageWidth: 100 }); }
        showPage('gacha');
    }, 1200);
}

// 🚀 ย้ายการ Render หน้า "ของรางวัลปกติ" มาที่นี่
window.renderHomePage = async function() {
    const container = document.getElementById('app-content');
    container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div></div>';
    const res = await API.get('getProducts');
    let html = `<div class="d-flex justify-content-between align-items-center mb-4"><h2 class="fw-bold text-dark">${t('home_title')}</h2></div><div class="row">`;
    if (res.status === 'success') {
        res.data.forEach(p => {
            let isOut = p.stock <= 0; let imgUrl = p.image && p.image.trim() !== '' ? p.image : 'https://placehold.co/400x400/eeeeee/31343C?text=No+Image';
            html += `<div class="col-md-4 mb-4"><div class="card product-card h-100 shadow-sm ${isOut ? 'opacity-50' : ''}"><img src="${imgUrl}" class="card-img-top" style="height:250px; object-fit:cover;" onclick="showImageModal(this.src)"><div class="card-body text-center d-flex flex-column"><h5 class="fw-bold">${p.name}</h5><p class="text-muted small flex-grow-1">${p.desc}</p><h4 class="text-danger fw-bold my-3">${formatPrice(p.points)}</h4><div class="mb-3"><span class="badge ${isOut ? 'bg-danger' : 'bg-success'} px-3 py-2 rounded-pill fs-6">${tp('stock', {n: p.stock})}</span></div><button class="btn btn-primary w-100 py-2 fw-bold rounded-pill" onclick="handleRedeem('${p.id}', ${p.points})" ${isOut ? 'disabled' : ''}>${isOut ? t('out_of_stock') : t('redeem_btn')}</button></div></div></div>`;
        });
    }
    container.innerHTML = html + `</div>`;
};

// 🚀 ย้ายการ Render หน้า "กล่องสุ่ม" มาที่นี่
window.renderGachaPage = async function() {
    if (!currentUser) return openAuth('login');
    const container = document.getElementById('app-content');
    container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border text-info" style="width: 3rem; height: 3rem;"></div></div>';
    
    const [setRes, gachaRes] = await Promise.all([API.get('getSettings'), API.get('getGacha')]);
    const price = setRes.status === 'success' ? (setRes.data.gacha_price || 2000) : 2000;
    let gachaItemsHtml = '';
    
    if (gachaRes.status === 'success' && gachaRes.data.length > 0) {
        gachaItemsHtml = `<h4 class="fw-bold text-center mt-5 mb-4 border-bottom pb-2 text-primary">${t('reward_in_box')}</h4><div class="row justify-content-center">`;
        gachaRes.data.forEach(item => {
            if (item.type === 'Product' && item.stock > 0) {
                let imgUrl = item.image && item.image.trim() !== '' ? item.image : 'https://placehold.co/400x400/eeeeee/31343C?text=No+Image';
                gachaItemsHtml += `<div class="col-6 col-md-3 mb-3"><div class="card h-100 shadow-sm border-0 bg-white"><img src="${imgUrl}" class="card-img-top rounded-top" style="height:120px; object-fit:cover; cursor:zoom-in;" onclick="showImageModal(this.src)"><div class="card-body p-2 text-center d-flex flex-column justify-content-between"><p class="mb-1 small fw-bold text-truncate" title="${item.name}">${item.name}</p><div><span class="badge bg-success rounded-pill px-3">${tp('stock', {n: item.stock})}</span></div></div></div></div>`;
            } else if (item.type === 'Points') {
                 gachaItemsHtml += `<div class="col-6 col-md-3 mb-3"><div class="card h-100 shadow-sm border-warning" style="background-color: #fffde7;"><div class="card-body p-2 text-center d-flex flex-column justify-content-center align-items-center"><i class="fas fa-coins text-warning fs-2 mb-2"></i><p class="mb-1 small fw-bold text-dark">${t('pts_back')} ${item.value}</p><div><span class="badge bg-secondary rounded-pill">${t('consolation')}</span></div></div></div></div>`;
            }
        });
        gachaItemsHtml += `</div>`;
    }

    let notiHtml = `
    <style>.noti-card { border-radius: 1rem; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-top: 2rem; } .noti-scroll { max-height: 280px; overflow-y: auto; overflow-x: hidden; } .noti-scroll::-webkit-scrollbar { width: 6px; } .noti-scroll::-webkit-scrollbar-track { background: #f8f9fa; border-radius: 10px; } .noti-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } .noti-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; } .noti-item { border-left: 4px solid #0dcaf0; transition: all 0.2s ease; cursor: default; } .noti-item:hover { background-color: #f8f9fa; transform: translateX(2px); } .noti-item.pity-drop { border-left-color: #dc3545; background-color: #fff5f5; }</style>
    <div class="col-md-10 mt-4"><div class="card noti-card overflow-hidden text-start mx-auto" style="max-width: 800px;"><div class="card-header bg-dark text-white fw-bold py-3 d-flex align-items-center justify-content-between border-0"><div><i class="fas fa-bullhorn text-warning me-2"></i> ${t('gacha_noti_title')}</div><span class="badge bg-light text-dark rounded-pill shadow-sm">${t('realtime')}</span></div><div class="card-body p-0 noti-scroll"><ul class="list-group list-group-flush">`;

    if (typeof notifications !== 'undefined' && notifications.length > 0) {
        [...notifications].reverse().forEach(n => { 
            let isPity = (n.msg || '').includes('แตกการันตี') || (n.msg || '').includes('Pity');
            let itemClass = isPity ? 'noti-item pity-drop' : 'noti-item';
            let badgeHtml = isPity ? `<span class="badge bg-danger rounded-pill shadow-sm" style="font-size: 0.65rem;">🔥 Pity!</span>` : `<span class="badge bg-info text-dark rounded-pill shadow-sm" style="font-size: 0.65rem;">🎁 Drop</span>`;
            notiHtml += `<li class="list-group-item ${itemClass} px-4 py-3 border-bottom"><div class="d-flex justify-content-between align-items-center mb-1"><small class="text-muted fw-bold" style="font-size: 0.75rem;"><i class="far fa-clock"></i> ${n.time}</small>${badgeHtml}</div><div class="fw-bold text-dark text-truncate" style="font-size: 0.9rem;" title="${n.msg}">${n.msg}</div></li>`;
        });
    } else {
        let emptyMsg = currentLang === 'th' ? 'ยังไม่มีประวัติการดรอปรถในขณะนี้' : 'No drop history yet.';
        notiHtml += `<li class="list-group-item text-center text-muted py-5 small">${emptyMsg}</li>`;
    }
    notiHtml += `</ul></div></div>`;

    container.innerHTML = `
        <div class="row justify-content-center text-center">
            <div class="col-12 mb-4"><h2 class="text-info fw-bold display-5">${t('gacha_title')}</h2><p class="text-muted fs-5">${tp('gacha_subtitle', {n: `<b>${formatPrice(price)}</b>`})}</p></div>
            <div class="col-md-10" id="gachaArea">
                <div class="p-4 p-md-5 bg-white shadow-lg rounded-4 mt-2 border border-info border-3 position-relative overflow-hidden">
                    <img src="https://cdn-icons-png.flaticon.com/512/5724/5724853.png" width="100" class="mb-3" style="animation: pulse 2s infinite;">
                    <h3 class="fw-bold mb-4 text-dark">${currentLang === 'th' ? 'พร้อมเสี่ยงดวงหรือยัง?' : 'Ready to spin?'}</h3>
                    <div class="d-flex gap-3 justify-content-center flex-wrap">
                        <button class="btn btn-warning text-dark fw-bold px-4 py-3 rounded-pill shadow flex-grow-1" onclick="startGacha(${price})" style="font-size: 1.1rem; max-width: 250px;">${t('spin_1')}<br><small>(${formatPrice(price)})</small></button>
                        <button class="btn btn-danger text-white fw-bold px-4 py-3 rounded-pill shadow flex-grow-1" onclick="startGacha10(${price})" style="font-size: 1.1rem; max-width: 250px;">${t('spin_10')}<br><small>(${formatPrice(price * 10)})</small></button>
                    </div>
                </div>
            </div>
            ${notiHtml} 
            <div class="col-md-10 mt-4 text-start">${gachaItemsHtml}</div>
        </div>`;
};
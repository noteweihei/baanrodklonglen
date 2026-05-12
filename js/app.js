// ==========================================
// 🖥️ ไฟล์ app.js (จัดการ UI, Navbar, Routing และ AI Chat)
// ==========================================

function formatPrice(pts) { 
    if (currentLang === 'th') return `${pts} แต้ม`;
    return `${pts} Pts`; 
}

let currentPage = 'home';

// ==========================================
// 1. UI Helpers & Notifications
// ==========================================
window.showImageModal = function (src) {
  document.getElementById("fullSizeImage").src = src;
  new bootstrap.Modal(document.getElementById("imageModal")).show();
};

function acceptTerms() {
  localStorage.setItem("termsAccepted", "true");
  bootstrap.Modal.getInstance(document.getElementById("termsIntroModal")).hide();
  API.post({ action: "logVisit" });
}

async function loadNotiAndStats() {
  const res = await API.get("getNotifications");
  if (res.status === "success" && res.data.length > 0) { notifications = res.data; renderNoti(); }
  const statRes = await API.get("getStats");
  if (statRes.status === "success") { const visitEl = document.getElementById("visitCount"); if (visitEl) visitEl.innerText = statRes.visits; }
}

function renderNoti() {
  const list1 = document.getElementById("notiList"); const list2 = document.getElementById("notiListM");
  const badge1 = document.getElementById("notiCount"); const badge2 = document.getElementById("notiCountM");
  if (!list1) return;
  if (!document.getElementById("notiGlobalStyle")) {
    const style = document.createElement("style"); style.id = "notiGlobalStyle";
    style.innerHTML = `#notiList, #notiListM { width: 320px !important; max-width: 90vw !important; max-height: 400px !important; overflow-y: auto !important; overflow-x: hidden !important; padding: 0; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border-radius: 0.5rem; } .my-noti-item { display: block; width: 100%; padding: 0.75rem 1rem; clear: both; font-weight: 400; color: #212529; text-align: inherit; white-space: normal !important; word-wrap: break-word !important; background-color: transparent; border: 0; } .my-noti-item:hover { background-color: #f8f9fa; }`;
    document.head.appendChild(style);
  }
  if (typeof notifications !== "undefined" && notifications.length > 0) {
    let html = ""; let unreadCount = 0;
    notifications.forEach((n) => {
      const notiDate = parseThaiDate(n.time);
      if (notiDate > lastReadTime) unreadCount++;
      let isPity = n.msg.includes("แตกการันตี") || n.msg.includes("Pity");
      let pityIcon = isPity ? '🔥 <span class="text-danger fw-bold">Pity แตก!</span><br>' : "";
      let bgClass = notiDate > lastReadTime ? "bg-light" : "bg-white";
      let borderClass = isPity ? "border-start border-danger border-4" : "border-start border-info border-4";
      html += `<li class="border-bottom" style="margin: 0; padding: 0;"><div class="my-noti-item ${bgClass} ${borderClass}" style="cursor: default;"><div class="d-flex justify-content-between align-items-center mb-1"><small class="text-primary fw-bold" style="font-size: 0.75rem;"><i class="far fa-clock"></i> ${n.time}</small></div><div class="text-dark" style="font-size: 0.85rem; line-height: 1.5;">${pityIcon}${n.msg}</div></div></li>`;
    });
    list1.innerHTML = html; if (list2) list2.innerHTML = html;
    if (unreadCount > 0) {
      if (badge1) { badge1.innerText = unreadCount; badge1.classList.remove("d-none"); }
      if (badge2) { badge2.innerText = unreadCount; badge2.classList.remove("d-none"); }
    } else {
      if (badge1) badge1.classList.add("d-none"); if (badge2) badge2.classList.add("d-none");
    }
  } else {
    let emptyHtml = `<li class="p-4 text-center text-muted small" style="white-space: normal;">ไม่มีการแจ้งเตือน</li>`;
    list1.innerHTML = emptyHtml; if (list2) list2.innerHTML = emptyHtml;
  }
}

function readNoti() {
  const b1 = document.getElementById("notiCount"); const b2 = document.getElementById("notiCountM");
  if (b1) b1.classList.add("d-none"); if (b2) b2.classList.add("d-none");
  lastReadTime = new Date().getTime(); localStorage.setItem("lastNotiReadTime", lastReadTime); renderNoti();
}

function parseThaiDate(dateStr) {
  const parts = dateStr.split(" "); const d = parts[0].split("/"); const t = parts[1].split(":");
  return new Date(d[2], d[1] - 1, d[0], t[0], t[1]).getTime();
}

// ==========================================
// 2. ระบบนำทาง Navbar 
// ==========================================
window.updateNav = function() {
    const nav = document.getElementById('nav-menu');
    if (nav) nav.className = "navbar-nav ms-auto align-items-lg-center gap-lg-2"; 

    const mobileBottomNav = document.getElementById('mobile-bottom-nav');
    const mobileTopIcons = document.getElementById('mobile-top-icons');
    const langLabel = currentLang === 'th' ? 'EN' : 'TH';

    let cart = JSON.parse(localStorage.getItem('shopCart')) || [];
    let cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
    let cartBadge = cartCount > 0 ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm border border-white" style="font-size: 0.55rem; padding: 0.25em 0.4em;">${cartCount}</span>` : `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none">0</span>`;

    let menuHtml = `
        <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle fw-bold d-flex align-items-center gap-1" href="#" id="rewardDropdown" role="button" data-bs-toggle="dropdown">
                <i class="fas fa-gift text-warning"></i> ${t('nav_reward')}
            </a>
            <ul class="dropdown-menu shadow border-0 mt-2">
                <li><a class="dropdown-item py-2 fw-bold text-dark" onclick="showPage('home')"><i class="fas fa-car-side text-primary me-2"></i>${t('nav_home')}</a></li>
                <li><a class="dropdown-item py-2 fw-bold text-primary" onclick="showPage('gacha')"><i class="fas fa-box-open text-danger me-2"></i>${t('nav_gacha')}</a></li>
            </ul>
        </li>
        <li class="nav-item"><a class="nav-link fw-bold d-flex align-items-center gap-1" onclick="showPage('shop')"><i class="fas fa-store text-success"></i> ${t('nav_shop')}</a></li>
        
        <li class="nav-item mx-lg-1"><a class="nav-link position-relative d-flex align-items-center justify-content-center" onclick="showPage('cart')" style="cursor: pointer; width: 40px; height: 40px;"><i class="fas fa-shopping-cart fs-5 text-white"></i>${cartBadge}</a></li>
        
        <li class="nav-item"><a class="nav-link fw-bold" onclick="showPage('order')">${t('nav_order')}</a></li>
        <li class="nav-item"><a class="nav-link fw-bold" onclick="showPage('terms')">${t('nav_terms')}</a></li>
        <li class="nav-item"><a class="nav-link fw-bold" onclick="showPage('contact')">${t('nav_contact')}</a></li>
    `;

    if (currentUser) {
        menuHtml += `
            <li class="nav-item d-none d-lg-block mx-1"><span class="text-white-50">|</span></li>
            <li class="nav-item"><a class="nav-link fw-bold text-info d-flex align-items-center gap-1" onclick="showPage('dashboard')"><i class="fas fa-user-circle fs-5"></i> ${t('nav_dashboard')}</a></li>
            <li class="nav-item my-2 my-lg-0 mx-lg-1">
                <div class="pts-badge-container shadow-sm">
                    <i class="fas fa-coins text-warning"></i>
                    <span id="navPoints" class="text-white">${currentUser.points}</span>
                    <i class="fas fa-sync-alt sync-btn text-white-50" id="syncIcon" onclick="syncPoints()"></i>
                </div>
            </li>
            <li class="nav-item d-none d-lg-block">
                <a class="nav-link noti-bell d-flex align-items-center justify-content-center" data-bs-toggle="dropdown" onclick="readNoti()" style="width: 40px; height: 40px;">
                    <i class="fas fa-bell fs-5 text-white"></i><span class="noti-badge d-none" id="notiCount">0</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2 p-0" id="notiList"></ul>
            </li>
            <li class="nav-item">
                <a class="nav-link text-danger fw-bold d-flex align-items-center justify-content-center" onclick="logout()" title="${t('nav_logout')}" style="width: 40px; height: 40px;">
                    <i class="fas fa-sign-out-alt fs-5"></i>
                </a>
            </li>
        `;
        if (currentUser.role === 'admin') menuHtml += `<li class="nav-item"><a class="nav-link text-warning fw-bold d-flex align-items-center justify-content-center" href="admin.html" title="แอดมิน" style="width: 40px; height: 40px;"><i class="fas fa-cog fs-5"></i></a></li>`;
    } else {
        menuHtml += `<li class="nav-item ms-lg-3"><button class="btn btn-warning text-dark btn-sm fw-bold px-4 rounded-pill shadow-sm" onclick="openAuth('login')"><i class="fas fa-sign-in-alt me-1"></i> ${t('nav_login')}</button></li>`;
    }
    
    menuHtml += `<li class="nav-item ms-lg-2"><button class="btn btn-sm btn-outline-light rounded-pill px-3 fw-bold" onclick="toggleLang()"><i class="fas fa-globe me-1"></i> ${langLabel}</button></li>`;
    
    if(nav) nav.innerHTML = menuHtml;

    if (mobileTopIcons) {
        let mTopHtml = `<div class="d-flex align-items-center justify-content-center w-100 gap-2 mt-1">
            <button class="btn btn-light p-0 rounded-circle d-flex align-items-center justify-content-center position-relative shadow-sm border-0" style="width: 34px; height: 34px;" onclick="showPage('cart')">
                <i class="fas fa-shopping-cart text-primary" style="font-size: 0.9rem;"></i>${cartBadge}
            </button>`;
            
        if (currentUser) {
            mTopHtml += `
            <div class="d-flex align-items-center rounded-pill px-2 shadow-sm" style="height: 34px; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255,255,255,0.2);">
                <i class="fas fa-coins text-warning me-1" style="font-size: 0.85rem;"></i>
                <span id="navPointsM" class="text-warning fw-bold me-1" style="font-size: 0.85rem; white-space: nowrap;">${currentUser.points}</span>
                <i class="fas fa-sync-alt sync-btn ms-1" id="syncIconM" onclick="syncPoints()" style="font-size: 0.8rem;"></i>
            </div>
            <div class="dropdown">
                <button class="btn btn-light p-0 rounded-circle d-flex align-items-center justify-content-center position-relative shadow-sm border-0" style="width: 34px; height: 34px;" data-bs-toggle="dropdown" onclick="readNoti()">
                    <i class="fas fa-bell text-primary" style="font-size: 0.95rem;"></i><span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none" id="notiCountM" style="font-size: 0.55rem; padding: 0.25rem 0.35rem; border: 2px solid white;">0</span>
                </button>
                <ul class="dropdown-menu shadow border-0 mt-2" id="notiListM" style="position: absolute; z-index: 1050;"></ul>
            </div>`;
        }
        
        mTopHtml += `<button class="btn btn-light p-0 rounded-circle d-flex align-items-center justify-content-center shadow-sm fw-bold text-dark border-0" style="width: 34px; height: 34px; font-size: 0.8rem;" onclick="toggleLang()">${langLabel}</button>`;
        
        if (currentUser) {
            if (currentUser.role === 'admin') {
                mTopHtml += `
                <div class="dropdown">
                    <button class="btn btn-warning p-0 rounded-circle d-flex align-items-center justify-content-center shadow-sm border-0" style="width: 34px; height: 34px; background: linear-gradient(135deg, #f6d365 0%, #fda085 100%) !important;" data-bs-toggle="dropdown">
                        <i class="fas fa-user-shield text-white" style="font-size: 0.9rem;"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2 rounded-4 p-2" style="position: absolute; z-index: 1050;">
                        <li><a class="dropdown-item py-2 fw-bold text-secondary rounded" href="admin.html"><i class="fas fa-cog me-2 text-warning"></i> ระบบแอดมิน</a></li>
                        <li><a class="dropdown-item py-2 fw-bold text-primary rounded" href="shop-admin.html"><i class="fas fa-robot me-2 text-info"></i> ร้านค้า AI</a></li>
                    </ul>
                </div>`;
            }
            mTopHtml += `
            <button class="btn btn-danger p-0 rounded-circle d-flex align-items-center justify-content-center shadow-sm border-0" style="width: 34px; height: 34px; background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%) !important;" onclick="logout()">
                <i class="fas fa-sign-out-alt text-white" style="font-size: 0.95rem;"></i>
            </button>`;
        }
        mTopHtml += `</div>`;
        mobileTopIcons.innerHTML = mTopHtml;
    }

    if (mobileBottomNav) {
        let mBotHtml = `
            <a class="mobile-nav-item ${currentPage==='home'?'active':''}" onclick="showPage('home')">
                <i class="fas fa-gift"></i><span>${currentLang==='th'?'แลกของ':'Rewards'}</span>
            </a>
            <a class="mobile-nav-item ${currentPage==='gacha'?'active':''}" onclick="showPage('gacha')">
                <i class="fas fa-dice"></i><span>${currentLang==='th'?'กาชา':'Gacha'}</span>
            </a>
            <a class="mobile-nav-item special-btn active" onclick="showPage('shop')">
                <i class="fas fa-store"></i><span class="text-success mt-1">${currentLang==='th'?'ร้านค้า':'Shop'}</span>
            </a>
            <a class="mobile-nav-item ${currentPage==='order'?'active':''}" onclick="showPage('order')">
                <i class="fas fa-file-invoice-dollar"></i><span>${currentLang==='th'?'รับแต้ม':'Earn'}</span>
            </a>
        `;
        if (currentUser) {
            mBotHtml += `<a class="mobile-nav-item ${currentPage==='dashboard'?'active':''}" onclick="showPage('dashboard')"><i class="fas fa-user-circle"></i><span>${currentLang==='th'?'บัญชี':'Profile'}</span></a>`;
        } else {
            mBotHtml += `<a class="mobile-nav-item" onclick="openAuth('login')"><i class="fas fa-sign-in-alt"></i><span>${currentLang==='th'?'ล็อกอิน':'Login'}</span></a>`;
        }
        mobileBottomNav.innerHTML = mBotHtml;
    }

    renderNoti();
}

// ==========================================
// 🚀 3. ระบบตู้สวิตช์หน้าจอ (Routing)
// ==========================================
window.showPage = async function (page) {
  currentPage = page; 
  updateNav();
  const container = document.getElementById("app-content");

  if (page === "shop") return typeof renderShopPage === "function" ? renderShopPage() : container.innerHTML = '<div class="alert alert-danger">Error: ไฟล์ shop.js มีปัญหา</div>';
  if (page === "cart") return typeof renderCartPage === "function" ? renderCartPage() : container.innerHTML = '<div class="alert alert-danger">Error: ไฟล์ shop.js มีปัญหา</div>';
  if (page === "home") return typeof renderHomePage === "function" ? renderHomePage() : container.innerHTML = '<div class="alert alert-danger">Error: ไฟล์ reward.js มีปัญหา</div>';
  if (page === "gacha") return typeof renderGachaPage === "function" ? renderGachaPage() : container.innerHTML = '<div class="alert alert-danger">Error: ไฟล์ reward.js มีปัญหา</div>';
  if (page === "order") return typeof renderOrderPage === "function" ? renderOrderPage() : container.innerHTML = '<div class="alert alert-danger">Error: ไฟล์ member.js มีปัญหา</div>';
  if (page === "dashboard") return typeof renderDashboardPage === "function" ? renderDashboardPage() : container.innerHTML = '<div class="alert alert-danger">Error: ไฟล์ member.js มีปัญหา</div>';

  container.innerHTML = `<div class="text-center mt-5"><div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div></div>`;

  if (page === "terms") {
    const set = await API.get("getSettings");
    let base = 100, rate = 10;
    if (set.status === "success") { base = set.data.amount_base; rate = set.data.points_rate; }
    container.innerHTML = `
        <div class="row justify-content-center"><div class="col-md-10"><div class="card shadow-sm border-0 rounded-4 overflow-hidden"><div class="card-header bg-danger text-white p-4 text-center"><h4 class="mb-0 fw-bold"><i class="fas fa-file-contract me-2"></i> ${t("terms_title")}</h4><p class="mb-0 small mt-1">${t("terms_sub")}</p></div><div class="card-body p-4 p-md-5 bg-white"><div class="mb-4"><h5 class="text-primary fw-bold border-bottom pb-2"><i class="fas fa-coins me-2"></i> ${t("t1_head")}</h5><ul class="text-dark small" style="line-height: 1.8;"><li>${tp("t1_1", { base: base, rate: rate })}</li><li class="text-danger fw-bold bg-danger bg-opacity-10 p-2 rounded mt-2 mb-2 border-start border-danger border-4">${t("t1_2")}<br><span class="text-dark fw-normal">${t("t1_3")}</span></li><li>${t("t1_4")}</li></ul></div><div class="mb-4"><h5 class="text-warning text-dark fw-bold border-bottom pb-2"><i class="fas fa-box-open me-2"></i> ${t("t2_head")}</h5><ul class="text-dark small" style="line-height: 1.8;"><li>${t("t2_1")}</li><li>${t("t2_2")}</li><li class="text-danger fw-bold">${t("t2_3")}</li></ul></div><div class="mb-4"><h5 class="text-success fw-bold border-bottom pb-2"><i class="fas fa-gift me-2"></i> ${t("t3_head")}</h5><ul class="text-dark small" style="line-height: 1.8;"><li>${t("t3_1")}</li><li class="text-success fw-bold bg-success bg-opacity-10 p-2 rounded mt-2 border-start border-success border-4">${t("t3_2")}</li><li class="text-danger fw-bold bg-warning bg-opacity-10 p-2 rounded mt-2 border-start border-warning border-4">${t("t3_3")}</li><li class="mt-2">${t("t3_4")}</li></ul></div><div class="mb-0"><h5 class="text-secondary fw-bold border-bottom pb-2"><i class="fas fa-shield-alt me-2"></i> ${t("t4_head")}</h5><ul class="text-muted small" style="line-height: 1.8;"><li>${t("t4_1")}</li><li>${t("t4_2")}</li></ul></div></div></div></div></div>`;
  } else if (page === "contact") {
    container.innerHTML = `
        <div class="row justify-content-center mt-4"><div class="col-md-6 text-center"><h3 class="mb-4 fw-bold">${t("contact_title")}</h3><div class="card shadow border-0 mb-4 rounded-4"><div class="card-body p-4 fs-5 text-start"><p>${t("contact_phone")} <a href="tel:0647188878" class="text-decoration-none fw-bold">064-718-8878</a></p><p>${t("contact_line")} <a href="https://lin.ee/NZjv3Aj" target="_blank" class="text-decoration-none fw-bold text-success">${t("contact_line_btn")}</a></p><p>${t("contact_fb")} <a href="https://www.facebook.com/banrodkonglen/" target="_blank" class="text-decoration-none fw-bold">บ้านรถของเล่น</a></p><p>${t("contact_tk")} <a href="https://www.tiktok.com/@home.hotwheels" target="_blank" class="text-decoration-none fw-bold text-dark">@home.hotwheels</a></p></div></div><div class="alert alert-danger fw-bold rounded-pill shadow-sm">${t("contact_follow")}</div></div></div>`;
  }
};

// ==========================================
// 🤖 4. ระบบแชทผู้ช่วย AI
// ==========================================
let isChatInit = false;

window.toggleChat = function() {
  const box = document.getElementById("chat-box");
  box.classList.toggle("d-none");
  if (!isChatInit) {
      appendChatMessage('AI', 'สวัสดีครับ! 🚗 ผมคือผู้ช่วย AI ของบ้านรถของเล่น มีอะไรให้ผมช่วยไหมครับ?');
      isChatInit = true;
  }
  const scrollArea = document.getElementById("chatMessages");
  setTimeout(() => { scrollArea.scrollTop = scrollArea.scrollHeight; }, 100);
}

window.sendChatMessage = async function() {
    const input = document.getElementById("chatInput");
    const msg = input.value.trim();
    if (!msg) return;
    appendChatMessage('User', msg);
    input.value = "";
    showTypingIndicator();
    const res = await API.shopPost({ action: "aiChat", message: msg });
    removeTypingIndicator();
    if (res.status === "success") appendChatMessage('AI', res.answer);
    else appendChatMessage('AI', 'ขออภัยครับ ระบบ AI ขัดข้องชั่วคราว 🙏');
}

function appendChatMessage(sender, text) {
    const chatArea = document.getElementById("chatMessages");
    const isAI = sender === 'AI';
    const bubbleClass = isAI ? 'chat-ai' : 'chat-user';
    const alignClass = isAI ? 'align-items-start' : 'align-items-end';
    const html = `<div class="d-flex flex-column ${alignClass}"><div class="chat-bubble shadow-sm ${bubbleClass}">${text}</div></div>`;
    chatArea.insertAdjacentHTML('beforeend', html);
    chatArea.scrollTop = chatArea.scrollHeight; 
}

function showTypingIndicator() {
    const chatArea = document.getElementById("chatMessages");
    const html = `<div class="d-flex flex-column align-items-start" id="typingIndicator"><div class="chat-bubble chat-ai shadow-sm typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>`;
    chatArea.insertAdjacentHTML('beforeend', html);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function removeTypingIndicator() {
    const el = document.getElementById("typingIndicator");
    if (el) el.remove();
}

window.viewProductFromChat = async function(productId) {
    const chatBox = document.getElementById("chat-box");
    if(chatBox) chatBox.classList.add("d-none");
    Swal.fire({ title: 'กำลังค้นหาสินค้า...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const res = await API.shopGet("getProducts"); 
    if (res.status === 'success') {
        let cleanId = productId.replace(/\[|\]|\*|"|'/g, '').trim();
        const p = res.data.find(x => x.id === cleanId);
        if (p) {
            let imgUrl = p.image && p.image.trim() !== '' ? p.image : 'https://placehold.co/400x400/eeeeee/31343C?text=No+Image';
            let price = parseFloat(p.retail_price) || 0;
            let stock = parseInt(p.stock) || 0;
            Swal.fire({
                title: `<span class="fw-bold text-dark fs-4">${p.name}</span>`,
                html: `
                    <div class="mb-3"><span class="badge bg-primary px-3 py-2 fs-6">ราคา ฿${price.toLocaleString()}</span></div>
                    <p class="text-muted small">${p.desc || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
                    <div class="alert alert-info py-2 mb-0 fw-bold">คงเหลือในสต๊อก: ${stock} คัน</div>
                `,
                imageUrl: imgUrl,
                imageWidth: 250,
                imageClass: 'rounded-4 shadow-sm border border-2 border-light mb-3',
                showCancelButton: true,
                confirmButtonText: '<i class="fas fa-cart-plus me-1"></i> หยิบใส่ตะกร้า',
                cancelButtonText: 'ปิดหน้าต่าง',
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#6c757d'
            }).then((result) => {
                if(result.isConfirmed) {
                    if (stock <= 0) return Swal.fire('ขออภัยค่ะ', 'สินค้ารายการนี้หมดสต๊อกแล้ว', 'warning');
                    let cart = JSON.parse(localStorage.getItem('shopCart')) || [];
                    let existing = cart.find(i => i.id === p.id);
                    if (existing) {
                        if (existing.qty < stock) existing.qty++;
                        else return Swal.fire('สต๊อกไม่พอ!', 'คุณหยิบสินค้าชิ้นนี้จนหมดสต๊อกแล้วค่ะ', 'warning');
                    } else {
                        cart.push({ id: p.id, sku: p.sku, name: p.name, price: price, retail_price: price, qty: 1, maxStock: stock, stock: stock, img: imgUrl });
                    }
                    localStorage.setItem('shopCart', JSON.stringify(cart));
                    updateNav(); 
                    Swal.fire({ title: 'เพิ่มลงตะกร้าแล้ว! 🎉', icon: 'success', timer: 1500, showConfirmButton: false }).then(() => {
                        sessionStorage.setItem('openCartAfterRefresh', 'true');
                        window.location.reload(); 
                    });
                }
            });
        } else { Swal.fire('ขออภัยค่ะ', 'สินค้ารายการนี้อาจหมดสต๊อกหรือถูกลบไปแล้วค่ะ', 'error'); }
    } else { Swal.fire('ผิดพลาด', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error'); }
}

// ==========================================
// 🛒 5. ฟังก์ชันพิเศษ: ดูรายละเอียดและหยิบลงตะกร้าด่วนจาก AI
// ==========================================
window.viewProductFromChat = async function(productId) {
    const chatBox = document.getElementById("chat-box");
    if(chatBox) chatBox.classList.add("d-none"); // ซ่อนแชทชั่วคราวไม่ให้บัง
    
    Swal.fire({ title: 'กำลังค้นหาสินค้า...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    const res = await API.shopGet("getProducts"); 
    
    if (res.status === 'success') {
        let cleanId = productId.replace(/\[|\]|\*|"|'/g, '').trim();
        const p = res.data.find(x => x.id === cleanId);
        
        if (p) {
            let imgUrl = p.image && p.image.trim() !== '' ? p.image : 'https://placehold.co/400x400/eeeeee/31343C?text=No+Img';
            let price = parseFloat(p.retail_price) || 0;
            let stock = parseInt(p.stock) || 0;
            
            Swal.fire({
                title: `<span class="fw-bold text-dark fs-4">${p.name}</span>`,
                html: `
                    <div class="mb-3"><span class="badge bg-primary px-3 py-2 fs-6">ราคา ฿${price.toLocaleString()}</span></div>
                    <p class="text-muted small">${p.desc || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
                    <div class="alert alert-info py-2 mb-0 fw-bold">คงเหลือในสต๊อก: ${stock} คัน</div>
                `,
                imageUrl: imgUrl,
                imageWidth: 250,
                imageClass: 'rounded-4 shadow-sm border border-2 border-light mb-3',
                showCancelButton: true,
                confirmButtonText: '<i class="fas fa-cart-plus me-1"></i> หยิบใส่ตะกร้า',
                cancelButtonText: 'ปิดหน้าต่าง',
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#6c757d'
            }).then((result) => {
                if(result.isConfirmed) {
                    if (stock <= 0) {
                        return Swal.fire('ขออภัยค่ะ', 'สินค้ารายการนี้หมดสต๊อกแล้ว', 'warning');
                    }
                    
                    let cart = JSON.parse(localStorage.getItem('shopCart')) || [];
                    let existing = cart.find(i => i.id === p.id);
                    
                    if (existing) {
                        if (existing.qty < stock) existing.qty++;
                        else return Swal.fire('สต๊อกไม่พอ!', 'คุณหยิบสินค้าชิ้นนี้จนหมดสต๊อกแล้วค่ะ', 'warning');
                    } else {
                        // 💡 เปลี่ยนชื่อคีย์เก็บรูปเป็น 'img' ให้ตรงกับที่ตะกร้าใช้อ่าน
                        cart.push({ 
                            id: p.id, 
                            sku: p.sku, 
                            name: p.name, 
                            price: price, 
                            retail_price: price, 
                            qty: 1, 
                            maxStock: stock, 
                            stock: stock, 
                            img: p.image 
                        });
                    }
                    
                    localStorage.setItem('shopCart', JSON.stringify(cart));
                    updateNav(); 
                    
                    // 💡 หัวใจสำคัญ: รีเฟรชหน้าเพื่อล้าง Memory แล้วค่อยเด้งไปหน้าตะกร้า
                    Swal.fire({ title: 'เพิ่มลงตะกร้าแล้ว! 🎉', icon: 'success', timer: 1500, showConfirmButton: false }).then(() => {
                        sessionStorage.setItem('openCartAfterRefresh', 'true');
                        window.location.reload(); 
                    });
                }
            });
        } else {
            Swal.fire('ขออภัยค่ะ', 'สินค้ารายการนี้อาจหมดสต๊อกหรือถูกลบไปแล้วค่ะ', 'error');
        }
    } else {
        Swal.fire('ผิดพลาด', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
    }
}

// ==========================================
// 6. ระบบเริ่มต้นทำงาน (Boot)
// ==========================================
window.onload = () => {
  updateNav();
  
  // 💡 ตรวจเช็คว่าต้องเปิดตะกร้าหลังรีเฟรชหรือไม่
  if (sessionStorage.getItem('openCartAfterRefresh') === 'true') {
      sessionStorage.removeItem('openCartAfterRefresh');
      showPage("cart");
  } else {
      // 💡 เปลี่ยนจาก "home" เป็น "shop" เพื่อให้หน้าแรกคือร้านค้าเสมอ
      showPage("shop"); 
  }

  loadNotiAndStats();
  if (!localStorage.getItem("termsAccepted")) {
    new bootstrap.Modal(document.getElementById("termsIntroModal")).show();
  } else {
    API.post({ action: "logVisit" });
  }
};
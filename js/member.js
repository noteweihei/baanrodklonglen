// ==========================================
// 👤 Module: Member Dashboard & Order System
// ==========================================

window.toggleExtraInput = function() {
    const ch = document.getElementById('channel').value; const extraDiv = document.getElementById('extraInputDiv'); const extraLabel = document.getElementById('extraLabel'); const extraName = document.getElementById('extraName'); const normalOrderDiv = document.getElementById('normalOrderDiv'); const orderIdInput = document.getElementById('orderId'); const storePaymentDiv = document.getElementById('storePaymentDiv');
    if (ch === 'Facebook' || ch === 'Line') { extraDiv.classList.remove('d-none'); extraName.required = true; extraLabel.innerText = ch === 'Facebook' ? '👉 ชื่อ Facebook ของคุณ' : '👉 ชื่อ LINE ของคุณ'; extraName.placeholder = ch === 'Facebook' ? 'สมชาย ใจดี' : 'ไอดีไลน์ หรือ ชื่อที่ใช้ทัก'; normalOrderDiv.classList.remove('d-none'); orderIdInput.required = true; storePaymentDiv.classList.add('d-none'); } 
    else if (ch === 'หน้าร้าน') { extraDiv.classList.add('d-none'); extraName.required = false; extraName.value = ''; normalOrderDiv.classList.add('d-none'); orderIdInput.required = false; storePaymentDiv.classList.remove('d-none'); } 
    else { extraDiv.classList.add('d-none'); extraName.required = false; extraName.value = ''; normalOrderDiv.classList.remove('d-none'); orderIdInput.required = true; storePaymentDiv.classList.add('d-none'); }
}

window.toggleStorePayment = function() { const isTransfer = document.getElementById('payTransfer').checked; const transferTimeInput = document.getElementById('transferTime'); if (isTransfer) { transferTimeInput.classList.remove('d-none'); transferTimeInput.required = true; } else { transferTimeInput.classList.add('d-none'); transferTimeInput.required = false; transferTimeInput.value = ''; } }

// ==========================================
// 🛡️ ฟังก์ชันตรวจสอบรูปแบบเลขพัสดุ (Tracking Number)
// ==========================================
function isTrackingNumber(text) {
    const str = text.trim().toUpperCase();
    
    // รูปแบบเลขพัสดุยอดฮิต
    const emsRegex = /^[A-Z]{2}\d{9}[A-Z]{2}$/; // ปณ.ไทย เช่น EX123456789TH
    const flashRegex = /^TH\d{10,}$/;            // Flash เช่น TH1234567890
    const spxRegex = /^SPX[A-Z0-9]+$/;           // Shopee Express
    const kerryRegex = /^KEX\d+$/;               // Kerry
    const jtRegex = /^8\d{11,}$/;                // J&T มักขึ้นต้นด้วย 8
    
    return emsRegex.test(str) || flashRegex.test(str) || spxRegex.test(str) || kerryRegex.test(str) || jtRegex.test(str);
}

// ==========================================
// 🚀 ฟังก์ชันยืนยันการแจ้งยอดโอน (อัปเกรดระบบตรวจสอบ EMS)
// ==========================================
async function submitOrder(e) { 
    e.preventDefault(); 
    
    let ch = document.getElementById('channel').value; 
    let finalOrderId = document.getElementById('orderId').value.trim();

    // 💡 ด่านที่ 1: ตรวจสอบว่าเป็นเลขพัสดุหรือไม่ (เฉพาะกรณีที่ไม่ใช่หน้าร้าน)
    if (ch !== 'หน้าร้าน' && isTrackingNumber(finalOrderId)) {
        return Swal.fire({
            title: 'ข้อมูลไม่ถูกต้อง!',
            html: `คุณกรอก <b>"หมายเลขพัสดุ"</b> เข้ามาค่ะ<br><br>
                   <div style="background: #f8f9fa; border-left: 4px solid #17a2b8; padding: 10px; text-align: left; font-size: 14px;">
                       <i class="fas fa-info-circle text-info"></i> <b>วิธีดู Order ID ที่ถูกต้อง:</b><br>
                       กรุณาดู <b>"รหัสบิล"</b> หรือ <b>"หมายเลขคำสั่งซื้อ"</b> ที่พิมพ์อยู่บนใบปะหน้ากล่องพัสดุ (ใกล้ๆ บาร์โค้ด) หรือแคปเจอร์ดูจากแอปพลิเคชันที่คุณสั่งซื้อนะคะ
                   </div>`,
            icon: 'warning',
            confirmButtonText: 'รับทราบ แก้ไขข้อมูล',
            confirmButtonColor: '#3085d6'
        });
    }

    const btn = document.getElementById('orderBtn'); 
    btn.disabled = true; 
    btn.innerText = t('processing'); 
    
    const extraName = document.getElementById('extraName').value; 
    
    if (ch === 'หน้าร้าน') { 
        finalOrderId = document.getElementById('payCash').checked ? 'เงินสด' : 'โอนชำระ เวลา: ' + document.getElementById('transferTime').value; 
    } else if ((ch === 'Facebook' || ch === 'Line') && extraName) { 
        ch = `${ch} (${extraName})`; 
    }
    
    const res = await API.post({ action: 'submitOrder', phone: currentUser.phone, orderId: finalOrderId, amount: document.getElementById('amount').value, channel: ch }); 
    
    if (res.status === 'success') { 
        await Swal.fire(t('success'), t('success'), 'success'); 
        showPage('dashboard'); 
    } else { 
        Swal.fire(t('error'), res.message, 'error'); 
        btn.disabled = false; 
        btn.innerText = t('submit_order'); 
    } 
}

async function updateProfile(e) {
    e.preventDefault(); const btn = document.getElementById('profSaveBtn'); btn.disabled = true; btn.innerText = t('processing');
    const newPassword = document.getElementById('profPassword').value; const newFName = document.getElementById('profFName').value; const newLName = document.getElementById('profLName').value; const newAddrLine = document.getElementById('profAddress').value; const newSubDist = document.getElementById('profSubDistrict').value; const newDist = document.getElementById('profDistrict').value; const newProv = document.getElementById('profProvince').value; const newZip = document.getElementById('profZip').value;
    const data = { action: 'editUserDetail', rowIndex: currentUser.rowIndex, phone: currentUser.phone, password: newPassword, fname: newFName, lname: newLName, address: newAddrLine, subdistrict: newSubDist, district: newDist, province: newProv, zipcode: newZip, points: currentUser.points };
    const res = await API.post(data);
    if (res.status === 'success') {
        currentUser.password = newPassword; currentUser.fname = newFName; currentUser.lname = newLName; currentUser.addressLine = newAddrLine; currentUser.subdistrict = newSubDist; currentUser.district = newDist; currentUser.province = newProv; currentUser.zipcode = newZip; currentUser.name = newFName + ' ' + newLName; currentUser.address = newAddrLine + ' ต.' + newSubDist + ' อ.' + newDist + ' จ.' + newProv; localStorage.setItem('currentUser', JSON.stringify(currentUser)); Swal.fire(t('success'), t('success'), 'success'); showPage('dashboard'); 
    } else { Swal.fire(t('error'), res.message, 'error'); }
    btn.disabled = false; btn.innerText = t('save_info');
}

async function cancelReward(rowIndex) {
    const conf = await Swal.fire({ title: 'ยืนยันยกเลิกของรางวัล?', html: `<span class="text-danger fw-bold">⚠️ หากยกเลิก คุณจะไม่ได้รับแต้มคืนทุกกรณีตามเงื่อนไขของร้าน ยืนยันหรือไม่?</span>`, icon: 'warning', showCancelButton: true, confirmButtonText: 'ยืนยันยกเลิก (สละแต้ม)', confirmButtonColor: '#d33' });
    if(conf.isConfirmed) {
        Swal.fire({ title: t('processing'), allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        const res = await API.post({ action: 'userCancelRedeem', rowIndex: rowIndex, phone: currentUser.phone });
        if(res.status === 'success') { Swal.fire(t('success'), 'ยกเลิกแล้ว', 'success'); showPage('dashboard'); } else { Swal.fire(t('error'), res.message, 'error'); }
    }
}

// 📊 อัปเกรด: ประวัติแจ้งยอด / คำสั่งซื้อ (Layout โฉมใหม่)
window.renderDashOrders = function() {
    const tbody = document.getElementById('dashOrdersBody'); if(!tbody) return;
    let html = ''; const data = window.dashState.orders.slice(0, window.dashState.orderLimit);
    if (data.length > 0) {
        data.forEach((o, index) => { 
            let badge = o.status==='Approved'?'success':(o.status==='Rejected'?'danger':'warning text-dark'); 
            let statusText = o.status; if(currentLang === 'th') { if(o.status === 'Pending') statusText = 'รอดำเนินการ'; if(o.status === 'Approved') statusText = 'อนุมัติแล้ว'; if(o.status === 'Rejected') statusText = 'ปฏิเสธ/ยกเลิก'; }
            html += `
            <tr class="align-middle">
                <td class="text-center text-muted fw-bold">${index + 1}</td>
                <td>
                    <div class="fw-bold text-dark mb-1"><i class="fas fa-receipt text-secondary me-1"></i>${o.orderId}</div>
                    <div class="small text-muted"><i class="far fa-clock me-1"></i>${o.timestamp}</div>
                </td>
                <td><span class="badge bg-light text-dark border px-2 py-1"><i class="fas fa-shopping-bag me-1"></i>${o.channel || '-'}</span></td>
                <td><div class="text-success fw-bold fs-6">฿${parseFloat(o.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</div></td>
                <td><div class="text-primary fw-bold bg-primary bg-opacity-10 rounded-pill px-2 py-1 d-inline-block">+${o.points ? parseFloat(o.points).toFixed(2) : 0} <i class="fas fa-coins ms-1"></i></div></td>
                <td class="text-end">
                    <span class="badge bg-${badge} rounded-pill px-3 py-2 shadow-sm">${statusText}</span>
                    ${o.remark !== '-' ? `<div class="text-danger small mt-1 fw-bold">${o.remark}</div>` : ''}
                </td>
            </tr>`; 
        }); 
    } else { html += `<tr><td colspan="6" class="text-center py-5 text-muted">${t('no_history')}</td></tr>`; }
    tbody.innerHTML = html;
};

// 🎁 อัปเกรด: ประวัติการรับของรางวัล (Layout โฉมใหม่)
window.renderDashRedeems = function() {
    const tbody = document.getElementById('dashRedeemsBody'); if(!tbody) return;
    let html = ''; const data = window.dashState.redeems.slice(0, window.dashState.redeemLimit);
    if (data.length > 0) {
        data.forEach((r, index) => { 
            let badge = r.status==='จัดส่งแล้ว'?'success':(r.status==='Pending'?'warning text-dark':(r.status==='สละสิทธิ์'?'dark':'danger')); 
            let statusText = r.status; if(currentLang === 'en') { if(r.status === 'Pending') statusText = 'Pending'; if(r.status === 'จัดส่งแล้ว') statusText = 'Shipped'; if(r.status === 'สละสิทธิ์') statusText = 'Forfeited'; }
            let btnCancel = r.status === 'Pending' ? `<button class="btn btn-sm btn-outline-danger fw-bold rounded-pill shadow-sm" onclick="cancelReward(${r.rowIndex})"><i class="fas fa-times me-1"></i>${t('cancel_btn')}</button>` : `<span class="text-muted small">-</span>`;
            html += `
            <tr class="align-middle">
                <td class="text-center text-muted fw-bold">${index + 1}</td>
                <td><div class="small text-muted"><i class="far fa-clock me-1"></i>${r.timestamp}</div></td>
                <td>
                    <div class="fw-bold text-primary mb-1">${r.productId}</div>
                    ${r.remark !== '-' ? `<div class="text-danger small fw-bold bg-danger bg-opacity-10 px-2 py-1 rounded d-inline-block">${r.remark}</div>` : ''}
                </td>
                <td><span class="badge bg-${badge} rounded-pill px-3 py-2 shadow-sm">${statusText}</span></td>
                <td class="text-end">${btnCancel}</td>
            </tr>`; 
        }); 
    } else { html += `<tr><td colspan="5" class="text-center py-5 text-muted">${t('no_history')}</td></tr>`; }
    tbody.innerHTML = html;
};

window.renderOrderPage = function() {
    if (!currentUser) return openAuth('login');
    const container = document.getElementById('app-content');
    container.innerHTML = `
        <div class="row justify-content-center mt-3 mb-5">
            <div class="col-md-8 col-lg-6">
                <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
                    <div class="card-header bg-primary text-white p-4 text-center"><h4 class="mb-0 fw-bold"><i class="fas fa-file-invoice-dollar me-2"></i> ${t('order_title')}</h4><p class="mb-0 small mt-1">${t('order_sub')}</p></div>
                    <div class="card-body p-4 p-md-5 bg-white">
                        <form onsubmit="submitOrder(event)">
                            <div class="mb-4"><label class="form-label fw-bold text-dark">${t('channel_label')}</label><select id="channel" class="form-select border-primary" onchange="toggleExtraInput()" required><option value="" disabled selected>-- ${currentLang === 'th' ? 'คลิกเพื่อเลือกช่องทาง' : 'Select Channel'} --</option><option value="Facebook">Facebook</option><option value="Line">LINE OA</option><option value="TikTok">TikTok Shop</option><option value="Shopee">Shopee</option><option value="Lazada">Lazada</option><option value="หน้าร้าน">${currentLang === 'th' ? 'หน้าร้าน (มารับเอง)' : 'Store (Pickup)'}</option></select></div>
                            <div id="extraInputDiv" class="mb-4 d-none p-3 border border-info rounded bg-info bg-opacity-10"><label id="extraLabel" class="form-label fw-bold text-dark">👉 Facebook / LINE Name</label><input type="text" id="extraName" class="form-control"></div>
                            <div id="normalOrderDiv" class="mb-4"><label class="form-label fw-bold text-dark">${t('order_id_label')}</label><input type="text" id="orderId" class="form-control border-primary" placeholder="${currentLang === 'th' ? 'เช่น 123456789' : 'e.g. 123456789'}" required></div>
                            <div id="storePaymentDiv" class="mb-4 d-none p-3 border border-warning rounded bg-warning bg-opacity-10"><label class="form-label fw-bold text-dark mb-2">💳 ${currentLang === 'th' ? 'วิธีการชำระเงิน (หน้าร้าน)' : 'Payment Method'}</label><div class="d-flex gap-4 mb-2"><div class="form-check"><input class="form-check-input" type="radio" name="storePay" id="payCash" value="เงินสด" onchange="toggleStorePayment()" checked><label class="form-check-label fw-bold" for="payCash">💵 ${currentLang === 'th' ? 'เงินสด' : 'Cash'}</label></div><div class="form-check"><input class="form-check-input" type="radio" name="storePay" id="payTransfer" value="โอนชำระ" onchange="toggleStorePayment()"><label class="form-check-label fw-bold" for="payTransfer">📱 ${currentLang === 'th' ? 'โอนชำระ' : 'Transfer'}</label></div></div><input type="time" id="transferTime" class="form-control d-none mt-2 border-warning" placeholder="${currentLang === 'th' ? 'เวลาที่โอน' : 'Time'}"></div>
                            <div class="mb-4"><label class="form-label fw-bold text-dark">${t('amount_label')}</label><div class="input-group"><input type="number" step="0.01" id="amount" class="form-control border-primary fw-bold text-success fs-5" placeholder="0.00" required><span class="input-group-text bg-primary text-white fw-bold">${currentLang === 'th' ? 'บาท' : 'THB'}</span></div></div>
                            <button type="submit" id="orderBtn" class="btn btn-primary w-100 fw-bold py-3 rounded-pill shadow-sm" style="font-size: 1.1rem;">${t('submit_order')}</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>`;
};

// 💡 อัปเกรด: หน้า Dashboard (แก้ไขระบบส่ง API แบบต่อ String ประวัติกลับมาโชว์ 100%)
window.renderDashboardPage = async function() {
    if (!currentUser) return openAuth('login');
    const container = document.getElementById('app-content');
    container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div></div>';
    
    // 💡 แก้ไขบรรทัดนี้สำคัญมาก! เปลี่ยนกลับมาใช้รูปแบบ String ต่อท้ายพารามิเตอร์เหมือนเดิม
    const res = await API.post({ action: "getUserHistory", phone: currentUser.phone });
    
    // 🛡️ ป้องกันบั๊ก: ถ้า API ดึงข้อมูลล้มเหลว หรือไม่มี userInfo ให้ใช้ currentUser แทน
    let safeUserInfo = (res && res.status === 'success' && res.userInfo) ? res.userInfo : currentUser;
    
    if (res && res.status === 'success' && res.userInfo) { 
        currentUser.points = parseFloat(res.userInfo.points || 0).toFixed(2); 
        localStorage.setItem('currentUser', JSON.stringify(currentUser)); 
        if(document.getElementById('navPoints')) document.getElementById('navPoints').innerText = currentUser.points; 
    }

    // 🛡️ เช็คค่าอย่างปลอดภัยด้วย Optional Chaining (?.) 
    let expiryHtml = parseFloat(currentUser.points) > 0 ? `<span class="badge bg-danger fs-6 rounded-pill shadow-sm"><i class="far fa-clock"></i> ${tp('dash_expiry', {d: safeUserInfo?.expiryDate || '01/05/2026'})}</span>` : '';
    
    let defaultFName = safeUserInfo?.fname || (safeUserInfo?.name ? safeUserInfo.name.split(' ')[0] : '');
    let defaultLName = safeUserInfo?.lname || (safeUserInfo?.name && safeUserInfo.name.split(' ').length > 1 ? safeUserInfo.name.substring(defaultFName.length).trim() : '');
    
    let pAddr = safeUserInfo?.address || '', pSub = '', pDist = '', pProv = '';
    const addrMatch = pAddr.match(/(.*?)(?:ต\.|แขวง)\s*(.*?)\s*(?:อ\.|เขต)\s*(.*?)\s*(?:จ\.|จังหวัด)\s*(.*)/);
    if (addrMatch) { 
        pAddr = addrMatch[1].trim(); pSub = addrMatch[2].trim(); pDist = addrMatch[3].trim(); pProv = addrMatch[4].trim().replace(/\s+\d{5}$/, ''); 
    }
    
    let defaultAddress = safeUserInfo?.addressLine || pAddr; 
    let defaultSub = safeUserInfo?.subdistrict || pSub; 
    let defaultDist = safeUserInfo?.district || pDist; 
    let defaultProv = safeUserInfo?.province || pProv;
    
    let isRemote = typeof remoteZipCodes !== 'undefined' && remoteZipCodes.includes(safeUserInfo?.zipcode);
    let remoteText = isRemote ? `<span class="badge bg-danger ms-2"><i class="fas fa-truck"></i> ${currentLang === 'th' ? 'ห่างไกล (+20฿)' : 'Remote (+20฿)'}</span>` : '';

    container.innerHTML = `
    <h3 class="mb-4 fw-bold d-flex justify-content-between align-items-center flex-wrap gap-2"><div><i class="fas fa-user-circle text-primary me-2"></i>${t('dash_title')}</div>${expiryHtml}</h3>
    <div class="row">
        <div class="col-xl-4 mb-4">
            <div class="card shadow-sm border-0 rounded-4 overflow-hidden"><div class="card-header bg-info text-white fw-bold py-3">${t('dash_info')}</div><div class="card-body p-4"><form onsubmit="updateProfile(event)"><div class="row g-2 mb-3"><div class="col-6"><label class="small fw-bold text-muted">${currentLang === 'th' ? 'เบอร์โทรศัพท์ (ID)' : 'Phone (ID)'}</label><input type="tel" id="editPhone" class="form-control bg-light border-0 text-secondary" value="${safeUserInfo?.phone || currentUser.phone}" readonly disabled></div><div class="col-6"><label class="small fw-bold text-danger">${currentLang === 'th' ? 'รหัสผ่าน' : 'Password'}</label><input type="text" id="profPassword" class="form-control border-danger fw-bold" value="${currentUser.password || ''}" required></div></div><div class="row g-2 mb-3"><div class="col-6"><label class="small fw-bold text-muted">${currentLang === 'th' ? 'ชื่อ' : 'First Name'}</label><input type="text" id="profFName" class="form-control bg-light border-0" value="${defaultFName}" required></div><div class="col-6"><label class="small fw-bold text-muted">${currentLang === 'th' ? 'นามสกุล' : 'Last Name'}</label><input type="text" id="profLName" class="form-control bg-light border-0" value="${defaultLName}" required></div></div><label class="small fw-bold text-muted">${currentLang === 'th' ? 'ที่อยู่จัดส่ง' : 'Address'}</label><input type="text" id="profAddress" class="form-control mb-3 bg-light border-0" value="${defaultAddress}" required><div class="row g-2 mb-3"><div class="col-6"><label class="small fw-bold text-muted">${currentLang === 'th' ? 'ตำบล/แขวง' : 'Sub-district'}</label><input type="text" id="profSubDistrict" class="form-control bg-light border-0" value="${defaultSub}" required></div><div class="col-6"><label class="small fw-bold text-muted">${currentLang === 'th' ? 'อำเภอ/เขต' : 'District'}</label><input type="text" id="profDistrict" class="form-control bg-light border-0" value="${defaultDist}" required></div><div class="col-6"><label class="small fw-bold text-muted">${currentLang === 'th' ? 'จังหวัด' : 'Province'}</label><input type="text" id="profProvince" class="form-control bg-light border-0" value="${defaultProv}" required></div><div class="col-6"><label class="small fw-bold text-muted text-nowrap">${currentLang === 'th' ? 'รหัสไปรษณีย์' : 'Zipcode'} ${remoteText}</label><input type="text" id="profZip" class="form-control border-info fw-bold" value="${safeUserInfo?.zipcode || ''}" onkeyup="checkRemoteFee(this.value, 'profRemoteHint')" maxlength="5" required></div></div><div id="profRemoteHint" class="small mb-3"></div><button type="submit" class="btn btn-info w-100 text-white fw-bold rounded-pill" id="profSaveBtn">${t('save_info')}</button></form></div></div>
        </div>
        <div class="col-xl-8">
            <div class="card shadow-sm mb-4 border-0 rounded-4 overflow-hidden"><div class="card-header bg-primary text-white fw-bold py-3 d-flex justify-content-between align-items-center flex-wrap gap-2"><span>📊 ${t('dash_history')}</span><div class="d-flex align-items-center gap-2"><small>${t('show_rows')}</small><select class="form-select form-select-sm text-dark" style="width: auto; cursor:pointer;" onchange="window.dashState.orderLimit = parseInt(this.value); renderDashOrders();"><option value="5">5</option><option value="10">10</option><option value="15">15</option><option value="20">20</option><option value="999">All</option></select></div></div><div class="card-body table-responsive p-0"><table class="table table-hover mb-0 align-middle"><thead class="table-light"><tr><th class="text-center">#</th><th>คำสั่งซื้อ (Order)</th><th>${t('table_channel')}</th><th>${t('table_amount')}</th><th>${t('table_points')}</th><th class="text-end pe-3">${t('table_status')}</th></tr></thead><tbody id="dashOrdersBody"></tbody></table></div></div>
            <div class="card shadow-sm border-0 rounded-4 overflow-hidden"><div class="card-header bg-danger text-white fw-bold py-3 d-flex justify-content-between align-items-center flex-wrap gap-2"><span>🎁 ${t('dash_reward')}</span><div class="d-flex align-items-center gap-2"><small>${t('show_rows')}</small><select class="form-select form-select-sm text-dark" style="width: auto; cursor:pointer;" onchange="window.dashState.redeemLimit = parseInt(this.value); renderDashRedeems();"><option value="5">5</option><option value="10">10</option><option value="15">15</option><option value="20">20</option><option value="999">All</option></select></div></div><div class="card-body table-responsive p-0"><table class="table table-hover mb-0 align-middle"><thead class="table-light"><tr><th class="text-center">#</th><th>${t('table_date')}</th><th>${t('table_product')}</th><th>${t('table_status')}</th><th class="text-end pe-3">${t('table_action')}</th></tr></thead><tbody id="dashRedeemsBody"></tbody></table></div></div>
        </div>
    </div>`; 
    
    // 💡 ดึง array ประวัติมาใส่ state (ตรวจสอบว่า res เป็น object ไม่ใช่ undefined)
    let ordersList = (res && res.status === 'success' && Array.isArray(res.orders)) ? res.orders.reverse() : [];
    let redeemsList = (res && res.status === 'success' && Array.isArray(res.redeems)) ? res.redeems.reverse() : [];
    
    window.dashState = { orders: ordersList, redeems: redeemsList, orderLimit: 5, redeemLimit: 5 };
    
    renderDashOrders(); 
    renderDashRedeems();
    setTimeout(() => { if(document.getElementById('profZip')) checkRemoteFee(document.getElementById('profZip').value, 'profRemoteHint'); }, 100);
};
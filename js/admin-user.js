// ==========================================
// 👥 Admin Module: User Management, Settings & Tracking
// ==========================================

let trackingData = [];

window.loadUsers = async function() { 
    const res = await API.get("getUsers"); 
    if (res.status === "success") { 
        appState.userTable = res.data.filter((u) => u.role !== "admin"); 
        renderTable("userTable"); 
        
        if(document.getElementById('moUserList')) {
            let uHtml = ''; appState.userTable.forEach(u => { uHtml += `<option value="${u.phone} - ${u.fname || u.name}"></option>`; });
            document.getElementById('moUserList').innerHTML = uHtml;
        }
    } 
}

window.loadLogs = async function() { 
    const res = await API.get("getLogs"); 
    if (res.status === "success") { appState.logsTable = [...res.data].reverse(); renderTable("logsTable"); } 
}

window.loadSettings = async function() { 
    const res = await API.get("getSettings"); 
    if (res.status === "success") { 
        const d = res.data;
        if(document.getElementById("setBase")) document.getElementById("setBase").value = d.amount_base || 100;
        if(document.getElementById("setRate")) document.getElementById("setRate").value = d.points_rate || 10;
        if(document.getElementById("setGacha")) document.getElementById("setGacha").value = d.gacha_price || 2000;
        if(document.getElementById("setShipEms")) document.getElementById("setShipEms").value = d.ship_ems || 40;
        if(document.getElementById("setShipCod")) document.getElementById("setShipCod").value = d.ship_cod || 50;
        if(document.getElementById("setShipRemote")) document.getElementById("setShipRemote").value = d.ship_remote || 20;
        if(document.getElementById("setFreeShipLimit")) document.getElementById("setFreeShipLimit").value = d.free_ship_limit || 300;
        if(document.getElementById("setContactPhone")) document.getElementById("setContactPhone").value = d.contact_phone || '';
        if(document.getElementById("setContactLine")) document.getElementById("setContactLine").value = d.contact_line || '';
        if(document.getElementById("setContactFb")) document.getElementById("setContactFb").value = d.contact_fb || '';
        if(document.getElementById("setContactTiktok")) document.getElementById("setContactTiktok").value = d.contact_tiktok || '';
        if(document.getElementById("setAiModel")) document.getElementById("setAiModel").value = d.ai_model || 'gemini-1.5-flash';
        if(document.getElementById("setCategories")) document.getElementById("setCategories").value = d.categories || '';
        if(document.getElementById("setAiPrompt")) document.getElementById("setAiPrompt").value = d.ai_prompt || '';
        if(document.getElementById("setTrackingHeader")) document.getElementById("setTrackingHeader").value = d.tracking_header || '📦 แจ้งเลขพัสดุ "บ้านรถของเล่น"';
        if(document.getElementById("setTrackingUrl")) document.getElementById("setTrackingUrl").value = d.tracking_url || 'https://noteweihei.github.io/baanrodklonglen/';
        if(document.getElementById("setTrackingBenefit")) document.getElementById("setTrackingBenefit").value = d.tracking_benefit_msg || '🎉 สิทธิพิเศษสำหรับลูกค้า!\nอย่าลืมนำ Order ID มาแจ้งรับแต้มสะสม เพื่อแลกของรางวัล/สุ่มกาชา ฟรี! ได้ที่เว็บไซต์ของเรานะครับ:';
        if(document.getElementById("setTrackingFooter")) document.getElementById("setTrackingFooter").value = d.tracking_footer || 'ขอบคุณที่อุดหนุนครับ 🙏';
        if(typeof appState !== 'undefined') appState.settings = d;
    } 
}

window.saveSettingsPart = async function(part) {
    let settings = {}; let msg = "";
    if (part === 'points') { settings = { amount_base: document.getElementById("setBase").value, points_rate: document.getElementById("setRate").value, gacha_price: document.getElementById("setGacha").value }; msg = "แต้มและกาชา"; } 
    else if (part === 'shipping') { settings = { ship_ems: document.getElementById("setShipEms").value, ship_cod: document.getElementById("setShipCod").value, ship_remote: document.getElementById("setShipRemote").value, free_ship_limit: document.getElementById("setFreeShipLimit").value }; msg = "ค่าจัดส่ง"; } 
    else if (part === 'contact') { settings = { contact_phone: document.getElementById("setContactPhone").value, contact_line: document.getElementById("setContactLine").value, contact_fb: document.getElementById("setContactFb").value, contact_tiktok: document.getElementById("setContactTiktok").value }; msg = "ช่องทางติดต่อ"; } 
    else if (part === 'ai') { settings = { ai_model: document.getElementById("setAiModel").value, categories: document.getElementById("setCategories").value, ai_prompt: document.getElementById("setAiPrompt").value }; msg = "AI และหมวดหมู่"; } 
    else if (part === 'tracking') { settings = { tracking_header: document.getElementById("setTrackingHeader").value, tracking_url: document.getElementById("setTrackingUrl").value, tracking_benefit_msg: document.getElementById("setTrackingBenefit").value, tracking_footer: document.getElementById("setTrackingFooter").value }; msg = "เทมเพลตแจ้งเลขพัสดุ"; }

    Swal.fire({ title: `กำลังบันทึก ${msg}...`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const res = await API.post({ action: "saveSettings", settings: settings });
    if (res.status === 'success') { if(typeof appState !== 'undefined') { if(!appState.settings) appState.settings = {}; Object.assign(appState.settings, settings); } Swal.fire({ title: 'บันทึกสำเร็จ!', text: `อัปเดตตั้งค่า ${msg} เรียบร้อยแล้ว`, icon: 'success', timer: 2000, showConfirmButton: false }); } 
    else { Swal.fire('ผิดพลาด', res.message || 'บันทึกไม่สำเร็จ', 'error'); }
}

// 💡 อัปเดต: ป้องกัน Modal ซ้อนทับกัน
window.openAddUserModal = function() {
    // 1. ซ่อน Modal สร้างออเดอร์แมนนวล (ถ้าเปิดอยู่)
    const moModalEl = document.getElementById('manualOrderModal');
    if (moModalEl) {
        const moModal = bootstrap.Modal.getInstance(moModalEl);
        if (moModal) moModal.hide();
    }

    document.getElementById('uRow').value = ""; document.getElementById('uPhone').value = ""; document.getElementById('uPhone').readOnly = false; document.getElementById('uPassword').value = "1234"; document.getElementById('uFName').value = ""; document.getElementById('uLName').value = ""; document.getElementById('uAddress').value = ""; document.getElementById('uSubDistrict').value = ""; document.getElementById('uDistrict').value = ""; document.getElementById('uProvince').value = ""; document.getElementById('uZip').value = ""; document.getElementById('uPoints').value = 0;
    document.getElementById('uSaveBtn').innerHTML = '<i class="fas fa-user-plus me-1"></i> เพิ่มสมาชิกลงระบบ';
    
    // 2. โชว์ Modal เพิ่มสมาชิก
    const el = document.getElementById('userModal'); let modal = bootstrap.Modal.getInstance(el); if (!modal) modal = new bootstrap.Modal(el); modal.show();
}

window.openEditUserByPhone = function(phone) { 
    const u = appState.userTable.find(x => String(x.phone).trim() === String(phone).trim()); if(!u) return Swal.fire('ผิดพลาด', 'ไม่พบข้อมูลสมาชิกรหัสนี้', 'error');
    document.getElementById('uRow').value = u.rowIndex; document.getElementById('uPhone').value = u.phone; document.getElementById('uPhone').readOnly = true; document.getElementById('uPassword').value = u.password || ''; document.getElementById('uFName').value = u.fname || u.name || ''; document.getElementById('uLName').value = u.lname || ''; document.getElementById('uAddress').value = u.addressLine || u.address || ''; document.getElementById('uSubDistrict').value = u.subdistrict || ''; document.getElementById('uDistrict').value = u.district || ''; document.getElementById('uProvince').value = u.province || ''; document.getElementById('uZip').value = u.zipcode || ''; document.getElementById('uPoints').value = u.points || 0;
    document.getElementById('uSaveBtn').innerHTML = '<i class="fas fa-save me-1"></i> บันทึกการแก้ไข';
    const el = document.getElementById('userModal'); let modal = bootstrap.Modal.getInstance(el); if (!modal) modal = new bootstrap.Modal(el); modal.show();
}

window.saveUserEdit = async function(e) {
    e.preventDefault(); 
    const rowIndex = document.getElementById("uRow").value; const action = rowIndex === "" ? "addUser" : "editUserDetail"; 
    const btn = document.getElementById("uSaveBtn"); const originalText = btn.innerHTML; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...'; btn.disabled = true;
    const payload = { action: action, rowIndex: rowIndex, phone: document.getElementById("uPhone").value, password: document.getElementById("uPassword").value, fname: document.getElementById("uFName").value, lname: document.getElementById("uLName").value, address: document.getElementById("uAddress").value, subdistrict: document.getElementById("uSubDistrict").value, district: document.getElementById("uDistrict").value, province: document.getElementById("uProvince").value, zipcode: document.getElementById("uZip").value, points: document.getElementById("uPoints").value };
    const res = await API.post(payload);
    if(res.status === 'success') { 
        const el = document.getElementById('userModal'); const modal = bootstrap.Modal.getInstance(el); if (modal) modal.hide(); loadUsers(); 
        Swal.fire('สำเร็จ', rowIndex === "" ? 'เพิ่มสมาชิกเข้าระบบเรียบร้อย' : 'บันทึกข้อมูลเรียบร้อย', 'success'); 
    } 
    else { Swal.fire('ผิดพลาด', res.message, 'error'); }
    btn.innerHTML = originalText; btn.disabled = false;
}

window.banUser = async function(phone, currentStatus, rowIndex) {
    const newStatus = currentStatus === 'Banned' ? 'Active' : 'Banned';
    const conf = await Swal.fire({ title: `ต้องการ ${newStatus === 'Banned' ? 'แบน' : 'ปลดแบน'} เบอร์ ${phone}?`, icon: "warning", showCancelButton: true });
    if (conf.isConfirmed) { Swal.fire({ title: 'กำลังดำเนินการ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() }); const res = await API.post({ action: "banUser", rowIndex: rowIndex, phone: phone, status: newStatus }); if (res.status === "success") { loadUsers(); Swal.fire("สำเร็จ", "อัปเดตสถานะเรียบร้อย", "success"); } }
}

// 📦 พระเอกของงาน! ปุ่มบันทึกเลขพัสดุเข้า Database อัตโนมัติ
window.saveTrackingToDB = async function() {
    if (!trackingData || trackingData.length === 0) return Swal.fire('เตือน', 'ไม่มีข้อมูลให้บันทึก', 'warning');
    const btn = document.getElementById('saveTrackingBtn'); if(btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> บันทึก...'; btn.disabled = true; }
    
    const res = await API.post({ action: 'saveTrackingNumbers', trackingData: trackingData });
    if(res.status === 'success') {
        Swal.fire('สำเร็จ', `จับคู่เลขพัสดุเข้าออเดอร์ได้ทั้งหมด ${res.updated} รายการ! ออเดอร์จะถูกย้ายไปหน้าประวัติทันที`, 'success');
        if(typeof loadShopOrders === 'function') loadShopOrders();
    } else {
        Swal.fire('ผิดพลาด', res.message, 'error');
    }
    if(btn) { btn.innerHTML = '<i class="fas fa-save me-1"></i> บันทึกเข้าระบบอัตโนมัติ'; btn.disabled = false; }
}

window.scanReceiptImage = async function(event) {
    const file = event.target.files[0]; if (!file) return;
    Swal.fire({ title: 'AI กำลังวิเคราะห์รูปภาพ...', html: 'กรุณารอสักครู่ AI กำลังสกัดชื่อและเลขพัสดุ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        const base64Image = await compressImage(file, 1200); const cleanBase64 = base64Image.split(',')[1];
        const res = await API.post({ action: 'analyzeTrackingImage', imageBase64: cleanBase64 });
        if (res.status === 'success' && res.data) { trackingData = [...trackingData, ...res.data]; renderTrackingTable(); Swal.fire('สำเร็จ', `ดึงข้อมูลได้ ${res.data.length} รายการ (อย่าลืมกดบันทึกเข้าระบบด้วยนะคะ)`, 'success'); } 
        else { Swal.fire('ผิดพลาด', res.message || 'ไม่สามารถอ่านข้อมูลจากภาพนี้ได้', 'error'); }
    } catch (error) { Swal.fire('ผิดพลาดทางเทคนิค', 'เกิดข้อผิดพลาดในการประมวลผล: ' + error.message, 'error'); }
    event.target.value = ''; 
}

window.parseTrackingText = function() {
    const input = document.getElementById('rawTrackingInput'); if(!input) return;
    const text = input.value.trim(); if (!text) return Swal.fire('เตือน', 'กรุณาวางข้อความก่อนกดประมวลผล', 'warning');
    const lines = text.split('\n'); let newData = [];
    lines.forEach(line => {
        if(line.trim() === '') return;
        const trackMatch = line.match(/[A-Z0-9]{10,15}/i); 
        if(trackMatch) {
            const tracking = trackMatch[0]; let name = line.replace(tracking, '').trim(); name = name.replace(/(คุณ|ผู้รับ|ชื่อ|[:,-])/g, '').trim(); 
            if(name && tracking) { newData.push({name: name, tracking: tracking, zip: '-'}); }
        }
    });
    if(newData.length > 0) { trackingData = [...trackingData, ...newData]; renderTrackingTable(); Swal.fire('สำเร็จ', `สกัดข้อความได้ ${newData.length} รายการ (อย่าลืมกดบันทึกเข้าระบบนะคะ)`, 'success'); input.value = ''; } 
    else { Swal.fire('ไม่พบข้อมูล', 'ไม่พบรูปแบบเลขพัสดุในข้อความนี้ค่ะ', 'warning'); }
}

window.renderTrackingTable = function() {
    const resultArea = document.getElementById('trackingResultArea'); const tbody = document.getElementById('trackTableBody'); const countSpan = document.getElementById('trackCount');
    if (!tbody || !resultArea) return;
    if (!trackingData || trackingData.length === 0) { resultArea.classList.add('d-none'); return; }
    resultArea.classList.remove('d-none'); if(countSpan) countSpan.innerText = trackingData.length;
    let html = '';
    trackingData.forEach((item, index) => {
        let zip = item.zip || item.zipcode || '-';
        html += `<tr><td><span class="badge bg-light text-dark border border-secondary">${index + 1}</span></td><td class="fw-bold text-dark">คุณ ${item.name}</td><td class="text-primary fw-bold"><i class="fas fa-shipping-fast me-1"></i> ${item.tracking}</td><td><span class="badge bg-secondary">${zip}</span></td><td class="text-center"><button class="btn btn-sm btn-outline-danger rounded-circle" onclick="removeTracking(${index})" title="ลบ"><i class="fas fa-trash-alt"></i></button></td></tr>`;
    });
    tbody.innerHTML = html;
}
window.removeTracking = function(index) { trackingData.splice(index, 1); renderTrackingTable(); }
window.copyTrackingToClipboard = async function() {
    if (!trackingData || trackingData.length === 0) return Swal.fire('เตือน', 'ไม่มีข้อมูลให้คัดลอก', 'warning');
    const s = (typeof appState !== 'undefined' && appState.settings) ? appState.settings : {};
    const header = s.tracking_header || '📦 แจ้งเลขพัสดุ "บ้านรถของเล่น"'; const benefit = s.tracking_benefit_msg || '🎉 สิทธิพิเศษสำหรับลูกค้า!\nอย่าลืมนำ Order ID มาแจ้งรับแต้มสะสม เพื่อแลกของรางวัล/สุ่มกาชา ฟรี! ได้ที่เว็บไซต์ของเรานะครับ:'; const webUrl = s.tracking_url || 'https://noteweihei.github.io/baanrodklonglen/'; const footer = s.tracking_footer || 'ขอบคุณที่อุดหนุนครับ 🙏';
    let text = `${header}\n\n`; trackingData.forEach((item, index) => { text += `${index + 1}. คุณ ${item.name}\nEMS: ${item.tracking}\n\n`; }); text += `${benefit}\n👉 ${webUrl}\n\n${footer}`;
    try { await navigator.clipboard.writeText(text); Swal.fire({ title: 'สำเร็จ!', text: 'คัดลอกข้อความพร้อม Template ล่าสุดเรียบร้อยแล้ว', icon: 'success', timer: 2000, showConfirmButton: false }); } catch (e) { Swal.fire('ผิดพลาด', 'เบราว์เซอร์ไม่รองรับการคัดลอกอัตโนมัติ', 'error'); }
}
window.compressImage = function(file, maxWidth = 1200) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = event => { const img = new Image(); img.src = event.target.result; img.onload = () => { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); let width = img.width; let height = img.height; if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; } canvas.width = width; canvas.height = height; ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.7)); }; img.onerror = error => reject(error); }; reader.onerror = error => reject(error);
    });
}

// ==========================================
// 🚚 6. แยกระบบออเดอร์ร้านค้าเป็น 2 ตาราง (รอจัดส่ง & ประวัติจัดส่งแล้ว)
// ==========================================
window.loadShopOrders = async function() {
    const res = await API.get('getShopOrders');
    if(res.status === 'success') {
        appState.shopOrders = res.data;
        renderShopOrdersTables();
    }
}

window.renderShopOrdersTables = function() {
    const pendingTbody = document.getElementById('shopOrdersTableBody');
    const historyTbody = document.getElementById('historyShopOrdersTable'); 
    let pendingHtml = ''; let historyHtml = '';
    
    appState.shopOrders.forEach(o => {
        let itemsHtml = '';
        try { let items = JSON.parse(o.rawJson); items.forEach(i => itemsHtml += `<div class="small">- ${i.name} (x${i.qty})</div>`); } catch(e) { itemsHtml = o.detail; }
        
        let trackingLink = o.tracking ? `<a href="https://parcelsapp.com/th/tracking/${o.tracking}" target="_blank" class="badge bg-info text-dark text-decoration-none px-3 py-2 fs-6 shadow-sm"><i class="fas fa-search me-1"></i> ${o.tracking}</a>` : `<span class="text-muted small">รอเลขพัสดุ</span>`;
        
        if (o.status !== 'จัดส่งแล้ว') {
            pendingHtml += `<tr>
                <td><input type="checkbox" class="form-check-input chk-shop" value="${o.rowIndex}"></td>
                <td><small class="text-muted">${o.timestamp}</small><br><span class="fw-bold">${o.orderId}</span></td>
                <td><span class="fw-bold">${o.name}</span><br><small class="text-muted">${o.phone}</small></td>
                <td>${itemsHtml}</td>
                <td class="fw-bold text-success">฿${o.total}</td>
                <td class="text-center">${o.slipBase64 ? `<a href="${o.slipBase64}" target="_blank" class="badge bg-primary text-decoration-none">ดูสลิป</a>` : '<span class="badge bg-secondary">ไม่มี</span>'}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-success w-100 mb-1 fw-bold" onclick="updateSingleShopOrder(${o.rowIndex}, 'จัดส่งแล้ว')"><i class="fas fa-truck me-1"></i>จัดส่งแล้ว</button>
                    <button class="btn btn-sm btn-outline-danger w-100" onclick="updateSingleShopOrder(${o.rowIndex}, 'ยกเลิก')"><i class="fas fa-times me-1"></i>ยกเลิก</button>
                </td>
            </tr>`;
        } else {
            historyHtml += `<tr>
                <td><small class="text-muted">${o.timestamp}</small><br><span class="fw-bold">${o.orderId}</span></td>
                <td><span class="fw-bold">${o.name}</span><br><small class="text-muted">${o.phone}</small></td>
                <td>${itemsHtml}</td>
                <td class="fw-bold text-success">฿${o.total}</td>
                <td>${trackingLink}</td>
                <td><span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>${o.status}</span></td>
            </tr>`;
        }
    });
    if(pendingTbody) pendingTbody.innerHTML = pendingHtml || '<tr><td colspan="7" class="text-center text-muted py-4">🎉 เยี่ยมมาก! ไม่มีออเดอร์ค้างจัดส่งเลยค่ะ</td></tr>';
    if(historyTbody) historyTbody.innerHTML = historyHtml || '<tr><td colspan="6" class="text-center text-muted py-4">ยังไม่มีประวัติการจัดส่ง</td></tr>';
}

window.bulkApproveShopShipping = async function() {
    let checkboxes = document.querySelectorAll('.chk-shop:checked'); let rowIndices = Array.from(checkboxes).map(cb => cb.value);
    if (rowIndices.length === 0) return Swal.fire('เตือน', 'กรุณาเลือกรายการที่ต้องการอัปเดต', 'warning');
    Swal.fire({title:'กำลังอัปเดต...', allowOutsideClick:false, didOpen:()=>Swal.showLoading()});
    const res = await API.post({ action: 'bulkUpdateShopOrder', rowIndices: rowIndices, status: 'จัดส่งแล้ว' });
    if(res.status === 'success') { Swal.fire('สำเร็จ', 'อัปเดตสถานะจัดส่งแล้ว (ย้ายไปหน้าประวัติเรียบร้อย)', 'success'); loadShopOrders(); }
}
window.updateSingleShopOrder = async function(rowIndex, status) {
    Swal.fire({title:'กำลังอัปเดต...', allowOutsideClick:false, didOpen:()=>Swal.showLoading()});
    const res = await API.post({ action: 'bulkUpdateShopOrder', rowIndices: [rowIndex], status: status });
    if(res.status === 'success') { Swal.fire('สำเร็จ', `อัปเดตเป็น ${status} เรียบร้อย`, 'success'); loadShopOrders(); }
}

// ==========================================
// 🛒 7. ระบบสร้างออเดอร์แมนนวล 
// ==========================================
let moItemsList = []; let moAvailableProducts = [];

window.openManualOrderModal = async function() {
    moItemsList = [];
    if(document.getElementById('moShipping')) document.getElementById('moShipping').value = 0; if(document.getElementById('moDiscount')) document.getElementById('moDiscount').value = 0;
    if(document.getElementById('moUserSearch')) document.getElementById('moUserSearch').value = ''; if(document.getElementById('moProductSearch')) document.getElementById('moProductSearch').value = ''; calcManualTotal();
    
    const el = document.getElementById('manualOrderModal'); let modal = bootstrap.Modal.getInstance(el); if (!modal) modal = new bootstrap.Modal(el); modal.show();

    if(!appState.userTable || appState.userTable.length === 0) await loadUsers();
    if(document.getElementById('moUserList')) { let uHtml = ''; appState.userTable.forEach(u => { uHtml += `<option value="${u.phone} - ${u.fname || u.name}"></option>`; }); document.getElementById('moUserList').innerHTML = uHtml; }
    const res = await API.post({action: 'getShopProductsForAdmin'});
    if(res.status === 'success') {
        moAvailableProducts = res.data;
        if(document.getElementById('moProductList')) { let pHtml = ''; moAvailableProducts.forEach(p => { if(p.stock > 0) { pHtml += `<option value="[${p.sku || p.id}] ${p.name} (฿${p.price})"></option>`; } }); document.getElementById('moProductList').innerHTML = pHtml; }
    }
}

window.addManualOrderItem = function() {
    const searchVal = document.getElementById('moProductSearch').value.trim(); const qty = parseInt(document.getElementById('moQty').value) || 1;
    if(!searchVal) return Swal.fire('เตือน', 'กรุณาพิมพ์ค้นหาและเลือกสินค้า', 'warning');
    const prod = moAvailableProducts.find(p => `[${p.sku || p.id}] ${p.name} (฿${p.price})` === searchVal);
    if(!prod) return Swal.fire('เตือน', 'ไม่พบสินค้านี้ กรุณาเลือกจากรายการ', 'error');

    let exist = moItemsList.find(x => x.id === prod.id);
    if(exist) { if(exist.qty + qty > prod.stock) return Swal.fire('เตือน', 'สต็อกไม่พอ', 'warning'); exist.qty += qty; } 
    else { if(qty > prod.stock) return Swal.fire('เตือน', 'สต็อกไม่พอ', 'warning'); moItemsList.push({ id: prod.id, sku: prod.sku, name: prod.name, price: prod.price, qty: qty }); }
    document.getElementById('moProductSearch').value = ''; document.getElementById('moQty').value = 1; calcManualTotal();
}
window.updateManualItemQty = function(index, change) { let item = moItemsList[index]; let prod = moAvailableProducts.find(x => x.id === item.id); let newQty = item.qty + change; if (newQty > 0) { if (prod && newQty > prod.stock) { Swal.fire('เตือน', 'สั่งเกินจำนวนสต็อก', 'warning'); } else { item.qty = newQty; } } calcManualTotal(); }
window.removeManualOrderItem = function(index) { moItemsList.splice(index, 1); calcManualTotal(); }
window.calcManualTotal = function() {
    let total = 0; let html = '';
    if(moItemsList.length === 0) { html = '<tr><td colspan="5" class="text-center text-muted py-4">ยังไม่ได้เลือกสินค้า</td></tr>'; } 
    else {
        moItemsList.forEach((item, index) => { let sub = item.price * item.qty; total += sub; html += `<tr><td class="align-middle" style="max-width: 140px;"><div class="fw-bold"><span class="badge bg-dark mb-1 px-2 py-1">${item.sku || 'ไม่มีรหัส'}</span></div><div class="small text-muted text-truncate w-100" style="display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;" title="${item.name}">${item.name}</div></td><td class="align-middle fw-bold text-secondary">฿${item.price}</td><td class="align-middle text-center" style="min-width: 95px;"><div class="d-inline-flex align-items-center bg-white border rounded-pill p-1 shadow-sm"><button type="button" class="btn btn-sm text-danger border-0 rounded-circle fw-bold" style="width: 25px; height: 25px; padding: 0;" onclick="updateManualItemQty(${index}, -1)">-</button><span class="fw-bold mx-2" style="font-size: 0.95rem;">${item.qty}</span><button type="button" class="btn btn-sm text-success border-0 rounded-circle fw-bold" style="width: 25px; height: 25px; padding: 0;" onclick="updateManualItemQty(${index}, 1)">+</button></div></td><td class="align-middle text-success fw-bold">฿${sub}</td><td class="align-middle text-center"><button type="button" class="btn btn-sm btn-danger rounded-circle shadow-sm" style="width: 32px; height: 32px; padding: 0;" onclick="removeManualOrderItem(${index})"><i class="fas fa-trash-alt"></i></button></td></tr>`; });
    }
    if(document.getElementById('moItemsTable')) document.getElementById('moItemsTable').innerHTML = html;
    let ship = document.getElementById('moShipping') ? parseFloat(document.getElementById('moShipping').value) || 0 : 0; let disc = document.getElementById('moDiscount') ? parseFloat(document.getElementById('moDiscount').value) || 0 : 0; let finalTotal = total + ship - disc;
    if(document.getElementById('moTotal')) document.getElementById('moTotal').value = finalTotal < 0 ? 0 : finalTotal;
}

window.saveManualOrder = async function(e) {
    e.preventDefault();
    const userSearchVal = document.getElementById('moUserSearch').value.trim(); if(!userSearchVal) return Swal.fire('เตือน', 'กรุณาพิมพ์ค้นหา/เลือกลูกค้า', 'warning');
    const phoneMatch = userSearchVal.split(' - ')[0].trim(); const userExists = appState.userTable.find(u => u.phone === phoneMatch);
    if(!userExists) return Swal.fire('เตือน', 'ไม่พบลูกค้ารายนี้ในระบบ กรุณากดปุ่ม "เพิ่มลูกค้าใหม่" ก่อนค่ะ', 'warning');
    if(moItemsList.length === 0) return Swal.fire('เตือน', 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ', 'warning');
    const btn = document.getElementById('moSaveBtn'); if(!btn) return; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> บันทึก...'; btn.disabled = true;
    const payload = { action: 'createManualOrder', phone: phoneMatch, items: moItemsList, shipping: document.getElementById('moShipping').value, discount: document.getElementById('moDiscount').value, payMethod: document.getElementById('moPayMethod').value };
    const res = await API.post(payload);
    if(res.status === 'success') { const el = document.getElementById('manualOrderModal'); const modal = bootstrap.Modal.getInstance(el); if (modal) modal.hide(); Swal.fire('สำเร็จ', 'สร้างออเดอร์แมนนวลเรียบร้อย!', 'success'); if(typeof loadShopOrders === 'function') loadShopOrders(); } 
    else { Swal.fire('ผิดพลาด', res.message || 'ไม่สามารถสร้างออเดอร์ได้', 'error'); }
    btn.innerHTML = '<i class="fas fa-save me-1"></i> บันทึกออเดอร์'; btn.disabled = false;
}
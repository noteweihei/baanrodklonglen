// ==========================================
// 👥 Admin Module: User Management, Settings & Tracking
// ==========================================

let trackingData = [];

// 🔄 1. โหลดข้อมูลผู้ใช้งานและ Log
window.loadUsers = async function() { 
    const res = await API.get("getUsers"); 
    if (res.status === "success") { 
        appState.userTable = res.data.filter((u) => u.role !== "admin"); 
        renderTable("userTable"); 
    } 
}

window.loadLogs = async function() { 
    const res = await API.get("getLogs"); 
    if (res.status === "success") { 
        appState.logsTable = [...res.data].reverse(); 
        renderTable("logsTable"); 
    } 
}

// 🔄 2. โหลดข้อมูลการตั้งค่าร้านค้า
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

// 💾 3. บันทึกการตั้งค่า
window.saveSettingsPart = async function(part) {
    let settings = {};
    let msg = "";

    if (part === 'points') {
        settings = { amount_base: document.getElementById("setBase").value, points_rate: document.getElementById("setRate").value, gacha_price: document.getElementById("setGacha").value };
        msg = "แต้มและกาชา";
    } else if (part === 'shipping') {
        settings = { ship_ems: document.getElementById("setShipEms").value, ship_cod: document.getElementById("setShipCod").value, ship_remote: document.getElementById("setShipRemote").value, free_ship_limit: document.getElementById("setFreeShipLimit").value };
        msg = "ค่าจัดส่ง";
    } else if (part === 'contact') {
        settings = { contact_phone: document.getElementById("setContactPhone").value, contact_line: document.getElementById("setContactLine").value, contact_fb: document.getElementById("setContactFb").value, contact_tiktok: document.getElementById("setContactTiktok").value };
        msg = "ช่องทางติดต่อ";
    } else if (part === 'ai') {
        settings = { ai_model: document.getElementById("setAiModel").value, categories: document.getElementById("setCategories").value, ai_prompt: document.getElementById("setAiPrompt").value };
        msg = "AI และหมวดหมู่";
    } else if (part === 'tracking') {
        settings = {
            tracking_header: document.getElementById("setTrackingHeader").value,
            tracking_url: document.getElementById("setTrackingUrl").value,
            tracking_benefit_msg: document.getElementById("setTrackingBenefit").value,
            tracking_footer: document.getElementById("setTrackingFooter").value
        };
        msg = "เทมเพลตแจ้งเลขพัสดุ";
    }

    Swal.fire({ title: `กำลังบันทึก ${msg}...`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    const res = await API.post({ action: "saveSettings", settings: settings });
    if (res.status === 'success') {
        if(typeof appState !== 'undefined') {
            if(!appState.settings) appState.settings = {};
            Object.assign(appState.settings, settings);
        }
        Swal.fire({ title: 'บันทึกสำเร็จ!', text: `อัปเดตตั้งค่า ${msg} เรียบร้อยแล้ว`, icon: 'success', timer: 2000, showConfirmButton: false });
    } else {
        Swal.fire('ผิดพลาด', res.message || 'บันทึกไม่สำเร็จ', 'error');
    }
}

// ==========================================
// ✏️ 4. ระบบจัดการสมาชิก (เพิ่มใหม่ / แก้ไข)
// ==========================================

// 💡 4.1 เปิด Modal เพื่อ "เพิ่มสมาชิกใหม่"
window.openAddUserModal = function() {
    document.getElementById('uRow').value = ""; // เคลียร์ช่อง Row เพื่อบอกให้ระบบรู้ว่านี่คือคนใหม่
    document.getElementById('uPhone').value = "";
    document.getElementById('uPhone').readOnly = false; // ปลดล็อกให้พิมพ์เบอร์โทรได้
    document.getElementById('uPassword').value = "1234"; // รหัสผ่านตั้งต้น
    document.getElementById('uFName').value = "";
    document.getElementById('uLName').value = "";
    document.getElementById('uAddress').value = "";
    document.getElementById('uSubDistrict').value = "";
    document.getElementById('uDistrict').value = "";
    document.getElementById('uProvince').value = "";
    document.getElementById('uZip').value = "";
    document.getElementById('uPoints').value = 0;
    
    document.getElementById('uSaveBtn').innerHTML = '<i class="fas fa-user-plus me-1"></i> เพิ่มสมาชิกลงระบบ';
    
    const modal = new bootstrap.Modal(document.getElementById('userModal'));
    modal.show();
}

// 💡 4.2 เปิด Modal เพื่อ "แก้ไขข้อมูลสมาชิกเดิม"
window.openEditUserByPhone = function(phone) { 
    const u = appState.userTable.find(x => String(x.phone).trim() === String(phone).trim());
    if(!u) return Swal.fire('ผิดพลาด', 'ไม่พบข้อมูลสมาชิกรหัสนี้', 'error');
    
    document.getElementById('uRow').value = u.rowIndex; 
    document.getElementById('uPhone').value = u.phone; 
    document.getElementById('uPhone').readOnly = true; // ล็อกไม่ให้แก้เบอร์โทร
    document.getElementById('uPassword').value = u.password || ''; 
    document.getElementById('uFName').value = u.fname || u.name || ''; 
    document.getElementById('uLName').value = u.lname || ''; 
    document.getElementById('uAddress').value = u.addressLine || u.address || ''; 
    document.getElementById('uSubDistrict').value = u.subdistrict || ''; 
    document.getElementById('uDistrict').value = u.district || ''; 
    document.getElementById('uProvince').value = u.province || '';
    document.getElementById('uZip').value = u.zipcode || '';
    document.getElementById('uPoints').value = u.points || 0;
    
    document.getElementById('uSaveBtn').innerHTML = '<i class="fas fa-save me-1"></i> บันทึกการแก้ไข';
    
    const modal = new bootstrap.Modal(document.getElementById('userModal'));
    modal.show();
}

// 💡 4.3 ฟังก์ชันบันทึกข้อมูล (ฉลาดขึ้น แยกออกว่า Add หรือ Edit)
window.saveUserEdit = async function(e) {
    e.preventDefault(); 
    
    const rowIndex = document.getElementById("uRow").value;
    const action = rowIndex === "" ? "addUser" : "editUserDetail"; // เช็คจาก uRow ว่าว่างหรือไม่
    
    const btn = document.getElementById("uSaveBtn"); 
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...'; 
    btn.disabled = true;
    
    const payload = {
        action: action, 
        rowIndex: rowIndex,
        phone: document.getElementById("uPhone").value, 
        password: document.getElementById("uPassword").value,
        fname: document.getElementById("uFName").value, 
        lname: document.getElementById("uLName").value,
        address: document.getElementById("uAddress").value, 
        subdistrict: document.getElementById("uSubDistrict").value,
        district: document.getElementById("uDistrict").value, 
        province: document.getElementById("uProvince").value,
        zipcode: document.getElementById("uZip").value, 
        points: document.getElementById("uPoints").value
    };
    
    const res = await API.post(payload);
    
    if(res.status === 'success') { 
        // ปิด Modal
        const modalEl = document.getElementById('userModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
        
        loadUsers(); 
        Swal.fire('สำเร็จ', rowIndex === "" ? 'เพิ่มสมาชิกเข้าระบบเรียบร้อย' : 'บันทึกข้อมูลเรียบร้อย', 'success'); 
    } else { 
        Swal.fire('ผิดพลาด', res.message, 'error'); 
    }
    
    btn.innerHTML = originalText; 
    btn.disabled = false;
}

// 🚫 4.4 แบนสมาชิก
window.banUser = async function(phone, currentStatus, rowIndex) {
    const newStatus = currentStatus === 'Banned' ? 'Active' : 'Banned';
    const confirmMsg = newStatus === 'Banned' ? `ต้องการแบนเบอร์ ${phone} ถาวรใช่หรือไม่?` : `ต้องการปลดแบนเบอร์ ${phone} ใช่หรือไม่?`;
    
    const conf = await Swal.fire({ title: confirmMsg, icon: "warning", showCancelButton: true, confirmButtonColor: newStatus === 'Banned' ? "#d33" : "#28a745" });
    if (conf.isConfirmed) {
        Swal.fire({ title: 'กำลังดำเนินการ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const res = await API.post({ action: "banUser", rowIndex: rowIndex, phone: phone, status: newStatus });
        if (res.status === "success") { loadUsers(); Swal.fire("สำเร็จ", "อัปเดตสถานะเรียบร้อย", "success"); }
        else { Swal.fire("ผิดพลาด", res.message, "error"); }
    }
}

// ==========================================
// 📦 5. ระบบแยกเลขพัสดุอัจฉริยะ (AI Image & Text)
// ==========================================

window.scanReceiptImage = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    Swal.fire({ title: 'AI กำลังวิเคราะห์รูปภาพ...', html: 'กรุณารอสักครู่ AI กำลังสกัดชื่อและเลขพัสดุ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        const base64Image = await compressImage(file, 1200); 
        const cleanBase64 = base64Image.split(',')[1];
        
        const res = await API.post({ action: 'analyzeTrackingImage', imageBase64: cleanBase64 });
        
        if (res.status === 'success' && res.data) {
            trackingData = [...trackingData, ...res.data];
            renderTrackingTable();
            Swal.fire('สำเร็จ', `ดึงข้อมูลได้ ${res.data.length} รายการ`, 'success');
        } else {
            Swal.fire('ผิดพลาด', res.message || 'ไม่สามารถอ่านข้อมูลจากภาพนี้ได้', 'error');
        }
    } catch (error) {
        Swal.fire('ผิดพลาดทางเทคนิค', 'เกิดข้อผิดพลาดในการประมวลผล: ' + error.message, 'error');
    }
    event.target.value = ''; 
}

window.parseTrackingText = function() {
    const input = document.getElementById('rawTrackingInput');
    if(!input) return;
    
    const text = input.value.trim();
    if (!text) return Swal.fire('เตือน', 'กรุณาวางข้อความก่อนกดประมวลผล', 'warning');
    
    const lines = text.split('\n');
    let newData = [];
    
    lines.forEach(line => {
        if(line.trim() === '') return;
        
        const trackMatch = line.match(/[A-Z0-9]{10,15}/i); 
        if(trackMatch) {
            const tracking = trackMatch[0];
            let name = line.replace(tracking, '').trim();
            name = name.replace(/(คุณ|ผู้รับ|ชื่อ|[:,-])/g, '').trim(); 
            
            if(name && tracking) {
                newData.push({name: name, tracking: tracking, zip: '-'});
            }
        }
    });

    if(newData.length > 0) {
        trackingData = [...trackingData, ...newData];
        renderTrackingTable();
        Swal.fire('สำเร็จ', `สกัดข้อความได้ ${newData.length} รายการ`, 'success');
        input.value = ''; 
    } else {
        Swal.fire('ไม่พบข้อมูล', 'ไม่พบรูปแบบเลขพัสดุในข้อความนี้ค่ะ', 'warning');
    }
}

window.renderTrackingTable = function() {
    const resultArea = document.getElementById('trackingResultArea');
    const tbody = document.getElementById('trackTableBody');
    const countSpan = document.getElementById('trackCount');

    if (!tbody || !resultArea) return;

    if (!trackingData || trackingData.length === 0) {
        resultArea.classList.add('d-none');
        return;
    }

    resultArea.classList.remove('d-none');
    if(countSpan) countSpan.innerText = trackingData.length;

    let html = '';
    trackingData.forEach((item, index) => {
        let zip = item.zip || item.zipcode || '-';
        html += `
            <tr>
                <td><span class="badge bg-light text-dark border border-secondary">${index + 1}</span></td>
                <td class="fw-bold text-dark">คุณ ${item.name}</td>
                <td class="text-primary fw-bold"><i class="fas fa-shipping-fast me-1"></i> ${item.tracking}</td>
                <td><span class="badge bg-secondary">${zip}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="removeTracking(${index})" title="ลบ">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

window.removeTracking = function(index) {
    trackingData.splice(index, 1);
    renderTrackingTable();
}

window.copyTrackingToClipboard = async function() {
    if (!trackingData || trackingData.length === 0) return Swal.fire('เตือน', 'ไม่มีข้อมูลให้คัดลอก', 'warning');

    const s = (typeof appState !== 'undefined' && appState.settings) ? appState.settings : {};
    const header = s.tracking_header || '📦 แจ้งเลขพัสดุ "บ้านรถของเล่น"';
    const benefit = s.tracking_benefit_msg || '🎉 สิทธิพิเศษสำหรับลูกค้า!\nอย่าลืมนำ Order ID มาแจ้งรับแต้มสะสม เพื่อแลกของรางวัล/สุ่มกาชา ฟรี! ได้ที่เว็บไซต์ของเรานะครับ:';
    const webUrl = s.tracking_url || 'https://noteweihei.github.io/baanrodklonglen/';
    const footer = s.tracking_footer || 'ขอบคุณที่อุดหนุนครับ 🙏';

    let text = `${header}\n\n`;
    trackingData.forEach((item, index) => { 
        text += `${index + 1}. คุณ ${item.name}\nEMS: ${item.tracking}\n\n`; 
    });
    text += `${benefit}\n👉 ${webUrl}\n\n${footer}`;

    try { 
        await navigator.clipboard.writeText(text); 
        Swal.fire({ title: 'สำเร็จ!', text: 'คัดลอกข้อความพร้อม Template ล่าสุดเรียบร้อยแล้ว', icon: 'success', timer: 2000, showConfirmButton: false }); 
    } catch (e) { 
        Swal.fire('ผิดพลาด', 'เบราว์เซอร์ไม่รองรับการคัดลอกอัตโนมัติ', 'error'); 
    }
}

window.compressImage = function(file, maxWidth = 1200) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}
// ==========================================
// 👥 Admin Module: User Management & Utils
// ==========================================
let trackingData = [];

window.loadUsers = async function() { const res = await API.get("getUsers"); if (res.status === "success") { appState.userTable = res.data.filter((u) => u.role !== "admin"); renderTable("userTable"); } }
window.loadLogs = async function() { const res = await API.get("getLogs"); if (res.status === "success") { appState.logsTable = [...res.data].reverse(); renderTable("logsTable"); } }


window.openEditUserByPhone = function(phone) { 
    const u = appState.userTable.find(x => String(x.phone).trim() === String(phone).trim());
    if(!u) return Swal.fire('ผิดพลาด', 'ไม่พบข้อมูลสมาชิกรหัสนี้', 'error');
    
    document.getElementById('uRow').value = u.rowIndex; document.getElementById('uPhone').value = u.phone; 
    document.getElementById('uPassword').value = u.password || ''; document.getElementById('uFName').value = u.fname || u.name || ''; 
    document.getElementById('uLName').value = u.lname || ''; document.getElementById('uAddress').value = u.addressLine || u.address || ''; 
    document.getElementById('uSubDistrict').value = u.subdistrict || ''; document.getElementById('uDistrict').value = u.district || ''; 
    document.getElementById('uProvince').value = u.province || ''; document.getElementById('uZip').value = u.zipcode || ''; 
    document.getElementById('uPoints').value = parseFloat(u.points || 0).toFixed(2); 
    uModal.show();
}

window.saveUser = async function(e) {
    e.preventDefault(); const btn = document.getElementById("uSaveBtn"); btn.innerText = "กำลังบันทึก..."; btn.disabled = true;
    try {
        const data = { action: "editUserDetail", rowIndex: document.getElementById("uRow").value, phone: document.getElementById("uPhone").value, password: document.getElementById("uPassword").value, fname: document.getElementById("uFName").value, lname: document.getElementById("uLName").value, address: document.getElementById("uAddress").value, subdistrict: document.getElementById("uSubDistrict").value, district: document.getElementById("uDistrict").value, province: document.getElementById("uProvince").value, zipcode: document.getElementById("uZip").value, points: document.getElementById("uPoints").value };
        const res = await API.post(data);
        if(res.status === 'success') { uModal.hide(); loadUsers(); Swal.fire('สำเร็จ', 'บันทึกข้อมูลสมาชิกแล้ว', 'success'); } else { Swal.fire('ผิดพลาด', res.message, 'error'); }
    } catch(err) { Swal.fire('ผิดพลาด', err.message, 'error'); }
    btn.innerText = "💾 บันทึกข้อมูลสมาชิก"; btn.disabled = false;
}

window.banUser = async function(rowIndex, phone, newStatus) {
    const conf = await Swal.fire({ title: `ยืนยันเปลี่ยนสถานะเป็น ${newStatus}?`, icon: "warning", showCancelButton: true });
    if(conf.isConfirmed) {
        Swal.fire({ title: "กำลังดำเนินการ...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const res = await API.post({ action: "banUser", rowIndex: rowIndex, phone: phone, status: newStatus });
        if(res.status === 'success') { Swal.fire("สำเร็จ", "เปลี่ยนสถานะแล้ว", "success"); loadUsers(); } else Swal.fire("ผิดพลาด", res.message, "error");
    }
}

// ==========================================
// ⚙️ ฟังก์ชันโหลดและบันทึกการตั้งค่าแบบไดนามิก (Dynamic Settings)
// ==========================================
window.loadSettings = async function() { 
    const res = await API.get("getSettings"); 
    if (res.status === "success") { 
        const d = res.data;
        // แต้ม & กาชา
        document.getElementById("setBase").value = d.amount_base || 100; 
        document.getElementById("setRate").value = d.points_rate || 10; 
        document.getElementById("setGacha").value = d.gacha_price || 2000; 
        
        // จัดส่ง
        document.getElementById("setShipEms").value = d.ship_ems || 40; 
        document.getElementById("setShipCod").value = d.ship_cod || 50; 
        document.getElementById("setShipRemote").value = d.ship_remote || 20; 
        document.getElementById("setFreeShipLimit").value = d.free_ship_limit || 300; 
        
        // ช่องทางติดต่อ
        document.getElementById("setContactPhone").value = d.contact_phone || '064-718-8878'; 
        document.getElementById("setContactLine").value = d.contact_line || 'https://lin.ee/NZjv3Aj'; 
        document.getElementById("setContactFb").value = d.contact_fb || ''; 
        document.getElementById("setContactTiktok").value = d.contact_tiktok || ''; 
        
        // AI & หมวดหมู่
        document.getElementById("setAiModel").value = d.ai_model || 'gemini-1.5-flash'; 
        document.getElementById("setCategories").value = d.categories || 'JDM (รถญี่ปุ่น), Muscle (รถอเมริกัน), Euro (รถยุโรป), Fantasy (รถการ์ตูน), การ์ดเกม';
        document.getElementById("setAiPrompt").value = d.ai_prompt || ''; 
    } 
}

window.saveAdvancedSettings = async function(e) {
    e.preventDefault(); 
    const btn = document.getElementById("advSetSaveBtn"); 
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2 text-warning"></i> กำลังบันทึก...'; 
    btn.disabled = true;
    
    const payload = {
        action: "saveSettings",
        settings: {
            amount_base: document.getElementById("setBase").value,
            points_rate: document.getElementById("setRate").value,
            gacha_price: document.getElementById("setGacha").value,
            
            ship_ems: document.getElementById("setShipEms").value,
            ship_cod: document.getElementById("setShipCod").value,
            ship_remote: document.getElementById("setShipRemote").value,
            free_ship_limit: document.getElementById("setFreeShipLimit").value,
            
            contact_phone: document.getElementById("setContactPhone").value,
            contact_line: document.getElementById("setContactLine").value,
            contact_fb: document.getElementById("setContactFb").value,
            contact_tiktok: document.getElementById("setContactTiktok").value,
            
            ai_model: document.getElementById("setAiModel").value,
            categories: document.getElementById("setCategories").value,
            ai_prompt: document.getElementById("setAiPrompt").value
        }
    };
    
    const res = await API.post(payload);
    if(res.status === 'success') {
        Swal.fire('สำเร็จ', 'อัปเดตศูนย์ควบคุมระบบเรียบร้อยแล้ว!', 'success');
    } else {
        Swal.fire('ผิดพลาด', res.message, 'error');
    }
    btn.innerHTML = '<i class="fas fa-save me-2 text-warning"></i> บันทึกการตั้งค่าทั้งหมดเข้าระบบ'; 
    btn.disabled = false;
}

window.parseTrackingText = function() {
    const rawText = document.getElementById('rawTrackingInput').value;
    const regex = /(?:^|\n)\d+\.\s+([A-Z]{2}\d{9}[A-Z]{2})[\s\t]+(.*?)\s+(\d{5})/g;
    let match; trackingData = [];
    while ((match = regex.exec(rawText)) !== null) { trackingData.push({ tracking: match[1], name: match[2].trim().replace(/^คุณ\s*/, ''), zip: match[3] }); }
    if (trackingData.length === 0) return Swal.fire('ไม่พบข้อมูล', 'กรุณาเช็คความถูกต้อง หรือรูปแบบ ปณ.', 'warning');
    renderTrackingTable(); document.getElementById('trackingResultArea').classList.remove('d-none');
}

window.renderTrackingTable = function() {
    const tbody = document.getElementById('trackTableBody'); tbody.innerHTML = '';
    trackingData.forEach((item, index) => { tbody.innerHTML += `<tr><td>${index+1}</td><td><b>${item.name}</b></td><td><code>${item.tracking}</code></td><td>${item.zip}</td><td><button class="btn btn-sm btn-outline-danger" onclick="trackingData.splice(${index},1); renderTrackingTable();"><i class="fas fa-trash"></i></button></td></tr>`; });
    document.getElementById('trackCount').innerText = trackingData.length;
}

window.copyTrackingToClipboard = async function() {
    if (!trackingData.length) return Swal.fire('เตือน', 'ไม่มีข้อมูลให้คัดลอก', 'warning');
    const myWebsiteUrl = "https://hotwheels-reward.netlify.app/"; 
    
    let text = `📦 แจ้งเลขพัสดุ "บ้านรถของเล่น"\n\n`;
    trackingData.forEach((item, index) => { text += `${index + 1}. คุณ ${item.name}\nEMS: ${item.tracking}\n\n`; });
    text += `🎉 สิทธิพิเศษสำหรับลูกค้า!\nอย่าลืมนำ Order ID มาแจ้งรับแต้มสะสม เพื่อแลกของรางวัล/สุ่มกาชา ฟรี! ได้ที่เว็บไซต์ของเรานะครับ:\n👉 ${myWebsiteUrl}\n\nขอบคุณที่อุดหนุนครับ 🙏`;

    try { await navigator.clipboard.writeText(text); Swal.fire('สำเร็จ', 'คัดลอกข้อความพร้อมลิงก์เว็บแล้ว', 'success'); } 
    catch (e) { Swal.fire('ผิดพลาด', 'เบราว์เซอร์ไม่รองรับการคัดลอกอัตโนมัติ', 'error'); }
}

// ==========================================
// 📸 ระบบ AI สแกนใบเสร็จพัสดุ (อัปเกรดบีบอัดภาพและจับ Error)
// ==========================================
window.scanReceiptImage = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    Swal.fire({ 
        title: '🔍 AI กำลังสแกนสลิป...', 
        html: 'โปรดรอสักครู่ ระบบกำลังลดขนาดภาพและวิเคราะห์ข้อมูล...', 
        allowOutsideClick: false, 
        didOpen: () => Swal.showLoading() 
    });

    try {
        // 💡 ใช้ฟังก์ชันใหม่เพื่อบีบอัดภาพก่อนส่ง ป้องกันปัญหาไฟล์ใหญ่เกินไป
        const base64 = await compressImage(file);
        
        // 💡 ตัด 'data:image/jpeg;base64,' ออกก่อนส่งไป API
        const base64DataOnly = base64.split(',')[1]; 
        
        const res = await API.post({ action: "analyzeReceiptAI", image: base64DataOnly });
        
        if (res.status === 'success' && Array.isArray(res.data)) {
            res.data.forEach(item => {
                if(item.name && item.tracking) {
                    trackingData.push(item);
                }
            });
            renderTrackingTable();
            document.getElementById('trackingResultArea').classList.remove('d-none');
            Swal.fire('สแกนสำเร็จ!', `AI ดึงข้อมูลได้ ${res.data.length} รายการ`, 'success');
        } else {
            // 💡 โชว์ข้อความ Error จริงๆ จากหลังบ้านเพื่อให้รู้ว่าพังที่ไหน
            Swal.fire('เกิดข้อผิดพลาด', res.message || 'AI ไม่สามารถอ่านข้อมูลจากภาพนี้ได้', 'error');
        }
    } catch (error) {
        Swal.fire('ผิดพลาดทางเทคนิค', 'เกิดข้อผิดพลาดในการประมวลผลไฟล์ภาพ: ' + error.message, 'error');
    }
    
    event.target.value = ''; 
}

// 💡 ฟังก์ชันใหม่: บีบอัดรูปภาพให้เล็กลง (ความกว้างไม่เกิน 1200px) ช่วยให้ส่งข้อมูลไวขึ้นและไม่พัง
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

                // คำนวณอัตราส่วนใหม่ถ้าภาพใหญ่เกินไป
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // แปลงกลับเป็น Base64 แบบ JPEG คุณภาพ 70%
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}
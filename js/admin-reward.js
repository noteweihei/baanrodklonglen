// ==========================================
// 🎁 Admin Module: Reward & Shop Orders Approval (Full Version)
// ==========================================

// 🔄 1. โหลดข้อมูลออเดอร์แจ้งโอน และรายการแลกของรางวัล
async function loadData() {
    const [oRes, rRes] = await Promise.all([API.get("getOrders"), API.get("getRedemptions")]);
    
    if (oRes.status === "success") {
        let orders = [...oRes.data].reverse();
        appState.pendingOrdersTable = orders.filter((o) => o.status === "Pending");
        appState.historyOrdersTable = orders.filter((o) => o.status !== "Pending");
        renderTable("pendingOrdersTable"); renderTable("historyOrdersTable");
    }
    if (rRes.status === "success") {
        let redeems = [...rRes.data].reverse();
        appState.pendingRedeemsTable = redeems.filter((r) => r.status === "Pending");
        appState.historyRedeemsTable = redeems.filter((r) => r.status !== "Pending");
        renderTable("pendingRedeemsTable"); renderTable("historyRedeemsTable");
    }
}

// ✅ 2. อนุมัติแต้มจากการแจ้งยอดโอนเงิน
async function approveOrder(id) {
    const conf = await Swal.fire({ title: "ยืนยันอนุมัติแต้ม?", icon: "question", showCancelButton: true });
    if (conf.isConfirmed) {
        Swal.fire({ title: "กำลังอนุมัติ...", allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        const res = await API.post({ action: "approveOrder", orderId: id });
        if(res.status === 'success') {
            await loadData(); loadUsers(); 
            Swal.fire("สำเร็จ", "เติมแต้มให้ลูกค้าแล้ว", "success");
        } else {
            Swal.fire("ผิดพลาด", res.message, "error");
        }
    }
}

// 🚚 3. อัปเดตสถานะการจัดส่ง (ของรางวัลสะสมแต้ม)
async function bulkApproveShipping() {
    let rows = Array.from(document.querySelectorAll(".chk-redeem:checked")).map((cb) => parseInt(cb.value));
    if (!rows.length) return Swal.fire("แจ้งเตือน", "กรุณาเลือกรายการก่อนจัดส่ง", "warning");
    const conf = await Swal.fire({ title: `ยืนยันจัดส่ง ${rows.length} รายการ?`, icon: "info", showCancelButton: true });
    if (conf.isConfirmed) {
        Swal.fire({ title: "กำลังอัปเดต...", allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        const res = await API.post({ action: "bulkUpdateRedeem", rowIndices: rows, status: "จัดส่งแล้ว" });
        if(res.status === 'success') {
            await loadData(); 
            Swal.fire("อัปเดตสำเร็จ", "เปลี่ยนสถานะเป็นจัดส่งแล้ว", "success");
        } else {
            Swal.fire("ผิดพลาด", res.message, "error");
        }
    }
}

// ❌ 4. ปฏิเสธรายการ (ออเดอร์แจ้งโอน หรือ ของรางวัล)
function openReject(type, id) {
    document.getElementById("rejType").value = type; 
    document.getElementById("rejId").value = id; 
    document.getElementById("rejRemark").value = ""; 
    rModal.show();
}

async function submitReject() {
    const btn = document.getElementById("rejSaveBtn"); 
    const type = document.getElementById("rejType").value; 
    const id = document.getElementById("rejId").value; 
    const remark = document.getElementById("rejRemark").value;
    
    if (!remark) { Swal.fire("เตือน", "กรุณาระบุเหตุผลด้วยครับ", "warning"); return; }
    
    btn.innerText = "กำลังดำเนินการ..."; btn.disabled = true;
    
    const data = { action: type === "order" ? "rejectOrder" : "rejectRedeem", remark: remark };
    if (type === "order") { data.orderId = id; } else { data.rowIndex = parseInt(id); }
    
    const res = await API.post(data);
    rModal.hide(); 
    btn.innerText = "ยืนยันยกเลิก"; btn.disabled = false;
    
    if(res.status === 'success') {
        await loadData(); loadProducts(); loadUsers(); loadGacha(); 
        Swal.fire("ยกเลิกสำเร็จ", "แต้ม/สต็อก ถูกดึงกลับเรียบร้อย", "success");
    } else {
        Swal.fire("ผิดพลาด", res.message, "error");
    }
}

// ⏳ 5. ยึดสิทธิ์ของรางวัล (กรณีไม่ทักไลน์ภายใน 48 ชม.)
async function forfeitReward(rowIndex) {
    const conf = await Swal.fire({ 
        title: 'ยืนยันการ "ยึดสิทธิ์"?', 
        html: `ลูกค้ารายการนี้ติดต่อเกิน 48 ชม. ใช่หรือไม่?<br><br><span class="text-danger fw-bold">⚠️ ระบบจะไม่คืนแต้มให้ลูกค้า แต่จะนำของรางวัลกลับเข้าสต็อกอัตโนมัติ</span>`, 
        icon: "warning", showCancelButton: true, confirmButtonText: "ยืนยัน ยึดสิทธิ์", confirmButtonColor: "#212529" 
    });
    if (conf.isConfirmed) {
        Swal.fire({ title: "กำลังประมวลผล...", allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        const res = await API.post({ action: "forfeitRedeem", rowIndex: rowIndex });
        if (res.status === "success") { 
            await loadData(); loadProducts(); loadGacha(); 
            Swal.fire("สำเร็จ", "บันทึกเป็นสละสิทธิ์และคืนของเข้าสต็อกเรียบร้อย", "success"); 
        } else {
            Swal.fire("ผิดพลาด", res.message, "error");
        }
    }
}

// 🖨️ 6. พิมพ์ใบปะหน้า (ของรางวัลสะสมแต้ม)
function printSelectedLabels() {
    let rows = Array.from(document.querySelectorAll(".chk-redeem:checked")).map((cb) => parseInt(cb.value));
    if (!rows.length) return Swal.fire("เตือน", "เลือกรายการก่อนพิมพ์", "warning");
    let printWindow = window.open("", "_blank");
    
    let html = "<html><head><title>พิมพ์ใบปะหน้า</title><style>body{font-family:sans-serif;padding:20px;}.label{border:2px dashed #000;padding:20px;margin-bottom:20px;border-radius:8px;max-width:400px;page-break-inside:avoid;}h2{margin:0 0 10px 0;color:#d9534f;}.sender{font-size:12px;color:#555;margin-bottom:15px;border-bottom:1px solid #ccc;padding-bottom:5px;}</style></head><body>";
    
    appState.pendingRedeemsTable.filter((r) => rows.includes(r.rowIndex)).forEach((d) => { 
        html += `<div class='label'><div class='sender'><b>ผู้ส่ง:</b> บ้านรถของเล่น<br>โทร: 064-718-8878</div><h2>ผู้รับ: ${d.name}</h2><p><b>ที่อยู่:</b> ${d.address} ${d.zipcode || ""}</p><p><b>โทร:</b> ${d.phone}</p><p style='text-align: right; margin-top:10px; font-size:12px;'><b>รหัสสินค้า:</b> ${d.productId}</p></div>`; 
    });
    
    html += "</body></html>";
    printWindow.document.write(html); printWindow.document.close(); setTimeout(() => printWindow.print(), 500);
}

// ==========================================
// 🛒 ระบบแอดมินร้านค้า: จัดการออเดอร์ร้านค้า & พิมพ์ใบปะหน้า
// ==========================================

// 🔄 7. ฟังก์ชันโหลดข้อมูลออเดอร์ร้านค้า
window.loadShopOrders = async function() {
    Swal.fire({ title: 'กำลังโหลดข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    const res = await API.shopGet("getShopOrders");
    
    if (res.status === "success") {
        appState.shopOrdersTableBody = res.data;
        renderTable("shopOrdersTableBody");
        Swal.close();
    } else {
        Swal.fire('ผิดพลาด', res.message, 'error');
    }
}

// ✅ 8. ฟังก์ชันให้แอดมินกดอนุมัติสลิปออเดอร์ร้านค้า
window.approveShopOrder = async function(rowIndex) {
    const conf = await Swal.fire({ title: 'สลิปถูกต้อง อนุมัติเลยไหม?', icon: 'question', showCancelButton: true });
    if(conf.isConfirmed) {
        Swal.fire({ title: "กำลังอัปเดต...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        const res = await API.shopPost({ action: "bulkUpdateShopOrder", rowIndices: [parseInt(rowIndex)], status: "รอจัดส่ง" });
        
        if(res.status === 'success') { 
            await loadShopOrders(); 
            Swal.fire("สำเร็จ", "อนุมัติออเดอร์แล้ว", "success"); 
        } 
        else { Swal.fire("ผิดพลาด", res.message, "error"); }
    }
}

// 🚚 9. ฟังก์ชันอัปเดตสถานะเป็นจัดส่งแล้ว (ออเดอร์ร้านค้า)
window.bulkApproveShopShipping = async function() {
    let rows = Array.from(document.querySelectorAll(".chk-shop:checked")).map((cb) => parseInt(cb.value));
    if (!rows.length) return Swal.fire("แจ้งเตือน", "กรุณาเลือกรายการก่อนครับ", "warning");
    
    const conf = await Swal.fire({ title: `ยืนยันจัดส่ง ${rows.length} รายการ?`, icon: "info", showCancelButton: true });
    if (conf.isConfirmed) {
        Swal.fire({ title: "กำลังอัปเดต...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        const res = await API.shopPost({ action: "bulkUpdateShopOrder", rowIndices: rows, status: "จัดส่งแล้ว" });
        
        if(res.status === 'success') {
            await loadShopOrders(); 
            Swal.fire("สำเร็จ", "เปลี่ยนสถานะเป็นจัดส่งแล้ว", "success");
        } else {
            Swal.fire("ผิดพลาด", res.message, "error");
        }
    }
}

// ✏️ 10. ฟังก์ชันเปิดหน้าต่างแก้ไขข้อมูลและสถานะออเดอร์
window.openEditShopOrder = function(rowIndex) {
    const o = appState.shopOrdersTableBody.find(x => x.rowIndex == rowIndex);
    if (!o) return;
    
    Swal.fire({
        title: '✏️ แก้ไขออเดอร์',
        html: `
            <div class="text-start" style="font-size: 0.9rem;">
                <div class="row g-2 mb-2">
                    <div class="col-6"><label class="fw-bold small">ชื่อลูกค้า</label><input type="text" id="editSoName" class="form-control form-control-sm" value="${o.name}"></div>
                    <div class="col-6"><label class="fw-bold small">เบอร์โทร</label><input type="text" id="editSoPhone" class="form-control form-control-sm" value="${o.phone}"></div>
                </div>
                <div class="row g-2 mb-2">
                    <div class="col-6">
                        <label class="fw-bold small text-primary">สถานะออเดอร์</label>
                        <select id="editSoStatus" class="form-select form-select-sm border-primary">
                            <option value="รอชำระเงิน" ${o.status==='รอชำระเงิน'?'selected':''}>รอชำระเงิน</option>
                            <option value="รอตรวจสอบสลิป" ${o.status==='รอตรวจสอบสลิป'?'selected':''}>รอตรวจสอบสลิป</option>
                            <option value="รอจัดส่ง" ${o.status==='รอจัดส่ง'?'selected':''}>รอจัดส่ง</option>
                            <option value="จัดส่งแล้ว" ${o.status==='จัดส่งแล้ว'?'selected':''}>จัดส่งแล้ว</option>
                            <option value="ยกเลิก" ${o.status==='ยกเลิก'?'selected':''}>ยกเลิก (คืนสต็อก)</option>
                        </select>
                    </div>
                    <div class="col-6"><label class="fw-bold small text-success">ยอดสุทธิ (บาท)</label><input type="number" id="editSoTotal" class="form-control form-control-sm border-success text-success fw-bold" value="${o.total}"></div>
                </div>
                <label class="fw-bold small mt-2">รายละเอียดรายการ (แก้ไขข้อความได้)</label>
                <textarea id="editSoDetail" class="form-control form-control-sm bg-light" rows="5">${o.detail}</textarea>
                <small class="text-danger mt-1 d-block fw-bold">* หากเปลี่ยนสถานะเป็น "ยกเลิก" ระบบจะดึงสต็อกกลับเข้าคลังอัตโนมัติค่ะ</small>
            </div>
        `,
        showCancelButton: true, confirmButtonText: '💾 บันทึกการแก้ไข', cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            return {
                rowIndex: o.rowIndex,
                name: document.getElementById('editSoName').value,
                phone: document.getElementById('editSoPhone').value,
                status: document.getElementById('editSoStatus').value,
                total: document.getElementById('editSoTotal').value,
                detail: document.getElementById('editSoDetail').value
            }
        }
    }).then(async (res) => {
        if (res.isConfirmed) {
            Swal.fire({ title: 'กำลังบันทึกข้อมูล...', allowOutsideClick: false, didOpen: ()=>Swal.showLoading() });
            const apiRes = await API.shopPost({ action: 'updateShopOrderDetails', ...res.value });
            if (apiRes.status === 'success') { await loadShopOrders(); Swal.fire('สำเร็จ', 'อัปเดตออเดอร์เรียบร้อยแล้ว', 'success'); } 
            else { Swal.fire('ผิดพลาด', apiRes.message, 'error'); }
        }
    });
}

// 🗑️ 11. ฟังก์ชันลบออเดอร์ทิ้งถาวรและคืนสต็อก
window.deleteShopOrder = async function(rowIndex) {
    const conf = await Swal.fire({
        title: 'ยืนยันการลบออเดอร์?', text: 'หากลบ ระบบจะลบข้อมูลทิ้งถาวร และคืนสต็อกสินค้าให้โดยอัตโนมัติ (ยกเว้นออเดอร์ที่ถูกยกเลิกไปก่อนแล้ว)',
        icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'ลบข้อมูลถาวร'
    });
    if (conf.isConfirmed) {
        Swal.fire({ title: 'กำลังลบ...', allowOutsideClick: false, didOpen: ()=>Swal.showLoading() });
        const res = await API.shopPost({ action: 'deleteShopOrder', rowIndex: rowIndex });
        if(res.status === 'success') { await loadShopOrders(); Swal.fire('ลบสำเร็จ', 'คืนสต็อกสินค้าให้แล้ว', 'success'); } 
        else { Swal.fire('ผิดพลาด', res.message, 'error'); }
    }
}

// 🖨️ 12. ฟังก์ชันพิมพ์ใบปะหน้าแบบเทพๆ (กระชับ 100x150mm พอดี 1 แผ่น)
window.printShopLabels = function() {
    let rows = Array.from(document.querySelectorAll(".chk-shop:checked")).map((cb) => parseInt(cb.value));
    if (!rows.length) return Swal.fire("แจ้งเตือน", "กรุณาติ๊กเลือกออเดอร์ที่ต้องการพิมพ์ใบปะหน้าก่อนครับ", "warning");
    
    let selectedOrders = appState.shopOrdersTableBody.filter(o => rows.includes(o.rowIndex));
    let printWindow = window.open("", "_blank");
    
    let html = `
    <html><head>
        <title>พิมพ์ใบปะหน้าพัสดุ</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            @page { size: 100mm 150mm; margin: 0mm; } 
            body { font-family: 'Kanit', sans-serif; background: #fff; margin: 0; padding: 0; color: #000; }
            
            .label-card { width: 100mm; height: 150mm; padding: 6mm 8mm; box-sizing: border-box; page-break-after: always; display: flex; flex-direction: column; overflow: hidden; }
            
            .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
            .sender-info { font-size: 11px; line-height: 1.3; }
            
            .right-header { text-align: right; }
            .shipping-type { font-size: 20px; font-weight: 600; letter-spacing: 1px; }
            .order-id { font-size: 11px; color: #333; margin-top: 2px; font-weight: bold; }
            
            .divider { border-bottom: 2px solid #000; margin-bottom: 8px; }
            
            .recipient-title { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
            .r-name { font-size: 20px; font-weight: 600; margin-bottom: 2px; line-height: 1.2; word-wrap: break-word; }
            .r-phone { font-size: 13px; margin-bottom: 8px; }
            
            .r-address-container { font-size: 13px; line-height: 1.4; margin-bottom: 5px; flex-grow: 1; word-wrap: break-word; }
            
            .r-zipcode-box { font-size: 18px; font-weight: bold; margin-top: auto; }
            
            .cod-box { margin-top: 5px; border: 2px solid #000; text-align: center; padding: 5px; border-radius: 6px; }
            .cod-text { font-size: 14px; font-weight: bold; }
            .cod-amount { font-size: 24px; font-weight: 800; margin-top: 2px; }
        </style>
    </head><body>`;
    
    selectedOrders.forEach(o => {
        let isCOD = o.detail.includes('COD') || o.detail.includes('เก็บเงินปลายทาง');
        let codHtml = '';
        if (isCOD) {
            codHtml = `
            <div class="cod-box">
                <div class="cod-text">เก็บเงินปลายทาง (COD)</div>
                <div class="cod-amount">฿${o.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
            </div>`;
        }

        let addr = o.address || "";
        let addrLine = addr, sub = "", dist = "", prov = "";
        const m = addr.match(/(.*?)(?:ต\.|แขวง)\s*(.*?)\s*(?:อ\.|เขต)\s*(.*?)\s*(?:จ\.|จังหวัด)\s*(.*)/);
        
        if(m) { 
            addrLine = m[1].trim(); 
            sub = "[แขวง/ตำบล] " + m[2].trim(); 
            dist = "[เขต/อำเภอ] " + m[3].trim(); 
            prov = "[จังหวัด] " + m[4].trim(); 
        }

        html += `
        <div class="label-card">
            <div class="header-section">
                <div class="sender-info">
                    <b>ผู้ส่ง:</b> บ้านรถของเล่น<br>
                    <b>เบอร์โทร:</b> 064-718-8878
                </div>
                <div class="right-header">
                    <div class="shipping-type">ส่ง EMS</div>
                    <div class="order-id">บิล: ${o.orderId}</div>
                </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="recipient-title">ผู้รับ:</div>
            <div class="r-name">${o.name}</div>
            <div class="r-phone"><b>เบอร์โทร:</b> ${o.phone}</div>
            
            <div class="r-address-container">
                <b>ที่อยู่:</b> ${addrLine}<br>
                ${sub} ${dist} ${prov}
            </div>
            
            <div class="r-zipcode-box">รหัสไปรษณีย์: ${o.zipcode || '-'}</div>
            ${codHtml}
        </div>`;
    });
    
    html += "</body></html>";
    printWindow.document.write(html); 
    printWindow.document.close(); 
    
    setTimeout(() => { printWindow.print(); }, 800);
}

// ==========================================
// 🛠️ 13. ฟังก์ชันสร้างออเดอร์แบบ Manual (อัปเกรด: Live Search + No Popup Blocker)
// ==========================================
window.openManualOrderModal = async function() {
    // โหลดข้อมูลสินค้า
    Swal.fire({ title: 'กำลังโหลดข้อมูลสินค้า...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const res = await API.shopGet("getProducts");
    window.manualProducts = res.status === 'success' ? res.data : [];
    window.manualCart = []; // ล้างตะกร้าแมนนวล
    Swal.close();

    Swal.fire({
        title: '📝 สร้างออเดอร์ใหม่',
        width: '750px',
        html: `
            <div class="text-start mt-2" style="font-size: 0.9rem;">
                <div class="row g-2 mb-3">
                    <div class="col-md-6">
                        <label class="fw-bold text-primary mb-1">ค้นหาเบอร์โทรลูกค้า</label>
                        <div class="input-group input-group-sm">
                            <input type="tel" id="moPhone" class="form-control border-primary" placeholder="08xxxxxxxx" onkeyup="searchManualUser(this.value)">
                            <button class="btn btn-primary" type="button" onclick="searchManualUser(document.getElementById('moPhone').value)"><i class="fas fa-search"></i></button>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label class="fw-bold mb-1">ชื่อลูกค้า</label>
                        <input type="text" id="moName" class="form-control form-control-sm bg-light" required>
                    </div>
                    <div class="col-12">
                        <label class="fw-bold mb-1">ที่อยู่จัดส่ง (รวมตำบล อำเภอ จังหวัด)</label>
                        <input type="text" id="moAddress" class="form-control form-control-sm bg-light" required>
                    </div>
                    <div class="col-12">
                        <label class="fw-bold mb-1">รหัสไปรษณีย์</label>
                        <input type="text" id="moZip" class="form-control form-control-sm bg-light" required>
                    </div>
                </div>
                
                <hr class="my-3">
                
                <!-- ระบบค้นหาสินค้าอัจฉริยะ (Live Search) -->
                <label class="fw-bold text-success mb-1"><i class="fas fa-search"></i> ค้นหาและเพิ่มสินค้า</label>
                <div class="position-relative mb-3" id="searchContainer">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text bg-white border-success"><i class="fas fa-box text-success"></i></span>
                        <input type="text" id="moProductSearch" class="form-control border-success border-start-0 ps-0" placeholder="พิมพ์ชื่อสินค้า หรือ รถเหล็ก..." oninput="searchManualProduct(this.value)" autocomplete="off">
                    </div>
                    <!-- Dropdown แสดงผลลัพธ์ -->
                    <ul id="moProductDropdown" class="list-group position-absolute w-100 shadow-lg d-none" style="z-index: 9999; max-height: 250px; overflow-y: auto; top: 100%;"></ul>
                </div>
                
                <!-- ตารางสรุปรายการสินค้าแบบใหม่ (มีรูปภาพและปุ่มจัดการ) -->
                <div class="table-responsive mb-3 border rounded shadow-sm">
                    <table class="table table-hover mb-0 align-middle">
                        <thead class="table-light" style="font-size: 0.85rem;">
                            <tr><th colspan="2">รายการสินค้า</th><th class="text-center">ราคา</th><th class="text-center" width="120">จำนวน</th><th class="text-center" width="50">ลบ</th></tr>
                        </thead>
                        <tbody id="moCartBody">
                            <tr><td colspan="5" class="text-center text-muted small py-4">ยังไม่มีสินค้าในออเดอร์ กรุณาค้นหาและเลือกสินค้าด้านบน</td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- ส่วนคำนวณยอดเงิน (ค่าส่ง & ส่วนลด) -->
                <div class="row g-2 mb-2 p-3 bg-light rounded border">
                    <div class="col-6">
                        <label class="fw-bold text-secondary mb-1">📦 ค่าจัดส่ง (บาท)</label>
                        <input type="number" id="moShipping" class="form-control form-control-sm" value="0" oninput="calcManualTotal()" onchange="calcManualTotal()">
                    </div>
                    <div class="col-6">
                        <label class="fw-bold text-danger mb-1">🏷️ ส่วนลดทางร้าน (บาท)</label>
                        <input type="number" id="moDiscount" class="form-control form-control-sm border-danger" value="0" oninput="calcManualTotal()" onchange="calcManualTotal()">
                    </div>
                </div>
                
                <div class="alert alert-success mt-3 mb-0 text-end shadow-sm">
                    <span class="fw-bold text-dark fs-6">ยอดสุทธิที่ต้องชำระ:</span>
                    <h2 class="mb-0 fw-bold text-success d-inline-block ms-2" id="moNetTotalDisplay">฿0.00</h2>
                </div>
            </div>
        `,
        showCancelButton: true, confirmButtonText: 'บันทึกออเดอร์', cancelButtonText: 'ยกเลิก',
        didOpen: () => { document.addEventListener('click', closeDropdownOnClickOutside); },
        willClose: () => { document.removeEventListener('click', closeDropdownOnClickOutside); },
        preConfirm: () => {
            const phone = document.getElementById('moPhone').value;
            const name = document.getElementById('moName').value;
            const address = document.getElementById('moAddress').value;
            const zip = document.getElementById('moZip').value;
            const shipping = parseFloat(document.getElementById('moShipping').value) || 0;
            const discount = parseFloat(document.getElementById('moDiscount').value) || 0;
            
            if(!phone || !name || !address) { Swal.showValidationMessage('กรุณากรอกข้อมูลลูกค้าให้ครบถ้วน'); return false; }
            if(window.manualCart.length === 0) { Swal.showValidationMessage('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ'); return false; }
            
            let productsTotal = window.manualCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            let netTotal = productsTotal + shipping - discount;

            return { phone, name, address: address + ' ' + zip, items: window.manualCart, shipping, discount, netTotal };
        }
    }).then(async (result) => {
        if(result.isConfirmed) {
            Swal.fire({ title: 'กำลังบันทึกและตัดสต๊อก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const res = await API.shopPost({ action: 'createManualOrder', ...result.value });
            if(res.status === 'success') {
                await loadShopOrders();
                Swal.fire('สำเร็จ', 'สร้างออเดอร์และตัดสต๊อกเรียบร้อยแล้ว!', 'success');
            } else {
                Swal.fire('ผิดพลาด', res.message, 'error');
            }
        }
    });
}

// 🔍 ฟังก์ชันปิด Dropdown เมื่อคลิกที่อื่น
function closeDropdownOnClickOutside(event) {
    const container = document.getElementById('searchContainer');
    const dropdown = document.getElementById('moProductDropdown');
    if (container && dropdown && !container.contains(event.target)) {
        dropdown.classList.add('d-none');
    }
}

// 🔍 ฟังก์ชันค้นหาสินค้าแบบ Live Search
window.searchManualProduct = function(keyword) {
    const dropdown = document.getElementById('moProductDropdown');
    if (!keyword.trim()) { dropdown.classList.add('d-none'); return; }
    
    const lowerKey = keyword.toLowerCase();
    const matches = window.manualProducts.filter(p => p.name.toLowerCase().includes(lowerKey) && p.stock > 0).slice(0, 10);

    if (matches.length === 0) {
        dropdown.innerHTML = '<li class="list-group-item text-muted small py-3 text-center">❌ ไม่พบสินค้า หรือ สินค้าหมดสต๊อก</li>';
    } else {
        dropdown.innerHTML = matches.map(p => {
            let imgUrl = p.image && p.image.trim() !== '' ? p.image : 'https://placehold.co/100x100/eeeeee/31343C?text=No+Img';
            return `
            <li class="list-group-item list-group-item-action d-flex align-items-center" style="cursor: pointer; transition: 0.2s;" onclick="addManualItemById('${p.id}')">
                <img src="${imgUrl}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;" class="me-3 shadow-sm">
                <div class="flex-grow-1 text-truncate fw-bold text-dark" style="font-size: 0.85rem;">${p.name}</div>
                <div class="text-success fw-bold ms-3" style="font-size: 0.9rem;">฿${p.retail_price}</div>
                <span class="badge bg-light border text-dark ms-2">คงเหลือ: ${p.stock}</span>
            </li>`;
        }).join('');
    }
    dropdown.classList.remove('d-none');
}

// 🛒 ฟังก์ชันเพิ่มสินค้าลงตะกร้าแมนนวล (ดึงจาก ID) + ระบบแจ้งเตือนที่ไม่ปิด Pop-up
window.addManualItemById = function(id) {
    const p = window.manualProducts.find(x => x.id === id);
    if (!p) return;

    let existing = window.manualCart.find(i => i.id === id);
    if (existing) {
        if (existing.qty < p.stock) {
            existing.qty++;
        } else {
            showInlineNoti('⚠️ สต๊อกไม่พอ!', 'danger'); return;
        }
    } else {
        window.manualCart.push({ id: p.id, name: p.name, price: p.retail_price, qty: 1, maxStock: p.stock, image: p.image });
    }

    document.getElementById('moProductSearch').value = '';
    document.getElementById('moProductDropdown').classList.add('d-none');
    
    renderManualCart();
    showInlineNoti('✅ เพิ่มสินค้าลงออเดอร์แล้ว', 'success');
}

// 🛒 ฟังก์ชันวาดตารางสินค้าและคำนวณยอดเงิน
window.renderManualCart = function() {
    const tbody = document.getElementById('moCartBody');
    if(window.manualCart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted small py-4">ยังไม่มีสินค้าในออเดอร์ กรุณาค้นหาและเลือกสินค้าด้านบน</td></tr>';
    } else {
        let html = '';
        window.manualCart.forEach((item, index) => {
            let imgUrl = item.image && item.image.trim() !== '' ? item.image : 'https://placehold.co/100x100/eeeeee/31343C?text=No+Img';
            html += `
            <tr class="bg-white">
                <td width="55"><img src="${imgUrl}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;" class="shadow-sm"></td>
                <td class="fw-bold text-dark text-wrap" style="font-size: 0.85rem; line-height: 1.3;">${item.name}</td>
                <td class="text-success fw-bold text-center align-middle">฿${item.price}</td>
                <td class="align-middle">
                    <div class="d-flex align-items-center justify-content-center bg-light rounded-pill border p-1">
                        <button class="btn btn-sm btn-white rounded-circle text-danger fw-bold shadow-sm" style="width: 28px; height: 28px; padding: 0;" onclick="updateManualQty(${index}, -1)">-</button>
                        <span class="mx-2 fw-bold text-dark" style="width: 20px; text-align: center;">${item.qty}</span>
                        <button class="btn btn-sm btn-white rounded-circle text-success fw-bold shadow-sm" style="width: 28px; height: 28px; padding: 0;" onclick="updateManualQty(${index}, 1)">+</button>
                    </div>
                </td>
                <td class="text-center align-middle">
                    <button class="btn btn-sm btn-danger rounded-circle shadow-sm" style="width: 32px; height: 32px; padding: 0;" onclick="updateManualQty(${index}, 'delete')" title="ลบรายการนี้"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }
    calcManualTotal(); 
}

// 🛒 ฟังก์ชันปรับเพิ่ม/ลดจำนวน หรือลบสินค้า
window.updateManualQty = function(index, change) {
    if(change === 'delete') {
        window.manualCart.splice(index, 1);
    } else {
        let item = window.manualCart[index];
        let newQty = item.qty + change;
        if(newQty > 0 && newQty <= item.maxStock) {
            item.qty = newQty;
        } else if (newQty > item.maxStock) {
            showInlineNoti('⚠️ สต๊อกไม่พอ!', 'danger'); return;
        }
    }
    renderManualCart();
}

// 🧮 ฟังก์ชันคำนวณยอดสุทธิ
window.calcManualTotal = function() {
    let productsTotal = window.manualCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let shipping = parseFloat(document.getElementById('moShipping').value) || 0;
    let discount = parseFloat(document.getElementById('moDiscount').value) || 0;
    
    let netTotal = productsTotal + shipping - discount;
    if (netTotal < 0) netTotal = 0; 
    
    document.getElementById('moNetTotalDisplay').innerText = '฿' + netTotal.toLocaleString('en-US', {minimumFractionDigits: 2});
}

// 🔍 ฟังก์ชันค้นหาข้อมูลลูกค้า
window.searchManualUser = function(phone) {
    if(phone.length < 9) return;
    const u = appState.userTable.find(x => String(x.phone).includes(phone));
    if(u) {
        document.getElementById('moName').value = u.fname || u.name || '';
        document.getElementById('moAddress').value = (u.addressLine || u.address || '') + ' ต.' + (u.subdistrict || '') + ' อ.' + (u.district || '') + ' จ.' + (u.province || '');
        document.getElementById('moZip').value = u.zipcode || '';
    }
}

// 🔔 ฟังก์ชัน: แสดงข้อความแจ้งเตือนแทรกใน Pop-up เดิม
window.showInlineNoti = function(msg, type) {
    let container = document.getElementById('searchContainer');
    if(!container) return;
    
    let noti = document.createElement('div');
    noti.className = `alert alert-${type} py-1 px-2 position-absolute shadow-sm`;
    noti.style.cssText = 'top: -40px; right: 0; z-index: 1060; font-size: 0.8rem; font-weight: bold; animation: fadeInOut 2s forwards;';
    noti.innerHTML = msg;
    
    if(!document.getElementById('notiKeyframes')) {
        let style = document.createElement('style');
        style.id = 'notiKeyframes';
        style.innerHTML = `@keyframes fadeInOut { 0% { opacity: 0; transform: translateY(10px); } 15% { opacity: 1; transform: translateY(0); } 85% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-10px); } }`;
        document.head.appendChild(style);
    }
    
    container.appendChild(noti);
    setTimeout(() => { if(noti.parentNode) noti.remove(); }, 2000);
}
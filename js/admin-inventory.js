// ==========================================
// 📦 Admin Module: Inventory & Gacha Management
// ==========================================

async function loadProducts() { const res = await API.get("getProducts"); if (res.status === "success") { appState.productTable = res.data; renderTable("productTable"); } }
async function loadGacha() { const res = await API.get("getGacha"); if (res.status === "success") { appState.gachaTable = res.data; renderTable("gachaTable"); } }

function openProductModal(p = null) {
    document.getElementById("productForm").reset(); document.getElementById("pRow").value = p ? p.rowIndex : ""; 
    document.getElementById("pFile").required = !p; document.getElementById("pEditHint").classList.toggle("d-none", !p);
    if (p) { document.getElementById("pName").value = p.name; document.getElementById("pPoints").value = p.points; document.getElementById("pStock").value = p.stock; document.getElementById("pDesc").value = p.desc; }
    pModal.show();
}

async function saveProduct(e) {
    e.preventDefault(); const btn = document.getElementById("pSaveBtn"); btn.innerText = "บันทึก..."; btn.disabled = true;
    try {
        const file = document.getElementById("pFile").files[0]; const base64 = file ? await getBase64(file) : null;
        const res = await API.post({ action: document.getElementById("pRow").value ? "editProduct" : "addProduct", rowIndex: document.getElementById("pRow").value, name: document.getElementById("pName").value, pointsReq: document.getElementById("pPoints").value, stock: document.getElementById("pStock").value, desc: document.getElementById("pDesc").value, imageBase64: base64 });
        if (res.status === "success") { pModal.hide(); loadProducts(); Swal.fire("สำเร็จ", "บันทึกสต็อกแล้ว", "success"); }
    } catch (e) { Swal.fire("Error", e.message, "error"); }
    btn.innerText = "บันทึกสินค้า"; btn.disabled = false;
}

function openGachaModal(g = null) {
    document.getElementById('gachaForm').reset(); document.getElementById('gRow').value = g ? g.rowIndex : ''; 
    document.getElementById('gFile').required = !g; document.getElementById('gEditHint').classList.toggle('d-none', !g);
    if(g) { 
        document.getElementById('gName').value = g.name; document.getElementById('gType').value = g.type; document.getElementById('gValue').value = g.value; document.getElementById('gStock').value = g.stock; document.getElementById('gRate').value = g.rate; 
        document.getElementById('gCategory').value = g.category || 'รถทั่วไป';
        let isP = (g.isPity === true || g.isPity === 'true' || g.isPity === 'TRUE');
        document.getElementById('gIsPity').checked = isP;
        document.getElementById('gPityCountDiv').classList.toggle('d-none', !isP);
        document.getElementById('gPityCount').value = g.pityCount || '';
    }
    toggleGachaType(); gModal.show();
}

async function saveGacha(e) {
    e.preventDefault(); const btn = document.getElementById('gSaveBtn'); btn.innerText = "บันทึก..."; btn.disabled = true;
    try {
        const type = document.getElementById('gType').value; let base64 = null; let autoImage = null;
        if (type === 'Points') { autoImage = `https://ui-avatars.com/api/?name=${document.getElementById('gValue').value}+Pts&background=FFD700&size=512&bold=true`; } 
        else { const file = document.getElementById('gFile').files[0]; if (file) base64 = await getBase64(file); }
        const res = await API.post({ action: document.getElementById('gRow').value ? 'editGacha' : 'addGacha', rowIndex: document.getElementById('gRow').value, name: document.getElementById('gName').value, type: type, value: document.getElementById('gValue').value, stock: document.getElementById('gStock').value, rate: document.getElementById('gRate').value, imageBase64: base64, autoImageUrl: autoImage, isPity: document.getElementById('gIsPity').checked, pityCount: document.getElementById('gPityCount').value, category: document.getElementById('gCategory').value });
        if(res.status === 'success') { gModal.hide(); loadGacha(); Swal.fire('สำเร็จ', 'บันทึกการ์ดรางวัลแล้ว', 'success'); }
    } catch (e) { Swal.fire('Error', e.message, 'error'); }
    btn.innerText = "บันทึกการ์ด"; btn.disabled = false; 
}

function toggleGachaType() {
    const isProd = document.getElementById('gType').value === 'Product';
    document.getElementById('gValueLabel').innerText = isProd ? "รหัสอ้างอิงสินค้า (เช่น P1)" : "จำนวนแต้มที่จะคืน (โบนัส)";
    document.getElementById('gImageDiv').classList.toggle('d-none', !isProd);
    document.getElementById('gPitySetup').classList.toggle('d-none', !isProd);
}

// 🗑️ ฟังก์ชันลบข้อมูล (อัปเกรด: มีโหลดดิ้งและรอคอนเฟิร์มจากเซิร์ฟเวอร์)
window.deleteItem = async function(action, id, reloadFunc) {
    const conf = await Swal.fire({ 
        title: "ยืนยันการลบถาวร?", 
        text: "หากลบแล้วจะไม่สามารถกู้คืนข้อมูลได้",
        icon: "warning", 
        showCancelButton: true, 
        confirmButtonColor: "#d33",
        confirmButtonText: "ใช่, ลบข้อมูล"
    });
    
    if (conf.isConfirmed) { 
        // เปิดหน้าต่างโหลดดิ้งรอระหว่างลบ
        Swal.fire({ title: 'กำลังลบข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        // ส่งคำสั่งไปลบที่หลังบ้าน
        const res = await API.post({ action: action, id: id }); 
        
        if(res.status === 'success') {
            // ถ้ายืนยันว่าลบสำเร็จ ให้โหลดตารางใหม่
            if (typeof reloadFunc === 'function') {
                reloadFunc();
            } else if (typeof reloadFunc === 'string' && typeof window[reloadFunc] === 'function') {
                window[reloadFunc]();
            }
            Swal.fire("ลบสำเร็จ!", "ข้อมูลถูกลบออกจากระบบเรียบร้อย", "success"); 
        } else {
            // ถ้าลบพัง ให้โชว์ Error
            Swal.fire("ผิดพลาด", res.message || "ไม่สามารถลบข้อมูลได้", "error");
        }
    }
}

// 💡 เพิ่มเติม: เพื่อป้องกันบั๊กเวลาคลิกแก้ไขจากตาราง
window.openProductModalById = function(id) {
    const p = appState.productTable.find(x => x.id === id);
    if(p) openProductModal(p);
}

window.openGachaModalById = function(id) {
    const g = appState.gachaTable.find(x => x.id === id);
    if(g) openGachaModal(g);
}
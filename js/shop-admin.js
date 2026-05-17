// ==========================================
// 🛒 Module: Shop Admin (AI Scanner, CRUD & Pagination)
// ฉบับสมบูรณ์: เพิ่มระบบตัวเลือกสินค้า + ระบบค้นหาอัจฉริยะ
// ==========================================

let videoStream = null;
let isEditMode = false; 
let currentEditId = null; 
let allProducts = []; 
let filteredProducts = []; // 💡 ตัวแปรใหม่สำหรับเก็บผลการค้นหา
let scannedImageBase64 = null; 

let currentShopPage = 1;
const shopItemsPerPage = 10;

// 🔄 1. โหลดหมวดหมู่จาก Settings
window.loadDynamicCategories = async function(autoSelectCategory = null) {
    const res = await API.shopGet("getShopSettings");
    const select = document.getElementById("pCategory");
    if (!select) return;
    
    let currentVal = select.value; 
    if (res.status === "success" && res.data.categories) {
        const cats = res.data.categories.split(",").map(c => c.trim()).filter(c => c !== "");
        let html = '<option value="">-- เลือกหมวดหมู่ --</option>';
        cats.forEach(c => { html += `<option value="${c}">${c}</option>`; });
        select.innerHTML = html;
        if (autoSelectCategory && cats.includes(autoSelectCategory)) {
            select.value = autoSelectCategory;
        } else if (cats.includes(currentVal)) {
            select.value = currentVal;
        }
    } else {
        select.innerHTML = '<option value="">-- เลือกหมวดหมู่ --</option><option value="ทั่วไป">ทั่วไป</option>';
    }
}

window.generateSKU = function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'HW-';
    for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}

window.callAI = async function() {
    const name = document.getElementById('pName').value;
    const category = document.getElementById('pCategory').value;
    if (!name) return Swal.fire('แจ้งเตือน', 'กรุณาระบุชื่อสินค้าก่อนให้ AI ช่วยเขียนค่ะ', 'warning');
    Swal.fire({ title: '✨ AI กำลังใช้ความคิด...', html: 'กำลังสร้างคำอธิบาย...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const res = await API.shopPost({ action: 'generateSEO', name: name, category: category });
    if (res.status === 'success') {
        document.getElementById('pDesc').value = res.text;
        Swal.close();
    } else { Swal.fire('ผิดพลาด', 'AI ทำงานล้มเหลว', 'error'); }
}

window.openCameraScanner = async function() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Swal.fire('ข้อผิดพลาด', 'เบราว์เซอร์ไม่รองรับกล้อง', 'error');
    const modalEl = document.getElementById('cameraModal');
    let modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.show();
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        document.getElementById('cameraFeed').srcObject = videoStream;
    } catch (err) { Swal.fire('ข้อผิดพลาด', 'เข้าถึงกล้องไม่ได้', 'error'); }
}

document.getElementById('cameraModal')?.addEventListener('hidden.bs.modal', () => {
    if (videoStream) videoStream.getTracks().forEach(track => track.stop());
});

// 📸 2. ถ่ายภาพและบีบอัดขนาด
window.captureAndAnalyze = async function() {
    try {
        const video = document.getElementById('cameraFeed');
        if (!video || video.videoWidth === 0) return Swal.fire('แจ้งเตือน', 'กล้องยังไม่พร้อม', 'warning');
        
        const canvas = document.createElement('canvas');
        let width = video.videoWidth; 
        let height = video.videoHeight;
        
        const MAX_WIDTH = 600; 
        if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
        }

        canvas.width = width; 
        canvas.height = height;
        canvas.getContext('2d').drawImage(video, 0, 0, width, height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.6);
        
        Swal.fire({ title: 'AI กำลังวิเคราะห์ภาพ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const res = await API.shopPost({ action: 'analyzeImageAI', image: imageData });
        
        if (res.status === 'success') {
            document.getElementById("pName").value = res.data.name || '';
            document.getElementById("pDesc").value = res.data.description || '';
            await window.loadDynamicCategories(res.data.category);
            
            document.getElementById('imagePreview').src = imageData;
            document.getElementById('imagePreviewContainer').classList.remove('d-none');
            scannedImageBase64 = imageData; 
            
            bootstrap.Modal.getInstance(document.getElementById('cameraModal'))?.hide();
            Swal.fire('วิเคราะห์สำเร็จ', '', 'success');
        } else { Swal.fire('ผิดพลาด', res.message, 'error'); }
    } catch (e) { Swal.fire('Error', e.message, 'error'); }
}

// 💾 3. บันทึกข้อมูลสินค้า
window.saveProductData = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
    btn.disabled = true;
    
    const variantsInput = document.getElementById('pVariants');
    const variantsValue = variantsInput ? variantsInput.value : "";
    
    const payload = {
        action: isEditMode ? 'editProduct' : 'addProduct', 
        id: currentEditId,
        sku: document.getElementById('pSku').value, 
        name: document.getElementById('pName').value,
        category: document.getElementById('pCategory').value, 
        retail_price: document.getElementById('pRetailPrice').value,
        wholesale_price: document.getElementById('pWholesalePrice').value, 
        stock: document.getElementById('pStock').value,
        desc: document.getElementById('pDesc').value, 
        variants: variantsValue,
        image: scannedImageBase64 
    };
    
    const res = await API.shopPost(payload);
    if (res.status === 'success') {
        Swal.fire('สำเร็จ', 'อัปเดตข้อมูลเรียบร้อย', 'success');
        window.resetForm();
        window.loadProducts(); // โหลดใหม่และรีเซ็ตการค้นหาด้วย
    } else { Swal.fire('ผิดพลาด', res.message, 'error'); }
    btn.disabled = false;
}

// 📋 4. ระบบแสดงสินค้า + 🔍 ค้นหาอัจฉริยะ
window.loadProducts = async function() {
    const res = await API.shopGet("getProducts");
    if (res.status === 'success') { 
        allProducts = res.data.reverse(); 
        filteredProducts = [...allProducts]; // 💡 เริ่มต้นให้รายการกรอง = รายการทั้งหมด
        window.renderShopTable(); 
    }
}

// 🔍 ฟังก์ชันกรองข้อมูลเมื่อพิมพ์ในช่องค้นหา
window.searchShopProducts = function() {
    const input = document.getElementById('shopProductSearch');
    if (!input) return;
    
    const keyword = input.value.toLowerCase().trim();
    
    if (keyword === '') {
        filteredProducts = [...allProducts]; // คืนค่าทั้งหมดถ้าไม่ได้พิมพ์อะไร
    } else {
        filteredProducts = allProducts.filter(p => 
            (p.name && p.name.toLowerCase().includes(keyword)) ||
            (p.sku && p.sku.toLowerCase().includes(keyword)) ||
            (p.category && p.category.toLowerCase().includes(keyword))
        );
    }
    
    currentShopPage = 1; // เมื่อค้นหา ให้เด้งกลับไปหน้า 1 เสมอ
    window.renderShopTable();
}

window.renderShopTable = function() {
    const tbody = document.getElementById("productTableBody");
    if (!tbody) return;
    
    // 💡 เปลี่ยนมาใช้ filteredProducts แทน allProducts
    if (filteredProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted"><i class="fas fa-box-open fs-4 d-block mb-2"></i> ไม่พบสินค้าที่คุณค้นหา</td></tr>';
        document.getElementById("paginationContainer").innerHTML = '';
        return;
    }

    const startIndex = (currentShopPage - 1) * shopItemsPerPage;
    const endIndex = startIndex + shopItemsPerPage;
    const paginatedItems = filteredProducts.slice(startIndex, endIndex); // 💡 ใช้รายการที่กรองแล้วมาแบ่งหน้า

    let html = '';
    paginatedItems.forEach(p => {
        let imgTag = p.image ? `<img src="${p.image}" class="product-img-td shadow-sm">` : '<span class="badge bg-secondary">No Img</span>';
        let variantBadge = p.variants && p.variants.trim() !== "" ? `<br><span class="badge bg-warning text-dark mt-1" style="font-size:0.65rem;">มีตัวเลือก</span>` : "";

        html += `
        <tr>
            <td>${imgTag}</td>
            <td><span class="badge bg-dark">${p.sku}</span></td>
            <td class="fw-bold">${p.name}${variantBadge}</td>
            <td><span class="badge bg-info text-dark">${p.category}</span></td>
            <td class="text-success fw-bold">฿${p.retail_price}</td>
            <td class="text-primary fw-bold">${p.stock}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-warning mb-1 shadow-sm" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger mb-1 shadow-sm" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
    window.renderPagination(filteredProducts.length); // 💡 ส่งจำนวนรายการที่ผ่านการกรองไปคำนวณหน้า
}

window.renderPagination = function(totalItems) {
    const totalPages = Math.ceil(totalItems / shopItemsPerPage);
    const container = document.getElementById("paginationContainer");
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = `<nav><ul class="pagination justify-content-center shadow-sm">`;
    html += `<li class="page-item ${currentShopPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeShopPage(${currentShopPage - 1}); return false;">«</a></li>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentShopPage - 1 && i <= currentShopPage + 1)) {
            html += `<li class="page-item ${currentShopPage === i ? 'active' : ''}"><a class="page-link" href="#" onclick="changeShopPage(${i}); return false;">${i}</a></li>`;
        } else if (i === currentShopPage - 2 || i === currentShopPage + 2) {
            html += `<li class="page-item disabled"><span class="page-link border-0 text-muted">...</span></li>`;
        }
    }
    
    html += `<li class="page-item ${currentShopPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changeShopPage(${currentShopPage + 1}); return false;">»</a></li>`;
    html += `</ul></nav>`;
    container.innerHTML = html;
}

window.changeShopPage = function(page) {
    currentShopPage = page;
    window.renderShopTable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ✏️ 5. เปิดโหมดแก้ไข
window.editProduct = function(id) {
    // ค้นหาจาก allProducts เหมือนเดิม เพราะคือฐานข้อมูลตัวเต็ม
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    
    isEditMode = true; 
    currentEditId = id;
    
    document.getElementById('pSku').value = p.sku;
    document.getElementById('pName').value = p.name;
    document.getElementById('pCategory').value = p.category;
    document.getElementById('pRetailPrice').value = p.retail_price;
    document.getElementById('pWholesalePrice').value = p.wholesale_price;
    document.getElementById('pStock').value = p.stock;
    document.getElementById('pDesc').value = p.desc;
    
    if (document.getElementById('pVariants')) {
        document.getElementById('pVariants').value = p.variants || "";
    }

    if (p.image) {
        document.getElementById('imagePreview').src = p.image;
        document.getElementById('imagePreviewContainer').classList.remove('d-none');
        scannedImageBase64 = null; 
    } else {
        document.getElementById('imagePreview').src = '';
        document.getElementById('imagePreviewContainer').classList.add('d-none');
        scannedImageBase64 = null;
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.updateSaveButtonUI();
}

window.deleteProduct = async function(id) {
    const conf = await Swal.fire({ title: 'ลบสินค้านี้?', icon: 'warning', showCancelButton: true });
    if(conf.isConfirmed) {
        Swal.fire({ title: 'กำลังลบ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const res = await API.shopPost({ action: 'deleteProduct', id: id });
        if (res.status === 'success') { window.loadProducts(); Swal.fire('ลบแล้ว', '', 'success'); }
    }
}

window.resetForm = function() {
    isEditMode = false; currentEditId = null; scannedImageBase64 = null; 
    document.getElementById('shopForm').reset();
    document.getElementById('pSku').value = window.generateSKU(); 
    document.getElementById('imagePreview').src = '';
    document.getElementById('imagePreviewContainer').classList.add('d-none');
    
    if (document.getElementById('pVariants')) document.getElementById('pVariants').value = "";
    
    // 💡 รีเซ็ตช่องค้นหากลับเป็นค่าว่างด้วย
    if (document.getElementById('shopProductSearch')) {
        document.getElementById('shopProductSearch').value = '';
        window.searchShopProducts(); // สั่งให้ตารางกลับมาแสดงทั้งหมด
    }
    
    window.loadDynamicCategories();
    window.updateSaveButtonUI();
}

window.updateSaveButtonUI = function() {
    const btn = document.getElementById('saveBtn');
    if (isEditMode) {
        btn.classList.replace('btn-success', 'btn-warning');
        btn.innerHTML = '<i class="fas fa-sync-alt me-1"></i> อัปเดตข้อมูลสินค้า';
    } else {
        btn.classList.replace('btn-warning', 'btn-success');
        btn.innerHTML = '<i class="fas fa-save me-1"></i> บันทึกเข้าระบบร้านค้า';
    }
}

window.logoutApp = function() {
    Swal.fire({ title: 'ออกจากระบบ?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' })
    .then((result) => { if (result.isConfirmed) window.location.href = 'index.html'; });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pSku').value = window.generateSKU();
    window.loadDynamicCategories(); 
    window.loadProducts(); 
});
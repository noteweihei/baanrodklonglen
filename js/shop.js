// ==========================================
// 🛒 Module: Shop System (ระบบหน้าร้านค้า & ตะกร้าสินค้า)
// ==========================================

let shopCart = JSON.parse(localStorage.getItem('shopCart')) || [];
let allShopProducts = [];
let filteredShopProducts = [];
let currentShopPage = 1;
let currentShopFilter = 'instock'; 
const ITEMS_PER_PAGE = 10;

function saveCart() {
    localStorage.setItem('shopCart', JSON.stringify(shopCart));
    if(typeof updateNav === 'function') updateNav(); 
}

// 🏷️ 1. กรองและสุ่มสินค้าตามหมวดหมู่
window.applyShopFilter = function(filter, reRender = true) {
    currentShopFilter = filter;
    currentShopPage = 1;
    
    if (filter === 'instock') {
        // กรองเฉพาะที่มีสต็อก และสุ่ม (Random) สลับตำแหน่ง
        filteredShopProducts = allShopProducts.filter(p => parseInt(p.stock) > 0).sort(() => Math.random() - 0.5);
    } else if (filter === 'outstock') {
        filteredShopProducts = allShopProducts.filter(p => parseInt(p.stock) <= 0);
    } else {
        filteredShopProducts = [...allShopProducts];
    }
    
    if(reRender) renderShopPage();
}

// 🔢 2. เปลี่ยนเลขหน้า
window.changeShopPage = function(page) {
    currentShopPage = page;
    renderShopPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 🛍️ 3. เรนเดอร์หน้าร้านค้า
window.renderShopPage = async function() {
    const container = document.getElementById('app-content');
    
    // หากยังไม่มีข้อมูล ให้โหลดจาก API ก่อน
    if (allShopProducts.length === 0) {
        container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border text-success" style="width: 3rem; height: 3rem;"></div><p class="mt-2">กำลังเปิดร้านค้า...</p></div>';
        const res = await API.shopGet('getProducts');
        if (res.status === 'success') {
            allShopProducts = res.data;
            applyShopFilter('instock', false); // ตั้งค่าเริ่มต้นเป็นสินค้าที่มีสต็อก
        } else {
            return container.innerHTML = '<div class="alert alert-danger text-center">โหลดข้อมูลล้มเหลว</div>';
        }
    }
    
    // คำนวณระบบแบ่งหน้า (Pagination)
    const totalItems = filteredShopProducts.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    if(currentShopPage > totalPages) currentShopPage = totalPages;
    
    const startIndex = (currentShopPage - 1) * ITEMS_PER_PAGE;
    const currentItems = filteredShopProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="fw-bold text-success"><i class="fas fa-store me-2"></i> เลือกซื้อรถของเล่น</h2>
        </div>
        
        <!-- แท็บหมวดหมู่สินค้า -->
        <div class="d-flex gap-2 mb-4 overflow-auto pb-2" style="white-space: nowrap;">
            <button class="btn btn-${currentShopFilter === 'instock' ? 'success' : 'outline-success'} rounded-pill fw-bold px-4 shadow-sm" onclick="applyShopFilter('instock')">✨ มีสินค้า (สุ่มโชว์)</button>
            <button class="btn btn-${currentShopFilter === 'all' ? 'primary' : 'outline-primary'} rounded-pill fw-bold px-4 shadow-sm" onclick="applyShopFilter('all')">📦 สินค้าทั้งหมด</button>
            <button class="btn btn-${currentShopFilter === 'outstock' ? 'danger' : 'outline-danger'} rounded-pill fw-bold px-4 shadow-sm" onclick="applyShopFilter('outstock')">❌ สินค้าหมด</button>
        </div>

        <div class="row">
    `;
    
    if (currentItems.length > 0) {
        currentItems.forEach(p => {
            let stock = parseInt(p.stock) || 0;
            let imgUrl = p.image && p.image.trim() !== '' ? p.image : 'https://placehold.co/400x400/eeeeee/31343C?text=No+Image';
            let inCart = shopCart.find(i => i.id === p.id);
            let qtyInCart = inCart ? inCart.qty : 0;
            let remainStock = stock - qtyInCart;
            let disableBtn = remainStock <= 0;

            html += `
            <div class="col-6 col-md-4 mb-4">
                <div class="card product-card h-100 shadow-sm border-0 ${disableBtn ? 'opacity-75' : ''}" style="border-radius: 20px; overflow: hidden;">
                    <div class="position-absolute top-0 start-0 m-2" style="z-index: 5;">
                        <span class="badge bg-dark rounded-pill" style="font-size: 0.6rem;">${p.sku}</span>
                    </div>
                    <img src="${imgUrl}" class="card-img-top" style="height:180px; object-fit:cover; cursor:zoom-in;" onclick="showImageModal(this.src)">
                    <div class="card-body p-3 d-flex flex-column">
                        <span class="badge bg-info text-dark mb-1 align-self-start" style="font-size: 0.7rem;">${p.category}</span>
                        <h6 class="fw-bold text-dark mb-2 text-truncate">${p.name}</h6>
                        
                        <div class="text-center mt-auto mb-3">
                            <h4 class="text-success fw-bold mb-0">฿${p.retail_price}</h4>
                            <small class="text-muted">${disableBtn ? (stock <= 0 ? '❌ สินค้าหมด' : 'จำนวนเต็มโควตา') : `✅ สต็อก: ${stock} (สั่งได้อีก ${remainStock})`}</small>
                        </div>
                        
                        <button class="btn btn-${disableBtn ? 'secondary' : 'success'} w-100 py-2 fw-bold rounded-pill shadow-sm" 
                            onclick="addToCart('${p.id}', '${p.sku}', '${p.name.replace(/'/g, "\\'")}', ${p.retail_price}, ${stock}, '${imgUrl}')" ${disableBtn ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus me-1"></i> ${disableBtn ? 'สินค้าหมด' : 'หยิบใส่ตะกร้า'}
                        </button>
                    </div>
                </div>
            </div>`;
        });
    } else {
        html += `<div class="col-12 text-center text-muted py-5">ไม่พบสินค้าในหมวดหมู่นี้</div>`;
    }
    html += `</div>`; // ปิด row

    // แสดงปุ่มเลขหน้า
    if (totalPages > 1) {
        html += `<div class="d-flex justify-content-center mt-3 mb-5">
            <nav><ul class="pagination pagination-md shadow-sm">
                <li class="page-item ${currentShopPage === 1 ? 'disabled' : ''}"><a class="page-link" style="cursor:pointer;" onclick="changeShopPage(${currentShopPage - 1})">ก่อนหน้า</a></li>`;
        
        for(let i=1; i<=totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentShopPage - 1 && i <= currentShopPage + 1)) {
                html += `<li class="page-item ${currentShopPage === i ? 'active' : ''}"><a class="page-link" style="cursor:pointer;" onclick="changeShopPage(${i})">${i}</a></li>`;
            } else if (i === currentShopPage - 2 || i === currentShopPage + 2) {
                html += `<li class="page-item disabled"><span class="page-link border-0">...</span></li>`;
            }
        }
        
        html += `<li class="page-item ${currentShopPage === totalPages ? 'disabled' : ''}"><a class="page-link" style="cursor:pointer;" onclick="changeShopPage(${currentShopPage + 1})">ถัดไป</a></li>
            </ul></nav>
        </div>`;
    }
    container.innerHTML = html;
}

// 🛒 4. เพิ่มลงตะกร้า 
window.addToCart = function(id, sku, name, price, maxStock, img) {
    let item = shopCart.find(i => i.id === id); 
    if (item) {
        if (item.qty + 1 > maxStock) return Swal.fire('เตือน', 'สั่งเกินจำนวนสต็อกที่มีไม่ได้ครับ', 'warning');
        item.qty++;
    } else {
        if (maxStock < 1) return Swal.fire('เตือน', 'สินค้าหมด', 'warning');
        shopCart.push({ id, sku, name, price, qty: 1, maxStock, img });
    }
    saveCart();
    Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 1500}).fire({icon: 'success', title: 'เพิ่มลงตะกร้าแล้ว'});
    renderShopPage(); 
}

// 📦 5. แสดงหน้าตะกร้าสินค้า (แก้ไขให้อ่านรูปภาพได้ทั้งแบบ img และ image)
window.renderCartPage = function() {
    if(!currentUser) return openAuth('login');
    const container = document.getElementById('app-content');
    
    if(shopCart.length === 0) {
        container.innerHTML = `<div class="text-center py-5 mt-5"><i class="fas fa-shopping-cart fa-4x text-muted mb-3"></i><h4 class="text-muted">ตะกร้าของคุณยังว่างเปล่า</h4><button class="btn btn-success rounded-pill mt-3 px-4 fw-bold shadow-sm" onclick="showPage('shop')">ไปช้อปปิ้งกันเลย</button></div>`;
        return;
    }

    let total = 0;
    let html = `<h3 class="fw-bold mb-4 text-success"><i class="fas fa-shopping-cart me-2"></i> ตะกร้าสินค้าของคุณ</h3><div class="row"><div class="col-lg-8">`;
    
    shopCart.forEach((item, index) => {
        let subtotal = item.price * item.qty;
        total += subtotal;
        
        // 💡 ตรวจสอบคีย์รูปภาพให้อ่านได้ทั้ง 'img' และ 'image' ป้องกันบั๊กภาพไม่ขึ้น
        let itemImage = item.img || item.image || 'https://placehold.co/400x400/eeeeee/31343C?text=No+Image';

        html += `
        <div class="card shadow-sm border-0 rounded-4 mb-3">
            <div class="card-body p-3 d-flex align-items-center flex-wrap">
                <img src="${itemImage}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 10px;" class="me-3 mb-2 mb-md-0 shadow-sm border">
                <div class="flex-grow-1 me-3 mb-2 mb-md-0">
                    <h6 class="fw-bold mb-1">${item.name} <small class="text-muted">(${item.sku})</small></h6>
                    <div class="text-success fw-bold">฿${item.price}</div>
                </div>
                <div class="d-flex align-items-center me-3 mb-2 mb-md-0 bg-light rounded-pill p-1 border">
                    <button class="btn btn-sm btn-white rounded-circle fw-bold text-danger" style="width: 30px; height: 30px;" onclick="updateCartQty(${index}, -1)">-</button>
                    <span class="fw-bold mx-2" style="width: 25px; text-align: center;">${item.qty}</span>
                    <button class="btn btn-sm btn-white rounded-circle fw-bold text-success" style="width: 30px; height: 30px;" onclick="updateCartQty(${index}, 1)">+</button>
                </div>
                <button class="btn btn-danger btn-sm rounded-circle shadow-sm" style="width: 35px; height: 35px;" onclick="updateCartQty(${index}, 'delete')" title="ลบออกจากตะกร้า"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    });

    let isFreeShip = total >= 300;

    html += `</div><div class="col-lg-4">
        <div class="card shadow-sm border-0 rounded-4 sticky-top" style="top: 80px;">
            <div class="card-body p-4">
                <h5 class="fw-bold border-bottom pb-3 mb-3">สรุปยอดคำสั่งซื้อ</h5>
                <div class="d-flex justify-content-between mb-2"><span class="text-muted">ยอดรวมสินค้า:</span><span class="fw-bold text-dark fs-5">฿${total.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                
                ${isFreeShip ? 
                    '<div class="alert alert-success py-2 px-2 mb-3 text-center small fw-bold"><i class="fas fa-gift me-1"></i> ยินดีด้วย! คุณสั่งครบ 300 ได้รับสิทธิ์จัดส่งฟรี!</div>' : 
                    '<div class="alert alert-secondary py-2 px-2 mb-3 text-center small"><i class="fas fa-info-circle me-1"></i> สั่งครบ 300.- จัดส่งฟรี!</div>'
                }
                
                <button class="btn btn-success w-100 fw-bold py-3 rounded-pill shadow-sm mb-2" onclick="openCheckoutModal(${total})">💳 เลือกวิธีจัดส่ง & ชำระเงิน</button>
                <button class="btn btn-light w-100 fw-bold py-2 rounded-pill text-muted" onclick="showPage('shop')">เลือกซื้อสินค้าเพิ่ม</button>
            </div>
        </div>
    </div></div>`;
    
    container.innerHTML = html;
}

window.updateCartQty = function(index, change) {
    if(change === 'delete') { shopCart.splice(index, 1); } 
    else {
        let item = shopCart[index];
        let newQty = item.qty + change;
        if(newQty > 0 && newQty <= item.maxStock) item.qty = newQty;
    }
    saveCart(); renderCartPage();
}

// เพิ่ม Array รหัสไปรษณีย์พื้นที่ห่างไกล (อ้างอิงข้อมูลจากระบบขนส่ง)
const remoteZoneZips = ["20120","23170","50120","50130","50140","50150","50160","50170","50180","50190","50210","50220","50240","50250","50260","50270","50310","50350","51160","52160","55220","56160","57160","57170","57340","58130","58150","63150","67170","71180","71240","73180","81150","81210","82150","82160","84110","84160","84280","84360","91000","91110","91120","94000","94110","94120","94130","94140","94150","94160","94170","94180","94190","94220","94230","95000","95110","95120","95130","95140","95150","95160","95170","96000","96110","96120","96130","96140","96150","96160","96170","96180","96190","96210","96220"];

// 🚚 6. เปิดหน้าต่างเลือกรูปแบบจัดส่งและเก็บเงิน (เวอร์ชันรวมสมบูรณ์ที่สุด)
window.openCheckoutModal = function(total) {
    let isFreeShip = total >= 300;
    let baseShipping = isFreeShip ? 0 : 40; 
    let userZip = currentUser && currentUser.zipcode ? String(currentUser.zipcode).trim() : '';
    let isAutoRemote = (typeof remoteZipCodes !== 'undefined' && remoteZipCodes.includes(userZip)) || remoteZoneZips.includes(userZip);
    let initialRemoteFee = isAutoRemote ? 20 : 0;
    
    let initialTotal = total + baseShipping + initialRemoteFee;

    // ข้อมูลบัญชีธนาคารของร้าน
    const bankInfo = {
        qrCode: "https://promptpay.io/0647188878.png", 
        bankName: "กสิกรไทย (KBank)",
        accNumber: "504-2-12100-4",
        accName: "เมธาสิทธิ์ บุญถนอม"
    };

    Swal.fire({
        title: '📦 ยืนยันการสั่งซื้อ',
        width: '500px',
        html: `
            <div class="text-start mt-2">
                <div class="alert alert-success border border-success text-center shadow-sm mb-3">
                    <h5 class="mb-0 fw-bold">ยอดรวมที่ต้องชำระ: <strong id="finalTotalDisplay" class="text-dark">฿${initialTotal.toLocaleString('en-US')}</strong></h5>
                </div>
                
                <label class="fw-bold text-primary mb-2">1. วิธีชำระเงิน:</label>
                
                <!-- ช้อยส์ที่ 1: โอนเงิน -->
                <div class="form-check border rounded p-2 mb-2 shadow-sm" id="boxTransfer" style="background-color: #f8f9fa; transition: 0.3s;">
                    <input class="form-check-input ms-1" type="radio" name="payMethod" id="payTransfer" value="transfer" checked onchange="togglePaymentUI(${total}, ${isFreeShip})">
                    <label class="form-check-label ms-2 fw-bold" for="payTransfer">โอนเงินชำระเลย ${isFreeShip ? '<span class="badge bg-success ms-1">ส่งฟรี</span>' : '<span class="text-muted fw-normal">(ค่าส่ง ฿40)</span>'}</label>
                    
                    <div id="transferDetailsBox" class="mt-3 text-center" style="display: block;">
                        <img src="${bankInfo.qrCode}" width="120" class="mb-2 border rounded p-1 bg-white"><br>
                        <span class="badge bg-success mb-1">${bankInfo.bankName}</span><br>
                        <span class="fw-bold fs-5 text-dark">${bankInfo.accNumber}</span>
                        <button class="btn btn-sm btn-outline-secondary ms-2 rounded-pill py-0 px-2" onclick="navigator.clipboard.writeText('${bankInfo.accNumber}'); Swal.fire({toast:true, position:'top-end', icon:'success', title:'คัดลอกเลขบัญชีแล้ว', showConfirmButton:false, timer:1500})"><i class="fas fa-copy"></i> Copy</button><br>
                        <small class="text-muted">ชื่อบัญชี: ${bankInfo.accName}</small>
                        <hr>
                        <div class="text-start">
                            <label class="fw-bold small text-danger">* กรุณาแนบสลิปโอนเงิน:</label>
                            <input type="file" id="slipUpload" class="form-control form-control-sm border-danger mb-2" accept="image/*">
                            <label class="fw-bold small text-dark">เวลาที่โอน (ตามสลิป):</label>
                            <input type="time" id="transferTime" class="form-control form-control-sm">
                        </div>
                    </div>
                </div>

                <!-- ช้อยส์ที่ 2: เก็บเงินปลายทาง -->
                <div class="form-check border rounded p-2 mb-3 shadow-sm" id="boxCOD" style="background-color: #ffffff; transition: 0.3s;">
                    <input class="form-check-input ms-1" type="radio" name="payMethod" id="payCOD" value="cod" onchange="togglePaymentUI(${total}, ${isFreeShip})">
                    <label class="form-check-label ms-2 fw-bold" for="payCOD">เก็บเงินปลายทาง <span class="text-danger fw-bold">(ค่าบริการ ฿50)</span></label>
                </div>

                <label class="fw-bold text-danger mb-2">2. พื้นที่ห่างไกล / เกาะ:</label>
                <div class="form-check border border-danger rounded p-2 bg-danger bg-opacity-10 shadow-sm">
                    <input class="form-check-input ms-1" type="checkbox" id="remoteArea" onchange="updateCheckoutTotal(${total}, ${isFreeShip})" ${isAutoRemote ? 'checked disabled' : ''}>
                    <label class="form-check-label text-danger fw-bold ms-2" for="remoteArea">จัดส่งพื้นที่ห่างไกล <span class="text-dark">+฿20</span></label>
                </div>
            </div>
        `,
        showCancelButton: true, confirmButtonText: 'ยืนยันสั่งซื้อ', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#10b981',
        preConfirm: async () => {
            const method = document.querySelector('input[name="payMethod"]:checked').value;
            const isRemote = document.getElementById('remoteArea').checked;
            let slipBase64 = null;
            let transferTime = '';

            // บังคับแนบสลิปเฉพาะตอนโอนเงิน
            if (method === 'transfer') {
                const slipFile = document.getElementById('slipUpload').files[0];
                transferTime = document.getElementById('transferTime').value;
                if (!slipFile) { Swal.showValidationMessage('กรุณาแนบรูปสลิปโอนเงินด้วยค่ะ'); return false; }
                if (!transferTime) { Swal.showValidationMessage('กรุณาระบุเวลาที่โอนเงินด้วยค่ะ'); return false; }
                
                slipBase64 = await window.compressImage(slipFile, 800); 
                slipBase64 = slipBase64.split(',')[1]; 
            }
            return { method, isRemote, slipBase64, transferTime };
        }
    }).then((result) => {
        if(result.isConfirmed) checkoutShop(total, result.value.method, result.value.isRemote, result.value.slipBase64, result.value.transferTime);
    });
}

// 🔄 7. ฟังก์ชันสลับการซ่อน/โชว์ UI
window.togglePaymentUI = function(total, isFreeShip) {
    const method = document.querySelector('input[name="payMethod"]:checked').value;
    const transferDetails = document.getElementById('transferDetailsBox');
    const boxTransfer = document.getElementById('boxTransfer');
    const boxCOD = document.getElementById('boxCOD');

    if (method === 'transfer') {
        transferDetails.style.display = 'block';
        boxTransfer.style.backgroundColor = '#f8f9fa';
        boxCOD.style.backgroundColor = '#ffffff';
    } else {
        transferDetails.style.display = 'none';
        boxTransfer.style.backgroundColor = '#ffffff';
        boxCOD.style.backgroundColor = '#f8f9fa';
    }
    
    updateCheckoutTotal(total, isFreeShip);
}

// 🧮 8. ฟังก์ชันคำนวณยอดเงินรวม (กฎที่ถูกต้อง)
window.updateCheckoutTotal = function(total, isFreeShip) {
    const method = document.querySelector('input[name="payMethod"]:checked').value;
    const isRemote = document.getElementById('remoteArea').checked;
    
    let shippingFee = 0;
    
    // กฎการคำนวณ:
    // โอนเงิน: ยอดไม่ถึง 300 คิด 40 | ครบ 300 ส่งฟรี
    // ปลายทาง: ยอดเท่าไหร่ก็เหมา 50 บาท
    if (method === 'transfer') {
        shippingFee = isFreeShip ? 0 : 40;
    } else if (method === 'cod') {
        shippingFee = 50; 
    }
    
    let remoteFee = isRemote ? 20 : 0; // ห่างไกล +20 เสมอ
    let finalTotal = total + shippingFee + remoteFee;
    
    document.getElementById('finalTotalDisplay').innerText = '฿' + finalTotal.toLocaleString('en-US');
}

// 🛡️ 9. ส่งข้อมูลคำสั่งซื้อไปหลังบ้านอย่างปลอดภัย
window.checkoutShop = async function(total, payMethod, isRemote, slipBase64, transferTime) {
    Swal.fire({title: 'กำลังทำรายการ...', html: 'กรุณารอสักครู่ ระบบกำลังบันทึกคำสั่งซื้อและรูปสลิป...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});

    // ส่งไปเฉพาะสิ่งที่จำเป็น ให้ฝั่ง Google Sheet คำนวณเงินเองเพื่อกัน Hacker
    const payload = {
        action: 'checkoutShop', phone: currentUser.phone, name: currentUser.name || currentUser.fname,
        payMethod: payMethod, isRemote: isRemote, slipBase64: slipBase64, transferTime: transferTime,
        items: shopCart.map(i => ({id: i.id, sku: i.sku, qty: i.qty})) 
    };

    const res = await API.shopPost(payload);
    
    if(res.status === 'success') {
        shopCart = []; saveCart(); 
        
        // ถ้าเป็นการเก็บปลายทาง จะไม่มีเวลาโอน ให้แจ้งแค่ชื่อรูปแบบ
        let methodText = payMethod === 'transfer' ? "โอนเงินชำระเลย" : "เก็บเงินปลายทาง (COD)";
        
        let text = `🛒 แจ้งสั่งซื้อสินค้า (รหัสบิล: ${res.orderId})\nเบอร์: ${currentUser.phone}\nชื่อ: ${currentUser.name}\n\nรายการสินค้า:\n`;
        res.receiptItems?.forEach(i => text += `- ${i.name} (x${i.qty}) = ฿${i.subtotal}\n`);
        
        text += `\n💰 ยอดสินค้า: ฿${res.productTotal}\n📦 ค่าจัดส่ง: ฿${res.shippingTotal} (${methodText}${isRemote? ' +ห่างไกล':''})\n\n🔥 ยอดรวมที่ต้องชำระ: ฿${res.finalTotal}\n\nระบบบันทึกออเดอร์ให้เรียบร้อยแล้ว แอดมินจะรีบตรวจสอบให้เร็วที่สุดค่ะ 🙏`;

        navigator.clipboard.writeText(text).then(() => {
            Swal.fire({
                title: 'สั่งซื้อสำเร็จ!', 
                text: 'บันทึกออเดอร์เรียบร้อย สามารถเช็คสถานะได้ในหน้าบัญชี', 
                icon: 'success',
                confirmButtonText: 'ไปหน้าบัญชี'
            }).then(() => {
                showPage('dashboard');
            });
        });
    } else {
        Swal.fire('ขออภัย', res.message, 'error'); 
        allShopProducts = []; // บังคับให้โหลดข้อมูลสต็อกใหม่
        renderCartPage(); 
    }
}
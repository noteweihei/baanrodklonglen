// ==========================================
// 🛒 Module: Shop System (อัปเกรด: Modal Pop-up & ระบบตัวเลือกสินค้า)
// ==========================================

let shopCart = JSON.parse(localStorage.getItem('shopCart')) || [];
let allShopProducts = [];
let filteredShopProducts = [];
let currentShopPage = 1;
const ITEMS_PER_PAGE = 12;

let currentStockStatus = 'instock'; 
let currentCategory = 'all';
let currentPriceRange = 'all';

function saveCart() {
    localStorage.setItem('shopCart', JSON.stringify(shopCart));
    if(typeof updateNav === 'function') updateNav(); 
}

// 🎯 1. ฟังก์ชันตัวกรอง
window.applyAdvancedFilter = function() {
    currentShopPage = 1;
    filteredShopProducts = allShopProducts.filter(p => {
        const stock = parseInt(p.stock) || 0;
        let matchStock = true;
        if (currentStockStatus === 'instock') matchStock = stock > 0;
        else if (currentStockStatus === 'outstock') matchStock = stock <= 0;

        let matchCat = true;
        if (currentCategory !== 'all') matchCat = p.category === currentCategory;

        const price = parseFloat(p.retail_price) || 0;
        let matchPrice = true;
        if (currentPriceRange === 'under100') matchPrice = price < 100;
        else if (currentPriceRange === '100-300') matchPrice = price >= 100 && price <= 300;
        else if (currentPriceRange === 'over300') matchPrice = price > 300;

        return matchStock && matchCat && matchPrice;
    });

    if (currentStockStatus === 'instock') filteredShopProducts.sort(() => Math.random() - 0.5);
    renderShopPage();
}

window.setStockStatus = function(status) { currentStockStatus = status; applyAdvancedFilter(); }
window.setCategory = function(cat) { currentCategory = cat; applyAdvancedFilter(); }
window.setPriceRange = function(range) { currentPriceRange = range; applyAdvancedFilter(); }
window.changeShopPage = function(page) { currentShopPage = page; renderShopPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

// 🛍️ 2. เรนเดอร์หน้าร้านค้า
window.renderShopPage = async function() {
    const container = document.getElementById('app-content');
    
    if (allShopProducts.length === 0) {
        container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border text-success" style="width: 3rem; height: 3rem;"></div><p class="mt-2">กำลังเปิดร้านค้า...</p></div>';
        
        const setRes = await API.get('getSettings');
        if (setRes.status === 'success' && setRes.data.categories) {
            window.shopGlobalCategories = setRes.data.categories.split(",").map(c => c.trim()).filter(c => c);
        } else {
            window.shopGlobalCategories = [];
        }

        const res = await API.shopGet('getProducts');
        if (res.status === 'success') {
            allShopProducts = res.data;
            filteredShopProducts = allShopProducts.filter(p => parseInt(p.stock) > 0);
        } else {
            return container.innerHTML = '<div class="alert alert-danger text-center">โหลดข้อมูลล้มเหลว</div>';
        }
    }
    
    const existingCats = allShopProducts.map(p => p.category).filter(c => c);
    const combinedCats = [...new Set([...(window.shopGlobalCategories || []), ...existingCats])];
    const categories = ['all', ...combinedCats];

    const totalItems = filteredShopProducts.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentShopPage - 1) * ITEMS_PER_PAGE;
    const currentItems = filteredShopProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    let html = `
        <div class="row align-items-center mb-4">
            <div class="col-md-6"><h2 class="fw-bold text-success mb-0"><i class="fas fa-store me-2"></i> เลือกซื้อสินค้า</h2></div>
            <div class="col-md-6 text-md-end mt-2 mt-md-0"><span class="badge bg-light text-dark border p-2">พบทั้งหมด ${totalItems} รายการ</span></div>
        </div>
        
        <div class="card shadow-sm border-0 rounded-4 mb-4 overflow-hidden">
            <div class="card-body bg-white p-3 p-md-4">
                <div class="row g-3">
                    <div class="col-12 col-md-4">
                        <label class="small fw-bold text-muted mb-2"><i class="fas fa-check-circle me-1"></i> สถานะสต็อก</label>
                        <select class="form-select border-0 bg-light rounded-pill px-3" onchange="setStockStatus(this.value)">
                            <option value="instock" ${currentStockStatus==='instock'?'selected':''}>✨ มีสินค้า (สุ่มโชว์)</option>
                            <option value="all" ${currentStockStatus==='all'?'selected':''}>📦 สินค้าทั้งหมด</option>
                            <option value="outstock" ${currentStockStatus==='outstock'?'selected':''}>❌ สินค้าหมด</option>
                        </select>
                    </div>
                    <div class="col-12 col-md-4">
                        <label class="small fw-bold text-muted mb-2"><i class="fas fa-tags me-1"></i> หมวดหมู่</label>
                        <select class="form-select border-0 bg-light rounded-pill px-3" onchange="setCategory(this.value)">
                            ${categories.map(c => `<option value="${c}" ${currentCategory===c?'selected':''}>${c === 'all' ? 'ทุกหมวดหมู่' : c}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-12 col-md-4">
                        <label class="small fw-bold text-muted mb-2"><i class="fas fa-coins me-1"></i> ช่วงราคา</label>
                        <select class="form-select border-0 bg-light rounded-pill px-3" onchange="setPriceRange(this.value)">
                            <option value="all" ${currentPriceRange==='all'?'selected':''}>ทุกช่วงราคา</option>
                            <option value="under100" ${currentPriceRange==='under100'?'selected':''}>ต่ำกว่า 100 บาท</option>
                            <option value="100-300" ${currentPriceRange==='100-300'?'selected':''}>100 - 300 บาท</option>
                            <option value="over300" ${currentPriceRange==='over300'?'selected':''}>300 บาทขึ้นไป</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        <div class="row g-3 g-md-4">
    `;
    
    if (currentItems.length > 0) {
        currentItems.forEach(p => {
            let stock = parseInt(p.stock) || 0;
            let imgUrl = p.image && p.image.trim() !== '' ? p.image : 'https://placehold.co/400x400/eeeeee/31343C?text=No+Image';
            
            // 💡 เช็คว่าสินค้ามีตัวเลือกไหม
            let hasVariants = p.variants && p.variants.trim() !== "";
            let btnClass = hasVariants ? 'primary' : 'success';
            let btnIcon = hasVariants ? 'fa-list' : 'fa-search';
            let btnText = hasVariants ? 'เลือกแบบสินค้า' : 'ดูรายละเอียด';
            
            // เช็คสต็อก (นับรวมทุกตัวเลือกว่าหยิบไปเท่าไหร่แล้ว)
            let currentTotalQty = shopCart.filter(i => i.id === p.id).reduce((sum, i) => sum + i.qty, 0);
            let remainStock = stock - currentTotalQty;
            let disableBtn = remainStock <= 0;

            // 💡 ปรับให้คลิกที่รูปภาพ หรือ ปุ่ม ก็จะเปิด Pop-up เหมือนกันทั้งหมด เพื่อความพรีเมียม
            html += `
            <div class="col-6 col-md-4 col-lg-3 mb-2">
                <div class="card product-card h-100 shadow-sm border-0 ${disableBtn ? 'opacity-75' : ''}" style="border-radius: 20px; overflow: hidden; transition: transform 0.2s;">
                    <div class="position-absolute top-0 start-0 m-2" style="z-index: 5;">
                        <span class="badge bg-dark rounded-pill" style="font-size: 0.6rem;">${p.sku}</span>
                    </div>
                    <img src="${imgUrl}" class="card-img-top" style="height:160px; object-fit:cover; cursor:pointer;" onclick="openProductDetailModal('${p.id}')" onerror="this.src='https://placehold.co/400x400/eeeeee/31343C?text=Error'">
                    <div class="card-body p-2 p-md-3 d-flex flex-column">
                        <span class="badge bg-info text-dark mb-1 align-self-start" style="font-size: 0.65rem;">${p.category}</span>
                        <h6 class="fw-bold text-dark mb-2 text-truncate small" style="cursor:pointer;" onclick="openProductDetailModal('${p.id}')">${p.name}</h6>
                        <div class="text-center mt-auto mb-2">
                            <h5 class="text-success fw-bold mb-0">฿${p.retail_price}</h5>
                            <small class="text-muted" style="font-size:0.7rem;">${disableBtn ? (stock <= 0 ? '❌ หมด' : 'เต็มโควตา') : `✅ สต็อก: ${stock}`}</small>
                        </div>
                        <button class="btn btn-${disableBtn ? 'secondary' : btnClass} w-100 py-2 fw-bold rounded-pill shadow-sm btn-sm" 
                            onclick="openProductDetailModal('${p.id}')" ${disableBtn && stock <= 0 ? 'disabled' : ''}>
                            <i class="fas ${btnIcon} me-1"></i> ${disableBtn && stock <= 0 ? 'หมด' : btnText}
                        </button>
                    </div>
                </div>
            </div>`;
        });
    } else {
        html += `<div class="col-12 text-center text-muted py-5"><i class="fas fa-search fa-3x mb-3 opacity-25"></i><br>ไม่พบสินค้าที่ตรงตามเงื่อนไขการค้นหา</div>`;
    }
    html += `</div>`; 

    if (totalPages > 1) {
        html += `<div class="d-flex justify-content-center mt-4 mb-5">
            <nav><ul class="pagination pagination-sm shadow-sm">
                <li class="page-item ${currentShopPage === 1 ? 'disabled' : ''}"><a class="page-link px-3 py-2" style="cursor:pointer;" onclick="changeShopPage(${currentShopPage - 1})">ย้อนกลับ</a></li>`;
        for(let i=1; i<=totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentShopPage - 1 && i <= currentShopPage + 1)) {
                html += `<li class="page-item ${currentShopPage === i ? 'active' : ''}"><a class="page-link px-3 py-2" style="cursor:pointer;" onclick="changeShopPage(${i})">${i}</a></li>`;
            } else if (i === currentShopPage - 2 || i === currentShopPage + 2) {
                html += `<li class="page-item disabled"><span class="page-link border-0">...</span></li>`;
            }
        }
        html += `<li class="page-item ${currentShopPage === totalPages ? 'disabled' : ''}"><a class="page-link px-3 py-2" style="cursor:pointer;" onclick="changeShopPage(${currentShopPage + 1})">ถัดไป</a></li>
            </ul></nav>
        </div>`;
    }
    container.innerHTML = html;
}

// 🌟 3. พระเอกของเรา: ฟังก์ชัน Modal Pop-up แสดงรายละเอียดสินค้าและตัวเลือก
window.openProductDetailModal = function(id) {
    let p = allShopProducts.find(x => x.id === id);
    if(!p) return;
    
    let imgUrl = p.image && p.image.trim() !== '' ? p.image : 'https://placehold.co/400x400/eeeeee/31343C?text=No+Image';
    let stock = parseInt(p.stock) || 0;
    
    // เช็คว่าเคยหยิบลงตะกร้าไปแล้วกี่ชิ้น (รวมทุกสี)
    let currentTotalQty = shopCart.filter(i => i.id === p.id).reduce((sum, i) => sum + i.qty, 0);
    let remainStock = stock - currentTotalQty;
    
    let hasVariants = p.variants && p.variants.trim() !== "";
    let variantHtml = '';
    
    if(hasVariants) {
        let vList = p.variants.split(',').map(v => v.trim()).filter(v => v);
        variantHtml = `
            <div class="mb-3 text-start">
                <label class="fw-bold text-dark mb-2"><i class="fas fa-layer-group text-warning me-1"></i> รูปแบบ/ตัวเลือก:</label>
                <select id="swal-variant" class="form-select border-primary shadow-sm fw-bold text-primary">
                    <option value="">-- กรุณาเลือก --</option>
                    ${vList.map(v => `<option value="${v}">${v}</option>`).join('')}
                </select>
            </div>`;
    }

    Swal.fire({
        html: `
            <div class="container-fluid text-start px-0 mt-2">
                <div class="row">
                    <div class="col-12 col-md-5 text-center mb-3 mb-md-0">
                        <img src="${imgUrl}" class="img-fluid rounded-4 shadow-sm border" style="max-height: 280px; object-fit: contain; width: 100%;">
                    </div>
                    <div class="col-12 col-md-7 d-flex flex-column">
                        <span class="badge bg-info text-dark align-self-start mb-2">${p.category}</span>
                        <h4 class="fw-bold text-dark mb-1">${p.name}</h4>
                        <p class="text-muted small mb-3">รหัส: ${p.sku}</p>
                        <h3 class="text-success fw-bold mb-3">฿${p.retail_price}</h3>
                        
                        <div class="bg-light p-3 rounded-4 mb-3 small text-muted" style="max-height: 120px; overflow-y: auto; line-height: 1.6;">
                            ${p.desc ? p.desc.replace(/\n/g, '<br>') : 'ไม่มีรายละเอียดสินค้า'}
                        </div>
                        
                        ${variantHtml}

                        <div class="mb-2 text-start">
                            <label class="fw-bold text-dark mb-2">ระบุจำนวน:</label>
                            <div class="d-flex align-items-center">
                                <button class="btn btn-outline-secondary rounded-circle fw-bold shadow-sm" style="width:38px;height:38px;" onclick="document.getElementById('swal-qty').stepDown()">-</button>
                                <input type="number" id="swal-qty" class="form-control text-center mx-2 fw-bold shadow-sm border-secondary" style="width: 80px;" value="1" min="1" max="${remainStock}" readonly>
                                <button class="btn btn-outline-secondary rounded-circle fw-bold shadow-sm" style="width:38px;height:38px;" onclick="document.getElementById('swal-qty').stepUp()">+</button>
                            </div>
                            <small class="text-muted mt-2 d-block">📦 มีสินค้าพร้อมสั่งได้อีก <strong class="text-dark">${remainStock}</strong> ชิ้น</small>
                        </div>
                    </div>
                </div>
            </div>
        `,
        width: '750px',
        showCancelButton: true,
        confirmButtonText: remainStock > 0 ? '<i class="fas fa-cart-plus me-1"></i> เพิ่มลงตะกร้า' : 'สินค้าหมดโควตา',
        cancelButtonText: 'ปิดหน้าต่าง',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6c757d',
        focusConfirm: false,
        showConfirmButton: remainStock > 0,
        preConfirm: () => {
            let selectedVar = "";
            if(hasVariants) {
                selectedVar = document.getElementById('swal-variant').value;
                if(!selectedVar) {
                    Swal.showValidationMessage('กรุณาเลือกรูปแบบ/ตัวเลือก ก่อนครับ');
                    return false;
                }
            }
            let qty = parseInt(document.getElementById('swal-qty').value) || 1;
            return { variant: selectedVar, qty: qty };
        }
    }).then((result) => {
        if(result.isConfirmed) {
            addToCart(p.id, p.sku, p.name, p.retail_price, stock, imgUrl, result.value.variant, result.value.qty);
        }
    });
}

// 🛒 4. ระบบเพิ่มลงตะกร้าแบบแยกตัวเลือก
window.addToCart = function(id, sku, name, price, maxStock, img, variant = '', addQty = 1) {
    // 💡 สร้าง ID เฉพาะในตะกร้า (เช่น P123-สีแดง กับ P123-สีดำ ถือว่าเป็นคนละชิ้นในตะกร้า)
    let cartItemId = variant ? `${id}-${variant}` : id;
    
    // หาสินค้าตัวนี้ในตะกร้า (เอาแบบสีตรงกันเป๊ะ)
    let item = shopCart.find(i => i.cartItemId === cartItemId || (!i.cartItemId && i.id === id && !i.variant)); 
    
    // นับจำนวนรวมของสินค้านี้ทุกสีที่อยู่ในตะกร้าแล้ว
    let currentTotalQty = shopCart.filter(i => i.id === id).reduce((sum, i) => sum + i.qty, 0);
    
    if (item) {
        if (currentTotalQty + addQty > maxStock) return Swal.fire('เตือน', 'สั่งเกินจำนวนสต็อกที่มี (รวมทุกตัวเลือก) ไม่ได้ครับ', 'warning');
        item.qty += addQty;
    } else {
        if (currentTotalQty + addQty > maxStock) return Swal.fire('เตือน', 'สั่งเกินจำนวนสต็อกที่มี (รวมทุกตัวเลือก) ไม่ได้ครับ', 'warning');
        shopCart.push({ cartItemId: cartItemId, id: id, sku: sku, name: name, price: price, qty: addQty, maxStock: maxStock, img: img, variant: variant });
    }
    
    saveCart();
    Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 1500}).fire({icon: 'success', title: 'เพิ่มลงตะกร้าแล้ว'});
    renderShopPage(); 
}

// 📦 5. แสดงหน้าตะกร้าสินค้า (เพิ่มป้ายแจ้งสี/ขนาด)
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
        let subtotal = item.price * item.qty; total += subtotal;
        let finalImage = item.img || item.image || 'https://placehold.co/400x400/eeeeee/31343C?text=No+Image';
        
        // 💡 โชว์ป้ายเหลืองบอกสี/ตัวเลือก ในตะกร้า
        let variantBadge = item.variant ? `<span class="badge bg-warning text-dark ms-2 shadow-sm border border-white">${item.variant}</span>` : '';
        
        html += `
        <div class="card shadow-sm border-0 rounded-4 mb-3">
            <div class="card-body p-3 d-flex align-items-center flex-wrap">
                <img src="${finalImage}" onerror="this.src='https://placehold.co/400x400/eeeeee/31343C?text=No+Image'" style="width: 65px; height: 65px; object-fit: cover; border-radius: 10px;" class="me-3 shadow-sm border">
                <div class="flex-grow-1 me-3">
                    <h6 class="fw-bold mb-1">${item.name}${variantBadge}</h6>
                    <div class="text-success fw-bold">฿${item.price}</div>
                </div>
                <div class="d-flex align-items-center me-3 bg-light rounded-pill p-1 border">
                    <button class="btn btn-sm btn-white rounded-circle fw-bold text-danger" style="width: 28px; height: 28px;" onclick="updateCartQty(${index}, -1)">-</button>
                    <span class="fw-bold mx-2" style="min-width: 20px; text-align: center;">${item.qty}</span>
                    <button class="btn btn-sm btn-white rounded-circle fw-bold text-success" style="width: 28px; height: 28px;" onclick="updateCartQty(${index}, 1)">+</button>
                </div>
                <button class="btn btn-danger btn-sm rounded-circle shadow-sm" style="width: 35px; height: 35px;" onclick="updateCartQty(${index}, 'delete')"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    });
    
    let isFreeShip = total >= 300;
    html += `</div><div class="col-lg-4">
        <div class="card shadow-sm border-0 rounded-4 sticky-top" style="top: 80px;">
            <div class="card-body p-4">
                <h5 class="fw-bold border-bottom pb-3 mb-3">สรุปยอดคำสั่งซื้อ</h5>
                <div class="d-flex justify-content-between mb-2"><span class="text-muted">ยอดรวมสินค้า:</span><span class="fw-bold text-dark fs-5">฿${total.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                ${isFreeShip ? '<div class="alert alert-success py-2 px-2 mb-3 text-center small fw-bold">จัดส่งฟรี! 🚚</div>' : '<div class="alert alert-secondary py-2 px-2 mb-3 text-center small">สั่งครบ 300.- ส่งฟรี!</div>'}
                <button class="btn btn-success w-100 fw-bold py-3 rounded-pill shadow-sm mb-2" onclick="openCheckoutModal(${total})">💳 ชำระเงิน</button>
                <button class="btn btn-light w-100 fw-bold py-2 rounded-pill text-muted" onclick="showPage('shop')">ซื้อเพิ่ม</button>
            </div>
        </div>
    </div></div>`;
    container.innerHTML = html;
}

window.updateCartQty = function(index, change) {
    if(change === 'delete') { shopCart.splice(index, 1); } 
    else {
        let item = shopCart[index];
        // 💡 เช็คสต็อกรวมทุกสีว่าเกินโควตาไหม
        let currentTotalQty = shopCart.filter(i => i.id === item.id).reduce((sum, i) => sum + i.qty, 0);
        let newQty = item.qty + change;
        
        if (change > 0 && currentTotalQty + 1 > item.maxStock) {
            return Swal.fire('เตือน', 'สั่งเกินโควตาสต็อกรวมของสินค้านี้แล้วค่ะ', 'warning');
        }
        if(newQty > 0 && newQty <= item.maxStock) item.qty = newQty;
    }
    saveCart(); renderCartPage();
}

const remoteZoneZips = ["20120","23170","50120","50130","50140","50150","50160","50170","50180","50190","50210","50220","50240","50250","50260","50270","50310","50350","51160","52160","55220","56160","57160","57170","57340","58130","58150","63150","67170","71180","71240","73180","81150","81210","82150","82160","84110","84160","84280","84360","91000","91110","91120","94000","94110","94120","94130","94140","94150","94160","94170","94180","94190","94220","94230","95000","95110","95120","95130","95140","95150","95160","95170","96000","96110","96120","96130","96140","96150","96160","96170","96180","96190","96210","96220"];

window.openCheckoutModal = function(total) {
    let isFreeShip = total >= 300; let baseShipping = isFreeShip ? 0 : 40; 
    let userZip = currentUser && currentUser.zipcode ? String(currentUser.zipcode).trim() : '';
    let isAutoRemote = remoteZoneZips.includes(userZip);
    let initialRemoteFee = isAutoRemote ? 20 : 0;
    let initialTotal = total + baseShipping + initialRemoteFee;
    const bankInfo = { qrCode: "https://promptpay.io/0647188878.png", bankName: "กสิกรไทย", accNumber: "504-2-12100-4", accName: "เมธาสิทธิ์ บุญถนอม" };

    Swal.fire({
        title: '📦 ยืนยันการสั่งซื้อ',
        width: '500px',
        html: `
            <div class="text-start mt-2">
                <div class="alert alert-success border border-success text-center shadow-sm mb-3">
                    <h5 class="mb-0 fw-bold">รวมที่ต้องชำระ: <strong id="finalTotalDisplay">฿${initialTotal.toLocaleString('en-US')}</strong></h5>
                </div>
                <label class="fw-bold text-primary mb-2">1. วิธีชำระเงิน:</label>
                <div class="form-check border rounded p-2 mb-2" id="boxTransfer" style="background-color: #f8f9fa;">
                    <input class="form-check-input ms-1" type="radio" name="payMethod" id="payTransfer" value="transfer" checked onchange="togglePaymentUI(${total}, ${isFreeShip})">
                    <label class="form-check-label ms-2 fw-bold" for="payTransfer">โอนเงิน ${isFreeShip ? '<span class="badge bg-success ms-1">ส่งฟรี</span>' : ''}</label>
                    <div id="transferDetailsBox" class="mt-3 text-center" style="display: block;">
                        <img src="${bankInfo.qrCode}" width="120" class="mb-2 border rounded p-1 bg-white"><br>
                        <span class="badge bg-success mb-1">${bankInfo.bankName}</span><br>
                        <span class="fw-bold fs-5 text-dark">${bankInfo.accNumber}</span><hr>
                        <div class="text-start">
                            <label class="fw-bold small text-danger">* สลิปโอนเงิน:</label>
                            <input type="file" id="slipUpload" class="form-control form-control-sm mb-2" accept="image/*">
                            <label class="fw-bold small text-dark">เวลาที่โอน:</label>
                            <input type="time" id="transferTime" class="form-control form-control-sm">
                        </div>
                    </div>
                </div>
                <div class="form-check border rounded p-2 mb-3" id="boxCOD">
                    <input class="form-check-input ms-1" type="radio" name="payMethod" id="payCOD" value="cod" onchange="togglePaymentUI(${total}, ${isFreeShip})">
                    <label class="form-check-label ms-2 fw-bold" for="payCOD">เก็บเงินปลายทาง <span class="text-danger fw-bold">(+฿50)</span></label>
                </div>
                <label class="fw-bold text-danger mb-2">2. พื้นที่ห่างไกล:</label>
                <div class="form-check border border-danger rounded p-2 bg-danger bg-opacity-10">
                    <input class="form-check-input ms-1" type="checkbox" id="remoteArea" onchange="updateCheckoutTotal(${total}, ${isFreeShip})" ${isAutoRemote ? 'checked disabled' : ''}>
                    <label class="form-check-label text-danger fw-bold ms-2" for="remoteArea">พื้นที่ห่างไกล (+฿20)</label>
                </div>
            </div>
        `,
        showCancelButton: true, confirmButtonText: 'ยืนยันสั่งซื้อ', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#10b981',
        preConfirm: async () => {
            const method = document.querySelector('input[name="payMethod"]:checked').value;
            const isRemote = document.getElementById('remoteArea').checked;
            let slipBase64 = null; let transferTime = '';
            if (method === 'transfer') {
                const slipFile = document.getElementById('slipUpload').files[0];
                transferTime = document.getElementById('transferTime').value;
                if (!slipFile || !transferTime) { Swal.showValidationMessage('กรุณาแนบรูปสลิปและระบุเวลาค่ะ'); return false; }
                slipBase64 = await window.compressImage(slipFile, 800); slipBase64 = slipBase64.split(',')[1]; 
            }
            return { method, isRemote, slipBase64, transferTime };
        }
    }).then((result) => { if(result.isConfirmed) checkoutShop(total, result.value.method, result.value.isRemote, result.value.slipBase64, result.value.transferTime); });
}

window.togglePaymentUI = function(total, isFreeShip) {
    const method = document.querySelector('input[name="payMethod"]:checked').value;
    document.getElementById('transferDetailsBox').style.display = method === 'transfer' ? 'block' : 'none';
    updateCheckoutTotal(total, isFreeShip);
}

window.updateCheckoutTotal = function(total, isFreeShip) {
    const method = document.querySelector('input[name="payMethod"]:checked').value;
    const isRemote = document.getElementById('remoteArea').checked;
    let ship = (method === 'transfer') ? (isFreeShip ? 0 : 40) : 50;
    let finalTotal = total + ship + (isRemote ? 20 : 0);
    document.getElementById('finalTotalDisplay').innerText = '฿' + finalTotal.toLocaleString('en-US');
}

// 💡 6. โค้ดส่งใบสั่งซื้อ พร้อมส่งข้อมูลตัวเลือก (Variants) ไปด้วย
window.checkoutShop = async function(total, payMethod, isRemote, slipBase64, transferTime) {
    Swal.fire({title: 'กำลังบันทึกออเดอร์...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
    
    const payload = { 
        action: 'checkoutShop', phone: currentUser.phone, name: currentUser.name || currentUser.fname, 
        payMethod: payMethod, isRemote: isRemote, slipBase64: slipBase64, transferTime: transferTime, 
        // 💡 ส่ง variant ไปกับบิลด้วย แอดมินจะได้จัดของถูกสี
        items: shopCart.map(i => ({id: i.id, sku: i.sku, qty: i.qty, variant: i.variant || ''})) 
    };
    
    const res = await API.shopPost(payload);
    if(res.status === 'success') {
        shopCart = []; saveCart(); 
        Swal.fire({ title: 'สั่งซื้อสำเร็จ!', text: 'เราได้รับคำสั่งซื้อของคุณแล้ว สามารถเช็คออเดอร์ได้ที่หน้าบัญชี', icon: 'success' }).then(() => { showPage('dashboard'); });
    } else { Swal.fire('ขออภัย', res.message, 'error'); }
}
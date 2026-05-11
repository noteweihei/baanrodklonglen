// ==========================================
// 🛠️ Admin Module: Core Engine (State & UI)
// ==========================================

const pModal = new bootstrap.Modal(document.getElementById("productModal") || document.createElement('div'));
const uModal = new bootstrap.Modal(document.getElementById("userModal") || document.createElement('div'));
const rModal = new bootstrap.Modal(document.getElementById("rejectModal") || document.createElement('div'));
const gModal = new bootstrap.Modal(document.getElementById("gachaModal") || document.createElement('div'));

const appState = {
    pendingOrdersTable: [], historyOrdersTable: [],
    pendingRedeemsTable: [], historyRedeemsTable: [],
    userTable: [], productTable: [], logsTable: [], gachaTable: [],
    shopOrdersTableBody: [] // 💡 จัดเก็บข้อมูลออเดอร์ร้านค้า
};

const pageState = {
    pendingOrdersTable: { page: 1, limit: 10, render: typeof rowPendingOrder === 'function' ? rowPendingOrder : () => '' },
    historyOrdersTable: { page: 1, limit: 10, render: typeof rowHistoryOrder === 'function' ? rowHistoryOrder : () => '' },
    pendingRedeemsTable: { page: 1, limit: 10, render: typeof rowPendingRedeem === 'function' ? rowPendingRedeem : () => '' },
    historyRedeemsTable: { page: 1, limit: 10, render: typeof rowHistoryRedeem === 'function' ? rowHistoryRedeem : () => '' },
    userTable: { page: 1, limit: 10, render: typeof rowUser === 'function' ? rowUser : () => '' },
    productTable: { page: 1, limit: 10, render: typeof rowProduct === 'function' ? rowProduct : () => '' },
    logsTable: { page: 1, limit: 10, render: typeof rowLog === 'function' ? rowLog : () => '' },
    gachaTable: { page: 1, limit: 10, render: typeof rowGacha === 'function' ? rowGacha : () => '' },
    
    // 💡 การตั้งค่าการวาดตารางร้านค้า (เพิ่มปุ่ม แก้ไข และ ลบ)
    shopOrdersTableBody: { page: 1, limit: 10, render: function(o) {
        // กำหนดสีของสถานะ
        let badgeClass = o.status === "Approved" || o.status === "รอจัดส่ง" ? "bg-primary" : 
                        (o.status === "จัดส่งแล้ว" ? "bg-success" : 
                        (o.status === "ยกเลิก" ? "bg-danger" : "bg-warning text-dark"));
        
        let itemsHtml = o.detail.replace(/\n/g, '<br>');
        let slipBtn = o.slipBase64 ? `<button class="btn btn-sm btn-outline-info fw-bold w-100" onclick="Swal.fire({imageUrl: '${o.slipBase64}', imageWidth: 400, imageAlt: 'สลิปโอนเงิน'})"><i class="fas fa-image"></i> ดูสลิป</button>` : `<span class="badge bg-light text-muted border w-100 py-2">ไม่มีสลิป</span>`;
        
        // สร้างกลุ่มปุ่มจัดการออเดอร์
        let actionBtn = `<div class="d-flex flex-column gap-1">`;
        if (o.status === "รอตรวจสอบสลิป") {
            actionBtn += `<button class="btn btn-sm btn-success w-100 fw-bold" onclick="approveShopOrder('${o.rowIndex}')"><i class="fas fa-check"></i> อนุมัติสลิป</button>`;
        }
        actionBtn += `<span class="badge ${badgeClass} w-100 py-2 shadow-sm">${o.status}</span>`;
        actionBtn += `<div class="btn-group w-100 shadow-sm mt-1">
                        <button class="btn btn-sm btn-warning text-dark fw-bold" onclick="openEditShopOrder('${o.rowIndex}')" title="แก้ไขข้อมูล/สถานะ"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger fw-bold" onclick="deleteShopOrder('${o.rowIndex}')" title="ลบออเดอร์"><i class="fas fa-trash-alt"></i></button>
                      </div></div>`;

        return `
        <tr id="row-shop-${o.rowIndex}">
            <td class="align-middle"><input type="checkbox" class="form-check-input chk-shop border-primary" value="${o.rowIndex}"></td>
            <td class="align-middle"><small class="text-muted"><i class="far fa-clock"></i> ${o.timestamp}</small><br><span class="fw-bold text-primary">${o.orderId}</span></td>
            <td class="align-middle">
                <span class="fw-bold text-dark"><i class="fas fa-user"></i> ${o.name}</span> <small class="text-danger">(${o.phone})</small><br>
                <small class="text-muted" style="line-height:1.2; display:block;">${o.address} ${o.zipcode}</small>
            </td>
            <td class="align-middle"><div style="max-height: 80px; overflow-y: auto; font-size: 0.75rem; background: #f8fafc; padding: 5px; border-radius: 5px; border: 1px solid #e2e8f0;">${itemsHtml}</div></td>
            <td class="text-success fw-bold align-middle">฿${o.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
            <td class="text-center align-middle" width="90">${slipBtn}</td>
            <td class="text-center align-middle" width="120">${actionBtn}</td>
        </tr>`;
    }}
};

// 📱 ระบบจัดการเมนูมือถือ
window.openMobileMenu = function() {
    document.getElementById('sidebarMenu').classList.add('mobile-open');
    document.getElementById('mobileBackdrop').classList.add('show');
    document.body.style.overflow = 'hidden'; 
};

window.closeMobileMenu = function() {
    document.getElementById('sidebarMenu').classList.remove('mobile-open');
    document.getElementById('mobileBackdrop').classList.remove('show');
    document.body.style.overflow = ''; 
};

// 🌟 ระบบสลับหน้าต่างเนื้อหา (Tabs)
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebarMenu');
    if (!sidebar) return;
    const tabLinks = sidebar.querySelectorAll('.nav-link');
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            tabLinks.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const targetId = this.getAttribute('data-bs-target');
            if (targetId) {
                document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('show', 'active'));
                const targetPane = document.querySelector(targetId);
                if (targetPane) targetPane.classList.add('show', 'active');
            }
            closeMobileMenu();
        });
    });
});

// ==========================================
// ระบบวาดตารางและแบ่งหน้า (Pagination)
// ==========================================
function renderTable(tableId) {
    let st = pageState[tableId];
    if (!st || !st.render) return;

    let data = appState[tableId] || [];
    let filterInput = document.getElementById("globalSearch");
    let filter = filterInput ? filterInput.value.toLowerCase() : "";
    
    let filtered = filter ? data.filter((item) => Object.values(item).some((val) => String(val).toLowerCase().includes(filter))) : data;
    let totalPages = Math.ceil(filtered.length / st.limit) || 1;
    
    if (st.page > totalPages) st.page = totalPages;
    let start = (st.page - 1) * st.limit;
    let paginated = filtered.slice(start, start + st.limit);
    
    let tbody = document.getElementById(tableId);
    if (!tbody) return;
    
    if (paginated.length === 0) {
        let cols = document.querySelector(`#${tableId}`).parentElement.querySelectorAll("th").length || 5;
        tbody.innerHTML = `<tr><td colspan="${cols}" class="text-center text-muted py-4">ไม่มีข้อมูล</td></tr>`;
    } else {
        tbody.innerHTML = paginated.map(st.render).join("");
    }

    let wrapper = document.getElementById(`page-${tableId}`);
    if (wrapper) {
        let pHTML = `
        <div class="d-flex justify-content-between align-items-center mt-3 border-top pt-3 flex-wrap gap-2">
            <div class="text-muted small">แสดง 
                <select class="form-select form-select-sm d-inline-block w-auto mx-1" onchange="changeLimit('${tableId}', this.value)">
                    <option value="10" ${st.limit == 10 ? "selected" : ""}>10</option>
                    <option value="50" ${st.limit == 50 ? "selected" : ""}>50</option>
                    <option value="100" ${st.limit == 100 ? "selected" : ""}>100</option>
                </select> แถว
            </div>
            <nav><ul class="pagination pagination-sm mb-0 shadow-sm">
                <li class="page-item ${st.page === 1 ? "disabled" : ""}"><a class="page-link" href="#" onclick="changePage('${tableId}', ${st.page - 1}); return false;">«</a></li>`;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= st.page - 1 && i <= st.page + 1))
                pHTML += `<li class="page-item ${st.page === i ? "active" : ""}"><a class="page-link" href="#" onclick="changePage('${tableId}', ${i}); return false;">${i}</a></li>`;
            else if (i === st.page - 2 || i === st.page + 2)
                pHTML += `<li class="page-item disabled"><span class="page-link border-0 text-muted">...</span></li>`;
        }
        
        pHTML += `<li class="page-item ${st.page === totalPages ? "disabled" : ""}"><a class="page-link" href="#" onclick="changePage('${tableId}', ${st.page + 1}); return false;">»</a></li></ul></nav></div>`;
        wrapper.innerHTML = pHTML;
    }
}

function changePage(tableId, newPage) { pageState[tableId].page = newPage; renderTable(tableId); }
function changeLimit(tableId, newLimit) { pageState[tableId].limit = parseInt(newLimit); pageState[tableId].page = 1; renderTable(tableId); }
function searchTables() { Object.keys(pageState).forEach(renderTable); }
function logoutAdmin() { localStorage.removeItem("currentUser"); window.location.href = "index.html"; }

// ระบบ Export Excel
window.exportToExcel = function(stateKey, filename) {
    const data = appState[stateKey];
    if (!data || data.length === 0) return Swal.fire('ไม่พบข้อมูล', 'ไม่มีข้อมูลที่จะ Export ครับ', 'warning');
    let exportData = data.map(item => { let clean = { ...item }; delete clean.rowIndex; return clean; });
    const ws = XLSX.utils.json_to_sheet(exportData); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data"); XLSX.writeFile(wb, `${filename}_${new Date().getTime()}.xlsx`);
};
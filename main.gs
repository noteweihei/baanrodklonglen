// ==========================================
// ⚙️ ระบบหลังบ้าน: ฐานข้อมูลหลัก (Main DB - Full System)
// จัดการ: สมาชิก, สะสมแต้ม, ของรางวัล, กาชา, แดชบอร์ด, AI Scanner
// ==========================================

const GEMINI_API_KEY = "AIzaSyCY6HHWGB_VBWTH4sno3Ri_kROq7x61Ejk"; 

// ------------------------------------------
// 1. ฟังก์ชันตัวช่วย & ความปลอดภัย (Helpers)
// ------------------------------------------
function getNowStr() { 
  return Utilities.formatDate(new Date(), "Asia/Bangkok", "dd/MM/yyyy HH:mm:ss"); 
}

function cleanStr(val) {
  if (val == null || val === undefined) return "";
  return val.toString().replace(/['"<>]/g, "").trim(); 
}

function logSecurity(user, action, detail) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("SecurityLogs") || ss.insertSheet("SecurityLogs");
  if (sheet.getLastRow() === 0) sheet.appendRow(["Timestamp", "User/Phone", "Action", "Detail"]);
  sheet.appendRow([getNowStr(), "'" + cleanStr(user), action, detail]);
}

// 💡 ฟังก์ชันที่ขาดหายไป เติมกลับมาให้แล้วค่ะ! (สำหรับส่งข้อมูลกลับหน้าเว็บ)
function outputJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) { 
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT); 
}

// ------------------------------------------
// 2. ระบบอ่านข้อมูล (API GET)
// ------------------------------------------
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = e.parameter.action;
  let result = {};

  try {
    const uSheet = ss.getSheetByName("Users");
    const uData = uSheet ? uSheet.getDataRange().getDisplayValues() : [];
    const userMap = {};
    for (let i = 1; i < uData.length; i++) {
      let phoneKey = cleanStr(uData[i][0]);
      userMap[phoneKey] = { name: uData[i][1], address: uData[i][2], zip: uData[i][3], points: uData[i][4], status: uData[i][8] };
    }

    if (action === 'getUsers') {
      let users = [];
      for (let i = 1; i < uData.length; i++) {
        users.push({
          rowIndex: i + 1, phone: cleanStr(uData[i][0]), name: uData[i][1], address: uData[i][2], zipcode: uData[i][3], points: uData[i][4], 
          password: cleanStr(uData[i][5]), role: uData[i][6], ip: uData[i][7], status: uData[i][8],
          fname: uData[i][9] || '', lname: uData[i][10] || '', addressLine: uData[i][11] || '', subdistrict: uData[i][12] || '', district: uData[i][13] || '', province: uData[i][14] || ''
        });
      }
      result = { status: 'success', data: users };
    }
    else if (action === 'getProducts') { 
      const sheet = ss.getSheetByName("Products");
      const data = sheet ? sheet.getDataRange().getDisplayValues() : [];
      let products = [];
      for(let i = 1; i < data.length; i++) {
        products.push({ rowIndex: i+1, id: data[i][0], name: data[i][1], points: data[i][2], image: data[i][3], desc: data[i][4], stock: parseInt(data[i][5] || 0) });
      }
      result = { status: 'success', data: products };
    }
    else if (action === 'getGacha') {
      const sheet = ss.getSheetByName("GachaSettings");
      const data = sheet ? sheet.getDataRange().getValues() : [];
      let gacha = [];
      for (let i = 1; i < data.length; i++) {
        gacha.push({ rowIndex: i + 1, id: data[i][0], name: data[i][1], type: data[i][2], value: data[i][3], stock: data[i][4], rate: data[i][5], image: data[i][6], isPity: data[i][7], pityCount: data[i][8], currentSpins: data[i][9], category: data[i][10] || 'ทั่วไป' });
      }
      result = { status: 'success', data: gacha };
    }
    else if (action === 'getOrders') {
      const sheet = ss.getSheetByName("Orders");
      const data = sheet ? sheet.getDataRange().getDisplayValues() : [];
      let orders = [];
      for(let i=1; i<data.length; i++){
        let p = cleanStr(data[i][1]);
        orders.push({ orderId: cleanStr(data[i][0]), phone: p, name: (userMap[p]||{}).name || 'ไม่พบชื่อ', amount: data[i][2], channel: data[i][3], status: data[i][4], points: data[i][5], timestamp: data[i][6] || '-', remark: data[i][7] || '-' });
      }
      result = { status: 'success', data: orders };
    }

    // --- 🛒 ดึงข้อมูลออเดอร์จากร้านค้า (Shop Orders) พร้อมรูปสลิป ---
    else if (action === 'getShopOrders') {
      const shopSheet = ss.getSheetByName("Shop_Orders");
      const sData = shopSheet ? shopSheet.getDataRange().getDisplayValues() : [];
      let shopOrders = [];
      
      for(let i = 1; i < sData.length; i++) {
        // ค้นหาข้อมูลที่อยู่จาก userMap (ที่ดึงไว้แล้วด้านบน) โดยใช้เบอร์โทร
        let p = cleanStr(sData[i][2]); // คอลัมน์โทรศัพท์
        let uInfo = userMap[p] || {};
        
        shopOrders.push({
          rowIndex: i + 1,
          timestamp: sData[i][0] || '-',
          orderId: sData[i][1] || '-',
          phone: p,
          name: sData[i][3] || uInfo.name || 'ไม่ระบุ',
          address: uInfo.address || 'ไม่ระบุที่อยู่',
          zipcode: uInfo.zip || '',
          detail: sData[i][4] || '-',
          total: parseFloat(sData[i][5] || 0),
          status: sData[i][6] || 'Pending',
          rawJson: sData[i][7] || '[]',
          // 💡 เพิ่มส่วนนี้: ดึงข้อมูลรูปสลิปจากคอลัมน์ที่ 9 (Index 8)
          slipBase64: sData[i][8] || '' 
        });
      }
      result = { status: 'success', data: shopOrders.reverse() }; // สลับเอาอันใหม่ขึ้นก่อน
    }

    else if (action === 'getRedemptions') {
      const sheet = ss.getSheetByName("Redemptions");
      const data = sheet ? sheet.getDataRange().getDisplayValues() : [];
      let redeems = [];
      for(let i=1; i<data.length; i++){
        let p = cleanStr(data[i][0]);
        redeems.push({ rowIndex: i + 1, timestamp: data[i][3] || '-', phone: p, name: (userMap[p]||{}).name || 'ไม่พบชื่อ', address: (userMap[p]||{}).address, productId: data[i][1], pointsUsed: data[i][2], status: data[i][4] || 'Pending', remark: data[i][5] || '-' });
      }
      result = { status: 'success', data: redeems };
    }
    // (ส่วนนี้อยู่ในฟังก์ชัน doGet นะคะ)
    else if (action === 'getSettings') {
      const sSheet = ss.getSheetByName("Settings");
      if (!sSheet) {
          return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: {} })).setMimeType(ContentService.MimeType.JSON);
      }
      const data = sSheet.getDataRange().getValues();
      let settings = {};
      // 💡 ดึงข้อมูลทั้งหมดในรูปแบบ Key: Value (คอลัมน์ A คือชื่อ, คอลัมน์ B คือค่า)
      for (let i = 1; i < data.length; i++) {
        if (data[i][0]) settings[data[i][0]] = data[i][1];
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: settings })).setMimeType(ContentService.MimeType.JSON);
    }
    else if (action === 'getLogs') {
      const sheet = ss.getSheetByName("SecurityLogs");
      const data = sheet ? sheet.getDataRange().getDisplayValues() : [];
      let logs = [];
      for(let i=1; i<data.length; i++) logs.push({ timestamp: data[i][0], user: cleanStr(data[i][1]), action: data[i][2], detail: data[i][3] });
      result = { status: 'success', data: logs };
    }
    else {
      result = { status: 'error', message: 'Invalid Action' };
    }
  } catch (error) { result = { status: 'error', message: error.toString() }; }
  
  return outputJson(result);
}

// ------------------------------------------
// 3. ระบบบันทึก/แก้ไขข้อมูล (API POST)
// ------------------------------------------
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- 📊 ดึงประวัติผู้ใช้ (ย้ายมาใช้ POST เพื่อความเสถียรและแก้บั๊กคอลัมน์สลับที่) ---
    if (action === 'getUserHistory') {
      const ph = cleanStr(body.phone);
      const oSheet = ss.getSheetByName("Orders"); const oData = oSheet ? oSheet.getDataRange().getDisplayValues() : [];
      const rSheet = ss.getSheetByName("Redemptions"); const rData = rSheet ? rSheet.getDataRange().getDisplayValues() : [];
      
      const uSheet = ss.getSheetByName("Users"); const uData = uSheet ? uSheet.getDataRange().getDisplayValues() : [];
      let uInfo = {};
      for(let j=1; j<uData.length; j++) {
        if(cleanStr(uData[j][0]) === ph) {
          uInfo = { phone: ph, name: uData[j][1], address: uData[j][2], zipcode: uData[j][3], points: uData[j][4] }; break;
        }
      }
      
      let now = new Date();
      let nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      uInfo.expiryDate = Utilities.formatDate(nextMonth, "Asia/Bangkok", "dd/MM/yyyy");
      
      let uOrders = [], uRedeems = [];
      
      // 💡 อัปเกรด: อ่านตาราง Orders ให้รองรับทั้งออเดอร์ยุคเก่า และ ยุคใหม่ (ตะกร้าสินค้า)
      for(let i=1; i<oData.length; i++) {
        let orderPhone = cleanStr(oData[i][1]); // ลองอ่านคอลัมน์ B ก่อน (แบบเก่า)
        let isNewFormat = false;
        
        // ถ้าคอลัมน์ B เป็นรหัส SHOP-... แสดงว่าเป็นออเดอร์แบบใหม่ เบอร์โทรจะอยู่คอลัมน์ D
        if (orderPhone.startsWith("SHOP-") || cleanStr(oData[i][3]).length >= 9) {
            orderPhone = cleanStr(oData[i][3]); // อ่านจากคอลัมน์ D
            isNewFormat = true;
        }
        
        if(orderPhone === ph) {
            if (isNewFormat) {
                // ดึงข้อมูลตามโครงสร้างแบบใหม่ (คอลัมน์สลับที่)
                uOrders.push({ orderId: cleanStr(oData[i][1]), amount: oData[i][5], channel: oData[i][4], status: oData[i][7], points: oData[i][6], timestamp: oData[i][0] || '-', remark: oData[i][8] || '-' });
            } else {
                // ดึงข้อมูลตามโครงสร้างแบบเก่า
                uOrders.push({ orderId: cleanStr(oData[i][0]), amount: oData[i][2], channel: oData[i][3], status: oData[i][4], points: oData[i][5], timestamp: oData[i][6] || '-', remark: oData[i][7] || '-' });
            }
        }
      }
      
      // ประวัติแลกของรางวัลยังโครงสร้างเดิม
      for(let i=1; i<rData.length; i++) {
        if(cleanStr(rData[i][0]) === ph) {
          uRedeems.push({ rowIndex: i+1, productId: rData[i][1], points: rData[i][2], timestamp: rData[i][3] || '-', status: rData[i][4]||'Pending', remark: rData[i][5]||'-' });
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', orders: uOrders, redeems: uRedeems, userInfo: uInfo })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- 👤 หมวดผู้ใช้งาน ---
    if (action === 'login') {
      const uSheet = ss.getSheetByName("Users"); const data = uSheet.getDataRange().getDisplayValues();
      const phone = cleanStr(body.phone); const passwordInput = cleanStr(body.password); const userIp = cleanStr(body.ip) || 'ไม่ทราบ IP'; 
      for (let i = 1; i < data.length; i++) {
        if (cleanStr(data[i][0]) === phone) {
          if (data[i][8] === 'Banned') {
              logSecurity(phone, "LOGIN_FAILED", "บัญชีถูกแบน IP: " + userIp);
              return outputJson({status: 'error', message: 'บัญชีถูกระงับการใช้งาน'});
          }
          if (passwordInput !== cleanStr(data[i][5])) {
            logSecurity(phone, "LOGIN_FAILED", "รหัสผ่านผิด IP: " + userIp);
            return outputJson({status: 'error', message: 'รหัสผ่านไม่ถูกต้อง'});
          }
          
          uSheet.getRange(i + 1, 8).setValue(userIp);
          logSecurity(phone, "LOGIN_SUCCESS", "เข้าสู่ระบบ IP: " + userIp);
          
          const user = {
            rowIndex: i + 1, phone: phone, name: data[i][1], address: data[i][2], zipcode: data[i][3], points: data[i][4], role: data[i][6], ip: userIp, status: data[i][8],
            fname: data[i][9]||'', lname: data[i][10]||'', addressLine: data[i][11]||'', subdistrict: data[i][12]||'', district: data[i][13]||'', province: data[i][14]||''
          };
          return outputJson({status: 'success', user: user});
        }
      }
      return outputJson({status: 'error', message: 'ไม่พบเบอร์นี้ในระบบ'});
    }
    else if (action === 'register') {
      const uSheet = ss.getSheetByName("Users"); const data = uSheet.getDataRange().getDisplayValues();
      const phone = cleanStr(body.phone); const userIp = cleanStr(body.ip) || 'ไม่ทราบ IP'; 
      for (let i = 1; i < data.length; i++) {
        if (cleanStr(data[i][0]) === phone) return outputJson({status: 'error', message: 'เบอร์นี้เป็นสมาชิกแล้ว'});
      }
      const password = cleanStr(body.password), fname = cleanStr(body.fname), lname = cleanStr(body.lname);
      const addrLine = cleanStr(body.addressLine), subdist = cleanStr(body.subdistrict), dist = cleanStr(body.district), prov = cleanStr(body.province), zip = cleanStr(body.zipcode);
      const combinedName = fname + ' ' + lname; const combinedAddress = addrLine + ' ต.' + subdist + ' อ.' + dist + ' จ.' + prov;
      
      uSheet.appendRow(["'" + phone, combinedName, combinedAddress, zip, 0, "'" + password, "user", userIp, "Active", fname, lname, addrLine, subdist, dist, prov]);
      logSecurity(phone, "REGISTER", "สมัครสมาชิกใหม่ IP: " + userIp);
      return outputJson({status: 'success', user: { phone: phone, name: combinedName, address: combinedAddress, zipcode: zip, points: 0, role: 'user', status: 'Active', fname: fname, lname: lname, addressLine: addrLine, subdistrict: subdist, district: dist, province: prov }});
    }
    // =========================================
    // 👥 เพิ่มสมาชิกใหม่โดยแอดมิน (Manual Add)
    // =========================================
    else if (action === 'addUser') {
      const uSheet = ss.getSheetByName("Users");
      const uData = uSheet.getDataRange().getDisplayValues();
      const phone = cleanStr(body.phone);
      
      // 1. เช็คก่อนว่าเบอร์นี้ซ้ำกับในระบบหรือไม่
      for (let i = 1; i < uData.length; i++) {
        if (cleanStr(uData[i][0]) === phone) {
          return outputJson({status: 'error', message: 'เบอร์นี้เป็นสมาชิกอยู่แล้วในระบบค่ะ'});
        }
      }

      // 2. เตรียมข้อมูลและรวมชื่อ-ที่อยู่
      const password = cleanStr(body.password) || '1234';
      const fname = cleanStr(body.fname) || '';
      const lname = cleanStr(body.lname) || '';
      const addrLine = cleanStr(body.address) || '';
      const subdist = cleanStr(body.subdistrict) || '';
      const dist = cleanStr(body.district) || '';
      const prov = cleanStr(body.province) || '';
      const zip = cleanStr(body.zipcode) || '';
      const points = parseFloat(body.points) || 0;
      
      const combinedName = (fname + ' ' + lname).trim(); 
      let combinedAddress = addrLine;
      if(subdist) combinedAddress += ' ต.' + subdist;
      if(dist) combinedAddress += ' อ.' + dist;
      if(prov) combinedAddress += ' จ.' + prov;
      combinedAddress = combinedAddress.trim();

      // 3. บันทึกลง Google Sheets (เรียงคอลัมน์ตามโครงสร้างเดิมเป๊ะ)
      uSheet.appendRow([
        "'" + phone,           // คอลัมน์ A: เบอร์โทร (ใส่ ' กันเลข 0 หาย)
        combinedName,          // คอลัมน์ B: ชื่อ-นามสกุลรวม
        combinedAddress,       // คอลัมน์ C: ที่อยู่รวม
        zip,                   // คอลัมน์ D: รหัส ปณ.
        points,                // คอลัมน์ E: แต้มสะสม
        "'" + password,        // คอลัมน์ F: รหัสผ่าน (ใส่ ' กันเลข 0 หาย)
        "user",                // คอลัมน์ G: Role
        "Added by Admin",      // คอลัมน์ H: IP / หมายเหตุ
        "Active",              // คอลัมน์ I: Status
        fname,                 // คอลัมน์ J: ชื่อจริง
        lname,                 // คอลัมน์ K: นามสกุล
        addrLine,              // คอลัมน์ L: บ้านเลขที่
        subdist,               // คอลัมน์ M: ตำบล
        dist,                  // คอลัมน์ N: อำเภอ
        prov                   // คอลัมน์ O: จังหวัด
      ]);

      logSecurity("Admin", "ADD_USER", "แอดมินเพิ่มสมาชิกใหม่เบอร์: " + phone);
      return outputJson({status: 'success'});
    }
    else if (action === 'editUserDetail') {
      const uSheet = ss.getSheetByName("Users"); const row = parseInt(body.rowIndex);
      const fname = cleanStr(body.fname), lname = cleanStr(body.lname), addrLine = cleanStr(body.address), subdist = cleanStr(body.subdistrict), dist = cleanStr(body.district), prov = cleanStr(body.province), zip = cleanStr(body.zipcode);
      const combinedName = fname + ' ' + lname; const combinedAddress = addrLine + ' ต.' + subdist + ' อ.' + dist + ' จ.' + prov;
      
      uSheet.getRange(row, 2).setValue(combinedName); uSheet.getRange(row, 3).setValue(combinedAddress); uSheet.getRange(row, 4).setValue(zip); uSheet.getRange(row, 5).setValue(parseFloat(body.points||0));
      if(body.password) uSheet.getRange(row, 6).setValue("'" + cleanStr(body.password));
      uSheet.getRange(row, 10).setValue(fname); uSheet.getRange(row, 11).setValue(lname); uSheet.getRange(row, 12).setValue(addrLine); uSheet.getRange(row, 13).setValue(subdist); uSheet.getRange(row, 14).setValue(dist); uSheet.getRange(row, 15).setValue(prov);
      
      logSecurity("Admin", "EDIT_USER", "แก้ไขข้อมูลเบอร์: " + body.phone);
      return outputJson({status: 'success'});
    }
    else if (action === 'banUser') {
      ss.getSheetByName("Users").getRange(body.rowIndex, 9).setValue(body.status);
      logSecurity("Admin", body.status === 'Banned' ? "BAN_USER" : "UNBAN_USER", "สถานะเบอร์: " + body.phone);
      return outputJson({status: 'success'});
    }
    
    // --- 💰 หมวดแจ้งยอดโอน & แต้ม ---
    else if (action === 'submitOrder') {
      const sheet = ss.getSheetByName("Orders"); const set = ss.getSheetByName("Settings").getDataRange().getValues();
      let base = 100, rate = 10;
      for(let i=1; i<set.length; i++) { if(set[i][0]=='amount_base') base=parseFloat(set[i][1]); if(set[i][0]=='points_rate') rate=parseFloat(set[i][1]); }
      
      const orderId = cleanStr(body.orderId);
      if (orderId !== 'เงินสด') {
        const orderData = sheet.getDataRange().getDisplayValues();
        for (let k = 1; k < orderData.length; k++) {
          if (cleanStr(orderData[k][0]) === orderId) return outputJson({ status: 'error', message: 'หมายเลขคำสั่งซื้อนี้ถูกแจ้งไปแล้ว (Duplicate)' });
        }
      }
      let earned = parseFloat(((parseFloat(body.amount)/base)*rate).toFixed(2));
      sheet.appendRow(["'" + orderId, "'" + cleanStr(body.phone), body.amount, body.channel, "Pending", earned, getNowStr(), ""]);
      return outputJson({status: 'success'});
    }
    // --- ✅ อนุมัติแต้ม & 🛡️ ระบบ RE-CHECK ป้องกันสลิปซ้ำ/บิลปลอม ---
    else if (action === 'approveOrder') {
      const oSheet = ss.getSheetByName("Orders"); 
      const oData = oSheet.getDataRange().getDisplayValues();
      const orderId = cleanStr(body.orderId);
      
      let targetRow = -1;
      let orderChannel = "";

      // 1. ค้นหาแถวที่แอดมินเพิ่งกดอนุมัติ
      for (let i = 1; i < oData.length; i++) {
        if (cleanStr(oData[i][0]) === orderId && oData[i][4] === "Pending") {
          targetRow = i;
          orderChannel = cleanStr(oData[i][3]);
          break;
        }
      }

      if (targetRow === -1) {
          return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'ไม่พบรายการที่รออนุมัติ หรืออาจถูกจัดการไปแล้ว'})).setMimeType(ContentService.MimeType.JSON);
      }

      // 🛡️ เริ่มขั้นตอน RE-CHECK
      let isStoreFront = orderChannel.includes("หน้าร้าน");
      let onlyNumbers = orderId.replace(/\D/g, ''); // ดึงมาเฉพาะตัวเลข

      // ถ้าไม่ใช่ "หน้าร้าน" และมีการกรอกตัวเลขเข้ามา จะต้องเช็คความถูกต้องเข้มงวด
      if (!isStoreFront && onlyNumbers.length > 0) {
          
          // 🛡️ กฎข้อที่ 1: ห้ามซ้ำกับบิลที่เคยอนุมัติไปแล้วในระบบสะสมแต้ม
          for (let i = 1; i < oData.length; i++) {
              if (i !== targetRow && oData[i][4] === "Approved") {
                  let pastChannel = cleanStr(oData[i][3]);
                  // เราไม่เช็คซ้ำกับประวัติของหน้าร้านเก่าๆ เผื่อกรณีเวลาโอนตรงกัน
                  if (!pastChannel.includes("หน้าร้าน")) {
                      let pastNumbers = cleanStr(oData[i][0]).replace(/\D/g, '');
                      if (pastNumbers === onlyNumbers) {
                          return ContentService.createTextOutput(JSON.stringify({
                              status: 'error', 
                              message: `ไม่อนุมัติ! เลขอ้างอิง "${onlyNumbers}" เคยถูกใช้รับแต้มไปแล้วครับ (ป้องกันบิลซ้ำ)`
                          })).setMimeType(ContentService.MimeType.JSON);
                      }
                  }
              }
          }

          // 🛡️ กฎข้อที่ 2: ถ้าเป็นบิลของระบบเราเอง (ตะกร้าสินค้า/แอดมินสร้าง) ต้องมีอยู่จริงในตาราง Shop_Orders
          if (orderChannel.includes("ตะกร้า") || orderChannel.includes("แอดมินสร้าง") || orderChannel.includes("เว็บไซต์")) {
              const shopSheet = ss.getSheetByName("Shop_Orders");
              const sData = shopSheet ? shopSheet.getDataRange().getDisplayValues() : [];
              let isRealShopOrder = false;

              for(let j = 1; j < sData.length; j++) {
                  let shopOrderNumbers = cleanStr(sData[j][1]).replace(/\D/g, '');
                  if (shopOrderNumbers === onlyNumbers) {
                      isRealShopOrder = true;
                      break;
                  }
              }
              
              if (!isRealShopOrder) {
                  return ContentService.createTextOutput(JSON.stringify({
                      status: 'error', 
                      message: `ตรวจสอบล้มเหลว! ไม่พบรหัสคำสั่งซื้อ "${onlyNumbers}" ในระบบร้านค้าของเราครับ (ระวังบิลปลอม)`
                  })).setMimeType(ContentService.MimeType.JSON);
              }
          }
      }

      // ✅ ผ่านด่าน Re-check แล้ว ทำการบวกแต้มเข้ากระเป๋าลูกค้า
      let earnedPoints = parseFloat(oData[targetRow][5] || 0); 
      oSheet.getRange(targetRow + 1, 5).setValue("Approved");
      
      const uSheet = ss.getSheetByName("Users"); 
      const uData = uSheet.getDataRange().getDisplayValues();
      const userPhone = cleanStr(oData[targetRow][1]);
      let foundUser = false;
      
      for (let j = 1; j < uData.length; j++) {
        if (cleanStr(uData[j][0]) === userPhone) {
          let currentPoints = parseFloat(uData[j][4]);
          if (isNaN(currentPoints)) currentPoints = 0;
          let newTotal = currentPoints + earnedPoints;
          
          uSheet.getRange(j + 1, 5).setValue(newTotal); 
          foundUser = true;
          break;
        }
      }
      
      logSecurity("Admin", "APPROVE_ORDER", "อนุมัติแต้ม Order: " + orderId);
      if(!foundUser) return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'อนุมัติผ่านแต่ไม่พบบัญชีเบอร์นี้ แต้มไม่เข้า'})).setMimeType(ContentService.MimeType.JSON);
      
      return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
    }
    else if (action === 'rejectOrder') { 
      const oSheet = ss.getSheetByName("Orders"); const oData = oSheet.getDataRange().getDisplayValues(); 
      for (let i = 1; i < oData.length; i++) { 
        if (cleanStr(oData[i][0]) === cleanStr(body.orderId) && oData[i][4] === "Pending") { 
          oSheet.getRange(i + 1, 5).setValue("Rejected"); oSheet.getRange(i + 1, 8).setValue(body.remark); 
          logSecurity("Admin", "REJECT_ORDER", "ปฏิเสธบิล: " + body.orderId);
          return outputJson({status: 'success'}); 
        } 
      }
      return outputJson({status: 'error', message: 'ไม่พบรายการ'});
    }

    // --- 🎁 หมวดแลกของรางวัล ---
    else if (action === 'redeemReward') {
      const uSheet = ss.getSheetByName("Users"); const pSheet = ss.getSheetByName("Products");
      const uData = uSheet.getDataRange().getDisplayValues(); const pData = pSheet.getDataRange().getDisplayValues();
      let pIdx = -1, req = 0;
      for(let j=1; j<pData.length; j++) { if(pData[j][0].trim() == body.productId.trim()) { pIdx = j; req = parseFloat(pData[j][2]); break; } }
      if(pIdx == -1 || parseInt(pData[pIdx][5]||0) <= 0) return outputJson({status: 'error', message: 'สินค้าหมดสต็อก'});
      
      const uPhone = cleanStr(body.phone);
      const lock = LockService.getScriptLock(); lock.waitLock(5000);
      try {
        for (let i = 1; i < uData.length; i++) {
          if (cleanStr(uData[i][0]) == uPhone) {
            let curr = parseFloat(uSheet.getRange(i+1, 5).getValue());
            if (curr >= req) {
              let nPts = parseFloat((curr - req).toFixed(2));
              uSheet.getRange(i + 1, 5).setValue(nPts);
              pSheet.getRange(pIdx + 1, 6).setValue(parseInt(pData[pIdx][5]) - 1);
              ss.getSheetByName("Redemptions").appendRow(["'" + uPhone, body.productId, req, getNowStr(), "Pending", ""]);
              return outputJson({status: 'success', remainPoints: nPts});
            } else return outputJson({status: 'error', message: 'แต้มไม่พอ'});
          }
        }
      } finally { lock.releaseLock(); }
      return outputJson({status: 'error', message: 'ไม่พบผู้ใช้'});
    }
    else if (action === 'rejectRedeem' || action === 'userCancelRedeem') {
      const rSheet = ss.getSheetByName("Redemptions"); const row = parseInt(body.rowIndex);
      const pts = parseFloat(rSheet.getRange(row, 3).getValue());
      const phone = cleanStr(rSheet.getRange(row, 1).getDisplayValue());
      const pId = rSheet.getRange(row, 2).getDisplayValue().trim();
      const isReject = (action === 'rejectRedeem');
      
      rSheet.getRange(row, 5).setValue(isReject ? "Rejected" : "Cancelled");
      rSheet.getRange(row, 6).setValue(isReject ? body.remark : "ลูกค้ายกเลิกเอง (ไม่คืนแต้ม)");
      
      if (isReject) { 
        const uSheet = ss.getSheetByName("Users"); const uData = uSheet.getDataRange().getDisplayValues();
        for (let i = 1; i < uData.length; i++) { if (cleanStr(uData[i][0]) == phone) { uSheet.getRange(i + 1, 5).setValue(parseFloat((parseFloat(uData[i][4] || 0) + pts).toFixed(2))); break; } }
      }
      if (pId.indexOf("GACHA:") === -1) {
        const pSheet = ss.getSheetByName("Products"); const pData = pSheet.getDataRange().getDisplayValues();
        for (let j = 1; j < pData.length; j++) { if (pData[j][0].trim() == pId) { pSheet.getRange(j + 1, 6).setValue(parseInt(pData[j][5] || 0) + 1); break; } }
      } else {
        const gSheet = ss.getSheetByName("GachaSettings"); const gData = gSheet.getDataRange().getDisplayValues();
        const gName = pId.replace("GACHA: ", "").trim();
        for (let k = 1; k < gData.length; k++) { if (gData[k][1].trim() == gName) { gSheet.getRange(k + 1, 5).setValue(parseInt(gData[k][4] || 0) + 1); break; } }
      }
      logSecurity("Admin", "REJECT_REDEEM", "ยกเลิกแลกของ: " + pId);
      return outputJson({status: 'success'});
    }
    else if (action === 'bulkUpdateRedeem') {
      const rSheet = ss.getSheetByName("Redemptions");
      for (let i = 0; i < body.rowIndices.length; i++) { rSheet.getRange(body.rowIndices[i], 5).setValue(body.status); }
      logSecurity("Admin", "UPDATE_SHIPPING", "อัปเดตสถานะจัดส่ง");
      return outputJson({status: 'success'});
    }
    // --- 🚚 เพิ่มใหม่: อัปเดตสถานะจัดส่งสำหรับ Shop Orders ---
    else if (action === 'bulkUpdateShopOrder') {
      const shopSheet = ss.getSheetByName("Shop_Orders");
      for (let i = 0; i < body.rowIndices.length; i++) { 
        shopSheet.getRange(body.rowIndices[i], 7).setValue(body.status); // อัปเดตสถานะที่คอลัมน์ G (7)
      }
      logSecurity("Admin", "UPDATE_SHOP_SHIPPING", "อัปเดตสถานะจัดส่งสินค้าร้านค้า");
      return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
    }
    else if (action === 'forfeitRedeem') {
      const rSheet = ss.getSheetByName("Redemptions"); const row = parseInt(body.rowIndex);
      const pid = rSheet.getRange(row, 2).getDisplayValue().trim();
      rSheet.getRange(row, 5).setValue("สละสิทธิ์"); rSheet.getRange(row, 6).setValue("เกิน 48 ชม. (ยึดแต้ม)");
      
      if (pid.indexOf("GACHA:") === -1) {
        const pS = ss.getSheetByName("Products"); const pD = pS.getDataRange().getDisplayValues();
        for (let j = 1; j < pD.length; j++) { if (pD[j][0].trim() == pid) { pS.getRange(j+1, 6).setValue(parseInt(pD[j][5] || 0) + 1); break; } }
      } else {
        const gS = ss.getSheetByName("GachaSettings"); const gD = gS.getDataRange().getDisplayValues();
        const gN = pid.replace("GACHA: ", "").trim();
        for (let k = 1; k < gD.length; k++) { if (gD[k][1].trim() == gN) { gS.getRange(k+1, 5).setValue(parseInt(gD[k][4] || 0) + 1); break; } }
      }
      logSecurity("Admin", "FORFEIT_REWARD", "ยึดสิทธิ์: " + pid);
      return outputJson({status: 'success'});
    }

    // --- 🎲 หมวดสุ่มกาชา ---
    else if (action === 'spinGacha' || action === 'spinGacha10') {
      const isMulti = (action === 'spinGacha10');
      const spins = isMulti ? 10 : 1;
      
      const setSheet = ss.getSheetByName("Settings"); let price = 2000;
      const set = setSheet.getDataRange().getValues();
      for(let i=1; i<set.length; i++) { if(set[i][0] == 'gacha_price') price = parseFloat(set[i][1]); }
      
      const totalCost = price * spins;
      const uSheet = ss.getSheetByName("Users"); const uData = uSheet.getDataRange().getDisplayValues();
      let uIdx = -1, currPts = 0;
      for (let i = 1; i < uData.length; i++) { if (cleanStr(uData[i][0]) === cleanStr(body.phone)) { uIdx = i; currPts = parseFloat(uData[i][4] || 0); break; } }
      
      if (uIdx === -1) return outputJson({status: 'error', message: 'ไม่พบผู้ใช้'});
      
      const lock = LockService.getScriptLock(); lock.waitLock(8000);
      try {
        currPts = parseFloat(uSheet.getRange(uIdx+1, 5).getValue());
        if (currPts < totalCost) return outputJson({status: 'error', message: 'แต้มไม่พอ'});
        
        let remain = currPts - totalCost;
        const gSheet = ss.getSheetByName("GachaSettings"); const gData = gSheet.getDataRange().getValues();
        
        let pool = []; let pityItemIndex = -1;
        for (let i = 1; i < gData.length; i++) {
          if (parseInt(gData[i][4]) > 0 || gData[i][2] === 'Points') {
            pool.push({ index: i, id: gData[i][0], name: gData[i][1], type: gData[i][2], value: gData[i][3], stock: gData[i][4], rate: parseFloat(gData[i][5]), image: gData[i][6], isPity: gData[i][7], pityCount: parseInt(gData[i][8]||0), currentSpins: parseInt(gData[i][9]||0) });
            if (gData[i][7] === true && parseInt(gData[i][4]) > 0) pityItemIndex = i;
          }
        }
        
        if (pool.length === 0) return outputJson({status: 'error', message: 'ตู้กาชาว่างเปล่า'});
        
        let totalRate = pool.reduce((sum, item) => sum + item.rate, 0);
        let results = []; let totalPointsWon = 0; let wonProducts = []; let notifications = [];
        
        for (let s = 0; s < spins; s++) {
          let wonItem = null; let isPityDrop = false;
          
          if (pityItemIndex !== -1) {
            let pItem = gData[pityItemIndex];
            let newSpins = parseInt(pItem[9]||0) + 1;
            if (newSpins >= parseInt(pItem[8]||999) && parseInt(pItem[4]) > 0) {
              wonItem = pool.find(p => p.index === pityItemIndex);
              isPityDrop = true;
              gSheet.getRange(pityItemIndex+1, 10).setValue(0);
              gData[pityItemIndex][9] = 0;
            } else {
              gSheet.getRange(pityItemIndex+1, 10).setValue(newSpins);
              gData[pityItemIndex][9] = newSpins;
            }
          }
          
          if (!wonItem) {
            let rand = Math.random() * totalRate; let accum = 0;
            for (let item of pool) { accum += item.rate; if (rand <= accum) { wonItem = item; break; } }
            if(!wonItem) wonItem = pool[0];
          }
          
          if (wonItem.type === 'Points') {
            totalPointsWon += parseFloat(wonItem.value);
            results.push(wonItem);
          } else {
            gSheet.getRange(wonItem.index+1, 5).setValue(parseInt(wonItem.stock) - 1);
            wonItem.stock -= 1;
            if (wonItem.stock <= 0) {
              pool = pool.filter(p => p.index !== wonItem.index);
              totalRate = pool.reduce((sum, item) => sum + item.rate, 0);
            }
            ss.getSheetByName("Redemptions").appendRow(["'" + cleanStr(body.phone), "GACHA: " + wonItem.name, price, getNowStr(), "Pending", isPityDrop ? "สุ่มได้จาก Pity (การันตี)" : "สุ่มได้ปกติ"]);
            wonProducts.push(wonItem);
            results.push(wonItem);
            
            let hideName = cleanStr(body.phone).substring(0,6) + "xxxx";
            let notiMsg = isPityDrop ? `🔥 ยินดีด้วย! คุณ ${hideName} แตกการันตี ได้รับรถ ${wonItem.name}` : `🎉 ยินดีด้วย! คุณ ${hideName} สุ่มได้รับ ${wonItem.name}`;
            ss.getSheetByName("Notifications").appendRow([getNowStr(), notiMsg]);
          }
        }
        
        remain += totalPointsWon;
        uSheet.getRange(uIdx+1, 5).setValue(remain);
        
        if (isMulti) {
          return outputJson({status: 'success', remainPoints: remain, results: results, totalPointsWon: totalPointsWon, wonProducts: wonProducts});
        } else {
          let w = results[0];
          let msg = w.type === 'Points' ? `คุณได้รับโบนัส ${w.value} แต้ม คืนเข้ากระเป๋า` : `กรุณาแคปหน้าจอแล้วทัก LINE เพื่อรับรถ ${w.name}`;
          return outputJson({status: 'success', remainPoints: remain, wonItem: w, prizeType: w.type, message: msg});
        }
      } finally { lock.releaseLock(); }
    }

    // --- ⚙️ หมวดตั้งค่า & อื่นๆ ---
    // ✅ อัปเกรดเป็นแบบ Dynamic: รองรับการบันทึกแยกส่วน และเพิ่ม Key ใหม่ๆ ได้ไม่จำกัด
    else if (action === 'saveSettings') {
      const sSheet = ss.getSheetByName("Settings") || ss.insertSheet("Settings");
      if (sSheet.getLastRow() === 0) sSheet.appendRow(["Key", "Value"]); 
      
      const incomingSettings = body.settings; // รับข้อมูลก้อนที่ส่งมาจาก saveSettingsPart
      const keys = Object.keys(incomingSettings);
      const data = sSheet.getDataRange().getValues();
      
      keys.forEach(k => {
          let found = false;
          // วนลูปหาว่ามี Key นี้อยู่ในชีตหรือยัง
          for (let i = 1; i < data.length; i++) {
              if (data[i][0] === k) {
                  sSheet.getRange(i + 1, 2).setValue(incomingSettings[k]); // ถ้ามีแล้ว ให้อัปเดตค่า
                  found = true;
                  break;
              }
          }
          if (!found) {
              sSheet.appendRow([k, incomingSettings[k]]); // ถ้ายังไม่มี ให้เพิ่มแถวใหม่
          }
      });
      
      logSecurity("Admin", "UPDATE_SETTINGS", "อัปเดตการตั้งค่าระบบแยกส่วน");
      return outputJson({status: 'success'}); // ใช้ helper outputJson ตามโครงสร้างไฟล์เดิมของคุณลูกค้า
    }
    else if (action === 'addProduct' || action === 'editProduct' || action === 'deleteProduct' || action === 'addGacha' || action === 'editGacha' || action === 'deleteGacha') {
       let sht = action.includes('Product') ? ss.getSheetByName("Products") : ss.getSheetByName("GachaSettings");
       
       if (action.includes('add')) {
         let newId = action.includes('Product') ? "R" + new Date().getTime() : "G" + new Date().getTime();
         if(action.includes('Product')) sht.appendRow([newId, body.name, body.pointsReq, body.imageBase64, body.desc, body.stock]);
         else sht.appendRow([newId, body.name, body.type, body.value, body.stock, body.rate, body.imageBase64 || body.autoImageUrl, body.isPity, body.pityCount, 0, body.category]);
         logSecurity("Admin", action.toUpperCase(), "เพิ่มรายการใหม่: " + body.name);
         
       } else if (action.includes('edit')) {
         let r = parseInt(body.rowIndex);
         if(action.includes('Product')) { sht.getRange(r, 2).setValue(body.name); sht.getRange(r, 3).setValue(body.pointsReq); sht.getRange(r, 5).setValue(body.desc); sht.getRange(r, 6).setValue(body.stock); if(body.imageBase64) sht.getRange(r, 4).setValue(body.imageBase64); }
         else { sht.getRange(r, 2).setValue(body.name); sht.getRange(r, 3).setValue(body.type); sht.getRange(r, 4).setValue(body.value); sht.getRange(r, 5).setValue(body.stock); sht.getRange(r, 6).setValue(body.rate); sht.getRange(r, 8).setValue(body.isPity); sht.getRange(r, 9).setValue(body.pityCount); sht.getRange(r, 11).setValue(body.category); if(body.imageBase64 || body.autoImageUrl) sht.getRange(r, 7).setValue(body.imageBase64 || body.autoImageUrl); }
         logSecurity("Admin", action.toUpperCase(), "แก้ไขรายการ");
         
       } else if (action.includes('delete')) {
         // 💡 FIX: ค้นหา ID ที่ตรงกันเป๊ะๆ แล้วลบแถวนั้นทิ้ง (ป้องกันปัญหา parseInt NaN)
         let targetId = body.id;
         let data = sht.getDataRange().getValues();
         let found = false;
         
         for(let i = 1; i < data.length; i++) {
             if(data[i][0] == targetId) {
                 sht.deleteRow(i + 1);
                 found = true;
                 break;
             }
         }
         
         // เผื่อกรณีที่ระบบส่งมาเป็นตัวเลขแถว (Row Index)
         if(!found && !isNaN(parseInt(targetId))) {
             sht.deleteRow(parseInt(targetId)); 
         }
         
         logSecurity("Admin", action.toUpperCase(), "ลบรายการ ID: " + body.id);
       }
       return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // =========================================
    // 📦 AI สแกนเลขพัสดุจากรูปภาพ (อัปเกรด: แสดง Error จริง & กันเหนียวตัวแปร)
    // =========================================
    else if (action === 'analyzeTrackingImage' || (typeof data !== 'undefined' && data.action === 'analyzeTrackingImage')) {
      try {
          // 💡 กันเหนียว! รองรับตัวแปรทั้งชื่อ data และ body ป้องกัน error หาค่าไม่เจอ
          const payloadData = typeof data !== 'undefined' ? data : (typeof body !== 'undefined' ? body : {});
          const base64Data = payloadData.imageBase64 || payloadData.image;
          
          if (!base64Data) {
              return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "ส่งรูปภาพไม่สำเร็จ (ข้อมูลภาพว่างเปล่า)" })).setMimeType(ContentService.MimeType.JSON);
          }

          const prompt = `ทำหน้าที่เป็นผู้ช่วยสกัดข้อมูลเลขพัสดุจากรูปภาพใบเสร็จส่งของ
          ให้ดึง 'ชื่อลูกค้า' (เอาแค่ชื่อสั้นๆ ไม่ต้องเอาคำนำหน้ายาวๆ) และ 'เลขพัสดุ (Tracking Number)' 
          ตอบกลับเป็น JSON Array Format เท่านั้น ตัวอย่างเช่น:
          [
              {"name": "สมชาย", "tracking": "ED123456789TH"},
              {"name": "มาลี", "tracking": "TH9876543210"}
          ]
          ถ้าไม่พบข้อมูลเลยให้ตอบ []`;
          
          // 💡 ใช้ API Key สำรอง หรือของระบบหลัก
          const API_KEY = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : "AIzaSyCY6HHWGB_VBWTH4sno3Ri_kROq7x61Ejk"; 
          
          const payload = {
              "contents": [{
                  "parts": [
                      {"text": prompt},
                      {"inline_data": {"mime_type": "image/jpeg", "data": base64Data}}
                  ]
              }],
              "generationConfig": { "response_mime_type": "application/json" }
          };
          
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
          const options = {
              "method": "post",
              "contentType": "application/json",
              "payload": JSON.stringify(payload),
              "muteHttpExceptions": true // 💡 ให้คืนค่า Error กลับมา ไม่พังกลางคัน
          };
          
          const response = UrlFetchApp.fetch(url, options);
          const responseCode = response.getResponseCode();
          const json = JSON.parse(response.getContentText());
          
          if (responseCode === 200 && json.candidates && json.candidates.length > 0) {
              let text = json.candidates[0].content.parts[0].text;
              text = text.replace(/```json/g, '').replace(/```/g, '').trim();
              let parsedData = JSON.parse(text);
              
              if(typeof logSecurity === 'function') logSecurity("Admin", "SCAN_TRACKING", `สแกนเลขพัสดุ AI พบ ${parsedData.length} รายการ`);
              
              return ContentService.createTextOutput(JSON.stringify({ status: "success", data: parsedData })).setMimeType(ContentService.MimeType.JSON);
          } else {
              // 🚨 คาย Error จริงๆ จาก Google ออกมาให้เห็นชัดๆ จะได้รู้ว่าบั๊กที่อะไร
              let errorMsg = json.error ? json.error.message : "ไม่มีการตอบกลับจาก AI";
              return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Google AI Error: " + errorMsg })).setMimeType(ContentService.MimeType.JSON);
          }
      } catch (err) {
          return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "เกิดข้อผิดพลาดในระบบ: " + err.message })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return outputJson({status: 'error', message: 'ไม่พบ Action'});
  } catch (e) { 
    return outputJson({status: 'error', message: 'Backend Error: ' + e.message}); 
  }
}

// ==========================================
// 4. สคริปต์อัตโนมัติ (Triggers)
// ==========================================
function monthlyFixedResetPoints() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const uSheet = ss.getSheetByName("Users");
  const uData = uSheet.getDataRange().getValues(); 
  let resetCount = 0;
  for (let i = 1; i < uData.length; i++) {
    if (uData[i][6] !== 'admin' && parseFloat(uData[i][4]) > 0) {
      uSheet.getRange(i + 1, 5).setValue(0);
      resetCount++;
    }
  }
  logSecurity("SYSTEM", "MONTHLY_RESET", "ล้างแต้มทั้งหมด " + resetCount + " บัญชี");
}

function forceAuth() {
  // ฟังก์ชันนี้มีไว้เพื่อหลอกให้ Google Apps Script เด้งหน้าต่างขอสิทธิ์ออกอินเทอร์เน็ตค่ะ
  UrlFetchApp.fetch("https://www.google.com");
}
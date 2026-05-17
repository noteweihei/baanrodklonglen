// =========================================
// 🛒 ระบบหลังบ้าน: ร้านค้ารถของเล่น (Shop Backend - แก้ไขปัญหาหมวดหมู่แยกส่วน)
// =========================================
// 🚨 ลบการฝัง API Key ตรงๆ ออกแล้ว เปลี่ยนไปดึงจาก Script Properties เพื่อป้องกันการโดนแบน 100%
const SHEET_NAME = "Products";
const REWARD_SPREADSHEET_ID = "14mjuczTso0zyCGqIG37yO9TnlBr_smili7Aec5Ashz4"; 

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let result = {};

    if (data.action === 'generateSEO') result = generateSEOWithGemini(data.name, data.category);
    else if (data.action === 'analyzeImageAI') result = analyzeImageWithGemini(data.image, data.category);
    else if (data.action === 'aiChat') result = aiAssistantChat(data.message);
    else if (data.action === 'supportChat') result = aiSupportChat(data.message);
    else if (data.action === 'addProduct') result = addProduct(data);
    else if (data.action === 'editProduct') result = editProduct(data);
    else if (data.action === 'deleteProduct') result = deleteProduct(data);
    else if (data.action === 'checkoutShop') result = checkoutShop(data);
    else if (data.action === 'bulkUpdateShopOrder') {
      const shopSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Shop_Orders");
      for (let i = 0; i < data.rowIndices.length; i++) {
          shopSheet.getRange(data.rowIndices[i], 7).setValue(data.status);
      }
      result = {status: 'success'};
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (action === 'getShopSettings') {
    // 💡 แก้ไข: ให้พุ่งไปดึงข้อมูลหมวดหมู่จาก "ชีตฐานข้อมูลหลัก (REWARD_SPREADSHEET)" เสมอ
    const rewardSS = SpreadsheetApp.openById(REWARD_SPREADSHEET_ID);
    const sSheet = rewardSS.getSheetByName("Settings");
    if (!sSheet) return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: {} })).setMimeType(ContentService.MimeType.JSON);
    
    const sData = sSheet.getDataRange().getValues();
    let settings = {};
    for (let i = 1; i < sData.length; i++) {
      if (sData[i][0]) settings[sData[i][0]] = sData[i][1];
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: settings })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'getProducts') return ContentService.createTextOutput(JSON.stringify(getProducts())).setMimeType(ContentService.MimeType.JSON);
  if (action === 'getShopOrders') {
    try {
      const shopSheet = ss.getSheetByName("Shop_Orders");
      const sData = shopSheet ? shopSheet.getDataRange().getDisplayValues() : [];
      const rewardSS = SpreadsheetApp.openById(REWARD_SPREADSHEET_ID);
      const uSheet = rewardSS.getSheetByName("Users");
      const uData = uSheet ? uSheet.getDataRange().getDisplayValues() : [];

      const userMap = {};
      for(let j = 1; j < uData.length; j++){
          let phone = uData[j][0] ? uData[j][0].toString().replace(/['"<>]/g, "").trim() : "";
          userMap[phone] = { name: uData[j][1], address: uData[j][2], zip: uData[j][3] };
      }

      let shopOrders = [];
      for(let i = 1; i < sData.length; i++) {
          let oId = sData[i][1] ? sData[i][1].toString().replace(/['"<>]/g, "").trim() : "";
          if (!oId) continue; 
          let p = sData[i][2] ? sData[i][2].toString().replace(/['"<>]/g, "").trim() : "";
          let uInfo = userMap[p] || {};

          shopOrders.push({
              rowIndex: i + 1, timestamp: sData[i][0] || '-', orderId: oId, phone: p, name: sData[i][3] || uInfo.name || 'ไม่ระบุ',
              address: uInfo.address || 'ไม่ระบุที่อยู่', zipcode: uInfo.zip || '', detail: sData[i][4] || '-', total: parseFloat(sData[i][5] || 0),
              status: sData[i][6] || 'Pending', rawJson: sData[i][7] || '[]', slipBase64: sData[i][8] || '' 
          });
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: shopOrders.reverse() })).setMimeType(ContentService.MimeType.JSON);
    } catch (error) { return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON); }
  }

  return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Invalid Action"})).setMimeType(ContentService.MimeType.JSON);
}

// 🤖 ฟังก์ชัน AI Scanner อัจฉริยะ 
function analyzeImageWithGemini(base64Image) {
  const rewardSS = SpreadsheetApp.openById(REWARD_SPREADSHEET_ID);
  const sSheet = rewardSS.getSheetByName("Settings") || rewardSS.insertSheet("Settings");
  const sData = sSheet.getDataRange().getValues();
  
  let categories = "ทั่วไป, รถญี่ปุ่น, รถอเมริกัน, รถยุโรป, รถแฟนตาซี, รถในหนัง, การ์ดเกม";
  let catRowIndex = -1;
  
  for (let i = 1; i < sData.length; i++) {
    if (sData[i][0] === 'categories') { 
      categories = sData[i][1] || categories; 
      catRowIndex = i + 1;
      break; 
    }
  }

  const base64Data = base64Image.split(',')[1];
  const prompt = `วิเคราะห์ภาพรถของเล่นหรือสินค้านี้ เพื่อดึงข้อมูลดังนี้:
  1. ชื่อรุ่น (Name): ระบุชื่อรุ่นรถให้ถูกต้องแม่นยำ
  2. หมวดหมู่ (Category): เลือกหมวดหมู่ที่ตรงที่สุดจากรายการนี้ [${categories}] แต่ถ้าคุณวิเคราะห์แล้วพบว่ามันคือรถประเภทอื่น หรือของเล่นหมวดหมู่อื่นที่ไม่มีในรายการ ให้คุณ "สร้างชื่อหมวดหมู่ใหม่" ที่กระชับ ตรงประเภทที่สุดขึ้นมาได้เลย!
  3. คำอธิบาย (Description): เขียนรายละเอียดสินค้าให้น่าซื้อสไตล์นักสะสม
  ตอบเป็น JSON เท่านั้น: {"name": "...", "category": "...", "description": "..."}`;
  const payload = { "contents": [{ "parts": [ {"text": prompt}, {"inline_data": {"mime_type": "image/jpeg", "data": base64Data}} ] }], "generationConfig": { "response_mime_type": "application/json" } };
  const resData = callGeminiAPI(payload, true); 
  
  let aiCategory = (resData.category || "ทั่วไป").trim();
  if (aiCategory) {
      let catList = categories.split(',').map(c => c.trim()).filter(c => c !== "");
      let isExist = catList.some(c => c.toLowerCase() === aiCategory.toLowerCase());
      
      if (!isExist) {
          catList.push(aiCategory);
          let updatedCategories = catList.join(", ");
          if (catRowIndex !== -1) {
              sSheet.getRange(catRowIndex, 2).setValue(updatedCategories);
          } else {
              if (sSheet.getLastRow() === 0) sSheet.appendRow(["Key", "Value"]);
              sSheet.appendRow(["categories", updatedCategories]);
          }
      }
  }

  return { status: "success", data: resData };
}

function aiAssistantChat(userMessage) {
  const products = getProducts().data;
  const productContext = products.map(p => `- รหัส [${p.id}]: ${p.name} ราคา ${p.retail_price}฿, สต็อก ${p.stock} คัน`).join("\n");
  const manual = `คู่มือร้าน:\n1. สมัครสมาชิกฟรี\n2. โอนปกติ 40 บาท เก็บปลายทาง 50 บาท พื้นที่ห่างไกล +20 บาท\n3. สะสมแต้มแลกของหรือสุ่มกาชาได้`;
  const prompt = `คุณคือ AI ผู้ช่วยแอดมินร้าน "บ้านรถของเล่น" มีหน้าที่ตอบคำถามลูกค้า\nสต็อกสินค้าตอนนี้:\n${productContext}\nคู่มือร้าน:\n${manual}\nคำถามลูกค้า: "${userMessage}"\nคำสั่ง: ตอบคำถามอย่างสุภาพ น่ารัก เป็นมิตร (ใช้ Emoji ได้) ไม่ต้องใช้ Markdown\n🚨 กฎบังคับสูงสุด: เมื่อคุณแนะนำสินค้าให้ลูกค้า ให้คุณสร้างปุ่มกด HTML นี้ "ต่อท้าย" ข้อความเสมอ โดยแทนที่คำว่า 'รหัสสินค้า' ด้วยรหัสในวงเล็บก้ามปู ของสินค้านั้นๆ:\n<br><br><button class="btn btn-sm btn-success fw-bold shadow-sm w-100 mt-2 py-2" onclick="viewProductFromChat('รหัสสินค้า')"><i class="fas fa-search me-1"></i> ดูรายละเอียดและสั่งซื้อ</button>`;
  const payload = { "contents": [{"parts":[{"text": prompt}]}] }; 
  const answer = callGeminiAPI(payload); 
  return { status: "success", answer: answer };
}

function generateSEOWithGemini(productName, category) {
  const prompt = `ช่วยเขียนคำอธิบายสินค้ารุ่น "${productName}" หมวดหมู่ "${category}" เพื่อดึงดูดนักสะสม ความยาว 3-4 บรรทัด (ใช้ภาษาไทย ไม่ต้องมี Markdown)`;
  const text = callGeminiAPI({ "contents": [{"parts":[{"text": prompt}]}] }); 
  return { status: "success", text: text };
}

function aiSupportChat(userMessage) {
  const prompt = `วิเคราะห์ข้อความต่อไปนี้ หากเป็นการบ่น แนะนำ หรือติชม ให้ถือว่าเป็น Feedback ตอบกลับเป็น JSON: {"reply": "ตอบลูกค้าสุภาพๆ", "isFeedback": true/false, "analysis": "สรุปใจความสำคัญ(ถ้ามี)"}`;
  const payload = { "contents": [{"parts":[{"text": prompt + "\nข้อความ: " + userMessage}]}], "generationConfig": { "response_mime_type": "application/json" } };
  const aiData = callGeminiAPI(payload, true);
  if (aiData.isFeedback) { const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Feedback") || SpreadsheetApp.getActiveSpreadsheet().insertSheet("Feedback"); sheet.appendRow([new Date(), userMessage, aiData.analysis]);
  }
  return { status: "success", answer: aiData.reply, isFeedback: aiData.isFeedback };
}

// 💡 อัปเกรด: ฟังก์ชันสื่อสารกับ AI แบบไขตู้เซฟ (ไม่โดนแบน 100%)
function callGeminiAPI(payload, isJsonMode = false) {
  // ดึง API Key จาก Script Properties แทนการแปะรหัสลงไปตรงๆ
  const API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!API_KEY) throw new Error("ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Script Properties หลังบ้านของร้านค้า");

  const models = ["gemini-1.5-flash", "gemini-2.5-flash"]; const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    for (let m = 0; m < models.length; m++) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${models[m]}:generateContent?key=${API_KEY}`;
      const options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload), "muteHttpExceptions": true };
      try {
        const response = UrlFetchApp.fetch(url, options); const responseCode = response.getResponseCode();
        const json = JSON.parse(response.getContentText());
        if (responseCode === 200 && json.candidates && json.candidates.length > 0) { let text = json.candidates[0].content.parts[0].text;
        return isJsonMode ? JSON.parse(text) : text.trim(); }
        if (responseCode === 503 || responseCode === 429) continue;
        if (json.error) throw new Error(json.error.message);
      } catch (err) { }
    }
    if (attempt < maxRetries) Utilities.sleep(attempt * 2000);
  }
  throw new Error("ระบบ AI ไม่ว่างชั่วคราว");
}

function getProducts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) ||
  SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
  const data = sheet.getDataRange().getDisplayValues();
  const products = [];
  for (let i = 1; i < data.length; i++) {
    products.push({
      id: data[i][0], sku: data[i][1], name: data[i][2], category: data[i][3],
      retail_price: parseFloat((data[i][4] || 0).toString().replace(/,/g, '')),
      wholesale_price: parseFloat((data[i][5] || 0).toString().replace(/,/g, '')),
      stock: parseInt((data[i][6] || 0).toString().replace(/,/g, '')),
      desc: data[i][7], image: data[i][8],
      variants: data[i][9] || "" 
    });
  }
  return { status: "success", data: products };
}

function addProduct(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.appendRow(["P" + new Date().getTime(), data.sku, data.name, data.category, data.retail_price, data.wholesale_price, data.stock, data.desc, data.image, data.variants]);
  return { status: "success" };
}

function editProduct(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.id) { 
      const r = i + 1;
      sheet.getRange(r, 2).setValue(data.sku); sheet.getRange(r, 3).setValue(data.name); 
      sheet.getRange(r, 4).setValue(data.category); sheet.getRange(r, 5).setValue(data.retail_price); 
      sheet.getRange(r, 6).setValue(data.wholesale_price); sheet.getRange(r, 7).setValue(data.stock); 
      sheet.getRange(r, 8).setValue(data.desc);
      sheet.getRange(r, 10).setValue(data.variants);
      if (data.image) sheet.getRange(r, 9).setValue(data.image);
      return { status: "success" };
    }
  }
  return { status: "error", message: "ไม่พบสินค้า" };
}

function deleteProduct(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) { if (values[i][0] === data.id) { sheet.deleteRow(i + 1);
  return { status: "success" }; } }
  return { status: "error", message: "ไม่พบสินค้า" };
}

function checkoutShop(data) {
  const shopSS = SpreadsheetApp.getActiveSpreadsheet();
  const productSheet = shopSS.getSheetByName(SHEET_NAME);
  const orderSheet = shopSS.getSheetByName("Shop_Orders") ||
  shopSS.insertSheet("Shop_Orders");
  const rewardSS = SpreadsheetApp.openById(REWARD_SPREADSHEET_ID);
  const mainOrderSheet = rewardSS.getSheetByName("Orders"); 
  const productData = productSheet.getDataRange().getValues();
  
  let totalPrice = 0;
  let receiptItems = []; let updates = [];
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    for (let item of data.items) {
      let currentProduct = null;
      let productRow = -1;
      for (let i = 1; i < productData.length; i++) {
        if (productData[i][0] == item.id) { productRow = i + 1;
        currentProduct = productData[i]; break; }
      }
      if (!currentProduct) throw new Error("ไม่พบรหัสสินค้า (ID): " + item.id);
      let stock = parseInt((currentProduct[6] || 0).toString().replace(/,/g, '')); 
      let price = parseFloat((currentProduct[4] || 0).toString().replace(/,/g, ''));
      if (stock < item.qty) throw new Error(`สต๊อก ${currentProduct[2]} ไม่เพียงพอ`);

      let subtotal = price * item.qty; totalPrice += subtotal;
      let variantText = item.variant ?
      ` (${item.variant})` : "";
      let finalName = currentProduct[2] + variantText;
      receiptItems.push({ id: item.id, sku: item.sku, name: finalName, qty: item.qty, subtotal: subtotal });
      updates.push({ row: productRow, newStock: stock - item.qty });
    }

    updates.forEach(u => { productSheet.getRange(u.row, 7).setValue(u.newStock); });
    let isFreeShip = totalPrice >= 300; let shippingFee = 0;
    if (data.payMethod === 'transfer') shippingFee = isFreeShip ?
    0 : 40;
    else if (data.payMethod === 'cod') shippingFee = 50;
    
    let remoteFee = data.isRemote ? 20 : 0;
    let backendTotalShipping = shippingFee + remoteFee; let finalPrice = totalPrice + backendTotalShipping;
    
    let methodText = data.payMethod === 'transfer' ?
    `โอนเงิน (เวลา: ${data.transferTime})` : "เก็บเงินปลายทาง (COD)";
    let orderDetailText = receiptItems.map(i => i.name + " (x" + i.qty + ")").join("\n") + "\n\n📦 [" + methodText + "] ค่าส่ง ฿" + backendTotalShipping;
    const orderId = new Date().getTime().toString();
    const rawJson = JSON.stringify(receiptItems); 
    let initialStatus = data.payMethod === 'transfer' ? "รอตรวจสอบสลิป" : "รอจัดส่ง";
    let slipData = data.slipBase64 ? "data:image/jpeg;base64," + data.slipBase64 : "";
    
    orderSheet.appendRow([ new Date(), orderId, "'" + data.phone, data.name, orderDetailText, finalPrice, initialStatus, rawJson, slipData ]);
    mainOrderSheet.appendRow([ Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss"), orderId, data.name, "'" + data.phone, "🛒 หน้าร้าน", finalPrice, 0, initialStatus, orderDetailText ]);

    return { status: "success", orderId: orderId, productTotal: totalPrice, shippingTotal: backendTotalShipping, finalTotal: finalPrice, receiptItems: receiptItems };
  } catch (err) { return { status: "error", message: err.message }; } finally { lock.releaseLock(); }
}

function doOptions(e) { return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}
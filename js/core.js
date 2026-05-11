// ==========================================
// 1. ระบบพื้นฐาน & ตัวแปร Global
// ==========================================
let currentLang = localStorage.getItem('siteLang') || 'th';
const EX_RATE = 35; // 1 USD = 35 THB
const POINT_VAL = 10; // 1 แต้ม = 10 บาท
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let notifications = [];
let lastReadTime = localStorage.getItem('lastNotiReadTime') || 0;

const remoteZipCodes = ['50240', '81150', '94110', '94120', '95110', '95170', '96110', '96120', '96130', '96140', '96150', '96160', '96190'];

// ==========================================
// 2. ระบบแปลภาษา (i18n) - ฉบับสมบูรณ์ครบทุกหน้า
// ==========================================
const dict = {
    'th': {
        // --- Navbar ---
        'nav_reward': '🎁 รางวัล & กล่องสุ่ม',
        'nav_home': '🛍️ แลกของรางวัลปกติ',
        'nav_shop': '🛒 สั่งซื้อสินค้า',
        'nav_gacha': '📦 กล่องสุ่มสิทธิพิเศษ',
        'nav_order': 'ขอรับแต้ม',
        'nav_terms': 'เงื่อนไข/ค่าส่ง',
        'nav_contact': 'ติดต่อเรา',
        'nav_dashboard': 'แดชบอร์ด',
        'nav_login': 'เข้าสู่ระบบ',
        'nav_logout': 'ออกระบบ',
        'nav_admin': '⚙️ หลังบ้าน',
        'points': 'แต้ม',
        
        // --- หน้าแรก (Home) ---
        'home_title': '🎁 แลกของรางวัลปกติ',
        'stock': 'สต็อก: {n} ชิ้น',
        'redeem_btn': '🎁 แลกของรางวัลเลย',
        'out_of_stock': '❌ สินค้าหมด',
        
        // --- หน้า Gacha ---
        'gacha_title': '📦 สุ่มการ์ดสิทธิพิเศษ',
        'gacha_subtitle': 'ลุ้นรับรถสุดแรร์! (ใช้ {n} แต้ม / ครั้ง)',
        'spin_1': '✨ สุ่ม 1 ครั้ง',
        'spin_10': '🚀 สุ่ม 10 ครั้ง',
        'reward_in_box': '🏆 รางวัลในตู้นี้',
        'pity_alert': '🎯 การันตีที่: {n} (สุ่มไปแล้ว: {m})',
        'gacha_noti_title': '📢 ประกาศผลดรอปล่าสุด',
        'realtime': 'อัปเดตแบบเรียลไทม์',
        'pts_back': 'คืนแต้ม',
        'consolation': 'รางวัลปลอบใจ',

        // --- หน้าแจ้งยอด (Order) ---
        'order_title': 'แจ้งยอดโอน / สะสมแต้ม',
        'order_sub': 'กรุณากรอกข้อมูลให้ครบถ้วนเพื่อให้แอดมินตรวจสอบได้รวดเร็ว',
        'channel_label': '🛒 สั่งซื้อผ่านช่องทางไหน?',
        'order_id_label': '🧾 หมายเลขคำสั่งซื้อ (Order ID)',
        'amount_label': '💰 ยอดเงินสุทธิ (ไม่รวมค่าส่ง)',
        'submit_order': '🚀 ยืนยันการแจ้งยอด',
        
        // --- หน้า Dashboard ลูกค้า ---
        'dash_title': '👤 แดชบอร์ดของฉัน',
        'dash_expiry': '⏰ แต้มหมดอายุ: {d}',
        'dash_info': '✏️ ข้อมูลส่วนตัว (อัปเดตใหม่)',
        'dash_history': '📊 ประวัติแจ้งยอด',
        'dash_reward': '🎁 ประวัติการรับของรางวัล',
        'save_info': 'บันทึกข้อมูลใหม่',
        'table_no': '#',
        'table_date': 'วันที่',
        'table_channel': 'ช่องทาง',
        'table_amount': 'ยอด',
        'table_points': 'แต้มที่ได้',
        'table_status': 'สถานะ',
        'table_product': 'สินค้า',
        'table_action': 'จัดการ',
        'no_history': 'ไม่มีประวัติ',
        'cancel_btn': 'ยกเลิกของ',
        'show_rows': 'แสดง:',

        // --- หน้าติดต่อเรา ---
        'contact_title': '📞 ช่องทางติดต่อสะดวกสุด ๆ',
        'contact_phone': '📱 โทร:',
        'contact_line': '🟢 LINE:',
        'contact_line_btn': 'คลิกแอดไลน์ที่นี่',
        'contact_fb': '📘 Facebook:',
        'contact_tk': '🎵 TikTok:',
        'contact_follow': '📍 กดติดตามเพจไว้เลย จะได้ไม่พลาดของเข้าใหม่! 🚗✨',

        // --- หน้าเงื่อนไข (Terms) ---
        'terms_title': 'ประกาศข้อกำหนดและเงื่อนไขฉบับสมบูรณ์',
        'terms_sub': 'กรุณาอ่านและทำความเข้าใจเพื่อผลประโยชน์ของตัวท่านเอง',
        't1_head': '1. การสะสมและ "วันหมดอายุแต้ม"',
        't1_1': 'ทุกยอดสั่งซื้อ <b>{base} บาท</b> จะได้รับ <b>{rate} แต้ม</b> (คำนวณจากยอดสุทธิที่ชำระจริง ไม่รวมค่าส่ง)',
        't1_2': '🚨 แต้มทั้งหมดจะถูกรีเซ็ตเป็น 0 อัตโนมัติ ใน "วันที่ 1 ของทุกเดือน เวลา 00:00 น."',
        't1_3': 'ลูกค้าต้องใช้แต้มแลกของหรือสุ่มกาชาให้หมด <u>ก่อนเที่ยงคืนของวันสิ้นเดือน</u> หากพ้นกำหนด ระบบจะไม่สามารถกู้คืนแต้มให้ได้ในทุกกรณี',
        't1_4': 'หากตรวจพบ <b>การทุจริต ปลอมแปลงสลิป หรือใช้สลิปซ้ำ</b> ร้านจะระงับบัญชีถาวร และแจ้งความดำเนินคดีฐานฉ้อโกงและ พ.ร.บ. คอมพิวเตอร์ ทันที',
        't2_head': '2. กฎเฉพาะ "การเก็บเงินปลายทาง (COD)"',
        't2_1': 'การขอรับแต้มสำหรับออเดอร์ COD จะทำได้ <b>"หลังจากเซ็นรับพัสดุและชำระเงินกับพนักงานขนส่งสำเร็จแล้วเท่านั้น"</b>',
        't2_2': 'แอดมินจะอนุมัติแต้มเมื่อเช็คในระบบขนส่งว่าสถานะคือ "จัดส่งสำเร็จและยอดเงินเข้าระบบ"',
        't2_3': '🚫 บทลงโทษขั้นเด็ดขาด: หากสั่งแบบ COD แล้ว "ปฏิเสธการรับพัสดุ ปล่อยให้ของตีกลับ หรือติดต่อไม่ได้" ทางร้านจะ <u>ระงับบัญชี (Blacklist) ยึดแต้มสะสมทั้งหมด และอาจเรียกร้องค่าเสียหายสำหรับค่าจัดส่งที่เกิดขึ้น</u>',
        't3_head': '3. กฎเหล็กการแลกรางวัล และ สุ่มกาชา',
        't3_1': 'รายการที่กดยืนยันแลกสินค้า หรือหมุนกาชาไปแล้ว <b>ถือเป็นที่สิ้นสุด ไม่สามารถกดยกเลิกเพื่อขอคืนแต้มได้ด้วยตนเอง</b>',
        't3_2': '✅ ข้อยกเว้นการคืนแต้ม: ทางร้านจะทำการยกเลิกรายการและ <u class="fw-bold">"คืนแต้มให้เต็มจำนวน"</u> เฉพาะในกรณีที่เกิดข้อผิดพลาดจากทางระบบ แอดมินตรวจสอบผิดพลาด หรือสต็อกสินค้าขัดข้อง (ไม่มีของจัดส่ง) เท่านั้น',
        't3_3': '⏱️ สำคัญ: ลูกค้าต้องทัก LINE เพื่อชำระค่าส่งหรือยืนยันรับของ "ภายใน 48 ชั่วโมง" หลังจากกดแลกรางวัล<br><span class="text-dark fw-normal">หากไม่ติดต่อมาภายในเวลาที่กำหนด แอดมินจะกดยกเลิกรายการโดยถือว่า <b>"สละสิทธิ์"</b> (ยึดแต้มทั้งหมด และนำของรางวัลกลับเข้าสต็อกทันที)</span>',
        't3_4': 'ของรางวัลมีค่าจัดส่งแยกต่างหาก: <b>โอนปกติ (EMS) 40 บาท / เก็บปลายทาง (COD) 50 บาท</b> (พื้นที่ห่างไกล +20 บาท)',
        't4_head': '4. สิทธิ์ขาดของทางร้าน',
        't4_1': 'ทางร้านขอสงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไข อัตราการแลกแต้ม หรือของรางวัล โดยไม่ต้องแจ้งให้ทราบล่วงหน้า',
        't4_2': 'คำตัดสินของแอดมินถือเป็นที่สิ้นสุด',

        // --- ศูนย์ช่วยเหลือ (Help Center) ---
        'help_center': 'ศูนย์ช่วยเหลือ & แนะนำ',
        'help_select': 'เลือกหัวข้อที่ต้องการความช่วยเหลือ:',
        'help_how_to': 'วิธีใช้งานแอปพื้นฐาน',
        'help_gacha_rule': 'กฎการสุ่มกาชา',
        'help_feedback': 'ส่งข้อเสนอแนะให้แอดมิน',
        'help_back': 'ย้อนกลับ',
        'help_submit': 'ส่งข้อมูล',
        'help_cancel': 'ยกเลิก',
        'help_placeholder': 'พิมพ์รายละเอียด...',

        'h1_head': '1. วิธีแจ้งยอดและสะสมแต้ม',
        'h1_rate': '<b>💡 อัตราสะสมแต้ม:</b> ยอดซื้อ 100 บาท = 10 แต้ม<br><span class="text-muted">(คำนวณจากยอดค่าสินค้าเท่านั้น ไม่รวมค่าส่ง)</span>',
        'h1_step': 'สเต็ปการกรอกฟอร์มแจ้งยอด:',
        'h1_s1': 'ไปที่เมนู <b>"แจ้งยอดโอน"</b> ด้านบน',
        'h1_s2': '<b>เลือกช่องทางสั่งซื้อ:</b> เช่น Facebook, LINE, Shopee, TikTok หรือ หน้าร้าน',
        'h1_s3': '<b>กรอกหมายเลขคำสั่งซื้อ (Order ID):</b> ดูจากสลิปหรือใบปะหน้ากล่อง',
        'h1_s4': '<b>กรอกยอดเงินสุทธิ:</b> <span class="text-success fw-bold">(ระบบจะคำนวณและเติมแต้มให้อัตโนมัติ)</span>',
        'h1_s5': 'กด <b>"ยืนยันการแจ้งยอด"</b> แล้วรอแอดมินอนุมัติแต้ม',
        
        'h2_head': '2. วิธีแลกของรางวัลปกติ',
        'h2_1': 'ไปที่ <b>"หน้าแรก"</b> เลือกรถที่ชอบแล้วกดปุ่มแลกของ',
        'h2_2': 'ระบบจะตัดแต้มทันที <u>แลกแล้วไม่สามารถคืนแต้มได้ทุกกรณีครับ</u>',
        
        'h3_head': '3. การรับของ & ค่าจัดส่ง',
        'h3_1': 'เมื่อแลกของสำเร็จ <b>ต้องทัก LINE ร้าน ภายใน 48 ชม.</b> เพื่อยืนยันสิทธิ์',
        'h3_2': '<b>เรทค่าส่งของรางวัล:</b> โอนปกติ 40฿ / เก็บปลายทาง 50฿ <small class="text-danger">(พื้นที่ห่างไกล +20฿)</small>',
        
        'h4_head': '4. กฎการล้างแต้มรายเดือน (สำคัญมาก)',
        'h4_1': 'ระบบจะล้างแต้มทุกคนเป็น 0 "ทุกวันที่ 1 ของเดือน" อย่าลืมใช้ให้หมดนะครับ!',

        'g1_head': 'กฎการสุ่มกาชา (สิทธิพิเศษ)',
        'g1_1': '<b>การสุ่ม:</b> หักแต้มทันที <i>กดแล้วห้ามขอคืนแต้มทุกกรณี</i>',
        'g1_2': '<b>กรณีได้รถ:</b> แคปหน้าจอ <b>ทัก LINE ร้านภายใน 48 ชม.</b> เพื่อยืนยันสิทธิ์',
        'g1_3': '<b>กรณีได้แต้ม:</b> ระบบจะบวกโบนัสแต้มเข้ากระเป๋าอัตโนมัติ',
        'g2_head': 'ระบบการันตี (Pity System)',
        'g2_1': 'รถแรร์บางคันมี "การันตี" สุ่มถึงเป้าแจกทันที 100%!',

        // --- ระบบล็อกอิน / UI กลาง ---
        'auth_login_title': 'เข้าสู่ระบบ',
        'auth_reg_title': '📝 สมัครสมาชิกใหม่',
        'phone_ph': '📞 เบอร์โทรศัพท์ 10 หลัก (ID)',
        'pass_ph': '🔑 รหัสผ่าน',
        'btn_login': 'เข้าสู่ระบบ',
        'btn_reg': 'ลงทะเบียน',
        'no_acc': 'ยังไม่มีบัญชี? สมัครสมาชิกใหม่ที่นี่',
        'has_acc': 'มีบัญชีแล้ว? กลับไปเข้าสู่ระบบ',
        'fname': 'ชื่อ', 'lname': 'นามสกุล',
        'addr': 'บ้านเลขที่ / หมู่ / ซอย / ถนน',
        'subdist': 'ตำบล/แขวง', 'dist': 'อำเภอ/เขต', 'prov': 'จังหวัด', 'zip': 'รหัสไปรษณีย์',
        
        'processing': 'กำลังประมวลผล...',
        'success': 'สำเร็จ',
        'error': 'ผิดพลาด',
        'login_success': 'เข้าสู่ระบบเรียบร้อยแล้ว',
        'logout_confirm': 'ออกจากระบบ?',
        'btn_yes': 'ใช่, ออกจากระบบ',
        'btn_cancel': 'ยกเลิก',
        'remote_fee': 'รหัสนี้อยู่ในพื้นที่ห่างไกล (บวกค่าส่งเพิ่ม 20฿)',
        'normal_fee': 'พื้นที่จัดส่งปกติ'
    },
    'en': {
        // --- Navbar ---
        'nav_reward': '🎁 Rewards & Gacha',
        'nav_home': '🛍️ Normal Rewards',
        'nav_shop': '🛒 Shop',
        'nav_gacha': '📦 Special Gacha',
        'nav_order': 'Claim Points',
        'nav_terms': 'Terms / Shipping',
        'nav_contact': 'Contact Us',
        'nav_dashboard': 'Dashboard',
        'nav_login': 'Login',
        'nav_logout': 'Logout',
        'nav_admin': '⚙️ Admin',
        'points': 'Pts',
        
        // --- Home ---
        'home_title': '🎁 Normal Rewards Exchange',
        'stock': 'Stock: {n} pcs',
        'redeem_btn': '🎁 Redeem Now',
        'out_of_stock': '❌ Out of Stock',
        
        // --- Gacha ---
        'gacha_title': '📦 Special Gacha Cards',
        'gacha_subtitle': 'Win rare cars! ({n} Pts / spin)',
        'spin_1': '✨ Spin 1 Time',
        'spin_10': '🚀 Spin 10 Times',
        'reward_in_box': '🏆 Rewards in this box',
        'pity_alert': '🎯 Guarantee at: {n} (Spins: {m})',
        'gacha_noti_title': '📢 Latest Drop Results',
        'realtime': 'Real-time Updates',
        'pts_back': 'Pts Back',
        'consolation': 'Consolation',

        // --- Order ---
        'order_title': 'Submit Order / Earn Pts',
        'order_sub': 'Please fill in correctly for quick verification.',
        'channel_label': '🛒 Order Channel?',
        'order_id_label': '🧾 Order ID',
        'amount_label': '💰 Net Amount (Excluding Shipping)',
        'submit_order': '🚀 Submit Order',

        // --- Dashboard ---
        'dash_title': '👤 My Dashboard',
        'dash_expiry': '⏰ Pts Expiry: {d}',
        'dash_info': '✏️ Personal Info',
        'dash_history': '📊 Order History',
        'dash_reward': '🎁 Reward History',
        'save_info': 'Save Changes',
        'table_no': '#',
        'table_date': 'Date',
        'table_channel': 'Channel',
        'table_amount': 'Amount',
        'table_points': 'Pts Earned',
        'table_status': 'Status',
        'table_product': 'Product',
        'table_action': 'Action',
        'no_history': 'No history',
        'cancel_btn': 'Cancel',
        'show_rows': 'Show:',

        // --- Contact ---
        'contact_title': '📞 Contact Us',
        'contact_phone': '📱 Phone:',
        'contact_line': '🟢 LINE:',
        'contact_line_btn': 'Click to Add LINE',
        'contact_fb': '📘 Facebook:',
        'contact_tk': '🎵 TikTok:',
        'contact_follow': '📍 Follow our page so you don\'t miss new arrivals! 🚗✨',

        // --- Terms ---
        'terms_title': 'Full Terms & Conditions',
        'terms_sub': 'Please read and understand for your own benefit.',
        't1_head': '1. Points Accumulation & "Expiry Date"',
        't1_1': 'Every <b>{base} THB</b> spent earns <b>{rate} Pts</b> (Calculated from net amount, excluding shipping).',
        't1_2': '🚨 All points will be automatically reset to 0 on the "1st of every month at 00:00 AM".',
        't1_3': 'Customers must use all points to redeem rewards or gacha <u>before midnight of the last day of the month</u>. Expired points cannot be recovered.',
        't1_4': 'If <b>fraud, slip forgery, or slip reuse</b> is detected, the account will be permanently banned and legal action will be taken.',
        't2_head': '2. "Cash on Delivery (COD)" Rules',
        't2_1': 'Requesting points for COD orders can only be done <b>"after successfully receiving the parcel and paying the courier"</b>.',
        't2_2': 'Admin will approve points upon verifying the delivery status is "Delivered".',
        't2_3': '🚫 Penalty: If you order COD and "refuse the parcel or become unreachable", your account will be <u>Blacklisted, all points forfeited, and shipping damages claimed</u>.',
        't3_head': '3. Reward Redemption & Gacha Rules',
        't3_1': 'Confirmed redemptions or gacha spins are <b>final. You cannot cancel to get points back on your own</b>.',
        't3_2': '✅ Exception: The shop will cancel and <u class="fw-bold">"fully refund points"</u> only if there is a system error, admin mistake, or stock error.',
        't3_3': '⏱️ Important: Customers must contact LINE to pay shipping or confirm receipt "within 48 hours" after redeeming.<br><span class="text-dark fw-normal">If no contact is made, the admin will cancel the item as <b>"Forfeited"</b> (Points seized and reward returned to stock).</span>',
        't3_4': 'Rewards have a separate shipping fee: <b>Transfer (EMS) 40 THB / COD 50 THB</b> (Remote area +20 THB).',
        't4_head': '4. Shop Rights',
        't4_1': 'The shop reserves the right to change terms, point rates, or rewards without prior notice.',
        't4_2': 'Admin decisions are final.',

        // --- Help Center ---
        'help_center': 'Help Center & Feedback',
        'help_select': 'Select a help topic:',
        'help_how_to': 'Basic App Guide',
        'help_gacha_rule': 'Gacha Rules',
        'help_feedback': 'Send Feedback to Admin',
        'help_back': 'Back',
        'help_submit': 'Submit',
        'help_cancel': 'Cancel',
        'help_placeholder': 'Type your message...',

        'h1_head': '1. How to Submit Order & Earn Pts',
        'h1_rate': '<b>💡 Earn Rate:</b> 100 THB spent = 10 Pts',
        'h1_step': 'Steps to submit order:',
        'h1_s1': 'Go to the <b>"Submit Order"</b> menu above.',
        'h1_s2': '<b>Select Channel:</b> e.g., Facebook, LINE, Shopee, TikTok, or Store.',
        'h1_s3': '<b>Enter Order ID:</b> Find it on slip or parcel label.',
        'h1_s4': '<b>Enter Net Amount:</b> System auto adds Pts.',
        'h1_s5': 'Click <b>"Submit Order"</b> and wait for admin approval.',
        
        'h2_head': '2. Normal Reward Redemption',
        'h2_1': 'Go to <b>"Normal Rewards"</b>, select a car, and click redeem.',
        'h2_2': 'Points are deducted immediately. <u>Points cannot be refunded.</u>',
        
        'h3_head': '3. Receiving & Shipping',
        'h3_1': 'When you get a car, <b>you must contact LINE within 48 hrs</b> to claim it.',
        'h3_2': '<b>Shipping Rates:</b> Transfer 40฿ / COD 50฿ <small class="text-danger">(Remote Zipcode +20฿)</small>',
        
        'h4_head': '4. Monthly Point Reset (Important)',
        'h4_1': 'All points are reset to 0 on the "1st of every month". Use them!',

        'g1_head': 'Gacha Rules',
        'g1_1': '<b>Spinning:</b> Points are deducted immediately. <i>No refunds.</i>',
        'g1_2': '<b>Winning a Car:</b> Screenshot the result and <b>contact LINE within 48 hrs</b>.',
        'g1_3': '<b>Winning Points:</b> Bonus points are automatically added back.',
        'g2_head': 'Pity System (Guarantee)',
        'g2_1': 'If total spins reach the target, <b>the rare car drops 100% to the last spinner!</b>',

        // --- Login / Common ---
        'auth_login_title': 'Login',
        'auth_reg_title': '📝 Create Account',
        'phone_ph': '📞 Phone (10 Digits)',
        'pass_ph': '🔑 Password',
        'btn_login': 'Login',
        'btn_reg': 'Register',
        'no_acc': 'No account? Register here',
        'has_acc': 'Already have an account? Login',
        'fname': 'First Name', 'lname': 'Last Name',
        'addr': 'Address (No. / Street)',
        'subdist': 'Sub-district', 'dist': 'District', 'prov': 'Province', 'zip': 'Zipcode',
        
        'processing': 'Processing...',
        'success': 'Success',
        'error': 'Error',
        'login_success': 'Logged in successfully',
        'logout_confirm': 'Are you sure you want to logout?',
        'btn_yes': 'Yes, Logout',
        'btn_cancel': 'Cancel',
        'remote_fee': 'Remote area (Additional 20 THB shipping fee)',
        'normal_fee': 'Standard shipping area'
    }
};

function t(key) { return dict[currentLang][key] || key; }
function tp(key, obj) { let str = t(key); for (let k in obj) { str = str.replace(`{${k}}`, obj[k]); } return str; }

function toggleLang() {
    currentLang = currentLang === 'th' ? 'en' : 'th';
    localStorage.setItem('siteLang', currentLang);
    location.reload(); 
}

// ==========================================
// 3. ระบบยืนยันตัวตน (Authentication)
// ==========================================
function openAuth(type) {
    const authTitle = document.getElementById('authTitle');
    const authBody = document.getElementById('authBody');
    let html = '';

    if (type === 'login') {
        authTitle.innerText = t('auth_login_title');
        html = `
        <form onsubmit="submitAuth(event, 'login')">
            <input type="tel" id="lPhone" class="form-control mb-3 p-3 border-primary" placeholder="${t('phone_ph')}" maxlength="10" required>
            <input type="password" id="lPassword" class="form-control mb-3 p-3 border-primary" placeholder="${t('pass_ph')}" required>
            <button type="submit" class="btn btn-primary w-100 py-3 fw-bold rounded-pill shadow">${t('btn_login')}</button>
            <div class="text-center mt-3"><a href="#" class="text-muted text-decoration-none" onclick="openAuth('register')">${t('no_acc')}</a></div>
        </form>`;
    } else {
        authTitle.innerText = t('auth_reg_title');
        html = `
        <form onsubmit="submitAuth(event, 'register')">
            <div class="row g-2 mb-2">
                <div class="col-6"><input type="tel" id="rPhone" class="form-control" placeholder="${t('phone_ph')}" maxlength="10" required></div>
                <div class="col-6"><input type="password" id="rPassword" class="form-control" placeholder="${t('pass_ph')}" required></div>
            </div>
            <div class="row g-2 mb-2">
                <div class="col-6"><input type="text" id="rFName" class="form-control" placeholder="${t('fname')}" required></div>
                <div class="col-6"><input type="text" id="rLName" class="form-control" placeholder="${t('lname')}" required></div>
            </div>
            <input type="text" id="rAddress" class="form-control mb-2" placeholder="${t('addr')}" required>
            <div class="row g-2 mb-2">
                <div class="col-6"><input type="text" id="rSubDistrict" class="form-control" placeholder="${t('subdist')}" required></div>
                <div class="col-6"><input type="text" id="rDistrict" class="form-control" placeholder="${t('dist')}" required></div>
                <div class="col-6"><input type="text" id="rProvince" class="form-control" placeholder="${t('prov')}" required></div>
                <div class="col-6">
                    <input type="text" id="rZip" class="form-control border-primary fw-bold" placeholder="${t('zip')}" onkeyup="checkRemoteFee(this.value)" maxlength="5" required>
                </div>
            </div>
            <div id="remoteHint" class="small mb-3"></div>
            <button type="submit" class="btn btn-success w-100 py-2 fw-bold rounded-pill shadow-sm">${t('btn_reg')}</button>
            <div class="text-center mt-3"><a href="#" class="text-muted text-decoration-none" onclick="openAuth('login')">${t('has_acc')}</a></div>
        </form>`;
    }
    authBody.innerHTML = html;
    new bootstrap.Modal(document.getElementById('authModal')).show();
}

async function submitAuth(e, type) {
    e.preventDefault();
    Swal.fire({ title: t('processing'), allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    let data = { action: type };
    if (type === 'login') {
        data.phone = document.getElementById('lPhone').value;
        data.password = document.getElementById('lPassword').value; 
    } else {
        data.phone = document.getElementById('rPhone').value;
        data.password = document.getElementById('rPassword').value; 
        data.fname = document.getElementById('rFName').value;
        data.lname = document.getElementById('rLName').value;
        data.addressLine = document.getElementById('rAddress').value; 
        data.subdistrict = document.getElementById('rSubDistrict').value;
        data.district = document.getElementById('rDistrict').value;
        data.province = document.getElementById('rProvince').value;
        data.zipcode = document.getElementById('rZip').value;
    }

    const res = await API.post(data);
    if (res.status === 'success') {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        currentUser = res.user;
        bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
        Swal.fire(t('success'), t('login_success'), 'success');
        updateNav();
        showPage('home');
    } else {
        Swal.fire(t('error'), res.message, 'error');
    }
}

// ==========================================
// 4. ฟังก์ชันเสริม (Helpers & Sync)
// ==========================================
// 💡 อัปเกรด: ให้ฟังก์ชันเดียวใช้ได้ทุกหน้าเว็บ!
window.checkRemoteFee = function(zip, hintElementId = 'remoteHint') {
    const hint = document.getElementById(hintElementId);
    if (!hint) return;
    if (remoteZipCodes.includes(zip)) {
        hint.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${t('remote_fee')}`;
        hint.className = 'small mt-1 text-danger fw-bold';
    } else {
        hint.innerHTML = `<i class="fas fa-check-circle"></i> ${t('normal_fee')}`;
        hint.className = 'small mt-1 text-success';
    }
}

async function syncPoints() {
    if (!currentUser) return;
    const btn = document.getElementById('syncIcon');
    if (btn) { btn.classList.add('fa-spin'); }
    
    const res = await API.get(`getUserHistory&phone=${currentUser.phone}`); 
    if (res.status === 'success' && res.userInfo) { 
        currentUser.points = parseFloat(res.userInfo.points).toFixed(2); 
        localStorage.setItem('currentUser', JSON.stringify(currentUser)); 
        // เปลี่ยนใน core.js ตรงส่วน syncPoints() ครับ
        const navPts = document.getElementById('navPoints');
        const navPtsM = document.getElementById('navPointsM'); // บรรทัดที่เพิ่มใหม่
        if (navPts) navPts.innerText = currentUser.points; 
        if (navPtsM) navPtsM.innerText = currentUser.points; // บรรทัดที่เพิ่มใหม่
    }
    setTimeout(() => { if (btn) btn.classList.remove('fa-spin'); }, 500);
}

window.logout = function() {
    Swal.fire({ 
        title: t('logout_confirm'), 
        icon: 'question', 
        showCancelButton: true, 
        confirmButtonText: t('btn_yes'), 
        cancelButtonText: t('btn_cancel'), 
        confirmButtonColor: '#d33' 
    }).then((result) => {
        if (result.isConfirmed) { 
            localStorage.removeItem('currentUser'); 
            currentUser = null; 
            location.reload(); 
        }
    });
}
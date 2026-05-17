// ==========================================
// 📬 API Connector (รองรับ 2 ฐานข้อมูล)
// ==========================================

// ⚠️ 1. URL ระบบสะสมแต้ม/กาชา (อันเดิมของคุณ)
const REWARD_API_URL = "https://script.google.com/macros/s/AKfycbwWX4smPoytOXmkN7e1VZ4h5UaFaeDyAtWksAW_UByO9KfZ_PZkrRxv6kHH9ZPdHftA1Q/exec"; 

// ⚠️ 2. URL ระบบร้านค้าอัจฉริยะ (อันใหม่ที่คุณเพิ่งทำ)
const SHOP_API_URL = "https://script.google.com/macros/s/AKfycbzfjsTsmHRbrA8pesmp70rDL3-C3yTckix_15QOqg0iEfPtRiE3OXctw1zn13azkEtq-w/exec"; 

const API = {
    // --- ท่อส่งข้อมูลที่ 1: สำหรับระบบสะสมแต้ม/กาชา (Reward System) ---
    post: async (data) => {
        try {
            const response = await fetch(REWARD_API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" }, 
                body: JSON.stringify(data),
                redirect: "follow"
            });
            return await response.json();
        } catch (error) {
            console.error("Reward API POST Error:", error);
            return { status: "error", message: "เชื่อมต่อระบบแต้มล้มเหลว" };
        }
    },
    get: async (action) => {
        try {
            const response = await fetch(`${REWARD_API_URL}?action=${action}`);
            return await response.json();
        } catch (error) {
            console.error("Reward API GET Error:", error);
            return { status: "error", data: [] };
        }
    },

    // --- ท่อส่งข้อมูลที่ 2: สำหรับระบบร้านค้า (Shop System) ---
    shopPost: async (data) => {
        try {
            const response = await fetch(SHOP_API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" }, 
                body: JSON.stringify(data),
                redirect: "follow"
            });
            return await response.json();
        } catch (error) {
            console.error("Shop API POST Error:", error);
            return { status: "error", message: "เชื่อมต่อระบบร้านค้าล้มเหลว" };
        }
    },
    shopGet: async (action) => {
        try {
            const response = await fetch(`${SHOP_API_URL}?action=${action}`);
            return await response.json();
        } catch (error) {
            console.error("Shop API GET Error:", error);
            return { status: "error", data: [] };
        }
    }
};

// ฟังก์ชันแปลงรูปภาพ
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}
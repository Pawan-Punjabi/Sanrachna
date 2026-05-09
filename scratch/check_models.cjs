const axios = require('axios');
const GEMINI_API_KEY = "AIzaSyDMJuuCiqCJuLrL8zC5X-qakTuoN_KiVzQ";

async function checkModels() {
  try {
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    console.log("Available Models:", response.data.models.map(m => m.name));
  } catch (err) {
    console.error("Error listing models:", err.response ? err.response.data : err.message);
  }
}

checkModels();

const axios = require('axios');
const key = 'AIzaSyCk5vdY3BT9RXh1FFCb0j4-Wu-U98HVHqM';
const model = 'gemini-2.5-flash-image';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

const prompt = "Generate a professional 3D top-view architectural render of a floor plan, realistic interior design, isometric perspective, high-quality textures.";

axios.post(url, {
  contents: [{
    parts: [{ text: prompt }]
  }]
})
  .then(res => {
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error(err.response?.data || err.message);
  });

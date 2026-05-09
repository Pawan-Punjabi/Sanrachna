const axios = require('axios');
const key = 'AIzaSyCk5vdY3BT9RXh1FFCb0j4-Wu-U98HVHqM';
const model = 'gemini-3.1-flash-image-preview';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${key}`;

axios.get(url)
  .then(res => {
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error(err.response?.data || err.message);
  });

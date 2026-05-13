const axios = require("axios");
const qs = require("qs");
require("dotenv").config();

const token = process.env.OK_TOKEN;
const username = process.env.OK_USERNAME;
const tokenId = token.split(":")[0];

const payload = qs.stringify({
  request_time: Date.now().toString(),
  app_reg_id: "e5aCENGrQOWvhQWYnv-uNc:APA91bFj3O_mv5Nf_2SM4Duz4Z8Ug3nBNaHlgodlY92CBuNIA9xmc0Dahev5xxqssPmnTdcie4mlhiG9ZAE1iCe1QbyhxcUyGXlenJxiUaXdfm1rklOEo9k",
  phone_uuid: "e5aCENGrQOWvhQWYnv-uNc",
  phone_model: "sdk_gphone64_x86_64",
  phone_android_version: "16",
  app_version_code: "250811",
  app_version_name: "25.08.11",
  auth_username: username,
  auth_token: token,
  ui_mode: "light",
  "requests[0]": "account",
  "requests[1]": "qris_menu",
});

axios.post(`https://app.orderkuota.com/api/v2/qris/menu/${tokenId}`, payload, {
  headers: {
    "User-Agent": "okhttp/4.12.0",
    "Host": "app.orderkuota.com",
    "Content-Type": "application/x-www-form-urlencoded",
  },
  timeout: 30000,
})
.then(res => {
  console.log("STATUS:", res.status);
  console.dir(res.data, { depth: null });
})
.catch(err => {
  console.log("ERROR STATUS:", err.response?.status);
  console.dir(err.response?.data || err.message, { depth: null });
});
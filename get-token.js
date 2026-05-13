const axios = require("axios");
const qs = require("qs");

const OK_LOGIN_ENDPOINT = "https://app.orderkuota.com/api/v2/login";

const OK_HEADERS = {
  "User-Agent": "okhttp/4.12.0",
  "Host": "app.orderkuota.com",
  "Content-Type": "application/x-www-form-urlencoded",
};

const OK_CONSTANTS = {
  app_reg_id: "e5aCENGrQOWvhQWYnv-uNc:APA91bFj3O_mv5Nf_2SM4Duz4Z8Ug3nBNaHlgodlY92CBuNIA9xmc0Dahev5xxqssPmnTdcie4mlhiG9ZAE1iCe1QbyhxcUyGXlenJxiUaXdfm1rklOEo9k",
  phone_uuid: "e5aCENGrQOWvhQWYnv-uNc",
  phone_model: "sdk_gphone64_x86_64",
  phone_android_version: "16",
  app_version_code: "250811",
  app_version_name: "25.08.11",
  ui_mode: "light",
};

async function requestOtp() {
  try {
    const payload = qs.stringify({
      username: "javesstore",
      password: "73311",
      ...OK_CONSTANTS,
    });

    const res = await axios.post(OK_LOGIN_ENDPOINT, payload, {
      headers: OK_HEADERS,
    });

    console.dir(res.data, { depth: null });
  } catch (err) {
    console.log(err.response?.status);
    console.dir(err.response?.data || err.message, { depth: null });
  }
}

requestOtp();
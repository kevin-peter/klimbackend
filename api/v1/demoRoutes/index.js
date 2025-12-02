const fileUpload = require('express-fileupload');
const cors = require('cors')

const BASE_ROUTE = "/api/v1";

const user = require("../user/user-routes");
const event = require("../event/event-routes");
//const setting = require("../setting/setting-routes");
//const result = require("../result/result-routes");
const account = require("../account/account-routes");
const ads = require("../ads/ads-routes");
const router = require("express").Router()

const routerV1 = async (app) => {
  router.use("/user", user)
  router.use("/event", event)
  //router.use("/setting", setting)
  //router.use("/result", result)
  router.use("/account", account)
  router.use("/ads", ads)
  router.use("/", async (req, res) => {
    res.status(200).json({
      data: {
        timestamp: new Date().toISOString(),
        v: "1.0.0",
      },
      message: "Score API v1.0.0",
      error: null,
    });
  })
  app.use(fileUpload());
  app.use(cors());
  app.use(BASE_ROUTE, router);
}

module.exports = {
  routerV1
}

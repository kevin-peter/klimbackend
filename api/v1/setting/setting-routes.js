const express = require("express");
const router = express.Router();
const {
  authenticateToken,
  authenticateIP,
} = require("../common/authenticate-token-middleware");

const {
  errorHandlerMiddleware,
} = require("../common/error-handler-middleware");

const {
  getEventsAll,
  addEvent,
  updateEvent,
  delEvent,
  lockEvent,
  lockMarket,
  getDefaultMarkets,
  createMarket,
  delMarket,
  //getMarkets,
} = require("./setting-controller");

//event apis
router.post("/getEventsAll", authenticateToken, getEventsAll);
router.post("/addevent", authenticateToken, addEvent);
router.post("/updateEvent", authenticateToken, updateEvent);
router.post("/delEvent", authenticateToken, delEvent);

//markets settings
router.post("/updateEventStatus", authenticateToken, lockEvent); //super admin events
router.post("/lockMarket", authenticateToken, lockMarket); //super admin default markets
router.post("/getDefaultMrkt", authenticateToken, getDefaultMarkets);
router.post("/createMarket", authenticateToken, createMarket);
router.post("/delMarket", authenticateToken, delMarket);

//markets api
//router.post("/getMarkets",authenticateToken, getMarkets);

router.use(errorHandlerMiddleware);

module.exports = router;

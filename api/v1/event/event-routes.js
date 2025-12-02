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
  //getEventsAll,
  // addEvent,
  getEvents,
  //updateEvent,
  getEventByEventID,
//   delEvent,
  getPlayers,
  addPlayer,
  //getDefaultMarkets,
  getMarkets,
  getMarketsC,
  getMarketsList,
//   createMarket,
//   delMarket,
  selectRunner,
  selectSingleRunner,
  selectOddEven,
  unSelectRunner,
  unSelectSingleRunner,
  getSelectedRuners,
  getSelectedRunersSingle,
  getBalance,
  confirmPlayers,
  getConfirmPlayers,
  getMyMarkets,
  getMyMarketsByEvent,
  getMyPlayers,
  //lockMarket,
  //lockEvent,
  getEventStatus,
  getMarketStatus,
  updateMarketStatus,
  getExposerTable,
  getButtons,
  getAC,
  getResults,
  getResultsAll,
  getResult,
  getBets,
} = require("./event-controller");

//router.post("/getEventsAll",authenticateToken, getEventsAll);

//router.post("/addevent", authenticateToken, addEvent);
//router.post("/updateEvent", authenticateToken, updateEvent);
router.post("/getevents", authenticateToken, getEvents);
router.post("/getEventByEID", authenticateToken, getEventByEventID);
//router.post("/delEvent", authenticateToken, delEvent);
router.post("/getPlayers", authenticateToken, getPlayers);
router.post("/addPlayer", authenticateToken, addPlayer);
//router.post("/getDefaultMrkt",authenticateToken, getDefaultMarkets);
router.post("/getMarkets", authenticateToken, getMarkets);
router.post("/getMarketsC", authenticateToken, getMarketsC);
router.post("/getMarketsList", authenticateToken, getMarketsList);
// router.post("/createMarket", authenticateToken, createMarket);
// router.post("/delMarket", authenticateToken, delMarket);

//player select choice
router.post("/getSelRuners", authenticateToken, getSelectedRuners);
router.post("/getSelRunersSingle", authenticateToken, getSelectedRunersSingle);
router.post("/selectRunner", authenticateToken, selectRunner);
router.post("/unSelectRunner", authenticateToken, unSelectRunner);
router.post("/unSelectSingleRunner", authenticateToken, unSelectSingleRunner);
router.post("/selectSingleRunner", authenticateToken, selectSingleRunner);
router.post("/selectOddEven", authenticateToken, selectOddEven);

//router.post("/getBal", authenticateToken, getBalance);
router.post("/getBal", authenticateToken, getBalance);
router.post("/confirmPlayers", authenticateToken, confirmPlayers);
router.post("/getConfirmPlayers", authenticateToken, getConfirmPlayers);
router.post("/getMyMarkets", authenticateToken, getMyMarkets);
router.post("/getMyMarketsByEvent", authenticateToken, getMyMarketsByEvent);
router.post("/getMyPlayers", authenticateToken, getMyPlayers);

//router.post("/lockMarket", authenticateToken, lockMarket); //super admin default markets
//router.post("/updateEventStatus", authenticateToken, lockEvent); //super admin events
router.post("/getEventStatus", authenticateToken, getEventStatus); //client
router.post("/getMarketStatus", authenticateToken, getMarketStatus);

router.post("/updateMarketStatus", authenticateToken, updateMarketStatus); //parent market locked
router.post("/getExposerTable", authenticateToken, getExposerTable);

router.post("/getButtons", authenticateToken, getButtons);

router.post("/getAC", authenticateToken, getAC);
router.post("/getResults", authenticateToken, getResults);
router.post("/getResultsAll", authenticateToken, getResultsAll);
router.post("/getResult", authenticateToken, getResult);

router.post("/getBets", authenticateToken, getBets);


// setInterval(() => {
//     updateApiFancy();
//   }, 100);

router.use(errorHandlerMiddleware);

module.exports = router;

const express = require("express");
const router = express.Router();
const { authenticateToken, authenticateIP } = require("../common/authenticate-token-middleware");

const { errorHandlerMiddleware } = require("../common/error-handler-middleware");

const {
    getEventRunners,
    updateRuns,
    updateWickets,
    updateToss,
    getResults,
    getBalance,
    resultVerify,
    //getAC,
} = require("./result-controller");

router.post("/getEventRunners", authenticateToken, getEventRunners);
router.post("/updateRuns", authenticateToken, updateRuns);
router.post("/getResults", authenticateToken, getResults);
//Wicket Related api
router.post("/updateWickets", authenticateToken, updateWickets);

router.post("/resultVerify", authenticateToken, resultVerify);
router.post("/getBalance", authenticateToken, getBalance);

router.post("/updateToss", authenticateToken, updateToss);
//router.post("/getAC", authenticateToken, getAC);

// setInterval(() => {
//     updateApiFancy();
//   }, 100);

router.use(errorHandlerMiddleware);

module.exports = router;

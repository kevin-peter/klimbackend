const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../common/authenticate-token-middleware");

const { errorHandlerMiddleware } = require("../common/error-handler-middleware");

const {
    getAccountStatement,
    doSettement,
    getEventGen,
    getPl,
    getAcSum
} = require("./account-controller");

router.post("/getstatement", authenticateToken, getAccountStatement);
router.post("/getpl", authenticateToken, getPl);
router.post("/getacsummary", authenticateToken, getAcSum);
router.post("/settlement", authenticateToken, doSettement);
router.post("/geteventgen", authenticateToken, getEventGen);

router.use(errorHandlerMiddleware);

module.exports = router;

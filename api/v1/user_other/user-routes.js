const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../common/authenticate-token-middleware");
const { errorHandlerMiddleware } = require("../common/error-handler-middleware");

const {
    addUser,
    modUser,
    getProfile,
    Login,
    getPartyCodes,
    getUsers,
    acGen,
    setTally,
    resetPassword,
    removeOperator,
    updateChips,
    updatePart,
    updateMarketType,
    setPl,
    getButtons,
    setButtons,
    changePassword
} = require("./user-controller");

router.post("/profile", authenticateToken, getProfile);
router.post("/login", Login);
router.post("/adduser", authenticateToken, addUser);
router.post("/getusers", authenticateToken, getUsers);
router.post("/pcodes", authenticateToken, getPartyCodes);
router.post("/acgen", authenticateToken, acGen);
router.post("/tally", authenticateToken, setTally);
router.post("/moduser", authenticateToken, modUser);
router.post("/resetpassword", authenticateToken, resetPassword);
router.post("/removeoperator", authenticateToken, removeOperator);
router.post("/updatechips", authenticateToken, updateChips);
router.post("/updatepart", authenticateToken, updatePart);
router.post("/updatemarkettype", authenticateToken, updateMarketType);
router.post("/plset", authenticateToken, setPl);
router.post("/getbuttons", authenticateToken, getButtons);
router.post("/setbuttons", authenticateToken, setButtons);
router.post("/changepassword", authenticateToken, changePassword);

router.use(errorHandlerMiddleware);

module.exports = router;

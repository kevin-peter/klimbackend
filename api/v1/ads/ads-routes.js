const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../common/authenticate-token-middleware");

const { errorHandlerMiddleware } = require("../common/error-handler-middleware");

const {
    addTitle,
    getTitle,
    updateTitle,
    getSetting,
    updateSetting,
    uploads,
    list,
    delAds,
    getImageList,
    addImage,
    delImg,
    getData,
    getSlides
} = require("./ads-controller");

router.post("/addTitle", authenticateToken, addTitle);
router.post("/getAllTitle", authenticateToken, getTitle);
router.post("/updateTitle", authenticateToken, updateTitle);
router.post("/delAds", authenticateToken, delAds);
router.get("/getSetting", authenticateToken, getSetting);
router.post("/updateSetting", authenticateToken, updateSetting);
router.get("/getImageList", authenticateToken, getImageList);
router.post("/addImage", authenticateToken, addImage);
router.post("/delImg", authenticateToken, delImg);
router.post("/list", list);
router.post("/getData", getData);
router.get("/getSlides", getSlides);

router.use(errorHandlerMiddleware);

module.exports = router;

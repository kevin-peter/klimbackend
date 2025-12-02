const Ads = require("./ads-model");
const User = require("./../user/user-modal");
const fetch = require("node-fetch");
const { parseJwt } = require("../common/authenticate-token-middleware");
const { InputError } = require("./../common/errors");
const allConfig = require("./../../../config/allConfig");

const fileupload = require("express-fileupload");
const express = require("express");
const router = express.Router();
const path = require("path");
const assetFolder = path.join(__dirname, "assets");
const { dirname } = require("path");
const appDir = dirname(require.main.path);

const app = require("../../../app");
const fs = require("fs");

const list = async (req, res, next) => {
  try {
    const ads = await Ads.getTitle();
    res.status(200).json({
      success: true,
      data: ads,
    });
  } catch (error) {
    next(error);
  }
};
const getData = async (req, res, next) => {
  try {
    const ads = await Ads.getSetting();
    res.status(200).json({
      success: true,
      data: ads,
    });
  } catch (error) {
    next(error);
  }
};

const uploads = async (req, res, next) => {
  try {
    fileupload();
    console.log(req.body);
    return true;
    let sampleFile;
    let uploadPath;

    // sampleFile = req.body.file.name;
    // uploadPath = "./images/" + sampleFile;

    //  console.log(uploadPath)
    // sampleFile.mv(uploadPath, function(err) {
    //   if (err)
    //     return res.status(500).send(err);

    //   res.send('File uploaded!');
    // });

    return true;
  } catch (error) {
    next(error);
  }
};
const addTitle = async (req, res, next) => {
  router.use(fileupload());

  try {
    let allowed_role = [2, 3, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    // if (req.files) {
    //   const { avatar } = req.files;
    //   console.log("req.files");
    //   avatar.mv(path.join(appDir + "/public/images", avatar.name));
    // }

    // console.log(appDir);
    // //console.log(req.body.title)

    const baseURL = process.env.BASE_URL;
    if (!req.body.title) throw new InputError("Title Required");
    if (!req.body.link) throw new InputError("Link URL Required");
    if (!req.body.whatsapp) throw new InputError("Whatsapp Number Required");
    //if (!req.body.telegram) throw new InputError("Telegram Web Required");
    let data = { ...req.body };
    let date_ob = new Date();
    data["last_updated"] = date_ob;
    const ads = await Ads.addTitle(data);

    if (ads.insertId) {
      console.log(ads.insertId);
      const id = ads.insertId;
      if (req.files) {
        const { avatar } = req.files;
        avatar.mv(path.join(appDir + "/public/images", avatar.name));
        data["img"] = baseURL + "images/" + avatar.name;
        data["id"] = id;
        const ads = await Ads.updateImage(data);
      }
    }

    res.status(200).json({
      success: ads.insertId ? true : false,
      data: [],
      message: ads.insertId ? "Ads Created" : "Faild Create Ads",
    });
  } catch (error) {
    next(error);
  }
};

const updateTitle = async (req, res, next) => {
  router.use(fileupload());

  try {
    let allowed_role = [2, 3, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const baseURL = process.env.BASE_URL;
    if (!req.body.id) throw new InputError("Id Required");
    if (!req.body.title) throw new InputError("Title Required");
    if (!req.body.link) throw new InputError("Link URL Required");
    if (!req.body.whatsapp) throw new InputError("Whatsapp Number Required");
    //if (!req.body.telegram) throw new InputError("Telegram Web Required");
    let data = { ...req.body };
    let date_ob = new Date();
    data["last_updated"] = date_ob;
    const ads = await Ads.updateTitle(data);

    if (data.id) {
      console.log(data.id);
      const id = data.id;
      if (req.files) {
        const { avatar } = req.files;
        avatar.mv(path.join(appDir + "/public/images", avatar.name));
        data["img"] = baseURL + "images/" + avatar.name;
        data["id"] = id;
        const ads = await Ads.updateImage(data);
      }
    }

    res.status(200).json({
      success: ads.insertId ? true : false,
      data: [],
      message: ads.insertId ? "Title Updated" : "Faild Update Title",
    });
  } catch (error) {
    next(error);
  }
};

const getTitle = async (req, res, next) => {
  try {
    const _self = await User.getProfile(parseJwt(req).email); // login user info

    let s_id = _self[0].u_role === 6 ? _self[0].parent_id : _self[0].id;
    const ads = await Ads.getTitle();
    res.status(200).json({
      success: true,
      data: ads,
    });
  } catch (error) {
    next(error);
  }
};

const delAds = async (req, res, next) => {
  try {
    const _self = await User.getProfile(parseJwt(req).email); // login user info
    let p_id = _self[0].id;
    if (_self[0].u_role !== 3) p_id = _self[0].parent_id;

    const ads = await Ads.delAds(req.body.id);

    res.status(200).json({
      success: true,
      data: ads,
    });
  } catch (error) {
    next(error);
  }
};

const getSetting = async (req, res, next) => {
  try {
    const _self = await User.getProfile(parseJwt(req).email); // login user info

    let s_id = _self[0].u_role === 6 ? _self[0].parent_id : _self[0].id;
    const ads = await Ads.getSetting();
    res.status(200).json({
      success: true,
      data: ads,
    });
  } catch (error) {
    next(error);
  }
};

const updateSetting = async (req, res, next) => {
  router.use(fileupload());

  try {
    let allowed_role = [2, 3, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const baseURL = process.env.BASE_URL;
    if (!req.body.title) throw new InputError("Title Required");
    if (!req.body.whatsapp) throw new InputError("Whatsapp Number Required");
    //if (!req.body.telegram) throw new InputError("Telegram Web Required");
    let data = { ...req.body };

    let date_ob = new Date();
    data["last_updated"] = date_ob;
    const ads = await Ads.updateSetting(data);

    if (req.files) {
      console.log(req.files);
      const { logo } = req.files;
      logo.mv(path.join(appDir + "/public/logo", logo.name));
      data["img"] = baseURL + "logo/" + logo.name;

      const ads = await Ads.updateLogo(data);
    }

    res.status(200).json({
      success: true,
      data: [],
      message: ads.insertId ? "Ads Created" : "Faild Create Ads",
    });
  } catch (error) {
    next(error);
  }
};

const getImageList = async (req, res, next) => {
  try {
    const _self = await User.getProfile(parseJwt(req).email); // login user info

    let s_id = _self[0].u_role === 6 ? _self[0].parent_id : _self[0].id;
    const ads = await Ads.getImageList();
    res.status(200).json({
      success: true,
      data: ads,
    });
  } catch (error) {
    next(error);
  }
};

const addImage = async (req, res, next) => {
  router.use(fileupload());

  try {
    let allowed_role = [2, 3, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const baseURL = process.env.BASE_URL;
    if (!req.files) throw new InputError("Image Required");

    let data = { ...req.body };

    let date_ob = new Date();
    data["last_updated"] = date_ob;
    let flag = false;
    let custom_number = Math.floor(Math.random() * 10);
    console.log(custom_number);
    if (req.files) {
      
      const { avatar } = req.files;
      let file_name = "img_" + custom_number + "_" + avatar.name;

      avatar.mv(
        path.join(appDir + "/public/slider", file_name)
      );
      data["image_url"] = baseURL + "slider/" + file_name;
      const ads = await Ads.addImage(data);
      ads.insertId ? (flag = true) : (flag = false);
    }

    res.status(200).json({
      success: flag ? true : false,
      data: [],
      message: flag ? "Image Created" : "Faild Create Image",
    });
  } catch (error) {
    next(error);
  }
};

const delImg = async (req, res, next) => {
  try {
    const _self = await User.getProfile(parseJwt(req).email); // login user info
    let p_id = _self[0].id;
    if (_self[0].u_role !== 3) p_id = _self[0].parent_id;

    const img = await Ads.getImageById(req.body.id);
    const baseURL = process.env.BASE_URL;
    let imgName = img[0].image_url.split(baseURL + "slider/");
    // console.log(img[0].image_url)
    // console.log(imgName[1])

    const path = appDir + "/public/slider/" + imgName[1];

    if (fs.existsSync(path)) {
      
      fs.unlink(appDir + "/public/slider/" + imgName[1], (err) => {
        if (err) {
          throw err;
        }

        console.log("Delete File successfully.");
      });
    }
    

    const ads = await Ads.delImg(req.body.id);

    res.status(200).json({
      success: true,
      data: ads,
    });
  } catch (error) {
    next(error);
  }
};

const getSlides = async (req, res, next) => {
  try {
    const ads = await Ads.getSlides();
    res.status(200).json({
      success: true,
      data: ads,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  uploads,
  addTitle,
  updateTitle,
  getTitle,
  delAds,
  getSetting,
  updateSetting,
  getImageList,
  addImage,
  delImg,
  getData,
  getSlides,
};

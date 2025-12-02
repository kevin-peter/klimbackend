const pool = require("./../../../config/database");

const Login = async (email) => {
  let _sql_rest_url =
    "SELECT name,email,password,u_role FROM users WHERE email = ? LIMIT 1";
  return pool.query(_sql_rest_url, [email]);
};

const addTitle = async (data) => {
  console.log(data);
  let _sql_rest_url =
    "INSERT INTO `tbl_title`(`title`, `ext_link`, `whatsapp`, `telegram`, `last_updated`) VALUES (?,?,?,?,?)";
  _sql_rest_url +=
    " ON DUPLICATE KEY UPDATE last_updated = VALUES(tbl_title.last_updated)";
  return pool.query(_sql_rest_url, [
    data.title,
    data.link,
    data.whatsapp,
    data.telegram,
    data.last_updated,
  ]);
};
const updateTitle = async (data) => {
  let _sql_rest_url =
    "UPDATE `tbl_title` SET title = ? , contents = ? , ext_link = ? , whatsapp = ? , telegram = ? where id = ?";
  return pool.query(_sql_rest_url, [
    data.title,
    data.contents,
    data.link,
    data.whatsapp,
    data.telegram,
    data.id,
  ]);
};

const updateImage = async (data) => {
  let _sql_rest_url = "UPDATE tbl_title SET img = ? WHERE id = ?";
  return pool.query(_sql_rest_url, [data.img, data.id]);
};

const updateLogo = async (data) => {
  let _sql_rest_url = "UPDATE tbl_setting SET logo_url = ? WHERE id = 1";
  return pool.query(_sql_rest_url, [data.img]);
};

const getTitle = async () => {
  let _sql_rest_url = "SELECT * FROM tbl_title";
  _sql_rest_url += " ORDER BY `tbl_title`.`id` DESC";
  return pool.query(_sql_rest_url, []);
};

const delAds = async (id) => {
  let _sql_rest_url = "DELETE FROM `tbl_title` where id = ?";
  return pool.query(_sql_rest_url, [id]);
};

const updateSetting = async (data) => {
  let _sql_rest_url =
    "UPDATE `tbl_setting` SET title = ? , whatsapp = ? , telegram = ? where id = 1";
  return pool.query(_sql_rest_url, [data.title, data.whatsapp, data.telegram]);
};

const getSetting = async () => {
  let _sql_rest_url =
    "SELECT title, whatsapp, telegram, logo_url FROM tbl_setting WHERE id = 1";
  _sql_rest_url += " LIMIT 1";
  return pool.query(_sql_rest_url, []);
};

const getSlides = async () => {
  let _sql_rest_url = "SELECT * FROM tbl_slider";
  _sql_rest_url += " ORDER BY `tbl_slider`.`id` ASC";
  return pool.query(_sql_rest_url, []);
};

const getImageList = async () => {
  let _sql_rest_url = "SELECT * FROM tbl_slider";
  _sql_rest_url += " ORDER BY `tbl_slider`.`id` ASC";
  return pool.query(_sql_rest_url, []);
};

const addImage = async (data) => {
  
  let _sql_rest_url =
    "INSERT INTO `tbl_slider`(`image_url`, `last_updated`) VALUES (?,?)";
  _sql_rest_url +=
    " ON DUPLICATE KEY UPDATE last_updated = VALUES(tbl_slider.last_updated)";
  return pool.query(_sql_rest_url, [data.image_url, data.last_updated]);
};

const getImageById = async (id) => {
  let _sql_rest_url = "SELECT * FROM tbl_slider where id = ?";
 
  return pool.query(_sql_rest_url, [id]);
};

const delImg = async (id) => {
  let _sql_rest_url = "DELETE FROM `tbl_slider` where id = ?";
  return pool.query(_sql_rest_url, [id]);
};

module.exports = {
  Login,
  addTitle,
  updateTitle,
  updateImage,
  updateLogo,
  getTitle,
  delAds,
  getSetting,
  updateSetting,
  getImageList,
  addImage,
  delImg,
  getImageById,
  getSlides
};

const pool = require("./../../../config/database");

const getAccountStatement = async (data) => {
  let para = [data.user_id];
  const limit = 50;
  let page = data.page ? data.page : 1;
  const start = (page - 1) * limit;
  const todate = new Date(data.todate);
  todate.setDate(todate.getDate() + 1);

  let _sql_rest_url =
    "SELECT  tbl_ac_stat.`id`, `uid`, `amount`, `up_line`, `type`, `from`, `to`, `previous_bal`, `new_bal`, tbl_ac_stat.`mode_id`, tbl_ac_stat.`market_id`, tbl_ac_stat.`event_id`, `previous_gen`, `remark`, `deleted`, `revoke`, tbl_ac_stat.`created_at` from tbl_ac_stat ";
  _sql_rest_url += " WHERE uid =? ";

  if (data.type === "settlement") {
    _sql_rest_url += " AND tbl_ac_stat.mode_id = -1";
  }
  if (data.type === "balance") {
    _sql_rest_url += " AND tbl_ac_stat.mode_id = 0 ";
  }
  if (data.type === "game") {
    if (!data.mode || (data.mode && data.mode === "all")) {
      _sql_rest_url += " AND tbl_ac_stat.mode_id NOT IN (0) ";
    } else {
      _sql_rest_url += " AND tbl_ac_stat.mode_id IN(?)";
      para.push([data.mode, -1]);
    }
  }
  if (data.type === "all") {
    if (data.role && data.role > 4) {
      _sql_rest_url += " AND tbl_ac_stat.mode_id NOT IN (-1) ";
    } else {
      _sql_rest_url += " AND tbl_ac_stat.mode_id NOT IN (0) ";
    }
  }
  if (data.event_id) {
    _sql_rest_url += " AND tbl_ac_stat.event_id = ? ";
    para.push(data.event_id);
  }
  _sql_rest_url += " AND  created_at BETWEEN ? AND ? ";
  para.push(data.fromdate, todate, start, limit);
  _sql_rest_url += "  ORDER BY `tbl_ac_stat`.`id` DESC LIMIT ?,?";
  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
};

const getPl = async (data) => {
  let para = [];
  const limit = 50;
  const start = (data.page - 1) * limit;
  const todate = new Date(data.todate);
  todate.setDate(todate.getDate() + 1);

  //let _sql_rest_url = "SELECT subquery.play,subquery.event_id, subquery.amount,subquery.up_line, subquery.created_at AS created_at, subquery.event FROM (SELECT MAX(tbl_mode.play) as play,tbl_ac_stat.event_id, SUM(amount) AS amount,SUM(up_line) AS up_line, MAX(remark) AS event, MAX(tbl_ac_stat.created_at) AS created_at FROM tbl_ac_stat INNER JOIN tbl_mode ON tbl_mode.mode_id = tbl_ac_stat.mode_id WHERE 1 ";
  // let _sql_rest_url =
  //   "SELECT subquery.play,subquery.event_id, subquery.amount,subquery.amt, subquery.up_line, subquery.created_at AS created_at, subquery.event FROM (SELECT MAX(tbl_markets.market_name) as play,tbl_ac_stat.event_id, tbl_ac_stat.amount AS amt, SUM(amount) AS amount,SUM(up_line) AS up_line, MAX(remark) AS event, MAX(tbl_ac_stat.created_at) AS created_at FROM tbl_ac_stat INNER JOIN tbl_markets ON tbl_markets.id = tbl_ac_stat.market_id WHERE 1 ";

  // let _sql_rest_url = "SELECT subquery.play, subquery.event_id, subquery.amount, subquery.amt, subquery.up_line, subquery.created_at AS created_at, subquery.event FROM (SELECT tbl_markets.market_name as play,tbl_ac_stat.event_id, tbl_ac_stat.amount AS amt, amount, up_line, remark AS event, tbl_ac_stat.created_at AS created_at FROM tbl_ac_stat INNER JOIN tbl_markets ON tbl_markets.id = tbl_ac_stat.market_id WHERE 1 ";
   let _sql_rest_url = "SELECT subquery.play, subquery.event_id, subquery.amount, subquery.amt, subquery.up_line, subquery.created_at AS created_at, subquery.event FROM (SELECT tbl_default_markets.name as play,tbl_ac_stat.event_id, tbl_ac_stat.amount AS amt, amount, up_line, remark AS event, tbl_ac_stat.created_at AS created_at FROM tbl_ac_stat INNER JOIN tbl_default_markets ON tbl_default_markets.id = tbl_ac_stat.main_market_id WHERE 1 ";
 
  if (data.user_id) {
    _sql_rest_url += " AND uid = ?";
    para.push(data.user_id);
  }
  if (data.fromdate) {
    _sql_rest_url += " AND tbl_ac_stat.created_at BETWEEN ? AND ?";
    para.push(data.fromdate, todate);
  }
  if (data.mode) {
    _sql_rest_url += "AND tbl_ac_stat.mode_id = ? ";
    para.push(data.mode);
  }
  _sql_rest_url +=
    "GROUP BY tbl_ac_stat.main_market_id) AS subquery ORDER BY `subquery`.`created_at` DESC LIMIT ?,?";

  para.push(start, limit);

  //console.log(_sql_rest_url, para)
  const rows = pool.query(_sql_rest_url, para);

  return rows;
};

const getAcSum = async (data) => {
  let para = [data.user_id];
  // let _sql_rest_url =
  //   "SELECT `tbl_ac_stat`.`mode_id`,SUM(`amount`) as amount, SUM(`up_line`) as up_line ,tbl_mode.play from tbl_ac_stat INNER JOIN tbl_mode ON tbl_mode.mode_id = tbl_ac_stat.mode_id";

  let _sql_rest_url =
     "SELECT `tbl_ac_stat`.`main_market_id`,SUM(`amount`) as amount, SUM(`up_line`) as up_line , tbl_default_markets.name As play from tbl_ac_stat INNER JOIN tbl_default_markets ON tbl_default_markets.id = tbl_ac_stat.main_market_id";
  _sql_rest_url += " WHERE uid =? ";
  _sql_rest_url +=
    "GROUP BY `tbl_ac_stat`.`main_market_id` ORDER BY `tbl_ac_stat`.`main_market_id`";
  const rows = await pool.query(_sql_rest_url, para);
  return rows;
};

const getEventGenChild = async (data) => {
  let para = [];

  let _sql_rest_url =
    "SELECT IF(users.u_role > 4,SUM(up_line)*(-1),SUM(up_line)) as amount,users.u_role,email as p_code,users.name FROM `tbl_ac_stat` INNER JOIN users ON users.id = tbl_ac_stat.uid WHERE 1 ";

  if (`user_id` in data) {
    _sql_rest_url += " AND users.parent_id = ? ";
    para.push(data.user_id);
  }

  if (`market_id` in data) {
    _sql_rest_url += " AND tbl_ac_stat.market_id IN (?) ";
    para.push(data.market_id);
  }

  if (`event_id` in data) {
    _sql_rest_url += " AND event_id=? ";
    para.push(data.event_id);
  }

  _sql_rest_url += "  group by users.id";

  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
};

const getEventGenSelf = async (data) => {
  let para = [];
  let _sql_rest_url =
    "SELECT SUM(amount)*(-1) as amount,users.u_role,email as p_code,users.name FROM `tbl_ac_stat` INNER JOIN users ON users.id = tbl_ac_stat.uid WHERE 1 ";

  if (`user_id` in data) {
    _sql_rest_url += " AND tbl_ac_stat.uid = ? ";
    para.push(data.user_id);
  }

  if (`market_id` in data) {
    _sql_rest_url += " AND tbl_ac_stat.market_id IN (?) ";
    para.push(data.market_id);
  }

  if (`event_id` in data) {
    _sql_rest_url += " AND event_id=? ";
    para.push(data.event_id);
  }
  _sql_rest_url += "  group by users.id";
  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
};

const getEventGenParent = async (data) => {
  let para = [];
  let _sql_rest_url =
    "SELECT SUM(up_line) as amount,users.u_role,email as p_code,users.name FROM `tbl_ac_stat` INNER JOIN users ON users.id = tbl_ac_stat.uid WHERE 1";

  if (`parent_id` in data) {
    _sql_rest_url += " AND users.id = ? ";
    para.push(data.parent_id);
  }

  if (`market_id` in data) {
    _sql_rest_url += " AND tbl_ac_stat.market_id IN (?) ";
    para.push(data.market_id);
  }

  if (`event_id` in data) {
    _sql_rest_url += " AND event_id=? ";
    para.push(data.event_id);
  }
  _sql_rest_url += "  group by users.id";
  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
};

const addAccountEntry = async (data) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    let _sql_rest_url =
      "INSERT INTO `tbl_ac_stat`(`uid`, `amount`,`part`,`comm_up`, `comm_down`, `up_line`,`down_line`,`type`, `from`, `to`, `previous_bal`, `new_bal`,`mode_id`,`market_id`,`event_id`,`previous_gen`,`remark`,`deleted`,`revoke`) VALUES ?";
    const [rows] = await await pool.query(_sql_rest_url, [data]);
    await connection.commit();
    return rows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getAccountEntry = async (market_id) => {
  let _sql_rest_url =
    "SELECT  tbl_ac_stat.id, tbl_ac_stat.uid, tbl_ac_stat.amount, tbl_ac_stat.up_line, tbl_ac_stat.type, tbl_ac_stat.from, tbl_ac_stat.to, tbl_ac_stat.ref_id, tbl_ac_stat.previous_bal, tbl_ac_stat.new_bal, tbl_ac_stat.mode_id, tbl_ac_stat.market_id, tbl_ac_stat.event_id, tbl_ac_stat.previous_gen, tbl_ac_stat.remark, tbl_ac_stat.deleted, tbl_ac_stat.revoke, tbl_ac_stat.updated_at, tbl_ac_stat.created_at, tbl_ac_stat.tally,users.u_role from tbl_ac_stat JOIN users ON users.id = tbl_ac_stat.uid WHERE tbl_ac_stat.market_id=?  AND tbl_ac_stat.revoke=1";
  const [rows] = await pool.query(_sql_rest_url, [market_id]);
  return rows;
};

const updateAccountEntry = async (data) => {
  let para = [];
  let _sql_rest_url = "UPDATE `tbl_ac_stat` SET ";
  if (`revoke` in data) {
    _sql_rest_url += " tbl_ac_stat.revoke=? ";
    para.push(data.revoke);
  }
  para.push(data.market_id);
  _sql_rest_url += " WHERE tbl_ac_stat.market_id=? ";
  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
};

const grandPL = async (data) => {
  let para = [data.user_id];
  let _sql_rest_url =
    "SELECT SUM(amount) as gt FROM tbl_ac_stat WHERE tbl_ac_stat.uid =?";
  _sql_rest_url += " AND tbl_ac_stat.market_id > 0 ";
  const rows = await pool.query(_sql_rest_url, para);
  return rows;
};

module.exports = {
  getAccountStatement,
  getEventGenChild,
  getEventGenSelf,
  getEventGenParent,
  addAccountEntry,
  getAccountEntry,
  updateAccountEntry,
  getPl,
  getAcSum,
  grandPL,
};

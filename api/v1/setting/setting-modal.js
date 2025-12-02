const pool = require("../../../config/database");
const fetch = require("node-fetch");

const getEventsAll = async (parent_id) => {
  let _sql_rest_url =
    "SELECT id, event_id, market_id, event_name, team1, team2, opendate, closedate, status, bet_lock, locked, type, runnerName1, runnerName2 FROM tbl_events ORDER BY id desc";
  return pool.query(_sql_rest_url, [parent_id]);
};

const addEvent = async (data) => {
  let _sql_rest_url =
    "INSERT INTO `tbl_events`(`event_id`,`market_id`, `event_name`, `team1`, `team2`, `opendate`, `closedate`, `weak_team`, `parent_id`, `runnerName1`, `runnerName2`, `type`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ";
  _sql_rest_url +=
    " ON DUPLICATE KEY UPDATE last_updated = VALUES(last_updated)";
  return pool.query(_sql_rest_url, [
    data.event_id,
    data.market_id,
    data.event_name,
    data.team1,
    data.team2,
    data.opendate,
    data.closedate,
    data.weak_team,
    data.parent_id,
    data.runnerName1,
    data.runnerName2,
    data.m_type,
  ]);
};

const updateEvent = async (data) => {
  console.log(data)
  let _sql_rest_url =
    "UPDATE `tbl_events` SET event_name = ?, team1 = ?, team2 = ?, opendate = ?, closedate = ? WHERE event_id = ?";
  return pool.query(_sql_rest_url, [
    data.event_name,
    data.team1,
    data.team2,
    data.opendate,
    data.closedate,
    //data.runnerName1,
    //data.runnerName2,
    //data.m_type,
    data.event_id,
  ]);
};

const delEvent = async (event_id, p_id) => {
  let _sql_rest_url =
    "DELETE FROM `tbl_events` where event_id = ? and parent_id = ?";
  return pool.query(_sql_rest_url, [event_id, p_id]);
};

//for event markets
const delMarkets = async (event_id, p_id) => {
  let _sql_rest_url = "DELETE FROM `tbl_markets` where event_id = ?";
  return pool.query(_sql_rest_url, [event_id]);
};

const delRunners = async (event_id) => {
  let _sql_rest_url = "DELETE FROM `tbl_runners` where event_id = ?";
  return pool.query(_sql_rest_url, [event_id]);
};

const delRunnersUsers = async (event_id) => {
  let _sql_rest_url = "DELETE FROM ` tbl_runners_users` where event_id = ?";
  return pool.query(_sql_rest_url, [event_id]);
};


const lockEvent = async (data) => {
  let para = [];

  let _sql_rest_url = "UPDATE `tbl_events` SET ";

  if (`status` in data) {
    para.push(data.status);
    _sql_rest_url += " tbl_events.status=?";
  }

  if (`lock` in data) {
    para.push(data.lock);
    _sql_rest_url += " tbl_events.lock=?";
  }

  if (`bet_lock` in data) {
    para.push(data.bet_lock);
    _sql_rest_url += " tbl_events.bet_lock=?";
  }

  _sql_rest_url += " WHERE tbl_events.event_id=?";
  para.push(data.event_id);

  return pool.query(_sql_rest_url, para);
};

const lockMarket = async (data) => {
  let para = [];

  let _sql_rest_url = "UPDATE `tbl_default_markets` SET ";

  if (`status` in data) {
    para.push(data.status);
    _sql_rest_url += " tbl_default_markets.status=?";
  }

  if (`visible` in data) {
    para.push(data.visible);
    _sql_rest_url += " tbl_default_markets.visible=?";
  }

  if (`locked` in data) {
    para.push(data.locked);
    _sql_rest_url += " tbl_default_markets.locked=?";
  }

  // if (`runner_type` in data) {
  //   para.push(data.runner_type);
  //   _sql_rest_url += " tbl_default_markets.runner_type=?";
  // }

  if (`display_order` in data) {
    para.push(data.display_order);
    _sql_rest_url += " tbl_default_markets.display_order=?";
  }

  if (`runner_count` in data) {
    para.push(data.runner_count);
    _sql_rest_url += " tbl_default_markets.runner_count=?";
  }

  _sql_rest_url += " WHERE tbl_default_markets.id=?";
  para.push(data.market_id);

  console.log(_sql_rest_url, para)
  return pool.query(_sql_rest_url, para);
};

const getDefaultMarketsAll = async () => {
  let _sql_rest_url =
    "SELECT id, name, runner_count, runner_type, display_order, status, visible, locked FROM tbl_default_markets ORDER BY display_order asc";
  return pool.query(_sql_rest_url, []);
};

const getDefaultMarkets = async () => {
  let _sql_rest_url =
    "SELECT id, name, runner_count, runner_type, display_order, status, visible, locked FROM tbl_default_markets WHERE status = 1 ORDER BY display_order asc";
  return pool.query(_sql_rest_url, []);
};

const createMarket = async (data) => {
  let _sql_rest_url = "INSERT INTO `tbl_default_markets`(`name`) VALUES (?) ";
  // _sql_rest_url +=
  //   " ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)";
  return pool.query(_sql_rest_url, [data.name]);
};

//for default markets
const delMarket = async (event_id) => {
  let _sql_rest_url = "DELETE FROM `tbl_default_markets` where id = ?";
  return pool.query(_sql_rest_url, [event_id]);
};

const addMarket = async (data) => {
  let _sql_rest_url =
    "INSERT INTO `tbl_markets`(`event_id`, `main_market_id`, `market_name`, `runner_count`) VALUES (?,?,?,?) ";
  _sql_rest_url += " ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)";

  return pool.query(_sql_rest_url, [
    data.event_id,
    data.main_market_id,
    data.market_name,
    data.runner_count,
  ]);
};


//query partnership chain
// WITH RECURSIVE parent_cte (id, parent_id, u_role) AS ( SELECT id, parent_id, name FROM users WHERE id = 5 UNION ALL SELECT t.id, t.parent_id, t.u_role FROM users t JOIN parent_cte pc ON pc.parent_id = t.id ) SELECT parent_cte.id, parent_cte.parent_id,tbl_partnership.part,tbl_partnership.visible FROM parent_cte LEFT JOIN tbl_partnership ON tbl_partnership.child_id = parent_cte.id WHERE  1 AND tbl_partnership.play_mode = 4;

module.exports = {
  getEventsAll,
  addEvent,
  updateEvent,
  delEvent,
  delMarkets,
  delRunners,
  lockEvent,
  lockMarket,
  getDefaultMarketsAll,
  getDefaultMarkets,
  createMarket,
  delMarket,
  delRunnersUsers,
  addMarket,
};

const pool = require("./../../../config/database");
const fetch = require("node-fetch");

const getEventByEventID = async (event_id) => {
  let _sql_rest_url =
    "SELECT event_id, market_id, event_name, team1, team2, opendate, type, runnerName1, runnerName2, status, bet_lock FROM tbl_events WHERE event_id=? ORDER BY id desc";
  return pool.query(_sql_rest_url, [event_id]);
};

const getEvents = async (parent_id) => {
  let _sql_rest_url =
    "SELECT id, event_id, market_id, event_name, opendate, closedate, status, bet_lock, status As parent_status, bet_lock As parent_bet_lock, type, runnerName1, runnerName2, results, team1, team2 FROM tbl_events WHERE status=1 ORDER BY id desc";
  return pool.query(_sql_rest_url, [parent_id]);
};
//get main event status super
const getEventStatus = async (event_id) => {
  let _sql_rest_url =
    "SELECT event_id, event_name, team1, team2, opendate, closedate, weak_team, status, bet_lock, type FROM tbl_events WHERE event_id=? LIMIT 1";
  return pool.query(_sql_rest_url, [event_id]);
};
//check parent event status admin,master
const getEventDefaultParent = async (uids) => {
  let _sql_rest_url =
    "SELECT id, event_id, user_id, status, bet_lock FROM tbl_default_event WHERE user_id IN (?) ORDER BY user_id, updated_at desc";
  return pool.query(_sql_rest_url, [uids]);
};

const getPlayers = async (event_id, mkIds) => {
  let _sql_rest_url =
    "SELECT id, event_id, market_id, name, team, main_market_id, sequence FROM tbl_runners WHERE event_id=? AND market_id IN (?) ORDER BY team, sequence asc";
  
    return pool.query(_sql_rest_url, [event_id, mkIds]);
};

const getPlayersByMK = async (event_id, mkIds) => {
  let _sql_rest_url =
    "SELECT id, event_id, market_id, name, team, main_market_id, sequence FROM tbl_runners WHERE event_id=? AND main_market_id = ? ORDER BY team, sequence asc";
  
    return pool.query(_sql_rest_url, [event_id, mkIds]);
};

//add runner
const addPlayer = async (data) => {
  let _sql_rest_url =
    "INSERT INTO `tbl_runners`(`event_id`,`market_id`, `name`, `sequence`, `team`, `main_market_id`) VALUES (?,?,?,?,?,?) ";
  _sql_rest_url += " ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)";
  return pool.query(_sql_rest_url, [
    data.event_id,
    data.market_id,
    data.name,
    data.seq,
    data.team,
    data.main_market_id,
  ]);
};

const addPlayerAll = async (data) => {
  try {
    let _sql_rest_url =
      "INSERT INTO tbl_runners (event_id, market_id, name, sequence, team, main_market_id) VALUES ?";
      _sql_rest_url += " ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)";
    return pool.query(_sql_rest_url, [data]);
  } catch (error) {
    next(error);
  }
};

const getMarkets = async (event_id) => {
  let _sql_rest_url =
    "SELECT tbl_markets.id, tbl_markets.event_id, tbl_markets.market_name, tbl_markets.runner_count, tbl_markets.exp, tbl_markets.main_market_id, tbl_default_markets.visible, tbl_default_markets.locked, tbl_default_markets.visible As parent_visible, tbl_default_markets.locked As parent_locked FROM tbl_markets LEFT JOIN tbl_default_markets ON tbl_markets.main_market_id = tbl_default_markets.id WHERE tbl_markets.event_id=? ORDER BY tbl_default_markets.display_order";
  return pool.query(_sql_rest_url, [event_id]);
};

const getMarketsC = async (event_id, market_id) => {
  let _sql_rest_url =
    "SELECT tbl_markets.id, tbl_markets.event_id, tbl_markets.market_name, tbl_markets.runner_count, tbl_markets.exp, tbl_markets.main_market_id, tbl_default_markets.visible, tbl_default_markets.locked, tbl_default_markets.visible As parent_visible, tbl_default_markets.locked As parent_locked FROM tbl_markets LEFT JOIN tbl_default_markets ON tbl_markets.main_market_id = tbl_default_markets.id WHERE tbl_markets.event_id=? AND tbl_markets.main_market_id IN (?) ORDER BY tbl_markets.id";
  return pool.query(_sql_rest_url, [event_id, market_id]);
};

const getMarketsType = async (event_id, uids) => {
  let _sql_rest_url =
    "SELECT event_id, market_id, user_id, type_name, visible, locked FROM tbl_default_type WHERE event_id=? AND user_id IN (?) ORDER BY user_id desc";
  return pool.query(_sql_rest_url, [event_id, uids]);
};

//**************runner-user selection relation process tables******************
//add selected runners in relation table
const addRunner = async (data) => {
  let _sql_rest_url =
    "INSERT INTO `tbl_runners_users`(`event_id`,`market_id`, `runnerId`, `user_id`, `runner_name`, `sequence`, `team`, `type`, `exp`, `event_type`, `main_market_id`, `parent`, `part_chain`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ";
  _sql_rest_url += " ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)";
  return pool.query(_sql_rest_url, [
    data.event_id,
    data.market_id,
    data.runnerId,
    data.user_id,
    data.runner_name,
    data.sequence,
    data.team,
    data.type,
    data.exp,
    data.eventType,
    data.main_market_id,
    data.parent_id,
    data.part_chain,
  ]);
};
const addRunnerOddEven = async (data) => {
  let _sql_rest_url =
    "INSERT INTO `tbl_runners_users`(`event_id`,`market_id`, `runnerId`, `user_id`, `runner_name`, `sequence`, `team`, `type`, `odd_even`, `exp`, `event_type`, `main_market_id`, `parent`, `part_chain`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ";
  _sql_rest_url += " ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)";
  return pool.query(_sql_rest_url, [
    data.event_id,
    data.market_id,
    data.runnerId,
    data.user_id,
    data.runner_name,
    data.sequence,
    data.team,
    data.type,
    data.odd_even,
    data.exp,
    data.eventType,
    data.main_market_id,
    data.parent_id,
    data.part_chain,
  ]);
};

const addRunnerScore = async (data) => {
  
  
  let _sql_rest_url =
    "INSERT INTO `tbl_runners_users`(`event_id`,`market_id`, `runnerId`, `user_id`, `runner_name`, `sequence`, `team`, `type`, `run_digit`, `exp`, `amount`, `event_type`, `main_market_id`, `status`, `parent`, `part_chain`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ";
  _sql_rest_url += " ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)";

  return pool.query(_sql_rest_url, [
    data.event_id,
    data.market_id,
    data.runnerId,
    data.user_id,
    data.runner_name,
    data.sequence,
    data.team,
    data.type,
    data.run_digit,
    data.exp,
    data.amount,
    data.eventType,
    data.main_market_id,
    data.status,
    data.parent_id,
    data.part_chain,
  ]);
};

const getSelRunners = async (data) => {
  let _sql_rest_url =
    "SELECT event_id, market_id, runnerId, user_id, sequence, team, type, exp, event_type FROM tbl_runners_users WHERE event_id=? AND market_id=? AND user_id=? ORDER BY runnerId";
  return pool.query(_sql_rest_url, [
    data.event_id,
    data.market_id,
    data.user_id,
  ]);
};
const getUnSelRunnersAll = async (data) => {
  let _sql_rest_url =
    "SELECT id, event_id, market_id, name, team, sequence FROM tbl_runners WHERE event_id=? AND market_id=? AND id NOT IN (?) ORDER BY team, sequence asc";
  return pool.query(_sql_rest_url, [
    data.event_id,
    data.market_id,
    data.selectedIds,
  ]);
};

const getUnSelRunners = async (data) => {
  let _sql_rest_url =
    "SELECT id, event_id, market_id, name, team, sequence FROM tbl_runners WHERE event_id=? AND market_id=? AND id IN (?) ORDER BY sequence asc LIMIT 1";
  return pool.query(_sql_rest_url, [
    data.event_id,
    data.market_id,
    data.unSelIds,
  ]);
};

//All Market Selected Runner relation
const getSelectedRunnersAll = async (data) => {
  let _sql_rest_url =
    "SELECT event_id, market_id, runnerId, user_id, runner_name, sequence, team, type, odd_even, exp, status, updated_at FROM tbl_runners_users WHERE event_id=? AND user_id=? ORDER BY id";
  return pool.query(_sql_rest_url, [data.event_id, data.user_id]);
};
const getSelectedRunnersSingle = async (data) => {
  let _sql_rest_url =
    "SELECT event_id, market_id, runnerId, user_id, runner_name, sequence, team, type, run_digit, exp, status, updated_at FROM tbl_runners_users WHERE event_id=? AND main_market_id = ? AND user_id=? ORDER BY id";
  return pool.query(_sql_rest_url, [data.event_id, data.main_market_id, data.user_id]);
};
const getSelectedRunnersSingle2 = async (data) => {
  let _sql_rest_url =
    "SELECT event_id, market_id, runnerId, user_id, runner_name, sequence, team, type, run_digit, exp, status, updated_at FROM tbl_runners_users WHERE event_id=? AND main_market_id = ? AND user_id=? AND status = 'SELECTED' ORDER BY id";
  return pool.query(_sql_rest_url, [data.event_id, data.main_market_id, data.user_id]);
};
const getSelRunnersByMarket = async (data) => {
  let _sql_rest_url =
    "SELECT event_id, market_id, runnerId, user_id, runner_name, sequence, team, main_market_id, type, amount, exp, status, updated_at FROM tbl_runners_users WHERE event_id=? AND market_id=? AND user_id=? ORDER BY id";
  return pool.query(_sql_rest_url, [
    data.event_id,
    data.market_id,
    data.user_id,
  ]);
};

//deleting relation
const delRunnerRel = async (data) => {
  let _sql_rest_url =
    "DELETE FROM `tbl_runners_users` where event_id = ? AND market_id=? AND user_id=?";
  return pool.query(_sql_rest_url, [
    data.event_id,
    data.market_id,
    data.user_id,
  ]);
};

const delRunnerSingalRel = async (data) => {
  let _sql_rest_url =
    "DELETE FROM `tbl_runners_users` where event_id = ? AND market_id=? AND runnerId=? AND user_id=?";
  return pool.query(_sql_rest_url, [
    data.event_id,
    data.market_id,
    data.runnerId,
    data.user_id,
  ]);
};
//**************runner-user selection relation process tables END******************

const getBalance = async (data) => {
  let _sql_rest_url =
    "SELECT uid, amount, exposer, locked FROM tbl_balance WHERE uid = ? ORDER BY id LIMIT 1";
  return pool.query(_sql_rest_url, [data.user_id]);
};

const confirmPlayers = async (data) => {
  
  let _sql_rest_url =
    "UPDATE `tbl_runners_users` SET amount = ?, status = 'SELECTED' where event_id = ? AND market_id = ? AND user_id = ?";
  return pool.query(_sql_rest_url, [
    data.amount,
    data.event_id,
    data.market_id,
    data.user_id,
  ]);
};

const getConfirmPlayers = async (data) => {
  let _sql_rest_url =
    "SELECT event_id, market_id, runnerId, user_id, runner_name, sequence, team, type, exp, status, updated_at FROM tbl_runners_users WHERE status='SELECTED' AND event_id=? AND market_id=? AND user_id=? ORDER BY id";
  return pool.query(_sql_rest_url, [
    data.event_id,
    data.market_id,
    data.user_id,
  ]);
};

const getMarketsByUid = async (data) => {
  let _sql_rest_url =
    "SELECT event_id, market_id, user_id, main_market_id FROM tbl_runners_users WHERE event_id=? AND user_id=? AND type='user' GROUP BY market_id";
  return pool.query(_sql_rest_url, [data.event_id, data.user_id]);
};


const getExpByMarket = async (data) => {
  let _sql_rest_url =
    "SELECT MAX(event_id), market_id, MAX(user_id), MAX(amount) AS amt, MAX(exp) AS total_exp, MAX(main_market_id) AS main_market_id FROM tbl_runners_users WHERE event_id=? AND user_id=? AND type='user' AND main_market_id NOT IN (9) GROUP BY market_id";
  return pool.query(_sql_rest_url, [data.event_id, data.user_id]);

};

const getExpByBet = async (data) => {
  let _sql_rest_url =
    "SELECT MAX(event_id), market_id, MAX(user_id), MAX(amount) AS amt, SUM(exp) AS total_exp, MAX(main_market_id) AS main_market_id FROM tbl_runners_users WHERE event_id=? AND user_id=? AND type='user' AND main_market_id IN (9,3)  GROUP BY market_id";
  return pool.query(_sql_rest_url, [data.event_id, data.user_id]);

};


//mymarkets
const getMyMarkets = async (user_id) => {
  let _sql_rest_url =
    "SELECT MAX(a.event_id) AS event_id, a.market_id, a.main_market_id, a.amount, MAX(b.market_name) AS market_name FROM tbl_runners_users a INNER JOIN tbl_markets b ON a.market_id = b.id WHERE a.user_id IN (?) AND a.type='user' AND a.status='SELECTED' GROUP BY a.market_id ORDER BY a.market_id";
  return pool.query(_sql_rest_url, [user_id]);
};
const getMyMarketsByEvent = async (user_id, event_id) => {
  let _sql_rest_url =
    "SELECT MAX(a.event_id) AS event_id, a.market_id, b.main_market_id, MAX(b.market_name) AS market_name FROM tbl_runners_users a INNER JOIN tbl_markets b ON a.market_id = b.id WHERE a.user_id IN (?) AND a.event_id = ? AND a.type='user' AND a.status='SELECTED' GROUP BY a.market_id ORDER BY a.market_id";
  return pool.query(_sql_rest_url, [user_id, event_id]);
};


const getMyPlayers = async (user_id) => {
  let _sql_rest_url =
    "SELECT a.event_id, a.market_id, a.runner_name, a.runnerId, a.user_id, a.type, a.odd_even, a.run_digit, a.amount, b.market_name, c.email FROM tbl_runners_users a LEFT JOIN tbl_markets b ON a.market_id = b.id INNER JOIN users c ON a.user_id = c.id WHERE a.user_id IN (?) AND a.status='SELECTED' ";
  // _sql_rest_url +=
  //   "GROUP BY a.event_id, a.market_id, a.runner_name, a.runnerId, a.user_id, a.type, c.email ORDER BY a.id";
  _sql_rest_url +=
     "ORDER BY a.id";
  return pool.query(_sql_rest_url, [user_id]);
};

const getPlayersAll = async (event_ids) => {
  let _sql_rest_url =
    "SELECT a.event_id, a.market_id, a.name, a.id, a.team, b.market_name FROM tbl_runners a LEFT JOIN tbl_markets b ON a.market_id = b.id WHERE a.event_id IN (?) ORDER BY a.team, a.sequence";
  // _sql_rest_url +=
  //   "GROUP BY a.event_id, a.market_id";
 
  return pool.query(_sql_rest_url, [event_ids]);
};


const getMarketsAll = async (event_ids) => {
  let _sql_rest_url =
    "SELECT a.event_id, a.main_market_id, a.market_name, a.id FROM tbl_markets a WHERE a.event_id IN (?) ORDER BY a.main_market_id";
  // _sql_rest_url +=
  //   "GROUP BY a.event_id";
 
  return pool.query(_sql_rest_url, [event_ids]);
};

const getScore = async (event_ids) => {
  let _sql_rest_url =
    "SELECT event_id, t1, t2, market_name, result_type, main_market_id, result FROM tbl_results WHERE event_id IN (?) AND revoked = 0 ";
  _sql_rest_url +=
     "ORDER BY id";
  return pool.query(_sql_rest_url, [event_ids]);
};

const getScoreByMK = async (event_id, market_id) => {
  let _sql_rest_url =
    "SELECT event_id, t1, t2, market_name, result_type, main_market_id, result FROM tbl_results WHERE event_id = ? AND main_market_id = ?";
  _sql_rest_url +=
     "ORDER BY id";
  return pool.query(_sql_rest_url, [event_id, market_id]);
};

const getMyPlayerName = async (user_id) => {
  let _sql_rest_url = "SELECT id, name, email from users WHERE id IN (?)";
  return pool.query(_sql_rest_url, [user_id]);
};

//exp by event id & user id
const getExpEventIDs = async (eventIds, user_id) => {
  let _sql_rest_url =
    "SELECT event_id, MAX(market_id), MAX(user_id), MAX(exp * amount) AS total_exp FROM tbl_runners_users WHERE event_id IN (?) AND user_id IN (?) AND type='user' AND status='SELECTED' GROUP BY event_id ORDER BY event_id";

  return pool.query(_sql_rest_url, [eventIds, user_id]);
};
const getExpByEvent = async (eventIds, user_id) => {
  let _sql_rest_url =
    "SELECT event_id, market_id, MAX(user_id) AS user_id, (exp * amount) AS total_exp FROM tbl_runners_users WHERE result = 0 AND event_id IN (?) AND user_id IN (?) AND type='user' AND status='SELECTED' GROUP BY market_id ORDER BY market_id";

  return pool.query(_sql_rest_url, [eventIds, user_id]);
};
const getExpByEventSingleBet = async (eventIds, user_id) => {
  
  let _sql_rest_url =
    "SELECT event_id, market_id, MAX(user_id) AS user_id, SUM(exp * amount) AS total_exp, main_market_id FROM tbl_runners_users WHERE result = 0 AND event_id IN (?) AND user_id IN (?) AND type='user' AND status='SELECTED' GROUP BY market_id ORDER BY market_id";
    //"SELECT MAX(event_id), market_id, MAX(user_id), MAX(amount) AS amt, SUM(exp) AS total_exp, main_market_id FROM tbl_runners_users WHERE event_id=? AND user_id=? AND type='user' AND main_market_id IN (9,3)  GROUP BY market_id";
  return pool.query(_sql_rest_url, [eventIds, user_id]);
};

const updateMainExp = async (data) => {
  try {
    let _sql_rest_url = "INSERT INTO tbl_balance (uid,exposer) VALUES ?";
    _sql_rest_url +=
      " ON DUPLICATE KEY UPDATE exposer = exposer + VALUES(exposer)";
    return pool.query(_sql_rest_url, [data]);
  } catch (error) {
    next(error);
  }
};

const lockEventInnerType = async (data) => {
  let _sql_rest_url =
    "INSERT INTO `tbl_default_event`(`event_id`, `user_id`, `admin_id`, `status`, `bet_lock`) VALUES (?,?,?,?,?) ";
  _sql_rest_url +=
    " ON DUPLICATE KEY UPDATE bet_lock = VALUES(bet_lock), status = VALUES(status), updated_at = VALUES(updated_at)";
  return pool.query(_sql_rest_url, [
    data.event_id,
    data.user_id,
    data.admin_id,
    data.status,
    data.bet_lock,
  ]);
};

const updateMarketStatus = async (data) => {
  let _sql_rest_url =
    "INSERT INTO `tbl_default_type`(`type_name`, `event_id`, `market_id`, `user_id`, `admin_id`, `visible`, `locked`) VALUES (?,?,?,?,?,?,?) ";
  _sql_rest_url +=
    " ON DUPLICATE KEY UPDATE locked = VALUES(locked), visible = VALUES(visible), updated_at = VALUES(updated_at)";
  return pool.query(_sql_rest_url, [
    data.type_name,
    data.event_id,
    data.market_id,
    data.user_id,
    data.admin_id,
    data.visible,
    data.locked,
  ]);
};

//event
const getEventByEventIDArray = async (event_id) => {
  let _sql_rest_url =
    "SELECT event_id, market_id, event_name, type AS event_type FROM tbl_events WHERE event_id IN (?) ORDER BY id desc";
  return pool.query(_sql_rest_url, [event_id]);
};

const getButtons = async (uid) => {
  let _sql_rest_url =
    "SELECT uid, b_name, b_value FROM tbl_buttons WHERE uid = ? ORDER BY id";
  return pool.query(_sql_rest_url, [uid]);
};
const getButtonsByMK = async (uid, market_id) => {
  let _sql_rest_url =
    "SELECT uid, b_name, b_value FROM tbl_buttons WHERE uid = ? AND main_market_id = ? AND status = 1 ORDER BY id";
  return pool.query(_sql_rest_url, [uid, market_id]);
};

const getPartnerships = async (user_id) => {
  let _sql_rest_url =
    "WITH RECURSIVE parent_cte (id, parent_id, u_role) AS ( SELECT id, parent_id, name FROM users WHERE id = ? UNION ALL SELECT t.id, t.parent_id, t.u_role FROM users t JOIN parent_cte pc ON pc.parent_id = t.id ) SELECT parent_cte.id, parent_cte.parent_id,tbl_partnership.part,tbl_partnership.visible FROM parent_cte LEFT JOIN tbl_partnership ON tbl_partnership.child_id = parent_cte.id WHERE 1 AND tbl_partnership.play_mode = 4 ORDER BY id DESC";
  return pool.query(_sql_rest_url, [user_id]);
};

const updatePartChain = async (user_id, chain) => {
  try {
    let _sql_rest_url = "INSERT INTO tbl_part_chain (uid,chain) VALUES (?,?)";
    _sql_rest_url +=
      " ON DUPLICATE KEY UPDATE uid = VALUES(uid), chain = VALUES(chain)";
    return pool.query(_sql_rest_url, [user_id, chain]);
  } catch (error) {
    next(error);
  }
};

const getAC = async (user_id) => {
  //
  let _sql_rest_url =
    "SELECT uid, amount, up_line, down_line, type, previous_bal, new_bal, market_id, event_id, remark, created_at FROM tbl_ac_stat WHERE uid=? ORDER BY created_at desc";
  return pool.query(_sql_rest_url, [user_id]);
};

const getPartChain = async (uids) => {
  let _sql_rest_url =
    "SELECT uid, chain FROM tbl_part_chain WHERE uid IN (?) ORDER BY uid DESC";
  return pool.query(_sql_rest_url, [uids]);
};

const getResults = async (event_id) => {
  let _sql_rest_url =
    "SELECT event_id, uid, result, t1, t2, market_name, result_type, updated_at FROM tbl_results WHERE event_id = ? ORDER BY id DESC";
  return pool.query(_sql_rest_url, [event_id]);
};

const getResultsAll = async () => {
  let _sql_rest_url =
    "SELECT event_id, uid, result, t1, t2, market_name, result_type, updated_at FROM tbl_results ORDER BY id DESC";
  return pool.query(_sql_rest_url, []);
};

const addBets = async (data) => {
      let _sql_rest_url = "INSERT INTO tbl_bets (user_id, email, event_name, event_id, market_id, main_market_id, r_id, r_name, team_id, team_name, amount, type, exp, ip_addr, device_info) VALUES ?";
      _sql_rest_url += " ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)";
      return pool.query(_sql_rest_url, [data]);
  }

  const getBets = async (childIds) => {
    
    if (childIds.length === 0) return []; // Handle case when no IDs are provided

    const placeholders = childIds.map(() => '?').join(',');
    const _sql_rest_url = `
        SELECT email, event_name, event_id, market_id, r_name, team_name, amount, type, created_at, tbl_default_markets.name as market_name
        FROM tbl_bets
        LEFT JOIN tbl_default_markets ON tbl_default_markets.id = tbl_bets.main_market_id
        WHERE user_id IN (${placeholders})
        ORDER BY created_at DESC
    `;

    return pool.query(_sql_rest_url, childIds);
  };

/* bulk insert or update */
// const addEventRunner = async (data) => {
//   let _sql_rest_url =
//     "INSERT INTO tbl_event_runners (selection_id, event_id,market_id, name,sort) VALUES ?";
//   _sql_rest_url += " ON DUPLICATE KEY UPDATE status = VALUES(status)";
//   return pool.query(_sql_rest_url, [data]);
// };

/* bulk insert or update */
// const addExp = async (data) => {
//     let _sql_rest_url = "INSERT INTO tbl_exp (parent_id, ref_id,p_code, user_id,runner_id,event_id,market_id,exp,exp_str,p_str) VALUES ?";
//     _sql_rest_url += " ON DUPLICATE KEY UPDATE exp = VALUES(tbl_exp.exp)";
//     return pool.query(_sql_rest_url, [data]);
// }

//downline - upline = my running pl
//total pl = my running pl - cash
//pocket minus from upline to its user and plus to parent downline

//query partnership chain
// WITH RECURSIVE parent_cte (id, parent_id, u_role) AS ( SELECT id, parent_id, name FROM users WHERE id = 5 UNION ALL SELECT t.id, t.parent_id, t.u_role FROM users t JOIN parent_cte pc ON pc.parent_id = t.id ) SELECT parent_cte.id, parent_cte.parent_id,tbl_partnership.part,tbl_partnership.visible FROM parent_cte LEFT JOIN tbl_partnership ON tbl_partnership.child_id = parent_cte.id WHERE  1 AND tbl_partnership.play_mode = 4;

module.exports = {
  getEventByEventIDArray,
  getEventByEventID,
  getEvents,
  getPlayers,
  addPlayer,
  addPlayerAll,
  getMarkets,
  getMarketsC,
  getMarketsType,
  addRunner,
  getSelRunners,
  getUnSelRunnersAll,
  getUnSelRunners,
  getSelectedRunnersAll,
  getSelectedRunnersSingle,
  getSelectedRunnersSingle2,
  getSelRunnersByMarket,
  delRunnerRel,
  delRunnerSingalRel,
  getBalance,
  confirmPlayers,
  getConfirmPlayers,
  getMarketsByUid,
  getExpByMarket,
  getExpByBet,
  getMyMarkets,
  getMyMarketsByEvent,
  getMyPlayers,
  getMyPlayerName,
  getExpEventIDs,
  getExpByEvent,
  getExpByEventSingleBet,
  updateMainExp,
  lockEventInnerType,
  getEventStatus,
  getEventDefaultParent,
  updateMarketStatus,
  getButtons,
  getButtonsByMK,
  getPartnerships,
  updatePartChain,
  getAC,
  getPartChain,
  getResults,
  getResultsAll,
  getScore,
  getScoreByMK,
  getPlayersAll,
  getPlayersByMK,
  getMarketsAll,

  addBets,
  getBets,
  addRunnerOddEven,
  addRunnerScore,
};

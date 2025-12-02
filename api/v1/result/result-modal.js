const pool = require("../../../config/database");
const fetch = require("node-fetch");

const getEventRunners = async (event_id) => {
  let _sql_rest_url =
    "SELECT a.id AS runnerId, a.name, a.sequence, a.team, a.market_id, b.market_name, b.main_market_id, b.runner_count FROM tbl_runners a LEFT JOIN tbl_markets b ON a.market_id = b.id WHERE b.event_id=? ORDER BY a.id asc";
  return pool.query(_sql_rest_url, [event_id]);
};

const getPlayers = async (event_id, mkId) => {
  let _sql_rest_url =
    "SELECT id, event_id, market_id, name, team, sequence FROM tbl_runners WHERE event_id=? AND market_id IN (?) ORDER BY team, sequence asc";
  return pool.query(_sql_rest_url, [event_id, mkIds]);
};

const resultRuns = async (parent_id) => {
  let _sql_rest_url =
    "SELECT event_id, market_id, event_name, opendate, type, runnerName1, runnerName2, status FROM tbl_events WHERE event_id=? ORDER BY id desc";
  return pool.query(_sql_rest_url, [parent_id]);
};

const getPlayedUser = async (event_id, market_id) => {
  let _sql_rest_url =
    "SELECT event_id, market_id, runnerId, user_id, type, exp, amount, runner_name, team, odd_even, run_digit FROM tbl_runners_users WHERE event_id=? AND market_id=? AND status = 'SELECTED' ORDER BY user_id";
  return pool.query(_sql_rest_url, [event_id, market_id]);
};

const getBalance = async (uids) => {
  let _sql_rest_url =
    "SELECT uid, amount, pl, up_line, down_line FROM tbl_balance WHERE uid IN (?) ORDER BY uid";
  return pool.query(_sql_rest_url, [uids]);
};

const updateQuery = async (query) => {
  try {
    let _sql_rest_url = query;
    pool.query(_sql_rest_url);

    return true;
  } catch (error) {
    next(error);
  }
};

const updateBalance = async (data) => {
  try {
    let _sql_rest_url =
      "INSERT INTO tbl_balance (uid,pl,up_line,down_line) VALUES ?";
    _sql_rest_url +=
      " ON DUPLICATE KEY UPDATE pl = pl + VALUES(pl), up_line = up_line + VALUES(up_line), down_line = down_line + VALUES(down_line)";
    return pool.query(_sql_rest_url, [data]);
  } catch (error) {
    next(error);
  }
};

const updateBalanceClient = async (data) => {
  try {
    let _sql_rest_url =
      "INSERT INTO tbl_balance (uid,amount,up_line,down_line) VALUES ?";
    _sql_rest_url +=
      " ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount), up_line = up_line + VALUES(up_line), down_line = down_line + VALUES(down_line)";
    return pool.query(_sql_rest_url, [data]);
  } catch (error) {
    next(error);
  }
};

//exp deduction
const updateExp = async (data) => {
  try {
    let _sql_rest_url = "INSERT INTO tbl_balance (uid, exposer) VALUES ?";
    _sql_rest_url +=
      " ON DUPLICATE KEY UPDATE exposer = exposer - VALUES(exposer)";
    return pool.query(_sql_rest_url, [data]);
  } catch (error) {
    next(error);
  }
};

const updateExpRunner = async (event_id, main_market_id) => {
  try {
    let _sql_rest_url =
      "UPDATE `tbl_runners_users` SET result = '1' where event_id = ? AND main_market_id = ?";
    return pool.query(_sql_rest_url, [
      event_id,
      main_market_id,
    ]);
  } catch (error) {
    next(error);
  }
};

const addAccountEntry = async (data) => {
  let _sql_rest_url =
    "INSERT INTO tbl_ac_stat (uid, amount, part, up_line, down_line, type, u_from, u_to, previous_bal, new_bal, market_id, main_market_id, event_id, remark, deleted, revoked) VALUES ?";
  //let _sql_rest_url = "INSERT INTO tbl_ac_stat (uid, amount, part, up_line, down_line, type, u_from, u_to) VALUES ?";
  return pool.query(_sql_rest_url, [data]);
};

const getPartnerships = async (user_id) => {
  let _sql_rest_url =
    "WITH RECURSIVE parent_cte (id, parent_id, u_role) AS ( SELECT id, parent_id, name FROM users WHERE id = ? UNION ALL SELECT t.id, t.parent_id, t.u_role FROM users t JOIN parent_cte pc ON pc.parent_id = t.id ) SELECT parent_cte.id, parent_cte.parent_id,tbl_partnership.part,tbl_partnership.visible FROM parent_cte LEFT JOIN tbl_partnership ON tbl_partnership.child_id = parent_cte.id WHERE 1 AND tbl_partnership.play_mode = 4";
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

const getPartChain = async (uids) => {
  let _sql_rest_url =
    "SELECT uid, chain FROM tbl_part_chain WHERE uid IN (?) ORDER BY uid";
  return pool.query(_sql_rest_url, [uids]);
};

const updateResult = async (data) => {
  
  try {
    let _sql_rest_url =
      "INSERT INTO tbl_results (event_id, uid, result, t1, t2, market_name, main_market_id, result_type, revoked) VALUES ?";
    _sql_rest_url +=
      " ON DUPLICATE KEY UPDATE event_id = VALUES(event_id), uid = VALUES(uid), result = VALUES(result), t1 = VALUES(t1), t2 = VALUES(t2), market_name = VALUES(market_name), main_market_id = VALUES(main_market_id), result_type = VALUES(result_type), revoked = VALUES(revoked)";
    return pool.query(_sql_rest_url, [data]);
  } catch (error) {
    next(error);
  }
};

// const getAC = async (user_id) => {
//   //
//   let _sql_rest_url =
//     "SELECT uid, amount, up_line, down_line, type, previous_bal, new_bal, market_id, event_id, remark, created_at FROM tbl_ac_stat WHERE uid=?";
//   return pool.query(_sql_rest_url, [user_id]);
// };

const getResults = async (event_id) => {
  let _sql_rest_url =
    "SELECT event_id, uid, result, t1, t2, market_name, main_market_id, result_type, revoked, updated_at FROM tbl_results WHERE event_id = ? AND revoked = 0 ORDER BY id DESC";
  return pool.query(_sql_rest_url, [event_id]);
};

const updateEvent = async (event_id, result) => {
  let _sql_rest_url = "UPDATE `tbl_events` SET results = ? where event_id = ?";

  return pool.query(_sql_rest_url, [result, event_id]);
};

const getResultsEvents = async (event_id) => {
  let _sql_rest_url =
    "SELECT event_id, results FROM tbl_events WHERE event_id = ? LIMIT 1";
  return pool.query(_sql_rest_url, [event_id]);
};

//total pl = my running pl - cash
//pocket minus from upline to its user and plus to parent downline

//query partnership chain
// WITH RECURSIVE parent_cte (id, parent_id, u_role) AS ( SELECT id, parent_id, name FROM users WHERE id = 5 UNION ALL SELECT t.id, t.parent_id, t.u_role FROM users t JOIN parent_cte pc ON pc.parent_id = t.id ) SELECT parent_cte.id, parent_cte.parent_id,tbl_partnership.part,tbl_partnership.visible FROM parent_cte LEFT JOIN tbl_partnership ON tbl_partnership.child_id = parent_cte.id WHERE  1 AND tbl_partnership.play_mode = 4;

module.exports = {
  getEventRunners,
  getPlayers,
  resultRuns,
  getPlayedUser,
  getBalance,
  updateQuery,
  updateBalance,
  updateBalanceClient,
  addAccountEntry,
  getPartnerships,
  updatePartChain,
  getPartChain,
  updateResult,
  //getAC,
  getResults,
  updateExp,
  updateExpRunner,
  updateEvent,
  getResultsEvents,
};

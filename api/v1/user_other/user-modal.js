const pool = require("./../../../config/database");

const getProfile = async (id) => {
  let _sql_rest_url = "SELECT id,parent_id,email,u_role,webref FROM users  WHERE id = ? LIMIT 1";
  const [rows] = await pool.query(_sql_rest_url, [id]);
  return rows;
}

const getallParent = async (user_id, role = "", p_id = "") => {
  let para = [user_id]
  let _sql_rest_url = "WITH RECURSIVE parent_cte (id, parent_id, u_role) AS ( SELECT id, parent_id, name FROM users WHERE id = ? UNION ALL SELECT t.id, t.parent_id, t.u_role FROM users t JOIN parent_cte pc ON pc.parent_id = t.id ) SELECT id, parent_id FROM parent_cte WHERE 1 ";
  if (p_id) {
    _sql_rest_url += ' AND parent_cte.parent_id = ?';
    para.push(p_id)
  }
  if (role) {
    _sql_rest_url += ' AND parent_cte.u_role = ?';
    para.push(role)
  }
  _sql_rest_url += ' ORDER BY id ASC'

  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
}

const getParent = async (parent_id) => {
  let _sql_rest_url = "SELECT id,u_role,part,c_in,c_out FROM users WHERE id=? LIMIT 1";
  const [rows] = await pool.query(_sql_rest_url, [parent_id]);
  return rows;
}

const Login = async (email, ref) => {
  let _sql_rest_url = "SELECT users.id,name,email,password,u_role,amount,exposer,fcp,cp FROM users LEFT JOIN tbl_balance ON tbl_balance.uid = users.id  WHERE u_role IN(2,3,4,5) AND email = ? AND webref = ? AND status=1 LIMIT 1";
  const [rows] = await pool.query(_sql_rest_url, [email, ref]);
  return rows;
}

const loginLog = async (data) => {
  let _sql_rest_url = "INSERT INTO `tbl_log`(`u_name`, `password`, `ip_addr`,`device_info`, `last_session`, `status`, `loc`) VALUES (?,?,?,?,?,?,?)"
  return pool.query(_sql_rest_url, [data.email, data.password, data.ip, data.bro, data.last_session, data.status, data.loc]);
}

const loginWId = async (id) => {
  let _sql_rest_url = "SELECT users.id,name,email,password,u_role,amount,up_line,down_line,pocket,net_pl,exposer,webref,parent_id FROM users LEFT JOIN tbl_balance ON tbl_balance.uid = users.id  WHERE u_role IN(2,3,4,5) AND users.id = ? AND status=1 LIMIT 1";
  const [rows] = await pool.query(_sql_rest_url, [id]);
  return rows;
}

const addUser = async (data) => {
  let _sql_rest_url = "INSERT INTO `users`(`parent_id`,`name`, `email`, `password`, `u_role`, `remark`, `webref`,`mobile_number`) VALUES (?,?,?,?,?,?,?,?)"
  const [rows] = await pool.query(_sql_rest_url, [data.parent_id, data.name, data.email, data.password, data.u_role, data.remark, data.webref, data.mobile]);
  return rows;
}

const addBalance = async (data) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    let _sql_rest_url = "INSERT INTO tbl_balance (uid,amount) VALUES ?";
    _sql_rest_url += " ON DUPLICATE KEY UPDATE amount = amount-VALUES(tbl_balance.amount)";
    const [rows] = await pool.query(_sql_rest_url, [data]);
    await connection.commit();
    return rows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

}

const updatePart = async (part, email) => {
  let _sql_rest_url = "UPDATE users SET part=? WHERE email = ?";
  const [rows] = await pool.query(_sql_rest_url, [part, email]);
  return rows;
}

const getUsers = async (data) => {
  let para = [data.user_id]
  let _sql_rest_url = "SELECT users.id,users.name,users.email as p_code,users.u_role,tbl_balance.up_line,tbl_balance.amount,users.remark,users.webref,users.bet_lock,users.status,tbl_balance.pl,tbl_balance.exposer FROM users LEFT JOIN tbl_balance ON tbl_balance.uid = users.id WHERE u_role  IN (3,4,5,6) AND users.parent_id = ?";

  if ('type' in data && data.type === 'ser' && 'uname' in data) {
    _sql_rest_url += " AND  `users`.`email` LIKE  ?";
    para.push('%' + data.uname + '%');
  }

  _sql_rest_url += " ORDER BY `users`.`id` DESC"
  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
}

const getPartyCodes = async (parent_id) => {
  let para = [parent_id]
  let _sql_rest_url = "SELECT id FROM users WHERE parent_id = ? ";
  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
}

const getChild = async (parent_id, role) => {
  let para = [parent_id, role]
  let _sql_rest_url = `WITH RECURSIVE child_hierarchy AS (
      SELECT id, parent_id, u_role
      FROM users
      WHERE parent_id = ?
      UNION ALL
      SELECT u.id, u.parent_id, u.u_role
      FROM users u
      INNER JOIN child_hierarchy ch ON u.parent_id = ch.id
    )
    SELECT id, parent_id, u_role
    FROM child_hierarchy
    WHERE u_role IN (?)`;
  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
}

const partacGen = async (_self) => {
  let para = [_self[0].id, _self[0].id, _self[0].id, _self[0].parent_id]
  let _sql_rest_url = "SELECT users.name,users.email as p_code,users.u_role,users.part,users.c_in,users.c_out, IF(users.u_role<>4 OR users.id=?,tbl_balance.amount*(-1),tbl_balance.general) as amount,remark, tbl_balance.tally FROM users INNER JOIN tbl_balance ON tbl_balance.uid =users.id  WHERE ref_id = ? OR users.id =?";
  if (_self[0].u_role === 3) {
    _sql_rest_url += " OR users.id =?"
    para.push(_self[0].parent_id)
  }
  _sql_rest_url += " ORDER BY `users`.`id` DESC"
  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
}

const setTally = async (data) => {

  let para = [data.tally];

  let _sql_rest_url = "UPDATE `tbl_balance` INNER JOIN `tbl_ac_stat` ON tbl_balance.uid = tbl_ac_stat.uid SET tbl_balance.tally=?";

  if (data.tally) {
    _sql_rest_url += " ,tbl_ac_stat.tally=? "
    para.push(data.tally)
  }

  para.push(data.uid)
  para.push(data.uid)

  _sql_rest_url += " WHERE tbl_balance.uid=? AND tbl_ac_stat.uid=?"

  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
}

const modUser = async (data) => {
  let para = [];
  let _sql_rest_url = "UPDATE `users` SET ";
  if (`locked` in data) {
    para.push(data.locked)
    _sql_rest_url += " users.bet_lock=?";
    let locked_by = 0;
    if (`locked` in data && data.locked) locked_by = data.parent_id;
    _sql_rest_url += " ,users.locked_by=?";
    para.push(locked_by)
  }
  if (`visible` in data) {
    _sql_rest_url += " users.status=?";
    para.push(data.visible)
    let visible_by = 0;
    if (`visible` in data && !data.visible) visible_by = data.parent_id;
    _sql_rest_url += " ,users.visible_by=?";
    para.push(visible_by)
  }
  _sql_rest_url += " WHERE users.id = ? ";
  para.push(data.user_id)
  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
}

const resetPassword = async (pass, user_id) => {
  let _sql_rest_url = "UPDATE users SET fcp=1,password=? WHERE id = ?";
  const [rows] = await pool.query(_sql_rest_url, [pass, user_id]);
  return rows;
}

const removeOperator = async (email) => {
  let _sql_rest_url = "UPDATE `users` SET status=0 where email=?";
  const [rows] = await pool.query(_sql_rest_url, [email]);
  return rows;
}

const addPart = async (data) => {
  let _sql_rest_url = "INSERT INTO tbl_partnership (child_id, parent_id,part, com,visible,play_mode) VALUES ?";
  _sql_rest_url += " ON DUPLICATE KEY UPDATE part = VALUES(tbl_partnership.part),visible = VALUES(tbl_partnership.visible)";
  const [rows] = await pool.query(_sql_rest_url, [data]);
  return rows;
}

const getMaxPart = async (user_id) => {
  let _sql_rest_url = "SELECT MAX(part) as max_part,play_mode as mode_id FROM `tbl_partnership` WHERE parent_id = ? GROUP by play_mode";
  const [rows] = await pool.query(_sql_rest_url, [user_id]);
  return rows;
}

const updateMarketType = async (data) => {
  const columns = Object.keys(data);
  const columnNames = columns.join(',');
  const placeholders = columns.map(() => '?').join(',');
  let sql = `INSERT INTO tbl_default_type(${columnNames}) VALUES (${placeholders})`;
  sql += ` ON DUPLICATE KEY UPDATE ${columns.map((col) => `${col} = VALUES(${col})`).join(',')}`;
  const values = columns.map((col) => data[col]);
  const [rows] = await pool.query(sql, values);
  return rows;
}

const getallPart = async (user_id, mode_id) => {
  let para = [user_id, mode_id]
  let _sql_rest_url = "WITH RECURSIVE parent_cte (id, parent_id, u_role) AS ( SELECT id, parent_id, name FROM users WHERE id = ? UNION ALL SELECT t.id, t.parent_id, t.u_role FROM users t JOIN parent_cte pc ON pc.parent_id = t.id ) SELECT parent_cte.id, parent_cte.parent_id,tbl_partnership.part,tbl_partnership.visible FROM parent_cte LEFT JOIN tbl_partnership ON tbl_partnership.child_id = parent_cte.id WHERE  1 ";
  _sql_rest_url += ' AND tbl_partnership.play_mode = ?';
  _sql_rest_url += ' ORDER BY parent_cte.id DESC'
  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
}

const updatePl = async (data) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    let _sql_rest_url = "INSERT INTO tbl_balance (uid,pl,net_pl,comm_up,comm_down,up_line,down_line) VALUES ?";
    _sql_rest_url += " ON DUPLICATE KEY UPDATE comm_up = comm_up + VALUES(comm_up), comm_down = comm_down + VALUES(comm_down), pl = pl + VALUES(pl),net_pl = net_pl + VALUES(net_pl),up_line = up_line + VALUES(up_line),down_line = down_line + VALUES(down_line)";
    const [rows] = await pool.query(_sql_rest_url, [data]);
    await connection.commit();
    return rows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const setPl = async (data) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    let _sql_rest_url = "INSERT INTO tbl_balance (uid,amount,up_line,down_line,pocket) VALUES ?";
    _sql_rest_url += " ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount), up_line = up_line + VALUES(up_line), down_line = down_line + VALUES(down_line), pocket = pocket + VALUES(pocket)";
    const [rows] = await pool.query(_sql_rest_url, [data]);
    await connection.commit();
    return rows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};


const getButtons = async (self_id) => {
  let para = [self_id]
  let _sql_rest_url = "SELECT `b_name`, `b_value` FROM tbl_buttons WHERE uid = ?";
  _sql_rest_url += " ORDER BY tbl_buttons.id"
  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
}

const detButtons = async (user_id) => {
  let _sql_rest_url = "DELETE FROM tbl_buttons WHERE `tbl_buttons`.`uid` = ?";
  const [rows] = await pool.query(_sql_rest_url, [user_id]);
  return rows;
}

const setButtons = async (data) => {
  let _sql_rest_url = "INSERT INTO tbl_buttons (uid,b_name,b_value) VALUES ?";

  const [rows] = await pool.query(_sql_rest_url, [data]);
  return rows;
}

const changePassword = async (data) => {
  let para = [];
  let _sql_rest_url = "UPDATE `users` SET fcp=0";
  if (`new_password` in data) {
    para.push(data.new_password)
    _sql_rest_url += ", users.password=?";
  }
  _sql_rest_url += " WHERE users.id=?";
  para.push(data.user_id)
  const [rows] = await pool.query(_sql_rest_url, para);
  return rows;
}

const getMarquee = async () => {
  let _sql_rest_url = "SELECT `msg`,`updated_at` FROM `tbl_message` WHERE 1 LIMIT 1";
  const [rows] = await pool.query(_sql_rest_url, []);
  return rows;
}

module.exports = {
  getProfile,
  Login,
  addUser,
  updatePart,
  getPartyCodes,
  getallParent,
  getParent,
  getUsers,
  addBalance,
  partacGen,
  setTally,
  modUser,
  resetPassword,
  removeOperator,
  addPart,
  getMaxPart,
  updateMarketType,
  getallPart,
  loginWId,
  updatePl,
  setPl,
  getChild,
  getButtons,
  setButtons,
  detButtons,
  changePassword,
  getMarquee,
  loginLog
}
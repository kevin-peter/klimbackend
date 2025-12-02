const User = require("./user-modal");
const Event = require("./../event/event-modal");
const Account = require("./../account/account-modal");
const argon2 = require('argon2');
const { getSignedToken, parseJwt } = require("../common/authenticate-token-middleware");
const { AuthError, InputError } = require("./../common/errors");
const { betStarted, alReadyStarted } = require("./../common/mutex");

const Login = async (req, res, next) => {
  try {

    if (!req.body.email) throw new InputError("Email is required");
    if (!req.body.password) throw new InputError("Password is required");

    const username = req.body.email;
    const password = req.body.password;
    const ref = req.body.pref;

    const login = await User.Login(username, ref);

    if (!login) throw Error("Email Not Found");

    const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip;

    const data = {
      email: username,
      password: await argon2.hash(password),
      ip: ip,
      bro: req.header('user-agent'),
      last_session: Date.now() / 1000 | 0,
      status: login.length > 0 && await argon2.verify(login[0].password, password) ? "Success" : "Failed",
      loc: req.body.pos ? req.body.pos : ""
    }

    await User.loginLog(data)

    if (login.length < 1) throw new AuthError("Wrong Username Or Password");

    if (!await argon2.verify(login[0].password, password))

      throw new AuthError("Wrong Username Or Password");

    const token = await getSignedToken(login);
    const part = await Event.getPart(login[0].id, 1);
    let btns = await User.getButtons(login[0].id);

    if (btns.length === 0) {
      btns = await User.getButtons(1);
    }

    res.status(200).json({
      success: true,
      role: login[0].u_role,
      balance: login[0].amount,
      exposer: login[0].exposer,
      name: login[0].name,
      fcp: login[0].fcp,
      token,
      mode: part,
      btns: btns
    });

  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const profile = await User.loginWId(parseJwt(req).id);
    delete (profile[0].password)
    delete (profile[0].id)
    delete (profile[0].parent_id)
    const message = await User.getMarquee();
    res.status(200).json({
      success: true,
      data: {
        profile,
        message
      }
    });
  } catch (error) {
    next(error);
  }
};


const addUser = async (req, res, next) => {
  try {
    if (!req.body.admin_password) throw new InputError("Please Type Admin Password");
    if (!req.body.name) throw new InputError("Name is required");
    if (!req.body.email) throw new InputError("Email is required");
    if (!req.body.u_role) throw new InputError("Role is required");

    let data = { ...req.body }
    let pass = req.body.password ? req.body.password : "Abcd1234";
    data.password = await argon2.hash(pass);

    let password = req.body.admin_password;

    const login = await User.loginWId(parseJwt(req).id, password);

    if (!login)
      throw new AuthError("Try Again After Re Login");

    if (!await argon2.verify(login[0].password, password))
      throw new AuthError("Password Not Match");

    const _self = await User.loginWId(parseJwt(req).id) // login user info
    const profile = await User.Login(data.email); // check user exist

    data.parent_id = _self[0].id;
    data.webref = req.body.webref ? req.body.webref : _self[0].webref;

    if (profile && profile.length > 0) throw new InputError("User Already Exist")
    const part_arr = [];
    const bal_arr = [];
    let ac_arr = [];
    const part = await Event.getPart(_self[0].id);
    for (let i = 0; i < req.body.partArr.length; i++) {
      for (let j = 0; j < part.length; j++) {
        if (part[j].mode_id === req.body.partArr[i].mode_id) {
          if (part[j].our < req.body.partArr[i].downline)
            throw new AuthError(`Downline PartnerShip Is More In ${part[j].play} MAX  ${part[j].our}`);
        }
      }
    }

    const user = await User.addUser(data);
    let dwn = parseInt(req.body.u_role) > 4 ? -100 : 0;
    for (let i = 0; i < req.body.partArr.length; i++) {
      dwn = 'downline' in req.body.partArr[i] && parseInt(req.body.u_role) < 5 ? req.body.partArr[i].downline : dwn
      part_arr.push([
        user.insertId, data.parent_id, dwn, 0, req.body.partArr[i].active, req.body.partArr[i].mode_id])
    }

    let free_chip = req.body && req.body.free_chip ? req.body.free_chip : 0
    await User.addPart(part_arr);
    bal_arr.push([data.parent_id, free_chip], [user.insertId, free_chip])

    ac_arr.push([
      user.insertId, data.free_chip, 0, 0, 0, 0, 0, "CR", _self[0].id, user.insertId, 0, 0, 0, 0, 0, 0, "WElCOME DEPOSIT TO " + req.body.email, 0, 0], [_self[0].id, data.free_chip * (-1), 0, 0, 0, 0, 0, "DR", _self[0].id, user.insertId, _self[0].amount, Number(_self[0].amount) + Number(data.free_chip * (-1)), 0, 0, 0, 0, "WElCOME WIDTHDROW FROM SELF", 0, 0])

    await User.addBalance(bal_arr);
    await Account.addAccountEntry(ac_arr);

    res.status(200).json({
      success: user.insertId ? true : false,
      data: [],
      message: user.insertId ? "User Created" : "Failed Create User",
    });

  } catch (error) {
    next(error);
  }
}

const getUsers = async (req, res, next) => {
  try {
    if (req.body && req.body.user_id) {
      let p_s = await isParent(parseJwt(req).id, req.body.user_id);
      if (!p_s) throw new AuthError("Try Again After Re Login");
    }
    req.body.user_id = req.body.user_id ? req.body.user_id : parseJwt(req).id
    const profile = await User.loginWId(parseJwt(req).id);
    delete (profile[0].password)
    delete (profile[0].id)
    delete (profile[0].parent_id)
    const users = await User.getUsers(req.body);
    res.status(200).json({
      success: users.length > 0 ? true : false,
      data: users,
      profile: profile.length > 0 ? profile[0] : {}
    });
  } catch (error) {
    next(error);
  }
};

const getPartyCodes = async (req, res, next) => {
  try {
    let role = req.body.role ? req.body.role : 5;
    const codes = await User.getPartyCodes(parseJwt(req).id, role);
    res.status(200).json({
      success: true,
      data: codes,
    });
  } catch (error) {
    next(error);
  }
};

const acGen = async (req, res, next) => {
  try {
    const _self = await User.getProfile(parseJwt(req).id) // login user info
    let users = [];
    users = await User.partacGen(_self);
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

const setTally = async (req, res, next) => {
  try {
    if (!req.body.email) throw new InputError("Email is required");
    const _self = await User.getProfile(req.body.email) // login user info
    req.body.uid = _self[0].id;
    let data = await User.setTally(req.body);
    res.status(200).json({
      success: data.affectedRows ? true : false,
      data: [],
      message: data.affectedRows ? "Updated" : "Failed"
    });
  } catch (error) {
    next(error);
  }
}

const modUser = async (req, res, next) => {
  try {
    if (req.body && !req.body.user_id) throw new InputError("UserId is required");
    req.body.parent_id = parseJwt(req).id;
    let p_s = await isParent(req.body.parent_id, req.body.user_id);
    if (!p_s) throw new AuthError("Try Again After Re Login");
    let data = await User.modUser(req.body);
    res.status(200).json({
      success: true,
      data: [],
      message: data.affectedRows ? "Updated" : "UnChanged"
    });
  } catch (error) {
    next(error);
  }
}

const resetPassword = async (req, res, next) => {
  try {
    let pass = req.body.password = req.body.password ? req.body.password : "Abcd1234";
    pass = await argon2.hash(pass);
    let data = await User.resetPassword(pass, req.body.user_id);
    res.status(200).json({
      success: data.affectedRows ? true : false,
      data: [],
      message: data.affectedRows ? `Password is Reset To ${req.body.password}` : "Failed Reset Password"
    });
  } catch (error) {
    next(error);
  }
}

const removeOperator = async (req, res, next) => {
  try {
    let data = await User.removeOperator(req.body.email);
    res.status(200).json({
      success: data.affectedRows ? true : false,
      data: [],
      message: data.affectedRows ? "Updated" : "Failed"
    });
  } catch (error) {
    next(error);
  }
}

const updateChips = async (req, res, next) => {
  try {
    if (!req.body.admin_password) throw new InputError("Please Type Admin Password");
    if (!req.body.user_id) throw new InputError("Please Select User");
    if (!req.body.t_type) throw new InputError("Please Select Type OF Tranjection");
    if (!req.body.deposite_bal) throw new InputError("Please Enter Amount");
    if (req.body.deposite_bal < 0) throw new InputError("Please Enter Valid Amount");

    let data = req.body ? req.body : {};
    data.parent_id = parseJwt(req).id;
    let p_s = await isParent(data.parent_id, req.body.user_id, "", data.parent_id);
    if (!p_s) throw new AuthError("Try Again After Re Login");
    let bal_arr = [];
    let ac_arr = [];
    let mul_by = data && data.t_type && data.t_type === 'withdraw' ? 1 : -1;
    let p_type = data && data.t_type && data.t_type === 'withdraw' ? "CR" : "DR";
    let c_type = data && data.t_type && data.t_type === 'withdraw' ? "DR" : "CR";

    let password = req.body.admin_password;

    const login = await User.loginWId(parseJwt(req).id, password);
    if (!login)
      throw new AuthError("Try Again After Re Login");

    if (!await argon2.verify(login[0].password, password))
      throw new AuthError("Password Not Match");

    const user_details = await User.loginWId(data.user_id)
    const parent_details = await User.loginWId(data.parent_id)

    if (user_details[0].parent_id !== data.parent_id)
      throw new InputError("Not a Direct Parent");

    if (data.t_type === 'withdraw' && Number(user_details[0].amount) + Number(user_details[0].exposer) + Number(user_details[0].up_line) < Number(req.body.deposite_bal))
      throw new InputError(`Max Withdraw Amount IS ${Number(user_details[0].amount) + Number(user_details[0].exposer) + Number(user_details[0].up_line)}`);

    if (data.t_type === 'deposit' && Number(parent_details[0].amount) + Number(parent_details[0].exposer) < Number(req.body.deposite_bal))
      throw new InputError(`Max DEPOSIT Amount IS ${Number(parent_details[0].amount) + Number(parent_details[0].exposer)}`);

    bal_arr.push([
      data.parent_id,
      data.deposite_bal * mul_by * (-1),
    ],
      [
        data.user_id,
        data.deposite_bal * mul_by,
      ])

    let p_remark = data && data.t_type && data.t_type === 'withdraw' ? "DESPOSIT TO SELF FROM " + req.body.p_code.toUpperCase() : "WITHDRAW FROM SELF TO " + req.body.p_code.toUpperCase();

    let c_remark = data && data.t_type && data.t_type === 'withdraw' ? "WITHDRAW" : "DESPOSIT";

    if (req.body.remark) {
      p_remark += "/" + req.body.remark
      c_remark += "/" + req.body.remark
    }

    ac_arr.push([
      data.user_id, data.deposite_bal * mul_by * (-1), 0, 0, 0, 0, 0, c_type, data.parent_id, data.user_id, user_details[0].amount, Number(user_details[0].amount) + Number(data.deposite_bal * mul_by * (-1)), 0, 0, 0, 0, c_remark, 0, 0], [data.parent_id, data.deposite_bal * mul_by, 0, 0, 0, 0, 0, p_type, data.parent_id, data.user_id, parent_details[0].amount, Number(data.deposite_bal * mul_by) + Number(parent_details[0].amount), 0, 0, 0, 0, p_remark, 0, 0])

    const _rw = await User.addBalance(bal_arr);
    await Account.addAccountEntry(ac_arr);
    let ob = {
      user_id: data.user_id,
      action: "balance"
    }
    req.app.io.to(data.user_id).emit("updates", ob)
    res.status(200).json({
      success: _rw.affectedRows ? true : false,
      data: [],
      message: _rw.affectedRows ? "Balance Updated" : "Failed Update"
    });
  } catch (error) {
    next(error);
  }
}

const updatePart = async (req, res, next) => {
  try {

    if (!req.body.admin_password) throw new InputError("Please Type Admin Password");
    if (!req.body.user_id) throw new InputError("Please Select User");

    let part_arr = [];
    let password = req.body.admin_password;

    const login = await User.loginWId(parseJwt(req).id, password);

    if (!login)
      throw new AuthError("Try Again After Re Login");

    if (!await argon2.verify(login[0].password, password))
      throw new AuthError("Password Not Match");

    let p_s = await isParent(parseJwt(req).id, req.body.user_id, "", parseJwt(req).id);
    if (!p_s) throw new AuthError("Try Again After Re Login");

    let max_part = await User.getMaxPart(req.body.user_id);

    let my_part = await Event.getPart(parseJwt(req).id);

    let dwn = parseInt(req.body.u_role) === 5 ? -100 : 0;
    for (let i = 0; i < req.body.partArr.length; i++) {
      for (let j = 0; j < max_part.length; j++) {
        if (req.body.partArr[i].mode_id === max_part[j].mode_id
          && parseInt(max_part[j].max_part) > parseInt(req.body.partArr[i].downline)) {
          throw new InputError(`Correct First Child Partneship to ${req.body.partArr[i].downline} %`);
        }
      }
      for (let k = 0; k < my_part.length; k++) {
        if (req.body.partArr[i].mode_id === my_part[k].mode_id
          && parseInt(my_part[k].our) < parseInt(req.body.partArr[i].downline)) {
          throw new InputError(`Set Partneship For ${my_part[k].play} less than  ${my_part[k].our} %`);
        }
      }
      dwn = 'downline' in req.body.partArr[i] ? req.body.partArr[i].downline : dwn;
      part_arr.push([
        req.body.user_id, parseJwt(req).id, dwn, 0, req.body.partArr[i].active, req.body.partArr[i].mode_id])
    }
    let data = await User.addPart(part_arr);
    res.status(200).json({
      success: data.affectedRows ? true : false,
      data: [],
      message: data.affectedRows ? "PartnerShip Updated" : "Failed"
    });
  } catch (error) {
    next(error);
  }
}

const updateMarketType = async (req, res, next) => {
  try {

    if (!req.body.mode_id) throw new InputError("Select Sports");
    if (!'type_name' in req.body) throw new InputError("Select Market Type First");
    if (!req.body.admin_password) throw new InputError("Please Type Admin Password");

    if (req.body.user_id) {
      let p_s = await isParent(parseJwt(req).id, req.body.user_id, "", parseJwt(req).id);
      if (!p_s) throw new AuthError("Try Again After Re Login");
    } else {
      req.body.user_id = parseJwt(req).id;
    }

    let market_id = req.body.market_id ? true : false;
    let event_id = req.body.event_id ? true : false;

    let password = req.body.admin_password;

    const login = await User.loginWId(parseJwt(req).id, password);

    if (!login)
      throw new AuthError("Try Again After Re Login");

    if (!await argon2.verify(login[0].password, password))
      throw new AuthError("Password Not Match");

    req.body.admin_id = parseJwt(req).id;
    if (!market_id) {
      req.body.market_id = 0
    }
    if (!event_id) {
      req.body.event_id = 0
    }
    delete (req.body.admin_password)
    const _row = await User.updateMarketType(req.body);
    res.status(200).json({
      success: true,
      data: [],
      message: _row.insertId || _row.affectedRows ? "SETTINNG UPDATED" : "NO CHANGE",
    });
  } catch (error) {
    next(error)
  }
}

const isParent = async (parent_id, user_id, role = "", p_id = "") => {
  const users = await User.getallParent(user_id, role, p_id);
  let found = false
  for (let i = 0; i < users.length; i++) {
    if (parent_id === users[i].parent_id) {
      found = true
    }
  }
  return found
}

const setPl = async (req, res, next) => {
  try {

    if (!req.body.admin_password) throw new InputError("Please Type Admin Password");
    if (!req.body.user_id) throw new InputError("Please Select User");
    if (!req.body.t_type) throw new InputError("Please Select Type OF Tranjection");
    if (!req.body.deposite_bal) throw new InputError("Please Enter Amount");
    if (req.body.deposite_bal < 0) throw new InputError("Please Enter Valid Amount");

    const login = await User.loginWId(parseJwt(req).id, req.body.admin_password);
    if (!login)
      throw new AuthError("Try Again After Re Login");

    if (!await argon2.verify(login[0].password, req.body.admin_password))
      throw new AuthError("Password Not Match");

    req.body.parent_id = parseJwt(req).id

    if (await alReadyStarted(req.body.parent_id)) throw new InputError("Another Tranjection InProgress");
    await betStarted(req.body.parent_id, true)

    let data = req.body ? req.body : {};
    let bal_arr = [];
    let ac_arr = [];
    let mul_by = data && data.t_type && data.t_type === 'withdraw' ? 1 : -1;
    let p_type = data && data.t_type && data.t_type === 'withdraw' ? "CR" : "DR";
    let c_type = data && data.t_type && data.t_type === 'withdraw' ? "DR" : "CR";
    let p_type_b = data && data.t_type && data.t_type === 'withdraw' ? "CR" : "DR";
    let c_type_b = data && data.t_type && data.t_type === 'withdraw' ? "DR" : "CR";

    const user_details = await User.loginWId(data.user_id)
    const parent_details = await User.loginWId(data.parent_id)

    if (user_details[0].parent_id !== data.parent_id)
      throw new InputError("Not a Direct Parent");

    let c_mul = user_details[0].u_role === 5 ? -1 : 1;
    let auto = req.body.auto ? JSON.parse(req.body.auto) : true;

    bal_arr.push([
      data.parent_id,
      user_details[0].u_role === 5 && auto ? data.deposite_bal * mul_by : 0,
      0,
      data.deposite_bal * mul_by,
      data.deposite_bal * mul_by * (-1),
    ],
      [
        data.user_id,
        user_details[0].u_role === 5 && auto ? data.deposite_bal * mul_by * (-1) : 0,
        data.deposite_bal * mul_by * c_mul,
        0,
        data.deposite_bal * mul_by
      ])

    let p_remark = data && data.t_type && data.t_type === 'withdraw' ? "SETTLEMENT PAID TO " + req.body.p_code.toUpperCase() : "SETTLEMENT RECEIVED FROM " + req.body.p_code.toUpperCase();

    let c_remark = data && data.t_type && data.t_type === 'withdraw' ? "SETTLEMENT RECEIVED FROM UPLINE" : "SETTLEMENT PAID TO UPLINE";

    let p_remark_b = data && data.t_type && data.t_type === 'withdraw' ? "DESPOSIT CHIPS TO " + req.body.p_code.toUpperCase() : "WITHDRAW FROM CHIPS TO " + req.body.p_code.toUpperCase();

    let c_remark_b = data && data.t_type && data.t_type === 'withdraw' ? "WITHDRAW CHIPS BY UPLINE" : "DESPOSIT CHIPS BY UPLINE";

    if (req.body.remark) {
      p_remark += "/" + req.body.remark
      c_remark += "/" + req.body.remark
      p_remark_b += "/" + req.body.remark
      c_remark_b += "/" + req.body.remark
    }

    ac_arr.push([
      data.user_id, data.deposite_bal * mul_by * (-1), 0, 0, 0, 0, 0, c_type, data.parent_id, data.user_id, user_details[0].amount, user_details[0].u_role === 5 ? user_details[0].amount : Number(data.deposite_bal * mul_by * (-1)) + Number(user_details[0].down_line) - Number(user_details[0].up_line), -1, -1, -1, 0, c_remark, 0, 0], [data.parent_id, data.deposite_bal * mul_by, 0, 0, 0, 0, 0, p_type, data.parent_id, data.user_id, parent_details[0].amount, Number(data.deposite_bal * mul_by) + Number(parent_details[0].down_line) - Number(parent_details[0].up_line), -1, -1, -1, 0, p_remark, 0, 0])

    if (user_details[0].u_role === 5 && auto) {
      ac_arr.push([
        data.user_id, data.deposite_bal * mul_by * (-1), 0, 0, 0, 0, 0, c_type_b, data.parent_id, data.user_id, user_details[0].amount, Number(user_details[0].amount) + Number(data.deposite_bal * mul_by * (-1)), 0, 0, 0, 0, c_remark_b, 0, 0], [data.parent_id, data.deposite_bal * mul_by, 0, 0, 0, 0, 0, p_type_b, data.parent_id, data.user_id, parent_details[0].amount, Number(data.deposite_bal * mul_by) + Number(parent_details[0].amount), 0, 0, 0, 0, p_remark_b, 0, 0])
    }

    const _rw = await User.setPl(bal_arr);
    await Account.addAccountEntry(ac_arr);
    let ob = {
      user_id: data.user_id,
      action: "balance"
    }
    req.app.io.to(data.user_id).emit("updates", ob)

    res.status(200).json({
      success: _rw.affectedRows ? true : false,
      data: [],
      message: _rw.affectedRows ? "PL Updated" : "Failed Update"
    });

  } catch (error) {
    next(error);
  } finally {
    await betStarted(req.body.parent_id, false);
  }
}

const getButtons = async (req, res, next) => {
  try {
    const user_id = parseJwt(req).id
    let btns = await User.getButtons(user_id);
    if (btns.length === 0) {
      btns = await User.getButtons(1);
    }
    res.status(200).json({
      success: true,
      data: btns,

    });
  } catch (error) {
    next(error);
  }
};

const setButtons = async (req, res, next) => {
  try {
    const user_id = parseJwt(req).id
    let data = [
      [user_id, req.body.lbl1, req.body.val1],
      [user_id, req.body.lbl2, req.body.val2],
      [user_id, req.body.lbl3, req.body.val3],
      [user_id, req.body.lbl4, req.body.val4],
      [user_id, req.body.lbl5, req.body.val5],
      [user_id, req.body.lbl6, req.body.val6],
      [user_id, req.body.lbl7, req.body.val7],
      [user_id, req.body.lbl8, req.body.val8],
    ];
    await User.detButtons(user_id)

    let _rw = await User.setButtons(data);
    res.status(200).json({
      success: true,
      data: [],
      message: _rw.affectedRows ? "Button Updated" : "Failed Update"
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    if (!req.body.current_password) throw new InputError("Old Password is required !");
    if (!req.body.new_password) throw new InputError("Password is required !");
    if (!req.body.pref) throw new InputError("No Ref !");
    if (!req.body.new_confirm_password) throw new InputError("Confirm Password is required !");
    if (req.body.new_confirm_password !== req.body.new_password) throw new InputError("Both Password Not Match !");

    if (req.body.new_password.length < 6 || req.body.new_password.length > 25) throw new InputError("Password is Not Valid !");

    const _self = await User.getProfile(parseJwt(req).id) // login user info

    const username = _self[0].email;
    const password = req.body.current_password;
    const ref = req.body.pref;

    const login = await User.Login(username, ref);

    if (!login) throw Error("Email Not Found");

    if (login.length < 1) throw new AuthError("Wrong Username Or Password");

    if (!await argon2.verify(login[0].password, password))

      throw new InputError("Wrong Old Password");

    const data = req.body;
    data.new_password = await argon2.hash(req.body.new_password);
    data.user_id = parseJwt(req).id;
    let _rw = await User.changePassword(data);

    res.status(200).json({
      success: true,
      message: _rw.affectedRows ? "Password Updated" : "Failed Update"
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  Login,
  addUser,
  getUsers,
  getPartyCodes,
  acGen,
  setTally,
  modUser,
  resetPassword,
  removeOperator,
  updateChips,
  updatePart,
  updateMarketType,
  setPl,
  getButtons,
  setButtons,
  changePassword
}
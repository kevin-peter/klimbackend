const User = require("./user-modal");
const Account = require("../account/account-modal");
const argon2 = require("argon2");
const {
  getSignedToken,
  parseJwt,
} = require("../common/authenticate-token-middleware");
const { AuthError, InputError } = require("./../common/errors");
//const { betStarted, alReadyStarted } = require("./../common/mutex");
const Login = async (req, res, next) => {
  try {
    if (!req.body.email) throw new InputError("Email is required");
    if (!req.body.password) throw new InputError("Password is required");

    const username = req.body.email;
    const password = req.body.password;

    const login = await User.Login(username, password);

    if (!login) throw Error("Email Not Found");

    if (login.length < 1) throw new AuthError("Wrong Username Or Password");

    if (!(await argon2.verify(login[0].password, password)))
      throw new AuthError("Wrong Username Or Password");

    login[0].ip = req.ip || req.connection.remoteAddress;

    let deletedRows = await User.delUserToken(login[0].id);
    const token = await getSignedToken(login);
    let insertedRows = await User.addUserToken(login[0].id, token);
    let part = [];
    part = await User.getPart(login[0].id, 1);
    // let btns = await User.getButtons(login[0].id);
    // if (btns.length === 0) {
    //   btns = await User.getButtons(1);
    // }

    //console.log(login[0])
    res.status(200).json({
      success: true,
      role: login[0].u_role,
      name: login[0].name,
      bal: login[0].amount == null ? 0 : login[0].amount,
      exp: login[0].exposer == null ? 0 : login[0].exposer,
      //fcp: login[0].fcp,
      token,
      mode: part,
      //btns: btns
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    if (!req.body.email) throw new InputError("Email is required");
    const email = req.body.email;
    const profile = await User.getProfile(email);
    res.status(200).json({
      success: true,
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProf = async (req, res, next) => {
  try {
    const profile = await User.loginWId(parseJwt(req).id);
    delete profile[0].password;
    delete profile[0].id;
    delete profile[0].parent_id;
    //console.log(profile)
    const message = await User.getMarquee();
    res.status(200).json({
      success: true,
      data: {
        profile,
        message,
      },
    });
  } catch (error) {
    next(error);
  }
};

const addUser = async (req, res, next) => {
  try {
    if (!req.body.admin_password)
      throw new InputError("Please Type Admin Password");
    if (!req.body.name) throw new InputError("Name is required");
    if (!req.body.email) throw new InputError("Email is required");
    if (!req.body.u_role) throw new InputError("Role is required");

    let data = { ...req.body };
    let pass = req.body.password ? req.body.password : "Abcd1234";
    data.password = await argon2.hash(pass);

    let password = req.body.admin_password;

    const login = await User.loginWId(parseJwt(req).id, password);

    if (!login) throw new AuthError("Try Again After Re Login");

    if (!(await argon2.verify(login[0].password, password)))
      throw new AuthError("Password Not Match");

    const _self = await User.loginWId(parseJwt(req).id); // login user info
    const profile = await User.Login(data.email); // check user exist

    data.parent_id = _self[0].id;
    data.webref = req.body.webref ? req.body.webref : _self[0].webref;

    if (profile && profile.length > 0)
      throw new InputError("User Already Exist");
    const part_arr = [];
    const bal_arr = [];
    let ac_arr = [];

    const part = await User.getPart(_self[0].id);
    //console.log(_self[0].id)
    for (let i = 0; i < req.body.partArr.length; i++) {
      for (let j = 0; j < part.length; j++) {
        if (part[j].mode_id === req.body.partArr[i].mode_id) {
          if (part[j].our < req.body.partArr[i].downline)
            throw new AuthError(
              `Downline PartnerShip Is More In ${part[j].play} MAX  ${part[j].our}`
            );
        }
      }
    }

    const user = await User.addUser(data);
    let dwn = parseInt(req.body.u_role) > 4 ? -100 : 0;
    for (let i = 0; i < req.body.partArr.length; i++) {
      dwn =
        "downline" in req.body.partArr[i] && parseInt(req.body.u_role) < 5
          ? req.body.partArr[i].downline
          : dwn;
      part_arr.push([
        user.insertId,
        data.parent_id,
        dwn,
        0,
        req.body.partArr[i].active,
        req.body.partArr[i].mode_id,
      ]);
    }

    let free_chip = req.body && req.body.free_chip ? req.body.free_chip : 0;
    let p = await User.addPart(part_arr);
    bal_arr.push([data.parent_id, -Math.abs(free_chip)], [user.insertId, free_chip]);

    ac_arr.push(
      [
        user.insertId,
        data.free_chip,
        0,
        0,
        0,
        "CR",
        _self[0].id,
        user.insertId,
        0,
        0,
        4,
        0,
        0,
        0,
        "WElCOME DEPOSIT TO " + req.body.email,
        0,
        1,
      ],
      [
        _self[0].id,
        data.free_chip,
        0,
        0,
        0,
        "DR",
        _self[0].id,
        user.insertId, //data.user_id,
        _self[0].amount,
        Number(_self[0].amount) + Number(data.free_chip * -1),
        4,
        0,
        0,
        0,
        "WElCOME WIDTHDROW FROM SELF",
        0,
        1,
      ]
    );

    await User.addBalance(bal_arr);
    await User.addAccountEntry(ac_arr);

    res.status(200).json({
      success: user.insertId ? true : false,
      data: [],
      message: user.insertId ? "User Created" : "Failed Create User",
    });
  } catch (error) {
    next(error);
  }
};

const addUser_old = async (req, res, next) => {
  try {
    if (!req.body.name) throw new InputError("Name is required");
    if (!req.body.email) throw new InputError("Email is required");
    let data = { ...req.body };
    data.password = await argon2.hash("123456");
    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const profile = await User.getProfile(data.email); // check user exist
    if (data.p_code) {
      const p_data = await User.getProfile(data.p_code);
      data.ref_id = p_data[0].id;
    } else {
      data.ref_id = _self[0].id;
    }
    if (parseInt(data.u_role) !== 6 && parseInt(data.u_role) !== 4) {
      data.part = 0;
    }
    if (parseInt(data.u_role) === 6 && parseInt(data.part) > _self[0].part)
      throw new InputError("Availble Part is " + _self[0].part + "");

    data.parent_id = _self[0].id;
    data.c_out = data.c_out ? data.c_out : 0;
    data.c_in = data.c_in ? data.c_in : 0;
    data.cutting = req.body.cutting ? req.body.cutting : 0;

    /* agent comm out zero */
    if (parseInt(data.u_role) === 7) {
      data.c_out = 0;
    }
    /* client comm part zero */
    if (parseInt(data.u_role) === 5) {
      data.c_out = 0;
      data.part = 0;
    }
    if (profile && profile.length > 0)
      throw new InputError("User Already Exist");
    const user = await User.addUser(data);
    res.status(200).json({
      success: user.insertId ? true : false,
      data: [],
      message: user.insertId ? "User Created" : "Faild Create User",
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    // if (req.body && req.body.user_id) {
    //   let p_s = await isParent(parseJwt(req).id, req.body.user_id);
    //   if (!p_s) throw new AuthError("Try Again After Re Login");
    // }
    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //req.body.user_id = req.body.user_id ? req.body.user_id : parseJwt(req).id
    req.body.user_id = _self[0].id;

    const profile = await User.loginWId(parseJwt(req).id);
    delete profile.password;
    delete profile.id;
    delete profile.parent_id;

    //console.log(_self)
    const users = await User.getUsers(req.body);

    //console.log(profile)

    res.status(200).json({
      success: users.length > 0 ? true : false,
      data: users,
      profile: profile[0],
    });
  } catch (error) {
    next(error);
  }
};

const getPartyCodes = async (req, res, next) => {
  try {
    const _self = await User.getProfile(parseJwt(req).email); // login user info
    let role = req.body.role ? req.body.role : 5;
    const codes = await User.getPartyCodes(_self[0].id, role);
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
    const _self = await User.getProfile(parseJwt(req).email); // login user info
    let users = [];
    users = await User.partacGen(_self);
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const setTally = async (req, res, next) => {
  try {
    if (!req.body.email) throw new InputError("Email is required");
    const _self = await User.getProfile(req.body.email); // login user info
    req.body.uid = _self[0].id;
    let data = await User.setTally(req.body);
    console.log(data);
    res.status(200).json({
      success: data.changedRows ? true : false,
      data: [],
      message: data.changedRows ? "Updated" : "Faild",
    });
  } catch (error) {
    next(error);
  }
};

const modUser = async (req, res, next) => {
  try {
    if (req.body && !req.body.email) throw new InputError("Email is required");

    if (req.body && req.body.c_out && isNaN(req.body.c_out))
      throw new InputError("Non Numeric Commision");

    if (req.body && req.body.c_out && req.body.c_out < 0)
      throw new InputError("Comm Not Valid");

    if (req.body && req.body.name && req.body.name.length > 30)
      throw new InputError("Name Is To Big");

    if (req.body && req.body.part && isNaN(req.body.part))
      throw new InputError("Non Numeric Partnership");

    if ((req.body && req.body.part && req.body.part > 100) || req.body.part < 0)
      throw new InputError("Invalid Partnership");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    const l_user = await User.getProfile(req.body.email); // req user info

    if (parseInt(l_user[0].u_role) === 6 && `part` in req.body) {
      if (_self[0].part + l_user[0].part < req.body.part)
        throw new InputError("No Partnship Change");
      await User.updatePart(
        _self[0].part + l_user[0].part - req.body.part,
        parseJwt(req).email
      );
    }

    let data = await User.modUser(req.body);

    res.status(200).json({
      success: true,
      data: [],
      message: data.changedRows ? "Updated" : "UnChanged",
    });
  } catch (error) {
    next(error);
  }
};

const changeStatus = async (req, res, next) => {
  try {
    const _self = await User.getProfile(parseJwt(req).email); // login user info

    const l_user = await User.getProfile(req.body.email); // req user info

    let data = await User.changeStatus(req.body);

    res.status(200).json({
      success: true,
      data: [],
      message: data.changedRows ? "Updated" : "UnChanged",
    });
  } catch (error) {
    next(error);
  }
};

const getBalance = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    let bal = await User.getBalance(req.body);

    //console.log(bal);

    res.status(200).json({
      success: true,
      data: bal,
      message: "Balance retrived",
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    let pass = (req.body.password = req.body.password
      ? req.body.password
      : "Abcd1234");
    pass = await argon2.hash(pass);
    let data = await User.resetPassword(pass, req.body.user_id);
    // console.log(data)
    res.status(200).json({
      success: data.affectedRows == 0 ? true : false,
      data: [],
      message:
        data.affectedRows == 0
          ? `Password is Reset To ${req.body.password}`
          : "Failed Reset Password",
    });
  } catch (error) {
    next(error);
  }
};

const removeOperator = async (req, res, next) => {
  try {
    let data = await User.removeOperator(req.body.email);
    res.status(200).json({
      success: data.affectedRows ? true : false,
      data: [],
      message: data.affectedRows ? "Updated" : "Failed",
    });
  } catch (error) {
    next(error);
  }
};

const updateChips = async (req, res, next) => {
  try {
    if (!req.body.admin_password)
      throw new InputError("Please Type Admin Password");
    if (!req.body.user_id) throw new InputError("Please Select User");
    if (!req.body.t_type)
      throw new InputError("Please Select Type OF Tranjection");
    if (!req.body.deposite_bal) throw new InputError("Please Enter Amount");
    if (req.body.deposite_bal < 0)
      throw new InputError("Please Enter Valid Amount");

    let data = req.body ? req.body : {};
    data.parent_id = parseJwt(req).id;

    // let p_s = await isParent(data.parent_id, req.body.user_id, "", data.parent_id);
    // if (!p_s) throw new AuthError("Try Again After Re Login");
    let bal_arr = [];
    let ac_arr = [];
    let mul_by = data && data.t_type && data.t_type === "withdraw" ? -1 : 1;
    let p_type =
      data && data.t_type && data.t_type === "withdraw" ? "CR" : "DR";
    let c_type =
      data && data.t_type && data.t_type === "withdraw" ? "DR" : "CR";

    let password = req.body.admin_password;

    const login = await User.loginWId(parseJwt(req).id, password);
    if (!login) throw new AuthError("Try Again After Re Login");

    if (!(await argon2.verify(login[0].password, password)))
      throw new AuthError("Password Not Match");

    let user_details = await User.loginWId(data.user_id);
    let parent_details = await User.loginWId(data.parent_id);

    user_details[0] ? (user_details = user_details[0]) : "";
    parent_details[0] ? (parent_details = parent_details[0]) : "";

    if (user_details.parent_id !== data.parent_id)
      throw new InputError("Not a Direct Parent");

    if (
      data.t_type === "withdraw" &&
      Number(user_details.amount) +
        Number(user_details.exposer) +
        Number(user_details.up_line) <
        Number(req.body.deposite_bal)
    )
      throw new InputError(
        `Max Withdraw Amount IS ${
          Number(user_details.amount) +
          Number(user_details.exposer) +
          Number(user_details.up_line)
        }`
      );

    if (
      data.t_type === "deposit" &&
      Number(parent_details.amount) + Number(parent_details.exposer) <
        Number(req.body.deposite_bal)
    )
      throw new InputError(
        `Max DEPOSIT Amount IS ${
          Number(parent_details.amount) + Number(parent_details.exposer)
        }`
      );

    bal_arr.push(
      [data.parent_id, data.deposite_bal * mul_by * -1],
      [data.user_id, data.deposite_bal * mul_by]
    );

    let p_remark =
      data && data.t_type && data.t_type === "withdraw"
        ? "DESPOSIT TO SELF FROM " + req.body.p_code.toUpperCase()
        : "WITHDRAW FROM SELF TO " + req.body.p_code.toUpperCase();

    let c_remark =
      data && data.t_type && data.t_type === "withdraw"
        ? "WITHDRAW"
        : "DESPOSIT";

    if (req.body.remark) {
      p_remark += "/" + req.body.remark;
      c_remark += "/" + req.body.remark;
    }

    ac_arr.push(
      [
        data.user_id,
        data.deposite_bal * mul_by,
        0,
        0,
        0,
        c_type,
        data.parent_id,
        data.user_id,
        user_details.amount,
        Number(user_details.amount) + Number(data.deposite_bal * mul_by),
        4,
        0,
        0,
        0,
        c_remark,
        0,
        1,
      ],
      [
        data.parent_id,
        data.deposite_bal * mul_by * -1,
        0,
        0,
        0,
        p_type,
        data.parent_id,
        data.user_id,
        parent_details.amount,
        Number(data.deposite_bal * mul_by * -1) + Number(parent_details.amount),
        4,
        0,
        0,
        0,
        p_remark,
        0,
        1,
      ]
    );

    const _rw = await User.addBalance(bal_arr);
    // console.log(user_details)
    // console.log(ac_arr)
    await User.addAccountEntry(ac_arr);
    // let ob = {
    //   user_id: data.user_id,
    //   action: "balance",
    // };
    //req.app.io.to(data.user_id).emit("updates", ob);
    res.status(200).json({
      success: _rw.affectedRows ? true : false,
      data: [],
      message: _rw.affectedRows ? "Balance Updated" : "Failed Update",
    });
  } catch (error) {
    next(error);
  }
};

const updatePart = async (req, res, next) => {
  try {
    if (!req.body.admin_password)
      throw new InputError("Please Type Admin Password");
    if (!req.body.user_id) throw new InputError("Please Select User");

    let part_arr = [];
    let password = req.body.admin_password;

    const login = await User.loginWId(parseJwt(req).id, password);

    if (!login) throw new AuthError("Try Again After Re Login");

    if (!(await argon2.verify(login.password, password)))
      throw new AuthError("Password Not Match");

    // let p_s = await isParent(
    //   parseJwt(req).id,
    //   req.body.user_id,
    //   "",
    //   parseJwt(req).id
    // );
    // if (!p_s) throw new AuthError("Try Again After Re Login");

    let max_part = await User.getMaxPart(req.body.user_id);

    let my_part = await Event.getPart(parseJwt(req).id);

    let dwn = parseInt(req.body.u_role) === 5 ? -100 : 0;
    for (let i = 0; i < req.body.partArr.length; i++) {
      for (let j = 0; j < max_part.length; j++) {
        if (
          req.body.partArr[i].mode_id === max_part[j].mode_id &&
          parseInt(max_part[j].max_part) >
            parseInt(req.body.partArr[i].downline)
        ) {
          throw new InputError(
            `Correct First Child Partneship to ${req.body.partArr[i].downline} %`
          );
        }
      }
      for (let k = 0; k < my_part.length; k++) {
        if (
          req.body.partArr[i].mode_id === my_part[k].mode_id &&
          parseInt(my_part[k].our) < parseInt(req.body.partArr[i].downline)
        ) {
          throw new InputError(
            `Set Partneship For ${my_part[k].play} less than  ${my_part[k].our} %`
          );
        }
      }
      dwn =
        "downline" in req.body.partArr[i] ? req.body.partArr[i].downline : dwn;
      part_arr.push([
        req.body.user_id,
        parseJwt(req).id,
        dwn,
        0,
        req.body.partArr[i].active,
        req.body.partArr[i].mode_id,
      ]);
    }
    let data = await User.addPart(part_arr);
    res.status(200).json({
      success: data.affectedRows ? true : false,
      data: [],
      message: data.affectedRows ? "PartnerShip Updated" : "Failed",
    });
  } catch (error) {
    next(error);
  }
};

const updateMarketType = async (req, res, next) => {
  try {
    if (!req.body.mode_id) throw new InputError("Select Sports");
    if (!"type_name" in req.body)
      throw new InputError("Select Market Type First");
    if (!req.body.admin_password)
      throw new InputError("Please Type Admin Password");

    if (req.body.user_id) {
      let p_s = await isParent(
        parseJwt(req).id,
        req.body.user_id,
        "",
        parseJwt(req).id
      );
      if (!p_s) throw new AuthError("Try Again After Re Login");
    } else {
      req.body.user_id = parseJwt(req).id;
    }

    let market_id = req.body.market_id ? true : false;
    let event_id = req.body.event_id ? true : false;

    let password = req.body.admin_password;

    const login = await User.loginWId(parseJwt(req).id, password);

    if (!login) throw new AuthError("Try Again After Re Login");

    if (!(await argon2.verify(login[0].password, password)))
      throw new AuthError("Password Not Match");

    req.body.admin_id = parseJwt(req).id;
    if (!market_id) {
      req.body.market_id = 0;
    }
    if (!event_id) {
      req.body.event_id = 0;
    }
    delete req.body.admin_password;
    const _row = await User.updateMarketType(req.body);
    res.status(200).json({
      success: true,
      data: [],
      message:
        _row.insertId || _row.affectedRows ? "SETTINNG UPDATED" : "NO CHANGE",
    });
  } catch (error) {
    next(error);
  }
};

const isParent = async (parent_id, user_id, role = "", p_id = "") => {
  const users = await User.getallParent(user_id, role, p_id);

  let found = false;
  for (let i = 0; i < users.length; i++) {
    if (parent_id === users[i].parent_id) {
      found = true;
    }
  }
  return found;
};

const setPl = async (req, res, next) => {
  try {
    if (!req.body.admin_password)
      throw new InputError("Please Type Admin Password");
    if (!req.body.user_id) throw new InputError("Please Select User");
    if (!req.body.t_type)
      throw new InputError("Please Select Type OF Tranjection");
    if (!req.body.deposite_bal) throw new InputError("Please Enter Amount");
    if (req.body.deposite_bal < 0)
      throw new InputError("Please Enter Valid Amount");

    const login = await User.loginWId(
      parseJwt(req).id,
      req.body.admin_password
    );
    if (!login) throw new AuthError("Try Again After Re Login");

    if (!(await argon2.verify(login[0].password, req.body.admin_password)))
      throw new AuthError("Password Not Match");

    req.body.parent_id = parseJwt(req).id;

    // if (await alReadyStarted(req.body.parent_id))
    //   throw new InputError("Another Tranjection InProgress");
    // await betStarted(req.body.parent_id, true);

    let data = req.body ? req.body : {};
    let bal_arr = [];
    let ac_arr = [];
    let mul_by = data && data.t_type && data.t_type === "withdraw" ? 1 : -1;
    let p_type =
      data && data.t_type && data.t_type === "withdraw" ? "CR" : "DR";
    let c_type =
      data && data.t_type && data.t_type === "withdraw" ? "DR" : "CR";
    let p_type_b =
      data && data.t_type && data.t_type === "withdraw" ? "CR" : "DR";
    let c_type_b =
      data && data.t_type && data.t_type === "withdraw" ? "DR" : "CR";

    let user_details = await User.loginWId(data.user_id);
    let parent_details = await User.loginWId(data.parent_id);

    //custom changes
    user_details[0] ? (user_details = user_details[0]) : "";
    parent_details[0] ? (parent_details = parent_details[0]) : "";

    if (user_details.parent_id !== data.parent_id)
      throw new InputError("Not a Direct Parent");

    let c_mul = user_details.u_role === 5 ? -1 : 1;
    let auto = req.body.auto ? JSON.parse(req.body.auto) : true;

    bal_arr.push(
      [
        data.parent_id,
        user_details.u_role === 5 && auto ? data.deposite_bal * mul_by : 0,
        0,
        data.deposite_bal * mul_by,
        data.deposite_bal * mul_by * -1,
      ],
      [
        data.user_id,
        user_details.u_role === 5 && auto ? data.deposite_bal * mul_by * -1 : 0,
        data.deposite_bal * mul_by * c_mul,
        0,
        data.deposite_bal * mul_by,
      ]
    );

    let p_remark =
      data && data.t_type && data.t_type === "withdraw"
        ? "SETTLEMENT PAID TO " + req.body.p_code.toUpperCase()
        : "SETTLEMENT RECEIVED FROM " + req.body.p_code.toUpperCase();

    let c_remark =
      data && data.t_type && data.t_type === "withdraw"
        ? "SETTLEMENT RECEIVED FROM UPLINE"
        : "SETTLEMENT PAID TO UPLINE";

    let p_remark_b =
      data && data.t_type && data.t_type === "withdraw"
        ? "DESPOSIT CHIPS TO " + req.body.p_code.toUpperCase()
        : "WITHDRAW FROM CHIPS TO " + req.body.p_code.toUpperCase();

    let c_remark_b =
      data && data.t_type && data.t_type === "withdraw"
        ? "WITHDRAW CHIPS BY UPLINE"
        : "DESPOSIT CHIPS BY UPLINE";

    if (req.body.remark) {
      p_remark += "/" + req.body.remark;
      c_remark += "/" + req.body.remark;
      p_remark_b += "/" + req.body.remark;
      c_remark_b += "/" + req.body.remark;
    }

    //

    //
    ac_arr.push(
      [
        data.user_id,
        data.deposite_bal * mul_by * -1,
        0,
        0,
        0,
        c_type,
        data.parent_id,
        data.user_id,
        user_details.amount,
        user_details.u_role === 5
          ? user_details.amount
          : Number(data.deposite_bal * mul_by * -1) +
            Number(user_details.down_line) -
            Number(user_details.up_line),
        0,
        0,
        0,
        0,
        c_remark,
        0,
        1,
      ],
      [
        data.parent_id,
        data.deposite_bal * mul_by,
        0,
        0,
        0,
        p_type,
        data.parent_id,
        data.user_id,
        parent_details.amount,
        Number(data.deposite_bal * mul_by) +
          Number(parent_details.down_line) -
          Number(parent_details.up_line),
        0,
        0,
        0,
        0,
        p_remark,
        0,
        1,
      ]
    );

    if (user_details.u_role === 5 && auto) {
      ac_arr.push(
        [
          data.user_id,
          data.deposite_bal * mul_by * -1,
          0,
          0,
          0,
          c_type_b,
          data.parent_id,
          data.user_id,
          user_details.amount,
          Number(user_details.amount) + Number(data.deposite_bal * mul_by * -1),
          0,
          0,
          0,
          0,
          c_remark_b,
          0,
          1,
        ],
        [
          data.parent_id,
          data.deposite_bal * mul_by,
          0,
          0,
          0,
          p_type_b,
          data.parent_id,
          data.user_id,
          parent_details.amount,
          Number(data.deposite_bal * mul_by) + Number(parent_details.amount),
          0,
          0,
          0,
          0,
          p_remark_b,
          0,
          1,
        ]
      );
    }

    const _rw = await User.setPl(bal_arr);
    await User.addAccountEntry(ac_arr);
    let ob = {
      user_id: data.user_id,
      action: "balance",
    };
   // req.app.io.to(data.user_id).emit("updates", ob);

    res.status(200).json({
      success: _rw.affectedRows ? true : false,
      data: [],
      message: _rw.affectedRows ? "PL Updated" : "Failed Update",
    });
  } catch (error) {
    next(error);
  } finally {
    //await betStarted(req.body.parent_id, false);
  }
};

const getButtons = async (req, res, next) => {
  try {
    const user_id = parseJwt(req).id;
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
    const user_id = parseJwt(req).id;
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
    await User.detButtons(user_id);

    let _rw = await User.setButtons(data);
    res.status(200).json({
      success: true,
      data: [],
      message: _rw.affectedRows ? "Button Updated" : "Failed Update",
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    if (!req.body.current_password)
      throw new InputError("Old Password is required !");
    if (!req.body.new_password) throw new InputError("Password is required !");
    //if (!req.body.pref) throw new InputError("No Ref !");
    if (!req.body.new_confirm_password)
      throw new InputError("Confirm Password is required !");
    if (req.body.new_confirm_password !== req.body.new_password)
      throw new InputError("Both Password Not Match !");

    if (req.body.new_password.length < 6 || req.body.new_password.length > 25)
      throw new InputError("Password is Not Valid !");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    

    const username = _self[0].email;
    const password = req.body.current_password;
    //const ref = req.body.pref;

    const login = await User.Login(username);

    if (!login) throw Error("Email Not Found");

    if (login.length < 1) throw new AuthError("Wrong Username Or Password");

    if (!(await argon2.verify(login[0].password, password)))
      throw new InputError("Wrong Old Password");

    const data = req.body;
    data.new_password = await argon2.hash(req.body.new_password);
    data.user_id = parseJwt(req).id;
    let _rw = await User.changePassword(data);

    console.log(_self[0].email)
    res.status(200).json({
      success: true,
      message: _rw.affectedRows ? "Password Updated" : "Failed Update",
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const _self = await User.getProfile(parseJwt(req).id); // login user info

    // const username = _self[0].email;
    // const password = req.body.current_password;
    // const ref = req.body.pref;

    const logout = await User.delUserToken(_self[0].id);

    res.status(200).json({
      success: true,
      message: "Logout Successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  getProf,
  Login,
  addUser,
  getUsers,
  getPartyCodes,
  acGen,
  setTally,
  modUser,
  changeStatus,
  getBalance,

  resetPassword,
  removeOperator,
  updateChips,
  updatePart,
  updateMarketType,
  setPl,
  getButtons,
  setButtons,
  changePassword,
  logout,
  addUser_old,
};

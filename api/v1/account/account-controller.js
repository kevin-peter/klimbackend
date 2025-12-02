const Account = require("./account-modal");
const User = require("./../user/user-modal");
const { parseJwt } = require("../common/authenticate-token-middleware");
const { InputError } = require("./../common/errors");

const getAccountStatement = async (req, res, next) => {
  try {
    const data = req.body // login user info
    data.user_id = !req.body.uid ? parseJwt(req).id : req.body.uid;
    const _self = await User.loginWId(data.user_id) // login user info
    if (req.body.type && req.body.type === 'all') {
      data.role = _self[0].u_role
    }
    const stm = await Account.getAccountStatement(data);
    res.status(200).json({
      success: true,
      data: stm
    });
  } catch (error) {
    next(error);
  }
}

const getPl = async (req, res, next) => {
  try {
    
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    let u_id = _self[0].id;


    const data = req.body // login user info
    //data.user_id = !req.body.uid ? parseJwt(req).id : req.body.uid
    data.user_id = u_id;
    data.mode_id = 4;

    const stm = await Account.getPl(data);
    const gt = await Account.grandPL(data);

    //console.log(stm)
    res.status(200).json({
      success: true,
      data: stm,
      gt: gt.length > 0 ? Number(gt[0].gt) : 0
    });
  } catch (error) {
    next(error);
  }
}

const getAcSum = async (req, res, next) => {
  try {
    const data = req.body // login user info
    data.user_id = !req.body.uid ? parseJwt(req).id : req.body.uid
    const stm = await Account.getAcSum(data);
    res.status(200).json({
      success: true,
      data: stm
    });
  } catch (error) {
    next(error);
  }
}

const doSettement = async (req, res, next) => {
  try {

    let allowed_role = [2, 3, 4]

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Try After SomeTime");
    }

    const _from = await User.getProfile(req.body.from)
    const _to = await User.getProfile(req.body.to)
    const _self = await User.getProfile(parseJwt(req).id) // login user info


    if (!req.body.from)
      throw new InputError("From is Required");

    if (!req.body.to)
      throw new InputError("To is Required");

    if (!req.body.amount)
      throw new InputError("Amount is Required");

    if (req.body.amount < 0 || req.body.amount > 90000000)
      throw new InputError("Enter Valid Amount");

    // if (!req.body.remark)
    //   throw new InputError("Remark is Required");

    let b_arr = [];
    let ac_arr = [];

    b_arr.push(
      [_from[0].id, req.body.amount, req.body.amount * (-1), 0, 0, 0, 0, 0],
      [_to[0].id, req.body.amount * (-1), req.body.amount, 0, 0, 0, 0, 0]
    );

    ac_arr.push([
      _from[0].id,
      req.body.amount,
      _from[0].u_role === 4 ? req.body.amount * (-1) : req.body.amount,//up_line
      "CR",//type
      _from[0].id,//uid
      _to[0].id,//uid,
      _self[0].id,
      0,//previous_bal
      req.body.amount,//new_bal
      -1,//mode_id
      0,//market_id
      0,//event_id
      0,//previous_gen
      req.body.remark + "/Settlement/" + req.body.from + "/" + req.body.to + "/" + req.body.amount,//remark
      0,//deleted
      1//revoke
    ],
      [
        _to[0].id,
        req.body.amount * (-1),
        _to[0].u_role !== 4 ? req.body.amount * (-1) : req.body.amount,//up_line
        "DR",//type
        _to[0].id,//uid
        _from[0].id,//uid
        _self[0].id,
        0,//previous_bal
        req.body.amount,//new_bal
        -1,//mode_id    
        0,//market_id
        0,//event_id
        0,//previous_gen
        req.body.remark + "/Settlement/" + req.body.to + "/" + req.body.from + "/" + req.body.amount * (-1),//remark
        0,//deleted
        1//revoke
      ]);

    await User.addBalance(b_arr);
    await Account.addAccountEntry(ac_arr);

    res.status(200).json({
      success: true,
      data: [],
      message: "Settement Done",
    });
  } catch (error) {
    next(error);
  }
}

const getEventGen = async (req, res, next) => {
  try {
    const data = req.body // login user info
    data.user_id = !req.body.uid ? parseJwt(req).id : req.body.uid;
    const _self = await User.loginWId(data.user_id) // login user info
    data.parent_id = _self[0].parent_id

    const stm = await Account.getEventGenChild(data);

    const stm_self = await Account.getEventGenSelf(data);

    //const stm_parent = await Account.getEventGenParent(data);

    res.status(200).json({
      success: true,
      data: [...stm, ...stm_self]
    });
  } catch (error) {
    next(error);
  }

}

module.exports = {
  getAccountStatement,
  doSettement,
  getEventGen,
  getPl,
  getAcSum
}   
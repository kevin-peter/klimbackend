const Setting = require("./setting-modal");
const Event = require("./../event/event-modal");
const User = require("./../user/user-modal");
const Result = require("./../result/result-modal");
const fetch = require("node-fetch");
const { parseJwt } = require("../common/authenticate-token-middleware");
const { InputError } = require("./../common/errors");
const allConfig = require("./../../../config/allConfig");

//const io = require('socket.io-client');

const app = require("../../../app");

const https = require("https");
const { Console } = require("console");
const { json } = require("express");

const getEventsAll = async (req, res, next) => {
  try {
    let allowed_role = [1];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //let p_id = _self[0].id;
    let p_id = _self[0].parent_id;
    if (_self[0].u_role !== 3) p_id = _self[0].parent_id;

    const events = await Setting.getEventsAll(p_id);
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const addEvent = async (req, res, next) => {
  try {
    let allowed_role = [1];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_name) throw new InputError("Event Name Required");
    if (!req.body.team1) throw new InputError("Event Team - 1 name Required");
    if (!req.body.team2) throw new InputError("Event Team - 2 name Required");

    if (req.body.event_name.length < 2 || req.body.event_name.length > 150)
      throw new InputError("Name Between 2 to 150 char");

    req.body.event_id = req.body.event_id
      ? req.body.event_id
      : Math.floor(Date.now() / 1000);

    req.body.market_id = "1." + req.body.event_id;

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //req.body.parent_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;

    req.body.runnerName1 = !req.body.runners[0].runnerName
      ? "F"
      : req.body.runners[0].runnerName;
    req.body.runnerName2 = !req.body.runners[1].runnerName
      ? "S"
      : req.body.runners[1].runnerName;

    let rows = await Setting.addEvent(req.body);

    //add market based on eventid
    let markets = await Setting.getDefaultMarkets();

    for (let i = 0; i < markets.length; i++) {
      req.body.market_name = markets[i].name;
      req.body.main_market_id = markets[i].id;
      req.body.runner_count = markets[i].runner_count;
      rows = await Setting.addMarket(req.body);
      req.body.market_id = rows.insertId;

      let totalCount = markets[i].runner_count;
      //add runners based on market
      //BATTER runner
      if (markets[i].runner_type == "BATTER" && markets[i].status == 1) {
        for (let i = 1; i <= parseInt(totalCount); i++) {
          req.body.name = req.body.runnerName1 + "-" + i;
          req.body.team = 1;
          req.body.seq = i;
          rows = await Event.addPlayer(req.body);
        }

        for (let i = 1; i <= parseInt(totalCount); i++) {
          req.body.name = req.body.runnerName2 + "-" + i;
          req.body.team = 2;
          req.body.seq = i;
          rows = await Event.addPlayer(req.body);
        }
      }

      //Bowler runner
      if (markets[i].runner_type == "BOWLER" && markets[i].status == 1) {
        for (let i = 1; i <= parseInt(totalCount); i++) {
          req.body.name = req.body.runnerName1 + "-" + i;
          req.body.team = 1;
          req.body.seq = i;
          rows = await Event.addPlayer(req.body);
        }

        for (let i = 1; i <= parseInt(totalCount); i++) {
          req.body.name = req.body.runnerName2 + "-" + i;
          req.body.team = 2;
          req.body.seq = i;
          rows = await Event.addPlayer(req.body);
        }
      } //if bowler

      //Toss /team
      if (markets[i].runner_type == "TEAM" && markets[i].status == 1) {
        req.body.name = req.body.team1;
        req.body.team = 1;
        req.body.seq = 1;
        rows = await Event.addPlayer(req.body);

        req.body.name = req.body.team2;
        req.body.team = 2;
        req.body.seq = 2;
        rows = await Event.addPlayer(req.body);
      }

      //ODD-EVEN runner
      if (markets[i].runner_type == "ALL" && markets[i].status == 1) {
        for (let i = 1; i <= parseInt(totalCount); i++) {
          req.body.name = req.body.runnerName1 + "-" + i;
          req.body.team = 1;
          req.body.seq = i;
          rows = await Event.addPlayer(req.body);
        }

        for (let i = 1; i <= parseInt(totalCount); i++) {
          req.body.name = req.body.runnerName2 + "-" + i;
          req.body.team = 2;
          req.body.seq = i;
          rows = await Event.addPlayer(req.body);
        }
      } //if bowler

      //Pair Event /team
      if (markets[i].runner_type == "NONE" && markets[i].status == 1 && req.body.main_market_id == 9) {
        let pairs = [];
        let pairsArr = [];
        for (let a = 1; a <= parseInt(totalCount); ++a) pairsArr.push(a);
        pairs = await uniquePairs(pairsArr);

        // console.log(pairsArr);
        // console.log(pairs);
        // console.log(pairs.length);
        // console.log(pairs[1][1]);

        for (let i = 0; i < pairs.length; i++) {
          req.body.name = pairs[i][0] + "-" + pairs[i][1];
          req.body.team = 1;
          req.body.seq = i;
          rows = await Event.addPlayer(req.body);
        }

        for (let i = 0; i < pairs.length; i++) {
          req.body.name = pairs[i][0] + "-" + pairs[i][1];
          req.body.team = 2;
          req.body.seq = i;
          rows = await Event.addPlayer(req.body);
        }

        //rows = await Event.addPlayerAll(pairs);

      } //pair

    } //for

    res.status(200).json({
      success: rows.insertId ? true : false,
      data: [],
      message: rows.insertId ? "Event Created" : "Faild Create Event",
    });
  } catch (error) {
    next(error);
  }
};

const uniquePairs = async (array) => {
  if (!Array.isArray(array)) {
    throw new TypeError('First argument must be an array');
  }

  if (array.length < 3) {
    return [array];
  }

  return array.reduce(
    (previousValue, currentValue, index) =>
      previousValue.concat(
        array.slice(index + 1).map((value) => [currentValue, value])
      ),
    []
  );
}
const updateEvent = async (req, res, next) => {
  try {
    let allowed_role = [1];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.event_id) throw new InputError("Event Id Required");
    if (!req.body.event_name) throw new InputError("Event Name Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //req.body.parent_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;

    // req.body.runnerName1 = !req.body.runners[0].runnerName
    //   ? "F"
    //   : req.body.runners[0].runnerName;
    // req.body.runnerName2 = !req.body.runners[1].runnerName
    //   ? "S"
    //   : req.body.runners[1].runnerName;

    let rows = await Setting.updateEvent(req.body);

    // let players = await Event.delRunners(req.body.event_id);

    res.status(200).json({
      success: rows.affectedRows ? true : false,
      data: [],
      message: rows.affectedRows ? "Event Updated" : "Failed Update Event",
    });
  } catch (error) {
    next(error);
  }
};

const delEvent = async (req, res, next) => {
  try {
    let allowed_role = [1];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    let p_id = _self[0].id;
    if (_self[0].u_role !== 3) p_id = _self[0].parent_id;

    //const delFancy = await Event.delFancyByEvent(req.body.event_id);
    const events = await Setting.delEvent(req.body.event_id, p_id);
    const markets = await Setting.delMarkets(req.body.event_id);
    const runners = await Setting.delRunners(req.body.event_id);
    const runnersUsers = await Setting.delRunnersUsers(req.body.event_id);
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const getDefaultMarkets = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //let p_id = _self[0].id;
    // let p_id = _self[0].parent_id;
    //if (_self[0].u_role !== 3) p_id = _self[0].parent_id;

    const events = await Setting.getDefaultMarketsAll();
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const createMarket = async (req, res, next) => {
  try {
    let allowed_role = [1, 2];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.name) throw new InputError("Market Name Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    let rows = await Setting.createMarket(req.body);

    res.status(200).json({
      success: rows.insertId ? true : false,
      data: [],
      message: rows.insertId ? "Market Created" : "Faild Market Event",
    });
  } catch (error) {
    next(error);
  }
};

const delMarket = async (req, res, next) => {
  try {
    let allowed_role = [1];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.id) throw new InputError("Market Id Required");

    //const delFancy = await Event.delFancyByEvent(req.body.event_id);
    const events = await Setting.delMarket(req.body.id);
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Super admin Event Status updates
 */
const lockEvent = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //const l_user = await User.getProfile(req.body.email); // req user info

    // console.log(req.body);
    // console.log(_self[0].u_role);

    let data = [];
    if (_self[0].u_role == 1) {
      data = await Setting.lockEvent(req.body);
    }
    req.body.bet_lock = req.body.bet_lock == null ? 0 : req.body.bet_lock;
    req.body.status = req.body.status == null ? 1 : req.body.status;
    req.body.user_id = _self[0].id;
    req.body.admin_id = _self[0].parent_id;
    data = await Event.lockEventInnerType(req.body);

    //console.log(req.body);

    res.status(200).json({
      success: true,
      data: [],
      message: data.changedRows ? "Updated" : "UnChanged",
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Super admin Default Market Status updates
 */
const lockMarket = async (req, res, next) => {
  try {
    let allowed_role = [1];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //const l_user = await User.getProfile(req.body.email); // req user info

    
    let data = await Setting.lockMarket(req.body);

    res.status(200).json({
      success: true,
      data: [],
      message: data.changedRows ? "Updated" : "UnChanged",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEventsAll,
  addEvent,
  uniquePairs,
  updateEvent,
  delEvent,
  lockEvent,
  lockMarket,
  getDefaultMarkets,
  createMarket,
  delMarket,
};

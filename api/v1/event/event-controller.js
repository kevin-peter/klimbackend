const Event = require("./event-modal");
const User = require("./../user/user-modal");
//const Result = require("./../result/result-modal");
const fetch = require("node-fetch");
const { parseJwt } = require("../common/authenticate-token-middleware");
const { InputError } = require("./../common/errors");
const allConfig = require("./../../../config/allConfig");

//const io = require('socket.io-client');

const app = require("../../../app");

const https = require("https");
const { Console } = require("console");
const { json } = require("express");

const moment = require("moment");

const getEvents = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    let p_id = _self[0].parent_id;

    // let partChain = await Result.getPartnerships(_self[0].id);
    let partChain = await Event.getPartnerships(_self[0].id);
    let uids = [];
    if (partChain.length > 0) {
      for (let i = 0; i < partChain.length; i++) {
        uids.push(partChain[i].id);
      }
    }

    const events = await Event.getEvents(p_id);

    let eventStatus = [];

    eventStatus = await Event.getEventDefaultParent(uids);

    for (let i = 0; i < events.length; i++) {
      if (eventStatus.length > 0) {
        for (let j = 0; j < eventStatus.length; j++) {
          if (eventStatus[j].event_id == events[i].event_id) {
            //current user lock visible
            if (_self[0].id == eventStatus[j].user_id) {
              events[i].status = eventStatus[j].status;
              events[i].bet_lock = eventStatus[j].bet_lock;
            }

            //check all parent lock visible status
            for (let k = 0; k < uids.length; k++) {
              if (_self[0].id != uids[k]) {
                if (uids[k] == eventStatus[j].user_id) {
                  if (eventStatus[j].bet_lock == 1) {
                    events[i].parent_bet_lock = eventStatus[j].bet_lock;
                  }
                  if (eventStatus[j].status == 0) {
                    events[i].parent_status = eventStatus[j].status;
                  }
                }
              }
            } //for eventStatus
          } //if event_id ==
        } //for
      }
    }

    //console.log(uids)
    res.status(200).json({
      success: true,
      data: events,
      event_default: eventStatus,
    });
  } catch (error) {
    next(error);
  }
};

const getEventByEventID = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");

    const events = await Event.getEventByEventID(req.body.event_id);
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const getMarkets = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.event_id) throw new InputError("Event Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //let partChain = await Result.getPartnerships(_self[0].id);
    let partChain = await Event.getPartnerships(_self[0].id);
    let uids = [];
    if (partChain.length > 0) {
      for (let i = 0; i < partChain.length; i++) {
        uids.push(partChain[i].id);
      }
    }

    const markets = await Event.getMarkets(req.body.event_id);
    const marketTypes = await Event.getMarketsType(req.body.event_id, uids);

    let mkIds = [];
    for (let i = 0; i < markets.length; i++) {
      mkIds.push(markets[i].id);
      if (marketTypes.length > 0) {
        for (let j = 0; j < marketTypes.length; j++) {
          //assign current user visible lock status to existing
          if (marketTypes[j].market_id == markets[i].id) {
            //check current user status visible lock
            if (_self[0].id == marketTypes[j].user_id) {
              markets[i].visible = marketTypes[j].visible;
              markets[i].locked = marketTypes[j].locked;
            }
            //check all parent lock visible status
            for (let k = 0; k < uids.length; k++) {
              if (_self[0].id != uids[k]) {
                if (uids[k] == marketTypes[j].user_id) {
                  // markets[i].parent_visible = marketTypes[j].visible;
                  // markets[i].parent_locked = marketTypes[j].locked;

                  if (marketTypes[j].locked == 1) {
                    markets[i].parent_locked = marketTypes[j].locked;
                  }
                  if (marketTypes[j].visible == 0) {
                    markets[i].parent_visible = marketTypes[j].visible;
                  }
                }
              }
            }
          }
        }
      }
    }

    const players = await Event.getPlayers(req.body.event_id, mkIds);

    res.status(200).json({
      success: true,
      data: markets,
      players: players,
    });
  } catch (error) {
    next(error);
  }
};

const getMarketsList = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.event_id) throw new InputError("Event Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //let partChain = await Result.getPartnerships(_self[0].id);
    let partChain = await Event.getPartnerships(_self[0].id);
    let uids = [];
    if (partChain.length > 0) {
      for (let i = 0; i < partChain.length; i++) {
        uids.push(partChain[i].id);
      }
    }

    const markets = await Event.getMarkets(req.body.event_id);
    const marketTypes = await Event.getMarketsType(req.body.event_id, uids);

    res.status(200).json({
      success: true,
      data: markets,
    });
  } catch (error) {
    next(error);
  }
};

const getMarketsC = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.event_id) throw new InputError("Event Id Required");
    //if (!req.body.main_market_id) throw new InputError("Market Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //let partChain = await Result.getPartnerships(_self[0].id);
    let partChain = await Event.getPartnerships(_self[0].id);
    let uids = [];
    if (partChain.length > 0) {
      for (let i = 0; i < partChain.length; i++) {
        uids.push(partChain[i].id);
      }
    }

    const markets = await Event.getMarketsC(
      req.body.event_id,
      req.body.main_market_id
    );
    const marketTypes = await Event.getMarketsType(req.body.event_id, uids);

    //let players = [];
    let mkIds = [];
    for (let i = 0; i < markets.length; i++) {
      mkIds.push(markets[i].id);
      if (marketTypes.length > 0) {
        for (let j = 0; j < marketTypes.length; j++) {
          //assign current user visible lock status to existing
          if (marketTypes[j].market_id == markets[i].id) {
            //check current user status visible lock
            if (_self[0].id == marketTypes[j].user_id) {
              markets[i].visible = marketTypes[j].visible;
              markets[i].locked = marketTypes[j].locked;
            }

            //check parent lock visible status
            //check all parent lock visible status
            for (let k = 0; k < uids.length; k++) {
              if (_self[0].id != uids[k]) {
                if (uids[k] == marketTypes[j].user_id) {
                  // markets[i].parent_visible = marketTypes[j].visible;
                  // markets[i].parent_locked = marketTypes[j].locked;

                  if (marketTypes[j].locked == 1) {
                    markets[i].parent_locked = marketTypes[j].locked;
                  }
                  if (marketTypes[j].visible == 0) {
                    markets[i].parent_visible = marketTypes[j].visible;
                  }
                }
              }
            }
          }
        }
      }
    }

    const players = await Event.getPlayers(req.body.event_id, mkIds);

    res.status(200).json({
      success: true,
      data: markets,
      players: players,
    });
  } catch (error) {
    next(error);
  }
};

const getPlayers = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.event_id) throw new InputError("Event Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    const events = await Event.getPlayers(req.body.event_id);
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const addPlayer = async (req, res, next) => {
  try {
    let allowed_role = [1, 2];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //req.body.parent_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;

    let players = {};
    players["hometeam"] = req.body.hometeam;
    players["awayteam"] = req.body.awayteam;
    req.body.player = JSON.stringify(players);
    let rows = await Event.addPlayer(req.body);

    res.status(200).json({
      success: rows.insertId ? true : false,
      data: [],
      message: rows.insertId ? "Event Created" : "Faild Create Event",
    });
  } catch (error) {
    next(error);
  }
};

const selectRunner = async (req, res, next) => {
  try {
    //let allowed_role = [1, 2, 3, 4, 5, 6];
    let allowed_role = [5];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");
    if (!req.body.market_id) throw new InputError("Market Id Required");
    if (!req.body.runnerId) throw new InputError("Runner Id Required");
    if (!req.body.runner_name) throw new InputError("Runner Name Required");
    if (!req.body.eventType) throw new InputError("Event Type Required");
    if (!req.body.main_market_id)
      throw new InputError("Default Market Id Required");
    if (!req.body.eventStatus && "weak_team" in req.body.eventStatus)
      throw new InputError("Event Status with all parameters Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    const partners = await User.getallPart(_self[0].id);
    let part_arr = await parsePart(partners, _self);

    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    req.body.type = "user";
    req.body.part_chain = JSON.stringify(part_arr);

    let weak_team = req.body.eventStatus.weak_team;

    //add chain of all parents with part...
    //let chain = await Result.updatePartChain(req.body.user_id, partChain);
    let chain = await Event.updatePartChain(
      req.body.user_id,
      req.body.part_chain
    );
    if (req.body.eventType == "OneDay") {
      req.body.exp = "-300";
    } else if (req.body.eventType == "Twenty") {
      //req.body.exp = "-120";
      req.body.exp = "-200";
    } else {
      req.body.exp = "0";
    }
    let rows = await Event.addRunner(req.body);
    req.body.parent_id = 0;
    req.body.part_chain = "";

    //system select algorithm start here
    //user selected runners
    let runners = await Event.getSelRunners(req.body);
    //get seq & team
    let teamAll = [];
    let team1 = [];
    let team2 = [];
    let selectedIds = [];
    for (let i = 0; i < runners.length; i++) {
      if (runners[i].team == 1) {
        team1.push(runners[i].sequence);
      }
      if (runners[i].team == 2) {
        team2.push(runners[i].sequence);
      }
      teamAll.push({ seq: runners[i].sequence, team: runners[i].team });
      selectedIds.push(parseInt(runners[i].runnerId));
    }

    //check for remaining
    req.body.selectedIds = selectedIds;
    let allUnSelRunners = await Event.getUnSelRunnersAll(req.body);
    let runnersT1 = [];
    let runnersT2 = [];
    let unSelIds = [];

    //flow for both algo
    for (let i = 0; i < allUnSelRunners.length; i++) {
      if (weak_team == 0) {
        if (allUnSelRunners[i].team == 1) {
          runnersT1.push(allUnSelRunners[i].id);
        }
        if (allUnSelRunners[i].team == 2) {
          runnersT2.push(allUnSelRunners[i].id);
        }
      } else {
        if (weak_team == 1) {
          if (allUnSelRunners[i].team == 2) {
            runnersT2.push(allUnSelRunners[i].id);
          }
        } else {
          let obj = allUnSelRunners.find((o) => o.team === "1");

          if (allUnSelRunners[i].team == 1) {
            runnersT1.push(allUnSelRunners[i].id);
          }
          if (obj === undefined) {
            runnersT2.push(allUnSelRunners[i].id);
          }
          //console.log(obj);
          //console.log(allUnSelRunners[i]);
        }
      }
    }
    //minimum of both team runners
    unSelIds[0] = runnersT1.length != 0 ? Math.min(...runnersT1) : 0;
    unSelIds[1] = runnersT2.length != 0 ? Math.min(...runnersT2) : 0;
    req.body.unSelIds = unSelIds;
    let UnRunners = await Event.getUnSelRunners(req.body);

    //system runner entry
    let runner2 = {};
    runner2.event_id = req.body.event_id;
    runner2.market_id = req.body.market_id;
    runner2.main_market_id = req.body.main_market_id;
    runner2.user_id = req.body.user_id;
    runner2.parent_id = req.body.user_id;
    runner2.runnerId = UnRunners[0].id;
    runner2.runner_name = UnRunners[0].name;
    runner2.sequence = UnRunners[0].sequence;
    runner2.team = UnRunners[0].team;
    runner2.type = "system";
    runner2.exp = Math.abs(req.body.exp);
    runner2.eventType = req.body.eventType;

    let rows2 = await Event.addRunner(runner2);
    // console.log(UnRunners)
    // console.log(unSelIds)
    let insertedRows = await Event.getSelRunners(req.body);
    let userExp = 0;
    let systemExp = 0;
    let mkId = insertedRows[0].market_id;
    for (let i = 0; i < insertedRows.length; i++) {
      if (insertedRows[i].type == "user") {
        userExp = parseInt(userExp) + parseInt(insertedRows[i].exp);
      } else {
        systemExp = parseInt(systemExp) + parseInt(insertedRows[i].exp);
      }
    }

    // console.log(userExp);
    // console.log(systemExp);

    res.status(200).json({
      success: rows.insertId ? true : false,
      data: insertedRows,
      runner: UnRunners,
      user_exp: userExp,
      system_exp: systemExp,
      mkId: mkId,
      user_player: req.body.runner_name,
      system_player: runner2.runner_name,
      message: rows.insertId
        ? "Player Selected! [" +
          req.body.runner_name +
          "] VS [" +
          runner2.runner_name +
          "]"
        : "Faild to Select Player",
    });
  } catch (error) {
    next(error);
  }
};

const selectSingleRunner = async (req, res, next) => {
  try {
    //let allowed_role = [1, 2, 3, 4, 5, 6];
    let allowed_role = [5];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");
    if (!req.body.market_id) throw new InputError("Market Id Required");
    if (!req.body.runnerId) throw new InputError("Runner Id Required");
    if (!req.body.runner_name) throw new InputError("Runner Name Required");
    if (!req.body.eventType) throw new InputError("Event Type Required");
    if (!req.body.main_market_id)
      throw new InputError("Default Market Id Required");
    if (!req.body.eventStatus && "weak_team" in req.body.eventStatus)
      throw new InputError("Event Status with all parameters Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    const partners = await User.getallPart(_self[0].id);
    let part_arr = await parsePart(partners, _self);

    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    req.body.type = "user";
    req.body.part_chain = JSON.stringify(part_arr);

    let weak_team = req.body.eventStatus.weak_team;

    //add chain of all parents with part...
    //let chain = await Result.updatePartChain(req.body.user_id, partChain);
    let chain = await Event.updatePartChain(
      req.body.user_id,
      req.body.part_chain
    );
    if (req.body.eventType == "OneDay") {
      req.body.exp = "-300";
    } else if (req.body.eventType == "Twenty") {
      //req.body.exp = "-120";
      req.body.exp = "-200";
    } else {
      req.body.exp = "0";
    }
    let rows = await Event.addRunner(req.body);

    res.status(200).json({
      success: rows.insertId ? true : false,
      data: req.body.runner_name,
      user_player: req.body.runner_name,
      message: rows.insertId
        ? "Player Selected! [" + req.body.runner_name + "]"
        : "Faild to Select Player",
    });
  } catch (error) {
    next(error);
  }
};

const selectOddEven = async (req, res, next) => {
  try {
    //let allowed_role = [1, 2, 3, 4, 5, 6];
    let allowed_role = [5];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");
    if (!req.body.market_id) throw new InputError("Market Id Required");
    if (!req.body.runnerId) throw new InputError("Runner Id Required");
    if (!req.body.runner_name) throw new InputError("Runner Name Required");
    if (!req.body.eventType) throw new InputError("Event Type Required");
    if (!req.body.odd_even) throw new InputError("ODD-EVEN Type Required");
    if (!req.body.main_market_id)
      throw new InputError("Default Market Id Required");
    if (!req.body.eventStatus && "weak_team" in req.body.eventStatus)
      throw new InputError("Event Status with all parameters Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    const partners = await User.getallPart(_self[0].id);
    let part_arr = await parsePart(partners, _self);

    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    req.body.type = "user";
    req.body.part_chain = JSON.stringify(part_arr);

    let weak_team = req.body.eventStatus.weak_team;

    //add chain of all parents with part...
    //let chain = await Result.updatePartChain(req.body.user_id, partChain);
    let chain = await Event.updatePartChain(
      req.body.user_id,
      req.body.part_chain
    );
    if (req.body.eventType == "OneDay") {
      req.body.exp = "-300";
    } else if (req.body.eventType == "Twenty") {
      //req.body.exp = "-120";
      req.body.exp = "-200";
    } else {
      req.body.exp = "0";
    }

    let rows = await Event.addRunnerOddEven(req.body);

    //system runner entry
    req.body.parent_id = 0;
    req.body.exp = Math.abs(req.body.exp);
    req.body.type = "system";
    req.body.odd_even == "odd"
      ? (req.body.odd_even = "even")
      : (req.body.odd_even = "odd");
    let rows1 = await Event.addRunnerOddEven(req.body);

    //console.log(rows1);

    res.status(200).json({
      success: rows.insertId ? true : false,
      data: req.body.runner_name,
      user_player: req.body.runner_name,
      message: rows.insertId
        ? "Player Selected! [" + req.body.runner_name + "]"
        : "Faild to Select Player",
    });
  } catch (error) {
    next(error);
  }
};

const getSelectedRuners = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");
    // if (!req.body.market_id) throw new InputError("Market Id Required");
    // if (!req.body.runnerId) throw new InputError("Runner Id Required");
    //if (!req.body.user_id) throw new InputError("User Id Required");
    const _self = await User.getProfile(parseJwt(req).email); // login user info

    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    //req.body.type = 'user';
    let allMarkets = await Event.getMarketsByUid(req.body);

    let expMarket = {
      pair: null,   // Initialize 'pair' key with null to store results for `main_market_id == 9`
      odd:null, // Initialize 'pair' key with null to store results for `main_market_id == 3`
      common: null  // Initialize 'common' key with null to store other results
    };

    let runners = await Event.getSelectedRunnersAll(req.body);

    //calculation exposure
    let promises = [];
    for (let i = 0; i < allMarkets.length; i++) {
      if (allMarkets[i].main_market_id == 9) {
        promises.push(Event.getExpByBet(req.body).then(result => {
          expMarket.pair = result;
        }));

      } else if(allMarkets[i].main_market_id == 3) {
        promises.push(Event.getExpByBet(req.body).then(result => {
          expMarket.odd = result;
        }));

      } else {
        promises.push(Event.getExpByMarket(req.body).then(result => {
          expMarket.common = result;
        }));
      }
    }
    
    await Promise.all(promises);

    
    //expMarket = await Event.getExpByMarket(req.body);

    // for (let i = 0; i < allMarkets.length; i++) {

    //   if(allMarkets[i].main_market_id == 9) {
    //     expMarket.pair = await Event.getExpByBet(req.body);
    //   } else {
    //     expMarket.common = await Event.getExpByMarket(req.body);
    //   }


    // }

    //console.log(allMarkets);
    //console.log(expMarket);

    let mkIds = [];
    let sysmkIds = [];
    let sys_odd = [];
    let sys_even = [];
    let confirmedMarkets = [];
    let confirmedPlayers = [];
    let exp = {};
    let amt = {};
    let markets = [];
    for (let i = 0; i < runners.length; i++) {
      mkIds.push(parseInt(runners[i].runnerId));
      //markets.push({ [runners[i].market_id]: runners[i].runnerId });
      markets.push(parseInt(runners[i].market_id));

      if (runners[i].type == "system") {
        sysmkIds.push(parseInt(runners[i].runnerId));
        if (runners[i].odd_even == "even") {
          sys_even.push(parseInt(runners[i].runnerId));
        }
        if (runners[i].odd_even == "odd") {
          sys_odd.push(parseInt(runners[i].runnerId));
        }
      }
      if (runners[i].status == "SELECTED") {
        confirmedMarkets.push(parseInt(runners[i].market_id));
        //if (runners[i].type == "user") {
        confirmedPlayers.push(runners[i]);
        //}
      }
    }

    if (Array.isArray(expMarket.common)) {
      for (let i = 0; i < expMarket.common.length; i++) {
        const expmkt = expMarket.common[i];
        exp[expmkt.market_id] = expmkt.total_exp * expmkt.amt;
        amt[expmkt.market_id] = expmkt.amt;
      }
    }

    if (Array.isArray(expMarket.pair)) {
      for (let i = 0; i < expMarket.pair.length; i++) {
        const expmkt = expMarket.pair[i];
        exp[expmkt.market_id] = expmkt.total_exp * expmkt.amt;
        amt[expmkt.market_id] = expmkt.amt;
      }
    }

    if (Array.isArray(expMarket.odd)) {
      for (let i = 0; i < expMarket.odd.length; i++) {
        const expmkt = expMarket.odd[i];
        exp[expmkt.market_id] = expmkt.total_exp * expmkt.amt;
        amt[expmkt.market_id] = expmkt.amt;
      }
    }
    

    //exp = Object.entries(exp);

    confirmedMarkets = [...new Set(confirmedMarkets)];
    let bal = await Event.getBalance(req.body);

    markets = [...new Set(markets)];
    //console.log(sysmkIds);
    res.status(200).json({
      success: true,
      data: mkIds,
      system: sysmkIds,
      confirmedMarkets: confirmedMarkets,
      confirmedPlayers: confirmedPlayers,
      expMarket: exp,
      amtTaken: amt,
      markets: markets,
      sys_odd: sys_odd,
      sys_even: sys_even,
      //all: runners,
      bal: bal,
      message: "Selected Runners",
    });
  } catch (error) {
    next(error);
  }
};

const getSelectedRunersSingle = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");
    if (!req.body.main_market_id) throw new InputError("Market Id Required");
    // if (!req.body.runnerId) throw new InputError("Runner Id Required");
    //if (!req.body.user_id) throw new InputError("User Id Required");
    const _self = await User.getProfile(parseJwt(req).email); // login user info

    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    //req.body.type = 'user';
    let runners = [];
    let expMarket = [];

    if(req.body.main_market_id == 8 || req.body.main_market_id == 10) {
      runners = await Event.getSelectedRunnersSingle(req.body);
      expMarket = await Event.getExpByMarket(req.body);
    } else if(req.body.main_market_id == 9) { 
      runners = await Event.getSelectedRunnersAll(req.body);
      expMarket = await Event.getExpByBet(req.body);

      //console.log(expMarket)
    } else {
      runners = await Event.getSelectedRunnersSingle2(req.body);
      expMarket = await Event.getExpByMarket(req.body);
    }
    
    //console.log(runners);

    let mkIds = [];
    let sysmkIds = [];
    let confirmedMarkets = [];
    let confirmedPlayers = [];
    let exp = {};
    let amt = {};
    let markets = [];
    for (let i = 0; i < runners.length; i++) {
      mkIds.push(parseInt(runners[i].runnerId));
      //markets.push({ [runners[i].market_id]: runners[i].runnerId });
      markets.push(parseInt(runners[i].market_id));

      if (runners[i].type == "system") {
        sysmkIds.push(parseInt(runners[i].runnerId));
      }
      if (runners[i].status == "SELECTED") {
        confirmedMarkets.push(parseInt(runners[i].market_id));
        //if (runners[i].type == "user") {
        confirmedPlayers.push(runners[i]);
        //}
      }
    }

    for (let i = 0; i < expMarket.length; i++) {
      exp[expMarket[i].market_id] = expMarket[i].total_exp * expMarket[i].amt;
      amt[expMarket[i].market_id] = expMarket[i].amt;
    }

    //exp = Object.entries(exp);

    confirmedMarkets = [...new Set(confirmedMarkets)];
    let bal = await Event.getBalance(req.body);

    markets = [...new Set(markets)];

    

    res.status(200).json({
      success: true,
      data: mkIds,
      system: sysmkIds,
      confirmedMarkets: confirmedMarkets,
      confirmedPlayers: confirmedPlayers,
      expMarket: exp,
      amtTaken: amt,
      markets: markets,
      //all: runners,
      bal: bal,
      message: "Selected Runners",
    });
  } catch (error) {
    next(error);
  }
};

const unSelectRunner = async (req, res, next) => {
  try {
    //let allowed_role = [1, 2, 3, 4, 5, 6];

    let allowed_role = [5];
    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");
    if (!req.body.market_id) throw new InputError("Market Id Required");
    if (!req.body.runnerId) throw new InputError("Runner Id Required");
    //if (!req.body.user_id) throw new InputError("User Id Required");
    const _self = await User.getProfile(parseJwt(req).email); // login user info

    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    req.body.type = "user";
    let runners = await Event.getSelRunners(req.body);
    let rows = await Event.delRunnerRel(req.body);

    let runnerIds = [];
    let mkId = [];
    for (let i = 0; i < runners.length; i++) {
      runnerIds.push(parseInt(runners[i].runnerId));
    }

    let expMarket = await Event.getExpByMarket(req.body);
    let exp = {};
    for (let i = 0; i < expMarket.length; i++) {
      exp[expMarket[i].market_id] = expMarket[i].total_exp;
    }
    res.status(200).json({
      success: true,
      data: runnerIds,
      expMarket: exp,
      message: "System Resetting Player Selection cycling!",
    });
  } catch (error) {
    next(error);
  }
};

const unSelectSingleRunner = async (req, res, next) => {
  try {
    //let allowed_role = [1, 2, 3, 4, 5, 6];

    let allowed_role = [5];
    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");
    if (!req.body.market_id) throw new InputError("Market Id Required");
    if (!req.body.runnerId) throw new InputError("Runner Id Required");
    //if (!req.body.user_id) throw new InputError("User Id Required");
    const _self = await User.getProfile(parseJwt(req).email); // login user info

    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    req.body.type = "user";
    
    //let runners = await Event.getSelRunners(req.body);

    let rows = await Event.delRunnerSingalRel(req.body);
    let runners = await Event.getSelRunners(req.body);
   
    let runnerIds = [];
    let mkId = [];
    for (let i = 0; i < runners.length; i++) {
      runnerIds.push(parseInt(runners[i].runnerId));
    }

    let expMarket = await Event.getExpByMarket(req.body);
    let exp = {};
    for (let i = 0; i < expMarket.length; i++) {
      exp[expMarket[i].market_id] = expMarket[i].total_exp;
    }
    res.status(200).json({
      success: true,
      data: runnerIds,
      expMarket: exp,
      message: "Player removed!",
    });
  } catch (error) {
    next(error);
  }
};


const getBalance = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    //if (!req.body.event_id) throw new InputError("Event Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    let bal = await Event.getBalance(req.body);

    res.status(200).json({
      success: true,
      data: bal,
      message: "Balance retrived",
    });
  } catch (error) {
    next(error);
  }
};

/*
 *
 * update Player status SELECTED as confirm players
 *
 */
const confirmPlayers = async (req, res, next) => {
  try {
    let allowed_role = [5];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");
    if (!req.body.market_id) throw new InputError("Market Id Required");
    if (!req.body.main_market_id) throw new InputError("Market Id Required");
    if (!req.body.event_name) throw new InputError("Event Name Required");
    if (req.body.selection == false) {
      if (!req.body.lastDigit) throw new InputError("Score Digit Required");
    }
    if (
      !req.body.amount ||
      req.body.amount === "" ||
      isNaN(Number(req.body.amount))
    )
      throw new InputError("Bet amount Required");

    
    
    /*
    * BET Amount Validations *
    */  
    if ((req.body.amount < 1 || req.body.amount > 5) && [1, 2, 6, 7].includes(req.body.main_market_id)) {
      throw new InputError("Market bet amount is not valid. Amount is restricted [min. 1, max. 5]");
    }
    if ((req.body.amount < 500 || req.body.amount > 10000) && [4,5,11].includes(req.body.main_market_id)) {
      throw new InputError("Market bet amount is not valid. Amount is restricted [min. 500, max. 10000]");
    }
    if ((req.body.amount < 100 || req.body.amount > 2000) && [3,8,9,10].includes(req.body.main_market_id)) {
      throw new InputError("Market bet amount is not valid. Amount is restricted [min. 100, max. 2000]");
    }

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    let email = _self[0].email;

    //check event status & Bet Locked validation
    let eventStatus = await Event.getEventByEventID(req.body.event_id);

    /* Start of all validations sections */

    if (eventStatus.length == 0)
      throw new InputError("Event not exist or expired");

    // if (eventStatus.length > 0) {
    //   if (eventStatus[0].status == 0)
    //     throw new InputError("Event Status Inactivated or disabled");
    //   if (eventStatus[0].bet_lock == 1)
    //     throw new InputError("Event Bet Locked");
    // }

    //check runner selected or not
    let runners = [];
    if (req.body.selection == false) {
      runners = await Event.getPlayers(req.body.event_id, req.body.market_id);
    } else {
      runners = await Event.getSelRunnersByMarket(req.body);
    }

    if (runners.length == 0)
      throw new InputError("Empty selection box, select player again!");

    //exp balance calc validate
    let exp = {};
    if(req.body.main_market_id == 9 || req.body.main_market_id == 3) {
      exp = await Event.getExpByBet(req.body);
    } else {
      exp = await Event.getExpByMarket(req.body);
    }

    let totalExp = 0;
    for (let i = 0; i < exp.length; i++) {
      if (exp[i].market_id == req.body.market_id) {
        totalExp = exp[i].total_exp * req.body.amount;
      }
    }

    if (req.body.selection == false) {
      totalExp = -Math.abs(req.body.amount);
    }

    let self_exp = (_self[0] && _self[0].exposer) ? _self[0].exposer : 0;
    totalExp = Math.abs(self_exp) + Math.abs(totalExp);
    //totalExp += (_self[0] && _self[0].exposer) ? _self[0].exposer : 0;


    if (Math.abs(totalExp) > _self[0].amount)
      throw new InputError("Not Enough Balance.");

    /* End of all validations sections */

    //confirm players
    let rows = [];
    if (req.body.selection == false) {
      //console.log(req.body.amount)
      const partners = await User.getallPart(_self[0].id);
      let part_arr = await parsePart(partners, _self);
      req.body.type = "user";
      req.body.part_chain = JSON.stringify(part_arr);
      //set bet to runner_users table
      let data = {};
      
        data.event_id = req.body.event_id;
        data.market_id  = req.body.market_id;
        data.runnerId   = runners[0].id;
        data.user_id  = req.body.user_id;
        data.runner_name = runners[0].name;
        data.sequence = 1;
        data.team = 1;
        data.type = 'user';
        data.run_digit = req.body.lastDigit;
        data.exp = req.body.amount;
        data.amount = req.body.amount ?? 0;
        data.eventType = req.body.eventtype;
        data.main_market_id = req.body.main_market_id;
        data.status = "SELECTED";
        data.parent_id = req.body.parent_id;
        data.part_chain = req.body.part_chain;

        try {
          rows = await Event.addRunnerScore(data);
        } catch (error) {
          console.error("Error adding runner score:", error);
          // Handle the error (e.g., send a response to the user or log it)
        }
    } else {
      rows = await Event.confirmPlayers(req.body);
    }

    
    //count main exposer of user & its parents
    let part_chain = await Event.getPartChain(req.body.user_id);
    let parents = JSON.parse(part_chain[0]["chain"]);

    //count exposer
    ////let exp = await Event.getExpByMarket(req.body);

    let total_exp = [];
    if (req.body.selection == false) {
      let expCalc = -Math.abs(req.body.amount);
      total_exp.push([req.body.user_id, expCalc]);

      //parent exp calc
      for (let k = 0; k < parents.length; k++) {
        if (parents[k]["id"] != req.body.user_id) {
          let part = 0;
          if (parents[k].id === _self[0].parent_id) {
            // direct parent
            part = parents[k].part;
          } else {
            // upline parent
            part = parents[k].part - parents[k - 1].part;
          }

          let ex = (Math.abs(expCalc) * part) / 100;
          total_exp.push([parents[k]["id"], ex]);
        } //if
      } //for parents

      
    } else {
      
      for (let i = 0; i < exp.length; i++) {
        if (exp[i].market_id == req.body.market_id) {
          let expCalc = exp[i].total_exp * req.body.amount;
          total_exp.push([req.body.user_id, expCalc]);

          //parent exp calc
          for (let k = 0; k < parents.length; k++) {
            if (parents[k]["id"] != req.body.user_id) {
              // let part =
              //   k === 1
              //     ? parents[k]["part"]
              //     : parents[k]["part"] - parents[k - 1]["part"];

              let part = 0;
              if (parents[k].id === _self[0].parent_id) {
                // direct parent
                part = parents[k].part;
              } else {
                // upline parent
                part = parents[k].part - parents[k - 1].part;
              }

              let ex = (Math.abs(expCalc) * part) / 100;
              total_exp.push([parents[k]["id"], ex]);
            } //if
          } //for parents
        } //if
      } //for
    } // else

    // console.log('total', total_exp);
    // return;

    let expMain = await Event.updateMainExp(total_exp);

    //Add Bets
    let bet = [];
    if (req.body.selection == false) {
      bet.push([
        req.body.user_id,
        email,
        req.body.event_name,
        runners[0].event_id,
        runners[0].market_id,
        runners[0].main_market_id,
        runners[0].id,
        runners[0].name,
        runners[0].team,
        eventStatus[0]["team" + runners[0].team],
        req.body.amount,
        "user",
        req.body.amount,
        "127.0.0.1",
        "mozilla window",
      ]);
    } else {
      for (let i = 0; i < runners.length; i++) {
        bet.push([
          runners[i].user_id,
          email,
          req.body.event_name,
          runners[i].event_id,
          runners[i].market_id,
          runners[i].main_market_id,
          runners[i].runnerId,
          runners[i].runner_name,
          runners[i].team,
          eventStatus[0]["team" + runners[i].team],
          req.body.amount,
          runners[i].type,
          runners[i].exp,
          "127.0.0.1",
          "mozilla window",
        ]);
      }
    }

    let bets = await Event.addBets(bet);
    //console.log(runners);

    res.status(200).json({
      success: true,
      data: rows,
      bets: runners,
      message: "Selection Confirmed!",
    });
  } catch (error) {
    next(error);
  }
};

const parsePart = async (partners, _self) => {
  for (let i = 0; i < partners.length; i++) {
    if (partners[i].id === _self[0].id) {
      // self
      partners[i].down_line = 0;
      partners[i].up_line = partners[i].our = partners[i].part;
    } else if (partners[i].id === _self[0].parent_id) {
      // direct parent

      partners[i].down_line = 100;
      partners[i].our = partners[i].part;
      partners[i].up_line = 100 - partners[i].part;
    } else {
      // upline parent

      partners[i].down_line = partners[i - 1].up_line;
      partners[i].our = partners[i].part - partners[i - 1].part;
      partners[i].up_line = partners[i].down_line - partners[i].our;
    }
  }
  return partners;
};

const getConfirmPlayers = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");
    if (!req.body.market_id) throw new InputError("Market Id Required");
    // if (!req.body.runnerId) throw new InputError("Runner Id Required");
    //if (!req.body.user_id) throw new InputError("User Id Required");
    const _self = await User.getProfile(parseJwt(req).email); // login user info

    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    //req.body.type = 'user';

    let confirmedMarkets = await Event.getConfirmPlayers(req.body);

    res.status(200).json({
      success: true,
      data: confirmedMarkets,
      message: "Confirmed Market & Runners retrieved",
    });
  } catch (error) {
    next(error);
  }
};

const getMyMarkets = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //let p_id = _self[0].id;
    let p_id = _self[0].parent_id;
    //if (_self[0].u_role !== 3) p_id = _self[0].parent_id;

    let uids = [];
    let user_id = [];
    if (_self[0].u_role != 5) {
      uids = await User.getChild(_self[0].id, 5);
      if (uids.length > 0) {
        for (let i = 0; i < uids.length; i++) {
          user_id.push(uids[i].id);
        }
      }
    } else {
      user_id = _self[0].id;
    }

    // let user_id = _self[0].id;
    const markets = await Event.getMyMarkets(user_id);

    let mkIds = [];
    let exp = {};
    let market = {};
    let trades = {};
    let eventIDs = [];
    let main_marketIDs = [];
    for (let i = 0; i < markets.length; i++) {
      mkIds.push(parseInt(markets[i].market_id));
      eventIDs.push(parseInt(markets[i].event_id));
      market[markets[i].market_id] = markets[i].market_name;
      main_marketIDs.push(markets[i].main_market_id);
    }

    //unique value mkid
    mkIds = [...new Set(mkIds)];
    eventIDs = [...new Set(eventIDs)];
    main_marketIDs = [...new Set(main_marketIDs)];

    let expEvents = [];
    // eventIDs.length > 0
    //   ? (expEvents = await Event.getExpByEvent(eventIDs, user_id))
    //   : [];

    if (eventIDs.length > 0) {
      if (main_marketIDs.length > 0) {
        for (let i = 0; i < main_marketIDs.length; i++) {
          if(main_marketIDs[i] == 3 || main_marketIDs[i] == 9) {
            
            expEvents = await Event.getExpByEventSingleBet(eventIDs, user_id);
          } else {
            expEvents = await Event.getExpByEvent(eventIDs, user_id);
          }
        }
      } //main_marketIDs.length
    }

    // for (let i = 0; i < expEvents.length; i++) {
    //   exp[expEvents[i].event_id] = parseInt(expEvents[i].total_exp);
    // }

    //exposer, events, trade by events calculation
    for (let i = 0; i < eventIDs.length; i++) {
      let exp1 = 0;
      for (let k = 0; k < expEvents.length; k++) {
        if (eventIDs[i] == expEvents[k].event_id) {
          if (_self[0].u_role != 5) {
            // exp1 += Math.abs(expEvents[k].total_exp * p) / 100;
          } else {
            if (expEvents[k] && "total_exp" in expEvents[k]) {
              exp1 += expEvents[k].total_exp;
            } else {
              exp1 += 0; // fallback if total_exp is not defined or expEvents[k] is undefined
            }

            // exp1 += expEvents[k].total_exp;
          }

          exp[expEvents[k].event_id] = exp1;
        }
      } //expEvent
    }

    //console.log(expEvents);

    res.status(200).json({
      success: true,
      data: markets,
      markets: market,
      mkIds: mkIds,
      expMarket: exp,
    });
  } catch (error) {
    next(error);
  }
};

const getMyMarketsByEvent = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.event_id) throw new InputError("Event Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //let p_id = _self[0].id;
    let p_id = _self[0].parent_id;
    //if (_self[0].u_role !== 3) p_id = _self[0].parent_id;

    let uids = [];
    let user_id = [];
    if (_self[0].u_role != 5) {
      uids = await User.getChild(_self[0].id, 5);
      if (uids.length > 0) {
        for (let i = 0; i < uids.length; i++) {
          user_id.push(uids[i].id);
        }
      }
    } else {
      user_id = _self[0].id;
    }

    // let user_id = _self[0].id;
    const markets = await Event.getMyMarketsByEvent(user_id, req.body.event_id);

    //console.log('ggkk', markets)

    let mkIds = [];
    let exp = {};
    let market = {};
    let trades = {};
    let eventIDs = [];
    let main_marketIDs = [];
    for (let i = 0; i < markets.length; i++) {
      mkIds.push(parseInt(markets[i].market_id));
      eventIDs.push(parseInt(markets[i].event_id));
      market[markets[i].market_id] = markets[i].market_name;
      main_marketIDs.push(markets[i].main_market_id);
    }

    //unique value mkid
    mkIds = [...new Set(mkIds)];
    eventIDs = [...new Set(eventIDs)];
    main_marketIDs = [...new Set(main_marketIDs)];

    let expEvents = [];
    let all_exp = {};
    // eventIDs.length > 0
    //   ? (expEvents = await Event.getExpByEvent(eventIDs, user_id))
    //   : [];

    if (eventIDs.length > 0) {
      if (main_marketIDs.length > 0) {
        for (let i = 0; i < main_marketIDs.length; i++) {
          if(main_marketIDs[i] == 3 || main_marketIDs[i] == 9) {
            expEvents = await Event.getExpByEventSingleBet(eventIDs, user_id);
          } else {
            expEvents = await Event.getExpByEvent(eventIDs, user_id);
          }
        }
      } //main_marketIDs.length
    }

    //exposer, events, trade by events calculation
    //Total all markets exposure
    for (let i = 0; i < eventIDs.length; i++) {
      let exp1 = 0;
      for (let k = 0; k < expEvents.length; k++) {
        if (!expEvents[k]) continue; // Skip if the current event is undefined or null

        // Update all_exp with market_id as the key
        if (expEvents[k] && expEvents[k].market_id && expEvents[k].total_exp) {
          all_exp[expEvents[k].market_id] = expEvents[k].total_exp;

          // all_exp.push({
          //   [expEvents[k].market_id]: expEvents[k].total_exp
          // });
        }

        if (eventIDs[i] == expEvents[k].event_id) {
          if (_self[0].u_role != 5) {
            // exp1 += Math.abs(expEvents[k].total_exp * p) / 100;
          } else {
            if (expEvents[k] && "total_exp" in expEvents[k]) {
              exp1 += expEvents[k].total_exp;
            } else {
              exp1 += 0; // fallback if total_exp is not defined or expEvents[k] is undefined
            }

            // exp1 += expEvents[k].total_exp;
          }

          exp[expEvents[k].event_id] = exp1;
        }
      } //expEvent
    }

    // console.log(all_exp)
    // console.log(exp)
    // console.log(all_exp['163'])

    res.status(200).json({
      success: true,
      data: markets,
      markets: market,
      mkIds: mkIds,
      expMarket: exp,
      all_exp: all_exp, //market wise exp
    });
  } catch (error) {
    next(error);
  }
};

const getMyPlayers = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //let p_id = _self[0].id;
    let p_id = _self[0].parent_id;
    //if (_self[0].u_role !== 3) p_id = _self[0].parent_id;

    let uids = [];
    let user_id = [];
    if (_self[0].u_role != 5) {
      uids = await User.getChild(_self[0].id, 5);
      if (uids.length > 0) {
        for (let i = 0; i < uids.length; i++) {
          user_id.push(uids[i].id);
        }
      }
    } else {
      user_id = _self[0].id;
    }

    let players = [];
    let playerName = [];
    // if (_self[0].u_role != 5) {
    //   players = await Event.getMyPlayers(user_id);
    //   //playerName = await Event.getMyPlayerName(user_id);
    // } else {
    //   players = await Event.getMyPlayers(user_id);
    // }

    players = await Event.getMyPlayers(user_id);

    //console.log(players)
    let event_ids = [];
    if (players.length > 0) {
      for (let i = 0; i < players.length; i++) {
        event_ids.push(players[i].event_id);
      }
    }
    event_ids = event_ids.filter(
      (value, index, array) => array.indexOf(value) === index
    );

    let runs = [];
    if (event_ids.length > 0) {
      runs = await Event.getScore(event_ids);
    }

    if (runs.length > 0) {
      for (let i = 0; i < players.length; i++) {
        for (let k = 0; k < runs.length; k++) {
          let t1 = [];
          let t2 = [];

          if (
            players[i].event_id == runs[k].event_id &&
            players[i].market_name == runs[k].market_name
          ) {
            runs[k].t1 != null ? (t1 = JSON.parse(runs[k].t1)) : null;
            runs[k].t2 != null ? (t2 = JSON.parse(runs[k].t2)) : null;

            //set runs
            t1[players[i].runnerId]
              ? (players[i].runs = t1[players[i].runnerId])
              : null;
            t2[players[i].runnerId]
              ? (players[i].runs = t2[players[i].runnerId])
              : null;

            //(runs[k].main_market_id == 11) ? players[i].runs == runs[k].result : null;
            if (runs[k].main_market_id == 11) {
              if (runs[k].result == players[i].runnerId) {
                players[i].runs = runs[k].result;
              }
              // if(runs[k].result == runs[k].t2) {
              //   players[i].runs = runs[k].result;
              //   console.log(runs[k].t2);
              // }
            }

            // if (runs[k].main_market_id == 1) {
            //   if (runs[k].result == players[i].runnerId) {
            //     players[i].runs = runs[k].result;
            //   }
            // }

          }
        }
      }
    }

    //console.log(players)
    //console.log(runs)

    res.status(200).json({
      success: true,
      data: players,
    });
  } catch (error) {
    next(error);
  }
};

const getEventStatus = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.event_id) throw new InputError("Event Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    const events = await Event.getEventStatus(req.body.event_id);

    // Get the current date for comparison
    let currDate = moment();
    let event_timeout = 0;
    events.forEach((event) => {
      if (moment(event.opendate).isBefore(currDate)) {
        event_timeout = 1; // Set event_timeout if the event is before current date
      }
    });

    // console.log(currDate);
    // console.log(moment(events[0].opendate))
    // console.log(event_timeout);

    res.status(200).json({
      success: true,
      data: events,
      event_timeout: event_timeout,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * All Parent Market status updates
 */
const updateMarketStatus = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.event_id) throw new InputError("Event Id Required");
    if (!req.body.market_id) throw new InputError("Market Id Required");
    if (!req.body.type_name) throw new InputError("Market Name Required");
    //if (!req.body.visible) throw new InputError("Market Visible Status Required");
    //if (!req.body.locked) throw new InputError("Market Locked Status Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    req.body.locked = req.body.locked == null ? 1 : req.body.locked;
    req.body.visible = req.body.visible == null ? 1 : req.body.visible;
    req.body.user_id = _self[0].id;
    req.body.admin_id = _self[0].parent_id;

    // return true;
    let data = await Event.updateMarketStatus(req.body);

    res.status(200).json({
      success: true,
      data: [],
      message: data.affectedRows
        ? `Market ${req.body.type} status updated`
        : "UnChanged",
    });
  } catch (error) {
    next(error);
  }
};

const getMarketStatus = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.event_id) throw new InputError("Event Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    const events = await Event.getEventStatus(req.body.event_id);

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const getExposerTable = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    let p_id = _self[0].parent_id;
    let uids = [];
    let user_id = [];
    if (_self[0].u_role != 5) {
      uids = await User.getChild(_self[0].id, 5);
      if (uids.length > 0) {
        for (let i = 0; i < uids.length; i++) {
          user_id.push(uids[i].id);
        }
      }
    } else {
      //user_id = _self[0].id;
      user_id.push(_self[0].id);
    }

    // let user_id = _self[0].id;
    const markets = await Event.getMyMarkets(user_id);

    let mkIds = [];
    let exp = {};
    let market = {};
    let eventIDs = [];
    let main_marketIDs = [];
    for (let i = 0; i < markets.length; i++) {
      mkIds.push(markets[i].market_id);
      eventIDs.push(markets[i].event_id);
      main_marketIDs.push(markets[i].main_market_id);
    }

    //unique value mkid
    mkIds = [...new Set(mkIds)];
    eventIDs = [...new Set(eventIDs)];
    main_marketIDs = [...new Set(main_marketIDs)];

    console.log(main_marketIDs)

    let expEvents = [];
    let events = [];
    if (eventIDs.length > 0) {
      if (main_marketIDs.length > 0) {
        for (let i = 0; i < main_marketIDs.length; i++) {
          if(main_marketIDs[i] == 3 || main_marketIDs[i] == 9) {
            
            expEvents = await Event.getExpByEventSingleBet(eventIDs, user_id);
          } else {
            expEvents = await Event.getExpByEvent(eventIDs, user_id);
          }
        }
      } //main_marketIDs.length
    }

    // for (let i = 0; i < markets.length; i++) {
    //   if(markets[i].main_market_id == 3 || markets[i].main_market_id == 9) {
    //     expEvents = await Event.getExpByEventSingleBet(markets[i].event_id, user_id);
    //   } else {
    //     expEvents = await Event.getExpByEvent(markets[i].event_id, user_id);
    //   }
    // }

    console.log(expEvents)

    eventIDs.length > 0
      ? (events = await Event.getEventByEventIDArray(eventIDs))
      : [];

    let part = await User.getPartnerships(_self[0].id);

    let p = 0;
    // if (_self[0].u_role != 5) {
    //   for (let k = 0; k < part.length; k++) {
    //     if (part[k].id == _self[0].id) {
    //       //wp = k === 1 ? part[k].part : part[k].part - part[k + 1].part;
    //     } //if parents != user
    //   } //for parents
    // }

     

    //exposer, events, trade by events calculation
    for (let i = 0; i < events.length; i++) {
      let exp = 0;
      for (let k = 0; k < expEvents.length; k++) {
        if (events[i].event_id == expEvents[k].event_id) {
          expEvents[k].event_name = events[i].event_name;
          expEvents[k].event_type = events[i].type;

          //exp[expEvents[k].event_id] = parseInt(expEvents[k].total_exp);
          //calc trades markets for exp

          if (!events[i].exp) {
            events[i].exp = [];
          }

          if (_self[0].u_role != 5) {
            exp += Math.abs(expEvents[k].total_exp * p) / 100;
            //events[i].exp.push(p);
          } else {
            exp += expEvents[k].total_exp;
          }

          //console.log(events[i].event_id + '===' + expEvents[k].event_id + '===' + exp)

          events[i].exp = exp;
        }
      } //expEvent

      for (let n = 0; n < markets.length; n++) {
        if (events[i].event_id == markets[n].event_id) {
          if (!events[i].trades) {
            events[i].trades = [];
          }
          events[i].trades.push(markets[n].market_name);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: events,
      markets: markets,
      mkIds: mkIds,
    });
  } catch (error) {
    next(error);
  }
};

const getButtons = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.event_id) throw new InputError("Event Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //console.log(req.body.main_market_id)

    const buttons = await Event.getButtonsByMK(1, req.body.main_market_id);

    res.status(200).json({
      success: true,
      data: buttons,
    });
  } catch (error) {
    next(error);
  }
};

const getAC = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    let user_id = _self[0].id;
    //req.body.user_id = _self[0].id;
    //const players = await Result.getAC(user_id);
    const players = await Event.getAC(user_id);

    // console.log(players);

    res.status(200).json({
      success: true,
      data: players,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Get Result System
 */
const getResults = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    req.body.user_id = _self[0].id;
    let result = await Event.getResults(req.body.event_id);

    let runs_team1_nocut = [];
    let runs_team2_nocut = [];
    let runs_team1_cut = [];
    let runs_team2_cut = [];

    let wickets_team1_nocut = [];
    let wickets_team2_nocut = [];
    let wickets_team1_cut = [];
    let wickets_team2_cut = [];

    let resultArr = [];
    let runs_result = "";
    let wkt_result = "";

    if (result.length > 0) {
      for (let i = 0; i < result.length; i++) {
        //NO CUT RUNS ***************************************
        if (
          result[i].result_type == "RUN" &&
          result[i].market_name == "NO_CUT"
        ) {
          //TEAM 1
          runs_team1_nocut = JSON.parse(result[i].t1);
          runs_team1_nocut = Object.keys(runs_team1_nocut).map((key) => [
            key,
            runs_team1_nocut[key],
          ]);

          //TEAM 2
          runs_team2_nocut = JSON.parse(result[i].t2);
          runs_team2_nocut = Object.keys(runs_team2_nocut).map((key) => [
            key,
            runs_team2_nocut[key],
          ]);

          //console.log();
        } //IF

        //CUT RUNS *******************************************
        if (result[i].result_type == "RUN" && result[i].market_name == "CUT") {
          //TEAM 1
          runs_team1_cut = JSON.parse(result[i].t1);
          runs_team1_cut = Object.keys(runs_team1_cut).map((key) => [
            key,
            runs_team1_cut[key],
          ]);

          //TEAM 2
          runs_team2_cut = JSON.parse(result[i].t2);
          runs_team2_cut = Object.keys(runs_team2_cut).map((key) => [
            key,
            runs_team2_cut[key],
          ]);
        } //if

        //NO_CUT WICKETS *********************************
        if (
          result[i].result_type == "WICKET" &&
          result[i].market_name == "NO_CUT"
        ) {
          //Team 1
          wickets_team1_nocut = JSON.parse(result[i].t1);
          wickets_team1_nocut = Object.keys(wickets_team1_nocut).map((key) => [
            key,
            wickets_team1_nocut[key],
          ]);

          //Team 2
          wickets_team2_nocut = JSON.parse(result[i].t2);
          wickets_team2_nocut = Object.keys(wickets_team2_nocut).map((key) => [
            key,
            wickets_team2_nocut[key],
          ]);

          //wkt_result = result[i].result_type;
        } //if

        //CUT WICKETS ************************************
        if (
          result[i].result_type == "WICKET" &&
          result[i].market_name == "CUT"
        ) {
          //Team 1
          wickets_team1_cut = JSON.parse(result[i].t1);
          wickets_team1_cut = Object.keys(wickets_team1_cut).map((key) => [
            key,
            wickets_team1_cut[key],
          ]);

          //Team 2
          wickets_team2_cut = JSON.parse(result[i].t2);
          wickets_team2_cut = Object.keys(wickets_team2_cut).map((key) => [
            key,
            wickets_team2_cut[key],
          ]);

          //wkt_result = result[i].result_type;
        } //if
      }
    }

    res.status(200).json({
      success: true,
      data: resultArr,
      runs_team1_nocut: runs_team1_nocut,
      runs_team2_nocut: runs_team2_nocut,
      runs_team1_cut: runs_team1_cut,
      runs_team2_cut: runs_team2_cut,
      wickets_team1_nocut: wickets_team1_nocut,
      wickets_team2_nocut: wickets_team2_nocut,
      wickets_team1_cut: wickets_team1_cut,
      wickets_team2_cut: wickets_team2_cut,
      //run: runs_result,
      //wicket: wkt_result,
      message: "Result retrived",
    });
  } catch (error) {
    next(error);
  }
};

const getResultsAll = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.event_id) throw new InputError("Event Id Required");
    if (!req.body.market_id) throw new InputError("Market Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //let p_id = _self[0].id;
    let p_id = _self[0].parent_id;
    //if (_self[0].u_role !== 3) p_id = _self[0].parent_id;

    let uids = [];
    let user_id = [];
    if (_self[0].u_role != 5) {
      uids = await User.getChild(_self[0].id, 5);
      if (uids.length > 0) {
        for (let i = 0; i < uids.length; i++) {
          user_id.push(uids[i].id);
        }
      }
    } else {
      user_id = _self[0].id;
    }

    let players = [];
    let markets = [];
    let playerName = [];

    // const events = await Event.getEvents(p_id);
    // let event_ids = [];
    // for (let i = 0; i < events.length; i++) {
    //   event_ids.push(events[i].event_id);
    // }

    //markets = await Event.getMarketsAll(event_ids);
    markets = await Event.getMarkets(req.body.event_id);

    // players = await Event.getPlayersAll(event_ids);
    players = await Event.getPlayers(req.body.event_id, req.body.market_id);

    //console.log(players)

    let runs = [];
    if (event_ids.length > 0) {
      runs = await Event.getScore(event_ids);
    }

    if (runs.length > 0) {
      for (let i = 0; i < players.length; i++) {
        for (let k = 0; k < runs.length; k++) {
          let t1 = [];
          let t2 = [];

          if (
            players[i].event_id == runs[k].event_id &&
            players[i].market_name == runs[k].market_name
          ) {
            runs[k].t1 != null ? (t1 = JSON.parse(runs[k].t1)) : null;
            runs[k].t2 != null ? (t2 = JSON.parse(runs[k].t2)) : null;

            t1[players[i].id] ? (players[i].runs = t1[players[i].id]) : null;
            t2[players[i].id] ? (players[i].runs = t2[players[i].id]) : null;

            if (runs[k].main_market_id == 11) {
              if (runs[k].result == players[i].id) {
                players[i].runs = runs[k].result;
                //console.log(runs[k].result, '--', players[i].id)
              }
            }
          }
        }
      }
    }

    //console.log(players)

    res.status(200).json({
      success: true,
      data: players,
      markets: markets,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Get Result User
 */
const getResult = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.event_id) throw new InputError("Event Id Required");
    if (!req.body.market_id) throw new InputError("Market Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //let p_id = _self[0].id;
    let p_id = _self[0].parent_id;
    //if (_self[0].u_role !== 3) p_id = _self[0].parent_id;

    let uids = [];
    let user_id = [];
    if (_self[0].u_role != 5) {
      uids = await User.getChild(_self[0].id, 5);
      if (uids.length > 0) {
        for (let i = 0; i < uids.length; i++) {
          user_id.push(uids[i].id);
        }
      }
    } else {
      user_id = _self[0].id;
    }

    let players = [];
    let markets = [];

    // players = await Event.getPlayersAll(event_ids);
    // players = await Event.getMyPlayers(user_id);
    players = await Event.getPlayersByMK(req.body.event_id, req.body.market_id);

    // console.log(players);

    let runs = [];
    runs = await Event.getScoreByMK(req.body.event_id, req.body.market_id);

    if (runs.length > 0) {
      for (let i = 0; i < players.length; i++) {
        for (let k = 0; k < runs.length; k++) {
          let t1 = [];
          let t2 = [];

          if (
            players[i].event_id == runs[k].event_id &&
            players[i].main_market_id == runs[k].main_market_id
          ) {
            runs[k].t1 != null ? (t1 = JSON.parse(runs[k].t1)) : null;
            runs[k].t2 != null ? (t2 = JSON.parse(runs[k].t2)) : null;

            t1[players[i].id] ? (players[i].runs = t1[players[i].id]) : null;
            t2[players[i].id] ? (players[i].runs = t2[players[i].id]) : null;

            if (runs[k].main_market_id == 11) {
              if (runs[k].result == players[i].id) {
                players[i].runs = runs[k].result;
                //console.log(runs[k].result, '--', players[i].id)
              }
            }
          }
        }
      }
    }

    //console.log(runs);
    //console.log('kk');
    //console.log(players)

    res.status(200).json({
      success: true,
      data: players,
    });
  } catch (error) {
    next(error);
  }
};

const getBets = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    let user_id = _self[0].id;
    let childIds = [];
    if (_self[0].u_role == 5) {
      childIds.push(user_id);
    }

    //const childs = await User.getChildIds(user_id);

    const childs = await User.getAllChildsCustom(user_id);

    //console.log(childs)

    if (childs.length > 0) {
      for (let i = 0; i < childs.length; i++) {
        childIds.push(childs[i]["id"]);
      }
    }

    // if (childs.length > 0) {
    //   for (let i = 0; i < childs.length; i++) {
    //     childIds.push(childs[i]["id"]);
    //   }
    // }

    const players = await Event.getBets(childIds);

    res.status(200).json({
      success: true,
      data: players,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  //getDefaultMarkets,
  getEventByEventID,
  getPlayers,
  addPlayer,
  getMarkets,
  getMarketsC,
  getMarketsList,
  selectRunner,
  getSelectedRuners,
  getSelectedRunersSingle,
  unSelectRunner,
  unSelectSingleRunner,
  getBalance,
  confirmPlayers,
  getConfirmPlayers,
  getMyMarkets,
  getMyMarketsByEvent,
  getMyPlayers,
  updateMarketStatus,
  getEventStatus,
  getMarketStatus,
  getExposerTable,
  getButtons,
  getAC,
  getResults,
  getResultsAll,
  getResult,
  parsePart,
  getBets,
  selectSingleRunner,
  selectOddEven,
};

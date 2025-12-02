const Result = require("./result-modal");
const User = require("../user/user-modal");
const Event = require("../event/event-modal");
const fetch = require("node-fetch");
const { parseJwt } = require("../common/authenticate-token-middleware");
const { InputError } = require("../common/errors");
const allConfig = require("../../../config/allConfig");

//const io = require('socket.io-client');

const app = require("../../../app");

const https = require("https");
const { Console } = require("console");
const { json } = require("express");
const { flags } = require("socket.io/lib/namespace");

const getEventRunners = async (req, res, next) => {
  try {
    let allowed_role = [1];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");

    const eventRunners = await Result.getEventRunners(req.body.event_id);

    let runsMarkets = [];
    let wicketsMarkets = [];
    let activeMarkets = [];
    let tossData = [];

    if (eventRunners.length > 0) {
      for (let i = 0; i < eventRunners.length; i++) {
        activeMarkets.push(eventRunners[i].main_market_id);

        if (
          eventRunners[i].main_market_id == 1 ||
          eventRunners[i].main_market_id == 2
        ) {
          runsMarkets.push(eventRunners[i]);
        }
        if (
          eventRunners[i].main_market_id == 6 ||
          eventRunners[i].main_market_id == 7
        ) {
          wicketsMarkets.push(eventRunners[i]);
        }

        if (eventRunners[i].main_market_id == 11) {
          tossData.push({
            name: eventRunners[i].name,
            runnerId: eventRunners[i].runnerId,
          });
        }
      }
    }

    //console.log(tossData)
    //console.log(eventRunners)

    activeMarkets = activeMarkets.filter(
      (value, index, array) => array.indexOf(value) === index
    );

    //console.log(activeMarkets)
    const event = await Event.getEventByEventID(req.body.event_id);
    res.status(200).json({
      success: true,
      data: eventRunners,
      event: event,
      runsmktdata: runsMarkets,
      wktmktdata: wicketsMarkets,
      activeMarkets: activeMarkets,
      toss: tossData,
    });
  } catch (error) {
    next(error);
  }
};

const updateRuns = async (req, res, next) => {
  try {
    let allowed_role = [1];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.event_id) throw new InputError("Event Id Required");
    if (!req.body.eventtype) throw new InputError("Event Type Required");
    if (!req.body.fieldsT1) throw new InputError("Runner Team-1 Required");
    if (!req.body.fieldsT2) throw new InputError("Runner Team-2 Required");
    if (!req.body.event_name) throw new InputError("Event Name Required");
    if (!req.body.type) throw new InputError("Result Type Required");
    if (!req.body.mType) throw new InputError("Market Type Required");
    if (!req.body.revoke) throw new InputError("Revoke Type Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    //let p_id = _self[0].id;
    let p_id = _self[0].parent_id;
    let user_id = _self[0].id;
    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    let event_name = req.body.event_name;
    //const players = await Event.getMyPlayers(user_id);

    let team1_runner_total = 0;
    let team2_runner_total = 0;
    let team1 = req.body.fieldsT1;
    let team2 = req.body.fieldsT2;
    let teamAll = req.body.team;

    const markets = await Event.getMarkets(req.body.event_id);

    //NO CUT Market calc***********
    let noCutId = "";
    let cutId = "";
    let noCutWId = "";
    let cutWId = "";
    let topBatterId = "";
    let topBowlerId = "";
    let oddEvenId = "";

    let def_noCutId = 0;
    let def_cutId = 0;
    let def_noCutWId = 0;
    let def_cutWId = 0;
    let def_topBatterId = 0;
    let def_topBowlerId = 0;
    let def_oddEvenId = 0;

    for (let i = 0; i < markets.length; i++) {
      //req.body.type == "runs"
      if (markets[i].market_name == "NO_CUT") {
        noCutId = markets[i].id;
        def_noCutId = markets[i].main_market_id;
      }
      if (markets[i].market_name == "CUT") {
        cutId = markets[i].id;
        def_cutId = markets[i].main_market_id;
      }
      if (markets[i].market_name == "TOP_BATTER") {
        topBatterId = markets[i].id;
        def_topBatterId = markets[i].main_market_id;
      }
      if (markets[i].market_name == "TOP_BOWLER") {
        topBowlerId = markets[i].id;
        def_topBowlerId = markets[i].main_market_id;
      }
      if (markets[i].market_name == "ODD_EVEN") {
        oddEvenId = markets[i].id;
        def_oddEvenId = markets[i].main_market_id;
      }

      //req.body.type == "wickets"
      if (markets[i].market_name == "BOWLER_WICKET_NO_CUT") {
        noCutWId = markets[i].id;
        def_noCutWId = markets[i].main_market_id;
      }
      if (markets[i].market_name == "BOWLER_WICKET_CUT") {
        cutWId = markets[i].id;
        def_cutWId = markets[i].main_market_id;
      }
    }

    
    if (req.body.type == "runs") {
      if (req.body.revoke == "no") {
        if (req.body.mType == "NO_CUT") {
          let runs_no_cut = await noCutCalc(
            req,
            team1,
            team2,
            def_noCutId,
            noCutId
          );
        }
        if (req.body.mType == "CUT") {
          let runs_cut = await cutCalc(req, team1, team2, def_cutId, cutId);
        }
        if (req.body.mType == "TOP_BATTER") {
          let runs_top = await topBatterCalc(req, team1, team2, def_topBatterId, topBatterId);
        }
        if (req.body.mType == "TOP_BOWLER") {
          let runs_top = await topBowlerCalc(req, team1, team2, def_topBowlerId, topBowlerId);
        }
        if (req.body.mType == "ODD_EVEN") {
          let runs_top = await oddEvenCalc(req, team1, team2, def_oddEvenId, oddEvenId);
        }
      } else {
        //Revoked functions
        if (req.body.mType == "NO_CUT") {
          let runs_no_cut = await noCutCalcRevoke(
            req,
            team1,
            team2,
            def_noCutId,
            noCutId
          );
        }
        if (req.body.mType == "CUT") {
          let runs_cut = await cutCalcRevoke(
            req,
            team1,
            team2,
            def_cutId,
            cutId
          );
        }
        if (req.body.mType == "TOP_BATTER") {
          let runs_top = await topBatterCalcRevoke(
            req,
            team1,
            team2,
            def_topBatterId,
            topBatterId
          );
        }

        if (req.body.mType == "TOP_BOWLER") {
          let runs_top = await topBowlerCalcRevoke(
            req,
            team1,
            team2,
            def_topBowlerId,
            topBowlerId
          );
        }

        if (req.body.mType == "ODD_EVEN") {
          let runs_top = await oddEvenCalcRevoke(
            req,
            team1,
            team2,
            def_oddEvenId,
            oddEvenId
          );
        }
        
      }
    }

    // console.log(req.body.mType);
    // console.log(req.body.type);

    if (req.body.type == "wickets") {
      //let wickets_no_cut = await noCutWCalc(req,team1,team2,markets,noCutWId);
      if (req.body.revoke == "no") {
        if (req.body.mType == "NO_CUT") {
          let wickets_no_cut = await noCutWCalc(
            req,
            team1,
            team2,
            def_noCutWId,
            noCutWId
          );
        }
        if (req.body.mType == "CUT") {
          let wickets_cut = await cutWCalc(
            req,
            team1,
            team2,
            def_cutWId,
            cutWId
          );
        }
      } else {
        //Revoked functions
        if (req.body.mType == "NO_CUT") {
          let runs_no_cut = await noCutWCalcRevoke(
            req,
            team1,
            team2,
            def_noCutWId,
            noCutWId
          );
        }
        if (req.body.mType == "CUT") {
          let wickets_cut = await cutWCalcRevoke(
            req,
            team1,
            team2,
            def_cutWId,
            cutWId
          );
        }
      }
    }

    //****************** copied ************** */

    res.status(200).json({
      success: true,
      data: req.body,
      message: "Result Updated",
    });
  } catch (error) {
    next(error);
  }
};

/*
 *
 * RUNS NO_CUT, CUT market Calculations
 *
 */
const noCutCalc = async (req, team1, team2, def_noCutId, noCutId) => {
};

const noCutCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {

};

const cutCalc = async (req, team1, team2, def_noCutId, noCutId) => {
};

const cutCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {
};

/*
 *
 * TOP_BATTER & TOP_BOWLER Calculations
 *
 */
const topBatterCalc = async (req, team1, team2, def_noCutId, noCutId) => {
};

const topBatterCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {

};

const topBowlerCalc = async (req, team1, team2, def_noCutId, noCutId) => {
};

const topBowlerCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {

};

/*
 *
 * ODD-EVEN Calculations
 *
 */

const oddEvenCalc = async (req, team1, team2, def_noCutId, noCutId) => {

};

const oddEvenCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {

};

/*
 *
 * WICKET NO_CUT, CUT market Calculations
 *
 */

const noCutWCalc = async (req, team1, team2, def_noCutId, noCutId) => {

};

const noCutWCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {
};

const cutWCalc = async (req, team1, team2, def_noCutId, noCutId) => {
};
const cutWCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {
  };

const getResults = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    req.body.user_id = _self[0].id;
    let result = await Result.getResults(req.body.event_id);

    //console.log(result)

    let runs_team1_nocut = [];
    let runs_team2_nocut = [];
    let runs_team1_cut = [];
    let runs_team2_cut = [];
    let runs_team1_top = [];
    let runs_team2_top = [];
    let runs_team1_topB = [];
    let runs_team2_topB = [];
    let runs_team1_oddEven = [];
    let runs_team2_oddEven = [];

    let wickets_team1_nocut = [];
    let wickets_team2_nocut = [];
    let wickets_team1_cut = [];
    let wickets_team2_cut = [];

    let result_toss = [];
    let result_no_cut_revoked = [];
    let result_cut_revoked = [];

    let resultArr = [];
    let runs_result = "";
    let wkt_result = "";

    //console.log(result)

    if (result.length > 0) {
      for (let i = 0; i < result.length; i++) {
        //TOSS ***************************************
        if (
          result[i].result_type == "TOSS" &&
          result[i].market_name == "TOSS"
        ) {
          result_toss = result[i].result;
        }
        //NO CUT RUNS ***************************************
        if (
          result[i].result_type == "RUN" &&
          result[i].market_name == "NO_CUT"
        ) {
          //result_no_cut_revoked = result[i].revoked;

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

        //TOP_BATTER *******************************************
        if (result[i].result_type == "RUN" && result[i].market_name == "TOP_BATTER") {
          //TEAM 1
          runs_team1_top = JSON.parse(result[i].t1);
          runs_team1_top = Object.keys(runs_team1_top).map((key) => [
            key,
            runs_team1_top[key],
          ]);

          //TEAM 2
          runs_team2_top = JSON.parse(result[i].t2);
          runs_team2_top = Object.keys(runs_team2_top).map((key) => [
            key,
            runs_team2_top[key],
          ]);
        } //if

        //TOP_BOWLER *******************************************
        if (result[i].result_type == "RUN" && result[i].market_name == "TOP_BOWLER") {
          //TEAM 1
          runs_team1_topB = JSON.parse(result[i].t1);
          runs_team1_topB = Object.keys(runs_team1_topB).map((key) => [
            key,
            runs_team1_topB[key],
          ]);

          //TEAM 2
          runs_team2_topB = JSON.parse(result[i].t2);
          runs_team2_topB = Object.keys(runs_team2_topB).map((key) => [
            key,
            runs_team2_topB[key],
          ]);
        } //if

        //ODD_EVEN *******************************************
        if (result[i].result_type == "RUN" && result[i].market_name == "ODD_EVEN") {
          //TEAM 1
          runs_team1_oddEven = JSON.parse(result[i].t1);
          runs_team1_oddEven = Object.keys(runs_team1_oddEven).map((key) => [
            key,
            runs_team1_oddEven[key],
          ]);

          //TEAM 2
          runs_team2_oddEven = JSON.parse(result[i].t2);
          runs_team2_oddEven = Object.keys(runs_team2_oddEven).map((key) => [
            key,
            runs_team2_oddEven[key],
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
      data: result,
      runs_team1_nocut: runs_team1_nocut,
      runs_team2_nocut: runs_team2_nocut,
      runs_team1_cut: runs_team1_cut,
      runs_team2_cut: runs_team2_cut,
      wickets_team1_nocut: wickets_team1_nocut,
      wickets_team2_nocut: wickets_team2_nocut,
      wickets_team1_cut: wickets_team1_cut,
      wickets_team2_cut: wickets_team2_cut,
      result_toss: result_toss,
      runs_team1_top: runs_team1_top,
      runs_team2_top: runs_team2_top,
      runs_team1_top_bowler: runs_team1_topB,
      runs_team2_top_bowler: runs_team2_topB,
      runs_team1_odd_even: runs_team1_oddEven,
      runs_team2_odd_even: runs_team2_oddEven,
      //run: runs_result,
      //wicket: wkt_result,
      message: "Result retrived",
    });
  } catch (error) {
    next(error);
  }
};

const updateWickets = async (req, res, next) => {};

/*
 *  TOSS
 */
const updateToss = async (req, res, next) => {
  try {
    let allowed_role = [1];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }

    if (!req.body.event_id) throw new InputError("Event Id Required");
    if (!req.body.eventtype) throw new InputError("Event Type Required");
    if (!req.body.team) throw new InputError("Team Selection Required");
    if (!req.body.event_name) throw new InputError("Event Name Required");
    if (!req.body.type) throw new InputError("Result Type Required");
    if (!req.body.mType) throw new InputError("Market Type Required");
    if (!req.body.revoke) throw new InputError("Revoke Type Required");
    if (!req.body.t1) throw new InputError("Team-1 Required");
    if (!req.body.t2) throw new InputError("Team-2 Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    let p_id = _self[0].parent_id;
    let user_id = _self[0].id;
    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    let event_name = req.body.event_name;

    let team = req.body.team;

    const markets = await Event.getMarkets(req.body.event_id);

    //NO CUT Market calc***********
    let tossId = "";
    let def_tossId = 0;

    for (let i = 0; i < markets.length; i++) {
      //req.body.type == "runs"
      if (markets[i].market_name == "TOSS") {
        tossId = markets[i].id;
        def_tossId = markets[i].main_market_id;
      }
    }

    if (req.body.type == "toss") {
      if (req.body.revoke == "no") {
        if (req.body.mType == "TOSS") {
          let toss = await tossCalc(
            req,
            team,
            def_tossId,
            tossId,
            req.body.t1,
            req.body.t2
          );
        }
      } else {
        if (req.body.mType == "TOSS") {
          let toss = await tossCalcRevoke(
            req,
            team,
            def_tossId,
            tossId,
            req.body.t1,
            req.body.t2
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      data: req.body,
      message: "Result Updated: TOSS",
    });
  } catch (error) {
    next(error);
  }
};

const tossCalc = async (req, team, def_noCutId, noCutId, t1, t2) => {
 };

const tossCalcRevoke = async (req, team, def_noCutId, noCutId, t1, t2) => {
 };



const getBalance = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    //if (!req.body.event_id) throw new InputError("Event Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    let bal = await Result.getBalance(req.body.user_id);

    //console.log(bal[0]);

    res.status(200).json({
      success: true,
      data: bal,
      message: "Balance retrived",
    });
  } catch (error) {
    next(error);
  }
};

const resultVerify = async (req, res, next) => {
  try {
    let allowed_role = [1, 2, 3, 4, 5, 6];

    if (!allowed_role.includes(parseJwt(req).role)) {
      throw new InputError("Un Authorise.");
    }
    if (!req.body.event_id) throw new InputError("Event Id Required");

    const _self = await User.getProfile(parseJwt(req).email); // login user info

    req.body.user_id = _self[0].id;
    req.body.parent_id = _self[0].parent_id;
    let bal = await Result.getBalance(req.body.user_id);

    //console.log(bal[0]);

    res.status(200).json({
      success: true,
      data: bal,
      message: "Balance retrived",
    });
  } catch (error) {
    next(error);
  }
};

// const getAC = async (req, res, next) => {
//   try {
//     let allowed_role = [1, 2, 3, 4, 5, 6];

//     if (!allowed_role.includes(parseJwt(req).role)) {
//       throw new InputError("Un Authorise.");
//     }

//     const _self = await User.getProfile(parseJwt(req).email); // login user info

//     let user_id = _self[0].id;
//     //req.body.user_id = _self[0].id;
//     const players = await Result.getAC(user_id);

//     // console.log(players);

//     res.status(200).json({
//       success: true,
//       data: players,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

module.exports = {
  getEventRunners,
  updateRuns,
  getBalance,
  resultVerify,
  //getAC,
  getResults,
  updateWickets,
  noCutCalc,
  updateToss,
};

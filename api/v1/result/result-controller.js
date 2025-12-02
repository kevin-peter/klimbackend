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
    let pair_event_runners = 0;

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

        if (eventRunners[i].main_market_id == 9) {
          pair_event_runners = eventRunners[i].runner_count;
        }
      }
    }

    //console.log(pair_event_runners)
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
      pair_event_runners: pair_event_runners,
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

    //if (!req.body.score) throw new InputError("Inning Score Required");

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
    //let score = req.body.score ?? 0;

    const markets = await Event.getMarkets(req.body.event_id);

    //NO CUT Market calc***********
    let noCutId = "";
    let cutId = "";
    let noCutWId = "";
    let cutWId = "";
    let topBatterId = "";
    let topBowlerId = "";
    let oddEvenId = "";
    let firstKHADO = "";
    let totalScore = "";
    let pairEventId = "";

    let def_noCutId = 0;
    let def_cutId = 0;
    let def_noCutWId = 0;
    let def_cutWId = 0;
    let def_topBatterId = 0;
    let def_topBowlerId = 0;
    let def_oddEvenId = 0;
    let def_firstKHADO = 0;
    let def_totalScore = 0;
    let def_pairEventId = 0;

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
      if (markets[i].market_name == "PAIR_EVENT") {
        pairEventId = markets[i].id;
        def_pairEventId = markets[i].main_market_id;
      }

      if (markets[i].market_name == "1ST_INNING_KHADO") {
        firstKHADO = markets[i].id;
        def_firstKHADO = markets[i].main_market_id;
      }
      if (markets[i].market_name == "1ST_INNING_TOTAL_SCORE") {
        totalScore = markets[i].id;
        def_totalScore = markets[i].main_market_id;
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
          let runs_top = await topBatterCalc(
            req,
            team1,
            team2,
            def_topBatterId,
            topBatterId
          );
        }
        if (req.body.mType == "TOP_BOWLER") {
          let runs_top = await topBowlerCalc(
            req,
            team1,
            team2,
            def_topBowlerId,
            topBowlerId
          );
        }
        if (req.body.mType == "ODD_EVEN") {
          let runs_top = await oddEvenCalc(
            req,
            team1,
            team2,
            def_oddEvenId,
            oddEvenId
          );
        }
        if (req.body.mType == "PAIR_EVENT") {
          let runs_top = await pairEventCalc(
            req,
            team1,
            team2,
            def_pairEventId,
            pairEventId
          );
        }

        if (req.body.mType == "1ST_INNING_KHADO") {
          let runs_top = await inningScoreCalc(
            req,
            team1, //1st inning score
            team2, //2nd inning score
            def_firstKHADO,
            firstKHADO
          );
        }
        if (req.body.mType == "1ST_INNING_TOTAL_SCORE") {
          let runs_top = await inningScoreCalc(
            req,
            team1, //1st inning score
            team2, //2nd inning score
            def_totalScore,
            totalScore
          );
        }
      } else {
        
        //Revoked functions **********************
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

        if (req.body.mType == "PAIR_EVENT") {
          let runs_top = await pairEventCalcRevoke(
            req,
            team1,
            team2,
            def_pairEventId,
            pairEventId
          );
        }

        if (req.body.mType == "1ST_INNING_KHADO") {
          let runs_top = await inningScoreCalcRevoke(
            req,
            team1, //1st inning score
            team2, //2nd inning score
            def_firstKHADO,
            firstKHADO
          );
        }

        if (req.body.mType == "1ST_INNING_TOTAL_SCORE") {
          let runs_top = await inningScoreCalcRevoke(
            req,
            team1, //1st inning score
            team2, //2nd inning score
            def_totalScore,
            totalScore
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
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    //let resultRuns = runs;

    //user total runs selection******************
    for (const uid in noCutUserRunner) {
      let sum = 0;
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        // result[rId] = result[rId] || [];
        // result[rId].push(runs[rId]);
        result[uid] = result[uid] || [];
        result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          //exp += 120;
          exp = 200;
        }
      }

      userRuns[uid] = sum;
      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      let sum = 0;

      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "system", [rId]: runs[rId] });
      }

      systemRuns[uid] = sum;
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;
    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      if (userRuns[uid] > systemRuns[uid]) {
        //user win code **********************

        amount = Math.abs(userRuns[uid]) * userAmount;

        pl = amount;
        up_line = amount;
        type = "CR";
        remark =
          req.body.event_name +
          "/NO_CUT/RUN/WIN/ " +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;
        let up_down = 0;
        let direct_parent_id = 0;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc

          if (parents[k]["id"] != uid) {
            //get part % diff
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (-Math.abs(userRuns[uid]) * part) / 100;
            amount_p = amount_p * userAmount; //amount
            let pl_p = amount_p;

            //upline downline calc.............................................
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            // console.log(up_line_p, down_line_p, amount)
            // return
            let type_p = "DR";
            let remark_p =
              req.body.event_name +
              "/NO_CUT/RUN/LOSS/ " +
              systemRuns[uid] +
              " vs " +
              userRuns[uid] +
              "/" +
              userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win & user loss *************************
        amount = -Math.abs(systemRuns[uid]) * userAmount;
        up_line = amount;
        type = "DR";
        remark =
          req.body.event_name +
          "/NO_CUT/RUN/LOSS/ " +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (Math.abs(systemRuns[uid]) * part) / 100;
            amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "CR";
            let remark_p =
              req.body.event_name +
              "/NO_CUT/RUN/WIN/ " +
              systemRuns[uid] +
              " vs " +
              userRuns[uid] +
              "/" +
              userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      JSON.stringify(runs),
      JSON.stringify(team1),
      JSON.stringify(team2),
      "NO_CUT",
      "1",
      "RUN",
      "0",
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "NO_CUT";
    } else {
      // flag.push('CUT');
      flag = "NO_CUT";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      0,
    ]);

    // console.log(req.body);
    // console.log("call");
    // console.log(account_stat);

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

const noCutCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    //let resultRuns = runs;

    //user total runs selection******************
    for (const uid in noCutUserRunner) {
      let sum = 0;
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        // result[rId] = result[rId] || [];
        // result[rId].push(runs[rId]);
        result[uid] = result[uid] || [];
        result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          //exp += 120;
          exp = 200;
        }
      }

      userRuns[uid] = sum;
      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      let sum = 0;

      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "system", [rId]: runs[rId] });
      }

      systemRuns[uid] = sum;
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;
    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      if (userRuns[uid] > systemRuns[uid]) {
        //User WIN code **********************

        amount = -Math.abs(userRuns[uid]) * userAmount;

        pl = amount;
        up_line = amount;
        type = "DR";
        remark =
          req.body.event_name +
          "/NO_CUT/RUN/WIN/REVOKED " +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;
        let up_down = 0;
        let direct_parent_id = 0;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc

          if (parents[k]["id"] != uid) {
            //get part % diff
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (Math.abs(userRuns[uid]) * part) / 100;
            amount_p = amount_p * userAmount; //amount
            let pl_p = amount_p;

            //upline downline calc.............................................
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            // console.log(up_line_p, down_line_p, amount)
            // return
            let type_p = "CR";
            let remark_p =
              req.body.event_name +
              "/NO_CUT/RUN/LOSS/REVOKED " +
              systemRuns[uid] +
              " vs " +
              userRuns[uid] +
              "/" +
              userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win & user loss *************************
        amount = Math.abs(systemRuns[uid]) * userAmount;
        up_line = amount;
        type = "CR";
        remark =
          req.body.event_name +
          "/NO_CUT/RUN/LOSS/REVOKED " +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (-Math.abs(systemRuns[uid]) * part) / 100;
            amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "DR";
            let remark_p =
              req.body.event_name +
              "/NO_CUT/RUN/WIN/REVOKED " +
              systemRuns[uid] +
              " vs " +
              userRuns[uid] +
              "/" +
              userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, -Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      JSON.stringify(runs),
      JSON.stringify(team1),
      JSON.stringify(team2),
      "NO_CUT",
      "1",
      "RUN",
      1,
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "NO_CUT";
    } else {
      // flag.push('CUT');
      flag = "NO_CUT";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      1,
    ]);

    // console.log(req.body);
    // console.log("call");
    // console.log(account_stat);

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

const cutCalc = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    //let resultRuns = runs;

    //user total runs selection******************
    for (const uid in noCutUserRunner) {
      let sum = 0;
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          //exp += 120;
          exp = 200;
        }
      }

      userRuns[uid] = sum;
      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      let sum = 0;

      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "system", [rId]: runs[rId] });
      }

      systemRuns[uid] = sum;
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;
    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      if (userRuns[uid] > systemRuns[uid]) {
        //user win code*******************
        //amount = Math.abs(userRuns[uid]) * userAmount;
        let diff = Math.abs(userRuns[uid]) - Math.abs(systemRuns[uid]);
        amount = diff * userAmount;

        pl = amount;
        up_line = amount;
        type = "CR";
        remark =
          req.body.event_name +
          "/CUT/RUN/WIN/" +
          amount +
          "/" +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;

        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc
          if (parents[k]["id"] != uid) {
            //get part % diff

            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (-Math.abs(amount) * part) / 100;
            //amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calc
            //upline downline calc
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            let type_p = "DR";
            let remark_p =
              req.body.event_name + "/CUT/RUN/LOSS/" + amount_p + "/";
            systemRuns[uid] + " vs " + userRuns[uid] + "/" + userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win........................................

        let diff = Math.abs(systemRuns[uid]) - Math.abs(userRuns[uid]);
        amount = diff * userAmount;
        amount = -amount;
        up_line = amount;
        type = "DR";
        remark =
          req.body.event_name +
          "/CUT/RUN/LOSS/" +
          amount +
          "/" +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (Math.abs(amount) * part) / 100;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "CR";
            let remark_p =
              req.body.event_name +
              "/CUT/RUN/WIN/" +
              amount_p +
              "/" +
              systemRuns[uid] +
              " vs " +
              userRuns[uid] +
              "/" +
              userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      JSON.stringify(runs),
      JSON.stringify(team1),
      JSON.stringify(team2),
      "CUT",
      "2",
      "RUN",
      "0",
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "CUT";
    } else {
      flag = "CUT";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      1,
    ]);

    //console.log(resultData)
    let rowsRes = await Result.updateResult(resultData);
    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }
    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    // next(error);
    throw error;
  }
};

const cutCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    //let resultRuns = runs;

    //user total runs selection******************
    for (const uid in noCutUserRunner) {
      let sum = 0;
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          //exp += 120;
          exp = 200;
        }
      }

      userRuns[uid] = sum;
      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      let sum = 0;

      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "system", [rId]: runs[rId] });
      }

      systemRuns[uid] = sum;
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;
    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      if (userRuns[uid] > systemRuns[uid]) {
        //user win code*******************
        //amount = Math.abs(userRuns[uid]) * userAmount;
        let diff = Math.abs(userRuns[uid]) - Math.abs(systemRuns[uid]);
        amount = diff * userAmount;
        amount = -amount;
        pl = amount;
        up_line = amount;
        type = "DR";
        remark =
          req.body.event_name +
          "/CUT/RUN/REVOKED/" +
          amount +
          "/" +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;

        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc
          if (parents[k]["id"] != uid) {
            //get part % diff

            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (Math.abs(amount) * part) / 100;
            //amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calc
            //upline downline calc
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            let type_p = "CR";
            let remark_p =
              req.body.event_name + "/CUT/RUN/LOSS/REVOKED/" + amount_p + "/";
            systemRuns[uid] + " vs " + userRuns[uid] + "/" + userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win........................................

        let diff = Math.abs(systemRuns[uid]) - Math.abs(userRuns[uid]);
        amount = diff * userAmount;
        amount = amount;
        up_line = amount;
        type = "CR";
        remark =
          req.body.event_name +
          "/CUT/RUN/LOSS/REVOKED/" +
          amount +
          "/" +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (-Math.abs(amount) * part) / 100;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "DR";
            let remark_p =
              req.body.event_name +
              "/CUT/RUN/WIN/REVOKED/" +
              amount_p +
              "/" +
              systemRuns[uid] +
              " vs " +
              userRuns[uid] +
              "/" +
              userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, -Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      JSON.stringify(runs),
      JSON.stringify(team1),
      JSON.stringify(team2),
      "CUT",
      "2",
      "RUN",
      1,
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "CUT";
    } else {
      flag = "CUT";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      1,
    ]);

    //console.log(resultData)
    let rowsRes = await Result.updateResult(resultData);
    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }
    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    // next(error);
    throw error;
  }
};

/*
 *
 * TOP_BATTER & TOP_BOWLER Calculations
 *
 */
const topBatterCalc = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    //let resultRuns = runs;

    //user total runs selection******************
    for (const uid in noCutUserRunner) {
      let sum = 0;
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        // result[rId] = result[rId] || [];
        // result[rId].push(runs[rId]);
        result[uid] = result[uid] || [];
        result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          //exp += 120;
          exp = 200;
        }
      }

      userRuns[uid] = sum;
      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      let sum = 0;

      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "system", [rId]: runs[rId] });
      }

      systemRuns[uid] = sum;
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;

    //let max_val = '';

    //Top Batter
    let max_val = Object.entries(userRuns).reduce(
      (prev, [key, value]) => {
        return parseInt(prev[1]) > parseInt(value) ? prev : [key, value];
      },
      ["", 0]
    ); // Initialize with empty string and 0 as a default

    // If the value of max_val is non-zero, just extract the value
    if (max_val[1] > 0) {
      max_val = max_val[1]; // This is the final maximum value
    }

    console.log(max_val);

    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      //console.log(userRuns[uid], 'ttest')

      if (userRuns[uid] == max_val) {
        //user win code **********************

        amount = Math.abs(userAmount);

        pl = amount;
        up_line = amount;
        type = "CR";
        remark =
          req.body.event_name +
          "/TOP_BATTER/WIN/R/" +
          userRuns[uid] +
          "/Amt/" +
          userAmount;

        let up_down = 0;
        let direct_parent_id = 0;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc

          if (parents[k]["id"] != uid) {
            //get part % diff
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (-Math.abs(userAmount) * part) / 100;
            //amount_p = amount_p * userAmount; //amount
            let pl_p = amount_p;

            //upline downline calc.............................................
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            // console.log(up_line_p, down_line_p, amount)
            // return
            let type_p = "DR";
            let remark_p =
              req.body.event_name +
              "/TOP_BATTER/LOSS/R/" +
              userRuns[uid] +
              "/Amt/" +
              userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win & user loss *************************

        amount = -Math.abs(userAmount);
        up_line = amount;
        type = "DR";
        remark =
          req.body.event_name +
          "/TOP_BATTER/LOSS/R/" +
          userRuns[uid] +
          "/Amt/" +
          userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (Math.abs(userAmount) * part) / 100;
            //amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "CR";
            let remark_p =
              req.body.event_name +
              "/TOP_BATTER/WIN/R/" +
              userRuns[uid] +
              "/Amt/" +
              userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      JSON.stringify(runs),
      JSON.stringify(team1),
      JSON.stringify(team2),
      "TOP_BATTER",
      "8",
      "RUN",
      "0",
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "TOP_BATTER";
    } else {
      // flag.push('CUT');
      flag = "TOP_BATTER";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      0,
    ]);

    // console.log(req.body);
    // console.log("call");
    // console.log(account_stat);

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

const topBatterCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    //let resultRuns = runs;

    //user total runs selection******************
    for (const uid in noCutUserRunner) {
      let sum = 0;
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        // result[rId] = result[rId] || [];
        // result[rId].push(runs[rId]);
        result[uid] = result[uid] || [];
        result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          //exp += 120;
          exp = 200;
        }
      }

      userRuns[uid] = sum;
      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      let sum = 0;

      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "system", [rId]: runs[rId] });
      }

      systemRuns[uid] = sum;
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;

    //let max_val = '';

    //Top Batter
    let max_val = Object.entries(userRuns).reduce(
      (prev, [key, value]) => {
        return parseInt(prev[1]) > parseInt(value) ? prev : [key, value];
      },
      ["", 0]
    ); // Initialize with empty string and 0 as a default

    // If the value of max_val is non-zero, just extract the value
    if (max_val[1] > 0) {
      max_val = max_val[1]; // This is the final maximum value
    }

    //console.log(max_val)

    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      //console.log(userRuns[uid], 'ttest')

      if (userRuns[uid] == max_val) {
        //user win code **********************

        amount = -Math.abs(userAmount);

        pl = amount;
        up_line = amount;
        type = "DR";
        remark =
          req.body.event_name +
          "/TOP_BATTER/WIN/REVOKED/R/" +
          userRuns[uid] +
          "/Amt/" +
          userAmount;

        let up_down = 0;
        let direct_parent_id = 0;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc

          if (parents[k]["id"] != uid) {
            //get part % diff
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (Math.abs(userAmount) * part) / 100;
            //amount_p = amount_p * userAmount; //amount
            let pl_p = amount_p;

            //upline downline calc.............................................
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            // console.log(up_line_p, down_line_p, amount)
            // return
            let type_p = "CR";
            let remark_p =
              req.body.event_name +
              "/TOP_BATTER/LOSS/REVOKED/R/" +
              userRuns[uid] +
              "/Amt/" +
              userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win & user loss *************************

        amount = Math.abs(userAmount);
        up_line = amount;
        type = "CR";
        remark =
          req.body.event_name +
          "/TOP_BATTER/LOSS/REVOKED/R/" +
          userRuns[uid] +
          "/Amt/" +
          userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (-Math.abs(userAmount) * part) / 100;
            //amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "CR";
            let remark_p =
              req.body.event_name +
              "/TOP_BATTER/WIN/REVOKED/R/" +
              userRuns[uid] +
              "/Amt/" +
              userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      JSON.stringify(runs),
      JSON.stringify(team1),
      JSON.stringify(team2),
      "TOP_BATTER",
      "8",
      "RUN",
      "1",
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "TOP_BATTER";
    } else {
      // flag.push('CUT');
      flag = "TOP_BATTER";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      0,
    ]);

    // console.log(req.body);
    // console.log("call");
    // console.log(account_stat);

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

const topBowlerCalc = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    //let resultRuns = runs;

    //user total runs selection******************
    for (const uid in noCutUserRunner) {
      let sum = 0;
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        // result[rId] = result[rId] || [];
        // result[rId].push(runs[rId]);
        result[uid] = result[uid] || [];
        result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          //exp += 120;
          exp = 200;
        }
      }

      userRuns[uid] = sum;
      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      let sum = 0;

      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "system", [rId]: runs[rId] });
      }

      systemRuns[uid] = sum;
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;

    //let max_val = '';

    //Top Batter
    let max_val = Object.entries(userRuns).reduce(
      (prev, [key, value]) => {
        return parseInt(prev[1]) > parseInt(value) ? prev : [key, value];
      },
      ["", 0]
    ); // Initialize with empty string and 0 as a default

    // If the value of max_val is non-zero, just extract the value
    if (max_val[1] > 0) {
      max_val = max_val[1]; // This is the final maximum value
    }

    // console.log(userRuns)
    // console.log(max_val)

    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      //console.log(userRuns[uid], 'ttest')

      if (userRuns[uid] == max_val) {
        //user win code **********************

        amount = Math.abs(userAmount);

        pl = amount;
        up_line = amount;
        type = "CR";
        remark =
          req.body.event_name +
          "/TOP_BOWLER/WIN/R/" +
          userRuns[uid] +
          "/Amt/" +
          userAmount;

        let up_down = 0;
        let direct_parent_id = 0;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc

          if (parents[k]["id"] != uid) {
            //get part % diff
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (-Math.abs(userAmount) * part) / 100;
            //amount_p = amount_p * userAmount; //amount
            let pl_p = amount_p;

            //upline downline calc.............................................
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            // console.log(up_line_p, down_line_p, amount)
            // return
            let type_p = "DR";
            let remark_p =
              req.body.event_name +
              "/TOP_BOWLER/LOSS/R/" +
              userRuns[uid] +
              "/Amt/" +
              userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win & user loss *************************

        amount = -Math.abs(userAmount);
        up_line = amount;
        type = "DR";
        remark =
          req.body.event_name +
          "/TOP_BOWLER/LOSS/R/" +
          userRuns[uid] +
          "/Amt/" +
          userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (Math.abs(userAmount) * part) / 100;
            //amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "CR";
            let remark_p =
              req.body.event_name +
              "/TOP_BOWLER/WIN/R/" +
              userRuns[uid] +
              "/Amt/" +
              userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      JSON.stringify(runs),
      JSON.stringify(team1),
      JSON.stringify(team2),
      "TOP_BOWLER",
      "10",
      "RUN",
      "0",
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "TOP_BOWLER";
    } else {
      // flag.push('CUT');
      flag = "TOP_BOWLER";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      0,
    ]);

    // console.log(req.body);
    // console.log("call");
    // console.log(account_stat);

    let rowsRes = await Result.updateResult(resultData);

    //flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

const topBowlerCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    //let resultRuns = runs;

    //user total runs selection******************
    for (const uid in noCutUserRunner) {
      let sum = 0;
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        // result[rId] = result[rId] || [];
        // result[rId].push(runs[rId]);
        result[uid] = result[uid] || [];
        result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          //exp += 120;
          exp = 200;
        }
      }

      userRuns[uid] = sum;
      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      let sum = 0;

      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "system", [rId]: runs[rId] });
      }

      systemRuns[uid] = sum;
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;

    //let max_val = '';

    //Top Batter
    let max_val = Object.entries(userRuns).reduce(
      (prev, [key, value]) => {
        return parseInt(prev[1]) > parseInt(value) ? prev : [key, value];
      },
      ["", 0]
    ); // Initialize with empty string and 0 as a default

    // If the value of max_val is non-zero, just extract the value
    if (max_val[1] > 0) {
      max_val = max_val[1]; // This is the final maximum value
    }

    //console.log(max_val)

    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      //console.log(userRuns[uid], 'ttest')

      if (userRuns[uid] == max_val) {
        //user win code **********************

        amount = -Math.abs(userAmount);

        pl = amount;
        up_line = amount;
        type = "DR";
        remark =
          req.body.event_name +
          "/TOP_BOWLER/WIN/REVOKED/R/" +
          userRuns[uid] +
          "/Amt/" +
          userAmount;

        let up_down = 0;
        let direct_parent_id = 0;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc

          if (parents[k]["id"] != uid) {
            //get part % diff
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (Math.abs(userAmount) * part) / 100;
            //amount_p = amount_p * userAmount; //amount
            let pl_p = amount_p;

            //upline downline calc.............................................
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            // console.log(up_line_p, down_line_p, amount)
            // return
            let type_p = "CR";
            let remark_p =
              req.body.event_name +
              "/TOP_BOWLER/LOSS/REVOKED/R/" +
              userRuns[uid] +
              "/Amt/" +
              userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win & user loss *************************

        amount = Math.abs(userAmount);
        up_line = amount;
        type = "CR";
        remark =
          req.body.event_name +
          "/TOP_BOWLER/LOSS/REVOKED/R/" +
          userRuns[uid] +
          "/Amt/" +
          userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (-Math.abs(userAmount) * part) / 100;
            //amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "CR";
            let remark_p =
              req.body.event_name +
              "/TOP_BOWLER/WIN/REVOKED/R/" +
              userRuns[uid] +
              "/Amt/" +
              userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      JSON.stringify(runs),
      JSON.stringify(team1),
      JSON.stringify(team2),
      "TOP_BOWLER",
      "10",
      "RUN",
      "1",
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "TOP_BOWLER";
    } else {
      // flag.push('CUT');
      flag = "TOP_BOWLER";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      0,
    ]);

    // console.log(req.body);
    // console.log("call");
    // console.log(account_stat);

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

/*
 *
 * ODD-EVEN Calculations
 *
 */

const oddEvenCalc = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};
    let odd_even_type = {};
    let uids = [];

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //rIds.push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
        //Odd-even type
        if (!odd_even_type[noCutUsers[i].user_id]) {
          odd_even_type[noCutUsers[i].user_id] = [];
        }
        odd_even_type[noCutUsers[i].user_id].push({
          runnerId: noCutUsers[i].runnerId,
          user_id: noCutUsers[i].user_id,
          odd_even: noCutUsers[i].odd_even,
          runner_name: noCutUsers[i].runner_name,
          runs: null,
        });

        uids.push(noCutUsers[i].user_id);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let result = {};
    let userExp = {};
    let userAmt = {};
    let rIds = [];
    //let odd_even_runs = [];
    //let resultRuns = runs;

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let resultData = [];
    let part_chain = [];
    let old_bal = [];

    uids = uids.filter(function (item, i, ar) {
      return ar.indexOf(item) === i;
    });

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    //user total runs selection******************
    //user win loss calc *************
    let n = 0;
    for (const uid in noCutUserRunner) {
      let sum = 0;
      let exp = 0;

      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        //set values
        let amount = 0;
        let pl = 0;
        let up_line = 0;
        let down_line = 0;
        let type = "";
        let remark = "";
        let userAmount = noCutUserAmount[uid][0];
        let userExpo = noCutUserExp[uid][0];
        let parents = JSON.parse(part_chain[n]["chain"]);

        //console.log(parents)
        const rId = noCutUserRunner[uid][i];

        //count win/loss user with system
        for (let n = 0; n < odd_even_type[uid].length; n++) {
          let runner_name = odd_even_type[uid][n]["runner_name"];
          let odd_even = odd_even_type[uid][n]["odd_even"];

          if (odd_even_type[uid][n]["runnerId"] == rId) {
            //console.log(odd_even_type[uid][n]['runnerId'], '==', odd_even_type[uid][n]['odd_even'])

            if (odd_even == "odd") {
              //ODD TYPE USER
              if (runs[rId] % 2 == 0) {
                //console.log("odd == loss");

                //system win & user loss *************************
                amount = -Math.abs(userAmount);
                up_line = amount;
                type = "DR";
                remark =
                  req.body.event_name +
                  "/ODD_EVEN/" +
                  runner_name +
                  "/" +
                  odd_even +
                  "/LOSS/ " +
                  runs[rId] +
                  "/" +
                  userAmount;
                let up_down = 0;

                //for loop parents
                for (let k = 0; k < parents.length; k++) {
                  if (parents[k]["id"] != uid) {
                    let part =
                      k === 1
                        ? parents[k]["part"]
                        : parents[k]["part"] - parents[k - 1]["part"];

                    // console.log("odd => loss" + part);
                    let amount_p = Math.abs(part) / 100;
                    amount_p = amount_p * userAmount;
                    let pl_p = amount_p;

                    //upline downline calculation..............................
                    let up_line_p = (parents[k].up_line * amount) / 100;
                    let down_line_p = (parents[k].down_line * amount) / 100;

                    let type_p = "CR";
                    let remark_p =
                      req.body.event_name +
                      "/ODD_EVEN/" +
                      runner_name +
                      "/" +
                      odd_even +
                      "/WIN/ " +
                      runs[rId] +
                      "/" +
                      userAmount;

                    parentsBalW.push([
                      parents[k]["id"],
                      pl_p,
                      up_line_p,
                      down_line_p,
                    ]);

                    //exp deduction ***************
                    let ex = (Math.abs(userExpo) * part) / 100;
                    expArr.push([parents[k]["id"], ex]);

                    //get balance
                    let old_bal_p = await Result.getBalance(parents[k]["id"]);

                    account_stat.push([
                      parents[k]["id"],
                      amount_p,
                      part,
                      up_line_p,
                      down_line_p,
                      type_p,
                      parents[k]["id"],
                      parents[k]["id"],
                      old_bal_p[0].amount,
                      old_bal_p[0].amount + amount_p,
                      noCutId,
                      def_noCutId,
                      req.body.event_id,
                      remark_p,
                      0,
                      1,
                    ]);
                  } //if
                } //for
              } else {
                //console.log("user odd === win");

                //user win code **********************
                amount = userAmount;
                pl = amount;
                up_line = amount;
                type = "CR";
                remark =
                  req.body.event_name +
                  "/ODD_EVEN/" +
                  runner_name +
                  "/" +
                  odd_even +
                  "/WIN/ " +
                  runs[rId] +
                  "/" +
                  userAmount;
                let up_down = 0;
                let direct_parent_id = 0;

                //for loop
                for (let k = 0; k < parents.length; k++) {
                  //parents calc

                  if (parents[k]["id"] != uid) {
                    //get part % diff
                    let part =
                      k === 1
                        ? parents[k]["part"]
                        : parents[k]["part"] - parents[k - 1]["part"];

                    //  console.log("odd => win" + part);

                    let amount_p = (-Math.abs(userAmount) * part) / 100;
                    //amount_p = amount_p * userAmount; //amount
                    let pl_p = amount_p;

                    //upline downline calc.............................................
                    let up_line_p = (parents[k].up_line * -amount) / 100;
                    let down_line_p = (parents[k].down_line * -amount) / 100;

                    // console.log(up_line_p, down_line_p, amount)
                    // return
                    let type_p = "DR";
                    let remark_p =
                      req.body.event_name +
                      "/ODD_EVEN/" +
                      runner_name +
                      "/" +
                      odd_even +
                      "/LOSS/ " +
                      runs[rId] +
                      "/" +
                      userAmount;

                    parentsBalL.push([
                      parents[k]["id"],
                      pl_p,
                      up_line_p,
                      down_line_p,
                    ]);

                    //exp deduction ********************
                    let ex = (Math.abs(userExpo) * part) / 100;
                    expArr.push([parents[k]["id"], ex]);
                    //get balance
                    let old_bal_p = await Result.getBalance(parents[k]["id"]);
                    account_stat.push([
                      parents[k]["id"],
                      amount_p,
                      part,
                      up_line_p,
                      down_line_p,
                      type_p,
                      parents[k]["id"],
                      parents[k]["id"],
                      old_bal_p[0].amount,
                      old_bal_p[0].amount + amount_p,
                      noCutId,
                      def_noCutId,
                      req.body.event_id,
                      remark_p,
                      0,
                      1,
                    ]);
                  } //if
                } //for
              }
            } else {
              //EVEN TYPE USER
              if (runs[rId] % 2 == 0) {
                //console.log("even === win");

                //user win code **********************
                amount = userAmount;
                pl = amount;
                up_line = amount;
                type = "CR";
                remark =
                  req.body.event_name +
                  "/ODD_EVEN/" +
                  runner_name +
                  "/" +
                  odd_even +
                  "/WIN/ " +
                  runs[rId] +
                  "/" +
                  userAmount;
                let up_down = 0;
                let direct_parent_id = 0;

                //for loop parents
                for (let k = 0; k < parents.length; k++) {
                  if (parents[k]["id"] != uid) {
                    //console.log("Even => W" + parents[k]["id"] + '---'+ uid);

                    let part =
                      k === 1
                        ? parents[k]["part"]
                        : parents[k]["part"] - parents[k - 1]["part"];

                    //console.log("even => win" + part);

                    let amount_p = (-Math.abs(userAmount) * part) / 100;
                    //amount_p = amount_p * userAmount;
                    let pl_p = amount_p;

                    //upline downline calculation..............................
                    let up_line_p = (parents[k].up_line * amount) / 100;
                    let down_line_p = (parents[k].down_line * amount) / 100;

                    let type_p = "DR";
                    let remark_p =
                      req.body.event_name +
                      "/ODD_EVEN/" +
                      runner_name +
                      "/" +
                      odd_even +
                      "/WIN/ " +
                      runs[rId] +
                      "/" +
                      userAmount;

                    parentsBalW.push([
                      parents[k]["id"],
                      pl_p,
                      up_line_p,
                      down_line_p,
                    ]);

                    //exp deduction ***************
                    let ex = (Math.abs(userExpo) * part) / 100;
                    expArr.push([parents[k]["id"], ex]);

                    //get balance
                    let old_bal_p = await Result.getBalance(parents[k]["id"]);

                    account_stat.push([
                      parents[k]["id"],
                      amount_p,
                      part,
                      up_line_p,
                      down_line_p,
                      type_p,
                      parents[k]["id"],
                      parents[k]["id"],
                      old_bal_p[0].amount,
                      old_bal_p[0].amount + amount_p,
                      noCutId,
                      def_noCutId,
                      req.body.event_id,
                      remark_p,
                      0,
                      1,
                    ]);
                  } //if
                } //for
              } else {
                //console.log("even === loss");

                //system win & user loss *************************
                amount = -Math.abs(userAmount);
                up_line = amount;
                type = "DR";
                remark =
                  req.body.event_name +
                  "/ODD_EVEN/" +
                  runner_name +
                  "/" +
                  odd_even +
                  "/LOSS/ " +
                  runs[rId] +
                  "/" +
                  userAmount;
                let up_down = 0;
                //for loop
                for (let k = 0; k < parents.length; k++) {
                  if (parents[k]["id"] != uid) {
                    let part =
                      k === 1
                        ? parents[k]["part"]
                        : parents[k]["part"] - parents[k - 1]["part"];

                    //console.log("even => loss" + part);
                    let amount_p = (Math.abs(userAmount) * part) / 100;
                    //amount_p = amount_p * userAmount;
                    let pl_p = amount_p;

                    //upline downline calculation..............................
                    let up_line_p = (parents[k].up_line * amount) / 100;
                    let down_line_p = (parents[k].down_line * amount) / 100;

                    let type_p = "CR";
                    let remark_p =
                      req.body.event_name +
                      "/ODD_EVEN/" +
                      runner_name +
                      "/" +
                      odd_even +
                      "/WIN/ " +
                      runs[rId] +
                      "/" +
                      userAmount;

                    parentsBalW.push([
                      parents[k]["id"],
                      pl_p,
                      up_line_p,
                      down_line_p,
                    ]);

                    //exp deduction ***************
                    let ex = (Math.abs(userExpo) * part) / 100;
                    expArr.push([parents[k]["id"], ex]);

                    //get balance
                    let old_bal_p = await Result.getBalance(parents[k]["id"]);

                    account_stat.push([
                      parents[k]["id"],
                      amount_p,
                      part,
                      up_line_p,
                      down_line_p,
                      type_p,
                      parents[k]["id"],
                      parents[k]["id"],
                      old_bal_p[0].amount,
                      old_bal_p[0].amount + amount_p,
                      noCutId,
                      def_noCutId,
                      req.body.event_id,
                      remark_p,
                      0,
                      1,
                    ]);
                  } //if
                } //for
              }
            }

            odd_even_type[uid][n]["runs"] = parseInt(runs[rId] || null);
          }
        } //for count win/loss user with system

        rIds.push(rId);
        result[uid] = result[uid] || [];
        result[uid].push({ type: "user", [rId]: runs[rId] });

        bal.push([uid, amount, up_line, down_line]);
        expArr.push([uid, Math.abs(userExpo)]);
        account_stat.push([
          uid,
          amount,
          -100,
          up_line,
          down_line,
          type,
          uid,
          uid,
          old_bal[i].amount,
          old_bal[i].amount + amount,
          noCutId,
          def_noCutId,
          req.body.event_id,
          remark,
          0,
          0,
        ]);
      } //for

      n++;
    } //noCutUserRunner

    // console.log('call kkk')
    // return

    result = JSON.stringify(result);

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      JSON.stringify(runs),
      JSON.stringify(team1),
      JSON.stringify(team2),
      "ODD_EVEN",
      "3",
      "RUN",
      "0",
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "ODD_EVEN";
    } else {
      // flag.push('CUT');
      flag = "ODD_EVEN";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      0,
    ]);

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

const oddEvenCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    //let resultRuns = runs;

    //user total runs selection******************
    for (const uid in noCutUserRunner) {
      let sum = 0;
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        // result[rId] = result[rId] || [];
        // result[rId].push(runs[rId]);
        result[uid] = result[uid] || [];
        result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          //exp += 120;
          exp = 200;
        }
      }

      userRuns[uid] = sum;
      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      let sum = 0;

      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "system", [rId]: runs[rId] });
      }

      systemRuns[uid] = sum;
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;
    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      if (userRuns[uid] > systemRuns[uid]) {
        //User WIN code **********************

        amount = -Math.abs(userRuns[uid]) * userAmount;

        pl = amount;
        up_line = amount;
        type = "DR";
        remark =
          req.body.event_name +
          "/ODD_EVEN/RUN/WIN/REVOKED " +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;
        let up_down = 0;
        let direct_parent_id = 0;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc

          if (parents[k]["id"] != uid) {
            //get part % diff
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (Math.abs(userRuns[uid]) * part) / 100;
            amount_p = amount_p * userAmount; //amount
            let pl_p = amount_p;

            //upline downline calc.............................................
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            // console.log(up_line_p, down_line_p, amount)
            // return
            let type_p = "CR";
            let remark_p =
              req.body.event_name +
              "/ODD_EVEN/RUN/LOSS/REVOKED " +
              systemRuns[uid] +
              " vs " +
              userRuns[uid] +
              "/" +
              userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win & user loss *************************
        amount = Math.abs(systemRuns[uid]) * userAmount;
        up_line = amount;
        type = "CR";
        remark =
          req.body.event_name +
          "/ODD_EVEN/RUN/LOSS/REVOKED " +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (-Math.abs(systemRuns[uid]) * part) / 100;
            amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "DR";
            let remark_p =
              req.body.event_name +
              "/ODD_EVEN/RUN/WIN/REVOKED " +
              systemRuns[uid] +
              " vs " +
              userRuns[uid] +
              "/" +
              userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, -Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      JSON.stringify(runs),
      JSON.stringify(team1),
      JSON.stringify(team2),
      "ODD_EVEN",
      "3",
      "RUN",
      1,
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "ODD_EVEN";
    } else {
      // flag.push('CUT');
      flag = "ODD_EVEN";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      1,
    ]);

    // console.log(req.body);
    // console.log("call");
    // console.log(account_stat);

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

/*
 *
 * Inning Score Calculations (1st Inning Khado & 1st Inning Total Score)
 *
 */

const inningScoreCalc = async (req, t1, t2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};
    let user_score = {};

    const mkMap = {
      4: "1ST_INNING_KHADO",
      5: "1ST_INNING_TOTAL_SCORE",
    };
    const mk = mkMap[def_noCutId] || false;

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);

        //user Score
        if (!user_score[noCutUsers[i].user_id]) {
          user_score[noCutUsers[i].user_id] = [];
        }
        user_score[noCutUsers[i].user_id].push(noCutUsers[i].run_digit);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    //const runs = { ...t1 };
    let userRuns = {};
    let uids = [];
    let userExp = {};
    let userAmt = {};
    let score = 0;
    //let resultRuns = runs;

    //user total runs selections******************
    for (const uid in noCutUserRunner) {
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        userRuns[uid] = rId;
        rid = rId;
        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          exp = 200;
        }
      }

      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    // for (const uid in noCutSystemRunner) {
    //   for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
    //     const rId = noCutSystemRunner[uid][i];
    //     systemRuns[uid] = rId;
    //   }
    // }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;

    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      let runs = t1[userRuns[uid]]; //SYSTEM RESULT RUNS
      let user_runs = user_score[uid]; //USER Bet RUNS
      score = runs;

      //total score use last digit
      let lastDigit = Math.abs(Math.floor(runs)) % 10; //get lastdigit
      let mkCond = {
        4: runs > user_runs - 30 && runs <= user_runs,
        5: user_runs == lastDigit,
      };
      let cond = mkCond[def_noCutId] ?? false;

      //console.log(cond)
      if (cond) {
        //user win code **********************

        // amount = Math.abs(userRuns[uid]) * userAmount;
        amount = userAmount;

        pl = amount;
        up_line = amount;
        type = "CR";
        remark = req.body.event_name + "/" + mk + "/WIN/" + userAmount;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc

          if (parents[k]["id"] != uid) {
            //get part % diff
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            //let amount_p = (-Math.abs(userRuns[uid]) * part) / 100;
            let amount_p = -part / 100;
            amount_p = amount_p * userAmount; //amount
            let pl_p = amount_p;

            //upline downline calc.............................................
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            // console.log(up_line_p, down_line_p, amount)
            // return
            let type_p = "DR";
            let remark_p =
              req.body.event_name + "/" + mk + "/LOSS/" + userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //console.log('loss', user_score[uid])
        //system win & user loss *************************
        //amount = -Math.abs(systemRuns[uid]) * userAmount;
        amount = -userAmount;
        up_line = amount;
        type = "DR";
        remark = req.body.event_name + "/" + mk + "/LOSS/" + userAmount;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            // let amount_p = (Math.abs(systemRuns[uid]) * part) / 100;
            let amount_p = part / 100;
            amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "CR";
            let remark_p =
              req.body.event_name + "/" + mk + "/WIN/" + userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    // result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      score,
      JSON.stringify(t1),
      JSON.stringify(t2),
      mk,
      def_noCutId,
      "RUN",
      0,
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + mk;
    } else {
      // flag.push('CUT');
      flag = mk;
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      1,
    ]);

    // console.log(req.body.event_id);
    // console.log(def_noCutId)
    // console.log(expArr)

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

const inningScoreCalcRevoke = async (req, t1, t2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};
    let user_score = {};

    const mkMap = {
      4: "1ST_INNING_KHADO",
      5: "1ST_INNING_TOTAL_SCORE",
    };
    const mk = mkMap[def_noCutId] || false;

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);

        //user Score
        if (!user_score[noCutUsers[i].user_id]) {
          user_score[noCutUsers[i].user_id] = [];
        }
        user_score[noCutUsers[i].user_id].push(noCutUsers[i].run_digit);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    //const runs = { ...t1 };
    let userRuns = {};
    let uids = [];
    let userExp = {};
    let userAmt = {};
    let score = 0;
    //let resultRuns = runs;

    //user total runs selections******************
    for (const uid in noCutUserRunner) {
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        userRuns[uid] = rId;
        //rid = rId;
        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          exp = 200;
        }
      }

      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    // for (const uid in noCutSystemRunner) {
    //   for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
    //     const rId = noCutSystemRunner[uid][i];
    //     systemRuns[uid] = rId;
    //   }
    // }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;
    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      //console.log(userAmt[uid])

      let runs = t1[userRuns[uid]]; //SYSTEM RESULT RUNS
      let user_runs = user_score[uid]; //USER GIVEN RUNS
      score = runs;

      //total score use last digit & conditions change code
      let lastDigit = Math.abs(Math.floor(runs)) % 10; //get lastdigit
      let mkCond = {
        4: runs > user_runs - 30 && runs <= user_runs,
        5: user_runs == lastDigit,
      };
      let cond = mkCond[def_noCutId] ?? false;

      //apply conditions
      if (cond) {
        amount = -userAmount;

        pl = amount;
        up_line = amount;
        type = "DR";
        remark = req.body.event_name + "/" + mk + "/WIN/REVOKED/" + userAmount;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc

          if (parents[k]["id"] != uid) {
            //get part % diff
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            //let amount_p = (-Math.abs(userRuns[uid]) * part) / 100;
            let amount_p = part / 100;
            amount_p = amount_p * userAmount; //amount
            let pl_p = amount_p;

            //upline downline calc.............................................
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            // console.log(up_line_p, down_line_p, amount)
            // return
            let type_p = "CR";
            let remark_p =
              req.body.event_name + "/" + mk + "/LOSS/REVOKED/" + userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win & user loss *************************
        //amount = -Math.abs(systemRuns[uid]) * userAmount;
        amount = userAmount;
        up_line = amount;
        type = "CR";
        remark = req.body.event_name + "/" + mk + "/LOSS/REVOKED/" + userAmount;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            // let amount_p = (Math.abs(systemRuns[uid]) * part) / 100;
            let amount_p = -part / 100;
            amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "DR";
            let remark_p =
              req.body.event_name + "/" + mk + "/WIN/REVOKED/" + userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    // result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      score,
      JSON.stringify(t1),
      JSON.stringify(t2),
      mk,
      def_noCutId,
      "RUN",
      1,
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + mk;
    } else {
      // flag.push('CUT');
      flag = mk;
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      1,
    ]);

    // console.log(req.body.event_id);
    // console.log(def_noCutId)
    // console.log(expArr)

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

/*
 *
 * PAIR EVENT Calculations
 *
 */

const pairEventCalc = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};
    let user_pairs_1 = {};
    let user_pairs_2 = {};
    let pair_teams = {};
    let pair_t = {};
    let mk = "PAIR_EVENT";
    // const mkMap = {
    //   4: '1ST_INNING_KHADO',
    //   5: '1ST_INNING_TOTAL_SCORE'
    // };
    // const mk = mkMap[def_noCutId] || false;

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);

        //user PAIR Team-1 ****************************
        //all runnerId with pair
        if (!pair_teams[noCutUsers[i].runnerId]) {
          pair_teams[noCutUsers[i].runnerId] = [];
        }
        if (!pair_teams[noCutUsers[i].runnerId].includes(noCutUsers[i].runner_name)) {
          pair_teams[noCutUsers[i].runnerId].push(noCutUsers[i].runner_name);
        }
        //team sequence
        if (!pair_t[noCutUsers[i].runnerId]) {
          pair_t[noCutUsers[i].runnerId] = [];
        }
        if (!pair_t[noCutUsers[i].runnerId].includes(noCutUsers[i].team)) {
          pair_t[noCutUsers[i].runnerId].push(noCutUsers[i].team);
        }
        

        //user PAIR Team-1 ****************************
        if(noCutUsers[i].team == 1) {
          if (!user_pairs_1[noCutUsers[i].runnerId]) {
            user_pairs_1[noCutUsers[i].runnerId] = [];
          }
          if (!user_pairs_1[noCutUsers[i].runnerId].includes(noCutUsers[i].runner_name)) {
            user_pairs_1[noCutUsers[i].runnerId].push(noCutUsers[i].runner_name);
          }
        }
        //user PAIR Team-2 ****************************
        if(noCutUsers[i].team == 2) {
          if (!user_pairs_2[noCutUsers[i].runnerId]) {
            user_pairs_2[noCutUsers[i].runnerId] = [];
          }
          if (!user_pairs_2[noCutUsers[i].runnerId].includes(noCutUsers[i].runner_name)) {
            user_pairs_2[noCutUsers[i].runnerId].push(noCutUsers[i].runner_name);
          }
        }


      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    //const runs = { ...t1 };
    let userRuns = {};
    let uids = [];
    let userExp = {};
    let userAmt = {};
    let score = 0;
    
    //let resultRuns = runs;

    //user total runs selections******************
    for (const uid in noCutUserRunner) {
      let exp = 0;
      userRuns[uid] = [];
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];

        userRuns[uid].push(rId);

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          exp = 200;
        }
      }

      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    // for (const uid in noCutSystemRunner) {
    //   for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
    //     const rId = noCutSystemRunner[uid][i];
    //     systemRuns[uid] = rId;
    //   }
    // }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    
    /*  Team topper from both end *****/
    let sum_pair_1 = {};
    let sum_pair_2 = {};

    // Team-1 Loop through each user_pair entry & sum of runs according to pair
    for (const key in user_pairs_1) {
      const pairStr_1 = user_pairs_1[key][0]; // e.g., "1-2"
      const pair_runner_1 = pairStr_1.split("-"); // ['1', '2']

      let sum = 0;

      for (const runner of pair_runner_1) {
        const index = parseInt(runner, 10) - 1; // Convert to 0-based index
        const score = parseInt(team1[index]) || 0; // Safely handle missing index
        sum += score;
      }

      sum_pair_1[key] = sum; // Save total sum per key
      //console.log(`Pair ${pairStr} (key: ${key}) total:`, sum);
    }

    // Team-2 Loop through each user_pair entry & sum of runs according to pair
    for (const key in user_pairs_2) {
      const pairStr_2 = user_pairs_2[key][0]; // e.g., "1-2"
      const pair_runner_2 = pairStr_2.split("-"); // ['1', '2']

      let sum = 0;

      for (const runner of pair_runner_2) {
        const index = parseInt(runner, 10) - 1; // Convert to 0-based index
        const score = parseInt(team2[index]) || 0; // Safely handle missing index
        sum += score;
      }

      sum_pair_2[key] = sum; // Save total sum per key
      
    }


    //Get topper key
    //team-1
    const maxScore_1 = Math.max(...Object.values(sum_pair_1));
    const topperKey_1 = Object.keys(sum_pair_1).filter(key => sum_pair_1[key] === maxScore_1);

    //team-2
    const maxScore_2 = Math.max(...Object.values(sum_pair_2));
    const topperKey_2 = Object.keys(sum_pair_2).filter(key => sum_pair_2[key] === maxScore_2);
    
    //mix merge topper
    let all_pairs = {...sum_pair_1, ...sum_pair_2}
    const maxScore = Math.max(...Object.values(all_pairs));
    const topperKey = Object.keys(all_pairs).filter(key => all_pairs[key] === maxScore);
    
    let team_names = req.body.event_name.split("VS");
    
    // console.log(team_names)
    // console.log(pair_teams)
    // console.log(pair_t)
    //return;

    let i = 0;
    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      
      for (let n = 0; n < userRuns[uid].length; n++) {
      
        let team_num = pair_t[userRuns[uid][n]] - 1;
        let team_name = team_names[team_num];
        let team_pair = pair_teams[userRuns[uid][n]][0];

        // console.log(userRuns[uid][n])
        // console.log(topperKey)
        // return;

        if (topperKey.includes(userRuns[uid][n].toString())) {

          //user win code **********************
          
          // amount = Math.abs(userRuns[uid]) * userAmount;
          amount = userAmount;

          pl = amount;
          up_line = amount;
          type = "CR";
          remark = req.body.event_name + "/" + mk + "/WIN/" + team_name + "/PAIR[" + team_pair + "]/" + userAmount;

          //for loop
          for (let k = 0; k < parents.length; k++) {
            //parents calc
            
            if (parents[k]["id"] != uid) {
              
              //get part % diff
              let part =
                k === 1
                  ? parents[k]["part"]
                  : parents[k]["part"] - parents[k - 1]["part"];

                    
              //let amount_p = (-Math.abs(userRuns[uid]) * part) / 100;
              let amount_p = -part / 100;
              amount_p = amount_p * userAmount; //amount
              let pl_p = amount_p;

              //upline downline calc.............................................
              let up_line_p = (parents[k].up_line * -amount) / 100;
              let down_line_p = (parents[k].down_line * -amount) / 100;

              // console.log(up_line_p, down_line_p, amount)
              // return
              let type_p = "DR";
              let remark_p =
                req.body.event_name + "/" + mk + "/LOSS/" + team_name + "/PAIR[" + team_pair + "]/" + userAmount;

              parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

              //exp deduction ********************
              let ex = (Math.abs(userExpo) * part) / 100;
              expArr.push([parents[k]["id"], ex]);
              //get balance
              let old_bal_p = await Result.getBalance(parents[k]["id"]);
              account_stat.push([
                parents[k]["id"],
                amount_p,
                part,
                up_line_p,
                down_line_p,
                type_p,
                parents[k]["id"],
                parents[k]["id"],
                old_bal_p[0].amount,
                old_bal_p[0].amount + amount_p,
                noCutId,
                def_noCutId,
                req.body.event_id,
                remark_p,
                0,
                1,
              ]);
            } //if
          } //for
        } else {
         
          //system win & user loss *************************
          //amount = -Math.abs(systemRuns[uid]) * userAmount;
          amount = -userAmount;
          up_line = amount;
          type = "DR";
          remark = req.body.event_name + "/" + mk + "/LOSS/"+ team_name + "/PAIR[" + team_pair + "]/" + userAmount;
          
          //for loop
          for (let k = 0; k < parents.length; k++) {
            if (parents[k]["id"] != uid) {
              let part =
                k === 1
                  ? parents[k]["part"]
                  : parents[k]["part"] - parents[k - 1]["part"];
                  
              // let amount_p = (Math.abs(systemRuns[uid]) * part) / 100;
              let amount_p = part / 100;
              amount_p = amount_p * userAmount;
              let pl_p = amount_p;

              //upline downline calculation..............................
              let up_line_p = (parents[k].up_line * amount) / 100;
              let down_line_p = (parents[k].down_line * amount) / 100;

              let type_p = "CR";
              let remark_p =
                req.body.event_name + "/" + mk + "/WIN/" + team_name + "/PAIR[" + team_pair + "]/" + userAmount;

              parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

              //exp deduction ***************
              let ex = (Math.abs(userExpo) * part) / 100;
              expArr.push([parents[k]["id"], ex]);

              //get balance
              let old_bal_p = await Result.getBalance(parents[k]["id"]);

              account_stat.push([
                parents[k]["id"],
                amount_p,
                part,
                up_line_p,
                down_line_p,
                type_p,
                parents[k]["id"],
                parents[k]["id"],
                old_bal_p[0].amount,
                old_bal_p[0].amount + amount_p,
                noCutId,
                def_noCutId,
                req.body.event_id,
                remark_p,
                0,
                1,
              ]);
            } //if
          } //for
        }
      
        bal.push([uid, amount, up_line, down_line]);
        expArr.push([uid, Math.abs(userExpo)]);
        account_stat.push([
          uid,
          amount,
          -100,
          up_line,
          down_line,
          type,
          uid,
          uid,
          old_bal[i].amount,
          old_bal[i].amount + amount,
          noCutId,
          def_noCutId,
          req.body.event_id,
          remark,
          0,
          1,
        ]);

      
    } //sub for

    i++;
  } // userRuns in main for

    // result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      score,
      JSON.stringify(team1),
      JSON.stringify(team2),
      mk,
      def_noCutId,
      "RUN",
      0,
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + mk;
    } else {
      // flag.push('CUT');
      flag = mk;
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      1,
    ]);

   
    

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

const pairEventCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};
    let user_pairs_1 = {};
    let user_pairs_2 = {};
    let pair_teams = {};
    let pair_t = {};
    let mk = "PAIR_EVENT";
    // const mkMap = {
    //   4: '1ST_INNING_KHADO',
    //   5: '1ST_INNING_TOTAL_SCORE'
    // };
    // const mk = mkMap[def_noCutId] || false;

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);

        //user PAIR Team-1 ****************************
        //all runnerId with pair
        if (!pair_teams[noCutUsers[i].runnerId]) {
          pair_teams[noCutUsers[i].runnerId] = [];
        }
        if (!pair_teams[noCutUsers[i].runnerId].includes(noCutUsers[i].runner_name)) {
          pair_teams[noCutUsers[i].runnerId].push(noCutUsers[i].runner_name);
        }
        //team sequence
        if (!pair_t[noCutUsers[i].runnerId]) {
          pair_t[noCutUsers[i].runnerId] = [];
        }
        if (!pair_t[noCutUsers[i].runnerId].includes(noCutUsers[i].team)) {
          pair_t[noCutUsers[i].runnerId].push(noCutUsers[i].team);
        }
        

        //user PAIR Team-1 ****************************
        if(noCutUsers[i].team == 1) {
          if (!user_pairs_1[noCutUsers[i].runnerId]) {
            user_pairs_1[noCutUsers[i].runnerId] = [];
          }
          if (!user_pairs_1[noCutUsers[i].runnerId].includes(noCutUsers[i].runner_name)) {
            user_pairs_1[noCutUsers[i].runnerId].push(noCutUsers[i].runner_name);
          }
        }
        //user PAIR Team-2 ****************************
        if(noCutUsers[i].team == 2) {
          if (!user_pairs_2[noCutUsers[i].runnerId]) {
            user_pairs_2[noCutUsers[i].runnerId] = [];
          }
          if (!user_pairs_2[noCutUsers[i].runnerId].includes(noCutUsers[i].runner_name)) {
            user_pairs_2[noCutUsers[i].runnerId].push(noCutUsers[i].runner_name);
          }
        }


      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    //const runs = { ...t1 };
    let userRuns = {};
    let uids = [];
    let userExp = {};
    let userAmt = {};
    let score = 0;
    
    //let resultRuns = runs;

    //user total runs selections******************
    for (const uid in noCutUserRunner) {
      let exp = 0;
      userRuns[uid] = [];
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];

        userRuns[uid].push(rId);

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          exp = 200;
        }
      }

      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    // for (const uid in noCutSystemRunner) {
    //   for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
    //     const rId = noCutSystemRunner[uid][i];
    //     systemRuns[uid] = rId;
    //   }
    // }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    
    /*  Team topper from both end *****/
    let sum_pair_1 = {};
    let sum_pair_2 = {};

    // Team-1 Loop through each user_pair entry & sum of runs according to pair
    for (const key in user_pairs_1) {
      const pairStr_1 = user_pairs_1[key][0]; // e.g., "1-2"
      const pair_runner_1 = pairStr_1.split("-"); // ['1', '2']

      let sum = 0;

      for (const runner of pair_runner_1) {
        const index = parseInt(runner, 10) - 1; // Convert to 0-based index
        const score = parseInt(team1[index]) || 0; // Safely handle missing index
        sum += score;
      }

      sum_pair_1[key] = sum; // Save total sum per key
      //console.log(`Pair ${pairStr} (key: ${key}) total:`, sum);
    }

    // Team-2 Loop through each user_pair entry & sum of runs according to pair
    for (const key in user_pairs_2) {
      const pairStr_2 = user_pairs_2[key][0]; // e.g., "1-2"
      const pair_runner_2 = pairStr_2.split("-"); // ['1', '2']

      let sum = 0;

      for (const runner of pair_runner_2) {
        const index = parseInt(runner, 10) - 1; // Convert to 0-based index
        const score = parseInt(team2[index]) || 0; // Safely handle missing index
        sum += score;
      }

      sum_pair_2[key] = sum; // Save total sum per key
      
    }


    //Get topper key
    //team-1
    const maxScore_1 = Math.max(...Object.values(sum_pair_1));
    const topperKey_1 = Object.keys(sum_pair_1).filter(key => sum_pair_1[key] === maxScore_1);

    //team-2
    const maxScore_2 = Math.max(...Object.values(sum_pair_2));
    const topperKey_2 = Object.keys(sum_pair_2).filter(key => sum_pair_2[key] === maxScore_2);
    
    //mix merge topper
    let all_pairs = {...sum_pair_1, ...sum_pair_2}
    const maxScore = Math.max(...Object.values(all_pairs));
    const topperKey = Object.keys(all_pairs).filter(key => all_pairs[key] === maxScore);
    
    let team_names = req.body.event_name.split("VS");
    
    // console.log(team_names)
    // console.log(pair_teams)
    // console.log(pair_t)
    //return;

    let i = 0;
    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      
      for (let n = 0; n < userRuns[uid].length; n++) {
      
        let team_num = pair_t[userRuns[uid][n]] - 1;
        let team_name = team_names[team_num];
        let team_pair = pair_teams[userRuns[uid][n]][0];

        // console.log(userRuns[uid][n])
        // console.log(topperKey)
        // return;

        if (topperKey.includes(userRuns[uid][n].toString())) {

          //user win code **********************
          
          // amount = Math.abs(userRuns[uid]) * userAmount;
          amount = -userAmount;

          pl = amount;
          up_line = amount;
          type = "DR";
          remark = req.body.event_name + "/" + mk + "/WIN/REVOKED/" + team_name + "/PAIR[" + team_pair + "]/" + userAmount;

          //for loop parents
          for (let k = 0; k < parents.length; k++) {
            //parents calc
            
            if (parents[k]["id"] != uid) {
              
              //get part % diff
              let part =
                k === 1
                  ? parents[k]["part"]
                  : parents[k]["part"] - parents[k - 1]["part"];

                    
              //let amount_p = (-Math.abs(userRuns[uid]) * part) / 100;
              let amount_p = part / 100;
              amount_p = amount_p * userAmount; //amount
              let pl_p = amount_p;

              //upline downline calc.............................................
              let up_line_p = (parents[k].up_line * -amount) / 100;
              let down_line_p = (parents[k].down_line * -amount) / 100;

              // console.log(up_line_p, down_line_p, amount)
              // return
              let type_p = "CR";
              let remark_p =
                req.body.event_name + "/" + mk + "/LOSS/REVOKED/" + team_name + "/PAIR[" + team_pair + "]/" + userAmount;

              parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

              //exp deduction ********************
              let ex = (Math.abs(userExpo) * part) / 100;
              expArr.push([parents[k]["id"], -ex]);
              //get balance
              let old_bal_p = await Result.getBalance(parents[k]["id"]);
              account_stat.push([
                parents[k]["id"],
                amount_p,
                part,
                up_line_p,
                down_line_p,
                type_p,
                parents[k]["id"],
                parents[k]["id"],
                old_bal_p[0].amount,
                old_bal_p[0].amount + amount_p,
                noCutId,
                def_noCutId,
                req.body.event_id,
                remark_p,
                0,
                1,
              ]);
            } //if
          } //for
        } else {
         
          //system win & user loss *************************
          //amount = -Math.abs(systemRuns[uid]) * userAmount;
          amount = userAmount;
          up_line = amount;
          type = "CR";
          remark = req.body.event_name + "/" + mk + "/LOSS/REVOKED/"+ team_name + "/PAIR[" + team_pair + "]/" + userAmount;
          
          //for loop
          for (let k = 0; k < parents.length; k++) {
            if (parents[k]["id"] != uid) {
              let part =
                k === 1
                  ? parents[k]["part"]
                  : parents[k]["part"] - parents[k - 1]["part"];
                  
              // let amount_p = (Math.abs(systemRuns[uid]) * part) / 100;
              let amount_p = -part / 100;
              amount_p = amount_p * userAmount;
              let pl_p = amount_p;

              //upline downline calculation..............................
              let up_line_p = (parents[k].up_line * amount) / 100;
              let down_line_p = (parents[k].down_line * amount) / 100;

              let type_p = "DR";
              let remark_p =
                req.body.event_name + "/" + mk + "/WIN/REVOKED/" + team_name + "/PAIR[" + team_pair + "]/" + userAmount;

              parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

              //exp deduction ***************
              let ex = (Math.abs(userExpo) * part) / 100;
              expArr.push([parents[k]["id"], -ex]);

              //get balance
              let old_bal_p = await Result.getBalance(parents[k]["id"]);

              account_stat.push([
                parents[k]["id"],
                amount_p,
                part,
                up_line_p,
                down_line_p,
                type_p,
                parents[k]["id"],
                parents[k]["id"],
                old_bal_p[0].amount,
                old_bal_p[0].amount + amount_p,
                noCutId,
                def_noCutId,
                req.body.event_id,
                remark_p,
                0,
                1,
              ]);
            } //if
          } //for
        }
      
        bal.push([uid, amount, up_line, down_line]);
        expArr.push([uid, Math.abs(userExpo)]);
        account_stat.push([
          uid,
          amount,
          -100,
          up_line,
          down_line,
          type,
          uid,
          uid,
          old_bal[i].amount,
          old_bal[i].amount + amount,
          noCutId,
          def_noCutId,
          req.body.event_id,
          remark,
          0,
          1,
        ]);

      
    } //sub for

    i++;
  } // userRuns in main for

    // result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      score,
      JSON.stringify(team1),
      JSON.stringify(team2),
      mk,
      def_noCutId,
      "RUN",
      1,
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + mk;
    } else {
      // flag.push('CUT');
      flag = mk;
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      1,
    ]);

   
    

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

/*
 *
 * WICKET NO_CUT, CUT market Calculations
 *
 */

const noCutWCalc = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    //let resultRuns = runs;

    //user total runs selection******************
    for (const uid in noCutUserRunner) {
      let sum = 0;
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        // result[rId] = result[rId] || [];
        // result[rId].push(runs[rId]);
        result[uid] = result[uid] || [];
        result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          //exp += 120;
          exp = 200;
        }
      }

      userRuns[uid] = sum;
      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      let sum = 0;

      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "system", [rId]: runs[rId] });
      }

      systemRuns[uid] = sum;
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;
    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      if (userRuns[uid] > systemRuns[uid]) {
        //user win code **********************

        amount = Math.abs(userRuns[uid]) * userAmount;

        pl = amount;
        up_line = amount;
        type = "CR";
        remark =
          req.body.event_name +
          "/NO_CUT/WICKET/WIN/ " +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;
        let up_down = 0;
        let direct_parent_id = 0;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc

          if (parents[k]["id"] != uid) {
            //get part % diff
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (-Math.abs(userRuns[uid]) * part) / 100;
            amount_p = amount_p * userAmount; //amount
            let pl_p = amount_p;

            //upline downline calc.............................................
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            // console.log(up_line_p, down_line_p, amount)
            // return
            let type_p = "DR";
            let remark_p =
              req.body.event_name +
              "/NO_CUT/WICKET/LOSS/ " +
              systemRuns[uid] +
              " vs " +
              userRuns[uid] +
              "/" +
              userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win & user loss *************************
        amount = -Math.abs(systemRuns[uid]) * userAmount;
        up_line = amount;
        type = "DR";
        remark =
          req.body.event_name +
          "/NO_CUT/WICKET/LOSS/ " +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (Math.abs(systemRuns[uid]) * part) / 100;
            amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "CR";
            let remark_p =
              req.body.event_name +
              "/NO_CUT/WICKET/WIN/ " +
              systemRuns[uid] +
              " vs " +
              userRuns[uid] +
              "/" +
              userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      JSON.stringify(runs),
      JSON.stringify(team1),
      JSON.stringify(team2),
      "NO_CUT",
      "1",
      "WICKET",
      "0",
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "NO_CUT";
    } else {
      // flag.push('CUT');
      flag = "NO_CUT";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      0,
    ]);

    // console.log(req.body);
    // console.log("call");
    // console.log(account_stat);

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

const noCutWCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    //let resultRuns = runs;

    //user total runs selection******************
    for (const uid in noCutUserRunner) {
      let sum = 0;
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        // result[rId] = result[rId] || [];
        // result[rId].push(runs[rId]);
        result[uid] = result[uid] || [];
        result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          //exp += 120;
          exp = 200;
        }
      }

      userRuns[uid] = sum;
      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      let sum = 0;

      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "system", [rId]: runs[rId] });
      }

      systemRuns[uid] = sum;
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;
    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      if (userRuns[uid] > systemRuns[uid]) {
        //User WIN code **********************

        amount = -Math.abs(userRuns[uid]) * userAmount;

        pl = amount;
        up_line = amount;
        type = "DR";
        remark =
          req.body.event_name +
          "/NO_CUT/WICKET/WIN/REVOKED/" +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;
        let up_down = 0;
        let direct_parent_id = 0;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc

          if (parents[k]["id"] != uid) {
            //get part % diff
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (Math.abs(userRuns[uid]) * part) / 100;
            amount_p = amount_p * userAmount; //amount
            let pl_p = amount_p;

            //upline downline calc.............................................
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            // console.log(up_line_p, down_line_p, amount)
            // return
            let type_p = "CR";
            let remark_p =
              req.body.event_name +
              "/NO_CUT/WICKET/LOSS/REVOKED/" +
              systemRuns[uid] +
              " vs " +
              userRuns[uid] +
              "/" +
              userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win & user loss *************************
        amount = Math.abs(systemRuns[uid]) * userAmount;
        up_line = amount;
        type = "CR";
        remark =
          req.body.event_name +
          "/NO_CUT/WICKET/LOSS/REVOKED/" +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (-Math.abs(systemRuns[uid]) * part) / 100;
            amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "DR";
            let remark_p =
              req.body.event_name +
              "/NO_CUT/WICKET/WIN/REVOKED/" +
              systemRuns[uid] +
              " vs " +
              userRuns[uid] +
              "/" +
              userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, -Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      JSON.stringify(runs),
      JSON.stringify(team1),
      JSON.stringify(team2),
      "NO_CUT",
      "1",
      "WICKET",
      1,
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "NO_CUT";
    } else {
      // flag.push('CUT');
      flag = "NO_CUT";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      1,
    ]);

    // console.log(req.body);
    // console.log("call");
    // console.log(account_stat);

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

const cutWCalc = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    //let resultRuns = runs;

    //user total runs selection******************
    for (const uid in noCutUserRunner) {
      let sum = 0;
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          //exp += 120;
          exp = 200;
        }
      }

      userRuns[uid] = sum;
      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      let sum = 0;

      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "system", [rId]: runs[rId] });
      }

      systemRuns[uid] = sum;
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;
    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      if (userRuns[uid] > systemRuns[uid]) {
        //user win code*******************
        //amount = Math.abs(userRuns[uid]) * userAmount;
        let diff = Math.abs(userRuns[uid]) - Math.abs(systemRuns[uid]);
        amount = diff * userAmount;

        pl = amount;
        up_line = amount;
        type = "CR";
        remark =
          req.body.event_name +
          "/CUT/WICKET/WIN/" +
          amount +
          "/" +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;

        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc
          if (parents[k]["id"] != uid) {
            //get part % diff

            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (-Math.abs(amount) * part) / 100;
            //amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calc
            //upline downline calc
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            let type_p = "DR";
            let remark_p =
              req.body.event_name + "/CUT/WICKET/LOSS/" + amount_p + "/";
            systemRuns[uid] + " vs " + userRuns[uid] + "/" + userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win........................................

        let diff = Math.abs(systemRuns[uid]) - Math.abs(userRuns[uid]);
        amount = diff * userAmount;
        amount = -amount;
        up_line = amount;
        type = "DR";
        remark =
          req.body.event_name +
          "/CUT/WICKET/LOSS/" +
          amount +
          "/" +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (Math.abs(amount) * part) / 100;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "CR";
            let remark_p =
              req.body.event_name +
              "/CUT/WICKET/WIN/" +
              amount_p +
              "/" +
              systemRuns[uid] +
              " vs " +
              userRuns[uid] +
              "/" +
              userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      JSON.stringify(runs),
      JSON.stringify(team1),
      JSON.stringify(team2),
      "CUT",
      "2",
      "WICKET",
      "0",
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "CUT";
    } else {
      flag = "CUT";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      1,
    ]);

    //console.log(resultData)
    let rowsRes = await Result.updateResult(resultData);
    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }
    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    // next(error);
    throw error;
  }
};
const cutWCalcRevoke = async (req, team1, team2, def_noCutId, noCutId) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    //let resultRuns = runs;

    //user total runs selection******************
    for (const uid in noCutUserRunner) {
      let sum = 0;
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          //exp += 120;
          exp = 200;
        }
      }

      userRuns[uid] = sum;
      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      let sum = 0;

      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        sum += parseInt(runs[rId] || 0);

        result[uid] = result[uid] || [];
        result[uid].push({ type: "system", [rId]: runs[rId] });
      }

      systemRuns[uid] = sum;
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;
    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      if (userRuns[uid] > systemRuns[uid]) {
        //user win code*******************
        //amount = Math.abs(userRuns[uid]) * userAmount;
        let diff = Math.abs(userRuns[uid]) - Math.abs(systemRuns[uid]);
        amount = diff * userAmount;
        amount = -amount;
        pl = amount;
        up_line = amount;
        type = "DR";
        remark =
          req.body.event_name +
          "/CUT/WICKET/WIN/REVOKED/" +
          amount +
          "/" +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;

        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc
          if (parents[k]["id"] != uid) {
            //get part % diff

            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (Math.abs(amount) * part) / 100;
            //amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calc
            //upline downline calc
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            let type_p = "CR";
            let remark_p =
              req.body.event_name +
              "/CUT/WICKET/LOSS/REVOKED/" +
              amount_p +
              "/";
            systemRuns[uid] + " vs " + userRuns[uid] + "/" + userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win........................................

        let diff = Math.abs(systemRuns[uid]) - Math.abs(userRuns[uid]);
        amount = diff * userAmount;
        amount = amount;
        up_line = amount;
        type = "CR";
        remark =
          req.body.event_name +
          "/CUT/WICKET/LOSS/REVOKED/" +
          amount +
          "/" +
          userRuns[uid] +
          " vs " +
          systemRuns[uid] +
          "/" +
          userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            let amount_p = (-Math.abs(amount) * part) / 100;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "DR";
            let remark_p =
              req.body.event_name +
              "/CUT/WICKET/WIN/REVOKED/" +
              amount_p +
              "/" +
              systemRuns[uid] +
              " vs " +
              userRuns[uid] +
              "/" +
              userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, -Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      JSON.stringify(runs),
      JSON.stringify(team1),
      JSON.stringify(team2),
      "CUT",
      "2",
      "WICKET",
      1,
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "CUT";
    } else {
      flag = "CUT";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      1,
    ]);

    //console.log(resultData)
    let rowsRes = await Result.updateResult(resultData);
    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }
    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    // next(error);
    throw error;
  }
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
    let runs_team1_pairEvent = [];
    let runs_team2_pairEvent = [];

    let wickets_team1_nocut = [];
    let wickets_team2_nocut = [];
    let wickets_team1_cut = [];
    let wickets_team2_cut = [];

    let result_toss = [];
    let result_1st_inning_khado = [];
    let result_1st_inning_total_score = [];
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

        //1ST INNING KHADO ***************************************
        if (
          result[i].result_type == "RUN" &&
          result[i].market_name == "1ST_INNING_KHADO"
        ) {
          //result_1st_inning_khado = result[i].result;
          //TEAM 1
          result_1st_inning_khado = JSON.parse(result[i].t1);
          result_1st_inning_khado = Object.keys(result_1st_inning_khado).map(
            (key) => [key, result_1st_inning_khado[key]]
          );
        }

        //1ST INNING TOTAL SCORE ***************************************
        if (
          result[i].result_type == "RUN" &&
          result[i].market_name == "1ST_INNING_TOTAL_SCORE"
        ) {
          //TEAM 1
          result_1st_inning_total_score = JSON.parse(result[i].t1);
          result_1st_inning_total_score = Object.keys(
            result_1st_inning_total_score
          ).map((key) => [key, result_1st_inning_total_score[key]]);
        }

        //PAIR_EVENT *******************************************
        if (
          result[i].result_type == "RUN" &&
          result[i].market_name == "PAIR_EVENT"
        ) {
          //TEAM 1
          runs_team1_pairEvent = JSON.parse(result[i].t1);
          runs_team1_pairEvent = Object.keys(runs_team1_pairEvent).map((key) => [
            key,
            runs_team1_pairEvent[key],
          ]);

          //TEAM 2
          runs_team2_pairEvent = JSON.parse(result[i].t2);
          runs_team2_pairEvent = Object.keys(runs_team2_pairEvent).map((key) => [
            key,
            runs_team2_pairEvent[key],
          ]);
        } //if

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
        if (
          result[i].result_type == "RUN" &&
          result[i].market_name == "TOP_BATTER"
        ) {
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
        if (
          result[i].result_type == "RUN" &&
          result[i].market_name == "TOP_BOWLER"
        ) {
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
        if (
          result[i].result_type == "RUN" &&
          result[i].market_name == "ODD_EVEN"
        ) {
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
      result_1st_inning_khado: result_1st_inning_khado,
      result_1st_inning_total_score: result_1st_inning_total_score,
      runs_team1_top: runs_team1_top,
      runs_team2_top: runs_team2_top,
      runs_team1_top_bowler: runs_team1_topB,
      runs_team2_top_bowler: runs_team2_topB,
      runs_team1_odd_even: runs_team1_oddEven,
      runs_team2_odd_even: runs_team2_oddEven,
      runs_team1_pairEvent: runs_team1_pairEvent,
      runs_team2_pairEvent: runs_team2_pairEvent,
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
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    //const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    let team1 = 0;
    let team2 = 0;
    //let resultRuns = runs;

    //user selection total runs******************
    for (const uid in noCutUserRunner) {
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        userRuns[uid] = rId;

        //result[uid] = result[uid] || [];
        //result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          exp = 200;
        }
      }

      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        //sum += parseInt(runs[rId] || 0);
        systemRuns[uid] = rId;

        // result[uid] = result[uid] || [];
        // result[uid].push({ type: "system", [rId]: runs[rId] });
      }
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;
    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      if (userRuns[uid] == team) {
        //user win code **********************

        // amount = Math.abs(userRuns[uid]) * userAmount;
        amount = userAmount;

        pl = amount;
        up_line = amount;
        type = "CR";
        remark = req.body.event_name + "/TOSS/WIN/ " + userAmount;
        let up_down = 0;
        let direct_parent_id = 0;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc

          if (parents[k]["id"] != uid) {
            //get part % diff
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            //let amount_p = (-Math.abs(userRuns[uid]) * part) / 100;
            let amount_p = -part / 100;
            amount_p = amount_p * userAmount; //amount
            let pl_p = amount_p;

            //upline downline calc.............................................
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            // console.log(up_line_p, down_line_p, amount)
            // return
            let type_p = "DR";
            let remark_p = req.body.event_name + "/TOSS/LOSS/ " + userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win & user loss *************************
        //amount = -Math.abs(systemRuns[uid]) * userAmount;
        amount = -userAmount;
        up_line = amount;
        type = "DR";
        remark = req.body.event_name + "/TOSS/LOSS/ " + userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            // let amount_p = (Math.abs(systemRuns[uid]) * part) / 100;
            let amount_p = part / 100;
            amount_p = amount_p * userAmount;
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "CR";
            let remark_p = req.body.event_name + "/TOSS/WIN/ " + userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    // result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      team,
      JSON.stringify(t1),
      JSON.stringify(t2),
      "TOSS",
      "11",
      "TOSS",
      0,
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "NO_CUT";
    } else {
      // flag.push('CUT');
      flag = "NO_CUT";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      1,
    ]);

    // console.log(req.body.event_id);
    // console.log(def_noCutId)
    // console.log(expArr)

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
};

const tossCalcRevoke = async (req, team, def_noCutId, noCutId, t1, t2) => {
  try {
    //let req.body = Reqbody;
    //runner_player relations user and system selected runners

    const _self = await User.getProfile(parseJwt(req).email); // login user info
    const noCutUsers = await Result.getPlayedUser(req.body.event_id, noCutId);
    let noCutUserRunner = {};
    let noCutSystemRunner = {};
    let noCutUserAmount = {};
    let noCutUserExp = {};

    for (let i = 0; i < noCutUsers.length; i++) {
      if (noCutUsers[i].type == "user") {
        if (!noCutUserRunner[noCutUsers[i].user_id]) {
          noCutUserRunner[noCutUsers[i].user_id] = [];
        }
        noCutUserRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
        //amount
        if (!noCutUserAmount[noCutUsers[i].user_id]) {
          noCutUserAmount[noCutUsers[i].user_id] = [];
        }
        noCutUserAmount[noCutUsers[i].user_id].push(noCutUsers[i].amount);
        //exp
        if (!noCutUserExp[noCutUsers[i].user_id]) {
          noCutUserExp[noCutUsers[i].user_id] = [];
        }
        noCutUserExp[noCutUsers[i].user_id].push(noCutUsers[i].exp);
      }
      //against system runner
      if (noCutUsers[i].type == "system") {
        if (!noCutSystemRunner[noCutUsers[i].user_id]) {
          noCutSystemRunner[noCutUsers[i].user_id] = [];
        }
        noCutSystemRunner[noCutUsers[i].user_id].push(noCutUsers[i].runnerId);
      }
    }

    //Win Loss calc start...

    //const runs = { ...team1, ...team2 };
    let userRuns = {};
    let systemRuns = {};
    let uids = [];
    let result = {};
    let userExp = {};
    let userAmt = {};
    let team1 = 0;
    let team2 = 0;
    //let resultRuns = runs;

    //user selection total runs******************
    for (const uid in noCutUserRunner) {
      let exp = 0;
      for (let i = 0; i < noCutUserRunner[uid].length; i++) {
        const rId = noCutUserRunner[uid][i];
        userRuns[uid] = rId;

        //result[uid] = result[uid] || [];
        //result[uid].push({ type: "user", [rId]: runs[rId] });

        //exposure calc
        if (req.body.eventtype == "OneDay") {
          exp += 300;
        }
        if (req.body.eventtype == "Twenty") {
          exp = 200;
        }
      }

      userExp[uid] = noCutUserExp[uid]; //exp;
      userAmt[uid] = noCutUserAmount[uid];
      uids.push(uid);
    }

    //system selection total runs***************
    for (const uid in noCutSystemRunner) {
      for (let i = 0; i < noCutSystemRunner[uid].length; i++) {
        const rId = noCutSystemRunner[uid][i];
        //sum += parseInt(runs[rId] || 0);
        systemRuns[uid] = rId;

        // result[uid] = result[uid] || [];
        // result[uid].push({ type: "system", [rId]: runs[rId] });
      }
    }

    //entries, win loss based ALL Calc balance, a/c, parent etc...
    let bal = [];
    let parentsBalL = [];
    let parentsBalW = [];
    let expArr = [];
    let account_stat = [];
    let part_chain = [];
    let old_bal = [];

    if (uids.length != 0) {
      part_chain = await Result.getPartChain(uids);
      old_bal = await Result.getBalance(uids);
    }

    let i = 0;
    for (const uid in userRuns) {
      let amount = 0;
      let pl = 0;
      let up_line = 0;
      let down_line = 0;
      let type = "";
      let remark = "";
      let userAmount = userAmt[uid][0];
      let userExpo = userExp[uid][0] * userAmount;
      let parents = JSON.parse(part_chain[i]["chain"]);

      // console.log(team);
      if (userRuns[uid] == team) {
        //user win code **********************

        // amount = Math.abs(userRuns[uid]) * userAmount;
        amount = -Math.abs(userAmount);
        pl = amount;
        up_line = amount;
        type = "DR";
        remark = req.body.event_name + "/TOSS/WIN/REVOKED/" + userAmount;
        let up_down = 0;
        let direct_parent_id = 0;

        //for loop
        for (let k = 0; k < parents.length; k++) {
          //parents calc

          if (parents[k]["id"] != uid) {
            //get part % diff
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            //let amount_p = (-Math.abs(userRuns[uid]) * part) / 100;
            let amount_p = part / 100;
            amount_p = Math.abs(amount_p * userAmount); //amount
            let pl_p = amount_p;

            //upline downline calc.............................................
            let up_line_p = (parents[k].up_line * -amount) / 100;
            let down_line_p = (parents[k].down_line * -amount) / 100;

            // console.log(up_line_p, down_line_p, amount)
            // return
            let type_p = "CR";
            let remark_p =
              req.body.event_name + "/TOSS/LOSS/REVOKED/" + userAmount;

            parentsBalL.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ********************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);
            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);
            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      } else {
        //system win & user loss *************************
        //amount = -Math.abs(systemRuns[uid]) * userAmount;
        amount = userAmount;
        up_line = amount;
        type = "CR";
        remark = req.body.event_name + "/TOSS/LOSS/REVOKED/" + userAmount;
        let up_down = 0;
        //for loop
        for (let k = 0; k < parents.length; k++) {
          if (parents[k]["id"] != uid) {
            let part =
              k === 1
                ? parents[k]["part"]
                : parents[k]["part"] - parents[k - 1]["part"];

            // let amount_p = (Math.abs(systemRuns[uid]) * part) / 100;
            let amount_p = part / 100;
            amount_p = -Math.abs(amount_p * userAmount);
            let pl_p = amount_p;

            //upline downline calculation..............................
            let up_line_p = (parents[k].up_line * amount) / 100;
            let down_line_p = (parents[k].down_line * amount) / 100;

            let type_p = "DR";
            let remark_p =
              req.body.event_name + "/TOSS/WIN/REVOKED/" + userAmount;

            parentsBalW.push([parents[k]["id"], pl_p, up_line_p, down_line_p]);

            //exp deduction ***************
            let ex = (Math.abs(userExpo) * part) / 100;
            expArr.push([parents[k]["id"], -ex]);

            //get balance
            let old_bal_p = await Result.getBalance(parents[k]["id"]);

            account_stat.push([
              parents[k]["id"],
              amount_p,
              part,
              up_line_p,
              down_line_p,
              type_p,
              parents[k]["id"],
              parents[k]["id"],
              old_bal_p[0].amount,
              old_bal_p[0].amount + amount_p,
              noCutId,
              def_noCutId,
              req.body.event_id,
              remark_p,
              0,
              1,
            ]);
          } //if
        } //for
      }

      bal.push([uid, amount, up_line, down_line]);
      expArr.push([uid, -Math.abs(userExpo)]);
      account_stat.push([
        uid,
        amount,
        -100,
        up_line,
        down_line,
        type,
        uid,
        uid,
        old_bal[i].amount,
        old_bal[i].amount + amount,
        noCutId,
        def_noCutId,
        req.body.event_id,
        remark,
        0,
        1,
      ]);

      i++;
    }

    // result = JSON.stringify(result);
    let resultData = [];

    resultData.push([
      req.body.event_id,
      req.body.user_id,
      team,
      JSON.stringify(t1),
      JSON.stringify(t2),
      "TOSS",
      "11",
      "TOSS",
      1,
    ]);

    let flag = "";
    let existFlag = await Result.getResultsEvents(req.body.event_id);
    if (existFlag[0]["results"] != null) {
      flag = existFlag[0]["results"] + "," + "NO_CUT";
    } else {
      // flag.push('CUT');
      flag = "NO_CUT";
    }

    account_stat.push([
      req.body.user_id,
      0,
      0,
      0,
      0,
      0,
      req.body.user_id,
      req.body.user_id,
      0,
      0,
      noCutId,
      def_noCutId,
      req.body.event_id,
      req.body.event_name + "/RESULT RUNS SCORE UPDATED",
      0,
      1,
    ]);

    // console.log(req.body.event_id);
    // console.log(def_noCutId)
    // console.log(expArr)

    let rowsRes = await Result.updateResult(resultData);

    flag = await Result.updateEvent(req.body.event_id, flag);

    if (bal.length != 0) {
      let rows1 = await Result.updateBalanceClient(bal);
    }

    if (parentsBalL.length != 0) {
      let rows2 = await Result.updateBalance(parentsBalL);
    }

    if (parentsBalW.length != 0) {
      let rows3 = await Result.updateBalance(parentsBalW);
    }

    if (account_stat.length != 0) {
      let rows5 = await Result.addAccountEntry(account_stat);
    }

    //update exposure
    if (uids.length > 0) {
      let exps = await Result.updateExp(expArr);
      let exps1 = await Result.updateExpRunner(req.body.event_id, def_noCutId);
    }
  } catch (error) {
    throw error;
    //next(error);
  }
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

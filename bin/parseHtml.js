const getCss = async () => {
  let css = "<!DOCTYPE html>";
  css += "<html>";
  css += "<head>";
  css += "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">";
  css += "<title>Scoreboard<\/title>";
  css += "<style type=\"text\/css\">";
  css += "html,";
  css += "body {";
  css += "padding: 0;";
  css += "margin: 0;";
  css += "}";
  css += ".score_main {";
  css += "background: #303030;";
  css += "position: relative;";
  css += "width: 100%;";
  css += "color: #fff;";
  css += "font-size: 13px;";
  css += "}";
  css += ".row_new {";
  css += "display: flex;";
  css += "align-items: center;";
  css += "margin: 0px;";
  css += "padding: 10px 0px;";
  css += "background: #000103;";
  css += "}";
  css += ".col_new {";
  css += "width: 33.33333333%;";
  css += "}";
  css += ".score_main .col_new img {";
  css += "filter: invert(100%) sepia(0%) saturate(0%) hue-rotate(205deg) brightness(108%) contrast(101%);";
  css += "width: 50px;";
  css += "}";
  css += ".score_main .matchName {";
  css += "margin-bottom: 0px;";
  css += "font-weight: 500;";
  css += "}";
  css += ".score_main .col_new {";
  css += "text-align: center;";
  css += "}";
  css += ".target-score .currunt_sc,";
  css += ".target-score .currunt_over {";
  css += "display: block;";
  css += "}";
  css += ".currunt_sc {";
  css += "color: #2bcc20;";
  css += "font-weight: bold;";
  css += "margin-bottom: 0px;";
  css += "font-size: 25px;";
  css += "}";
  css += ".target-score .currunt_sc,";
  css += ".target-score .currunt_over {";
  css += "display: block;";
  css += "}";
  css += ".score-btn {";
  css += "padding: 0;";
  css += "display: none;";
  css += "margin: 5px auto;";
  css += "font-weight: 600;";
  css += "font-size: 13px;";
  css += "cursor: pointer;";
  css += "border: none;";
  css += "align-items: center;";
  css += "background: #fff;";
  css += "}";
  css += ".score_main .teamtype .active {";
  css += "filter: inherit;";
  css += "}";
  css += ".score_main .matchName {";
  css += "margin: 0px;";
  css += "font-weight: 500;";
  css += "}";
  css += ".score-footer {";
  css += "display: flex;";
  css += "align-items: center;";
  css += "color: #fff;";
  css += "position: relative;";
  css += "padding: 10px 15px;";
  css += "background: #1e1e1e;";
  css += "background: url('images\/scorecard.jpg');";
  css += "background-repeat: no-repeat;";
  css += "background-position: center;";
  css += "background-size: cover;";
  css += "}";
  css += ".batsman {";
  css += "display: flex;";
  css += "justify-content: center;";
  css += "align-items: center;";
  css += "}";
  css += ".item-score ul {";
  css += "margin-bottom: 0px;";
  css += "padding: 0px;";
  css += "flex-grow: 1;";
  css += "}";
  css += ".item-score ul li.active {";
  css += "color: #2bcc20;";
  css += "}";
  css += ".item-score ul li {";
  css += "margin-right: 5px;";
  css += "list-style: none;";
  css += "}";
  css += ".item-score ul li img,";
  css += ".bollerstatus img {";
  css += "height: 18px;";
  css += "width: 18px;";
  css += "filter: invert(100%) sepia(100%) saturate(0%) hue-rotate(255deg) brightness(110%) contrast(102%);";
  css += "margin-right: 5px;";
  css += "}";
  css += ".item-score {";
  css += "flex: 1;";
  css += "}";
  css += ".over-status,";
  css += ".commantry-status {";
  css += "flex: 1;";
  css += "}";
  css += ".score-over {";
  css += "overflow: hidden;";
  css += "border-radius: 5px;";
  css += "background: transparent;";
  css += "}";
  css += ".item-score ul {";
  css += "margin: 0px;";
  css += "padding: 0px;";
  css += "flex-grow: 1;";
  css += "}";
  css += ".score-over ul li:first-child {";
  css += "background: transparent;";
  css += "border-radius: inherit;";
  css += "color: #fff;";
  css += "}";
  css += ".score-over ul li {";
  css += "display: inline-block;";
  css += "background: #fff;";
  css += "border-radius: 100%;";
  css += "color: #000;";
  css += "}";
  css += "li.b-color {";
  css += "background: #006400 !important;";
  css += "color: #fff !important;";
  css += "}";
  css += "li.w-color {";
  css += "background: #8b0000 !important;";
  css += "color: #fff !important;";
  css += "}";
  css += ".score-over ul li p {";
  css += "margin: 0;";
  css += "font-size: 18px;";
  css += "}";
  css += ".score-over ul li span {";
  css += "display: block;";
  css += "text-align: center;";
  css += "font-size: 13px;";
  css += "width: 22px;";
  css += "line-height: 22px; \/* border: dashed 1px #fff; *\/";
  css += "border-radius: 100%;";
  css += "font-weight: 600;";
  css += "height: 22px;";
  css += "}";
  css += "@media (max-width: 600px) {";
  css += ".score_main {";
  css += "font-size: 11px;";
  css += "}";
  css += ".score_main .col_new img{";
  css += "width: 30px;";
  css += "}";
  css += ".currunt_sc{";
  css += "font-size: 18px;";
  css += "}";
  css += ".item-score ul li img,";
  css += ".bollerstatus img {";
  css += "height: 15px;";
  css += "width: 15px;";
  css += "}";
  css += ".score-over ul li p {";
  css += "font-size: 16px;";
  css += "}";
  css += ".item-score ul li {";
  css += "margin-right: 2px;";
  css += "display: inline-flex;";
  css += "align-items: center;";
  css += "}";
  css += ".score-over ul li span {";
  css += "height: 16px;";
  css += "width: 16px;";
  css += "line-height: 16px;";
  css += "font-size: 11px;";
  css += "}";
  css += ".score-footer,";
  css += ".row_new{";
  css += "padding:2px 5px;";
  css += "}";
  css += ".teamtype span.currunt_sc {";
  css += "font-size: 12px;";
  css += "}";
  css += ".teamtype .currunt_over{";
  css += "font-size: 9px;";
  css += "margin-left: 1px;";
  css += "}";
  css += "}";
  css += "";
  css += "<\/style>";
  css += "";
  css += "<\/head>";
  return css;
}


const parseHtml = async (obj) => {
  try {
    let html = await getCss();
    html += "<body>";
    html += "<div class=\"score_main\">";
    html += "<div class=\"cricket-score\">";
    html += "<div class=\"row_new\">";
    html += "<div class=\"col_new\">";
    html += "<div class=\"teamtype\">";
    html += "<img class=\"\" src=\"images\/cricket-bat.svg\" \/>";
    html += "<p class=\"matchName\">" + obj.h + "<\/p>";
    if (obj.act !== 'h1' && obj.act !== 'h2') { html += "<span class=\"currunt_sc\">" + obj["h1"].r + "/" + obj["h1"].w + "<\/span><span class=\"currunt_over\">(" + obj["h1"].o + "." + obj["h1"].b + ")<\/span>"; }
    html += "<\/div>";
    html += "<\/div>";
    html += "<div class=\"col_new\">";
    html += "<div class=\"target-score\"><span class=\"currunt_sc\">" + obj[obj.act].r + "/" + obj[obj.act].w + "<\/span><span class=\"currunt_over\">(" + obj[obj.act].o + "." + obj[obj.act].b + ")<\/span><span class=\"currunt_over\">CRR : " + obj[obj.act].cr + "<\/span><span class=\"currunt_over\">RRR : " + obj[obj.act].rr + "<\/span><\/div>";
    html += "<\/div>";
    html += "<div class=\"col_new\">";
    html += "<div class=\"teamtype\">";
    html += "<img class=\"active\" src=\"images\/cricket-bat.svg\" \/>";
    html += "<p class=\"matchName\">" + obj.a + "<\/p>";
    if (obj.act !== 'a1' && obj.act !== 'a2') {
      html += "<span class=\"currunt_sc\">" + obj["a1"].r + "/" + obj["a1"].w + "<\/span><span class=\"currunt_over\">(" + obj["a1"].o + "." + obj["a1"].b + ")<\/span>";
    }
    html += "<\/div>";
    html += "<\/div>";
    html += "<\/div>";
    html += "<div class=\"score-footer\">";
    html += "<div class=\"item-score batsman\">";
    html += "<ul>";
    if (obj.ex) {
      if (obj.ex && obj.striker && obj.striker.bet) {
        html += "<li class=\"active\"><img src=\"images\/cricket-icons.svg\" \/>"
        html += obj.st;
        html += " ";
        html += "<span>" + obj.striker.bet.r + "<\/span>/<span class=\"currunt_over\">" + obj.striker.bet.b + "<\/span>";
        html += " <span> SR: " + obj.striker.bet.rr + "<\/span>";
        html += "<\/li>";
      }
      if (obj.ex && obj.nonstriker && obj.nonstriker.bet) {
        html += "<li><img src=\"images\/cricket-icons.svg\" \/>"
        html += obj.ns;
        html += " ";
        html += " <span>" + obj.nonstriker.bet.r + "<\/span><span class=\"currunt_over\">/" + obj.nonstriker.bet.b + "<\/span>";
        html += " <span> RR: " + obj.nonstriker.bet.rr + "<\/span>";
        html += "<\/li>";
      }
      if (obj.ex && obj.baller && obj.baller.ball) {
        html += "<li><img src=\"images\/cricket-ball.svg\" \/>"
        html += obj.bl;
        html += " ";
        html += "<span>" + obj.baller.ball.r + "/" + obj.baller.ball.w + "<\/span><span class=\"currunt_over\">(" + obj.baller.ball.o + "." + obj.baller.ball.b + ")<\/span>";
        html += " <span> RR: " + obj.baller.ball.rr + "<\/span>";
        html += "<\/li>";
      }
    }
    html += "<\/ul>";
    html += "<\/div>";
    html += "<div class=\"item-score score-over-fter\">";
    html += "<div class=\"over-status\">";
    html += "<div class=\"score-over\">";
    html += "<ul>";
    html += "<li><p>Over<\/p><\/li>";
    for (let i = 0; i < obj.lb.length; i++) {
      html += "<li class=\"" + setClass(obj.lb[i]) + " six-balls\"><span>" + obj.lb[i] + "<\/span><\/li>";
    }
    html += "<\/ul>";
    html += "<\/div>";
    html += "<\/div>";
    html += "<div class=\"commantry-status\"><span class=\"commantry\">" + obj.com + "<\/span><\/div>";
    html += "<\/div>";
    html += "<\/div>";
    html += "<\/div>";
    html += "<\/div>";
    html += "<\/body>";
    html += "<\/html>";
    return html;
  } catch (error) {
    console.log(error)
  }

}

const setClass = (run) => {
  if (run.startsWith("6") || run.startsWith("4")) {
    return "b-color"
  }
  if (run.endsWith("w")) {
    return "w-color"
  }
  return ""
}

module.exports = {
  parseHtml
}
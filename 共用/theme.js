/* 企業平台 — 工具共用主題層
   只覆寫「外殼」變數（底色/文字/卡片/邊框/陰影），不碰各工具的 --accent 品牌色。
   主題選擇沿用首頁寫入的 localStorage 'ehub_theme'，跨分頁即時同步。 */
(function () {
  "use strict";
  var SHELL = {
    classic: { "--bg": "#EEF2F9", "--surface": "#FFFFFF", "--surface-2": "#F1F5FB", "--ink": "#16223A", "--ink-2": "#5A6786", "--ink-3": "#8A95AD", "--line": "#E1E7F1", "--line-2": "#EDF1F8", "--sh-1": "0 1px 2px rgba(22,34,58,.05)", "--sh-2": "0 12px 30px rgba(22,34,58,.10),0 2px 6px rgba(22,34,58,.05)", "--r": "14px", "--r-sm": "8px", "--r-lg": "18px", "--font-head": "inherit", "--accent": "#E0322C", "--accent-ink": "#C42620", "--accent-soft": "#FCE8E7", "--glow": "0 8px 22px rgba(224,50,44,.28)" },
    cosmic: { "--bg": "#0a1130", "--surface": "#101a3a", "--surface-2": "#16224a", "--ink": "#d8e8ff", "--ink-2": "#9fb6e0", "--ink-3": "#6177a8", "--line": "rgba(0,212,255,0.30)", "--line-2": "rgba(0,212,255,0.15)", "--sh-1": "0 0 22px rgba(0,212,255,.15),0 2px 8px rgba(0,0,0,.45)", "--sh-2": "0 0 46px rgba(0,212,255,.32),0 14px 40px rgba(2,8,30,.75)", "--r": "6px", "--r-sm": "4px", "--r-lg": "8px", "--font-head": "ui-monospace,Consolas,'Cascadia Mono',monospace", "--accent": "#0c9fce", "--accent-ink": "#7fe6ff", "--accent-soft": "rgba(0,212,255,0.14)", "--glow": "0 0 20px rgba(0,212,255,.4)" },
    "smart-city": { "--bg": "#0d2c40", "--surface": "#0f3349", "--surface-2": "#124056", "--ink": "#cdf3ee", "--ink-2": "#86c4bd", "--ink-3": "#5a8a86", "--line": "rgba(36,216,196,0.30)", "--line-2": "rgba(36,216,196,0.15)", "--sh-1": "0 0 22px rgba(36,216,196,.15),0 2px 8px rgba(0,0,0,.4)", "--sh-2": "0 0 46px rgba(36,216,196,.3),0 14px 40px rgba(2,18,26,.7)", "--r": "4px", "--r-sm": "3px", "--r-lg": "6px", "--font-head": "ui-monospace,Consolas,'Cascadia Mono',monospace", "--accent": "#17a691", "--accent-ink": "#6fe8db", "--accent-soft": "rgba(36,216,196,0.14)", "--glow": "0 0 20px rgba(36,216,196,.38)" },
    playful: { "--bg": "#fef8d8", "--surface": "#fffdf2", "--surface-2": "#fdf2c4", "--ink": "#1f3a52", "--ink-2": "#43607a", "--ink-3": "#8298ab", "--line": "#e6d486", "--line-2": "#f0e4a8", "--sh-1": "0 2px 0 rgba(31,58,82,.12)", "--sh-2": "5px 5px 0 rgba(31,58,82,.16),0 2px 6px rgba(31,58,82,.08)", "--r": "16px", "--r-sm": "11px", "--r-lg": "24px", "--font-head": "'Comic Sans MS','Segoe Print',ui-rounded,sans-serif", "--accent": "#ff8845", "--accent-ink": "#e0662a", "--accent-soft": "#ffe6d4", "--glow": "0 8px 22px rgba(255,136,69,.3)" },
    typewriter: { "--bg": "#f4ece0", "--surface": "#fbf5ea", "--surface-2": "#ece2d2", "--ink": "#2a241a", "--ink-2": "#5a5040", "--ink-3": "#948a78", "--line": "#d9cdb8", "--line-2": "#e6dccb", "--sh-1": "0 1px 2px rgba(42,36,26,.06)", "--sh-2": "0 12px 30px rgba(42,36,26,.12),0 2px 6px rgba(42,36,26,.05)", "--r": "2px", "--r-sm": "2px", "--r-lg": "3px", "--font-head": "'Courier New',ui-monospace,monospace", "--accent": "#8a3a18", "--accent-ink": "#6f2e12", "--accent-soft": "#f0e2d5", "--glow": "0 6px 18px rgba(138,58,24,.18)" }
  };
  function getTheme() { try { var k = localStorage.getItem("ehub_theme"); return SHELL[k] ? k : "classic"; } catch (e) { return "classic"; } }
  function ensureFontStyle() {
    if (document.getElementById("ehub-theme-font")) return;
    var st = document.createElement("style"); st.id = "ehub-theme-font";
    st.textContent = "h1,h2,h3,.brand b,.kpi .v,.v,.num{font-family:var(--font-head,inherit)!important}";
    (document.head || document.documentElement).appendChild(st);
  }
  /* Sci-Fi HUD 裝飾層：僅 smart-city 啟用 — 網格/掃描線底 + 視窗四角框 + 卡片發光框。
     overlay 全 pointer-events:none、卡片只動 box-shadow/border，不影響各工具版面。 */
  var HUD_CSS = [
    'html[data-ehub-theme="smart-city"] body{background-color:var(--bg);background-image:linear-gradient(rgba(36,216,196,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(36,216,196,.05) 1px,transparent 1px),repeating-linear-gradient(0deg,rgba(36,216,196,.04) 0 2px,transparent 2px 4px);background-size:34px 34px,34px 34px,100% 4px;background-attachment:fixed}',
    'html[data-ehub-theme="smart-city"] .card,html[data-ehub-theme="smart-city"] .box,html[data-ehub-theme="smart-city"] .panel{border:1px solid rgba(36,216,196,.38)!important;box-shadow:inset 0 0 0 1px rgba(36,216,196,.06),0 0 16px rgba(36,216,196,.1)!important}',
    'html[data-ehub-theme="smart-city"] .card:hover,html[data-ehub-theme="smart-city"] .box:hover{border-color:rgba(36,216,196,.62)!important;box-shadow:inset 0 0 0 1px rgba(36,216,196,.12),0 0 26px rgba(36,216,196,.2)!important}',
    '#ehub-hud{position:fixed;inset:0;pointer-events:none;z-index:60}',
    '#ehub-hud::before{content:"";position:absolute;inset:8px;border:1px solid rgba(36,216,196,.14);border-radius:4px}',
    '#ehub-hud .c{position:absolute;width:26px;height:26px;border:2px solid rgba(36,216,196,.55);filter:drop-shadow(0 0 6px rgba(36,216,196,.5))}',
    '#ehub-hud .tl{top:12px;left:12px;border-right:0;border-bottom:0}#ehub-hud .tr{top:12px;right:12px;border-left:0;border-bottom:0}',
    '#ehub-hud .bl{bottom:12px;left:12px;border-right:0;border-top:0}#ehub-hud .br{bottom:12px;right:12px;border-left:0;border-top:0}'
  ].join("");
  function ensureHud(k) {
    var on = k === "smart-city", st = document.getElementById("ehub-hud-style");
    if (on && !st) { st = document.createElement("style"); st.id = "ehub-hud-style"; st.textContent = HUD_CSS; (document.head || document.documentElement).appendChild(st); }
    else if (!on && st) { st.parentNode.removeChild(st); }
    function ov() {
      var o = document.getElementById("ehub-hud");
      if (on && !o) { o = document.createElement("div"); o.id = "ehub-hud"; o.setAttribute("aria-hidden", "true"); o.innerHTML = '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>'; document.body.appendChild(o); }
      else if (!on && o) { o.parentNode.removeChild(o); }
    }
    if (document.body) ov(); else document.addEventListener("DOMContentLoaded", ov);
  }
  /* 各主題專屬按鈕語言。dual selector：工具 data-ehub-theme + 首頁 data-theme 共用同一份。
     首頁另有一份相同 CSS(它不載 theme.js),兩邊要同步改。 */
  var BTN_CSS = [
    /* 童真趣味 playful：純虛線/實線框,無 3D 陰影(使用者要求拿掉歪陰影) */
    'html[data-ehub-theme="playful"] .btn,html[data-theme="playful"] .btn{border-radius:999px!important;border:2.5px solid #e0662a!important;font-weight:800!important;box-shadow:none!important;transition:transform .15s cubic-bezier(.34,1.56,.64,1)!important}',
    'html[data-ehub-theme="playful"] .btn:hover,html[data-theme="playful"] .btn:hover{transform:translateY(-1px) scale(1.03)!important}',
    'html[data-ehub-theme="playful"] .btn:active,html[data-theme="playful"] .btn:active{transform:scale(.97)!important}',
    'html[data-ehub-theme="playful"] .btn.go,html[data-ehub-theme="playful"] .btn-primary,html[data-theme="playful"] .btn.go,html[data-theme="playful"] .btn-primary{background:linear-gradient(135deg,#ffb572,#ff7e3d)!important;color:#fff!important;border:2.5px solid #e0662a!important}',
    'html[data-ehub-theme="playful"] .btn.ghost,html[data-ehub-theme="playful"] .btn-ghost,html[data-theme="playful"] .btn.ghost,html[data-theme="playful"] .btn-ghost{background:#fffdf2!important;border:2.5px dashed #f0a050!important;color:#c75a1f!important}',
    'html[data-ehub-theme="playful"] .btn.danger,html[data-theme="playful"] .btn.danger{border:2.5px solid #e04848!important;color:#c0392b!important;background:#fff5f5!important}',
    'html[data-ehub-theme="playful"] .iconbtn,html[data-theme="playful"] .iconbtn{border-radius:50%!important;border:2.5px dashed #f0b878!important}',
    /* 打字機 typewriter：鍵帽,按下去 key travel(對稱底邊,不歪) */
    'html[data-ehub-theme="typewriter"] .btn,html[data-theme="typewriter"] .btn{border-radius:5px!important;border:1.5px solid #8a7a5e!important;background:#fbf5ea!important;color:#3a2f1e!important;font-family:\'Courier New\',monospace!important;font-weight:700!important;box-shadow:0 3px 0 #b9a886!important;transition:transform .07s,box-shadow .07s!important}',
    'html[data-ehub-theme="typewriter"] .btn:active,html[data-theme="typewriter"] .btn:active{transform:translateY(3px)!important;box-shadow:0 0 0 #b9a886!important}',
    'html[data-ehub-theme="typewriter"] .btn.go,html[data-ehub-theme="typewriter"] .btn-primary,html[data-theme="typewriter"] .btn.go,html[data-theme="typewriter"] .btn-primary{background:#8a3a18!important;color:#f4ece0!important;border:1.5px solid #5e2710!important;box-shadow:0 3px 0 #5e2710!important}',
    'html[data-ehub-theme="typewriter"] .btn.go:active,html[data-ehub-theme="typewriter"] .btn-primary:active,html[data-theme="typewriter"] .btn.go:active,html[data-theme="typewriter"] .btn-primary:active{transform:translateY(3px)!important;box-shadow:0 0 0 #5e2710!important}',
    /* 太空科幻 cosmic：霓虹發光 */
    'html[data-ehub-theme="cosmic"] .btn,html[data-theme="cosmic"] .btn{border-radius:6px!important;border:1.5px solid rgba(0,212,255,.5)!important;background:rgba(0,212,255,.06)!important;color:#bfefff!important;letter-spacing:.03em;transition:box-shadow .18s,transform .12s!important}',
    'html[data-ehub-theme="cosmic"] .btn:hover,html[data-theme="cosmic"] .btn:hover{box-shadow:0 0 16px rgba(0,212,255,.5),inset 0 0 10px rgba(0,212,255,.15)!important;border-color:#36d3ff!important;transform:translateY(-1px)!important}',
    'html[data-ehub-theme="cosmic"] .btn.go,html[data-ehub-theme="cosmic"] .btn-primary,html[data-theme="cosmic"] .btn.go,html[data-theme="cosmic"] .btn-primary{background:linear-gradient(135deg,rgba(0,212,255,.28),rgba(0,212,255,.1))!important;color:#eaffff!important;border:1.5px solid #36d3ff!important;box-shadow:0 0 14px rgba(0,212,255,.4)!important}',
    /* 智慧城市 smart-city：HUD 銳角發光 */
    'html[data-ehub-theme="smart-city"] .btn,html[data-theme="smart-city"] .btn{border-radius:3px!important;border:1.5px solid rgba(36,216,196,.5)!important;background:rgba(36,216,196,.06)!important;color:#aef0e7!important;font-family:ui-monospace,Consolas,monospace!important;transition:box-shadow .18s!important}',
    'html[data-ehub-theme="smart-city"] .btn:hover,html[data-theme="smart-city"] .btn:hover{box-shadow:0 0 16px rgba(36,216,196,.45)!important;border-color:#34d8c4!important}',
    'html[data-ehub-theme="smart-city"] .btn.go,html[data-ehub-theme="smart-city"] .btn-primary,html[data-theme="smart-city"] .btn.go,html[data-theme="smart-city"] .btn-primary{background:linear-gradient(135deg,rgba(36,216,196,.24),rgba(36,216,196,.08))!important;color:#dffaf5!important;border:1.5px solid #34d8c4!important;box-shadow:0 0 14px rgba(36,216,196,.4)!important}',
    /* 經典 classic：俐落企業 */
    'html[data-ehub-theme="classic"] .btn:hover,html[data-theme="classic"] .btn:hover{transform:translateY(-1px)!important;box-shadow:0 6px 16px -6px rgba(22,34,58,.28)!important}',
    /* ===== 全面 skin：卡片 / 輸入框(安全屬性,不動版面) ===== */
    'html[data-ehub-theme="playful"] .card,html[data-theme="playful"] .card{border:2px solid #f0c896!important;border-radius:18px!important}',
    'html[data-ehub-theme="playful"] input:not([type=checkbox]):not([type=radio]):not([type=file]),html[data-ehub-theme="playful"] select,html[data-ehub-theme="playful"] textarea,html[data-theme="playful"] input:not([type=checkbox]):not([type=radio]):not([type=file]),html[data-theme="playful"] select,html[data-theme="playful"] textarea{border:2px solid #f0c896!important;border-radius:12px!important}',
    'html[data-ehub-theme="playful"] input:focus,html[data-ehub-theme="playful"] select:focus,html[data-ehub-theme="playful"] textarea:focus,html[data-theme="playful"] input:focus,html[data-theme="playful"] select:focus,html[data-theme="playful"] textarea:focus{border-color:#ff8845!important;box-shadow:0 0 0 3px rgba(255,136,69,.18)!important;outline:none!important}',
    'html[data-ehub-theme="typewriter"] .card,html[data-theme="typewriter"] .card{border:1px solid #d2c4ab!important;box-shadow:1px 1px 0 rgba(42,36,26,.05)!important}',
    'html[data-ehub-theme="typewriter"] input:not([type=checkbox]):not([type=radio]):not([type=file]),html[data-ehub-theme="typewriter"] select,html[data-ehub-theme="typewriter"] textarea,html[data-theme="typewriter"] input:not([type=checkbox]):not([type=radio]):not([type=file]),html[data-theme="typewriter"] select,html[data-theme="typewriter"] textarea{border:none!important;border-bottom:1.5px solid #b9a886!important;border-radius:0!important;background:transparent!important;font-family:\'Courier New\',monospace!important}',
    'html[data-ehub-theme="typewriter"] input:focus,html[data-ehub-theme="typewriter"] select:focus,html[data-ehub-theme="typewriter"] textarea:focus,html[data-theme="typewriter"] input:focus,html[data-theme="typewriter"] select:focus,html[data-theme="typewriter"] textarea:focus{border-bottom-color:#8a3a18!important;box-shadow:0 1px 0 #8a3a18!important;outline:none!important}',
    'html[data-ehub-theme="cosmic"] .card,html[data-theme="cosmic"] .card{border-color:rgba(0,212,255,.4)!important;box-shadow:0 0 0 1px rgba(0,212,255,.18),0 0 22px rgba(0,212,255,.1)!important}',
    'html[data-ehub-theme="cosmic"] input:not([type=checkbox]):not([type=radio]):not([type=file]),html[data-ehub-theme="cosmic"] select,html[data-ehub-theme="cosmic"] textarea,html[data-theme="cosmic"] input:not([type=checkbox]):not([type=radio]):not([type=file]),html[data-theme="cosmic"] select,html[data-theme="cosmic"] textarea{border:1px solid rgba(0,212,255,.4)!important;background:rgba(0,212,255,.05)!important}',
    'html[data-ehub-theme="cosmic"] input:focus,html[data-ehub-theme="cosmic"] select:focus,html[data-ehub-theme="cosmic"] textarea:focus,html[data-theme="cosmic"] input:focus,html[data-theme="cosmic"] select:focus,html[data-theme="cosmic"] textarea:focus{box-shadow:0 0 12px rgba(0,212,255,.45)!important;border-color:#36d3ff!important;outline:none!important}',
    'html[data-ehub-theme="smart-city"] input:not([type=checkbox]):not([type=radio]):not([type=file]),html[data-ehub-theme="smart-city"] select,html[data-ehub-theme="smart-city"] textarea,html[data-theme="smart-city"] input:not([type=checkbox]):not([type=radio]):not([type=file]),html[data-theme="smart-city"] select,html[data-theme="smart-city"] textarea{border:1px solid rgba(36,216,196,.4)!important;background:rgba(36,216,196,.05)!important;font-family:ui-monospace,Consolas,monospace!important}',
    'html[data-ehub-theme="smart-city"] input:focus,html[data-ehub-theme="smart-city"] select:focus,html[data-ehub-theme="smart-city"] textarea:focus,html[data-theme="smart-city"] input:focus,html[data-theme="smart-city"] select:focus,html[data-theme="smart-city"] textarea:focus{box-shadow:0 0 12px rgba(36,216,196,.45)!important;border-color:#34d8c4!important;outline:none!important}',
    /* 搜尋框等「外層 pill 才是框」的 input 維持無邊,別被上面的 input skin 加出框中框 */
    'html[data-ehub-theme] .search input:not([type=checkbox]):not([type=radio]):not([type=file]),html[data-ehub-theme] .search input:focus,html[data-theme] .search input:not([type=checkbox]):not([type=radio]):not([type=file]),html[data-theme] .search input:focus{border:none!important;background:none!important;box-shadow:none!important;border-radius:0!important}'
  ].join("");
  function ensureBtnStyle(){if(document.getElementById("ehub-btn-style"))return;var st=document.createElement("style");st.id="ehub-btn-style";st.textContent=BTN_CSS;(document.head||document.documentElement).appendChild(st);}
  function apply(k) { var v = SHELL[k] || SHELL.classic, r = document.documentElement; r.setAttribute("data-ehub-theme", k); for (var p in v) r.style.setProperty(p, v[p]); r.style.colorScheme=(k==="cosmic"||k==="smart-city")?"dark":"light"; ensureFontStyle(); ensureHud(k); ensureBtnStyle(); }
  apply(getTheme());
  window.addEventListener("storage", function (e) { if (e.key === "ehub_theme") apply(getTheme()); });
  window.EHubTheme = { apply: apply, get: getTheme };
})();

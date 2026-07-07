/* ===================================================================
   企業平台 — 測試階段共用資料層（localStorage 模擬 DB）
   單一資料來源：公告 / 會議室的「前台 / 首頁 / 後台」全部讀寫同一份。
   接後端時：把 load/save 系列函式換成 API 呼叫即可，其餘呼叫端不必動。
   =================================================================== */
(function (global) {
  "use strict";

  /* ---- 安全讀寫：file:// 或隱私模式 localStorage 可能丟例外，退回記憶體 ---- */
  var mem = {}; /* mem 只保存「寫入失敗的影子」：寫成功即刪、寫失敗才留。讀取一律優先 mem。 */
  function lsGet(k){ if(k in mem) return mem[k]; try { return localStorage.getItem(k); } catch(e){ return null; } }
  function lsSet(k,v){ try { localStorage.setItem(k,v); delete mem[k]; } catch(e){ console.warn("[EHub] localStorage 寫入失敗（可能已滿）:", k, e && e.name); mem[k]=v; } }
  function lsDel(k){ delete mem[k]; try { localStorage.removeItem(k); } catch(e){} }
  function storageDegraded(){ return Object.keys(mem).length>0; }
  function ssGet(k){ try { return sessionStorage.getItem(k); } catch(e){ return (k in mem)? mem[k] : null; } }
  function ssSet(k,v){ try { sessionStorage.setItem(k,v); } catch(e){ mem[k]=v; } }

  /* ---- 日期工具 ---- */
  function pad(n){ return String(n).padStart(2,"0"); }
  function ymd(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
  function addDays(d,n){ var x=new Date(d); x.setDate(x.getDate()+n); return x; }
  function today0(){ var d=new Date(); d.setHours(0,0,0,0); return d; }
  function mondayOf(d){ var x=new Date(d); x.setHours(0,0,0,0); var wd=(x.getDay()+6)%7; return addDays(x,-wd); }

  /* ---- 身分 / session（首頁登入寫入，各工具讀取）---- */
  function getSession(){ var s=lsGet("ehub_session"); if(!s) return null; try { return JSON.parse(s); } catch(e){ return null; } }
  function setSession(s){ lsSet("ehub_session", JSON.stringify(s)); lsSet("ehub_role", s.role); }
  function clearSession(){ lsDel("ehub_session"); lsDel("ehub_role"); try{ sessionStorage.removeItem("ehub_admin_preview"); }catch(e){ delete mem["ehub_admin_preview"]; } }
  function getRole(){ return lsGet("ehub_role") || "user"; }
  /* 後台「以管理者繼續(測試)」：只在「本分頁」臨時提權，關閉分頁即失效，不污染全域 session */
  function previewAdmin(){ ssSet("ehub_admin_preview","1"); }
  function isAdmin(){ return getRole()==="admin" || ssGet("ehub_admin_preview")==="1"; }

  /* ================= 公告 ================= */
  var ANN_KEY = "ehub_announcements_v2";
  var SEED_ANN = [
    {id:1,title:"端午連假公告：6/20–6/22 休假",cat:"重要",pinned:true,date:"2026-06-18",by:"管理部",
     body:"端午連假 6/20(五)~6/22(日) 共三天，6/23(一) 正常上班。連假期間大樓門禁啟用，如需加班請事先申請。",att:[{name:"端午活動海報.jpg",type:"image/jpeg",data:"08_共用/ann/duanwu.jpg"}]},
    {id:2,title:"資訊系統維護通知（本週六 22:00）",cat:"系統",pinned:false,date:"2026-06-17",by:"資訊部",
     body:"本週六 22:00–24:00 進行伺服器維護，期間 ERP 與差勤系統暫停服務，請提前完成送單。"},
    {id:3,title:"七月份員工健檢開始報名",cat:"活動",pinned:false,date:"2026-06-16",by:"人資部",
     body:"40 歲以上同仁免費健檢，請於 6/30 前至人資系統報名，名額有限額滿為止。",att:[{name:"健檢宣傳海報.jpg",type:"image/jpeg",data:"08_共用/ann/health.jpg"},{name:"健檢項目說明.txt",type:"text/plain",data:"08_共用/ann/健檢項目說明.txt"}]},
    {id:4,title:"差旅費報銷新制上路",cat:"一般",pinned:false,date:"2026-06-12",by:"財務部",
     body:"自 7/1 起差旅費改為線上報銷，紙本單據需掃描上傳，核銷週期縮短為 5 個工作天。",att:[{name:"報銷新制說明.txt",type:"text/plain",data:"08_共用/ann/報銷新制說明.txt"}]},
    {id:5,title:"新版識別證換發",cat:"一般",pinned:false,date:"2026-06-10",by:"總務部",
     body:"舊識別證 7/15 停用，請各部門彙整至總務部換發，遺失補發酌收工本費。",att:[{name:"新識別證樣式.jpg",type:"image/jpeg",data:"08_共用/ann/idcard.jpg"}]},
    {id:6,title:"資訊部內部：測試環境啟用通知",cat:"系統",pinned:false,date:"2026-06-19",by:"資訊部",
     body:"資訊部測試環境已啟用，僅供資訊部同仁測試，請勿外流測試帳密。（此為部門限定公告示範，僅資訊部看得到）",att:[],aud:{scope:"dept",dept:"資訊部"}}
  ];
  function loadAnn(){
    var r=lsGet(ANN_KEY);
    if(r){ try{ var a=JSON.parse(r); if(Array.isArray(a)) return a; }catch(e){} }
    var seed = SEED_ANN.map(function(x){ return Object.assign({},x); });
    lsSet(ANN_KEY, JSON.stringify(seed));
    return seed;
  }
  function saveAnn(list){ lsSet(ANN_KEY, JSON.stringify(list)); }
  /* 公告可見性：時間窗(pubAt 上架/expAt 下架,空=立即/永不) + 對象(all/dept/person)。
     舊公告無這些欄位 → 預設立即上架、永不下架、全公司可見(相容)。 */
  function deptOf(name){ var p=PEOPLE.find(function(x){return x.name===name;}); if(p)return p.dept; var u=USERS.find(function(x){return x.name===name;}); return u?u.dept:""; }
  function annVisibleTo(a, userName, now){
    now = now || Date.now();
    if(a.pubAt){ var ts=new Date(a.pubAt).getTime(); if(!isNaN(ts) && now<ts) return false; }
    if(a.expAt){ var te=new Date(a.expAt).getTime(); if(!isNaN(te) && now>te) return false; }
    var aud=a.aud||{scope:"all"};
    if(aud.scope==="dept") return deptOf(userName)===aud.dept;
    if(aud.scope==="person") return userName===aud.person;
    return true;
  }

  /* ================= 會議室 =================
     book = { 'YYYY-MM-DD': [ {s,e,title,name,dept} ] }；seed 以「今天」為基準，
     存檔記下 base 日期，跨天再開會自動重新 seed（demo 資料永遠貼齊今天）。 */
  var ROOM_KEY = "ehub_rooms_v1";
  function seedRooms(){
    var D = function(n){ return ymd(addDays(today0(), n)); };
    return [
      {id:"A",name:"A 會議室（大）",cap:14,loc:"3F",feat:["視訊","白板","投影"],
       notes:["使用後請將桌椅復原","投影需自備 HDMI／Type-C 轉接","禁帶氣味重的食物"],
       book:{[D(0)]:[{s:"09:00",e:"10:30",title:"部門週會",name:"林志明",dept:"管理部"},
                     {s:"13:00",e:"17:30",title:"AI 討論會議",name:"王大明",dept:"業務部"}],
             [D(1)]:[{s:"10:00",e:"12:00",title:"新人教育訓練",name:"黃淑芬",dept:"人資部"}]}},
      {id:"B",name:"B 會議室（中）",cap:8,loc:"3F",feat:["白板","投影"],
       notes:["離開請關燈與冷氣","白板筆用畢歸位"],
       book:{[D(0)]:[{s:"11:00",e:"12:00",title:"供應商洽談",name:"陳怡君",dept:"採購部"}],
             [D(2)]:[{s:"14:00",e:"15:00",title:"部門檢討會",name:"林志明",dept:"管理部"}]}},
      {id:"C",name:"C 會議室（小）",cap:4,loc:"5F",feat:["電視"],
       notes:["僅供 4 人以內小型討論","電視以 Type-C 連接"],
       book:{[D(0)]:[{s:"10:00",e:"11:00",title:"一對一面談",name:"黃淑芬",dept:"人資部"},
                     {s:"14:00",e:"15:30",title:"專案同步會",name:"張家豪",dept:"研發部"}]}},
      {id:"D",name:"D 視訊室",cap:6,loc:"5F",feat:["視訊","收音麥克風"],
       notes:["視訊設備請勿移動","會議結束務必登出帳號"],
       book:{[D(0)]:[{s:"16:00",e:"18:00",title:"海外客戶視訊",name:"吳敏華",dept:"業務部"}],
             [D(1)]:[{s:"09:30",e:"10:30",title:"遠距面試",name:"黃淑芬",dept:"人資部"}]}},
      {id:"E",name:"E 簡報室",cap:20,loc:"6F",feat:["階梯座","音響","投影"],
       notes:["大型簡報／教育訓練優先","音響音量請適中","散場請帶走個人物品"],
       book:{[D(3)]:[{s:"09:00",e:"12:00",title:"季度業務大會",name:"吳敏華",dept:"業務部"}]}}
    ];
  }
  function loadRooms(){
    // 只在無資料時 seed；有資料一律保留（不再因跨天重 seed，避免砍掉使用者預約）
    var r = lsGet(ROOM_KEY);
    if(r){ try{ var o=JSON.parse(r); if(o && Array.isArray(o.rooms)) return o.rooms; }catch(e){} }
    var rooms = seedRooms();
    lsSet(ROOM_KEY, JSON.stringify({base:ymd(today0()), rooms:rooms}));
    return rooms;
  }
  function saveRooms(rooms){ lsSet(ROOM_KEY, JSON.stringify({base:ymd(today0()), rooms:rooms})); }

  /* ================= 共用常數 / 工具 ================= */
  /* 預約人 / 一般使用者池（名字與工單通、簽呈一致，登入身分跨工具一致）*/
  var USERS = [
    {name:"王小明",dept:"業務部"},{name:"周思妤",dept:"業務部"},{name:"周文彬",dept:"業務部"},
    {name:"林淑芬",dept:"總經理室"},{name:"陳大華",dept:"資訊部"},{name:"系統管理員",dept:"資訊部"},
    {name:"張偉",dept:"行政部"},{name:"鄭雅文",dept:"行政部"},
    {name:"李美玲",dept:"財務部"},{name:"吳佩珊",dept:"人資部"}
  ];
  var CAT = {
    "一般":{c:"#5C6B82",bg:"#EBEEF3"},
    "重要":{c:"#C0392B",bg:"#F8E7E4"},
    "活動":{c:"#2F8F5B",bg:"#E4F1E9"},
    "系統":{c:"#2563A8",bg:"#E5EFF8"}
  };
  function esc(s){ return String(s).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

  /* ================= 人員 / 壽星 / 新進同仁 ================= */
  var PEOPLE = [
    {name:"王小明",   dept:"業務部", title:"業務專員",   birthday:"06-08", joinDate:"2021-03-01", intro:""},
    {name:"周思妤",   dept:"業務部", title:"業務助理",   birthday:"06-22", joinDate:"2026-06-01", intro:"應屆畢業新鮮人，負責客戶資料整理與報價支援，請大家多多指教。"},
    {name:"林淑芬",   dept:"總經理室", title:"總經理",   birthday:"11-15", joinDate:"2019-07-15", intro:""},
    {name:"陳大華",   dept:"資訊部", title:"系統工程師", birthday:"06-18", joinDate:"2022-09-01", intro:""},
    {name:"系統管理員", dept:"資訊部", title:"系統管理員", birthday:"01-01", joinDate:"2018-01-01", intro:""},
    {name:"周文彬",   dept:"業務部", title:"業務部主管", birthday:"10-12", joinDate:"2020-04-06", intro:""},
    {name:"張偉",     dept:"行政部", title:"行政專員",   birthday:"06-30", joinDate:"2026-05-20", intro:"前任職於物流業，負責總務採購與會議室管理。"},
    {name:"鄭雅文",   dept:"行政部", title:"行政部主管", birthday:"09-09", joinDate:"2020-02-10", intro:""},
    {name:"李美玲",   dept:"財務部", title:"會計",       birthday:"06-25", joinDate:"2023-11-01", intro:""},
    {name:"吳佩珊",   dept:"人資部", title:"人資專員",   birthday:"03-03", joinDate:"2024-08-01", intro:""}
  ];
  function birthdaysThisMonth(){
    var m = today0().getMonth()+1;
    return PEOPLE.filter(function(p){ return p.birthday && Number(p.birthday.split("-")[0])===m; })
                 .sort(function(a,b){ return Number(a.birthday.split("-")[1])-Number(b.birthday.split("-")[1]); });
  }
  function newHires(days){
    days = days || 60;
    var t0=today0(), cut=ymd(addDays(t0,-days)), now=ymd(t0);
    return PEOPLE.filter(function(p){ return p.joinDate && p.joinDate>=cut && p.joinDate<=now; })
                 .sort(function(a,b){ return a.joinDate<b.joinDate?1:-1; });
  }

  /* ================= 工具通知紅點 =================
     正式版各工具自行寫入「待該使用者處理」數；此處測試：calendar 由逾期待辦即時算，其餘讀種子。 */
  var BADGE_KEY = "ehub_badges_v2"; // v2: 加周文彬/林淑芬種子,bump 版本讓舊 localStorage 自動重新 seed(免手動重置)
  var SEED_BADGES = { "王小明":{ticket:1, signoff:1}, "周文彬":{ticket:1, signoff:1}, "林淑芬":{signoff:1}, "系統管理員":{ticket:1} };  // 首載種子(首頁首登即亮);進工具後由 syncTicketBadge/syncSignoffBadges 即時覆寫為實算
  function loadBadges(){ var r=lsGet(BADGE_KEY); if(r){try{var o=JSON.parse(r);if(o&&typeof o==="object")return o;}catch(e){}} var s=Object.assign({},SEED_BADGES); lsSet(BADGE_KEY,JSON.stringify(s)); return s; }
  function saveBadges(m){ lsSet(BADGE_KEY, JSON.stringify(m)); }
  function badgeFor(name, key){
    if(key==="calendar"){ var T=ymd(today0()); return loadTodos().filter(function(x){ return (x.scope||"me")!=="dept" && x.owner===name && !x.done && x.due && x.due<T; }).length; }
    var m=loadBadges(); return (m[name]||{})[key] || 0;
  }

  /* ================= 跨模組通知中心（首頁鈴鐺單一來源）=================
     name-addressed（各工具內部 NOTIFS 是 uid-addressed，兩者分開）。
     工具動作 → EHub.pushNotif()；首頁讀 to===登入者。seed 對齊 SEED_BADGES 的待辦情境。
     接後端時：loadNotifs/pushNotif 換成 API，呼叫端不必動。 */
  var NOTIF_KEY = "ehub_notifs_v1";
  function seedNotifs(){
    var H=3600*1000, t=Date.now();
    return [
      {id:1, to:"王小明",   mod:"ticket",  text:"你的工單（人體工學椅）被退回，需要你補充資料。",            link:"02_工單通/index.html#/t/k4",  at:t-18*H, read:false},
      {id:2, to:"王小明",   mod:"signoff", text:"你的簽呈（3F 辦公室空間規劃）被退回重擬。",                  link:"03_電子簽呈/index.html#/d/s3", at:t-45*H, read:false},
      {id:3, to:"周文彬",   mod:"ticket",  text:"王小明 送出主管簽核：南區客戶拜訪差旅預支，待你核准。",      link:"02_工單通/index.html#/t/k11", at:t-5*H,  read:false},
      {id:4, to:"周文彬",   mod:"signoff", text:"王小明 送簽：2026 年度教育訓練計畫，待你核定。",            link:"03_電子簽呈/index.html#/d/s1", at:t-20*H, read:false},
      {id:5, to:"林淑芬",   mod:"signoff", text:"資安政策更新（密碼與 VPN 規範）已完成部分會簽，待你最終核定。", link:"03_電子簽呈/index.html#/d/s4", at:t-1*H,  read:false},
      {id:6, to:"系統管理員", mod:"ticket",  text:"陳大華 送出簽核：申請正式機資料庫只讀權限，待你核准。",      link:"02_工單通/index.html#/t/k3",  at:t-12*H, read:false}
    ];
  }
  function loadNotifs(){ var r=lsGet(NOTIF_KEY); if(r){try{var a=JSON.parse(r);if(Array.isArray(a))return a;}catch(e){}} var s=seedNotifs(); lsSet(NOTIF_KEY,JSON.stringify(s)); return s; }
  function saveNotifs(list){ lsSet(NOTIF_KEY, JSON.stringify(list)); }
  function pushNotif(o){ if(!o||!o.to) return; var list=loadNotifs(); var id=list.reduce(function(m,n){return Math.max(m,n.id||0);},0)+1; list.unshift({id:id,to:o.to,mod:o.mod||"",text:o.text||"",link:o.link||"",at:o.at||Date.now(),read:false}); saveNotifs(list); }
  function notifsFor(name){ return loadNotifs().filter(function(n){return n.to===name;}).sort(function(a,b){return (b.at||0)-(a.at||0);}); }
  function unreadNotifs(name){ return loadNotifs().filter(function(n){return n.to===name && !n.read;}).length; }
  function markNotifRead(id){ var list=loadNotifs(),ch=false; list.forEach(function(n){if(n.id===id&&!n.read){n.read=true;ch=true;}}); if(ch)saveNotifs(list); }
  function markAllNotifsRead(name){ var list=loadNotifs(),ch=false; list.forEach(function(n){if(n.to===name&&!n.read){n.read=true;ch=true;}}); if(ch)saveNotifs(list); }
  function relTime(at){ var s=Math.floor((Date.now()-(at||0))/1000); if(s<60)return "剛剛"; var m=Math.floor(s/60); if(m<60)return m+" 分鐘前"; var h=Math.floor(m/60); if(h<24)return h+" 小時前"; var d=Math.floor(h/24); return d+" 天前"; }

  /* ================= 部門行事曆 =================
     每人登打自己的會議，部門互看（別人的唯讀）。event = {id,owner,dept,date,s,e,title,loc}
     種子事件落在「首次開啟的當週」週一~週五。 */
  var CAL_KEY = "ehub_calendar_v1";
  function seedCal(){
    var mon = mondayOf(today0()), W = function(n){ return ymd(addDays(mon,n)); };
    return [
      {id:1, owner:"林淑芬",   dept:"總經理室", date:W(0), s:"09:30", e:"10:30", title:"經營管理週會",   loc:"A 會議室"},
      {id:2, owner:"林淑芬",   dept:"總經理室", date:W(2), s:"14:00", e:"15:00", title:"與策略夥伴視訊會議", loc:"D 視訊室"},
      {id:3, owner:"林淑芬",   dept:"總經理室", date:W(4), s:"09:00", e:"09:30", title:"各部門主管月會", loc:"A 會議室"},
      {id:4, owner:"陳大華",   dept:"資訊部", date:W(0), s:"11:00", e:"12:00", title:"資安教育訓練",   loc:"E 簡報室"},
      {id:5, owner:"陳大華",   dept:"資訊部", date:W(3), s:"10:00", e:"11:30", title:"程式碼審查",     loc:"線上"},
      {id:6, owner:"陳大華",   dept:"資訊部", date:W(4), s:"09:00", e:"09:30", title:"部門週會",       loc:"A 會議室"},
      {id:7, owner:"系統管理員", dept:"資訊部", date:W(1), s:"15:00", e:"16:00", title:"伺服器維護準備", loc:"機房"},
      {id:8, owner:"系統管理員", dept:"資訊部", date:W(4), s:"09:00", e:"09:30", title:"部門週會",       loc:"A 會議室"},
      {id:9, owner:"王小明",   dept:"業務部", date:W(1), s:"13:30", e:"15:00", title:"客戶提案",       loc:"B 會議室"},
      {id:10,owner:"周思妤",   dept:"業務部", date:W(2), s:"10:00", e:"11:00", title:"業績檢討",       loc:"B 會議室"},
      {id:11,owner:"周文彬",   dept:"業務部", date:W(4), s:"09:00", e:"10:00", title:"業務部待辦檢視", loc:"B 會議室"},
      {id:12,owner:"鄭雅文",   dept:"行政部", date:W(3), s:"14:00", e:"15:00", title:"採購協調會",     loc:"C 會議室"}
    ];
  }
  function loadCal(){
    var r=lsGet(CAL_KEY);
    if(r){ try{ var a=JSON.parse(r); if(Array.isArray(a)) return ensureCalendarSeeds(a); }catch(e){} }
    var seed=seedCal(); lsSet(CAL_KEY, JSON.stringify(seed)); return seed;
  }
  function saveCal(list){ lsSet(CAL_KEY, JSON.stringify(list)); }
  function ensureCalendarSeeds(list){
    var GM_CAL_FIX={"行銷活動檢討":"經營管理週會","與設計供應商視訊":"與策略夥伴視訊會議","行銷部週會":"各部門主管月會"};
    list.forEach(function(e){
      if(e.owner==="林淑芬"){ // 林淑芬→總經理(脫離行銷部):dept+行銷標題舊資料一併遷移
        if(e.dept!=="總經理室") e.dept="總經理室";
        if(GM_CAL_FIX[e.title]) e.title=GM_CAL_FIX[e.title];
      }
    });
    if(!list.some(function(e){return e.owner==="周文彬"&&e.title==="業務部待辦檢視";})){
      var mon=mondayOf(today0()), id=list.reduce(function(m,e){return Math.max(m,e.id||0);},0)+1;
      list.push({id:id,owner:"周文彬",dept:"業務部",date:ymd(addDays(mon,4)),s:"09:00",e:"10:00",title:"業務部待辦檢視",loc:"B 會議室"});
      saveCal(list);
    }
    return list;
  }

  /* ================= 待辦（個人，行事曆內）=================
     todo = {id, owner, text, due:'YYYY-MM-DD'|'', done, doneAt}；done=true 即進「備存」。 */
  var TODO_KEY = "ehub_todos_v2";   // scope: 'me'(個人,只有 owner 看) / 'dept'(部門共用)
  function seedTodos(){
    var t0=today0();
    return [
      {id:1, scope:"me",   owner:"林淑芬",   text:"完成系統上線前檢查清單", due:ymd(addDays(t0,1)),  done:false, doneAt:""},
      {id:2, scope:"me",   owner:"林淑芬",   text:"回覆供應商報價單",       due:ymd(t0),            done:false, doneAt:""},
      {id:3, scope:"me",   owner:"林淑芬",   text:"整理上週會議記錄",       due:ymd(addDays(t0,-1)), done:true,  doneAt:ymd(addDays(t0,-1))},
      {id:4, scope:"me",   owner:"系統管理員", text:"驗證每日備份",          due:ymd(addDays(t0,2)),  done:false, doneAt:""},
      {id:5, scope:"dept", dept:"總經理室", owner:"林淑芬", text:"審閱各部門季度經營報告", due:ymd(addDays(t0,5)), done:false, doneAt:""},
      {id:6, scope:"dept", dept:"資訊部", owner:"陳大華", text:"更新部門資產清冊",   due:ymd(addDays(t0,3)), done:false, doneAt:""},
      {id:7, scope:"dept", dept:"業務部", owner:"王小明", text:"彙整本季客戶名單",   due:ymd(addDays(t0,2)), done:false, doneAt:""},
      {id:8, scope:"dept", dept:"業務部", owner:"周文彬", text:"確認本週業務部共同待辦", due:ymd(addDays(t0,1)), done:false, doneAt:""}
    ];
  }
  function loadTodos(){
    var r=lsGet(TODO_KEY);
    if(r){ try{ var a=JSON.parse(r); if(Array.isArray(a)) return ensureTodoSeeds(a); }catch(e){} }
    var seed=seedTodos(); lsSet(TODO_KEY, JSON.stringify(seed)); return seed;
  }
  function saveTodos(list){ lsSet(TODO_KEY, JSON.stringify(list)); }
  function ensureTodoSeeds(list){
    list.forEach(function(t){
      if(t.owner==="林淑芬"&&t.dept&&t.dept!=="總經理室") t.dept="總經理室"; // 林淑芬→總經理,舊部門待辦遷移
      if(t.owner==="林淑芬"&&(t.text==="季度系統安全盤點"||t.text==="季度行銷素材盤點")) t.text="審閱各部門季度經營報告";
    });
    if(!list.some(function(t){return t.owner==="周文彬"&&t.text==="確認本週業務部共同待辦";})){
      var id=list.reduce(function(m,t){return Math.max(m,t.id||0);},0)+1;
      list.push({id:id,scope:"dept",dept:"業務部",owner:"周文彬",text:"確認本週業務部共同待辦",due:ymd(addDays(today0(),1)),done:false,doneAt:""});
      saveTodos(list);
    }
    return list;
  }

  /* ================= 名片系統（B2B 名片 / 客戶 CRM）=================
     參考舊「名片CRM」專案資料模型整合進平台。
     card = {id,name,company,title,phone,email,address,createdAt}
     intv(訪談) = {id,cardId,date,staff,type,summary,intent,next}  intent: 高/中/低/未知 */
  var CARD_KEY = "ehub_cards_v1", INTV_KEY = "ehub_interviews_v1";
  function seedCards(){ return [
    {id:1, name:"陳建國", company:"宏達科技", title:"採購經理",   phone:"02-2345-6789", email:"jianguo@hodatech.com", address:"台北市內湖區瑞光路 88 號", img:"../08_共用/att/card1.jpg", createdAt:"2026-06-10"},
    {id:2, name:"林雅婷", company:"全球物流", title:"業務總監",   phone:"0912-345-678", email:"yating@globallog.com",  address:"新北市新莊區中正路 100 號", img:"../08_共用/att/card2.jpg", createdAt:"2026-06-12"},
    {id:3, name:"王俊傑", company:"創新軟體", title:"技術長",     phone:"03-456-7890",  email:"jay@innosoft.io",       address:"新竹市東區光復路 200 號",  createdAt:"2026-06-15"},
    {id:4, name:"張美惠", company:"綠能環保", title:"執行長",     phone:"04-2222-3333", email:"meihui@greeneco.tw",    address:"台中市西屯區台灣大道 500 號", createdAt:"2026-06-16"}
  ]; }
  function seedIntv(){ return [
    {id:1, cardId:1, date:"2026-06-11", staff:"王小明", type:"合作意向調查", summary:"介紹產品線，對方對自動化方案有興趣。", intent:"高", next:"下週寄報價單"},
    {id:2, cardId:1, date:"2026-06-14", staff:"王小明", type:"基本拜訪",     summary:"確認需求規格與導入時程。",         intent:"高", next:"安排產品 demo"},
    {id:3, cardId:2, date:"2026-06-13", staff:"周思妤", type:"合作意向調查", summary:"初次接觸，需求尚不明確。",           intent:"中", next:"持續追蹤"},
    {id:4, cardId:3, date:"2026-06-15", staff:"林淑芬", type:"其他",         summary:"技術交流，目前無採購計畫。",         intent:"低", next:""}
  ]; }
  function loadCards(){ var r=lsGet(CARD_KEY); if(r){try{var a=JSON.parse(r);if(Array.isArray(a))return a;}catch(e){}} var s=seedCards(); lsSet(CARD_KEY,JSON.stringify(s)); return s; }
  function saveCards(list){ lsSet(CARD_KEY, JSON.stringify(list)); }
  function loadIntv(){ var r=lsGet(INTV_KEY); if(r){try{var a=JSON.parse(r);if(Array.isArray(a))return a;}catch(e){}} var s=seedIntv(); lsSet(INTV_KEY,JSON.stringify(s)); return s; }
  function saveIntv(list){ lsSet(INTV_KEY, JSON.stringify(list)); }

  /* ================= 功能權限控管 =================
     fixed=true 的功能全員固定開；fixed=false 為「選配功能」，需管理者於控管後台逐人授權。
     access = { '使用者名': [ 已授權的選配功能 key ] } */
  var FEATURES = [
    {key:"ticket",   name:"工單通",     fixed:true},
    {key:"signoff",  name:"電子簽呈",   fixed:true},
    {key:"room",     name:"會議室預約", fixed:true},
    {key:"announce", name:"公告布告欄", fixed:true},
    {key:"calendar", name:"部門行事曆", fixed:true},
    {key:"namecard", name:"名片系統",   fixed:false}
  ];
  function optionalFeatures(){ return FEATURES.filter(function(f){ return !f.fixed; }); }
  var ACCESS_KEY = "ehub_access_v1";
  var SEED_ACCESS = { "系統管理員":["namecard"], "林淑芬":["namecard"] };
  function loadAccess(){
    var r=lsGet(ACCESS_KEY);
    if(r){ try{ var o=JSON.parse(r); if(o && typeof o==="object") return o; }catch(e){} }
    var seed=Object.assign({}, SEED_ACCESS); lsSet(ACCESS_KEY, JSON.stringify(seed)); return seed;
  }
  function saveAccess(map){ lsSet(ACCESS_KEY, JSON.stringify(map)); }
  function grantsFor(name){ return loadAccess()[name] || []; }
  function canAccess(name, key){
    var f=null; for(var i=0;i<FEATURES.length;i++){ if(FEATURES[i].key===key){ f=FEATURES[i]; break; } }
    if(!f) return false;
    if(f.fixed) return true;
    return grantsFor(name).indexOf(key) >= 0;
  }

  /* ================= 個人檔案 profile =================
     照片 / 座右銘 / 興趣 / 喜好 / 自介；使用者可在「使用者設定」自行覆寫。
     photo：使用者上傳為 base64 dataURL；種子為 08_共用/avatars/ 下的檔名。 */
  var PROFILE_KEY = "ehub_profiles_v1";
  var AVATAR_BASE = "08_共用/avatars/"; // 首頁預設；工具可設 window.EHUB_AVATAR_BASE 覆寫
  var PHOTOS = {
    "王小明":"wang.png","周思妤":"zhou.png","周文彬":"zhouwb.png","林淑芬":"lin.png","陳大華":"chen.png",
    "系統管理員":"sys.png","張偉":"zhang.png","鄭雅文":"zheng.png","李美玲":"li.png","吳佩珊":"wu.png"
  };
  var PROFILE_SEED = {
    "周思妤":{motto:"請多多指教，有需要幫忙的隨時找我～", hobbies:["烘焙","追劇","桌遊","攝影"], likes:["珍奶微糖少冰","貓派","週末逛市集"], bio:"成功大學企業管理系應屆畢業，這是我的第一份正職工作。個性開朗、學習力強，目前負責客戶資料整理與報價支援，請前輩們多多指教！"},
    "張偉":{motto:"會議室或採購有任何需求，找我就對了。", hobbies:["路跑","登山","手沖咖啡","看棒球"], likes:["自己沖咖啡","中職兄弟象","戶外露營"], bio:"前任職於物流業 8 年，熟悉總務採購與後勤調度；現負責公司總務採購與會議室管理。做事細心、樂於協助同仁，歡迎多交流。"}
  };
  function loadProfiles(){ var r=lsGet(PROFILE_KEY); if(r){try{var o=JSON.parse(r);if(o&&typeof o==="object")return o;}catch(e){}} var s=JSON.parse(JSON.stringify(PROFILE_SEED)); lsSet(PROFILE_KEY,JSON.stringify(s)); return s; }
  function saveProfiles(m){ lsSet(PROFILE_KEY, JSON.stringify(m)); }
  function saveProfile(name, p){ var m=loadProfiles(); m[name]=Object.assign({}, m[name], p); saveProfiles(m); return m[name]; }
  function personOf(name){ for(var i=0;i<PEOPLE.length;i++) if(PEOPLE[i].name===name) return PEOPLE[i]; return {name:name,dept:"",title:""}; }
  function profileOf(name){ return Object.assign({}, personOf(name), loadProfiles()[name]||{}); }
  function avatarSrc(name){ var p=loadProfiles()[name]||{}; if(p.photo) return p.photo; if(PHOTOS[name]) return (global.EHUB_AVATAR_BASE||AVATAR_BASE)+PHOTOS[name]; return null; }
  function avatarHTML(name, size, opt){
    opt=opt||{}; var s=size||36, src=avatarSrc(name), r=opt.square?Math.round(s*0.26)+"px":"50%";
    var box='display:inline-grid;place-items:center;overflow:hidden;flex:none;width:'+s+'px;height:'+s+'px;border-radius:'+r+';';
    if(src) return '<span class="eh-av" style="'+box+'"><img src="'+esc(src)+'" alt="'+esc(name||"")+'" style="width:100%;height:100%;object-fit:cover;display:block"></span>';
    return '<span class="eh-av" style="'+box+'background:'+(opt.bg||"#E5EAF6")+';color:'+(opt.col||"#1E3A8A")+';font-weight:700;font-size:'+Math.round(s*0.42)+'px">'+esc(name?name[0]:"?")+'</span>';
  }

  /* 共用 lightbox：任何頁面點圖放大（×／點外面／Esc 關）*/
  function ensureLBCss(){
    if(document.getElementById("eh-lb-css"))return;
    var s=document.createElement("style"); s.id="eh-lb-css";
    s.textContent=".eh-lightbox{position:fixed;inset:0;background:rgba(8,12,22,.9);display:grid;place-items:center;z-index:9999;padding:30px;cursor:zoom-out}.eh-lightbox img{max-width:92vw;max-height:90vh;border-radius:10px;box-shadow:0 24px 70px rgba(0,0,0,.55)}.eh-lb-x{position:fixed;top:18px;right:22px;border:none;background:rgba(255,255,255,.16);color:#fff;width:40px;height:40px;border-radius:50%;font-size:23px;line-height:1;cursor:pointer}.eh-lb-x:hover{background:rgba(255,255,255,.28)}";
    document.head.appendChild(s);
  }
  function lightbox(src){
    if(!src)return; ensureLBCss();
    var ov=document.createElement("div"); ov.className="eh-lightbox";
    ov.innerHTML='<img src="'+src+'"><button class="eh-lb-x" aria-label="關閉">&times;</button>';
    function close(){ ov.remove(); document.removeEventListener("keydown",esc); }
    function esc(e){ if(e.key==="Escape")close(); }
    ov.addEventListener("click",close);
    document.body.appendChild(ov); document.addEventListener("keydown",esc);
  }
  /* 共用讀檔：圖片壓縮、其餘原樣，全部存 base64 data（可下載/持久）。cb(陣列) */
  function fmtBytes(b){ return b<1024?b+" B":b<1048576?(b/1024).toFixed(0)+" KB":(b/1048576).toFixed(1)+" MB"; }
  /* localStorage 用量估算：累加所有 ehub_ 開頭 key 的 key+value 字元數
     （UTF-16 字元數 ≈ bytes×2 的近似，夠當守門用）。storage 不可用時退回 mem。 */
  function lsUsage(){
    var total=0;
    try {
      for (var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i);
        if (k && k.indexOf("ehub_")===0){ var v=localStorage.getItem(k)||""; total+=k.length+v.length; }
      }
    } catch(e){
      for (var mk in mem){ if (mk.indexOf("ehub_")===0) total+=mk.length+(mem[mk]||"").length; }
    }
    return total;
  }
  var LS_LIMIT = 4*1024*1024; /* 4MB 保守線（localStorage 上限約 5MB） */
  function _compress(file,cb){ var img=new Image(),u=URL.createObjectURL(file); img.onload=function(){URL.revokeObjectURL(u);var max=1280,w=img.width,h=img.height;if(w>max||h>max){var s=max/Math.max(w,h);w=Math.round(w*s);h=Math.round(h*s);}var c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);cb(c.toDataURL("image/jpeg",0.82));}; img.onerror=function(){URL.revokeObjectURL(u);cb(null);}; img.src=u; }
  function readFiles(fileList, cb){
    var files=[].slice.call(fileList||[]), out=[], n=files.length; if(!n){ cb([]); return; }
    function push(o){
      out.push(o);
      if(out.length===n){
        /* 容量守門：既有用量 + 本批新增量超過 4MB 保守線 → 每個檔標 oversize:true。
           不阻擋（呼叫端行為不變），呼叫端可據此顯示警告。 */
        var add=0; out.forEach(function(x){ add+=(x.data||"").length; });
        if (lsUsage()+add > LS_LIMIT) out.forEach(function(x){ x.oversize=true; });
        cb(out);
      }
    }
    files.forEach(function(f){
      var isImg=f.type.indexOf("image/")===0;
      if(isImg){ _compress(f,function(d){ push({name:f.name,size:fmtBytes(f.size),isImg:true,data:d}); }); }
      else { var r=new FileReader(); r.onload=function(){ push({name:f.name,size:fmtBytes(f.size),isImg:false,data:r.result}); }; r.onerror=function(){ push({name:f.name,size:fmtBytes(f.size),isImg:false,data:null}); }; r.readAsDataURL(f); }
    });
  }

  global.EHub = {
    readFiles:readFiles, fmtBytes:fmtBytes, lsUsage:lsUsage,
    ANN_KEY:ANN_KEY, ROOM_KEY:ROOM_KEY, CAL_KEY:CAL_KEY,
    PHOTOS:PHOTOS, loadProfiles:loadProfiles, saveProfiles:saveProfiles, saveProfile:saveProfile, profileOf:profileOf, personOf:personOf, avatarSrc:avatarSrc, avatarHTML:avatarHTML, lightbox:lightbox,
    ymd:ymd, addDays:addDays, today0:today0, mondayOf:mondayOf,
    getSession:getSession, setSession:setSession, clearSession:clearSession, getRole:getRole,
    isAdmin:isAdmin, previewAdmin:previewAdmin,
    loadAnn:loadAnn, saveAnn:saveAnn, SEED_ANN:SEED_ANN, annVisibleTo:annVisibleTo, deptOf:deptOf,
    loadRooms:loadRooms, saveRooms:saveRooms,
    loadCal:loadCal, saveCal:saveCal,
    TODO_KEY:TODO_KEY, loadTodos:loadTodos, saveTodos:saveTodos,
    CARD_KEY:CARD_KEY, INTV_KEY:INTV_KEY, loadCards:loadCards, saveCards:saveCards, loadIntv:loadIntv, saveIntv:saveIntv,
    PEOPLE:PEOPLE, birthdaysThisMonth:birthdaysThisMonth, newHires:newHires,
    BADGE_KEY:BADGE_KEY, loadBadges:loadBadges, saveBadges:saveBadges, badgeFor:badgeFor,
    NOTIF_KEY:NOTIF_KEY, loadNotifs:loadNotifs, pushNotif:pushNotif, notifsFor:notifsFor, unreadNotifs:unreadNotifs, markNotifRead:markNotifRead, markAllNotifsRead:markAllNotifsRead, relTime:relTime,
    FEATURES:FEATURES, ACCESS_KEY:ACCESS_KEY, optionalFeatures:optionalFeatures,
    loadAccess:loadAccess, saveAccess:saveAccess, grantsFor:grantsFor, canAccess:canAccess,
    USERS:USERS, CAT:CAT, esc:esc, storageDegraded:storageDegraded
  };
})(window);

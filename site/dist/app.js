(()=>{function ue(){let e=window.APP_CONFIG||{},t=typeof e.apiBaseUrl=="string"?e.apiBaseUrl.trim():"";if(t){let r={...e,apiBaseUrl:t};return window.APP_CONFIG=r,r}let a=typeof window!="undefined"&&window.location&&window.location.origin?`${window.location.origin.replace(/\/$/,"")}/api`:"/api";console.warn("[OracleTournament] window.APP_CONFIG.apiBaseUrl is not configured; defaulting to",a);let s={...e,apiBaseUrl:a};return window.APP_CONFIG=s,s}function Q(e,t){if(!e||!t)return!1;let a=String(t).trim().toLowerCase();return a?(Array.isArray(e.players)?e.players:[]).some(r=>String((r==null?void 0:r.key)||(r==null?void 0:r.playerKey)||(r==null?void 0:r.player_key)||(r==null?void 0:r.code)||(r==null?void 0:r.id)||(r==null?void 0:r.player_id)||"").trim().toLowerCase()===a):!1}var Te=ue(),X=Te.apiBaseUrl,F=(()=>{let e="player_key",t="guest";function a(){try{return(localStorage.getItem(e)||"").trim().toLowerCase()}catch(l){return console.warn("Failed to read player key from storage",l),""}}function s(){let l=a();if(!l)throw window.location.href="./login.html",new Error("Player key is required.");return l}function r(){try{localStorage.removeItem(e)}catch{}}function o(){let l=a();return l&&we({includeHidden:!0}).find(p=>p.key===l)||null}function c(){return a()===t}return{getKey:a,requireKey:s,clear:r,getRosterEntry:o,isGuest:c,getGuestKey:()=>t}})(),N=F.requireKey(),P=F.isGuest(),j="Guest accounts can browse but cannot change shared data. Use your personal access code to keep editing.";function J(e="perform this action"){if(P)throw new Error(`Guest accounts cannot ${e}. ${j}`)}var me={sessions:[],rosterExtras:[],rosterMeta:{},buildCards:{}};function ve(e){if(!e)return null;if(typeof e=="string"){let o=R(e);return o?{key:L(e),character:o}:null}if(typeof e!="object")return null;let t=R(e.character||e.characterName||e.character_name||e.name||e.player_name||""),a=e.key||e.playerKey||e.player_key||e.code||e.id||e.player_id||t,s=L(a);if(!s&&!t)return null;let r=R(e.playerName||e.player_name||e.displayName||"");return{key:s||L(t),character:t||r||s||"",playerName:r}}function be(e){if(!e||typeof e!="object")return null;let t=String(e.id||"").trim(),a=w(e.title)||(t?`Session ${t}`:"Session"),s=w(e.dm),r=String(e.date||"").trim(),o=Number.isFinite(Number(e.capacity))?Number(e.capacity):0,c=Array.isArray(e.players)?e.players.map(ve).filter(Boolean):[];return{id:t,title:a,dm:s,date:r,capacity:o,finale:!!e.finale,players:c}}function V(e){let t={sessions:[],rosterExtras:[],rosterMeta:{},buildCards:{}};return!e||typeof e!="object"||(Array.isArray(e.sessions)&&e.sessions.forEach(a=>{let s=be(a);s&&s.id&&(s.players=Array.isArray(a.players)?a.players.map(ve).filter(Boolean):[],t.sessions.push(s))}),Array.isArray(e.rosterExtras)&&e.rosterExtras.forEach(a=>{if(!a||typeof a!="object")return;let s=R(a.name);if(!s)return;let r=L(a.key||s);r&&t.rosterExtras.push({key:r,name:s,status:w(a.status),notes:w(a.notes),custom:!0})}),e.rosterMeta&&typeof e.rosterMeta=="object"&&Object.entries(e.rosterMeta).forEach(([a,s])=>{let r=L(a);if(!r||!s||typeof s!="object")return;let o=w(s.status),c=w(s.notes),l=!!s.hidden;(o||c||l)&&(t.rosterMeta[r]={status:o,notes:c,hidden:l})}),e.buildCards&&typeof e.buildCards=="object"&&Object.entries(e.buildCards).forEach(([a,s])=>{let r=L(a);if(!r||!s||typeof s!="object")return;let o={};s.class&&(o.class=w(s.class)),s.university&&(o.university=w(s.university)),(s.characterName||s.character_name||s.name)&&(o.characterName=R(s.characterName||s.character_name||s.name)),t.buildCards[r]=o})),t}var Z={key:"oracleOfflineState",read(){try{let e=localStorage.getItem(this.key);if(!e)return null;let t=JSON.parse(e);if(t&&typeof t=="object"&&t.version===1&&t.state)return V(t.state)}catch(e){console.warn("Offline cache read failed",e)}return null},write(e){try{localStorage.setItem(this.key,JSON.stringify({version:1,state:e}))}catch(t){console.warn("Offline cache write failed",t)}},clear(){try{localStorage.removeItem(this.key)}catch{}}},K=(function(){let e=document.getElementById("networkBanner"),t=0,a="";function s(){if(e){if(a){e.textContent=`\u26A0\uFE0F ${a}`,e.classList.add("error"),e.classList.remove("loading"),e.hidden=!1;return}t>0?(e.textContent="Syncing with the Oracle Archives\u2026",e.classList.add("loading"),e.classList.remove("error"),e.hidden=!1):(e.hidden=!0,e.classList.remove("error"),e.classList.remove("loading"))}}return{begin(){t++,s()},end(){t=Math.max(0,t-1),s()},setError(r){a=r||"Network request failed.",s()},clearError(){a="",s()}}})(),U=(function(){let e=document.getElementById("draftStatus");function t(a,s="info"){e&&(e.textContent=a,e.dataset.tone=s)}return{info(a){t(a,"info")},success(a){t(a,"success")},error(a){t(a,"error")}}})();function ae(e){if(!X||/^https?:/i.test(e))return e;try{return new URL(e,X).toString()}catch{return X.replace(/\/$/,"")+e}}async function O(e,t={}){let a=ae(e),s={...t};s.headers={...t.headers||{}},s.body&&!(s.body instanceof FormData)&&!s.headers["Content-Type"]&&(s.headers["Content-Type"]="application/json"),K.begin();try{let r=await fetch(a,s);if(!r.ok){let l=await r.text();throw new Error(l||`Request failed (${r.status})`)}let o=r.headers.get("content-type")||"",c=null;return o.includes("application/json")?c=await r.json():c=await r.text(),K.clearError(),c}catch(r){throw K.setError(r&&r.message?r.message:"Network request failed."),r}finally{K.end()}}function Ne(){let e=document.getElementById("current-player-banner");if(!e)return;let t=N;if(!t){e.innerHTML="";return}let a=F.getRosterEntry(),s=(a==null?void 0:a.name)||t,o=F.isGuest()?"Guest":s;e.innerHTML=`
    <div class="player-banner">
      <span class="player-banner__text">Logged in as <span class="player-banner__name">${A(o)}</span></span>
      <button type="button" class="player-banner__logout" id="logout-btn">Logout</button>
    </div>
  `;let c=document.getElementById("logout-btn");c&&(c.onclick=Le)}function Le(){F.clear(),window.location.href="./login.html"}window.APP_UTILS=window.APP_UTILS||{};window.APP_UTILS.testApiConnection=async function(){let t=await O("/api/state",{headers:{Accept:"application/json"}});return console.info("[OracleTournament] /api/state responded with:",t),t};var q={data:V(me),offline:!0,fallback:V(me),listeners:new Set,apply(e,t="remote"){let a=V(e);return this.data=a,t==="remote"?(Z.write(a),this.offline=!1):(this.offline=!0,t==="offline-cache"&&Z.write(a)),this.notify(),a},useFallbackSessions(e){Array.isArray(e)&&(this.fallback.sessions=e.map(t=>{let a=be(t);return a?{...a,players:Array.isArray(a.players)?a.players.map(s=>({...s})):[]}:null}).filter(Boolean))},useDefaultFallback(){this.apply(this.fallback,"offline-default")},loadFallbackFromCache(){let e=Z.read();return e?(this.apply(e,"offline-cache"),!0):!1},async refresh(){try{let e=await O("/api/state",{headers:{Accept:"application/json"}});if(!e||typeof e!="object"||!e.state)throw new Error("Invalid response from datastore.");return this.apply(e.state,"remote"),this.data}catch(e){throw this.loadFallbackFromCache()||this.useDefaultFallback(),e}},subscribe(e){if(typeof e=="function"){this.listeners.add(e);try{e(this.data)}catch(t){console.error(t)}}return()=>this.listeners.delete(e)},notify(){this.listeners.forEach(e=>{try{e(this.data)}catch(t){console.error(t)}})},getSessionsCopy(){return this.data.sessions.map(e=>({...e,players:Array.isArray(e.players)?e.players.map(t=>({...t})):[]}))}},z={async joinSession(e,t){J("join sessions");let a=F.getRosterEntry(),s={...t,playerKey:(t==null?void 0:t.playerKey)||N,playerName:(t==null?void 0:t.playerName)||(a==null?void 0:a.name)||"",characterName:(t==null?void 0:t.characterName)||(t==null?void 0:t.name)},r=await O(`/api/sessions/${encodeURIComponent(e)}/join`,{method:"POST",body:JSON.stringify(s)});return r&&r.state&&q.apply(r.state,"remote"),r},async leaveSession(e,t){J("leave sessions");let a={...t,playerKey:(t==null?void 0:t.playerKey)||N},s=await O(`/api/sessions/${encodeURIComponent(e)}/leave`,{method:"POST",body:JSON.stringify(a)});return s&&s.state&&q.apply(s.state,"remote"),s},async addRosterExtra(e){J("add roster entries");let t=await O("/api/roster/extras",{method:"POST",body:JSON.stringify(e)});return t&&t.state&&q.apply(t.state,"remote"),t},async updateRosterEntry(e,t){J("edit the roster");let a=await O(`/api/roster/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)});return a&&a.state&&q.apply(a.state,"remote"),a},async removeRosterExtra(e){J("remove roster entries");let t=await O(`/api/roster/extras/${encodeURIComponent(e)}`,{method:"DELETE"});return t&&t.state&&q.apply(t.state,"remote"),t}},ge={read(){return q.data.rosterExtras}},De={read(){return q.data.rosterMeta}},Pe={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function R(e){return String(e!=null?e:"").trim()}function w(e){return String(e!=null?e:"").trim()}function L(e){return R(e).toLowerCase()}function A(e){return String(e!=null?e:"").replace(/[&<>"']/g,t=>Pe[t]||t)}function pe(e){return A(e)}var ke=new Set;function Se(e){let t=L(e);return t?ke.has(t)?!0:ge.read().some(a=>a.key===t):!1}async function Be(e,t="",a=""){if(P)return{ok:!1,msg:j};let s=R(e);if(!s)return{ok:!1,msg:"Name is required."};let r=L(s);if(Se(r))return{ok:!1,msg:`${s} is already on the roster.`};let o=w(t),c=w(a);try{return await z.addRosterExtra({name:s,status:o,notes:c}),{ok:!0,key:r,name:s}}catch(l){return{ok:!1,msg:l&&l.message?l.message:"Failed to add roster entry."}}}async function qe(e,t,a,s,r){if(P)throw new Error(j);let o=L(e);if(!o)return;let c=w(a),l=w(s),d=r==null?!!(t&&t.hidden):!!r;await z.updateRosterEntry(o,{status:c,notes:l,custom:!!(t&&t.custom),name:t&&t.name?R(t.name):"",hidden:d})}function we(e={}){let t=!!e.includeHidden,a=ge.read(),s=De.read(),r=[];return k.roster.forEach(o=>{let c=L(o.key||o.name),l=s[c]||{},d={name:o.name,key:c,status:l.status||w(o.status),notes:l.notes||w(o.notes),custom:!1,hidden:!!l.hidden};d.hidden&&!t||r.push(d)}),a.forEach(o=>{let c=L(o.key||o.name),l=s[c]||{},d={name:o.name,key:c,status:l.status||w(o.status),notes:l.notes||w(o.notes),custom:!0,hidden:!!l.hidden};d.hidden&&!t||r.push(d)}),r.sort((o,c)=>o.name.localeCompare(c.name,"en",{sensitivity:"base"}))}function ye(e){let t=a=>String(a).padStart(2,"0");return e.getFullYear()+t(e.getMonth()+1)+t(e.getDate())+"T"+t(e.getHours())+t(e.getMinutes())+t(e.getSeconds())}function _e(e){let t="America/Edmonton",a=new Date(e.date+"T19:00:00"),s=new Date(e.date+"T21:00:00"),o=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//OracleTrials//Scheduler//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",`UID:${`${e.id}@oracletrials`}`,`SUMMARY:${e.title}`,`DESCRIPTION:DM: ${e.dm} | Capacity: ${e.capacity}`,`DTSTART;TZID=${t}:${ye(a)}`,`DTEND;TZID=${t}:${ye(s)}`,"END:VEVENT","END:VCALENDAR"].join(`\r
`),c=new Blob([o],{type:"text/calendar"}),l=document.createElement("a");l.href=URL.createObjectURL(c),l.download=`${e.title.replace(/\s+/g,"-")}.ics`,l.click(),URL.revokeObjectURL(l.href)}var k={levels:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],abilityArrays:{standard:[15,14,13,12,10,8]},universities:[{key:"lorehold",name:"Lorehold",theme:"History & Spirits",colours:"Red/White",focus:"Archaeomancy",playstyle:"Scholar / Explorer",spells:{1:["Comprehend Languages","Identify"],2:["Borrowed Knowledge","Locate Object"],3:["Speak with Dead","Spirit Guardians"],4:["Arcane Eye","Stone Shape"],5:["Flame Strike","Legend Lore"]}},{key:"prismari",name:"Prismari",theme:"Elemental Arts",colours:"Blue/Red",focus:"Performance & Elements",playstyle:"Passion / Spectacle",spells:{1:["Chromatic Orb","Thunderwave"],2:["Flaming Sphere","Kinetic Jaunt"],3:["Haste","Water Walk"],4:["Freedom of Movement","Wall of Fire"],5:["Cone of Cold","Conjure Elemental"]}},{key:"quandrix",name:"Quandrix",theme:"Math & Nature",colours:"Blue/Green",focus:"Fractals / Growth",playstyle:"Logical / Curious",spells:{1:["Entangle","Guiding Bolt"],2:["Enlarge/Reduce","Vortex Warp"],3:["Aura of Vitality","Haste"],4:["Control Water","Freedom of Movement"],5:["Circle of Power","Passwall"]}},{key:"silverquill",name:"Silverquill",theme:"Eloquence & Ink",colours:"White/Black",focus:"Radiance & Shadow",playstyle:"Charisma / Wit",spells:{1:["Dissonant Whispers","Silvery Barbs"],2:["Calm Emotions","Darkness"],3:["Beacon of Hope","Daylight"],4:["Compulsion","Confusion"],5:["Dominate Person","Rary\u2019s Telepathic Bond"]}},{key:"witherbloom",name:"Witherbloom",theme:"Life & Decay",colours:"Green/Black",focus:"Alchemy / Essence",playstyle:"Healer / Witch",spells:{1:["Cure Wounds","Inflict Wounds"],2:["Lesser Restoration","Wither and Bloom"],3:["Revivify","Vampiric Touch"],4:["Blight","Death Ward"],5:["Antilife Shell","Greater Restoration"]}}],backgrounds:[{key:"lorehold-student",name:"Lorehold Student",skills:["History","Religion"],tools:[],languages:"2 of choice",gear:["Ink/pen","Hammer","Lantern","History tome","Uniform"],feat:"Strixhaven Initiate (Lorehold)"},{key:"prismari-student",name:"Prismari Student",skills:["Acrobatics","Performance"],tools:["+1 instrument/tool"],languages:"1",gear:["Ink/pen","Artisan tools or Instrument","Uniform"],feat:"Strixhaven Initiate (Prismari)"},{key:"quandrix-student",name:"Quandrix Student",skills:["Arcana","Nature"],tools:["+1 artisan tool"],languages:"1",gear:["Ink/pen","Abacus","Arcane theory book","Uniform"],feat:"Strixhaven Initiite (Silverquill)"},{key:"silverquill-student",name:"Silverquill Student",skills:["Intimidation","Persuasion"],tools:[],languages:"2",gear:["Ink/pen","Poetry book","Uniform"],feat:"Strixhaven Initiite (Silverquill)"},{key:"witherbloom-student",name:"Witherbloom Student",skills:["Nature","Survival"],tools:["Herbalism Kit"],languages:"1",gear:["Plant ID book","Iron pot","Herbalism kit","Uniform"],feat:"Strixhaven Initiate (Witherbloom)"}],feats:{strixhavenInitiate:{name:"Strixhaven Initiate",text:"Choose your college; learn 2 cantrips from its list + one 1st-level spell. Cast the 1st-level spell once per long rest without a slot; also with slots. Choose Int/Wis/Cha as spellcasting ability for these."}},extracurriculars:[{key:"dead-languages",name:"Dead Languages Society",skills:["Athletics","History"]},{key:"fine-artists",name:"Distinguished Society of Fine Artists",skills:["Performance","Sleight of Hand"]},{key:"dragonchess",name:"Dragonchess Club",skills:["Deception","Investigation"]},{key:"historical-soc",name:"Dragonsguard Historical Society",skills:["Arcana","History"]},{key:"horticulture",name:"Fantastical Horticulture Club",skills:["Nature","Survival"]},{key:"entrepreneurs",name:"Future Entrepreneurs of Strixhaven",skills:["Insight","Persuasion"]},{key:"gymnastics",name:"Intramural Gymnastics",skills:["Acrobatics","Performance"]},{key:"silkball",name:"Silkball Club",skills:["Athletics","Intimidation"]},{key:"water-dance",name:"Water-Dancing Club",skills:["Athletics","Performance"]},{key:"larp",name:"LARP Guild",skills:["Animal Handling","Performance"]},{key:"cheer",name:"Mage Tower Cheer",skills:["Perception","Persuasion"]},{key:"drama",name:"Playactors Drama Guild",skills:["Arcana","Deception"]},{key:"iron-lifters",name:"Iron-Lifters",skills:["Athletics","Medicine"]},{key:"show-band",name:"Show Band",skills:["Sleight of Hand","Performance"]},{key:"newspaper",name:"Strixhaven Star (Newspaper)",skills:["Investigation","Insight"]},{key:"faith",name:"Student-Mages of Faith",skills:["Insight","Religion"]}],jobs:[{key:"biblioplex",name:"Biblioplex",skills:["Arcana","History"]},{key:"firejolt",name:"Firejolt Caf\xE9",skills:["Insight","Persuasion"]},{key:"bowsend",name:"Bow's End Tavern",skills:["Performance","Deception"]},{key:"stadium",name:"Stadium",skills:["Athletics","Intimidation"]},{key:"performing-arts",name:"Performing Arts Society",skills:["Performance","Deception"]},{key:"dorms",name:"Dormitories",skills:["Persuasion","Perception"]},{key:"grounds",name:"Campus Grounds",skills:["Nature","Survival"]},{key:"labs",name:"Magic Labs",skills:["Arcana","Investigation"]},{key:"intramural",name:"Intramural Fields",skills:["Athletics","Acrobatics"]}],roster:[{name:"Kaela",status:"Yes",key:"kaela123"},{name:"Tory DM",status:"Yes",key:"torydm123"},{name:"Mike",status:"Pending",key:"mike2025"},{name:"Megan",status:"Pending",key:"megan2025"},{name:"Jocelyn",status:"Pending",key:"joss2025"},{name:"Emory",status:"Pending",key:"emory2025"},{name:"Snack Erin",status:"Yes",key:"snacks"},{name:"Erin",status:"Yes",key:"erin2627"},{name:"Trevor",status:"Yes",key:"trev2227"},{name:"Amy",status:"Yes",key:"amyoracle"},{name:"Nicole",status:"Yes",key:"nicole2627"},{name:"Spencer",status:"Yes",key:"spence2627"},{name:"Marvin",status:"Pending",key:"marv2025"},{name:"Megan E",status:"Pending",key:"megane2025"},{name:"Jordan",status:"Pending",key:"jordan2025"},{name:"Becca",status:"Yes",key:"becca2728"},{name:"Evan",status:"Yes",key:"evan2728"},{name:"Lyric",status:"Pending",key:"lyric2025"},{name:"Lazarus",status:"Yes",key:"laz_kids"},{name:"Aramis",status:"Pending",key:"aramis2025"},{name:"James",status:"Pending",key:"james2025"},{name:"David",status:"Pending",key:"david2025"},{name:"Nova",status:"Yes",key:"nova_any"},{name:"Melissa",status:"Yes",key:"melissa_not28"},{name:"Josh",status:"Yes",key:"josh222729"},{name:"Marilyn",status:"Pending",key:"marilyn2025"}],sessions:[]};k.roster=[...k.roster].sort((e,t)=>e.name.localeCompare(t.name,"en"));ke=new Set(k.roster.map(e=>L(e.key||e.name)));q.useDefaultFallback();var fe={hardNo:["Link"],blockedDates:{Melissa:["2025-12-28"]}};function Ce(){let e=[];try{if(!Array.isArray(k.sessions))e.push("DATA.sessions is missing or not an array.");else{let t=new Set;k.sessions.forEach((a,s)=>{if(!a||typeof a!="object"){e.push(`sessions[${s}] is not an object`);return}a.id||e.push(`sessions[${s}] is missing an id`),a.id&&(t.has(a.id)?e.push(`Duplicate session id: ${a.id}`):t.add(a.id)),/^\d{4}-\d{2}-\d{2}$/.test(String(a.date||""))||e.push(`${a.title||a.id||"session#"+s} has non-ISO date "${a.date}"`),typeof a.capacity!="number"&&e.push(`${a.title||a.id||"session#"+s} capacity must be a number`)})}}catch{e.push("DATA.sessions could not be validated.")}try{Array.isArray(k.roster)||e.push("DATA.roster is missing or not an array.")}catch{e.push("DATA.roster could not be validated.")}return e}function xe(e){if(!e||!e.length)return;let t=document.querySelector("main"),a=document.createElement("div");a.className="panel",a.style.border="1px solid #f14a3b",a.style.background="#1d1111",a.innerHTML=`
      <h2>Configuration issues</h2>
      <p>Fix the items below, then refresh. If you changed dates/IDs recently, hit <strong>Clear Local Data</strong> in the sidebar.</p>
      <ul>${e.map(s=>`<li>${s.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</li>`).join("")}</ul>
    `,t.prepend(a)}window.addEventListener("error",e=>{let t=document.querySelector("main");if(!t)return;let a=document.createElement("div");a.className="panel",a.style.border="1px solid #f14a3b",a.style.background="#1d1111",a.innerHTML=`<strong>Runtime error:</strong> ${String(e.message||"Unknown error")}`,t.prepend(a)});var G={key:"oracleTrialsSave",read(){try{let e=localStorage.getItem(this.key);return e?JSON.parse(e):null}catch(e){return console.warn("Local draft read failed",e),null}},write(e){try{localStorage.setItem(this.key,JSON.stringify(e))}catch(t){console.warn("Local draft write failed",t)}},clear(){try{localStorage.removeItem(this.key)}catch(e){console.warn("Local draft clear failed",e)}}};function Y(e){try{return JSON.parse(JSON.stringify(e||{}))}catch(t){return console.warn("Draft clone failed",t),{}}}async function Ee(e){if(!e)return console.warn("loadSavedBuildForPlayer: no playerKey provided"),null;try{let t=encodeURIComponent(e),a=await fetch(ae(`/api/builds/${t}`),{headers:{Accept:"application/json"}});if(a.status===404)return null;if(!a.ok){let r=await a.text();return console.error("loadSavedBuildForPlayer failed:",r),null}return await a.json()}catch(t){return console.error("loadSavedBuildForPlayer error:",t),null}}async function je(e,t){if(!e)return console.warn("saveBuildForPlayer: no playerKey provided"),!1;if(!t||typeof t!="object")return console.warn("saveBuildForPlayer: invalid build object"),!1;try{let a=encodeURIComponent(e),s=await fetch(ae(`/api/builds/${a}`),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!s.ok){let r=await s.text();return console.error("saveBuildForPlayer failed:",r),!1}return!0}catch(a){return console.error("saveBuildForPlayer error:",a),!1}}var u={data:{meta:{version:"0.5-stable"},core:{playerName:"",name:"",race:"",class:"",background:"",level:4,abilityMethod:"standard",abilities:{STR:15,DEX:14,CON:13,INT:12,WIS:10,CHA:8},equipment:"class"},university:{key:"",spellAbility:"INT"},feats:[],extras:{job:null,clubs:[],studentDice:[]},personality:{traits:"",ideal:"",bond:"",rival:"",goal:"",prompt:""},exams:{notes:"",studyRerolls:0,results:[]}},sessions:[],async save(){let e=Y(this.data);return G.write(e),U.info("Draft saved locally."),P?(U.info("Guest saves stay in this browser. Enter your access code to sync online."),!0):(je(N,e).then(t=>{t?(console.info("Build synced to Oracle Archives via /api/builds"),U.success("Draft saved locally and synced to the Oracle Archives.")):(console.warn("Build sync returned false"),U.info("Draft saved locally. Sync to Oracle Archives may have failed."))}),!0)},async load(){let e=G.read();if(e)return this.data=Y(e),te(),U.info("Loaded the draft stored in this browser."),!0;if(!P){let t=await Ee(N);if(t&&typeof t=="object")return this.data=Y(t),G.write(this.data),te(),U.success("Draft loaded from the Oracle Archives."),!0}return U.error("No saved drafts yet."),alert("No saved draft found. Create and save a character first."),!1},export(){let e=new Blob([JSON.stringify({character:this.data,sessions:this.sessions},null,2)],{type:"application/json"}),t=URL.createObjectURL(e),a=document.createElement("a");a.href=t,a.download=`oracle-trials-${(this.data.core.name||"character").toLowerCase().replace(/[^a-z0-9-]/g,"-")}.json`,a.click(),URL.revokeObjectURL(t)}};q.subscribe(()=>{var e;if(u.sessions=q.getSessionsCopy(),(e=u==null?void 0:u.data)!=null&&e.core){let t=F.getRosterEntry();t&&!u.data.core.playerName&&(u.data.core.playerName=t.name)}});function Re(){var l,d,p;let e=((l=u.data)==null?void 0:l.core)||{},t=((d=u.data)==null?void 0:d.university)||{},a=e.name&&e.name.trim().length>0,s="";if(a){let h=A(e.name||""),v=A(e.class||"No class"),b=e.level||"?",D=t.key||"",$=D?((p=(k.universities||[]).find(n=>n.key===D))==null?void 0:p.name)||D:"No college";s=`
      <div class="dashboard-stat"><strong>${h}</strong></div>
      <div class="dashboard-detail">${v} \u2022 Level ${b}</div>
      <div class="dashboard-detail">${A($)}</div>
      <button class="secondary dashboard-btn" data-nav="builder">Edit Character \u2192</button>
    `}else s=`
      <div class="dashboard-empty">No character saved yet.</div>
      <div class="muted">Visit the Character Builder step to get started.</div>
      <button class="primary dashboard-btn" data-nav="builder">Create Character \u2192</button>
    `;let r=u.sessions||[],o=null;for(let h of r)if(N&&Q(h,N)){o=h;break}let c="";if(o){let h=(o.players||[]).length;c=`
      <div class="dashboard-stat"><strong>${A(o.title)}</strong></div>
      <div class="dashboard-detail">${A(o.date)} \u2022 DM: ${A(o.dm||"TBD")}</div>
      <div class="dashboard-detail">Capacity: ${h}/${o.capacity}</div>
      <button class="secondary dashboard-btn" data-nav="join">View Sessions \u2192</button>
    `}else c=`
      <div class="dashboard-empty">You have not joined a Trial yet.</div>
      <div class="muted">Pick a session to reserve your seat.</div>
      <button class="primary dashboard-btn" data-nav="join">Join a Session \u2192</button>
    `;return`
<div class="dashboard-panel">
  <div class="dashboard-grid">
    <div class="dashboard-card" id="dashboard-character">
      <h4 class="dashboard-title">\u{1F4DC} My Character</h4>
      ${s}
    </div>
    <div class="dashboard-card" id="dashboard-session">
      <h4 class="dashboard-title">\u{1F3AD} My Session</h4>
      ${c}
    </div>
  </div>
</div>
`}function Oe(e){e.querySelectorAll("button[data-nav]").forEach(t=>{t.onclick=()=>{let a=t.dataset.nav;if(!B)return;let s=B.findIndex(r=>r.key===a);s>=0&&M(s,!0)}})}function he(){let e=u.data.core||{},t=u.data.university||{};return!!(e.name&&e.name.trim().length>=2&&e.class&&e.class.trim()&&e.level&&Number.isFinite(+e.level)&&t.key&&t.key.trim())}function ee(e,t={readOnly:!1}){let{readOnly:a=!1}=t;e.innerHTML="";let s=q.data.buildCards||{};u.sessions.slice().sort((r,o)=>r.date.localeCompare(o.date)).forEach(r=>{let o=(r.players||[]).length,c=o>=r.capacity,l=N?Q(r,N):!1,d=o?(Array.isArray(r.players)?r.players:[]).map(n=>{let m=n&&n.key?s[n.key]:null,f="";if(m){let i=A(m.class||"?"),y=A(m.university||"?");f=` \u2014 <span class="muted">${i} \u2022 ${y}</span>`}let g=A(n&&(n.character||n.name||n.playerName||"Player"));return`<div class="${L(n&&n.key)===N?"pill pill--highlight":"pill"}"><span>${g}</span>${f}</div>`}).join(""):'<span class="muted">No players yet</span>',p="";if(!a)if(l)p=`<button data-leave-id="${pe(r.id)}" class="danger">Leave this session</button>`;else{let n=!he()||c?"disabled":"";p=`<button data-id="${pe(r.id)}" class="primary" ${n}>Add my character</button>`}let h=r.theme?`<div class="muted"><strong>Theme:</strong> ${A(r.theme)}</div>`:"",v=r.focus?`<div class="muted"><strong>Focus:</strong> ${A(r.focus)}</div>`:"",b=r.finale?'<span class="tag tag--finale">\u2605 Finale</span>':"",D=l?'<span class="tag tag--joined">\u2713 Joined</span>':"",$=document.createElement("div");$.className=l?"card card--joined":"card",$.innerHTML=`
        <div class="flex" style="justify-content:space-between">
          <div>
            <strong>${A(r.title)}</strong> ${b} ${D}
            <div class="muted">${A(r.date)} \u2022 DM: ${A(r.dm||"")} \u2022 Capacity: ${o}/${r.capacity}</div>
            ${h}
            ${v}
            <div class="muted" style="margin-top:4px">No duplicate universities allowed in the same session.</div>
            ${!a&&!l&&!he()?'<div class="muted" style="margin-top:6px">Finish <em>Core 5e</em> + choose a <em>University</em> to join.</div>':""}
            ${!a&&!l&&c?'<div class="muted" style="margin-top:6px">This session is full.</div>':""}
          </div>
          <div class="flex">
            ${p}
            <button data-ics="${r.id}">.ics</button>
          </div>
        </div>
        <div style="margin-top:8px" class="flex">${d}</div>
      `,e.appendChild($)})}function Fe(e){let t=e.querySelector("#commentForm"),a=e.querySelector("#commentText"),s=e.querySelector("#commentPlayer"),r=e.querySelector("#commentCharacter"),o=e.querySelector("#commentSession"),c=e.querySelector("#commentList"),l=e.querySelector("#refreshComments"),d=e.querySelector("#commentStatus");if(!t||!a||!c)return;let p=0,h=t.querySelector('button[type="submit"]'),v=P,b=(i,y="success")=>{if(d){try{window.clearTimeout(p)}catch{}d.textContent=i,d.dataset.tone=y,d.hidden=!1,p=window.setTimeout(()=>{d.hidden=!0},3600)}};if(d&&(d.hidden=!0),v){[a,s,r,o].forEach(y=>{y&&(y.disabled=!0,y.setAttribute("aria-disabled","true"))}),h&&(h.disabled=!0,h.title=j,h.textContent="Comments disabled for guests");let i=document.createElement("p");i.className="muted",i.textContent=j,t.appendChild(i)}let D=i=>{try{return new Date(i).toLocaleString(void 0,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}catch{return i}},$=i=>i.slice().sort((y,x)=>{let C=new Date((y==null?void 0:y.createdAt)||0).getTime();return new Date((x==null?void 0:x.createdAt)||0).getTime()-C}),n=i=>{var W,re,ne,oe,ie,le,ce;if(!i||typeof i!="object")return null;let y=((re=(W=i.id)!=null?W:i.comment_id)!=null?re:"").toString().trim(),x=((oe=(ne=i.comment)!=null?ne:i.text)!=null?oe:"").toString().trim();if(!x)return null;let C=w((ie=i.playerName)!=null?ie:i.player_name),S=w((le=i.characterName)!=null?le:i.character_name),_=w((ce=i.sessionId)!=null?ce:i.session_id),T=i.createdAt||i.created_at||i.stamp;if(T){let de=new Date(T);T=Number.isNaN(de.getTime())?new Date().toISOString():de.toISOString()}else T=new Date().toISOString();return{id:y||`local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,playerName:C,characterName:S,sessionId:_,comment:x,createdAt:T}},m={comments:[],loading:!1},f=i=>{let y=new Set,x=[];return(i||[]).forEach(C=>{let S=C&&C.comment?C:n(C);!S||!S.comment||y.has(S.id)||(y.add(S.id),x.push(S))}),m.comments=$(x),m.comments},g=()=>{if(m.loading){c.innerHTML='<p class="comment-empty">Loading comments\u2026</p>';return}if(!m.comments.length){c.innerHTML='<p class="comment-empty">No comments yet. Add the first note above.</p>';return}c.innerHTML="",m.comments.forEach(i=>{if(!i||!i.comment)return;let y=document.createElement("div");y.className="comment-item",y.dataset.pending=i.pending?"true":"false";let x=document.createElement("p");if(x.textContent=i.comment,y.appendChild(x),i.playerName||i.characterName||i.sessionId){let _=document.createElement("div");if(_.className="comment-meta",i.playerName){let T=document.createElement("span");T.textContent=`Player: ${i.playerName}`,_.appendChild(T)}if(i.characterName){let T=document.createElement("span");T.textContent=`Character: ${i.characterName}`,_.appendChild(T)}if(i.sessionId){let T=document.createElement("span");T.textContent=`Session: ${i.sessionId}`,_.appendChild(T)}y.appendChild(_)}let C=document.createElement("time");C.dateTime=i.createdAt,C.textContent=D(i.createdAt),y.appendChild(C);let S=document.createElement("button");S.type="button",S.className="danger",i.pending?(S.textContent="Posting\u2026",S.disabled=!0):v?(S.textContent="Delete",S.disabled=!0,S.title=j):(S.textContent="Delete",S.addEventListener("click",()=>{I(i)})),y.appendChild(S),c.appendChild(y)})},E=async({silent:i=!1}={})=>{m.loading=!0,g();try{let y=await O("/api/comments",{headers:{Accept:"application/json"}}),x=Array.isArray(y==null?void 0:y.comments)?y.comments:[];f(x.map(n).filter(Boolean)),i||b("Comments updated.","info")}catch(y){throw i||b(y&&y.message?y.message:"Failed to load comments.","error"),y}finally{m.loading=!1,g()}},I=async i=>{if(v){b(j,"error");return}if(!i||!i.id||!(typeof confirm=="function"?confirm("Delete this comment?"):!0))return;let x=m.comments.slice();f(x.filter(C=>C.id!==i.id)),g(),b("Removing comment\u2026","info");try{await O(`/api/comments/${encodeURIComponent(i.id)}`,{method:"DELETE"}),b("Comment deleted.","info")}catch(C){f(x),g(),b(C&&C.message?C.message:"Failed to delete comment.","error")}};t.addEventListener("submit",async i=>{if(i.preventDefault(),v){b(j,"error");return}let y=(a.value||"").trim();if(!y){b("Comment text is required.","error");return}let x=s?w(s.value):"",C=r?w(r.value):"",S=o?w(o.value):"",_=m.comments.slice(),T={id:`pending-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,playerName:x,characterName:C,sessionId:S,comment:y,createdAt:new Date().toISOString(),pending:!0};f([T,..._]),g(),b("Posting comment\u2026","info"),h&&(h.disabled=!0);try{let H=await O("/api/comments",{method:"POST",body:JSON.stringify({playerName:x,characterName:C,sessionId:S,comment:y})}),W=n(H&&H.comment);if(!W)throw new Error("Invalid response from datastore.");f([W,..._]),g(),a&&(a.value=""),s&&(s.value=""),r&&(r.value=""),o&&(o.value=""),b("Comment posted!","success")}catch(H){f(_),g(),H&&H.message?b(H.message,"error"):b("Failed to post comment.","error")}finally{h&&(h.disabled=!1)}}),l&&l.addEventListener("click",i=>{i.preventDefault(),E().catch(y=>{y&&y.message?b(y.message,"error"):b("Failed to refresh comments.","error")})}),g(),E({silent:!0}).catch(i=>{i&&i.message?b(i.message,"error"):b("Unable to load comments.","error")})}async function Me(e=document){var a;let t=(a=e==null?void 0:e.querySelector)==null?void 0:a.call(e,"#questList");if(t){t.innerHTML='<p class="muted">Loading quests\u2026</p>';try{let s=await fetch("./site/data/quests.json",{cache:"no-store"});if(!s.ok)throw new Error(`Request failed: ${s.status}`);let r=await s.json();if(!Array.isArray(r)||!r.length){t.innerHTML='<p class="muted">No quests are published yet. Check back soon.</p>';return}let o=document.createDocumentFragment();r.forEach(c=>{var h;if(!c||typeof c!="object")return;let l=document.createElement("article");l.className="quest-card";let d=document.createElement("h4");d.textContent=c.title||`Quest #${(h=c.id)!=null?h:"?"}`,l.appendChild(d);let p=document.createElement("div");if(p.className="quest-meta",typeof c.id!="undefined"){let v=document.createElement("span");v.textContent=`ID ${c.id}`,p.appendChild(v)}if(c.status){let v=document.createElement("span");v.textContent=`Status: ${c.status}`,p.appendChild(v)}if(p.childNodes.length&&l.appendChild(p),c.notes){let v=document.createElement("p");v.className="quest-notes",v.textContent=c.notes,l.appendChild(v)}o.appendChild(l)}),t.innerHTML="",t.appendChild(o)}catch(s){console.error("Quest board failed",s),t.innerHTML='<p class="muted">Unable to load quests right now. Try refreshing later.</p>'}}}function He(){return q.data.buildCards||{}}var B=[{key:"intro",title:"Welcome",hint:"Overview & updates"},{key:"builder",title:"Character Builder",hint:"Core, college, flavour"},{key:"join",title:"Join a Session",hint:"Reserve a seat"},{key:"summary",title:"Summary & Export",hint:"Share or download"}],se=0;function Ue(){let e=document.getElementById("stepNav");if(!e)return;let t=e.querySelector('button[aria-selected="true"]');t&&t.focus()}function M(e,t=!1){Number.isNaN(e)||e<0||e>=B.length||(se=e,$e(),Ae(),t&&Ue())}function Ge(e){let t=e.target;if(!t||t.getAttribute("role")!=="tab")return;let a=e.key,s=Number(t.dataset.index||"0"),r=null;a==="ArrowRight"||a==="ArrowDown"?r=(s+1)%B.length:a==="ArrowLeft"||a==="ArrowUp"?r=(s-1+B.length)%B.length:a==="Home"?r=0:a==="End"&&(r=B.length-1),r!==null&&(e.preventDefault(),M(r,!0))}function Ae(){let e=document.getElementById("stepNav");if(!e)return;let t=e.scrollLeft;e.innerHTML="",e.setAttribute("role","tablist"),e.setAttribute("aria-label","Character builder steps");let a=document.createDocumentFragment();if(B.forEach((o,c)=>{let l=document.createElement("button");l.type="button",l.id=`step-tab-${o.key}`,l.className="step-pill",l.dataset.step=o.key,l.dataset.index=String(c),l.setAttribute("role","tab"),l.setAttribute("aria-controls",`panel-${o.key}`);let d=c===se;l.setAttribute("aria-selected",d?"true":"false"),l.setAttribute("tabindex",d?"0":"-1");let p=o.hint?`<small>${A(o.hint)}</small>`:"";l.innerHTML=`
        <span class="step-number">${c+1}</span>
        <span class="step-label"><span>${A(o.title)}</span>${p}</span>
      `,l.addEventListener("click",()=>{M(c,!0)}),a.appendChild(l)}),e.appendChild(a),e.dataset.keysBound||(e.addEventListener("keydown",Ge),e.dataset.keysBound="true"),e.scrollWidth>e.clientWidth+8){let o=e.querySelector('button[aria-selected="true"]');if(o)try{o.scrollIntoView({block:"nearest",inline:"center"})}catch{}}else e.scrollLeft=t;let s=document.getElementById("cfgBadge"),r=Ce();s.textContent=r.length?`\u26A0\uFE0F ${r.length} config issue${r.length>1?"s":""}`:"\u2705 config OK"}function $e(){let e=document.getElementById("panels");if(!e)return;e.innerHTML="";let t=B[se].key,a=null;t==="builder"&&(a=Je()),t==="summary"&&(a=Ye()),t==="intro"&&(a=We()),t==="join"&&(a=Ke()),a&&(a.id=`panel-${t}`,a.setAttribute("role","tabpanel"),a.setAttribute("aria-labelledby",`step-tab-${t}`),a.setAttribute("tabindex","0"),e.appendChild(a))}function We(){let e=document.createElement("div");e.className="panel";let t=Re();return e.innerHTML=t+`
<details class="scroll-letter" open>
  <summary>
    <span class="seal">\u2736</span>
    Official Correspondence: The Oracle Qualification Trials
    <span class="chev">\u25B6</span>
  </summary>

  <div class="scroll-content">
    <div style="text-align:center; font-style:italic; color:var(--muted); margin-bottom:1rem;">
      From the Office of the Dean of Arcane Affairs<br>
      Strixhaven University \u2014 The Premier Institution of Magical Learning in the World<br>
      <small>Founded by the Five Dragons \u2014 Velomachus, Galazeth, Tanazir, Shadrix, and Beledros</small>
    </div>

    <hr style="border:none;border-top:1px dotted var(--border);margin:1rem 0;">

    <p><strong>Winter Term \u2022 Year 739 of Archavios</strong></p>
    <p><em>An Invitation to the Learned and the Brave,</em></p>

    <p>In preparation for this century\u2019s selection of the Oracle Apprentice, the University will conduct a series of sanctioned field examinations. Each Trial is designed to assess essential qualities of leadership, wisdom, and magical aptitude expected of one who may one day inherit the Oracle\u2019s mantle. <br><br>

    Participants will represent their chosen college and be evaluated by a panel of distinguished faculty and arcane observers. Though each Trial varies in format, all share a single purpose \u2014 to illuminate the heart, mind, and will of every contender.<br>

    <p>Strixhaven is honoured to welcome distinguished students and faculty from magical academies across the planes for this year\u2019s Oracle Trials. Each institution brings its own traditions, theories, and flavour of chaos to the proceedings \u2014 ensuring that no two duels, debates, or dissertations are ever the same.</p>

    <div class="table-scroll letter-table">
      <table class="table">
        <thead><tr><th>College</th><th>Field of Study</th><th>Founder Dragon</th></tr></thead>
        <tbody>
          <tr><td><strong>Lorehold</strong></td><td>History & Archaeomancy</td><td>Velomachus Lorehold</td></tr>
          <tr><td><strong>Prismari</strong></td><td>Elemental Arts & Expression</td><td>Galazeth Prismari</td></tr>
          <tr><td><strong>Quandrix</strong></td><td>Numeromancy & Natural Mathematics</td><td>Tanazir Quandrix</td></tr>
          <tr><td><strong>Silverquill</strong></td><td>Eloquence, Rhetoric, & Word Magic</td><td>Shadrix Silverquill</td></tr>
          <tr><td><strong>Witherbloom</strong></td><td>Essence Studies: Life & Death</td><td>Beledros Witherbloom</td></tr>
        </tbody>
      </table>
    </div>

    <p><strong>Student Expectations</strong><br>
      Arrive prepared for adventure, study, and a modest amount of chaos.<br>
      Dice, imagination, and one\u2019s best festive attire recommended.<br>
      Non-finalists may appear as professors, spirits, or helpful onlookers via \u201CSupporter Cards.\u201D<br>
      Cooperation, roleplay, and good humour will be rewarded; detentions will be minimal.
    </p>
    
    <section class="news-board" id="newsBoard">
  <h3>Games & Trials</h3>
  <p class="muted">All scholars will compete in select Trials, contributing their unique philosophies to the greater pursuit of magical mastery. Some seek prestige, others enlightenment \u2014 a few, simply the catering.</p>
<p>Dates (Happening in the Mortal World)</p>
<p><strong>3 Preliminary College Quests: December 21\u201329<br>
Grand Oracle Trial: January 1</strong></p>
<p>(Trials hosted in the mortal realm by Professors Kaela and Tory. Potluck encouraged.)</p>
  
  <details class="news-item" closed>
    <summary>
      <span class="dot" aria-hidden="true"></span>
      <span class="news-title-text">Trial I: The Bog Expedition (Date TBD)</span>
      <span class="chev" aria-hidden="true">\u25B6</span>
    </summary>
    <div class="news-body">
      <ul>
        <li><strong>Theme:</strong> Resilience & Compassion</li>
        <li><strong>Focus:</strong> Problem-solving, teamwork, and moral decisions under pressure.</li>
        <li><strong>Setting:</strong> Witherbloom\u2019s Detention Bog.</li>
        <li><strong>Premise:</strong> Participants are sent to assist Witherbloom faculty in recovering lost alchemical crates.</li>
      </ul>
    </div>
  </details>
  
  <details class="news-item" closed>
    <summary>
      <span class="dot" aria-hidden="true"></span>
      <span class="news-title-text">Trial II: The Masquerade of Mirrors (Date TBD)</span>
      <span class="chev" aria-hidden="true">\u25B6</span>
    </summary>
    <div class="news-body">
      <ul>
        <li><strong>Theme:</strong> Wisdom & Integrity</li>
        <li><strong>Focus:</strong> Deception, charm, and truth-seeking.</li>
        <li><strong>Setting:</strong> The Winter Masquerade Ball, hosted by Silverquill and Prismari.</li>
        <li><strong>Premise:</strong> Contestants attend an extravagant gala where faculty and students vie for influence.</li>
      </ul>
    </div>
  </details>
  
  <details class="news-item" closed>
    <summary>
      <span class="dot" aria-hidden="true"></span>
      <span class="news-title-text">Trial III: The Trial of the Ruins (Date TBD)</span>
      <span class="chev" aria-hidden="true">\u25B6</span>
    </summary>
    <div class="news-body">
      <ul>
        <li><strong>Theme:</strong> Courage & Judgement.</li>
        <li><strong>Focus:</strong> Exploration, strategy, and moral courage.</li>
        <li><strong>Setting:</strong> The Fortress Badlands.</li>
        <li><strong>Premise:</strong> This test appears to be a straightforward recovery mission. Retrieve relics from ancient battlefields.</li>
      </ul>
    </div>
  </details>
  
  <details class="news-item" closed>
    <summary>
      <span class="dot" aria-hidden="true"></span>
      <span class="news-title-text">Finale: The Oracle\u2019s Convergence (January 1, 2026)</span>
      <span class="chev" aria-hidden="true">\u25B6</span>
    </summary>
    <div class="news-body">
      <ul>
        <li><strong>Focus:</strong> Everyone together \u2014 chaos, redemption, and a vote for destiny.</li>
        <li><strong>Format:</strong> Hybrid roleplay + short \u201Ctournament\u201D style mini-games.</li>
        <li><strong>Structure:</strong> Reunion Scene: All characters (kids & adults) witness the Oracle\u2019s unstable spirit forming.</li>
        <li><strong>Challenges:</strong> 
          <li>Puzzle of Insight (Wisdom)</li>
          <li>Duel of Flames (Power)
          <li>Debate of Hearts (Charisma)
          <li><strong>Audience votes or donates coins/tokens to alter results.</strong></li>
      </ul>
      <p><strong>Final Choice:</strong> Whoever wins or earns the group\u2019s vote becomes the Oracle Apprentice.</p>
    </div>
  </details>
</section>

    <p>Should you accept, please confirm attendance and college preference. Positions are limited, and the Founders favour the punctual.</p>

    <p style="margin-top:1.1rem;">
      <strong>With warm regards and arcane esteem,</strong><br><br>
      <em>Professor Kaela of House Glissandiants</em><br>
      <em>Contact kaelacaron@gmail.com</em><br>
      <em>Department of Druidic Studies</em><br><br>
      <em>Professor Tory of House Wittatude</em><br>
      <em>School of Bardic Applications</em><br><br>
      <strong>Strixhaven University of Magic and Mystery</strong>
    </p>

    <p style="text-align:center; font-style:italic; margin-top:1rem;">\u201CTo discover, preserve, and share the boundless wonders of magic.\u201D</p>
  </div>
</details>

<section class="quest-board" id="questBoard">
  <h3>Quest Board</h3>
  <p class="muted">Live adventures pulled from the Oracle Trials database snapshot.</p>
  <div id="questList" class="quest-list" role="list">
    <p class="muted">Loading quests\u2026</p>
  </div>
</section>

<section class="news-board" id="newsBoard">
  <h3>Announcements &amp; Updates</h3>
  <p class="muted">Drop in quick notes for the group. Duplicate the sample dropdown below to add more updates.</p>
  <details class="news-item" open>
    <summary>
      <span class="dot" aria-hidden="true"></span>
      <span class="news-title-text">Sample Update \u2014 Replace Me</span>
      <span class="chev" aria-hidden="true">\u25B6</span>
    </summary>
    <div class="news-body">
      <p>Share schedule changes, supply lists, or links here. Copy this entire <code>&lt;details class="news-item"&gt;</code> block to post another note.</p>
      <ul>
        <li><strong>When:</strong> Example date and time</li>
        <li><strong>Where:</strong> Library of the Biblioplex</li>
        <li><strong>Bring:</strong> Dice, pencils, favourite snack</li>
      </ul>
    </div>
  </details>
</section>

<section class="comment-board" id="commentBoard">
  <h3>Comments &amp; Notes</h3>
  <p class="muted">Jot reminders or questions for the group. Comments sync through the Oracle Archives so everyone stays in the loop.</p>
  <form id="commentForm" class="comment-form">
    <div class="comment-form-grid">
      <div class="form-field">
        <label for="commentPlayer">Player name (optional)</label>
        <input id="commentPlayer" name="commentPlayer" autocomplete="off" placeholder="e.g., Tamsin Rowe" />
      </div>
      <div class="form-field">
        <label for="commentCharacter">Character name (optional)</label>
        <input id="commentCharacter" name="commentCharacter" autocomplete="off" placeholder="e.g., Althea the Clever" />
      </div>
      <div class="form-field">
        <label for="commentSession">Session ID (optional)</label>
        <input id="commentSession" name="commentSession" autocomplete="off" placeholder="e.g., s3 or finale" />
      </div>
    </div>
    <label for="commentText">Add a comment</label>
    <textarea id="commentText" name="commentText" placeholder="Thanks for the invite! I'll bring cocoa." aria-label="Comment text"></textarea>
    <div class="comment-actions">
      <button type="button" id="refreshComments" class="secondary">Refresh</button>
      <button type="submit" class="primary">Post Comment</button>
    </div>
    <p id="commentStatus" class="comment-status" aria-live="polite" role="status" hidden></p>
  </form>
  <div id="commentList" class="comment-list" aria-live="polite"></div>
</section>

  `,Fe(e),Me(e),Oe(e),e}function Je(){let e=document.createElement("div");e.className="panel",e.innerHTML=`
      <h2>Character Builder</h2>
      <div class="card">
        <p>Complete each accordion below. Save a section once you\u2019ve filled the fields \u2014 you can revisit and update any time.</p>
      </div>
      <details class="builder-section" open>
        <summary>
          <span>Core 5e Setup</span>
          <small class="muted">Stats, species, class</small>
        </summary>
        <div class="section-body">
          <div class="callout" aria-label="Character creation instructions">
            <strong>Quick build checklist:</strong>
            <ul>
              <li>Enter your <strong>player name</strong> and <strong>character name</strong>.</li>
              <li>Pick a race, class, background, level, and ability score method.</li>
              <li>Select starting equipment \u2014 class kit or 50 gp.</li>
              <li>Need a refresher? Try the <a href="https://dnd.wizards.com/resources/character-sheets" target="_blank" rel="noreferrer">official D&D 5e character sheets</a>.</li>
            </ul>
          </div>
          <div class="grid cols-2">
            <div><label>Player Name</label><input id="core_player" placeholder="e.g., Kaela" /></div>
            <div><label>Character Name</label><input id="core_name" placeholder="e.g., Aria Winterborn" /></div>
            <div><label>Level</label><select id="core_level"></select></div>
            <div><label>Race</label><input id="core_race" placeholder="Any 5e race" /></div>
            <div><label>Class</label><input id="core_class" placeholder="Any 5e class" /></div>
            <div><label>Background</label><input id="core_background" placeholder="PHB/Custom" /></div>
            <div>
              <label>Ability Scores</label>
              <div class="row">
                <select id="ability_method">
                  <option value="standard">Standard Array (15,14,13,12,10,8)</option>
                  <option value="manual">Manual Entry</option>
                </select>
                <select id="equipment">
                  <option value="class">Class Starting Equipment</option>
                  <option value="50gp">50 gp</option>
                </select>
              </div>
            </div>
          </div>
          <div id="ability_box" class="two" style="margin-top:10px"></div>
          <div class="section-actions">
            <button class="primary" id="save_core">Save Core Setup</button>
            <span class="muted" data-save-note="core"></span>
          </div>
        </div>
      </details>
      <div class="builder-card">
        <h3>Strixhaven Details</h3>
        <details class="builder-section" open>
          <summary>
            <span>University & Feat</span>
            <small class="muted">Select your college</small>
          </summary>
          <div class="section-body">
            <div class="grid cols-2">
              <div>
                <label>Choose University</label>
                <select id="uni"></select>
              </div>
              <div>
                <label>Strixhaven Initiate \u2014 Spellcasting Ability</label>
                <select id="spell_ability"><option>INT</option><option>WIS</option><option>CHA</option></select>
              </div>
            </div>
            <div id="uni_info" class="card" style="margin-top:10px"></div>
            <div class="section-actions">
              <button class="primary" id="save_university">Save University</button>
              <span class="muted" data-save-note="university"></span>
            </div>
          </div>
        </details>
        <details class="builder-section">
          <summary>
            <span>Job & Extracurriculars</span>
            <small class="muted">Schedule & flavour</small>
          </summary>
          <div class="section-body">
            <div class="grid cols-2">
              <div>
                <label>Job (optional, 5 gp/week)</label>
                <select id="job"><option value="">\u2014 None \u2014</option>${k.jobs.map(n=>`<option value="${n.key}">${n.name}</option>`).join("")}</select>
              </div>
              <div>
                <label>Extracurriculars (pick up to 2; 1 if you also take a job)</label>
                <div id="clublist" class="grid cols-2" style="max-height:240px;overflow:auto"></div>
              </div>
            </div>
            <div id="bonus_readout" class="callout" style="margin-top:10px"></div>
            <div class="section-actions">
              <button class="primary" id="save_extras">Save Job & Clubs</button>
              <span class="muted" data-save-note="extras"></span>
            </div>
          </div>
        </details>
        <details class="builder-section">
          <summary>
            <span>Personality & Prompt</span>
            <small class="muted">Backstory beats</small>
        </summary>
        <div class="section-body">
          <div class="grid cols-2">
            <div><label>Traits (1\u20132)</label><textarea id="traits" rows="3" placeholder="e.g., Curious, dry humour"></textarea></div>
            <div><label>Ideal</label><textarea id="ideal" rows="3" placeholder="e.g., Knowledge must be shared."></textarea></div>
            <div><label>Bond / Friend / Rival</label><textarea id="bond" rows="3" placeholder="Name someone you\u2019re tied to (or opposed to)"></textarea></div>
            <div><label>Goal</label><textarea id="goal" rows="3" placeholder="What do you want from the Oracle Trials?"></textarea></div>
          </div>
          <div class="card" style="margin-top:10px">
            <div class="kicker">Quick-Start Character Prompt</div>
            <div id="prompt_box" class="flex" style="margin-top:6px"></div>
          </div>
          <div class="section-actions">
            <button class="primary" id="save_personality">Save Personality</button>
            <span class="muted" data-save-note="personality"></span>
          </div>
        </div>
      </details>
      </div>
      <div class="controls">
        <div class="left"><button id="back_builder">\u2190 Back</button></div>
        <div class="right"><button class="primary" id="next_builder">Next \u2192</button></div>
      </div>
    `;function t(n,m){let f=e.querySelector(`[data-save-note="${n}"]`);f&&(f.textContent=m)}let a=e.querySelector("#core_level");k.levels.forEach(n=>{let m=document.createElement("option");m.value=n,m.textContent=n,a.appendChild(m)});let s=e.querySelector("#ability_box");function r(){s.innerHTML="";let n=e.querySelector("#ability_method").value,m=["STR","DEX","CON","INT","WIS","CHA"];if(n==="standard"){let f=k.abilityArrays.standard.slice();m.forEach(g=>{let E=document.createElement("div");E.className="card",E.innerHTML=`<label>${g}</label><select data-ab="${g}">${f.map(I=>`<option value="${I}">${I}</option>`).join("")}</select>`,s.appendChild(E)})}else m.forEach(f=>{let g=document.createElement("div");g.className="card",g.innerHTML=`<label>${f}</label><input type="number" min="3" max="18" value="10" data-ab="${f}" />`,s.appendChild(g)})}e.querySelector("#ability_method").addEventListener("change",r),r();let o=u.data.core;e.querySelector("#core_player").value=o.playerName||"",e.querySelector("#core_name").value=o.name,e.querySelector("#core_race").value=o.race,e.querySelector("#core_class").value=o.class,e.querySelector("#core_background").value=o.background,e.querySelector("#core_level").value=o.level,e.querySelector("#ability_method").value=o.abilityMethod,e.querySelector("#equipment").value=o.equipment,r();let c=["STR","DEX","CON","INT","WIS","CHA"];c.forEach(n=>{var f,g;let m=s.querySelector(`[data-ab="${n}"]`);m&&(m.value=(g=(f=o.abilities)==null?void 0:f[n])!=null?g:m.value)}),e.querySelector("#save_core").onclick=()=>{let n={};c.forEach(m=>{let f=s.querySelector(`[data-ab="${m}"]`);n[m]=parseInt(f.value,10)}),u.data.core={playerName:e.querySelector("#core_player").value.trim(),name:e.querySelector("#core_name").value.trim(),race:e.querySelector("#core_race").value.trim(),class:e.querySelector("#core_class").value.trim(),background:e.querySelector("#core_background").value.trim(),level:parseInt(e.querySelector("#core_level").value,10),abilityMethod:e.querySelector("#ability_method").value,abilities:n,equipment:e.querySelector("#equipment").value},t("core","Core details saved."),u.save().catch(m=>console.error("Failed to persist core setup",m))};let l=e.querySelector("#uni");l.innerHTML='<option value="">\u2014 Select \u2014</option>'+k.universities.map(n=>`<option value="${n.key}">${n.name}</option>`).join("");function d(){let n=l.value,m=e.querySelector("#uni_info");if(!n){m.innerHTML='<span class="muted">Select a university to view theme & bonus spells.</span>';return}let f=k.universities.find(E=>E.key===n),g=Object.entries(f.spells).map(([E,I])=>`<tr><td>${E}</td><td>${I.join(", ")}</td></tr>`).join("");m.innerHTML=`
        <div class="two">
          <div>
            <div class="kicker">Theme</div><div>${f.theme}</div>
            <div class="kicker" style="margin-top:6px">Focus</div><div>${f.focus}</div>
            <div class="kicker" style="margin-top:6px">Colours</div><div>${f.colours}</div>
            <div class="kicker" style="margin-top:6px">Playstyle</div><div>${f.playstyle}</div>
          </div>
          <div>
            <div class="kicker">Bonus Spells</div>
            <table class="table"><thead><tr><th>Level</th><th>Spells</th></tr></thead><tbody>${g}</tbody></table>
          </div>
        </div>
        <div class="callout" style="margin-top:8px"><strong>Feat:</strong> ${k.feats.strixhavenInitiate.name} \u2014 ${k.feats.strixhavenInitiate.text}</div>
      `}l.addEventListener("change",d),l.value=u.data.university.key||"",e.querySelector("#spell_ability").value=u.data.university.spellAbility||"INT",d(),e.querySelector("#save_university").onclick=()=>{if(u.data.university={key:l.value,spellAbility:e.querySelector("#spell_ability").value},!u.data.university.key){alert("Pick a university to continue.");return}u.data.feats.find(n=>n.name==="Strixhaven Initiate")?u.data.feats=u.data.feats.map(n=>n.name==="Strixhaven Initiate"?{...n,ability:u.data.university.spellAbility}:n):u.data.feats.push({name:"Strixhaven Initiate",ability:u.data.university.spellAbility}),t("university","University saved."),u.save().catch(n=>console.error("Failed to persist build after university update",n))};let p=e.querySelector("#clublist");function h(){p.innerHTML="",k.extracurriculars.forEach(n=>{let m=`club_${n.key}`,f=document.createElement("label");f.className="card",f.style.cursor="pointer",f.innerHTML=`<div class="flex"><input type="checkbox" id="${m}" data-key="${n.key}" /> <div><strong>${n.name}</strong><div class="muted">Student Die (d4): ${n.skills.join(" / ")}</div></div></div>`,p.appendChild(f)})}h();let v=e.querySelector("#job");v.value=u.data.extras.job||"",(u.data.extras.clubs||[]).forEach(n=>{let m=p.querySelector(`[data-key="${n}"]`);m&&(m.checked=!0)});function b(){let n=v.value||null,m=[...p.querySelectorAll('input[type="checkbox"]:checked')].map(i=>i.dataset.key),f=n?1:2;if(m.length>f){let i=m.pop();p.querySelector(`[data-key="${i}"]`).checked=!1}let g=k.jobs.find(i=>i.key===n),E=k.extracurriculars.filter(i=>m.includes(i.key)),I=[];return g&&I.push(`<span class="tag">Job: ${g.name} \u2014 d4: ${g.skills.join(" / ")}</span>`),E.forEach(i=>I.push(`<span class="tag">Club: ${i.name} \u2014 d4: ${i.skills.join(" / ")}</span>`)),e.querySelector("#bonus_readout").innerHTML=I.length?I.join(" "):'<span class="muted">Pick a job and/or clubs to see Student Dice bonuses.</span>',{job:n,clubs:m}}v.addEventListener("change",b),p.addEventListener("change",b),b(),e.querySelector("#save_extras").onclick=()=>{let{job:n,clubs:m}=b();u.data.extras.job=n,u.data.extras.clubs=m,t("extras","Schedule saved."),u.save().catch(f=>console.error("Failed to persist build after extras update",f))};let D=[{u:"Lorehold",text:"A cheerful necro-historian who argues with ghosts about footnotes."},{u:"Prismari",text:"A kinetic dancer who keeps leaving frost footprints after cantrips."},{u:"Quandrix",text:"A fractal botanist who names houseplants after famous equations."},{u:"Silverquill",text:"A sunny orator who spotlights corruption with literal light."},{u:"Witherbloom",text:"A swamp witch medic who collects bones \u201Cfor research.\u201D"}],$=e.querySelector("#prompt_box");return D.forEach(n=>{let m=document.createElement("button");m.className="pill",m.type="button",m.innerHTML=`<span>${n.u}</span><span>\u2022</span><span>${n.text}</span>`,m.onclick=()=>{u.data.personality.prompt=n.text,Array.from($.children).forEach(f=>f.classList.remove("success")),m.classList.add("success")},$.appendChild(m),u.data.personality.prompt===n.text&&m.classList.add("success")}),e.querySelector("#traits").value=u.data.personality.traits||"",e.querySelector("#ideal").value=u.data.personality.ideal||"",e.querySelector("#bond").value=u.data.personality.bond||"",e.querySelector("#goal").value=u.data.personality.goal||"",e.querySelector("#save_personality").onclick=()=>{u.data.personality={traits:e.querySelector("#traits").value.trim(),ideal:e.querySelector("#ideal").value.trim(),bond:e.querySelector("#bond").value.trim(),goal:e.querySelector("#goal").value.trim(),prompt:u.data.personality.prompt||""},t("personality","Personality saved."),u.save().catch(n=>console.error("Failed to persist build after personality update",n))},e.querySelector("#back_builder").onclick=()=>{M(B.findIndex(n=>n.key==="intro"))},e.querySelector("#next_builder").onclick=()=>{M(B.findIndex(n=>n.key==="join"))},e}function Ke(){let e=document.createElement("div");e.className="panel",e.innerHTML=`
    <h2>Join a Session</h2>
    <div class="card">
      <p>Pick a table for your finished character. You\u2019ll need a <strong>Name</strong>, <strong>Class</strong>, <strong>Level</strong>, and a chosen <strong>University</strong>.</p>
    </div>
    ${P?'<div class="card" role="note"><p class="muted">Guest mode is read-only. Use your personal access code to reserve a seat.</p></div>':""}
    <div id="join_list" class="grid"></div>
    <div class="controls">
      <div class="left"><button id="back_join">\u2190 Back</button></div>
      <div class="right"><button class="primary" id="to_summary">Next \u2192</button></div>
    </div>
  `;let t=e.querySelector("#join_list");return ee(t,{readOnly:P}),t.addEventListener("click",a=>{var c;let s=a.target.closest("button.primary[data-id]");if(s){if(P){alert(j);return}let l=s.getAttribute("data-id"),d=(u.sessions||[]).find(n=>n.id===l),p=(u.data.core.name||"").trim();if(!p){alert("Give your character a name (Core 5e).");return}if(fe.hardNo.includes(p)){alert(`${p} is marked as not playing.`);return}if((fe.blockedDates[p]||[]).includes(d.date)){alert(`${p} isn't available for ${d.date}.`);return}let h=Array.isArray(d.players)?d.players:[];if(h.some(n=>R(n&&n.character)===R(p))){alert("This character is already in that session.");return}if(h.some(n=>L(n&&n.key)===N)){alert("Your access code already has a seat in this session.");return}if(h.length>=d.capacity){alert("That session is full.");return}let v=((c=k.universities.find(n=>n.key===u.data.university.key))==null?void 0:c.name)||"",b=He();if(v)for(let n of h){let m=n&&n.key?b[n.key]:null;if(m&&m.university===v){alert(`Another ${v} student is already in this session. Choose a different session or college.`);return}}let D=u.data.core.class||"",$=F.getRosterEntry();z.joinSession(l,{name:p,characterName:p,playerKey:N,playerName:$==null?void 0:$.name,build:{class:D,university:v}}).then(()=>{ee(t,{readOnly:P}),alert(`Added ${p} to ${d.title}.`)}).catch(n=>{alert(`Unable to join ${d.title}: ${n&&n.message?n.message:"Request failed."}`)});return}let r=a.target.closest("button[data-leave-id]");if(r){if(P){alert(j);return}let l=r.getAttribute("data-leave-id"),d=(u.sessions||[]).find(p=>p.id===l);if(!d){alert("Session not found.");return}if(!confirm(`Leave ${d.title}? You can rejoin later if there's space.`))return;z.leaveSession(l,{playerKey:N}).then(()=>{ee(t,{readOnly:P}),alert(`You have left ${d.title}.`)}).catch(p=>{alert(`Unable to leave ${d.title}: ${p&&p.message?p.message:"Request failed."}`)});return}let o=a.target.closest("button[data-ics]");if(o){let l=o.getAttribute("data-ics"),d=u.sessions.find(p=>p.id===l);_e(d)}}),e.querySelector("#back_join").onclick=()=>{M(B.findIndex(a=>a.key==="builder"))},e.querySelector("#to_summary").onclick=()=>{M(B.findIndex(a=>a.key==="summary"))},e}function Ye(){var l;let e=document.createElement("div");e.className="panel";let t=u.data,a=k.universities.find(d=>d.key===t.university.key),s=Object.entries(t.core.abilities||{}).map(([d,p])=>`<span class="tag">${d}: ${p}</span>`).join(" "),r=(t.extras.clubs||[]).map(d=>{var p;return(p=k.extracurriculars.find(h=>h.key===d))==null?void 0:p.name}).filter(Boolean),o=((l=k.jobs.find(d=>d.key===t.extras.job))==null?void 0:l.name)||"\u2014";e.innerHTML=`
      <h2>Summary</h2>
      <div class="grid cols-2">
        <div class="card">
          <div class="kicker">Character</div>
          <div><strong>${t.core.name||"Unnamed"}</strong></div>
          <div class="muted">Player: ${t.core.playerName||"\u2014"}</div>
          <div class="muted">${t.core.race||"Race?"} \u2022 ${t.core.class||"Class?"} \u2022 Level ${t.core.level||3}</div>
          <div style="margin-top:8px">${s}</div>
          <div style="margin-top:8px" class="muted">Background: ${t.core.background||"\u2014"} \u2022 Equipment: ${t.core.equipment==="50gp"?"50 gp":"Class kit"}</div>
        </div>
        <div class="card">
          <div class="kicker">University & Feat</div>
          <div><strong>${a?a.name:"\u2014"}</strong> <span class="muted">(${a?a.colours:"\u2014"})</span></div>
          <div class="muted">Spellcasting Ability for Initiate: ${t.university.spellAbility||"INT"}</div>
        </div>
        <div class="card">
          <div class="kicker">Job & Clubs</div>
          <div>Job: <strong>${o}</strong></div>
          <div>Clubs: ${r.length?r.join(", "):"\u2014"}</div>
        </div>
        <div class="card">
          <div class="kicker">Personality</div>
          <div>${t.personality.traits||""}</div>
          <div class="muted">Ideal: ${t.personality.ideal||""}</div>
          <div class="muted">Bond/Rival/Friend: ${t.personality.bond||""}</div>
          <div class="muted">Goal: ${t.personality.goal||""}</div>
          <div class="muted" style="margin-top:6px">Prompt: ${t.personality.prompt||"\u2014"}</div>
        </div>
      </div>
      <div class="controls">
        <div class="left"><button id="back_s">\u2190 Back</button></div>
        <div class="right">
          <button id="publish_roster">Add to Availability Roster</button>
          <button id="save_s">Save Draft</button>
          <button id="export_s" class="primary">Export JSON</button>
          <button id="pdf_s" class="success">Print / PDF</button>
        </div>
      </div>
    `,e.querySelector("#back_s").onclick=()=>{M(B.findIndex(d=>d.key==="builder"))},e.querySelector("#save_s").onclick=()=>u.save(),e.querySelector("#export_s").onclick=()=>u.export(),e.querySelector("#pdf_s").onclick=()=>window.print();let c=e.querySelector("#publish_roster");return c&&(P?(c.disabled=!0,c.title=j,c.textContent="Roster editing disabled for guests"):c.onclick=async()=>{var $,n,m,f,g;let d=R((n=($=u.data)==null?void 0:$.core)==null?void 0:n.name);if(!d){alert("Give your character a name in Core Setup first.");return}let p=L(d),h=[];(f=(m=u.data)==null?void 0:m.core)!=null&&f.class&&h.push(u.data.core.class);let v=a?a.name:((g=k.universities.find(E=>{var I,i;return E.key===((i=(I=u.data)==null?void 0:I.university)==null?void 0:i.key)}))==null?void 0:g.name)||"";v&&h.push(v);let b=h.join(" \u2022 "),D="Interested";if(Se(p)){let I=we().find(i=>i.key===p)||{name:d,custom:!1};try{await qe(p,I,D,b),alert(`${d} is already on the roster. Updated their status and notes.`)}catch(i){alert(`Failed to update roster entry: ${i&&i.message?i.message:"Request failed."}`)}}else{let E=await Be(d,D,b);if(!E.ok){alert(E.msg);return}alert(`${d} added to the roster.`)}}),e}function te(){try{Ne(),Ae(),$e(),Ie()}catch(e){xe([`Render failed: ${String(e&&e.message||e)}`]),console.error(e)}}function Ie(){let e=document.getElementById("btnSave");e&&(e.onclick=()=>u.save());let t=document.getElementById("btnLoad");t&&(t.onclick=()=>u.load());let a=document.getElementById("btnExport");a&&(a.onclick=()=>u.export());let s=document.getElementById("btnClear");s&&(s.onclick=()=>{confirm("Clear all local data for this app?")&&(G.clear(),localStorage.removeItem("oracleOfflineState"),alert("Local data cleared. Reloading\u2026"),location.reload())})}(async function(){let e=Ce();if(e.length){xe(e),Ie();return}try{await q.refresh()}catch(t){console.warn("Initial sync failed",t),K.setError("Unable to reach the shared datastore. Showing cached data if available.")}if(!P&&N){let t=G.read();if(t)u.data=Y(t);else try{let a=await Ee(N);a&&typeof a=="object"&&(u.data=Y(a),G.write(u.data),console.info("Loaded saved build for player:",N))}catch(a){console.warn("Failed to load saved build for player",a)}}te()})();window.ORACLE_DEBUG=window.ORACLE_DEBUG||{};window.ORACLE_DEBUG.State=u;window.ORACLE_DEBUG.save=()=>u.save();})();
//# sourceMappingURL=app.js.map

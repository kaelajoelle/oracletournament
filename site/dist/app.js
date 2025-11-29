(()=>{function de(){let e=window.APP_CONFIG||{},t=typeof e.apiBaseUrl=="string"?e.apiBaseUrl.trim():"";if(t){let s={...e,apiBaseUrl:t};return window.APP_CONFIG=s,s}let a=typeof window!="undefined"&&window.location&&window.location.origin?`${window.location.origin.replace(/\/$/,"")}/api`:"/api";console.warn("[OracleTournament] window.APP_CONFIG.apiBaseUrl is not configured; defaulting to",a);let r={...e,apiBaseUrl:a};return window.APP_CONFIG=r,r}function ue(e,t){if(!e||!t)return!1;let a=String(t).trim().toLowerCase();return a?(Array.isArray(e.players)?e.players:[]).some(s=>String((s==null?void 0:s.key)||(s==null?void 0:s.playerKey)||(s==null?void 0:s.player_key)||(s==null?void 0:s.code)||(s==null?void 0:s.id)||(s==null?void 0:s.player_id)||"").trim().toLowerCase()===a):!1}var Te=de(),Q=Te.apiBaseUrl,F=(()=>{let e="player_key",t="guest";function a(){try{return(localStorage.getItem(e)||"").trim().toLowerCase()}catch(l){return console.warn("Failed to read player key from storage",l),""}}function r(){let l=a();if(!l)throw window.location.href="./login.html",new Error("Player key is required.");return l}function s(){try{localStorage.removeItem(e)}catch{}}function i(){let l=a();return l&&we({includeHidden:!0}).find(p=>p.key===l)||null}function c(){return a()===t}return{getKey:a,requireKey:r,clear:s,getRosterEntry:i,isGuest:c,getGuestKey:()=>t}})(),L=F.requireKey(),N=F.isGuest(),_="Guest accounts can browse but cannot change shared data. Use your personal access code to keep editing.";function J(e="perform this action"){if(N)throw new Error(`Guest accounts cannot ${e}. ${_}`)}var me={sessions:[],rosterExtras:[],rosterMeta:{},buildCards:{}};function ve(e){if(!e)return null;if(typeof e=="string"){let i=R(e);return i?{key:T(e),character:i}:null}if(typeof e!="object")return null;let t=R(e.character||e.characterName||e.character_name||e.name||e.player_name||""),a=e.key||e.playerKey||e.player_key||e.code||e.id||e.player_id||t,r=T(a);if(!r&&!t)return null;let s=R(e.playerName||e.player_name||e.displayName||"");return{key:r||T(t),character:t||s||r||"",playerName:s}}function ge(e){if(!e||typeof e!="object")return null;let t=String(e.id||"").trim(),a=w(e.title)||(t?`Session ${t}`:"Session"),r=w(e.dm),s=String(e.date||"").trim(),i=Number.isFinite(Number(e.capacity))?Number(e.capacity):0,c=Array.isArray(e.players)?e.players.map(ve).filter(Boolean):[];return{id:t,title:a,dm:r,date:s,capacity:i,finale:!!e.finale,players:c}}function V(e){let t={sessions:[],rosterExtras:[],rosterMeta:{},buildCards:{}};return!e||typeof e!="object"||(Array.isArray(e.sessions)&&e.sessions.forEach(a=>{let r=ge(a);r&&r.id&&(r.players=Array.isArray(a.players)?a.players.map(ve).filter(Boolean):[],t.sessions.push(r))}),Array.isArray(e.rosterExtras)&&e.rosterExtras.forEach(a=>{if(!a||typeof a!="object")return;let r=R(a.name);if(!r)return;let s=T(a.key||r);s&&t.rosterExtras.push({key:s,name:r,status:w(a.status),notes:w(a.notes),custom:!0})}),e.rosterMeta&&typeof e.rosterMeta=="object"&&Object.entries(e.rosterMeta).forEach(([a,r])=>{let s=T(a);if(!s||!r||typeof r!="object")return;let i=w(r.status),c=w(r.notes),l=!!r.hidden;(i||c||l)&&(t.rosterMeta[s]={status:i,notes:c,hidden:l})}),e.buildCards&&typeof e.buildCards=="object"&&Object.entries(e.buildCards).forEach(([a,r])=>{let s=T(a);if(!s||!r||typeof r!="object")return;let i={};r.class&&(i.class=w(r.class)),r.university&&(i.university=w(r.university)),(r.characterName||r.character_name||r.name)&&(i.characterName=R(r.characterName||r.character_name||r.name)),t.buildCards[s]=i})),t}var X={key:"oracleOfflineState",read(){try{let e=localStorage.getItem(this.key);if(!e)return null;let t=JSON.parse(e);if(t&&typeof t=="object"&&t.version===1&&t.state)return V(t.state)}catch(e){console.warn("Offline cache read failed",e)}return null},write(e){try{localStorage.setItem(this.key,JSON.stringify({version:1,state:e}))}catch(t){console.warn("Offline cache write failed",t)}},clear(){try{localStorage.removeItem(this.key)}catch{}}},K=(function(){let e=document.getElementById("networkBanner"),t=0,a="";function r(){if(e){if(a){e.textContent=`\u26A0\uFE0F ${a}`,e.classList.add("error"),e.classList.remove("loading"),e.hidden=!1;return}t>0?(e.textContent="Syncing with the Oracle Archives\u2026",e.classList.add("loading"),e.classList.remove("error"),e.hidden=!1):(e.hidden=!0,e.classList.remove("error"),e.classList.remove("loading"))}}return{begin(){t++,r()},end(){t=Math.max(0,t-1),r()},setError(s){a=s||"Network request failed.",r()},clearError(){a="",r()}}})(),H=(function(){let e=document.getElementById("draftStatus");function t(a,r="info"){e&&(e.textContent=a,e.dataset.tone=r)}return{info(a){t(a,"info")},success(a){t(a,"success")},error(a){t(a,"error")}}})();function te(e){if(!Q||/^https?:/i.test(e))return e;try{return new URL(e,Q).toString()}catch{return Q.replace(/\/$/,"")+e}}async function O(e,t={}){let a=te(e),r={...t};r.headers={...t.headers||{}},r.body&&!(r.body instanceof FormData)&&!r.headers["Content-Type"]&&(r.headers["Content-Type"]="application/json"),K.begin();try{let s=await fetch(a,r);if(!s.ok){let l=await s.text();throw new Error(l||`Request failed (${s.status})`)}let i=s.headers.get("content-type")||"",c=null;return i.includes("application/json")?c=await s.json():c=await s.text(),K.clearError(),c}catch(s){throw K.setError(s&&s.message?s.message:"Network request failed."),s}finally{K.end()}}function Ne(){let e=document.getElementById("current-player-banner");if(!e)return;let t=L;if(!t){e.innerHTML="";return}let a=F.getRosterEntry(),r=(a==null?void 0:a.name)||t,i=F.isGuest()?"Guest":r;e.innerHTML=`
    <div class="player-banner">
      <span class="player-banner__text">Logged in as <span class="player-banner__name">${P(i)}</span></span>
      <button type="button" class="player-banner__logout" id="logout-btn">Logout</button>
    </div>
  `;let c=document.getElementById("logout-btn");c&&(c.onclick=Le)}function Le(){F.clear(),window.location.href="./login.html"}window.APP_UTILS=window.APP_UTILS||{};window.APP_UTILS.testApiConnection=async function(){let t=await O("/api/state",{headers:{Accept:"application/json"}});return console.info("[OracleTournament] /api/state responded with:",t),t};var D={data:V(me),offline:!0,fallback:V(me),listeners:new Set,apply(e,t="remote"){let a=V(e);return this.data=a,t==="remote"?(X.write(a),this.offline=!1):(this.offline=!0,t==="offline-cache"&&X.write(a)),this.notify(),a},useFallbackSessions(e){Array.isArray(e)&&(this.fallback.sessions=e.map(t=>{let a=ge(t);return a?{...a,players:Array.isArray(a.players)?a.players.map(r=>({...r})):[]}:null}).filter(Boolean))},useDefaultFallback(){this.apply(this.fallback,"offline-default")},loadFallbackFromCache(){let e=X.read();return e?(this.apply(e,"offline-cache"),!0):!1},async refresh(){try{let e=await O("/api/state",{headers:{Accept:"application/json"}});if(!e||typeof e!="object"||!e.state)throw new Error("Invalid response from datastore.");return this.apply(e.state,"remote"),this.data}catch(e){throw this.loadFallbackFromCache()||this.useDefaultFallback(),e}},subscribe(e){if(typeof e=="function"){this.listeners.add(e);try{e(this.data)}catch(t){console.error(t)}}return()=>this.listeners.delete(e)},notify(){this.listeners.forEach(e=>{try{e(this.data)}catch(t){console.error(t)}})},getSessionsCopy(){return this.data.sessions.map(e=>({...e,players:Array.isArray(e.players)?e.players.map(t=>({...t})):[]}))}},z={async joinSession(e,t){J("join sessions");let a=F.getRosterEntry(),r={...t,playerKey:(t==null?void 0:t.playerKey)||L,playerName:(t==null?void 0:t.playerName)||(a==null?void 0:a.name)||"",characterName:(t==null?void 0:t.characterName)||(t==null?void 0:t.name)},s=await O(`/api/sessions/${encodeURIComponent(e)}/join`,{method:"POST",body:JSON.stringify(r)});return s&&s.state&&D.apply(s.state,"remote"),s},async leaveSession(e,t){J("leave sessions");let a={...t,playerKey:(t==null?void 0:t.playerKey)||L},r=await O(`/api/sessions/${encodeURIComponent(e)}/leave`,{method:"POST",body:JSON.stringify(a)});return r&&r.state&&D.apply(r.state,"remote"),r},async addRosterExtra(e){J("add roster entries");let t=await O("/api/roster/extras",{method:"POST",body:JSON.stringify(e)});return t&&t.state&&D.apply(t.state,"remote"),t},async updateRosterEntry(e,t){J("edit the roster");let a=await O(`/api/roster/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)});return a&&a.state&&D.apply(a.state,"remote"),a},async removeRosterExtra(e){J("remove roster entries");let t=await O(`/api/roster/extras/${encodeURIComponent(e)}`,{method:"DELETE"});return t&&t.state&&D.apply(t.state,"remote"),t}},be={read(){return D.data.rosterExtras}},De={read(){return D.data.rosterMeta}},Pe={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function R(e){return String(e!=null?e:"").trim()}function w(e){return String(e!=null?e:"").trim()}function T(e){return R(e).toLowerCase()}function P(e){return String(e!=null?e:"").replace(/[&<>"']/g,t=>Pe[t]||t)}function pe(e){return P(e)}var ke=new Set;function Se(e){let t=T(e);return t?ke.has(t)?!0:be.read().some(a=>a.key===t):!1}async function qe(e,t="",a=""){if(N)return{ok:!1,msg:_};let r=R(e);if(!r)return{ok:!1,msg:"Name is required."};let s=T(r);if(Se(s))return{ok:!1,msg:`${r} is already on the roster.`};let i=w(t),c=w(a);try{return await z.addRosterExtra({name:r,status:i,notes:c}),{ok:!0,key:s,name:r}}catch(l){return{ok:!1,msg:l&&l.message?l.message:"Failed to add roster entry."}}}async function Be(e,t,a,r,s){if(N)throw new Error(_);let i=T(e);if(!i)return;let c=w(a),l=w(r),u=s==null?!!(t&&t.hidden):!!s;await z.updateRosterEntry(i,{status:c,notes:l,custom:!!(t&&t.custom),name:t&&t.name?R(t.name):"",hidden:u})}function we(e={}){let t=!!e.includeHidden,a=be.read(),r=De.read(),s=[];return S.roster.forEach(i=>{let c=T(i.key||i.name),l=r[c]||{},u={name:i.name,key:c,status:l.status||w(i.status),notes:l.notes||w(i.notes),custom:!1,hidden:!!l.hidden};u.hidden&&!t||s.push(u)}),a.forEach(i=>{let c=T(i.key||i.name),l=r[c]||{},u={name:i.name,key:c,status:l.status||w(i.status),notes:l.notes||w(i.notes),custom:!0,hidden:!!l.hidden};u.hidden&&!t||s.push(u)}),s.sort((i,c)=>i.name.localeCompare(c.name,"en",{sensitivity:"base"}))}function fe(e){let t=a=>String(a).padStart(2,"0");return e.getFullYear()+t(e.getMonth()+1)+t(e.getDate())+"T"+t(e.getHours())+t(e.getMinutes())+t(e.getSeconds())}function _e(e){let t="America/Edmonton",a=new Date(e.date+"T19:00:00"),r=new Date(e.date+"T21:00:00"),i=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//OracleTrials//Scheduler//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",`UID:${`${e.id}@oracletrials`}`,`SUMMARY:${e.title}`,`DESCRIPTION:DM: ${e.dm} | Capacity: ${e.capacity}`,`DTSTART;TZID=${t}:${fe(a)}`,`DTEND;TZID=${t}:${fe(r)}`,"END:VEVENT","END:VCALENDAR"].join(`\r
`),c=new Blob([i],{type:"text/calendar"}),l=document.createElement("a");l.href=URL.createObjectURL(c),l.download=`${e.title.replace(/\s+/g,"-")}.ics`,l.click(),URL.revokeObjectURL(l.href)}var S={levels:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],abilityArrays:{standard:[15,14,13,12,10,8]},universities:[{key:"lorehold",name:"Lorehold",theme:"History & Spirits",colours:"Red/White",focus:"Archaeomancy",playstyle:"Scholar / Explorer",spells:{1:["Comprehend Languages","Identify"],2:["Borrowed Knowledge","Locate Object"],3:["Speak with Dead","Spirit Guardians"],4:["Arcane Eye","Stone Shape"],5:["Flame Strike","Legend Lore"]}},{key:"prismari",name:"Prismari",theme:"Elemental Arts",colours:"Blue/Red",focus:"Performance & Elements",playstyle:"Passion / Spectacle",spells:{1:["Chromatic Orb","Thunderwave"],2:["Flaming Sphere","Kinetic Jaunt"],3:["Haste","Water Walk"],4:["Freedom of Movement","Wall of Fire"],5:["Cone of Cold","Conjure Elemental"]}},{key:"quandrix",name:"Quandrix",theme:"Math & Nature",colours:"Blue/Green",focus:"Fractals / Growth",playstyle:"Logical / Curious",spells:{1:["Entangle","Guiding Bolt"],2:["Enlarge/Reduce","Vortex Warp"],3:["Aura of Vitality","Haste"],4:["Control Water","Freedom of Movement"],5:["Circle of Power","Passwall"]}},{key:"silverquill",name:"Silverquill",theme:"Eloquence & Ink",colours:"White/Black",focus:"Radiance & Shadow",playstyle:"Charisma / Wit",spells:{1:["Dissonant Whispers","Silvery Barbs"],2:["Calm Emotions","Darkness"],3:["Beacon of Hope","Daylight"],4:["Compulsion","Confusion"],5:["Dominate Person","Rary\u2019s Telepathic Bond"]}},{key:"witherbloom",name:"Witherbloom",theme:"Life & Decay",colours:"Green/Black",focus:"Alchemy / Essence",playstyle:"Healer / Witch",spells:{1:["Cure Wounds","Inflict Wounds"],2:["Lesser Restoration","Wither and Bloom"],3:["Revivify","Vampiric Touch"],4:["Blight","Death Ward"],5:["Antilife Shell","Greater Restoration"]}}],backgrounds:[{key:"lorehold-student",name:"Lorehold Student",skills:["History","Religion"],tools:[],languages:"2 of choice",gear:["Ink/pen","Hammer","Lantern","History tome","Uniform"],feat:"Strixhaven Initiate (Lorehold)"},{key:"prismari-student",name:"Prismari Student",skills:["Acrobatics","Performance"],tools:["+1 instrument/tool"],languages:"1",gear:["Ink/pen","Artisan tools or Instrument","Uniform"],feat:"Strixhaven Initiate (Prismari)"},{key:"quandrix-student",name:"Quandrix Student",skills:["Arcana","Nature"],tools:["+1 artisan tool"],languages:"1",gear:["Ink/pen","Abacus","Arcane theory book","Uniform"],feat:"Strixhaven Initiite (Silverquill)"},{key:"silverquill-student",name:"Silverquill Student",skills:["Intimidation","Persuasion"],tools:[],languages:"2",gear:["Ink/pen","Poetry book","Uniform"],feat:"Strixhaven Initiite (Silverquill)"},{key:"witherbloom-student",name:"Witherbloom Student",skills:["Nature","Survival"],tools:["Herbalism Kit"],languages:"1",gear:["Plant ID book","Iron pot","Herbalism kit","Uniform"],feat:"Strixhaven Initiate (Witherbloom)"}],feats:{strixhavenInitiate:{name:"Strixhaven Initiate",text:"Choose your college; learn 2 cantrips from its list + one 1st-level spell. Cast the 1st-level spell once per long rest without a slot; also with slots. Choose Int/Wis/Cha as spellcasting ability for these."}},extracurriculars:[{key:"dead-languages",name:"Dead Languages Society",skills:["Athletics","History"]},{key:"fine-artists",name:"Distinguished Society of Fine Artists",skills:["Performance","Sleight of Hand"]},{key:"dragonchess",name:"Dragonchess Club",skills:["Deception","Investigation"]},{key:"historical-soc",name:"Dragonsguard Historical Society",skills:["Arcana","History"]},{key:"horticulture",name:"Fantastical Horticulture Club",skills:["Nature","Survival"]},{key:"entrepreneurs",name:"Future Entrepreneurs of Strixhaven",skills:["Insight","Persuasion"]},{key:"gymnastics",name:"Intramural Gymnastics",skills:["Acrobatics","Performance"]},{key:"silkball",name:"Silkball Club",skills:["Athletics","Intimidation"]},{key:"water-dance",name:"Water-Dancing Club",skills:["Athletics","Performance"]},{key:"larp",name:"LARP Guild",skills:["Animal Handling","Performance"]},{key:"cheer",name:"Mage Tower Cheer",skills:["Perception","Persuasion"]},{key:"drama",name:"Playactors Drama Guild",skills:["Arcana","Deception"]},{key:"iron-lifters",name:"Iron-Lifters",skills:["Athletics","Medicine"]},{key:"show-band",name:"Show Band",skills:["Sleight of Hand","Performance"]},{key:"newspaper",name:"Strixhaven Star (Newspaper)",skills:["Investigation","Insight"]},{key:"faith",name:"Student-Mages of Faith",skills:["Insight","Religion"]}],jobs:[{key:"biblioplex",name:"Biblioplex",skills:["Arcana","History"]},{key:"firejolt",name:"Firejolt Caf\xE9",skills:["Insight","Persuasion"]},{key:"bowsend",name:"Bow's End Tavern",skills:["Performance","Deception"]},{key:"stadium",name:"Stadium",skills:["Athletics","Intimidation"]},{key:"performing-arts",name:"Performing Arts Society",skills:["Performance","Deception"]},{key:"dorms",name:"Dormitories",skills:["Persuasion","Perception"]},{key:"grounds",name:"Campus Grounds",skills:["Nature","Survival"]},{key:"labs",name:"Magic Labs",skills:["Arcana","Investigation"]},{key:"intramural",name:"Intramural Fields",skills:["Athletics","Acrobatics"]}],roster:[{name:"Kaela",status:"Yes",key:"kaela123"},{name:"Tory DM",status:"Yes",key:"torydm123"},{name:"Mike",status:"Pending",key:"mike2025"},{name:"Megan",status:"Pending",key:"megan2025"},{name:"Jocelyn",status:"Pending",key:"joss2025"},{name:"Emory",status:"Pending",key:"emory2025"},{name:"Snack Erin",status:"Yes",key:"snacks"},{name:"Erin",status:"Yes",key:"erin2627"},{name:"Trevor",status:"Yes",key:"trev2227"},{name:"Amy",status:"Yes",key:"amyoracle"},{name:"Nicole",status:"Yes",key:"nicole2627"},{name:"Spencer",status:"Yes",key:"spence2627"},{name:"Marvin",status:"Pending",key:"marv2025"},{name:"Megan E",status:"Pending",key:"megane2025"},{name:"Jordan",status:"Pending",key:"jordan2025"},{name:"Becca",status:"Yes",key:"becca2728"},{name:"Evan",status:"Yes",key:"evan2728"},{name:"Lyric",status:"Pending",key:"lyric2025"},{name:"Lazarus",status:"Yes",key:"laz_kids"},{name:"Aramis",status:"Pending",key:"aramis2025"},{name:"James",status:"Pending",key:"james2025"},{name:"David",status:"Pending",key:"david2025"},{name:"Nova",status:"Yes",key:"nova_any"},{name:"Melissa",status:"Yes",key:"melissa_not28"},{name:"Josh",status:"Yes",key:"josh222729"},{name:"Marilyn",status:"Pending",key:"marilyn2025"}],sessions:[]};S.roster=[...S.roster].sort((e,t)=>e.name.localeCompare(t.name,"en"));ke=new Set(S.roster.map(e=>T(e.key||e.name)));D.useDefaultFallback();var ye={hardNo:["Link"],blockedDates:{Melissa:["2025-12-28"]}};function Ce(){let e=[];try{if(!Array.isArray(S.sessions))e.push("DATA.sessions is missing or not an array.");else{let t=new Set;S.sessions.forEach((a,r)=>{if(!a||typeof a!="object"){e.push(`sessions[${r}] is not an object`);return}a.id||e.push(`sessions[${r}] is missing an id`),a.id&&(t.has(a.id)?e.push(`Duplicate session id: ${a.id}`):t.add(a.id)),/^\d{4}-\d{2}-\d{2}$/.test(String(a.date||""))||e.push(`${a.title||a.id||"session#"+r} has non-ISO date "${a.date}"`),typeof a.capacity!="number"&&e.push(`${a.title||a.id||"session#"+r} capacity must be a number`)})}}catch{e.push("DATA.sessions could not be validated.")}try{Array.isArray(S.roster)||e.push("DATA.roster is missing or not an array.")}catch{e.push("DATA.roster could not be validated.")}return e}function xe(e){if(!e||!e.length)return;let t=document.querySelector("main"),a=document.createElement("div");a.className="panel",a.style.border="1px solid #f14a3b",a.style.background="#1d1111",a.innerHTML=`
      <h2>Configuration issues</h2>
      <p>Fix the items below, then refresh. If you changed dates/IDs recently, hit <strong>Clear Local Data</strong> in the sidebar.</p>
      <ul>${e.map(r=>`<li>${r.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</li>`).join("")}</ul>
    `,t.prepend(a)}window.addEventListener("error",e=>{let t=document.querySelector("main");if(!t)return;let a=document.createElement("div");a.className="panel",a.style.border="1px solid #f14a3b",a.style.background="#1d1111",a.innerHTML=`<strong>Runtime error:</strong> ${String(e.message||"Unknown error")}`,t.prepend(a)});var G={key:"oracleTrialsSave",read(){try{let e=localStorage.getItem(this.key);return e?JSON.parse(e):null}catch(e){return console.warn("Local draft read failed",e),null}},write(e){try{localStorage.setItem(this.key,JSON.stringify(e))}catch(t){console.warn("Local draft write failed",t)}},clear(){try{localStorage.removeItem(this.key)}catch(e){console.warn("Local draft clear failed",e)}}};function Y(e){try{return JSON.parse(JSON.stringify(e||{}))}catch(t){return console.warn("Draft clone failed",t),{}}}async function Ee(e){if(!e)return console.warn("loadSavedBuildForPlayer: no playerKey provided"),null;try{let t=encodeURIComponent(e),a=await fetch(te(`/api/builds/${t}`),{headers:{Accept:"application/json"}});if(a.status===404)return null;if(!a.ok){let s=await a.text();return console.error("loadSavedBuildForPlayer failed:",s),null}return await a.json()}catch(t){return console.error("loadSavedBuildForPlayer error:",t),null}}async function Re(e,t){if(!e)return console.warn("saveBuildForPlayer: no playerKey provided"),!1;if(!t||typeof t!="object")return console.warn("saveBuildForPlayer: invalid build object"),!1;try{let a=encodeURIComponent(e),r=await fetch(te(`/api/builds/${a}`),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!r.ok){let s=await r.text();return console.error("saveBuildForPlayer failed:",s),!1}return!0}catch(a){return console.error("saveBuildForPlayer error:",a),!1}}var m={data:{meta:{version:"0.5-stable"},core:{playerName:"",name:"",race:"",class:"",background:"",level:4,abilityMethod:"standard",abilities:{STR:15,DEX:14,CON:13,INT:12,WIS:10,CHA:8},equipment:"class"},university:{key:"",spellAbility:"INT"},feats:[],extras:{job:null,clubs:[],studentDice:[]},personality:{traits:"",ideal:"",bond:"",rival:"",goal:"",prompt:""},exams:{notes:"",studyRerolls:0,results:[]}},sessions:[],async save(){let e=Y(this.data);return G.write(e),H.info("Draft saved locally."),N?(H.info("Guest saves stay in this browser. Enter your access code to sync online."),!0):(Re(L,e).then(t=>{t?(console.info("Build synced to Oracle Archives via /api/builds"),H.success("Draft saved locally and synced to the Oracle Archives.")):(console.warn("Build sync returned false"),H.info("Draft saved locally. Sync to Oracle Archives may have failed."))}),!0)},async load(){let e=G.read();if(e)return this.data=Y(e),ee(),H.info("Loaded the draft stored in this browser."),!0;if(!N){let t=await Ee(L);if(t&&typeof t=="object")return this.data=Y(t),G.write(this.data),ee(),H.success("Draft loaded from the Oracle Archives."),!0}return H.error("No saved drafts yet."),alert("No saved draft found. Create and save a character first."),!1},export(){let e=new Blob([JSON.stringify({character:this.data,sessions:this.sessions},null,2)],{type:"application/json"}),t=URL.createObjectURL(e),a=document.createElement("a");a.href=t,a.download=`oracle-trials-${(this.data.core.name||"character").toLowerCase().replace(/[^a-z0-9-]/g,"-")}.json`,a.click(),URL.revokeObjectURL(t)}};D.subscribe(()=>{var e;if(m.sessions=D.getSessionsCopy(),(e=m==null?void 0:m.data)!=null&&e.core){let t=F.getRosterEntry();t&&!m.data.core.playerName&&(m.data.core.playerName=t.name)}});function he(){let e=m.data.core||{},t=m.data.university||{};return!!(e.name&&e.name.trim().length>=2&&e.class&&e.class.trim()&&e.level&&Number.isFinite(+e.level)&&t.key&&t.key.trim())}function Z(e,t={readOnly:!1}){let{readOnly:a=!1}=t;e.innerHTML="";let r=D.data.buildCards||{};m.sessions.slice().sort((s,i)=>s.date.localeCompare(i.date)).forEach(s=>{let i=(s.players||[]).length,c=i>=s.capacity,l=L?ue(s,L):!1,u=i?(Array.isArray(s.players)?s.players:[]).map(n=>{let d=n&&n.key?r[n.key]:null,y="";if(d){let o=P(d.class||"?"),f=P(d.university||"?");y=` \u2014 <span class="muted">${o} \u2022 ${f}</span>`}let h=P(n&&(n.character||n.name||n.playerName||"Player"));return`<div class="${T(n&&n.key)===L?"pill pill--highlight":"pill"}"><span>${h}</span>${y}</div>`}).join(""):'<span class="muted">No players yet</span>',p="";if(!a)if(l)p=`<button data-leave-id="${pe(s.id)}" class="danger">Leave this session</button>`;else{let n=!he()||c?"disabled":"";p=`<button data-id="${pe(s.id)}" class="primary" ${n}>Add my character</button>`}let b=s.theme?`<div class="muted"><strong>Theme:</strong> ${P(s.theme)}</div>`:"",v=s.focus?`<div class="muted"><strong>Focus:</strong> ${P(s.focus)}</div>`:"",g=s.finale?'<span class="tag tag--finale">\u2605 Finale</span>':"",j=l?'<span class="tag tag--joined">\u2713 Joined</span>':"",I=document.createElement("div");I.className=l?"card card--joined":"card",I.innerHTML=`
        <div class="flex" style="justify-content:space-between">
          <div>
            <strong>${P(s.title)}</strong> ${g} ${j}
            <div class="muted">${P(s.date)} \u2022 DM: ${P(s.dm||"")} \u2022 Capacity: ${i}/${s.capacity}</div>
            ${b}
            ${v}
            <div class="muted" style="margin-top:4px">No duplicate universities allowed in the same session.</div>
            ${!a&&!l&&!he()?'<div class="muted" style="margin-top:6px">Finish <em>Core 5e</em> + choose a <em>University</em> to join.</div>':""}
            ${!a&&!l&&c?'<div class="muted" style="margin-top:6px">This session is full.</div>':""}
          </div>
          <div class="flex">
            ${p}
            <button data-ics="${s.id}">.ics</button>
          </div>
        </div>
        <div style="margin-top:8px" class="flex">${u}</div>
      `,e.appendChild(I)})}function je(e){let t=e.querySelector("#commentForm"),a=e.querySelector("#commentText"),r=e.querySelector("#commentPlayer"),s=e.querySelector("#commentCharacter"),i=e.querySelector("#commentSession"),c=e.querySelector("#commentList"),l=e.querySelector("#refreshComments"),u=e.querySelector("#commentStatus");if(!t||!a||!c)return;let p=0,b=t.querySelector('button[type="submit"]'),v=N,g=(o,f="success")=>{if(u){try{window.clearTimeout(p)}catch{}u.textContent=o,u.dataset.tone=f,u.hidden=!1,p=window.setTimeout(()=>{u.hidden=!0},3600)}};if(u&&(u.hidden=!0),v){[a,r,s,i].forEach(f=>{f&&(f.disabled=!0,f.setAttribute("aria-disabled","true"))}),b&&(b.disabled=!0,b.title=_,b.textContent="Comments disabled for guests");let o=document.createElement("p");o.className="muted",o.textContent=_,t.appendChild(o)}let j=o=>{try{return new Date(o).toLocaleString(void 0,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}catch{return o}},I=o=>o.slice().sort((f,x)=>{let C=new Date((f==null?void 0:f.createdAt)||0).getTime();return new Date((x==null?void 0:x.createdAt)||0).getTime()-C}),n=o=>{var W,se,re,ne,oe,ie,le;if(!o||typeof o!="object")return null;let f=((se=(W=o.id)!=null?W:o.comment_id)!=null?se:"").toString().trim(),x=((ne=(re=o.comment)!=null?re:o.text)!=null?ne:"").toString().trim();if(!x)return null;let C=w((oe=o.playerName)!=null?oe:o.player_name),k=w((ie=o.characterName)!=null?ie:o.character_name),B=w((le=o.sessionId)!=null?le:o.session_id),$=o.createdAt||o.created_at||o.stamp;if($){let ce=new Date($);$=Number.isNaN(ce.getTime())?new Date().toISOString():ce.toISOString()}else $=new Date().toISOString();return{id:f||`local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,playerName:C,characterName:k,sessionId:B,comment:x,createdAt:$}},d={comments:[],loading:!1},y=o=>{let f=new Set,x=[];return(o||[]).forEach(C=>{let k=C&&C.comment?C:n(C);!k||!k.comment||f.has(k.id)||(f.add(k.id),x.push(k))}),d.comments=I(x),d.comments},h=()=>{if(d.loading){c.innerHTML='<p class="comment-empty">Loading comments\u2026</p>';return}if(!d.comments.length){c.innerHTML='<p class="comment-empty">No comments yet. Add the first note above.</p>';return}c.innerHTML="",d.comments.forEach(o=>{if(!o||!o.comment)return;let f=document.createElement("div");f.className="comment-item",f.dataset.pending=o.pending?"true":"false";let x=document.createElement("p");if(x.textContent=o.comment,f.appendChild(x),o.playerName||o.characterName||o.sessionId){let B=document.createElement("div");if(B.className="comment-meta",o.playerName){let $=document.createElement("span");$.textContent=`Player: ${o.playerName}`,B.appendChild($)}if(o.characterName){let $=document.createElement("span");$.textContent=`Character: ${o.characterName}`,B.appendChild($)}if(o.sessionId){let $=document.createElement("span");$.textContent=`Session: ${o.sessionId}`,B.appendChild($)}f.appendChild(B)}let C=document.createElement("time");C.dateTime=o.createdAt,C.textContent=j(o.createdAt),f.appendChild(C);let k=document.createElement("button");k.type="button",k.className="danger",o.pending?(k.textContent="Posting\u2026",k.disabled=!0):v?(k.textContent="Delete",k.disabled=!0,k.title=_):(k.textContent="Delete",k.addEventListener("click",()=>{A(o)})),f.appendChild(k),c.appendChild(f)})},E=async({silent:o=!1}={})=>{d.loading=!0,h();try{let f=await O("/api/comments",{headers:{Accept:"application/json"}}),x=Array.isArray(f==null?void 0:f.comments)?f.comments:[];y(x.map(n).filter(Boolean)),o||g("Comments updated.","info")}catch(f){throw o||g(f&&f.message?f.message:"Failed to load comments.","error"),f}finally{d.loading=!1,h()}},A=async o=>{if(v){g(_,"error");return}if(!o||!o.id||!(typeof confirm=="function"?confirm("Delete this comment?"):!0))return;let x=d.comments.slice();y(x.filter(C=>C.id!==o.id)),h(),g("Removing comment\u2026","info");try{await O(`/api/comments/${encodeURIComponent(o.id)}`,{method:"DELETE"}),g("Comment deleted.","info")}catch(C){y(x),h(),g(C&&C.message?C.message:"Failed to delete comment.","error")}};t.addEventListener("submit",async o=>{if(o.preventDefault(),v){g(_,"error");return}let f=(a.value||"").trim();if(!f){g("Comment text is required.","error");return}let x=r?w(r.value):"",C=s?w(s.value):"",k=i?w(i.value):"",B=d.comments.slice(),$={id:`pending-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,playerName:x,characterName:C,sessionId:k,comment:f,createdAt:new Date().toISOString(),pending:!0};y([$,...B]),h(),g("Posting comment\u2026","info"),b&&(b.disabled=!0);try{let M=await O("/api/comments",{method:"POST",body:JSON.stringify({playerName:x,characterName:C,sessionId:k,comment:f})}),W=n(M&&M.comment);if(!W)throw new Error("Invalid response from datastore.");y([W,...B]),h(),a&&(a.value=""),r&&(r.value=""),s&&(s.value=""),i&&(i.value=""),g("Comment posted!","success")}catch(M){y(B),h(),M&&M.message?g(M.message,"error"):g("Failed to post comment.","error")}finally{b&&(b.disabled=!1)}}),l&&l.addEventListener("click",o=>{o.preventDefault(),E().catch(f=>{f&&f.message?g(f.message,"error"):g("Failed to refresh comments.","error")})}),h(),E({silent:!0}).catch(o=>{o&&o.message?g(o.message,"error"):g("Unable to load comments.","error")})}async function Oe(e=document){var a;let t=(a=e==null?void 0:e.querySelector)==null?void 0:a.call(e,"#questList");if(t){t.innerHTML='<p class="muted">Loading quests\u2026</p>';try{let r=await fetch("./site/data/quests.json",{cache:"no-store"});if(!r.ok)throw new Error(`Request failed: ${r.status}`);let s=await r.json();if(!Array.isArray(s)||!s.length){t.innerHTML='<p class="muted">No quests are published yet. Check back soon.</p>';return}let i=document.createDocumentFragment();s.forEach(c=>{var b;if(!c||typeof c!="object")return;let l=document.createElement("article");l.className="quest-card";let u=document.createElement("h4");u.textContent=c.title||`Quest #${(b=c.id)!=null?b:"?"}`,l.appendChild(u);let p=document.createElement("div");if(p.className="quest-meta",typeof c.id!="undefined"){let v=document.createElement("span");v.textContent=`ID ${c.id}`,p.appendChild(v)}if(c.status){let v=document.createElement("span");v.textContent=`Status: ${c.status}`,p.appendChild(v)}if(p.childNodes.length&&l.appendChild(p),c.notes){let v=document.createElement("p");v.className="quest-notes",v.textContent=c.notes,l.appendChild(v)}i.appendChild(l)}),t.innerHTML="",t.appendChild(i)}catch(r){console.error("Quest board failed",r),t.innerHTML='<p class="muted">Unable to load quests right now. Try refreshing later.</p>'}}}function Fe(){return D.data.buildCards||{}}var q=[{key:"intro",title:"Welcome",hint:"Overview & updates"},{key:"builder",title:"Character Builder",hint:"Core, college, flavour"},{key:"join",title:"Join a Session",hint:"Reserve a seat"},{key:"summary",title:"Summary & Export",hint:"Share or download"}],ae=0;function Me(){let e=document.getElementById("stepNav");if(!e)return;let t=e.querySelector('button[aria-selected="true"]');t&&t.focus()}function U(e,t=!1){Number.isNaN(e)||e<0||e>=q.length||(ae=e,$e(),Ae(),t&&Me())}function He(e){let t=e.target;if(!t||t.getAttribute("role")!=="tab")return;let a=e.key,r=Number(t.dataset.index||"0"),s=null;a==="ArrowRight"||a==="ArrowDown"?s=(r+1)%q.length:a==="ArrowLeft"||a==="ArrowUp"?s=(r-1+q.length)%q.length:a==="Home"?s=0:a==="End"&&(s=q.length-1),s!==null&&(e.preventDefault(),U(s,!0))}function Ae(){let e=document.getElementById("stepNav");if(!e)return;let t=e.scrollLeft;e.innerHTML="",e.setAttribute("role","tablist"),e.setAttribute("aria-label","Character builder steps");let a=document.createDocumentFragment();if(q.forEach((i,c)=>{let l=document.createElement("button");l.type="button",l.id=`step-tab-${i.key}`,l.className="step-pill",l.dataset.step=i.key,l.dataset.index=String(c),l.setAttribute("role","tab"),l.setAttribute("aria-controls",`panel-${i.key}`);let u=c===ae;l.setAttribute("aria-selected",u?"true":"false"),l.setAttribute("tabindex",u?"0":"-1");let p=i.hint?`<small>${P(i.hint)}</small>`:"";l.innerHTML=`
        <span class="step-number">${c+1}</span>
        <span class="step-label"><span>${P(i.title)}</span>${p}</span>
      `,l.addEventListener("click",()=>{U(c,!0)}),a.appendChild(l)}),e.appendChild(a),e.dataset.keysBound||(e.addEventListener("keydown",He),e.dataset.keysBound="true"),e.scrollWidth>e.clientWidth+8){let i=e.querySelector('button[aria-selected="true"]');if(i)try{i.scrollIntoView({block:"nearest",inline:"center"})}catch{}}else e.scrollLeft=t;let r=document.getElementById("cfgBadge"),s=Ce();r.textContent=s.length?`\u26A0\uFE0F ${s.length} config issue${s.length>1?"s":""}`:"\u2705 config OK"}function $e(){let e=document.getElementById("panels");if(!e)return;e.innerHTML="";let t=q[ae].key,a=null;t==="builder"&&(a=Ge()),t==="summary"&&(a=Je()),t==="intro"&&(a=Ue()),t==="join"&&(a=We()),a&&(a.id=`panel-${t}`,a.setAttribute("role","tabpanel"),a.setAttribute("aria-labelledby",`step-tab-${t}`),a.setAttribute("tabindex","0"),e.appendChild(a))}function Ue(){let e=document.createElement("div");return e.className="panel",e.innerHTML=`
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

  `,je(e),Oe(e),e}function Ge(){let e=document.createElement("div");e.className="panel",e.innerHTML=`
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
      <details class="builder-section">
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
              <select id="job"><option value="">\u2014 None \u2014</option>${S.jobs.map(n=>`<option value="${n.key}">${n.name}</option>`).join("")}</select>
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
      <div class="controls">
        <div class="left"><button id="back_builder">\u2190 Back</button></div>
        <div class="right"><button class="primary" id="next_builder">Next \u2192</button></div>
      </div>
    `;function t(n,d){let y=e.querySelector(`[data-save-note="${n}"]`);y&&(y.textContent=d)}let a=e.querySelector("#core_level");S.levels.forEach(n=>{let d=document.createElement("option");d.value=n,d.textContent=n,a.appendChild(d)});let r=e.querySelector("#ability_box");function s(){r.innerHTML="";let n=e.querySelector("#ability_method").value,d=["STR","DEX","CON","INT","WIS","CHA"];if(n==="standard"){let y=S.abilityArrays.standard.slice();d.forEach(h=>{let E=document.createElement("div");E.className="card",E.innerHTML=`<label>${h}</label><select data-ab="${h}">${y.map(A=>`<option value="${A}">${A}</option>`).join("")}</select>`,r.appendChild(E)})}else d.forEach(y=>{let h=document.createElement("div");h.className="card",h.innerHTML=`<label>${y}</label><input type="number" min="3" max="18" value="10" data-ab="${y}" />`,r.appendChild(h)})}e.querySelector("#ability_method").addEventListener("change",s),s();let i=m.data.core;e.querySelector("#core_player").value=i.playerName||"",e.querySelector("#core_name").value=i.name,e.querySelector("#core_race").value=i.race,e.querySelector("#core_class").value=i.class,e.querySelector("#core_background").value=i.background,e.querySelector("#core_level").value=i.level,e.querySelector("#ability_method").value=i.abilityMethod,e.querySelector("#equipment").value=i.equipment,s();let c=["STR","DEX","CON","INT","WIS","CHA"];c.forEach(n=>{var y,h;let d=r.querySelector(`[data-ab="${n}"]`);d&&(d.value=(h=(y=i.abilities)==null?void 0:y[n])!=null?h:d.value)}),e.querySelector("#save_core").onclick=()=>{let n={};c.forEach(d=>{let y=r.querySelector(`[data-ab="${d}"]`);n[d]=parseInt(y.value,10)}),m.data.core={playerName:e.querySelector("#core_player").value.trim(),name:e.querySelector("#core_name").value.trim(),race:e.querySelector("#core_race").value.trim(),class:e.querySelector("#core_class").value.trim(),background:e.querySelector("#core_background").value.trim(),level:parseInt(e.querySelector("#core_level").value,10),abilityMethod:e.querySelector("#ability_method").value,abilities:n,equipment:e.querySelector("#equipment").value},t("core","Core details saved."),m.save().catch(d=>console.error("Failed to persist core setup",d))};let l=e.querySelector("#uni");l.innerHTML='<option value="">\u2014 Select \u2014</option>'+S.universities.map(n=>`<option value="${n.key}">${n.name}</option>`).join("");function u(){let n=l.value,d=e.querySelector("#uni_info");if(!n){d.innerHTML='<span class="muted">Select a university to view theme & bonus spells.</span>';return}let y=S.universities.find(E=>E.key===n),h=Object.entries(y.spells).map(([E,A])=>`<tr><td>${E}</td><td>${A.join(", ")}</td></tr>`).join("");d.innerHTML=`
        <div class="two">
          <div>
            <div class="kicker">Theme</div><div>${y.theme}</div>
            <div class="kicker" style="margin-top:6px">Focus</div><div>${y.focus}</div>
            <div class="kicker" style="margin-top:6px">Colours</div><div>${y.colours}</div>
            <div class="kicker" style="margin-top:6px">Playstyle</div><div>${y.playstyle}</div>
          </div>
          <div>
            <div class="kicker">Bonus Spells</div>
            <table class="table"><thead><tr><th>Level</th><th>Spells</th></tr></thead><tbody>${h}</tbody></table>
          </div>
        </div>
        <div class="callout" style="margin-top:8px"><strong>Feat:</strong> ${S.feats.strixhavenInitiate.name} \u2014 ${S.feats.strixhavenInitiate.text}</div>
      `}l.addEventListener("change",u),l.value=m.data.university.key||"",e.querySelector("#spell_ability").value=m.data.university.spellAbility||"INT",u(),e.querySelector("#save_university").onclick=()=>{if(m.data.university={key:l.value,spellAbility:e.querySelector("#spell_ability").value},!m.data.university.key){alert("Pick a university to continue.");return}m.data.feats.find(n=>n.name==="Strixhaven Initiate")?m.data.feats=m.data.feats.map(n=>n.name==="Strixhaven Initiate"?{...n,ability:m.data.university.spellAbility}:n):m.data.feats.push({name:"Strixhaven Initiate",ability:m.data.university.spellAbility}),t("university","University saved."),m.save().catch(n=>console.error("Failed to persist build after university update",n))};let p=e.querySelector("#clublist");function b(){p.innerHTML="",S.extracurriculars.forEach(n=>{let d=`club_${n.key}`,y=document.createElement("label");y.className="card",y.style.cursor="pointer",y.innerHTML=`<div class="flex"><input type="checkbox" id="${d}" data-key="${n.key}" /> <div><strong>${n.name}</strong><div class="muted">Student Die (d4): ${n.skills.join(" / ")}</div></div></div>`,p.appendChild(y)})}b();let v=e.querySelector("#job");v.value=m.data.extras.job||"",(m.data.extras.clubs||[]).forEach(n=>{let d=p.querySelector(`[data-key="${n}"]`);d&&(d.checked=!0)});function g(){let n=v.value||null,d=[...p.querySelectorAll('input[type="checkbox"]:checked')].map(o=>o.dataset.key),y=n?1:2;if(d.length>y){let o=d.pop();p.querySelector(`[data-key="${o}"]`).checked=!1}let h=S.jobs.find(o=>o.key===n),E=S.extracurriculars.filter(o=>d.includes(o.key)),A=[];return h&&A.push(`<span class="tag">Job: ${h.name} \u2014 d4: ${h.skills.join(" / ")}</span>`),E.forEach(o=>A.push(`<span class="tag">Club: ${o.name} \u2014 d4: ${o.skills.join(" / ")}</span>`)),e.querySelector("#bonus_readout").innerHTML=A.length?A.join(" "):'<span class="muted">Pick a job and/or clubs to see Student Dice bonuses.</span>',{job:n,clubs:d}}v.addEventListener("change",g),p.addEventListener("change",g),g(),e.querySelector("#save_extras").onclick=()=>{let{job:n,clubs:d}=g();m.data.extras.job=n,m.data.extras.clubs=d,t("extras","Schedule saved."),m.save().catch(y=>console.error("Failed to persist build after extras update",y))};let j=[{u:"Lorehold",text:"A cheerful necro-historian who argues with ghosts about footnotes."},{u:"Prismari",text:"A kinetic dancer who keeps leaving frost footprints after cantrips."},{u:"Quandrix",text:"A fractal botanist who names houseplants after famous equations."},{u:"Silverquill",text:"A sunny orator who spotlights corruption with literal light."},{u:"Witherbloom",text:"A swamp witch medic who collects bones \u201Cfor research.\u201D"}],I=e.querySelector("#prompt_box");return j.forEach(n=>{let d=document.createElement("button");d.className="pill",d.type="button",d.innerHTML=`<span>${n.u}</span><span>\u2022</span><span>${n.text}</span>`,d.onclick=()=>{m.data.personality.prompt=n.text,Array.from(I.children).forEach(y=>y.classList.remove("success")),d.classList.add("success")},I.appendChild(d),m.data.personality.prompt===n.text&&d.classList.add("success")}),e.querySelector("#traits").value=m.data.personality.traits||"",e.querySelector("#ideal").value=m.data.personality.ideal||"",e.querySelector("#bond").value=m.data.personality.bond||"",e.querySelector("#goal").value=m.data.personality.goal||"",e.querySelector("#save_personality").onclick=()=>{m.data.personality={traits:e.querySelector("#traits").value.trim(),ideal:e.querySelector("#ideal").value.trim(),bond:e.querySelector("#bond").value.trim(),goal:e.querySelector("#goal").value.trim(),prompt:m.data.personality.prompt||""},t("personality","Personality saved."),m.save().catch(n=>console.error("Failed to persist build after personality update",n))},e.querySelector("#back_builder").onclick=()=>{U(q.findIndex(n=>n.key==="intro"))},e.querySelector("#next_builder").onclick=()=>{U(q.findIndex(n=>n.key==="join"))},e}function We(){let e=document.createElement("div");e.className="panel",e.innerHTML=`
    <h2>Join a Session</h2>
    <div class="card">
      <p>Pick a table for your finished character. You\u2019ll need a <strong>Name</strong>, <strong>Class</strong>, <strong>Level</strong>, and a chosen <strong>University</strong>.</p>
    </div>
    ${N?'<div class="card" role="note"><p class="muted">Guest mode is read-only. Use your personal access code to reserve a seat.</p></div>':""}
    <div id="join_list" class="grid"></div>
    <div class="controls">
      <div class="left"><button id="back_join">\u2190 Back</button></div>
      <div class="right"><button class="primary" id="to_summary">Next \u2192</button></div>
    </div>
  `;let t=e.querySelector("#join_list");return Z(t,{readOnly:N}),t.addEventListener("click",a=>{var c;let r=a.target.closest("button.primary[data-id]");if(r){if(N){alert(_);return}let l=r.getAttribute("data-id"),u=(m.sessions||[]).find(n=>n.id===l),p=(m.data.core.name||"").trim();if(!p){alert("Give your character a name (Core 5e).");return}if(ye.hardNo.includes(p)){alert(`${p} is marked as not playing.`);return}if((ye.blockedDates[p]||[]).includes(u.date)){alert(`${p} isn't available for ${u.date}.`);return}let b=Array.isArray(u.players)?u.players:[];if(b.some(n=>R(n&&n.character)===R(p))){alert("This character is already in that session.");return}if(b.some(n=>T(n&&n.key)===L)){alert("Your access code already has a seat in this session.");return}if(b.length>=u.capacity){alert("That session is full.");return}let v=((c=S.universities.find(n=>n.key===m.data.university.key))==null?void 0:c.name)||"",g=Fe();if(v)for(let n of b){let d=n&&n.key?g[n.key]:null;if(d&&d.university===v){alert(`Another ${v} student is already in this session. Choose a different session or college.`);return}}let j=m.data.core.class||"",I=F.getRosterEntry();z.joinSession(l,{name:p,characterName:p,playerKey:L,playerName:I==null?void 0:I.name,build:{class:j,university:v}}).then(()=>{Z(t,{readOnly:N}),alert(`Added ${p} to ${u.title}.`)}).catch(n=>{alert(`Unable to join ${u.title}: ${n&&n.message?n.message:"Request failed."}`)});return}let s=a.target.closest("button[data-leave-id]");if(s){if(N){alert(_);return}let l=s.getAttribute("data-leave-id"),u=(m.sessions||[]).find(p=>p.id===l);if(!u){alert("Session not found.");return}if(!confirm(`Leave ${u.title}? You can rejoin later if there's space.`))return;z.leaveSession(l,{playerKey:L}).then(()=>{Z(t,{readOnly:N}),alert(`You have left ${u.title}.`)}).catch(p=>{alert(`Unable to leave ${u.title}: ${p&&p.message?p.message:"Request failed."}`)});return}let i=a.target.closest("button[data-ics]");if(i){let l=i.getAttribute("data-ics"),u=m.sessions.find(p=>p.id===l);_e(u)}}),e.querySelector("#back_join").onclick=()=>{U(q.findIndex(a=>a.key==="builder"))},e.querySelector("#to_summary").onclick=()=>{U(q.findIndex(a=>a.key==="summary"))},e}function Je(){var l;let e=document.createElement("div");e.className="panel";let t=m.data,a=S.universities.find(u=>u.key===t.university.key),r=Object.entries(t.core.abilities||{}).map(([u,p])=>`<span class="tag">${u}: ${p}</span>`).join(" "),s=(t.extras.clubs||[]).map(u=>{var p;return(p=S.extracurriculars.find(b=>b.key===u))==null?void 0:p.name}).filter(Boolean),i=((l=S.jobs.find(u=>u.key===t.extras.job))==null?void 0:l.name)||"\u2014";e.innerHTML=`
      <h2>Summary</h2>
      <div class="grid cols-2">
        <div class="card">
          <div class="kicker">Character</div>
          <div><strong>${t.core.name||"Unnamed"}</strong></div>
          <div class="muted">Player: ${t.core.playerName||"\u2014"}</div>
          <div class="muted">${t.core.race||"Race?"} \u2022 ${t.core.class||"Class?"} \u2022 Level ${t.core.level||3}</div>
          <div style="margin-top:8px">${r}</div>
          <div style="margin-top:8px" class="muted">Background: ${t.core.background||"\u2014"} \u2022 Equipment: ${t.core.equipment==="50gp"?"50 gp":"Class kit"}</div>
        </div>
        <div class="card">
          <div class="kicker">University & Feat</div>
          <div><strong>${a?a.name:"\u2014"}</strong> <span class="muted">(${a?a.colours:"\u2014"})</span></div>
          <div class="muted">Spellcasting Ability for Initiate: ${t.university.spellAbility||"INT"}</div>
        </div>
        <div class="card">
          <div class="kicker">Job & Clubs</div>
          <div>Job: <strong>${i}</strong></div>
          <div>Clubs: ${s.length?s.join(", "):"\u2014"}</div>
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
    `,e.querySelector("#back_s").onclick=()=>{U(q.findIndex(u=>u.key==="builder"))},e.querySelector("#save_s").onclick=()=>m.save(),e.querySelector("#export_s").onclick=()=>m.export(),e.querySelector("#pdf_s").onclick=()=>window.print();let c=e.querySelector("#publish_roster");return c&&(N?(c.disabled=!0,c.title=_,c.textContent="Roster editing disabled for guests"):c.onclick=async()=>{var I,n,d,y,h;let u=R((n=(I=m.data)==null?void 0:I.core)==null?void 0:n.name);if(!u){alert("Give your character a name in Core Setup first.");return}let p=T(u),b=[];(y=(d=m.data)==null?void 0:d.core)!=null&&y.class&&b.push(m.data.core.class);let v=a?a.name:((h=S.universities.find(E=>{var A,o;return E.key===((o=(A=m.data)==null?void 0:A.university)==null?void 0:o.key)}))==null?void 0:h.name)||"";v&&b.push(v);let g=b.join(" \u2022 "),j="Interested";if(Se(p)){let A=we().find(o=>o.key===p)||{name:u,custom:!1};try{await Be(p,A,j,g),alert(`${u} is already on the roster. Updated their status and notes.`)}catch(o){alert(`Failed to update roster entry: ${o&&o.message?o.message:"Request failed."}`)}}else{let E=await qe(u,j,g);if(!E.ok){alert(E.msg);return}alert(`${u} added to the roster.`)}}),e}function ee(){try{Ne(),Ae(),$e(),Ie()}catch(e){xe([`Render failed: ${String(e&&e.message||e)}`]),console.error(e)}}function Ie(){let e=document.getElementById("btnSave");e&&(e.onclick=()=>m.save());let t=document.getElementById("btnLoad");t&&(t.onclick=()=>m.load());let a=document.getElementById("btnExport");a&&(a.onclick=()=>m.export());let r=document.getElementById("btnClear");r&&(r.onclick=()=>{confirm("Clear all local data for this app?")&&(G.clear(),localStorage.removeItem("oracleOfflineState"),alert("Local data cleared. Reloading\u2026"),location.reload())})}(async function(){let e=Ce();if(e.length){xe(e),Ie();return}try{await D.refresh()}catch(t){console.warn("Initial sync failed",t),K.setError("Unable to reach the shared datastore. Showing cached data if available.")}if(!N&&L){let t=G.read();if(t)m.data=Y(t);else try{let a=await Ee(L);a&&typeof a=="object"&&(m.data=Y(a),G.write(m.data),console.info("Loaded saved build for player:",L))}catch(a){console.warn("Failed to load saved build for player",a)}}ee()})();window.ORACLE_DEBUG=window.ORACLE_DEBUG||{};window.ORACLE_DEBUG.State=m;window.ORACLE_DEBUG.save=()=>m.save();})();
//# sourceMappingURL=app.js.map

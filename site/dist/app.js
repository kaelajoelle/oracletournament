(()=>{function ue(){let e=window.APP_CONFIG||{},t=typeof e.apiBaseUrl=="string"?e.apiBaseUrl.trim():"";if(t){let n={...e,apiBaseUrl:t};return window.APP_CONFIG=n,n}let a=typeof window!="undefined"&&window.location&&window.location.origin?`${window.location.origin.replace(/\/$/,"")}/api`:"/api";console.warn("[OracleTournament] window.APP_CONFIG.apiBaseUrl is not configured; defaulting to",a);let r={...e,apiBaseUrl:a};return window.APP_CONFIG=r,r}function Q(e,t){if(!e||!t)return!1;let a=String(t).trim().toLowerCase();return a?(Array.isArray(e.players)?e.players:[]).some(n=>String((n==null?void 0:n.key)||(n==null?void 0:n.playerKey)||(n==null?void 0:n.player_key)||(n==null?void 0:n.code)||(n==null?void 0:n.id)||(n==null?void 0:n.player_id)||"").trim().toLowerCase()===a):!1}var Ie=ue(),X=Ie.apiBaseUrl,M=(()=>{let e="player_key",t="guest";function a(){try{return(localStorage.getItem(e)||"").trim().toLowerCase()}catch(l){return console.warn("Failed to read player key from storage",l),""}}function r(){let l=a();if(!l)throw window.location.href="./login.html",new Error("Player key is required.");return l}function n(){try{localStorage.removeItem(e)}catch{}}function i(){let l=a();return l&&we({includeHidden:!0}).find(h=>h.key===l)||null}function c(){return a()===t}return{getKey:a,requireKey:r,clear:n,getRosterEntry:i,isGuest:c,getGuestKey:()=>t}})(),I=M.requireKey(),D=M.isGuest(),B="Guest accounts can browse but cannot change shared data. Use your personal access code to keep editing.";function Y(e="perform this action"){if(D)throw new Error(`Guest accounts cannot ${e}. ${B}`)}var me={sessions:[],rosterExtras:[],rosterMeta:{},buildCards:{}};function ve(e){if(!e)return null;if(typeof e=="string"){let i=j(e);return i?{key:L(e),character:i}:null}if(typeof e!="object")return null;let t=j(e.character||e.characterName||e.character_name||e.name||e.player_name||""),a=e.key||e.playerKey||e.player_key||e.code||e.id||e.player_id||t,r=L(a);if(!r&&!t)return null;let n=j(e.playerName||e.player_name||e.displayName||"");return{key:r||L(t),character:t||n||r||"",playerName:n}}function ge(e){if(!e||typeof e!="object")return null;let t=String(e.id||"").trim(),a=w(e.title)||(t?`Session ${t}`:"Session"),r=w(e.dm),n=String(e.date||"").trim(),i=Number.isFinite(Number(e.capacity))?Number(e.capacity):0,c=Array.isArray(e.players)?e.players.map(ve).filter(Boolean):[];return{id:t,title:a,dm:r,date:n,capacity:i,finale:!!e.finale,players:c}}function z(e){let t={sessions:[],rosterExtras:[],rosterMeta:{},buildCards:{}};return!e||typeof e!="object"||(Array.isArray(e.sessions)&&e.sessions.forEach(a=>{let r=ge(a);r&&r.id&&(r.players=Array.isArray(a.players)?a.players.map(ve).filter(Boolean):[],t.sessions.push(r))}),Array.isArray(e.rosterExtras)&&e.rosterExtras.forEach(a=>{if(!a||typeof a!="object")return;let r=j(a.name);if(!r)return;let n=L(a.key||r);n&&t.rosterExtras.push({key:n,name:r,status:w(a.status),notes:w(a.notes),custom:!0})}),e.rosterMeta&&typeof e.rosterMeta=="object"&&Object.entries(e.rosterMeta).forEach(([a,r])=>{let n=L(a);if(!n||!r||typeof r!="object")return;let i=w(r.status),c=w(r.notes),l=!!r.hidden;(i||c||l)&&(t.rosterMeta[n]={status:i,notes:c,hidden:l})}),e.buildCards&&typeof e.buildCards=="object"&&Object.entries(e.buildCards).forEach(([a,r])=>{let n=L(a);if(!n||!r||typeof r!="object")return;let i={};r.class&&(i.class=w(r.class)),r.university&&(i.university=w(r.university)),(r.characterName||r.character_name||r.name)&&(i.characterName=j(r.characterName||r.character_name||r.name)),t.buildCards[n]=i})),t}var Z={key:"oracleOfflineState",read(){try{let e=localStorage.getItem(this.key);if(!e)return null;let t=JSON.parse(e);if(t&&typeof t=="object"&&t.version===1&&t.state)return z(t.state)}catch(e){console.warn("Offline cache read failed",e)}return null},write(e){try{localStorage.setItem(this.key,JSON.stringify({version:1,state:e}))}catch(t){console.warn("Offline cache write failed",t)}},clear(){try{localStorage.removeItem(this.key)}catch{}}},J=(function(){let e=document.getElementById("networkBanner"),t=0,a="";function r(){if(e){if(a){e.textContent=`\u26A0\uFE0F ${a}`,e.classList.add("error"),e.classList.remove("loading"),e.hidden=!1;return}t>0?(e.textContent="Syncing with the Oracle Archives\u2026",e.classList.add("loading"),e.classList.remove("error"),e.hidden=!1):(e.hidden=!0,e.classList.remove("error"),e.classList.remove("loading"))}}return{begin(){t++,r()},end(){t=Math.max(0,t-1),r()},setError(n){a=n||"Network request failed.",r()},clearError(){a="",r()}}})(),U=(function(){let e=document.getElementById("draftStatus");function t(a,r="info"){e&&(e.textContent=a,e.dataset.tone=r)}return{info(a){t(a,"info")},success(a){t(a,"success")},error(a){t(a,"error")}}})();function ae(e){if(!X||/^https?:/i.test(e))return e;try{return new URL(e,X).toString()}catch{return X.replace(/\/$/,"")+e}}async function O(e,t={}){let a=ae(e),r={...t};r.headers={...t.headers||{}},r.body&&!(r.body instanceof FormData)&&!r.headers["Content-Type"]&&(r.headers["Content-Type"]="application/json"),J.begin();try{let n=await fetch(a,r);if(!n.ok){let l=await n.text();throw new Error(l||`Request failed (${n.status})`)}let i=n.headers.get("content-type")||"",c=null;return i.includes("application/json")?c=await n.json():c=await n.text(),J.clearError(),c}catch(n){throw J.setError(n&&n.message?n.message:"Network request failed."),n}finally{J.end()}}function Ne(){let e=document.getElementById("current-player-banner");if(!e)return;let t=I;if(!t){e.innerHTML="";return}let a=M.getRosterEntry(),r=(a==null?void 0:a.name)||t,i=M.isGuest()?"Guest":r;e.innerHTML=`
    <div class="player-banner">
      <span class="player-banner__text">Logged in as <span class="player-banner__name">${x(i)}</span></span>
      <button type="button" class="player-banner__logout" id="logout-btn">Logout</button>
    </div>
  `;let c=document.getElementById("logout-btn");c&&(c.onclick=Le)}function Le(){M.clear(),window.location.href="./login.html"}window.APP_UTILS=window.APP_UTILS||{};window.APP_UTILS.testApiConnection=async function(){let t=await O("/api/state",{headers:{Accept:"application/json"}});return console.info("[OracleTournament] /api/state responded with:",t),t};var q={data:z(me),offline:!0,fallback:z(me),listeners:new Set,apply(e,t="remote"){let a=z(e);return this.data=a,t==="remote"?(Z.write(a),this.offline=!1):(this.offline=!0,t==="offline-cache"&&Z.write(a)),this.notify(),a},useFallbackSessions(e){Array.isArray(e)&&(this.fallback.sessions=e.map(t=>{let a=ge(t);return a?{...a,players:Array.isArray(a.players)?a.players.map(r=>({...r})):[]}:null}).filter(Boolean))},useDefaultFallback(){this.apply(this.fallback,"offline-default")},loadFallbackFromCache(){let e=Z.read();return e?(this.apply(e,"offline-cache"),!0):!1},async refresh(){try{let e=await O("/api/state",{headers:{Accept:"application/json"}});if(!e||typeof e!="object"||!e.state)throw new Error("Invalid response from datastore.");return this.apply(e.state,"remote"),this.data}catch(e){throw this.loadFallbackFromCache()||this.useDefaultFallback(),e}},subscribe(e){if(typeof e=="function"){this.listeners.add(e);try{e(this.data)}catch(t){console.error(t)}}return()=>this.listeners.delete(e)},notify(){this.listeners.forEach(e=>{try{e(this.data)}catch(t){console.error(t)}})},getSessionsCopy(){return this.data.sessions.map(e=>({...e,players:Array.isArray(e.players)?e.players.map(t=>({...t})):[]}))}},V={async joinSession(e,t){Y("join sessions");let a=M.getRosterEntry(),r={...t,playerKey:(t==null?void 0:t.playerKey)||I,playerName:(t==null?void 0:t.playerName)||(a==null?void 0:a.name)||"",characterName:(t==null?void 0:t.characterName)||(t==null?void 0:t.name)},n=await O(`/api/sessions/${encodeURIComponent(e)}/join`,{method:"POST",body:JSON.stringify(r)});return n&&n.state&&q.apply(n.state,"remote"),n},async leaveSession(e,t){Y("leave sessions");let a={...t,playerKey:(t==null?void 0:t.playerKey)||I},r=await O(`/api/sessions/${encodeURIComponent(e)}/leave`,{method:"POST",body:JSON.stringify(a)});return r&&r.state&&q.apply(r.state,"remote"),r},async addRosterExtra(e){Y("add roster entries");let t=await O("/api/roster/extras",{method:"POST",body:JSON.stringify(e)});return t&&t.state&&q.apply(t.state,"remote"),t},async updateRosterEntry(e,t){Y("edit the roster");let a=await O(`/api/roster/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)});return a&&a.state&&q.apply(a.state,"remote"),a},async removeRosterExtra(e){Y("remove roster entries");let t=await O(`/api/roster/extras/${encodeURIComponent(e)}`,{method:"DELETE"});return t&&t.state&&q.apply(t.state,"remote"),t}},be={read(){return q.data.rosterExtras}},De={read(){return q.data.rosterMeta}},Pe={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function j(e){return String(e!=null?e:"").trim()}function w(e){return String(e!=null?e:"").trim()}function L(e){return j(e).toLowerCase()}function x(e){return String(e!=null?e:"").replace(/[&<>"']/g,t=>Pe[t]||t)}function pe(e){return x(e)}var ke=new Set;function Se(e){let t=L(e);return t?ke.has(t)?!0:be.read().some(a=>a.key===t):!1}async function qe(e,t="",a=""){if(D)return{ok:!1,msg:B};let r=j(e);if(!r)return{ok:!1,msg:"Name is required."};let n=L(r);if(Se(n))return{ok:!1,msg:`${r} is already on the roster.`};let i=w(t),c=w(a);try{return await V.addRosterExtra({name:r,status:i,notes:c}),{ok:!0,key:n,name:r}}catch(l){return{ok:!1,msg:l&&l.message?l.message:"Failed to add roster entry."}}}async function _e(e,t,a,r,n){if(D)throw new Error(B);let i=L(e);if(!i)return;let c=w(a),l=w(r),d=n==null?!!(t&&t.hidden):!!n;await V.updateRosterEntry(i,{status:c,notes:l,custom:!!(t&&t.custom),name:t&&t.name?j(t.name):"",hidden:d})}function we(e={}){let t=!!e.includeHidden,a=be.read(),r=De.read(),n=[];return S.roster.forEach(i=>{let c=L(i.key||i.name),l=r[c]||{},d={name:i.name,key:c,status:l.status||w(i.status),notes:l.notes||w(i.notes),custom:!1,hidden:!!l.hidden};d.hidden&&!t||n.push(d)}),a.forEach(i=>{let c=L(i.key||i.name),l=r[c]||{},d={name:i.name,key:c,status:l.status||w(i.status),notes:l.notes||w(i.notes),custom:!0,hidden:!!l.hidden};d.hidden&&!t||n.push(d)}),n.sort((i,c)=>i.name.localeCompare(c.name,"en",{sensitivity:"base"}))}function he(e){let t=a=>String(a).padStart(2,"0");return e.getFullYear()+t(e.getMonth()+1)+t(e.getDate())+"T"+t(e.getHours())+t(e.getMinutes())+t(e.getSeconds())}function Be(e){let t="America/Edmonton",a=new Date(e.date+"T19:00:00"),r=new Date(e.date+"T21:00:00"),i=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//OracleTrials//Scheduler//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",`UID:${`${e.id}@oracletrials`}`,`SUMMARY:${e.title}`,`DESCRIPTION:DM: ${e.dm} | Capacity: ${e.capacity}`,`DTSTART;TZID=${t}:${he(a)}`,`DTEND;TZID=${t}:${he(r)}`,"END:VEVENT","END:VCALENDAR"].join(`\r
`),c=new Blob([i],{type:"text/calendar"}),l=document.createElement("a");l.href=URL.createObjectURL(c),l.download=`${e.title.replace(/\s+/g,"-")}.ics`,l.click(),URL.revokeObjectURL(l.href)}var S={levels:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],abilityArrays:{standard:[15,14,13,12,10,8]},universities:[{key:"lorehold",name:"Lorehold",theme:"History & Spirits",colours:"Red/White",focus:"Archaeomancy",playstyle:"Scholar / Explorer",flavour:"Archaeology, ruins, and talking to the dead. You're a history nerd, relic hunter, or spirit-whisperer. Great for bards, clerics, wizards, paladins with a sense of destiny.",spells:{1:["Comprehend Languages","Identify"],2:["Borrowed Knowledge","Locate Object"],3:["Speak with Dead","Spirit Guardians"],4:["Arcane Eye","Stone Shape"],5:["Flame Strike","Legend Lore"]}},{key:"prismari",name:"Prismari",theme:"Elemental Arts",colours:"Blue/Red",focus:"Performance & Elements",playstyle:"Passion / Spectacle",flavour:"Art, performance, and loud elemental magic. You're a drama kid with fireballs, a dancer who sculpts lightning, or a painter with ice. Great for sorcerers, druids, wizards, monks (Four Elements), and flashy fighters or rogues.",spells:{1:["Chromatic Orb","Thunderwave"],2:["Flaming Sphere","Kinetic Jaunt"],3:["Haste","Water Walk"],4:["Freedom of Movement","Wall of Fire"],5:["Cone of Cold","Conjure Elemental"]}},{key:"quandrix",name:"Quandrix",theme:"Math & Nature",colours:"Blue/Green",focus:"Fractals / Growth",playstyle:"Logical / Curious",flavour:"Math wizards and pattern-brains. You see reality as numbers, fractals, and equations and then bend them. Great for wizards, druids, sorcerers, or any clever type.",spells:{1:["Entangle","Guiding Bolt"],2:["Enlarge/Reduce","Vortex Warp"],3:["Aura of Vitality","Haste"],4:["Control Water","Freedom of Movement"],5:["Circle of Power","Passwall"]}},{key:"silverquill",name:"Silverquill",theme:"Eloquence & Ink",colours:"White/Black",focus:"Radiance & Shadow",playstyle:"Charisma / Wit",flavour:"Word mages: debate champions, terrifying public speakers, poets with knives in their metaphors. Great for bards, warlocks, clerics, and persuasive rogues or paladins.",spells:{1:["Dissonant Whispers","Silvery Barbs"],2:["Calm Emotions","Darkness"],3:["Beacon of Hope","Daylight"],4:["Compulsion","Confusion"],5:["Dominate Person","Rary's Telepathic Bond"]}},{key:"witherbloom",name:"Witherbloom",theme:"Life & Decay",colours:"Green/Black",focus:"Alchemy / Essence",playstyle:"Healer / Witch",flavour:"Swamp goths and weird herbalists. You brew potions, poke at corpses (academically), and balance life and decay. Great for druids, warlocks, rangers, barbarians, and spooky clerics.",spells:{1:["Cure Wounds","Inflict Wounds"],2:["Lesser Restoration","Wither and Bloom"],3:["Revivify","Vampiric Touch"],4:["Blight","Death Ward"],5:["Antilife Shell","Greater Restoration"]}}],backgrounds:[{key:"lorehold-student",name:"Lorehold Student",skills:["History","Religion"],tools:[],languages:"2 of choice",gear:["Ink/pen","Hammer","Lantern","History tome","Uniform"],feat:"Strixhaven Initiate (Lorehold)"},{key:"prismari-student",name:"Prismari Student",skills:["Acrobatics","Performance"],tools:["+1 instrument/tool"],languages:"1",gear:["Ink/pen","Artisan tools or Instrument","Uniform"],feat:"Strixhaven Initiate (Prismari)"},{key:"quandrix-student",name:"Quandrix Student",skills:["Arcana","Nature"],tools:["+1 artisan tool"],languages:"1",gear:["Ink/pen","Abacus","Arcane theory book","Uniform"],feat:"Strixhaven Initiite (Silverquill)"},{key:"silverquill-student",name:"Silverquill Student",skills:["Intimidation","Persuasion"],tools:[],languages:"2",gear:["Ink/pen","Poetry book","Uniform"],feat:"Strixhaven Initiite (Silverquill)"},{key:"witherbloom-student",name:"Witherbloom Student",skills:["Nature","Survival"],tools:["Herbalism Kit"],languages:"1",gear:["Plant ID book","Iron pot","Herbalism kit","Uniform"],feat:"Strixhaven Initiate (Witherbloom)"}],feats:{strixhavenInitiate:{name:"Strixhaven Initiate",text:"Choose your college; learn 2 cantrips from its list + one 1st-level spell. Cast the 1st-level spell once per long rest without a slot; also with slots. Choose Int/Wis/Cha as spellcasting ability for these."}},extracurriculars:[{key:"dead-languages",name:"Dead Languages Society",skills:["Athletics","History"]},{key:"fine-artists",name:"Distinguished Society of Fine Artists",skills:["Performance","Sleight of Hand"]},{key:"dragonchess",name:"Dragonchess Club",skills:["Deception","Investigation"]},{key:"historical-soc",name:"Dragonsguard Historical Society",skills:["Arcana","History"]},{key:"horticulture",name:"Fantastical Horticulture Club",skills:["Nature","Survival"]},{key:"entrepreneurs",name:"Future Entrepreneurs of Strixhaven",skills:["Insight","Persuasion"]},{key:"gymnastics",name:"Intramural Gymnastics",skills:["Acrobatics","Performance"]},{key:"silkball",name:"Silkball Club",skills:["Athletics","Intimidation"]},{key:"water-dance",name:"Water-Dancing Club",skills:["Athletics","Performance"]},{key:"larp",name:"LARP Guild",skills:["Animal Handling","Performance"]},{key:"cheer",name:"Mage Tower Cheer",skills:["Perception","Persuasion"]},{key:"drama",name:"Playactors Drama Guild",skills:["Arcana","Deception"]},{key:"iron-lifters",name:"Iron-Lifters",skills:["Athletics","Medicine"]},{key:"show-band",name:"Show Band",skills:["Sleight of Hand","Performance"]},{key:"newspaper",name:"Strixhaven Star (Newspaper)",skills:["Investigation","Insight"]},{key:"faith",name:"Student-Mages of Faith",skills:["Insight","Religion"]}],jobs:[{key:"biblioplex",name:"Biblioplex",skills:["Arcana","History"]},{key:"firejolt",name:"Firejolt Caf\xE9",skills:["Insight","Persuasion"]},{key:"bowsend",name:"Bow's End Tavern",skills:["Performance","Deception"]},{key:"stadium",name:"Stadium",skills:["Athletics","Intimidation"]},{key:"performing-arts",name:"Performing Arts Society",skills:["Performance","Deception"]},{key:"dorms",name:"Dormitories",skills:["Persuasion","Perception"]},{key:"grounds",name:"Campus Grounds",skills:["Nature","Survival"]},{key:"labs",name:"Magic Labs",skills:["Arcana","Investigation"]},{key:"intramural",name:"Intramural Fields",skills:["Athletics","Acrobatics"]}],roster:[{name:"Kaela",status:"Yes",key:"kaela123"},{name:"Tory DM",status:"Yes",key:"torydm123"},{name:"Mike",status:"Pending",key:"mike2025"},{name:"Megan",status:"Pending",key:"megan2025"},{name:"Jocelyn",status:"Pending",key:"joss2025"},{name:"Emory",status:"Pending",key:"emory2025"},{name:"Snack Erin",status:"Yes",key:"snacks"},{name:"Erin",status:"Yes",key:"erin2627"},{name:"Trevor",status:"Yes",key:"trev2227"},{name:"Amy",status:"Yes",key:"amyoracle"},{name:"Nicole",status:"Yes",key:"nicole2627"},{name:"Spencer",status:"Yes",key:"spence2627"},{name:"Marvin",status:"Pending",key:"marv2025"},{name:"Megan E",status:"Pending",key:"megane2025"},{name:"Jordan",status:"Pending",key:"jordan2025"},{name:"Becca",status:"Yes",key:"becca2728"},{name:"Evan",status:"Yes",key:"evan2728"},{name:"Lyric",status:"Pending",key:"lyric2025"},{name:"Lazarus",status:"Yes",key:"laz_kids"},{name:"Aramis",status:"Pending",key:"aramis2025"},{name:"James",status:"Pending",key:"james2025"},{name:"David",status:"Pending",key:"david2025"},{name:"Nova",status:"Yes",key:"nova_any"},{name:"Melissa",status:"Yes",key:"melissa_not28"},{name:"Josh",status:"Yes",key:"josh222729"},{name:"Marilyn",status:"Pending",key:"marilyn2025"}],sessions:[]};S.roster=[...S.roster].sort((e,t)=>e.name.localeCompare(t.name,"en"));ke=new Set(S.roster.map(e=>L(e.key||e.name)));q.useDefaultFallback();var ye={hardNo:["Link"],blockedDates:{Melissa:["2025-12-28"]}};function Ce(){let e=[];try{if(!Array.isArray(S.sessions))e.push("DATA.sessions is missing or not an array.");else{let t=new Set;S.sessions.forEach((a,r)=>{if(!a||typeof a!="object"){e.push(`sessions[${r}] is not an object`);return}a.id||e.push(`sessions[${r}] is missing an id`),a.id&&(t.has(a.id)?e.push(`Duplicate session id: ${a.id}`):t.add(a.id)),/^\d{4}-\d{2}-\d{2}$/.test(String(a.date||""))||e.push(`${a.title||a.id||"session#"+r} has non-ISO date "${a.date}"`),typeof a.capacity!="number"&&e.push(`${a.title||a.id||"session#"+r} capacity must be a number`)})}}catch{e.push("DATA.sessions could not be validated.")}try{Array.isArray(S.roster)||e.push("DATA.roster is missing or not an array.")}catch{e.push("DATA.roster could not be validated.")}return e}function Ae(e){if(!e||!e.length)return;let t=document.querySelector("main"),a=document.createElement("div");a.className="panel",a.style.border="1px solid #f14a3b",a.style.background="#1d1111",a.innerHTML=`
      <h2>Configuration issues</h2>
      <p>Fix the items below, then refresh. If you changed dates/IDs recently, hit <strong>Clear Local Data</strong> in the sidebar.</p>
      <ul>${e.map(r=>`<li>${r.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</li>`).join("")}</ul>
    `,t.prepend(a)}window.addEventListener("error",e=>{let t=document.querySelector("main");if(!t)return;let a=document.createElement("div");a.className="panel",a.style.border="1px solid #f14a3b",a.style.background="#1d1111",a.innerHTML=`<strong>Runtime error:</strong> ${String(e.message||"Unknown error")}`,t.prepend(a)});var G={key:"oracleTrialsSave",read(){try{let e=localStorage.getItem(this.key);return e?JSON.parse(e):null}catch(e){return console.warn("Local draft read failed",e),null}},write(e){try{localStorage.setItem(this.key,JSON.stringify(e))}catch(t){console.warn("Local draft write failed",t)}},clear(){try{localStorage.removeItem(this.key)}catch(e){console.warn("Local draft clear failed",e)}}};function K(e){try{return JSON.parse(JSON.stringify(e||{}))}catch(t){return console.warn("Draft clone failed",t),{}}}async function xe(e){if(!e)return console.warn("loadSavedBuildForPlayer: no playerKey provided"),null;try{let t=encodeURIComponent(e),a=await fetch(ae(`/api/builds/${t}`),{headers:{Accept:"application/json"}});if(a.status===404)return null;if(!a.ok){let n=await a.text();return console.error("loadSavedBuildForPlayer failed:",n),null}return await a.json()}catch(t){return console.error("loadSavedBuildForPlayer error:",t),null}}async function je(e,t){if(!e)return console.warn("saveBuildForPlayer: no playerKey provided"),!1;if(!t||typeof t!="object")return console.warn("saveBuildForPlayer: invalid build object"),!1;try{let a=encodeURIComponent(e),r=await fetch(ae(`/api/builds/${a}`),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!r.ok){let n=await r.text();return console.error("saveBuildForPlayer failed:",n),!1}return!0}catch(a){return console.error("saveBuildForPlayer error:",a),!1}}var m={data:{meta:{version:"0.5-stable"},core:{playerName:"",name:"",race:"",class:"",background:"",level:4,abilityMethod:"standard",abilities:{STR:15,DEX:14,CON:13,INT:12,WIS:10,CHA:8},equipment:"class"},university:{key:"",spellAbility:"INT"},feats:[],extras:{job:null,clubs:[],studentDice:[]},personality:{traits:"",ideal:"",bond:"",rival:"",goal:"",prompt:""},exams:{notes:"",studyRerolls:0,results:[]}},sessions:[],async save(){let e=K(this.data);return G.write(e),U.info("Draft saved locally."),D?(U.info("Guest saves stay in this browser. Enter your access code to sync online."),!0):(je(I,e).then(t=>{t?(console.info("Build synced to Oracle Archives via /api/builds"),U.success("Draft saved locally and synced to the Oracle Archives.")):(console.warn("Build sync returned false"),U.info("Draft saved locally. Sync to Oracle Archives may have failed."))}),!0)},async load(){let e=G.read();if(e)return this.data=K(e),te(),U.info("Loaded the draft stored in this browser."),!0;if(!D){let t=await xe(I);if(t&&typeof t=="object")return this.data=K(t),G.write(this.data),te(),U.success("Draft loaded from the Oracle Archives."),!0}return U.error("No saved drafts yet."),alert("No saved draft found. Create and save a character first."),!1},export(){let e=new Blob([JSON.stringify({character:this.data,sessions:this.sessions},null,2)],{type:"application/json"}),t=URL.createObjectURL(e),a=document.createElement("a");a.href=t,a.download=`oracle-trials-${(this.data.core.name||"character").toLowerCase().replace(/[^a-z0-9-]/g,"-")}.json`,a.click(),URL.revokeObjectURL(t)}};q.subscribe(()=>{var e;if(m.sessions=q.getSessionsCopy(),(e=m==null?void 0:m.data)!=null&&e.core){let t=M.getRosterEntry();t&&!m.data.core.playerName&&(m.data.core.playerName=t.name)}});function Re(){var l,d,h;let e=((l=m.data)==null?void 0:l.core)||{},t=((d=m.data)==null?void 0:d.university)||{},a=e.name&&e.name.trim().length>0,r="";if(a){let f=x(e.name||""),g=x(e.class||"No class"),b=e.level||"?",N=t.key||"",$=N?((h=(S.universities||[]).find(y=>y.key===N))==null?void 0:h.name)||N:"No college";r=`
      <div class="dashboard-stat"><strong>${f}</strong></div>
      <div class="dashboard-detail">${g} \u2022 Level ${b}</div>
      <div class="dashboard-detail">${x($)}</div>
      <button class="secondary dashboard-btn" data-nav="builder">Edit Character \u2192</button>
    `}else r=`
      <div class="dashboard-empty">No character saved yet.</div>
      <div class="muted">Visit the Character Builder step to get started.</div>
      <button class="primary dashboard-btn" data-nav="builder">Create Character \u2192</button>
    `;let n=m.sessions||[],i=null;for(let f of n)if(I&&Q(f,I)){i=f;break}let c="";if(i){let f=(i.players||[]).length;c=`
      <div class="dashboard-stat"><strong>${x(i.title)}</strong></div>
      <div class="dashboard-detail">${x(i.date)} \u2022 DM: ${x(i.dm||"TBD")}</div>
      <div class="dashboard-detail">Capacity: ${f}/${i.capacity}</div>
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
      ${r}
    </div>
    <div class="dashboard-card" id="dashboard-session">
      <h4 class="dashboard-title">\u{1F3AD} My Session</h4>
      ${c}
    </div>
  </div>
</div>
`}function Oe(e){e.querySelectorAll("button[data-nav]").forEach(t=>{t.onclick=()=>{let a=t.dataset.nav;if(!P)return;let r=P.findIndex(n=>n.key===a);r>=0&&F(r,!0)}})}function fe(){let e=m.data.core||{},t=m.data.university||{};return!!(e.name&&e.name.trim().length>=2&&e.class&&e.class.trim()&&e.level&&Number.isFinite(+e.level)&&t.key&&t.key.trim())}function ee(e,t={readOnly:!1}){let{readOnly:a=!1}=t;e.innerHTML="";let r=q.data.buildCards||{};m.sessions.slice().sort((n,i)=>n.date.localeCompare(i.date)).forEach(n=>{let i=(n.players||[]).length,c=i>=n.capacity,l=I?Q(n,I):!1,d=i?(Array.isArray(n.players)?n.players:[]).map(y=>{let C=y&&y.key?r[y.key]:null,T="";if(C){let s=x(C.class||"?"),o=x(C.university||"?");T=` \u2014 <span class="muted">${s} \u2022 ${o}</span>`}let E=x(y&&(y.character||y.name||y.playerName||"Player"));return`<div class="${L(y&&y.key)===I?"pill pill--highlight":"pill"}"><span>${E}</span>${T}</div>`}).join(""):'<span class="muted">No players yet</span>',h="";if(!a)if(l)h=`<button data-leave-id="${pe(n.id)}" class="danger">Leave this session</button>`;else{let y=!fe()||c?"disabled":"";h=`<button data-id="${pe(n.id)}" class="primary" ${y}>Add my character</button>`}let f=n.theme?`<div class="muted"><strong>Theme:</strong> ${x(n.theme)}</div>`:"",g=n.focus?`<div class="muted"><strong>Focus:</strong> ${x(n.focus)}</div>`:"",b=n.finale?'<span class="tag tag--finale">\u2605 Finale</span>':"",N=l?'<span class="tag tag--joined">\u2713 Joined</span>':"",$=document.createElement("div");$.className=l?"card card--joined":"card",$.innerHTML=`
        <div class="flex" style="justify-content:space-between">
          <div>
            <strong>${x(n.title)}</strong> ${b} ${N}
            <div class="muted">${x(n.date)} \u2022 DM: ${x(n.dm||"")} \u2022 Capacity: ${i}/${n.capacity}</div>
            ${f}
            ${g}
            ${!a&&!l&&!fe()?'<div class="muted" style="margin-top:6px">Finish <em>Core 5e</em> + choose a <em>University</em> to join.</div>':""}
            ${!a&&!l&&c?'<div class="muted" style="margin-top:6px">This session is full.</div>':""}
          </div>
          <div class="flex">
            ${h}
            <button data-ics="${n.id}">.ics</button>
          </div>
        </div>
        <div style="margin-top:8px" class="flex">${d}</div>
      `,e.appendChild($)})}function Me(e){let t=e.querySelector("#commentForm"),a=e.querySelector("#commentText"),r=e.querySelector("#commentPlayer"),n=e.querySelector("#commentCharacter"),i=e.querySelector("#commentSession"),c=e.querySelector("#commentList"),l=e.querySelector("#refreshComments"),d=e.querySelector("#commentStatus");if(!t||!a||!c)return;let h=0,f=t.querySelector('button[type="submit"]'),g=D,b=(s,o="success")=>{if(d){try{window.clearTimeout(h)}catch{}d.textContent=s,d.dataset.tone=o,d.hidden=!1,h=window.setTimeout(()=>{d.hidden=!0},3600)}};if(d&&(d.hidden=!0),g){[a,r,n,i].forEach(o=>{o&&(o.disabled=!0,o.setAttribute("aria-disabled","true"))}),f&&(f.disabled=!0,f.title=B,f.textContent="Comments disabled for guests");let s=document.createElement("p");s.className="muted",s.textContent=B,t.appendChild(s)}let N=s=>{try{return new Date(s).toLocaleString(void 0,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}catch{return s}},$=s=>s.slice().sort((o,u)=>{let p=new Date((o==null?void 0:o.createdAt)||0).getTime();return new Date((u==null?void 0:u.createdAt)||0).getTime()-p}),y=s=>{var W,re,ne,oe,ie,le,ce;if(!s||typeof s!="object")return null;let o=((re=(W=s.id)!=null?W:s.comment_id)!=null?re:"").toString().trim(),u=((oe=(ne=s.comment)!=null?ne:s.text)!=null?oe:"").toString().trim();if(!u)return null;let p=w((ie=s.playerName)!=null?ie:s.player_name),v=w((le=s.characterName)!=null?le:s.character_name),A=w((ce=s.sessionId)!=null?ce:s.session_id),k=s.createdAt||s.created_at||s.stamp;if(k){let de=new Date(k);k=Number.isNaN(de.getTime())?new Date().toISOString():de.toISOString()}else k=new Date().toISOString();return{id:o||`local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,playerName:p,characterName:v,sessionId:A,comment:u,createdAt:k}},C={comments:[],loading:!1},T=s=>{let o=new Set,u=[];return(s||[]).forEach(p=>{let v=p&&p.comment?p:y(p);!v||!v.comment||o.has(v.id)||(o.add(v.id),u.push(v))}),C.comments=$(u),C.comments},E=()=>{if(C.loading){c.innerHTML='<p class="comment-empty">Loading comments\u2026</p>';return}if(!C.comments.length){c.innerHTML='<p class="comment-empty">No comments yet. Add the first note above.</p>';return}c.innerHTML="",C.comments.forEach(s=>{if(!s||!s.comment)return;let o=document.createElement("div");o.className="comment-item",o.dataset.pending=s.pending?"true":"false";let u=document.createElement("p");if(u.textContent=s.comment,o.appendChild(u),s.playerName||s.characterName||s.sessionId){let A=document.createElement("div");if(A.className="comment-meta",s.playerName){let k=document.createElement("span");k.textContent=`Player: ${s.playerName}`,A.appendChild(k)}if(s.characterName){let k=document.createElement("span");k.textContent=`Character: ${s.characterName}`,A.appendChild(k)}if(s.sessionId){let k=document.createElement("span");k.textContent=`Session: ${s.sessionId}`,A.appendChild(k)}o.appendChild(A)}let p=document.createElement("time");p.dateTime=s.createdAt,p.textContent=N(s.createdAt),o.appendChild(p);let v=document.createElement("button");v.type="button",v.className="danger",s.pending?(v.textContent="Posting\u2026",v.disabled=!0):g?(v.textContent="Delete",v.disabled=!0,v.title=B):(v.textContent="Delete",v.addEventListener("click",()=>{R(s)})),o.appendChild(v),c.appendChild(o)})},_=async({silent:s=!1}={})=>{C.loading=!0,E();try{let o=await O("/api/comments",{headers:{Accept:"application/json"}}),u=Array.isArray(o==null?void 0:o.comments)?o.comments:[];T(u.map(y).filter(Boolean)),s||b("Comments updated.","info")}catch(o){throw s||b(o&&o.message?o.message:"Failed to load comments.","error"),o}finally{C.loading=!1,E()}},R=async s=>{if(g){b(B,"error");return}if(!s||!s.id||!(typeof confirm=="function"?confirm("Delete this comment?"):!0))return;let u=C.comments.slice();T(u.filter(p=>p.id!==s.id)),E(),b("Removing comment\u2026","info");try{await O(`/api/comments/${encodeURIComponent(s.id)}`,{method:"DELETE"}),b("Comment deleted.","info")}catch(p){T(u),E(),b(p&&p.message?p.message:"Failed to delete comment.","error")}};t.addEventListener("submit",async s=>{if(s.preventDefault(),g){b(B,"error");return}let o=(a.value||"").trim();if(!o){b("Comment text is required.","error");return}let u=r?w(r.value):"",p=n?w(n.value):"",v=i?w(i.value):"",A=C.comments.slice(),k={id:`pending-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,playerName:u,characterName:p,sessionId:v,comment:o,createdAt:new Date().toISOString(),pending:!0};T([k,...A]),E(),b("Posting comment\u2026","info"),f&&(f.disabled=!0);try{let H=await O("/api/comments",{method:"POST",body:JSON.stringify({playerName:u,characterName:p,sessionId:v,comment:o})}),W=y(H&&H.comment);if(!W)throw new Error("Invalid response from datastore.");T([W,...A]),E(),a&&(a.value=""),r&&(r.value=""),n&&(n.value=""),i&&(i.value=""),b("Comment posted!","success")}catch(H){T(A),E(),H&&H.message?b(H.message,"error"):b("Failed to post comment.","error")}finally{f&&(f.disabled=!1)}}),l&&l.addEventListener("click",s=>{s.preventDefault(),_().catch(o=>{o&&o.message?b(o.message,"error"):b("Failed to refresh comments.","error")})}),E(),_({silent:!0}).catch(s=>{s&&s.message?b(s.message,"error"):b("Unable to load comments.","error")})}async function Fe(e=document){var a;let t=(a=e==null?void 0:e.querySelector)==null?void 0:a.call(e,"#questList");if(t){t.innerHTML='<p class="muted">Loading quests\u2026</p>';try{let r=await fetch("./site/data/quests.json",{cache:"no-store"});if(!r.ok)throw new Error(`Request failed: ${r.status}`);let n=await r.json();if(!Array.isArray(n)||!n.length){t.innerHTML='<p class="muted">No quests are published yet. Check back soon.</p>';return}let i=document.createDocumentFragment();n.forEach(c=>{var f;if(!c||typeof c!="object")return;let l=document.createElement("article");l.className="quest-card";let d=document.createElement("h4");d.textContent=c.title||`Quest #${(f=c.id)!=null?f:"?"}`,l.appendChild(d);let h=document.createElement("div");if(h.className="quest-meta",typeof c.id!="undefined"){let g=document.createElement("span");g.textContent=`ID ${c.id}`,h.appendChild(g)}if(c.status){let g=document.createElement("span");g.textContent=`Status: ${c.status}`,h.appendChild(g)}if(h.childNodes.length&&l.appendChild(h),c.notes){let g=document.createElement("p");g.className="quest-notes",g.textContent=c.notes,l.appendChild(g)}i.appendChild(l)}),t.innerHTML="",t.appendChild(i)}catch(r){console.error("Quest board failed",r),t.innerHTML='<p class="muted">Unable to load quests right now. Try refreshing later.</p>'}}}function He(){return q.data.buildCards||{}}var P=[{key:"intro",title:"Welcome",hint:"Overview & updates"},{key:"builder",title:"Character Builder",hint:"Core, college, flavour"},{key:"join",title:"Join a Session",hint:"Reserve a seat"},{key:"summary",title:"Summary & Export",hint:"Share or download"}],se=0;function Ue(){let e=document.getElementById("stepNav");if(!e)return;let t=e.querySelector('button[aria-selected="true"]');t&&t.focus()}function F(e,t=!1){Number.isNaN(e)||e<0||e>=P.length||(se=e,$e(),Ee(),t&&Ue())}function Ge(e){let t=e.target;if(!t||t.getAttribute("role")!=="tab")return;let a=e.key,r=Number(t.dataset.index||"0"),n=null;a==="ArrowRight"||a==="ArrowDown"?n=(r+1)%P.length:a==="ArrowLeft"||a==="ArrowUp"?n=(r-1+P.length)%P.length:a==="Home"?n=0:a==="End"&&(n=P.length-1),n!==null&&(e.preventDefault(),F(n,!0))}function Ee(){let e=document.getElementById("stepNav");if(!e)return;let t=e.scrollLeft;e.innerHTML="",e.setAttribute("role","tablist"),e.setAttribute("aria-label","Character builder steps");let a=document.createDocumentFragment();if(P.forEach((i,c)=>{let l=document.createElement("button");l.type="button",l.id=`step-tab-${i.key}`,l.className="step-pill",l.dataset.step=i.key,l.dataset.index=String(c),l.setAttribute("role","tab"),l.setAttribute("aria-controls",`panel-${i.key}`);let d=c===se;l.setAttribute("aria-selected",d?"true":"false"),l.setAttribute("tabindex",d?"0":"-1");let h=i.hint?`<small>${x(i.hint)}</small>`:"";l.innerHTML=`
        <span class="step-number">${c+1}</span>
        <span class="step-label"><span>${x(i.title)}</span>${h}</span>
      `,l.addEventListener("click",()=>{F(c,!0)}),a.appendChild(l)}),e.appendChild(a),e.dataset.keysBound||(e.addEventListener("keydown",Ge),e.dataset.keysBound="true"),e.scrollWidth>e.clientWidth+8){let i=e.querySelector('button[aria-selected="true"]');if(i)try{i.scrollIntoView({block:"nearest",inline:"center"})}catch{}}else e.scrollLeft=t;let r=document.getElementById("cfgBadge"),n=Ce();r.textContent=n.length?`\u26A0\uFE0F ${n.length} config issue${n.length>1?"s":""}`:"\u2705 config OK"}function $e(){let e=document.getElementById("panels");if(!e)return;e.innerHTML="";let t=P[se].key,a=null;t==="builder"&&(a=Ye()),t==="summary"&&(a=Ke()),t==="intro"&&(a=We()),t==="join"&&(a=Je()),a&&(a.id=`panel-${t}`,a.setAttribute("role","tabpanel"),a.setAttribute("aria-labelledby",`step-tab-${t}`),a.setAttribute("tabindex","0"),e.appendChild(a))}function We(){let e=document.createElement("div");e.className="panel";let t=Re();return e.innerHTML=t+`
<div class="card">
  <h2>Welcome to the Oracle Trials</h2>
  <p>This site is your student portal for the Oracle Trials \u2014 a Strixhaven-inspired D&amp;D event.</p>
  <p>You'll use it to:</p>
  <ul>
    <li>Create your Strixhaven student character</li>
    <li>Save their key details</li>
    <li>Reserve a seat at one of the Trial sessions</li>
  </ul>
  <p>You don't have to do everything in one sitting. As long as you use the same access code, you can come back to update your character or change sessions.</p>
  <p><strong>How it works (big picture):</strong></p>
  <ul>
    <li><strong>Build your student</strong> \u2013 Choose a name, class, level, and Strixhaven college.</li>
    <li><strong>Save your character</strong> \u2013 We'll store your details so you don't lose them.</li>
    <li><strong>Join a Trial session</strong> \u2013 Pick one date that fits your schedule.</li>
  </ul>
  <p>When you're done, you'll see your choices in the "My Character" and "My Session" panels at the top of the page. That's your "I'm ready" indicator.</p>
</div>

<details class="scroll-letter">
  <summary>
    <span class="seal">\u2736</span>
    Official Correspondence: The Oracle Apprentice Qualification Trials
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

    <p>Strixhaven is honoured to welcome distinguished students and faculty from magical academies across the planes for this year's Oracle Trials. Each institution brings its own traditions, theories, and flavour of chaos to the proceedings \u2014 ensuring that no two duels, debates, or dissertations are ever the same.</p>

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
      Dice, imagination, and one\u2019s best festive, school themed attire recommended.<br>
      Non-finalists may appear as professors, spirits, or helpful onlookers via \u201CSupporter Cards" and cause extra chaos or help the future Oracle Apprentice.<br>
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
      <span class="news-title-text">Trial I: The Bog Expedition (Dec 22)</span>
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
      <span class="news-title-text">Trial II: The Masquerade of Mirrors (Dec 27)</span>
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
      <span class="news-title-text">Trial III: The Trial of the Ruins (Dec 29)</span>
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
  <p class="muted">UPDATE: November 29th, 2025</p>
  <details class="news-item" open>
    <summary>
      <span class="dot" aria-hidden="true"></span>
      <span class="news-title-text">App is now live for character creation!</span>
      <span class="chev" aria-hidden="true">\u25B6</span>
    </summary>
    <div class="news-body">
      <p>Please review text and character creation pages! </p>
    </div>
  </details>
</section>

<section class="comment-board" id="commentBoard">
  <h3>Comments &amp; Notes</h3>
  <p class="muted">Say Hello! Or jot reminders or questions for the group. Comments sync through the Oracle Archives so everyone stays in the loop.</p>
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

  `,Me(e),Fe(e),Oe(e),e}function Ye(){let e=document.createElement("div");e.className="panel",e.innerHTML=`
<h2>Character Builder</h2>
      <div class="card">
        <h2>How to Build Your Oracle Trials Character</h2>
        <p>For this event, we're using a simplified Strixhaven student setup so everyone is on the same page and no one has to crunch a full campaign build.</p>

        <p><strong>Your character needs:</strong></p>
        <ul>
          <li>Name</li>
          <li>Class &amp; Level \u2013 A standard 5e class at the event's starting level (ask your DM if you're unsure).</li>
          <li>Strixhaven College \u2013 Your magical "house".</li>
          <li>Strixhaven Initiate feat \u2013 A small bundle of spells themed to your college.</li>
        </ul>

        <p>The extra sections in this builder (Job &amp; Extracurriculars, Personality &amp; Prompt) are here to help you add flavour and story hooks. They're encouraged but not required homework.</p>

        <p><strong>Minimum before game day:</strong></p>
        <ul>
          <li>You know who you are (name + personality vibe)</li>
          <li>You know what you are (class &amp; level)</li>
          <li>You know where you belong (college)</li>
        </ul>

        <p>When you're happy, click <strong>Save Character.</strong> You can still come back and tweak things later.</p>
      </div>

      <div class="card">
        <h3>Choosing Your College</h3>
        <p>Strixhaven has five colleges. Pick the one that feels like your character's "home base":</p>
        <ul>
          <li><strong>Lorehold</strong> \u2013 Archaeology, ruins, and talking to the dead. You're a history nerd, relic hunter, or spirit-whisperer. Great for bards, clerics, wizards, paladins with a sense of destiny.</li>
          <li><strong>Prismari</strong> \u2013 Art, performance, and loud elemental magic. You're a drama kid with fireballs, a dancer who sculpts lightning, or a painter with ice. Great for sorcerers, druids, wizards, monks (Four Elements), and flashy fighters or rogues.</li>
          <li><strong>Quandrix</strong> \u2013 Math wizards and pattern-brains. You see reality as numbers, fractals, and equations and then bend them. Great for wizards, druids, sorcerers, or any clever type.</li>
          <li><strong>Silverquill</strong> \u2013 Word mages. Debate champions, terrifying public speakers, poets with knives in their metaphors. Great for bards, warlocks, clerics, and persuasive rogues or paladins.</li>
          <li><strong>Witherbloom</strong> \u2013 Swamp goths and weird herbalists. You brew potions, poke at corpses (academically), and balance life and decay. Great for druids, warlocks, rangers, barbarians, and spooky clerics.</li>
        </ul>
        <p>Each college comes with a themed Strixhaven Initiate feat (extra cantrips + one 1st-level spell). If you're not sure what to pick, just choose spells that feel on-brand for your college and your DM can help tidy details at the table.</p>
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
            <label style="display:block;margin-bottom:8px;">Choose your College</label>
            <div id="college_cards" class="college-grid" role="radiogroup" aria-label="Choose a college"></div>
            <input type="hidden" id="uni" value="" />
            <div style="margin-top:14px;">
              <label>Strixhaven Initiate \u2014 Spellcasting Ability</label>
              <select id="spell_ability"><option>INT</option><option>WIS</option><option>CHA</option></select>
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
                <select id="job"><option value="">\u2014 None \u2014</option>${S.jobs.map(s=>`<option value="${s.key}">${s.name}</option>`).join("")}</select>
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
    `;function t(s,o){let u=e.querySelector(`[data-save-note="${s}"]`);u&&(u.textContent=o)}let a=e.querySelector("#core_level");S.levels.forEach(s=>{let o=document.createElement("option");o.value=s,o.textContent=s,a.appendChild(o)});let r=e.querySelector("#ability_box");function n(){r.innerHTML="";let s=e.querySelector("#ability_method").value,o=["STR","DEX","CON","INT","WIS","CHA"];if(s==="standard"){let u=S.abilityArrays.standard.slice();o.forEach(p=>{let v=document.createElement("div");v.className="card",v.innerHTML=`<label>${p}</label><select data-ab="${p}">${u.map(A=>`<option value="${A}">${A}</option>`).join("")}</select>`,r.appendChild(v)})}else o.forEach(u=>{let p=document.createElement("div");p.className="card",p.innerHTML=`<label>${u}</label><input type="number" min="3" max="18" value="10" data-ab="${u}" />`,r.appendChild(p)})}e.querySelector("#ability_method").addEventListener("change",n),n();let i=m.data.core;e.querySelector("#core_player").value=i.playerName||"",e.querySelector("#core_name").value=i.name,e.querySelector("#core_race").value=i.race,e.querySelector("#core_class").value=i.class,e.querySelector("#core_background").value=i.background,e.querySelector("#core_level").value=i.level,e.querySelector("#ability_method").value=i.abilityMethod,e.querySelector("#equipment").value=i.equipment,n();let c=["STR","DEX","CON","INT","WIS","CHA"];c.forEach(s=>{var u,p;let o=r.querySelector(`[data-ab="${s}"]`);o&&(o.value=(p=(u=i.abilities)==null?void 0:u[s])!=null?p:o.value)}),e.querySelector("#save_core").onclick=()=>{let s={};c.forEach(o=>{let u=r.querySelector(`[data-ab="${o}"]`);s[o]=parseInt(u.value,10)}),m.data.core={playerName:e.querySelector("#core_player").value.trim(),name:e.querySelector("#core_name").value.trim(),race:e.querySelector("#core_race").value.trim(),class:e.querySelector("#core_class").value.trim(),background:e.querySelector("#core_background").value.trim(),level:parseInt(e.querySelector("#core_level").value,10),abilityMethod:e.querySelector("#ability_method").value,abilities:s,equipment:e.querySelector("#equipment").value},t("core","Core details saved."),m.save().catch(o=>console.error("Failed to persist core setup",o))};let l=e.querySelector("#uni"),d=e.querySelector("#college_cards");function h(){let s=d.querySelectorAll(".college-card"),o=d.querySelector('.college-card[aria-selected="true"]');s.forEach((u,p)=>{o?u.setAttribute("tabindex",u===o?"0":"-1"):u.setAttribute("tabindex",p===0?"0":"-1")})}function f(s,o){o<0&&(o=s.length-1),o>=s.length&&(o=0),s[o].focus()}function g(s){let o=Array.from(d.querySelectorAll(".college-card")),u=s.target.closest(".college-card");if(!u)return;let p=o.indexOf(u);switch(s.key){case"ArrowRight":case"ArrowDown":s.preventDefault(),f(o,p+1);break;case"ArrowLeft":case"ArrowUp":s.preventDefault(),f(o,p-1);break;case"Home":s.preventDefault(),f(o,0);break;case"End":s.preventDefault(),f(o,o.length-1);break;case"Enter":case" ":s.preventDefault(),N(u.getAttribute("data-key"));break}}function b(){d.innerHTML="",S.universities.forEach((s,o)=>{let u=l.value===s.key,p=document.createElement("div");p.className="college-card",p.setAttribute("role","radio"),p.setAttribute("tabindex",u||!l.value&&o===0?"0":"-1"),p.setAttribute("aria-checked",u?"true":"false"),p.setAttribute("aria-selected",u?"true":"false"),p.setAttribute("data-key",s.key),p.innerHTML=`
          <h4 class="college-card__name">${x(s.name)}</h4>
          <p class="college-card__flavour">${x(s.flavour||s.theme)}</p>
          <span class="college-card__colours">${x(s.colours)}</span>
        `,p.addEventListener("click",()=>N(s.key)),d.appendChild(p)}),d.addEventListener("keydown",g)}function N(s){l.value=s,d.querySelectorAll(".college-card").forEach(u=>{let p=u.getAttribute("data-key")===s;u.setAttribute("aria-checked",p?"true":"false"),u.setAttribute("aria-selected",p?"true":"false"),u.setAttribute("tabindex",p?"0":"-1")});let o=d.querySelector('.college-card[aria-selected="true"]');o&&o.focus(),$()}function $(){let s=l.value,o=e.querySelector("#uni_info");if(!s){o.innerHTML='<span class="muted">Select a college to view theme & bonus spells.</span>';return}let u=S.universities.find(v=>v.key===s),p=Object.entries(u.spells).map(([v,A])=>`<tr><td>${v}</td><td>${A.join(", ")}</td></tr>`).join("");o.innerHTML=`
        <div class="two">
          <div>
            <div class="kicker">Theme</div><div>${u.theme}</div>
            <div class="kicker" style="margin-top:6px">Focus</div><div>${u.focus}</div>
            <div class="kicker" style="margin-top:6px">Colours</div><div>${u.colours}</div>
            <div class="kicker" style="margin-top:6px">Playstyle</div><div>${u.playstyle}</div>
          </div>
          <div>
            <div class="kicker">Bonus Spells</div>
            <table class="table"><thead><tr><th>Level</th><th>Spells</th></tr></thead><tbody>${p}</tbody></table>
          </div>
        </div>
        <div class="callout" style="margin-top:8px"><strong>Feat:</strong> ${S.feats.strixhavenInitiate.name} \u2014 ${S.feats.strixhavenInitiate.text}</div>
      `}l.value=m.data.university.key||"",e.querySelector("#spell_ability").value=m.data.university.spellAbility||"INT",b(),$(),e.querySelector("#save_university").onclick=()=>{if(m.data.university={key:l.value,spellAbility:e.querySelector("#spell_ability").value},!m.data.university.key){alert("Pick a college to continue.");return}m.data.feats.find(s=>s.name==="Strixhaven Initiate")?m.data.feats=m.data.feats.map(s=>s.name==="Strixhaven Initiate"?{...s,ability:m.data.university.spellAbility}:s):m.data.feats.push({name:"Strixhaven Initiate",ability:m.data.university.spellAbility}),t("university","University saved."),m.save().catch(s=>console.error("Failed to persist build after university update",s))};let y=e.querySelector("#clublist");function C(){y.innerHTML="",S.extracurriculars.forEach(s=>{let o=`club_${s.key}`,u=document.createElement("label");u.className="card",u.style.cursor="pointer",u.innerHTML=`<div class="flex"><input type="checkbox" id="${o}" data-key="${s.key}" /> <div><strong>${s.name}</strong><div class="muted">Student Die (d4): ${s.skills.join(" / ")}</div></div></div>`,y.appendChild(u)})}C();let T=e.querySelector("#job");T.value=m.data.extras.job||"",(m.data.extras.clubs||[]).forEach(s=>{let o=y.querySelector(`[data-key="${s}"]`);o&&(o.checked=!0)});function E(){let s=T.value||null,o=[...y.querySelectorAll('input[type="checkbox"]:checked')].map(k=>k.dataset.key),u=s?1:2;if(o.length>u){let k=o.pop();y.querySelector(`[data-key="${k}"]`).checked=!1}let p=S.jobs.find(k=>k.key===s),v=S.extracurriculars.filter(k=>o.includes(k.key)),A=[];return p&&A.push(`<span class="tag">Job: ${p.name} \u2014 d4: ${p.skills.join(" / ")}</span>`),v.forEach(k=>A.push(`<span class="tag">Club: ${k.name} \u2014 d4: ${k.skills.join(" / ")}</span>`)),e.querySelector("#bonus_readout").innerHTML=A.length?A.join(" "):'<span class="muted">Pick a job and/or clubs to see Student Dice bonuses.</span>',{job:s,clubs:o}}T.addEventListener("change",E),y.addEventListener("change",E),E(),e.querySelector("#save_extras").onclick=()=>{let{job:s,clubs:o}=E();m.data.extras.job=s,m.data.extras.clubs=o,t("extras","Schedule saved."),m.save().catch(u=>console.error("Failed to persist build after extras update",u))};let _=[{u:"Lorehold",text:"A cheerful necro-historian who argues with ghosts about footnotes."},{u:"Prismari",text:"A kinetic dancer who keeps leaving frost footprints after cantrips."},{u:"Quandrix",text:"A fractal botanist who names houseplants after famous equations."},{u:"Silverquill",text:"A sunny orator who spotlights corruption with literal light."},{u:"Witherbloom",text:"A swamp witch medic who collects bones \u201Cfor research.\u201D"}],R=e.querySelector("#prompt_box");return _.forEach(s=>{let o=document.createElement("button");o.className="pill",o.type="button",o.innerHTML=`<span>${s.u}</span><span>\u2022</span><span>${s.text}</span>`,o.onclick=()=>{m.data.personality.prompt=s.text,Array.from(R.children).forEach(u=>u.classList.remove("success")),o.classList.add("success")},R.appendChild(o),m.data.personality.prompt===s.text&&o.classList.add("success")}),e.querySelector("#traits").value=m.data.personality.traits||"",e.querySelector("#ideal").value=m.data.personality.ideal||"",e.querySelector("#bond").value=m.data.personality.bond||"",e.querySelector("#goal").value=m.data.personality.goal||"",e.querySelector("#save_personality").onclick=()=>{m.data.personality={traits:e.querySelector("#traits").value.trim(),ideal:e.querySelector("#ideal").value.trim(),bond:e.querySelector("#bond").value.trim(),goal:e.querySelector("#goal").value.trim(),prompt:m.data.personality.prompt||""},t("personality","Personality saved."),m.save().catch(s=>console.error("Failed to persist build after personality update",s))},e.querySelector("#back_builder").onclick=()=>{F(P.findIndex(s=>s.key==="intro"))},e.querySelector("#next_builder").onclick=()=>{F(P.findIndex(s=>s.key==="join"))},e}function Je(){let e=document.createElement("div");e.className="panel",e.innerHTML=`
    <h2>Join Your Trial Session</h2>
    <div class="card">
      <p>Now that you've got a student, it's time to choose their Trial.</p>
      
      <p><strong>How this works:</strong></p>
      <ul>
        <li>You'll sign up for one Trial session.</li>
        <li>Each session has limited seats \u2014 when it's full, it's full.</li>
        <li>You'll bring the character you saved in Step 2 to this session.</li>
      </ul>
      
      <p><strong>How to sign up:</strong></p>
      <ul>
        <li>Look through the list of Trials below.</li>
        <li>Find a date/time that works for you.</li>
        <li>Click "Add my character" on that session.</li>
        <li>Your name will appear under that session when it's successful.</li>
      </ul>
      
      <p><strong>If you change your mind later:</strong></p>
      <ul>
        <li>Click "Leave this session" on your current Trial.</li>
        <li>Then choose a different session (if there's still space).</li>
      </ul>
      
      <p>You can always see your current choice in the "My Session" panel at the top of the page.</p>
    </div>
    ${D?'<div class="card" role="note"><p class="muted">Guest mode is read-only. Use your personal access code to reserve a seat.</p></div>':""}
    <div id="join_list" class="grid"></div>
    <div class="controls">
      <div class="left"><button id="back_join">\u2190 Back</button></div>
      <div class="right"><button class="primary" id="to_summary">Next \u2192</button></div>
    </div>
  `;let t=e.querySelector("#join_list");return ee(t,{readOnly:D}),t.addEventListener("click",a=>{var c;let r=a.target.closest("button.primary[data-id]");if(r){if(D){alert(B);return}let l=r.getAttribute("data-id"),d=(m.sessions||[]).find(y=>y.id===l),h=(m.data.core.name||"").trim();if(!h){alert("Give your character a name (Core 5e).");return}if(ye.hardNo.includes(h)){alert(`${h} is marked as not playing.`);return}if((ye.blockedDates[h]||[]).includes(d.date)){alert(`${h} isn't available for ${d.date}.`);return}let f=Array.isArray(d.players)?d.players:[];if(f.some(y=>j(y&&y.character)===j(h))){alert("This character is already in that session.");return}if(f.some(y=>L(y&&y.key)===I)){alert("Your access code already has a seat in this session.");return}if(f.length>=d.capacity){alert("That session is full.");return}let g=((c=S.universities.find(y=>y.key===m.data.university.key))==null?void 0:c.name)||"",b=He();if(g)for(let y of f){let C=y&&y.key?b[y.key]:null;if(C&&C.university===g){alert(`Another ${g} student is already in this session. Choose a different session or college.`);return}}let N=m.data.core.class||"",$=M.getRosterEntry();V.joinSession(l,{name:h,characterName:h,playerKey:I,playerName:$==null?void 0:$.name,build:{class:N,university:g}}).then(()=>{ee(t,{readOnly:D}),alert(`Added ${h} to ${d.title}.`)}).catch(y=>{alert(`Unable to join ${d.title}: ${y&&y.message?y.message:"Request failed."}`)});return}let n=a.target.closest("button[data-leave-id]");if(n){if(D){alert(B);return}let l=n.getAttribute("data-leave-id"),d=(m.sessions||[]).find(h=>h.id===l);if(!d){alert("Session not found.");return}if(!confirm(`Leave ${d.title}? You can rejoin later if there's space.`))return;V.leaveSession(l,{playerKey:I}).then(()=>{ee(t,{readOnly:D}),alert(`You have left ${d.title}.`)}).catch(h=>{alert(`Unable to leave ${d.title}: ${h&&h.message?h.message:"Request failed."}`)});return}let i=a.target.closest("button[data-ics]");if(i){let l=i.getAttribute("data-ics"),d=m.sessions.find(h=>h.id===l);Be(d)}}),e.querySelector("#back_join").onclick=()=>{F(P.findIndex(a=>a.key==="builder"))},e.querySelector("#to_summary").onclick=()=>{F(P.findIndex(a=>a.key==="summary"))},e}function Ke(){var l;let e=document.createElement("div");e.className="panel";let t=m.data,a=S.universities.find(d=>d.key===t.university.key),r=Object.entries(t.core.abilities||{}).map(([d,h])=>`<span class="tag">${d}: ${h}</span>`).join(" "),n=(t.extras.clubs||[]).map(d=>{var h;return(h=S.extracurriculars.find(f=>f.key===d))==null?void 0:h.name}).filter(Boolean),i=((l=S.jobs.find(d=>d.key===t.extras.job))==null?void 0:l.name)||"\u2014";e.innerHTML=`
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
          <div>Clubs: ${n.length?n.join(", "):"\u2014"}</div>
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
          <!-- Roster button disabled: foreign key constraint requires player_access entry -->
          <!-- <button id="publish_roster">Add to Availability Roster</button> -->
          <button id="save_s">Save Draft</button>
          <button id="export_s" class="primary">Export JSON</button>
          <button id="pdf_s" class="success">Print / PDF</button>
        </div>
      </div>
    `,e.querySelector("#back_s").onclick=()=>{F(P.findIndex(d=>d.key==="builder"))},e.querySelector("#save_s").onclick=()=>m.save(),e.querySelector("#export_s").onclick=()=>m.export(),e.querySelector("#pdf_s").onclick=()=>window.print();let c=e.querySelector("#publish_roster");return c&&(D?(c.disabled=!0,c.title=B,c.textContent="Roster editing disabled for guests"):c.onclick=async()=>{var $,y,C,T,E;let d=j((y=($=m.data)==null?void 0:$.core)==null?void 0:y.name);if(!d){alert("Give your character a name in Core Setup first.");return}let h=L(d),f=[];(T=(C=m.data)==null?void 0:C.core)!=null&&T.class&&f.push(m.data.core.class);let g=a?a.name:((E=S.universities.find(_=>{var R,s;return _.key===((s=(R=m.data)==null?void 0:R.university)==null?void 0:s.key)}))==null?void 0:E.name)||"";g&&f.push(g);let b=f.join(" \u2022 "),N="Interested";if(Se(h)){let R=we().find(s=>s.key===h)||{name:d,custom:!1};try{await _e(h,R,N,b),alert(`${d} is already on the roster. Updated their status and notes.`)}catch(s){alert(`Failed to update roster entry: ${s&&s.message?s.message:"Request failed."}`)}}else{let _=await qe(d,N,b);if(!_.ok){alert(_.msg);return}alert(`${d} added to the roster.`)}}),e}function te(){try{Ne(),Ee(),$e(),Te()}catch(e){Ae([`Render failed: ${String(e&&e.message||e)}`]),console.error(e)}}function Te(){let e=document.getElementById("btnSave");e&&(e.onclick=()=>m.save());let t=document.getElementById("btnLoad");t&&(t.onclick=()=>m.load());let a=document.getElementById("btnExport");a&&(a.onclick=()=>m.export());let r=document.getElementById("btnClear");r&&(r.onclick=()=>{confirm("Clear all local data for this app?")&&(G.clear(),localStorage.removeItem("oracleOfflineState"),alert("Local data cleared. Reloading\u2026"),location.reload())})}(async function(){let e=Ce();if(e.length){Ae(e),Te();return}try{await q.refresh()}catch(t){console.warn("Initial sync failed",t),J.setError("Unable to reach the shared datastore. Showing cached data if available.")}if(!D&&I){let t=G.read();if(t)m.data=K(t);else try{let a=await xe(I);a&&typeof a=="object"&&(m.data=K(a),G.write(m.data),console.info("Loaded saved build for player:",I))}catch(a){console.warn("Failed to load saved build for player",a)}}te()})();window.ORACLE_DEBUG=window.ORACLE_DEBUG||{};window.ORACLE_DEBUG.State=m;window.ORACLE_DEBUG.save=()=>m.save();})();
//# sourceMappingURL=app.js.map

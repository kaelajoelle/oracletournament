(()=>{function ce(){let e=window.APP_CONFIG||{},t=typeof e.apiBaseUrl=="string"?e.apiBaseUrl.trim():"";if(t){let s={...e,apiBaseUrl:t};return window.APP_CONFIG=s,s}let a=typeof window!="undefined"&&window.location&&window.location.origin?`${window.location.origin.replace(/\/$/,"")}/api`:"/api";console.warn("[OracleTournament] window.APP_CONFIG.apiBaseUrl is not configured; defaulting to",a);let r={...e,apiBaseUrl:a};return window.APP_CONFIG=r,r}function de(e,t){if(!e||!t)return!1;let a=String(t).trim().toLowerCase();return a?(Array.isArray(e.players)?e.players:[]).some(s=>String((s==null?void 0:s.key)||(s==null?void 0:s.playerKey)||(s==null?void 0:s.player_key)||(s==null?void 0:s.code)||(s==null?void 0:s.id)||(s==null?void 0:s.player_id)||"").trim().toLowerCase()===a):!1}var $e=ce(),z=$e.apiBaseUrl,Y=(()=>{let e="player_key",t="guest";function a(){try{return(localStorage.getItem(e)||"").trim().toLowerCase()}catch(i){return console.warn("Failed to read player key from storage",i),""}}function r(){let i=a();if(!i)throw window.location.href="./login.html",new Error("Player key is required.");return i}function s(){try{localStorage.removeItem(e)}catch{}}function o(){let i=a();return i&&Se({includeHidden:!0}).find(f=>f.key===i)||null}function l(){return a()===t}return{getKey:a,requireKey:r,clear:s,getRosterEntry:o,isGuest:l,getGuestKey:()=>t}})(),q=Y.requireKey(),L=Y.isGuest(),R="Guest accounts can browse but cannot change shared data. Use your personal access code to keep editing.";function G(e="perform this action"){if(L)throw new Error(`Guest accounts cannot ${e}. ${R}`)}var ue={sessions:[],rosterExtras:[],rosterMeta:{},buildCards:{}};function he(e){if(!e)return null;if(typeof e=="string"){let o=_(e);return o?{key:T(e),character:o}:null}if(typeof e!="object")return null;let t=_(e.character||e.characterName||e.character_name||e.name||e.player_name||""),a=e.key||e.playerKey||e.player_key||e.code||e.id||e.player_id||t,r=T(a);if(!r&&!t)return null;let s=_(e.playerName||e.player_name||e.displayName||"");return{key:r||T(t),character:t||s||r||"",playerName:s}}function ve(e){if(!e||typeof e!="object")return null;let t=String(e.id||"").trim(),a=x(e.title)||(t?`Session ${t}`:"Session"),r=x(e.dm),s=String(e.date||"").trim(),o=Number.isFinite(Number(e.capacity))?Number(e.capacity):0,l=Array.isArray(e.players)?e.players.map(he).filter(Boolean):[];return{id:t,title:a,dm:r,date:s,capacity:o,finale:!!e.finale,players:l}}function V(e){let t={sessions:[],rosterExtras:[],rosterMeta:{},buildCards:{}};return!e||typeof e!="object"||(Array.isArray(e.sessions)&&e.sessions.forEach(a=>{let r=ve(a);r&&r.id&&(r.players=Array.isArray(a.players)?a.players.map(he).filter(Boolean):[],t.sessions.push(r))}),Array.isArray(e.rosterExtras)&&e.rosterExtras.forEach(a=>{if(!a||typeof a!="object")return;let r=_(a.name);if(!r)return;let s=T(a.key||r);s&&t.rosterExtras.push({key:s,name:r,status:x(a.status),notes:x(a.notes),custom:!0})}),e.rosterMeta&&typeof e.rosterMeta=="object"&&Object.entries(e.rosterMeta).forEach(([a,r])=>{let s=T(a);if(!s||!r||typeof r!="object")return;let o=x(r.status),l=x(r.notes),i=!!r.hidden;(o||l||i)&&(t.rosterMeta[s]={status:o,notes:l,hidden:i})}),e.buildCards&&typeof e.buildCards=="object"&&Object.entries(e.buildCards).forEach(([a,r])=>{let s=T(a);if(!s||!r||typeof r!="object")return;let o={};r.class&&(o.class=x(r.class)),r.university&&(o.university=x(r.university)),(r.characterName||r.character_name||r.name)&&(o.characterName=_(r.characterName||r.character_name||r.name)),t.buildCards[s]=o})),t}var Q={key:"oracleOfflineState",read(){try{let e=localStorage.getItem(this.key);if(!e)return null;let t=JSON.parse(e);if(t&&typeof t=="object"&&t.version===1&&t.state)return V(t.state)}catch(e){console.warn("Offline cache read failed",e)}return null},write(e){try{localStorage.setItem(this.key,JSON.stringify({version:1,state:e}))}catch(t){console.warn("Offline cache write failed",t)}},clear(){try{localStorage.removeItem(this.key)}catch{}}},J=(function(){let e=document.getElementById("networkBanner"),t=0,a="";function r(){if(e){if(a){e.textContent=`\u26A0\uFE0F ${a}`,e.classList.add("error"),e.classList.remove("loading"),e.hidden=!1;return}t>0?(e.textContent="Syncing with the Oracle Archives\u2026",e.classList.add("loading"),e.classList.remove("error"),e.hidden=!1):(e.hidden=!0,e.classList.remove("error"),e.classList.remove("loading"))}}return{begin(){t++,r()},end(){t=Math.max(0,t-1),r()},setError(s){a=s||"Network request failed.",r()},clearError(){a="",r()}}})(),M=(function(){let e=document.getElementById("draftStatus");function t(a,r="info"){e&&(e.textContent=a,e.dataset.tone=r)}return{info(a){t(a,"info")},success(a){t(a,"success")},error(a){t(a,"error")}}})();function Z(e){if(!z||/^https?:/i.test(e))return e;try{return new URL(e,z).toString()}catch{return z.replace(/\/$/,"")+e}}async function O(e,t={}){let a=Z(e),r={...t};r.headers={...t.headers||{}},r.body&&!(r.body instanceof FormData)&&!r.headers["Content-Type"]&&(r.headers["Content-Type"]="application/json"),J.begin();try{let s=await fetch(a,r);if(!s.ok){let i=await s.text();throw new Error(i||`Request failed (${s.status})`)}let o=s.headers.get("content-type")||"",l=null;return o.includes("application/json")?l=await s.json():l=await s.text(),J.clearError(),l}catch(s){throw J.setError(s&&s.message?s.message:"Network request failed."),s}finally{J.end()}}window.APP_UTILS=window.APP_UTILS||{};window.APP_UTILS.testApiConnection=async function(){let t=await O("/api/state",{headers:{Accept:"application/json"}});return console.info("[OracleTournament] /api/state responded with:",t),t};var N={data:V(ue),offline:!0,fallback:V(ue),listeners:new Set,apply(e,t="remote"){let a=V(e);return this.data=a,t==="remote"?(Q.write(a),this.offline=!1):(this.offline=!0,t==="offline-cache"&&Q.write(a)),this.notify(),a},useFallbackSessions(e){Array.isArray(e)&&(this.fallback.sessions=e.map(t=>{let a=ve(t);return a?{...a,players:Array.isArray(a.players)?a.players.map(r=>({...r})):[]}:null}).filter(Boolean))},useDefaultFallback(){this.apply(this.fallback,"offline-default")},loadFallbackFromCache(){let e=Q.read();return e?(this.apply(e,"offline-cache"),!0):!1},async refresh(){try{let e=await O("/api/state",{headers:{Accept:"application/json"}});if(!e||typeof e!="object"||!e.state)throw new Error("Invalid response from datastore.");return this.apply(e.state,"remote"),this.data}catch(e){throw this.loadFallbackFromCache()||this.useDefaultFallback(),e}},subscribe(e){if(typeof e=="function"){this.listeners.add(e);try{e(this.data)}catch(t){console.error(t)}}return()=>this.listeners.delete(e)},notify(){this.listeners.forEach(e=>{try{e(this.data)}catch(t){console.error(t)}})},getSessionsCopy(){return this.data.sessions.map(e=>({...e,players:Array.isArray(e.players)?e.players.map(t=>({...t})):[]}))}},ee={async joinSession(e,t){G("join sessions");let a=Y.getRosterEntry(),r={...t,playerKey:(t==null?void 0:t.playerKey)||q,playerName:(t==null?void 0:t.playerName)||(a==null?void 0:a.name)||"",characterName:(t==null?void 0:t.characterName)||(t==null?void 0:t.name)},s=await O(`/api/sessions/${encodeURIComponent(e)}/join`,{method:"POST",body:JSON.stringify(r)});return s&&s.state&&N.apply(s.state,"remote"),s},async leaveSession(e,t){G("leave sessions");let a={...t,playerKey:(t==null?void 0:t.playerKey)||q},r=await O(`/api/sessions/${encodeURIComponent(e)}/leave`,{method:"POST",body:JSON.stringify(a)});return r&&r.state&&N.apply(r.state,"remote"),r},async addRosterExtra(e){G("add roster entries");let t=await O("/api/roster/extras",{method:"POST",body:JSON.stringify(e)});return t&&t.state&&N.apply(t.state,"remote"),t},async updateRosterEntry(e,t){G("edit the roster");let a=await O(`/api/roster/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)});return a&&a.state&&N.apply(a.state,"remote"),a},async removeRosterExtra(e){G("remove roster entries");let t=await O(`/api/roster/extras/${encodeURIComponent(e)}`,{method:"DELETE"});return t&&t.state&&N.apply(t.state,"remote"),t}},ge={read(){return N.data.rosterExtras}},Te={read(){return N.data.rosterMeta}},Ne={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function _(e){return String(e!=null?e:"").trim()}function x(e){return String(e!=null?e:"").trim()}function T(e){return _(e).toLowerCase()}function j(e){return String(e!=null?e:"").replace(/[&<>"']/g,t=>Ne[t]||t)}var be=new Set;function ke(e){let t=T(e);return t?be.has(t)?!0:ge.read().some(a=>a.key===t):!1}async function De(e,t="",a=""){if(L)return{ok:!1,msg:R};let r=_(e);if(!r)return{ok:!1,msg:"Name is required."};let s=T(r);if(ke(s))return{ok:!1,msg:`${r} is already on the roster.`};let o=x(t),l=x(a);try{return await ee.addRosterExtra({name:r,status:o,notes:l}),{ok:!0,key:s,name:r}}catch(i){return{ok:!1,msg:i&&i.message?i.message:"Failed to add roster entry."}}}async function Le(e,t,a,r,s){if(L)throw new Error(R);let o=T(e);if(!o)return;let l=x(a),i=x(r),u=s==null?!!(t&&t.hidden):!!s;await ee.updateRosterEntry(o,{status:l,notes:i,custom:!!(t&&t.custom),name:t&&t.name?_(t.name):"",hidden:u})}function Se(e={}){let t=!!e.includeHidden,a=ge.read(),r=Te.read(),s=[];return C.roster.forEach(o=>{let l=T(o.key||o.name),i=r[l]||{},u={name:o.name,key:l,status:i.status||x(o.status),notes:i.notes||x(o.notes),custom:!1,hidden:!!i.hidden};u.hidden&&!t||s.push(u)}),a.forEach(o=>{let l=T(o.key||o.name),i=r[l]||{},u={name:o.name,key:l,status:i.status||x(o.status),notes:i.notes||x(o.notes),custom:!0,hidden:!!i.hidden};u.hidden&&!t||s.push(u)}),s.sort((o,l)=>o.name.localeCompare(l.name,"en",{sensitivity:"base"}))}function me(e){let t=a=>String(a).padStart(2,"0");return e.getFullYear()+t(e.getMonth()+1)+t(e.getDate())+"T"+t(e.getHours())+t(e.getMinutes())+t(e.getSeconds())}function Pe(e){let t="America/Edmonton",a=new Date(e.date+"T19:00:00"),r=new Date(e.date+"T21:00:00"),o=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//OracleTrials//Scheduler//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",`UID:${`${e.id}@oracletrials`}`,`SUMMARY:${e.title}`,`DESCRIPTION:DM: ${e.dm} | Capacity: ${e.capacity}`,`DTSTART;TZID=${t}:${me(a)}`,`DTEND;TZID=${t}:${me(r)}`,"END:VEVENT","END:VCALENDAR"].join(`\r
`),l=new Blob([o],{type:"text/calendar"}),i=document.createElement("a");i.href=URL.createObjectURL(l),i.download=`${e.title.replace(/\s+/g,"-")}.ics`,i.click(),URL.revokeObjectURL(i.href)}var C={levels:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],abilityArrays:{standard:[15,14,13,12,10,8]},universities:[{key:"lorehold",name:"Lorehold",theme:"History & Spirits",colours:"Red/White",focus:"Archaeomancy",playstyle:"Scholar / Explorer",spells:{1:["Comprehend Languages","Identify"],2:["Borrowed Knowledge","Locate Object"],3:["Speak with Dead","Spirit Guardians"],4:["Arcane Eye","Stone Shape"],5:["Flame Strike","Legend Lore"]}},{key:"prismari",name:"Prismari",theme:"Elemental Arts",colours:"Blue/Red",focus:"Performance & Elements",playstyle:"Passion / Spectacle",spells:{1:["Chromatic Orb","Thunderwave"],2:["Flaming Sphere","Kinetic Jaunt"],3:["Haste","Water Walk"],4:["Freedom of Movement","Wall of Fire"],5:["Cone of Cold","Conjure Elemental"]}},{key:"quandrix",name:"Quandrix",theme:"Math & Nature",colours:"Blue/Green",focus:"Fractals / Growth",playstyle:"Logical / Curious",spells:{1:["Entangle","Guiding Bolt"],2:["Enlarge/Reduce","Vortex Warp"],3:["Aura of Vitality","Haste"],4:["Control Water","Freedom of Movement"],5:["Circle of Power","Passwall"]}},{key:"silverquill",name:"Silverquill",theme:"Eloquence & Ink",colours:"White/Black",focus:"Radiance & Shadow",playstyle:"Charisma / Wit",spells:{1:["Dissonant Whispers","Silvery Barbs"],2:["Calm Emotions","Darkness"],3:["Beacon of Hope","Daylight"],4:["Compulsion","Confusion"],5:["Dominate Person","Rary\u2019s Telepathic Bond"]}},{key:"witherbloom",name:"Witherbloom",theme:"Life & Decay",colours:"Green/Black",focus:"Alchemy / Essence",playstyle:"Healer / Witch",spells:{1:["Cure Wounds","Inflict Wounds"],2:["Lesser Restoration","Wither and Bloom"],3:["Revivify","Vampiric Touch"],4:["Blight","Death Ward"],5:["Antilife Shell","Greater Restoration"]}}],backgrounds:[{key:"lorehold-student",name:"Lorehold Student",skills:["History","Religion"],tools:[],languages:"2 of choice",gear:["Ink/pen","Hammer","Lantern","History tome","Uniform"],feat:"Strixhaven Initiate (Lorehold)"},{key:"prismari-student",name:"Prismari Student",skills:["Acrobatics","Performance"],tools:["+1 instrument/tool"],languages:"1",gear:["Ink/pen","Artisan tools or Instrument","Uniform"],feat:"Strixhaven Initiate (Prismari)"},{key:"quandrix-student",name:"Quandrix Student",skills:["Arcana","Nature"],tools:["+1 artisan tool"],languages:"1",gear:["Ink/pen","Abacus","Arcane theory book","Uniform"],feat:"Strixhaven Initiite (Silverquill)"},{key:"silverquill-student",name:"Silverquill Student",skills:["Intimidation","Persuasion"],tools:[],languages:"2",gear:["Ink/pen","Poetry book","Uniform"],feat:"Strixhaven Initiite (Silverquill)"},{key:"witherbloom-student",name:"Witherbloom Student",skills:["Nature","Survival"],tools:["Herbalism Kit"],languages:"1",gear:["Plant ID book","Iron pot","Herbalism kit","Uniform"],feat:"Strixhaven Initiate (Witherbloom)"}],feats:{strixhavenInitiate:{name:"Strixhaven Initiate",text:"Choose your college; learn 2 cantrips from its list + one 1st-level spell. Cast the 1st-level spell once per long rest without a slot; also with slots. Choose Int/Wis/Cha as spellcasting ability for these."}},extracurriculars:[{key:"dead-languages",name:"Dead Languages Society",skills:["Athletics","History"]},{key:"fine-artists",name:"Distinguished Society of Fine Artists",skills:["Performance","Sleight of Hand"]},{key:"dragonchess",name:"Dragonchess Club",skills:["Deception","Investigation"]},{key:"historical-soc",name:"Dragonsguard Historical Society",skills:["Arcana","History"]},{key:"horticulture",name:"Fantastical Horticulture Club",skills:["Nature","Survival"]},{key:"entrepreneurs",name:"Future Entrepreneurs of Strixhaven",skills:["Insight","Persuasion"]},{key:"gymnastics",name:"Intramural Gymnastics",skills:["Acrobatics","Performance"]},{key:"silkball",name:"Silkball Club",skills:["Athletics","Intimidation"]},{key:"water-dance",name:"Water-Dancing Club",skills:["Athletics","Performance"]},{key:"larp",name:"LARP Guild",skills:["Animal Handling","Performance"]},{key:"cheer",name:"Mage Tower Cheer",skills:["Perception","Persuasion"]},{key:"drama",name:"Playactors Drama Guild",skills:["Arcana","Deception"]},{key:"iron-lifters",name:"Iron-Lifters",skills:["Athletics","Medicine"]},{key:"show-band",name:"Show Band",skills:["Sleight of Hand","Performance"]},{key:"newspaper",name:"Strixhaven Star (Newspaper)",skills:["Investigation","Insight"]},{key:"faith",name:"Student-Mages of Faith",skills:["Insight","Religion"]}],jobs:[{key:"biblioplex",name:"Biblioplex",skills:["Arcana","History"]},{key:"firejolt",name:"Firejolt Caf\xE9",skills:["Insight","Persuasion"]},{key:"bowsend",name:"Bow's End Tavern",skills:["Performance","Deception"]},{key:"stadium",name:"Stadium",skills:["Athletics","Intimidation"]},{key:"performing-arts",name:"Performing Arts Society",skills:["Performance","Deception"]},{key:"dorms",name:"Dormitories",skills:["Persuasion","Perception"]},{key:"grounds",name:"Campus Grounds",skills:["Nature","Survival"]},{key:"labs",name:"Magic Labs",skills:["Arcana","Investigation"]},{key:"intramural",name:"Intramural Fields",skills:["Athletics","Acrobatics"]}],roster:[{name:"Kaela",status:"Yes",key:"kaela123"},{name:"Tory DM",status:"Yes",key:"torydm123"},{name:"Mike",status:"Pending",key:"mike2025"},{name:"Megan",status:"Pending",key:"megan2025"},{name:"Jocelyn",status:"Pending",key:"joss2025"},{name:"Emory",status:"Pending",key:"emory2025"},{name:"Snack Erin",status:"Yes",key:"snacks"},{name:"Erin",status:"Yes",key:"erin2627"},{name:"Trevor",status:"Yes",key:"trev2227"},{name:"Amy",status:"Yes",key:"amyoracle"},{name:"Nicole",status:"Yes",key:"nicole2627"},{name:"Spencer",status:"Yes",key:"spence2627"},{name:"Marvin",status:"Pending",key:"marv2025"},{name:"Megan E",status:"Pending",key:"megane2025"},{name:"Jordan",status:"Pending",key:"jordan2025"},{name:"Becca",status:"Yes",key:"becca2728"},{name:"Evan",status:"Yes",key:"evan2728"},{name:"Lyric",status:"Pending",key:"lyric2025"},{name:"Lazarus",status:"Yes",key:"laz_kids"},{name:"Aramis",status:"Pending",key:"aramis2025"},{name:"James",status:"Pending",key:"james2025"},{name:"David",status:"Pending",key:"david2025"},{name:"Nova",status:"Yes",key:"nova_any"},{name:"Melissa",status:"Yes",key:"melissa_not28"},{name:"Josh",status:"Yes",key:"josh222729"},{name:"Marilyn",status:"Pending",key:"marilyn2025"}],sessions:[]};C.roster=[...C.roster].sort((e,t)=>e.name.localeCompare(t.name,"en"));be=new Set(C.roster.map(e=>T(e.key||e.name)));N.useDefaultFallback();var pe={hardNo:["Link"],blockedDates:{Melissa:["2025-12-28"]}};function we(){let e=[];try{if(!Array.isArray(C.sessions))e.push("DATA.sessions is missing or not an array.");else{let t=new Set;C.sessions.forEach((a,r)=>{if(!a||typeof a!="object"){e.push(`sessions[${r}] is not an object`);return}a.id||e.push(`sessions[${r}] is missing an id`),a.id&&(t.has(a.id)?e.push(`Duplicate session id: ${a.id}`):t.add(a.id)),/^\d{4}-\d{2}-\d{2}$/.test(String(a.date||""))||e.push(`${a.title||a.id||"session#"+r} has non-ISO date "${a.date}"`),typeof a.capacity!="number"&&e.push(`${a.title||a.id||"session#"+r} capacity must be a number`)})}}catch{e.push("DATA.sessions could not be validated.")}try{Array.isArray(C.roster)||e.push("DATA.roster is missing or not an array.")}catch{e.push("DATA.roster could not be validated.")}return e}function Ce(e){if(!e||!e.length)return;let t=document.querySelector("main"),a=document.createElement("div");a.className="panel",a.style.border="1px solid #f14a3b",a.style.background="#1d1111",a.innerHTML=`
      <h2>Configuration issues</h2>
      <p>Fix the items below, then refresh. If you changed dates/IDs recently, hit <strong>Clear Local Data</strong> in the sidebar.</p>
      <ul>${e.map(r=>`<li>${r.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</li>`).join("")}</ul>
    `,t.prepend(a)}window.addEventListener("error",e=>{let t=document.querySelector("main");if(!t)return;let a=document.createElement("div");a.className="panel",a.style.border="1px solid #f14a3b",a.style.background="#1d1111",a.innerHTML=`<strong>Runtime error:</strong> ${String(e.message||"Unknown error")}`,t.prepend(a)});var U={key:"oracleTrialsSave",read(){try{let e=localStorage.getItem(this.key);return e?JSON.parse(e):null}catch(e){return console.warn("Local draft read failed",e),null}},write(e){try{localStorage.setItem(this.key,JSON.stringify(e))}catch(t){console.warn("Local draft write failed",t)}},clear(){try{localStorage.removeItem(this.key)}catch(e){console.warn("Local draft clear failed",e)}}};function K(e){try{return JSON.parse(JSON.stringify(e||{}))}catch(t){return console.warn("Draft clone failed",t),{}}}async function xe(e){if(!e)return console.warn("loadSavedBuildForPlayer: no playerKey provided"),null;try{let t=encodeURIComponent(e),a=await fetch(Z(`/api/builds/${t}`),{headers:{Accept:"application/json"}});if(a.status===404)return null;if(!a.ok){let s=await a.text();return console.error("loadSavedBuildForPlayer failed:",s),null}return await a.json()}catch(t){return console.error("loadSavedBuildForPlayer error:",t),null}}async function qe(e,t){if(!e)return console.warn("saveBuildForPlayer: no playerKey provided"),!1;if(!t||typeof t!="object")return console.warn("saveBuildForPlayer: invalid build object"),!1;try{let a=encodeURIComponent(e),r=await fetch(Z(`/api/builds/${a}`),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!r.ok){let s=await r.text();return console.error("saveBuildForPlayer failed:",s),!1}return!0}catch(a){return console.error("saveBuildForPlayer error:",a),!1}}var m={data:{meta:{version:"0.5-stable"},core:{playerName:"",name:"",race:"",class:"",background:"",level:4,abilityMethod:"standard",abilities:{STR:15,DEX:14,CON:13,INT:12,WIS:10,CHA:8},equipment:"class"},university:{key:"",spellAbility:"INT"},feats:[],extras:{job:null,clubs:[],studentDice:[]},personality:{traits:"",ideal:"",bond:"",rival:"",goal:"",prompt:""},exams:{notes:"",studyRerolls:0,results:[]}},sessions:[],async save(){let e=K(this.data);return U.write(e),M.info("Draft saved locally."),L?(M.info("Guest saves stay in this browser. Enter your access code to sync online."),!0):(qe(q,e).then(t=>{t?(console.info("Build synced to Oracle Archives via /api/builds"),M.success("Draft saved locally and synced to the Oracle Archives.")):(console.warn("Build sync returned false"),M.info("Draft saved locally. Sync to Oracle Archives may have failed."))}),!0)},async load(){let e=U.read();if(e)return this.data=K(e),X(),M.info("Loaded the draft stored in this browser."),!0;if(!L){let t=await xe(q);if(t&&typeof t=="object")return this.data=K(t),U.write(this.data),X(),M.success("Draft loaded from the Oracle Archives."),!0}return M.error("No saved drafts yet."),alert("No saved draft found. Create and save a character first."),!1},export(){let e=new Blob([JSON.stringify({character:this.data,sessions:this.sessions},null,2)],{type:"application/json"}),t=URL.createObjectURL(e),a=document.createElement("a");a.href=t,a.download=`oracle-trials-${(this.data.core.name||"character").toLowerCase().replace(/[^a-z0-9-]/g,"-")}.json`,a.click(),URL.revokeObjectURL(t)}};N.subscribe(()=>{var e;if(m.sessions=N.getSessionsCopy(),(e=m==null?void 0:m.data)!=null&&e.core){let t=Y.getRosterEntry();t&&!m.data.core.playerName&&(m.data.core.playerName=t.name)}});function ye(){let e=m.data.core||{},t=m.data.university||{};return!!(e.name&&e.name.trim().length>=2&&e.class&&e.class.trim()&&e.level&&Number.isFinite(+e.level)&&t.key&&t.key.trim())}function fe(e,t={readOnly:!1}){let{readOnly:a=!1}=t;e.innerHTML="";let r=N.data.buildCards||{};m.sessions.slice().sort((s,o)=>s.date.localeCompare(o.date)).forEach(s=>{let o=(s.players||[]).length,l=o>=s.capacity,i=q?de(s,q):!1,u=o?(Array.isArray(s.players)?s.players:[]).map(d=>{let y=d&&d.key?r[d.key]:null,h="";if(y){let p=j(y.class||"?"),S=j(y.university||"?");h=` \u2014 <span class="muted">${p} \u2022 ${S}</span>`}let E=j(d&&(d.character||d.name||d.playerName||"Player"));return`<div class="${T(d&&d.key)===q?"pill pill--highlight":"pill"}"><span>${E}</span>${h}</div>`}).join(""):'<span class="muted">No players yet</span>',f=!ye()||l?"disabled":"",b=a?"":`<button data-id="${s.id}" class="primary" ${f}>Add my character</button>`,k=s.theme?`<div class="muted"><strong>Theme:</strong> ${j(s.theme)}</div>`:"",v=s.focus?`<div class="muted"><strong>Focus:</strong> ${j(s.focus)}</div>`:"",D=s.finale?'<span class="tag tag--finale">\u2605 Finale</span>':"",g=i?'<span class="tag tag--joined">\u2713 Joined</span>':"",c=document.createElement("div");c.className=i?"card card--joined":"card",c.innerHTML=`
        <div class="flex" style="justify-content:space-between">
          <div>
            <strong>${j(s.title)}</strong> ${D} ${g}
            <div class="muted">${j(s.date)} \u2022 DM: ${j(s.dm||"")} \u2022 Capacity: ${o}/${s.capacity}</div>
            ${k}
            ${v}
            <div class="muted" style="margin-top:4px">No duplicate universities allowed in the same session.</div>
            ${!a&&!ye()?'<div class="muted" style="margin-top:6px">Finish <em>Core 5e</em> + choose a <em>University</em> to join.</div>':""}
            ${!a&&l?'<div class="muted" style="margin-top:6px">This session is full.</div>':""}
          </div>
          <div class="flex">
            ${b}
            <button data-ics="${s.id}">.ics</button>
          </div>
        </div>
        <div style="margin-top:8px" class="flex">${u}</div>
      `,e.appendChild(c)})}function Be(e){let t=e.querySelector("#commentForm"),a=e.querySelector("#commentText"),r=e.querySelector("#commentPlayer"),s=e.querySelector("#commentCharacter"),o=e.querySelector("#commentSession"),l=e.querySelector("#commentList"),i=e.querySelector("#refreshComments"),u=e.querySelector("#commentStatus");if(!t||!a||!l)return;let f=0,b=t.querySelector('button[type="submit"]'),k=L,v=(n,p="success")=>{if(u){try{window.clearTimeout(f)}catch{}u.textContent=n,u.dataset.tone=p,u.hidden=!1,f=window.setTimeout(()=>{u.hidden=!0},3600)}};if(u&&(u.hidden=!0),k){[a,r,s,o].forEach(p=>{p&&(p.disabled=!0,p.setAttribute("aria-disabled","true"))}),b&&(b.disabled=!0,b.title=R,b.textContent="Comments disabled for guests");let n=document.createElement("p");n.className="muted",n.textContent=R,t.appendChild(n)}let D=n=>{try{return new Date(n).toLocaleString(void 0,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}catch{return n}},g=n=>n.slice().sort((p,S)=>{let A=new Date((p==null?void 0:p.createdAt)||0).getTime();return new Date((S==null?void 0:S.createdAt)||0).getTime()-A}),c=n=>{var W,ae,se,re,ne,oe,ie;if(!n||typeof n!="object")return null;let p=((ae=(W=n.id)!=null?W:n.comment_id)!=null?ae:"").toString().trim(),S=((re=(se=n.comment)!=null?se:n.text)!=null?re:"").toString().trim();if(!S)return null;let A=x((ne=n.playerName)!=null?ne:n.player_name),w=x((oe=n.characterName)!=null?oe:n.character_name),B=x((ie=n.sessionId)!=null?ie:n.session_id),$=n.createdAt||n.created_at||n.stamp;if($){let le=new Date($);$=Number.isNaN(le.getTime())?new Date().toISOString():le.toISOString()}else $=new Date().toISOString();return{id:p||`local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,playerName:A,characterName:w,sessionId:B,comment:S,createdAt:$}},d={comments:[],loading:!1},y=n=>{let p=new Set,S=[];return(n||[]).forEach(A=>{let w=A&&A.comment?A:c(A);!w||!w.comment||p.has(w.id)||(p.add(w.id),S.push(w))}),d.comments=g(S),d.comments},h=()=>{if(d.loading){l.innerHTML='<p class="comment-empty">Loading comments\u2026</p>';return}if(!d.comments.length){l.innerHTML='<p class="comment-empty">No comments yet. Add the first note above.</p>';return}l.innerHTML="",d.comments.forEach(n=>{if(!n||!n.comment)return;let p=document.createElement("div");p.className="comment-item",p.dataset.pending=n.pending?"true":"false";let S=document.createElement("p");if(S.textContent=n.comment,p.appendChild(S),n.playerName||n.characterName||n.sessionId){let B=document.createElement("div");if(B.className="comment-meta",n.playerName){let $=document.createElement("span");$.textContent=`Player: ${n.playerName}`,B.appendChild($)}if(n.characterName){let $=document.createElement("span");$.textContent=`Character: ${n.characterName}`,B.appendChild($)}if(n.sessionId){let $=document.createElement("span");$.textContent=`Session: ${n.sessionId}`,B.appendChild($)}p.appendChild(B)}let A=document.createElement("time");A.dateTime=n.createdAt,A.textContent=D(n.createdAt),p.appendChild(A);let w=document.createElement("button");w.type="button",w.className="danger",n.pending?(w.textContent="Posting\u2026",w.disabled=!0):k?(w.textContent="Delete",w.disabled=!0,w.title=R):(w.textContent="Delete",w.addEventListener("click",()=>{I(n)})),p.appendChild(w),l.appendChild(p)})},E=async({silent:n=!1}={})=>{d.loading=!0,h();try{let p=await O("/api/comments",{headers:{Accept:"application/json"}}),S=Array.isArray(p==null?void 0:p.comments)?p.comments:[];y(S.map(c).filter(Boolean)),n||v("Comments updated.","info")}catch(p){throw n||v(p&&p.message?p.message:"Failed to load comments.","error"),p}finally{d.loading=!1,h()}},I=async n=>{if(k){v(R,"error");return}if(!n||!n.id||!(typeof confirm=="function"?confirm("Delete this comment?"):!0))return;let S=d.comments.slice();y(S.filter(A=>A.id!==n.id)),h(),v("Removing comment\u2026","info");try{await O(`/api/comments/${encodeURIComponent(n.id)}`,{method:"DELETE"}),v("Comment deleted.","info")}catch(A){y(S),h(),v(A&&A.message?A.message:"Failed to delete comment.","error")}};t.addEventListener("submit",async n=>{if(n.preventDefault(),k){v(R,"error");return}let p=(a.value||"").trim();if(!p){v("Comment text is required.","error");return}let S=r?x(r.value):"",A=s?x(s.value):"",w=o?x(o.value):"",B=d.comments.slice(),$={id:`pending-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,playerName:S,characterName:A,sessionId:w,comment:p,createdAt:new Date().toISOString(),pending:!0};y([$,...B]),h(),v("Posting comment\u2026","info"),b&&(b.disabled=!0);try{let F=await O("/api/comments",{method:"POST",body:JSON.stringify({playerName:S,characterName:A,sessionId:w,comment:p})}),W=c(F&&F.comment);if(!W)throw new Error("Invalid response from datastore.");y([W,...B]),h(),a&&(a.value=""),r&&(r.value=""),s&&(s.value=""),o&&(o.value=""),v("Comment posted!","success")}catch(F){y(B),h(),F&&F.message?v(F.message,"error"):v("Failed to post comment.","error")}finally{b&&(b.disabled=!1)}}),i&&i.addEventListener("click",n=>{n.preventDefault(),E().catch(p=>{p&&p.message?v(p.message,"error"):v("Failed to refresh comments.","error")})}),h(),E({silent:!0}).catch(n=>{n&&n.message?v(n.message,"error"):v("Unable to load comments.","error")})}async function _e(e=document){var a;let t=(a=e==null?void 0:e.querySelector)==null?void 0:a.call(e,"#questList");if(t){t.innerHTML='<p class="muted">Loading quests\u2026</p>';try{let r=await fetch("./site/data/quests.json",{cache:"no-store"});if(!r.ok)throw new Error(`Request failed: ${r.status}`);let s=await r.json();if(!Array.isArray(s)||!s.length){t.innerHTML='<p class="muted">No quests are published yet. Check back soon.</p>';return}let o=document.createDocumentFragment();s.forEach(l=>{var b;if(!l||typeof l!="object")return;let i=document.createElement("article");i.className="quest-card";let u=document.createElement("h4");u.textContent=l.title||`Quest #${(b=l.id)!=null?b:"?"}`,i.appendChild(u);let f=document.createElement("div");if(f.className="quest-meta",typeof l.id!="undefined"){let k=document.createElement("span");k.textContent=`ID ${l.id}`,f.appendChild(k)}if(l.status){let k=document.createElement("span");k.textContent=`Status: ${l.status}`,f.appendChild(k)}if(f.childNodes.length&&i.appendChild(f),l.notes){let k=document.createElement("p");k.className="quest-notes",k.textContent=l.notes,i.appendChild(k)}o.appendChild(i)}),t.innerHTML="",t.appendChild(o)}catch(r){console.error("Quest board failed",r),t.innerHTML='<p class="muted">Unable to load quests right now. Try refreshing later.</p>'}}}function je(){return N.data.buildCards||{}}var P=[{key:"intro",title:"Welcome",hint:"Overview & updates"},{key:"builder",title:"Character Builder",hint:"Core, college, flavour"},{key:"join",title:"Join a Session",hint:"Reserve a seat"},{key:"summary",title:"Summary & Export",hint:"Share or download"}],te=0;function Re(){let e=document.getElementById("stepNav");if(!e)return;let t=e.querySelector('button[aria-selected="true"]');t&&t.focus()}function H(e,t=!1){Number.isNaN(e)||e<0||e>=P.length||(te=e,Ee(),Ae(),t&&Re())}function Oe(e){let t=e.target;if(!t||t.getAttribute("role")!=="tab")return;let a=e.key,r=Number(t.dataset.index||"0"),s=null;a==="ArrowRight"||a==="ArrowDown"?s=(r+1)%P.length:a==="ArrowLeft"||a==="ArrowUp"?s=(r-1+P.length)%P.length:a==="Home"?s=0:a==="End"&&(s=P.length-1),s!==null&&(e.preventDefault(),H(s,!0))}function Ae(){let e=document.getElementById("stepNav");if(!e)return;let t=e.scrollLeft;e.innerHTML="",e.setAttribute("role","tablist"),e.setAttribute("aria-label","Character builder steps");let a=document.createDocumentFragment();if(P.forEach((o,l)=>{let i=document.createElement("button");i.type="button",i.id=`step-tab-${o.key}`,i.className="step-pill",i.dataset.step=o.key,i.dataset.index=String(l),i.setAttribute("role","tab"),i.setAttribute("aria-controls",`panel-${o.key}`);let u=l===te;i.setAttribute("aria-selected",u?"true":"false"),i.setAttribute("tabindex",u?"0":"-1");let f=o.hint?`<small>${j(o.hint)}</small>`:"";i.innerHTML=`
        <span class="step-number">${l+1}</span>
        <span class="step-label"><span>${j(o.title)}</span>${f}</span>
      `,i.addEventListener("click",()=>{H(l,!0)}),a.appendChild(i)}),e.appendChild(a),e.dataset.keysBound||(e.addEventListener("keydown",Oe),e.dataset.keysBound="true"),e.scrollWidth>e.clientWidth+8){let o=e.querySelector('button[aria-selected="true"]');if(o)try{o.scrollIntoView({block:"nearest",inline:"center"})}catch{}}else e.scrollLeft=t;let r=document.getElementById("cfgBadge"),s=we();r.textContent=s.length?`\u26A0\uFE0F ${s.length} config issue${s.length>1?"s":""}`:"\u2705 config OK"}function Ee(){let e=document.getElementById("panels");if(!e)return;e.innerHTML="";let t=P[te].key,a=null;t==="builder"&&(a=Me()),t==="summary"&&(a=Ue()),t==="intro"&&(a=Fe()),t==="join"&&(a=He()),a&&(a.id=`panel-${t}`,a.setAttribute("role","tabpanel"),a.setAttribute("aria-labelledby",`step-tab-${t}`),a.setAttribute("tabindex","0"),e.appendChild(a))}function Fe(){let e=document.createElement("div");return e.className="panel",e.innerHTML=`
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

  `,Be(e),_e(e),e}function Me(){let e=document.createElement("div");e.className="panel",e.innerHTML=`
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
              <select id="job"><option value="">\u2014 None \u2014</option>${C.jobs.map(c=>`<option value="${c.key}">${c.name}</option>`).join("")}</select>
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
    `;function t(c,d){let y=e.querySelector(`[data-save-note="${c}"]`);y&&(y.textContent=d)}let a=e.querySelector("#core_level");C.levels.forEach(c=>{let d=document.createElement("option");d.value=c,d.textContent=c,a.appendChild(d)});let r=e.querySelector("#ability_box");function s(){r.innerHTML="";let c=e.querySelector("#ability_method").value,d=["STR","DEX","CON","INT","WIS","CHA"];if(c==="standard"){let y=C.abilityArrays.standard.slice();d.forEach(h=>{let E=document.createElement("div");E.className="card",E.innerHTML=`<label>${h}</label><select data-ab="${h}">${y.map(I=>`<option value="${I}">${I}</option>`).join("")}</select>`,r.appendChild(E)})}else d.forEach(y=>{let h=document.createElement("div");h.className="card",h.innerHTML=`<label>${y}</label><input type="number" min="3" max="18" value="10" data-ab="${y}" />`,r.appendChild(h)})}e.querySelector("#ability_method").addEventListener("change",s),s();let o=m.data.core;e.querySelector("#core_player").value=o.playerName||"",e.querySelector("#core_name").value=o.name,e.querySelector("#core_race").value=o.race,e.querySelector("#core_class").value=o.class,e.querySelector("#core_background").value=o.background,e.querySelector("#core_level").value=o.level,e.querySelector("#ability_method").value=o.abilityMethod,e.querySelector("#equipment").value=o.equipment,s();let l=["STR","DEX","CON","INT","WIS","CHA"];l.forEach(c=>{var y,h;let d=r.querySelector(`[data-ab="${c}"]`);d&&(d.value=(h=(y=o.abilities)==null?void 0:y[c])!=null?h:d.value)}),e.querySelector("#save_core").onclick=()=>{let c={};l.forEach(d=>{let y=r.querySelector(`[data-ab="${d}"]`);c[d]=parseInt(y.value,10)}),m.data.core={playerName:e.querySelector("#core_player").value.trim(),name:e.querySelector("#core_name").value.trim(),race:e.querySelector("#core_race").value.trim(),class:e.querySelector("#core_class").value.trim(),background:e.querySelector("#core_background").value.trim(),level:parseInt(e.querySelector("#core_level").value,10),abilityMethod:e.querySelector("#ability_method").value,abilities:c,equipment:e.querySelector("#equipment").value},t("core","Core details saved."),m.save().catch(d=>console.error("Failed to persist core setup",d))};let i=e.querySelector("#uni");i.innerHTML='<option value="">\u2014 Select \u2014</option>'+C.universities.map(c=>`<option value="${c.key}">${c.name}</option>`).join("");function u(){let c=i.value,d=e.querySelector("#uni_info");if(!c){d.innerHTML='<span class="muted">Select a university to view theme & bonus spells.</span>';return}let y=C.universities.find(E=>E.key===c),h=Object.entries(y.spells).map(([E,I])=>`<tr><td>${E}</td><td>${I.join(", ")}</td></tr>`).join("");d.innerHTML=`
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
        <div class="callout" style="margin-top:8px"><strong>Feat:</strong> ${C.feats.strixhavenInitiate.name} \u2014 ${C.feats.strixhavenInitiate.text}</div>
      `}i.addEventListener("change",u),i.value=m.data.university.key||"",e.querySelector("#spell_ability").value=m.data.university.spellAbility||"INT",u(),e.querySelector("#save_university").onclick=()=>{if(m.data.university={key:i.value,spellAbility:e.querySelector("#spell_ability").value},!m.data.university.key){alert("Pick a university to continue.");return}m.data.feats.find(c=>c.name==="Strixhaven Initiate")?m.data.feats=m.data.feats.map(c=>c.name==="Strixhaven Initiate"?{...c,ability:m.data.university.spellAbility}:c):m.data.feats.push({name:"Strixhaven Initiate",ability:m.data.university.spellAbility}),t("university","University saved.")};let f=e.querySelector("#clublist");function b(){f.innerHTML="",C.extracurriculars.forEach(c=>{let d=`club_${c.key}`,y=document.createElement("label");y.className="card",y.style.cursor="pointer",y.innerHTML=`<div class="flex"><input type="checkbox" id="${d}" data-key="${c.key}" /> <div><strong>${c.name}</strong><div class="muted">Student Die (d4): ${c.skills.join(" / ")}</div></div></div>`,f.appendChild(y)})}b();let k=e.querySelector("#job");k.value=m.data.extras.job||"",(m.data.extras.clubs||[]).forEach(c=>{let d=f.querySelector(`[data-key="${c}"]`);d&&(d.checked=!0)});function v(){let c=k.value||null,d=[...f.querySelectorAll('input[type="checkbox"]:checked')].map(n=>n.dataset.key),y=c?1:2;if(d.length>y){let n=d.pop();f.querySelector(`[data-key="${n}"]`).checked=!1}let h=C.jobs.find(n=>n.key===c),E=C.extracurriculars.filter(n=>d.includes(n.key)),I=[];return h&&I.push(`<span class="tag">Job: ${h.name} \u2014 d4: ${h.skills.join(" / ")}</span>`),E.forEach(n=>I.push(`<span class="tag">Club: ${n.name} \u2014 d4: ${n.skills.join(" / ")}</span>`)),e.querySelector("#bonus_readout").innerHTML=I.length?I.join(" "):'<span class="muted">Pick a job and/or clubs to see Student Dice bonuses.</span>',{job:c,clubs:d}}k.addEventListener("change",v),f.addEventListener("change",v),v(),e.querySelector("#save_extras").onclick=()=>{let{job:c,clubs:d}=v();m.data.extras.job=c,m.data.extras.clubs=d,t("extras","Schedule saved.")};let D=[{u:"Lorehold",text:"A cheerful necro-historian who argues with ghosts about footnotes."},{u:"Prismari",text:"A kinetic dancer who keeps leaving frost footprints after cantrips."},{u:"Quandrix",text:"A fractal botanist who names houseplants after famous equations."},{u:"Silverquill",text:"A sunny orator who spotlights corruption with literal light."},{u:"Witherbloom",text:"A swamp witch medic who collects bones \u201Cfor research.\u201D"}],g=e.querySelector("#prompt_box");return D.forEach(c=>{let d=document.createElement("button");d.className="pill",d.type="button",d.innerHTML=`<span>${c.u}</span><span>\u2022</span><span>${c.text}</span>`,d.onclick=()=>{m.data.personality.prompt=c.text,Array.from(g.children).forEach(y=>y.classList.remove("success")),d.classList.add("success")},g.appendChild(d),m.data.personality.prompt===c.text&&d.classList.add("success")}),e.querySelector("#traits").value=m.data.personality.traits||"",e.querySelector("#ideal").value=m.data.personality.ideal||"",e.querySelector("#bond").value=m.data.personality.bond||"",e.querySelector("#goal").value=m.data.personality.goal||"",e.querySelector("#save_personality").onclick=()=>{m.data.personality={traits:e.querySelector("#traits").value.trim(),ideal:e.querySelector("#ideal").value.trim(),bond:e.querySelector("#bond").value.trim(),goal:e.querySelector("#goal").value.trim(),prompt:m.data.personality.prompt||""},t("personality","Personality saved.")},e.querySelector("#back_builder").onclick=()=>{H(P.findIndex(c=>c.key==="intro"))},e.querySelector("#next_builder").onclick=()=>{H(P.findIndex(c=>c.key==="join"))},e}function He(){let e=document.createElement("div");e.className="panel",e.innerHTML=`
    <h2>Join a Session</h2>
    <div class="card">
      <p>Pick a table for your finished character. You\u2019ll need a <strong>Name</strong>, <strong>Class</strong>, <strong>Level</strong>, and a chosen <strong>University</strong>.</p>
    </div>
    ${L?'<div class="card" role="note"><p class="muted">Guest mode is read-only. Use your personal access code to reserve a seat.</p></div>':""}
    <div id="join_list" class="grid"></div>
    <div class="controls">
      <div class="left"><button id="back_join">\u2190 Back</button></div>
      <div class="right"><button class="primary" id="to_summary">Next \u2192</button></div>
    </div>
  `;let t=e.querySelector("#join_list");return fe(t,{readOnly:L}),t.addEventListener("click",a=>{var o;let r=a.target.closest("button.primary[data-id]");if(r){if(L){alert(R);return}let l=r.getAttribute("data-id"),i=(m.sessions||[]).find(g=>g.id===l),u=(m.data.core.name||"").trim();if(!u){alert("Give your character a name (Core 5e).");return}if(pe.hardNo.includes(u)){alert(`${u} is marked as not playing.`);return}if((pe.blockedDates[u]||[]).includes(i.date)){alert(`${u} isn't available for ${i.date}.`);return}let f=Array.isArray(i.players)?i.players:[];if(f.some(g=>_(g&&g.character)===_(u))){alert("This character is already in that session.");return}if(f.some(g=>T(g&&g.key)===q)){alert("Your access code already has a seat in this session.");return}if(f.length>=i.capacity){alert("That session is full.");return}let b=((o=C.universities.find(g=>g.key===m.data.university.key))==null?void 0:o.name)||"",k=je();if(b)for(let g of f){let c=g&&g.key?k[g.key]:null;if(c&&c.university===b){alert(`Another ${b} student is already in this session. Choose a different session or college.`);return}}let v=m.data.core.class||"",D=Y.getRosterEntry();ee.joinSession(l,{name:u,characterName:u,playerKey:q,playerName:D==null?void 0:D.name,build:{class:v,university:b}}).then(()=>{fe(t,{readOnly:L}),alert(`Added ${u} to ${i.title}.`)}).catch(g=>{alert(`Unable to join ${i.title}: ${g&&g.message?g.message:"Request failed."}`)});return}let s=a.target.closest("button[data-ics]");if(s){let l=s.getAttribute("data-ics"),i=m.sessions.find(u=>u.id===l);Pe(i)}}),e.querySelector("#back_join").onclick=()=>{H(P.findIndex(a=>a.key==="builder"))},e.querySelector("#to_summary").onclick=()=>{H(P.findIndex(a=>a.key==="summary"))},e}function Ue(){var i;let e=document.createElement("div");e.className="panel";let t=m.data,a=C.universities.find(u=>u.key===t.university.key),r=Object.entries(t.core.abilities||{}).map(([u,f])=>`<span class="tag">${u}: ${f}</span>`).join(" "),s=(t.extras.clubs||[]).map(u=>{var f;return(f=C.extracurriculars.find(b=>b.key===u))==null?void 0:f.name}).filter(Boolean),o=((i=C.jobs.find(u=>u.key===t.extras.job))==null?void 0:i.name)||"\u2014";e.innerHTML=`
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
          <div>Job: <strong>${o}</strong></div>
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
    `,e.querySelector("#back_s").onclick=()=>{H(P.findIndex(u=>u.key==="builder"))},e.querySelector("#save_s").onclick=()=>m.save(),e.querySelector("#export_s").onclick=()=>m.export(),e.querySelector("#pdf_s").onclick=()=>window.print();let l=e.querySelector("#publish_roster");return l&&(L?(l.disabled=!0,l.title=R,l.textContent="Roster editing disabled for guests"):l.onclick=async()=>{var g,c,d,y,h;let u=_((c=(g=m.data)==null?void 0:g.core)==null?void 0:c.name);if(!u){alert("Give your character a name in Core Setup first.");return}let f=T(u),b=[];(y=(d=m.data)==null?void 0:d.core)!=null&&y.class&&b.push(m.data.core.class);let k=a?a.name:((h=C.universities.find(E=>{var I,n;return E.key===((n=(I=m.data)==null?void 0:I.university)==null?void 0:n.key)}))==null?void 0:h.name)||"";k&&b.push(k);let v=b.join(" \u2022 "),D="Interested";if(ke(f)){let I=Se().find(n=>n.key===f)||{name:u,custom:!1};try{await Le(f,I,D,v),alert(`${u} is already on the roster. Updated their status and notes.`)}catch(n){alert(`Failed to update roster entry: ${n&&n.message?n.message:"Request failed."}`)}}else{let E=await De(u,D,v);if(!E.ok){alert(E.msg);return}alert(`${u} added to the roster.`)}}),e}function X(){try{Ae(),Ee(),Ie()}catch(e){Ce([`Render failed: ${String(e&&e.message||e)}`]),console.error(e)}}function Ie(){let e=document.getElementById("btnSave");e&&(e.onclick=()=>m.save());let t=document.getElementById("btnLoad");t&&(t.onclick=()=>m.load());let a=document.getElementById("btnExport");a&&(a.onclick=()=>m.export());let r=document.getElementById("btnClear");r&&(r.onclick=()=>{confirm("Clear all local data for this app?")&&(U.clear(),localStorage.removeItem("oracleOfflineState"),alert("Local data cleared. Reloading\u2026"),location.reload())})}(async function(){let e=we();if(e.length){Ce(e),Ie();return}try{await N.refresh()}catch(t){console.warn("Initial sync failed",t),J.setError("Unable to reach the shared datastore. Showing cached data if available.")}if(!L&&q){let t=U.read();if(t)m.data=K(t);else try{let a=await xe(q);a&&typeof a=="object"&&(m.data=K(a),U.write(m.data),console.info("Loaded saved build for player:",q))}catch(a){console.warn("Failed to load saved build for player",a)}}X()})();window.ORACLE_DEBUG=window.ORACLE_DEBUG||{};window.ORACLE_DEBUG.State=m;window.ORACLE_DEBUG.save=()=>m.save();})();
//# sourceMappingURL=app.js.map

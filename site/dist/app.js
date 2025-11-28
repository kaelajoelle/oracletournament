(()=>{function ce(){let e=window.APP_CONFIG||{},t=typeof e.apiBaseUrl=="string"?e.apiBaseUrl.trim():"";if(t){let r={...e,apiBaseUrl:t};return window.APP_CONFIG=r,r}let a=typeof window!="undefined"&&window.location&&window.location.origin?`${window.location.origin.replace(/\/$/,"")}/api`:"/api";console.warn("[OracleTournament] window.APP_CONFIG.apiBaseUrl is not configured; defaulting to",a);let s={...e,apiBaseUrl:a};return window.APP_CONFIG=s,s}var Te=ce(),z=Te.apiBaseUrl,Y=(()=>{let e="player_key",t="guest";function a(){try{return(localStorage.getItem(e)||"").trim().toLowerCase()}catch(o){return console.warn("Failed to read player key from storage",o),""}}function s(){let o=a();if(!o)throw window.location.href="./login.html",new Error("Player key is required.");return o}function r(){try{localStorage.removeItem(e)}catch{}}function i(){let o=a();return o&&ke({includeHidden:!0}).find(f=>f.key===o)||null}function l(){return a()===t}return{getKey:a,requireKey:s,clear:r,getRosterEntry:i,isGuest:l,getGuestKey:()=>t}})(),j=Y.requireKey(),L=Y.isGuest(),_="Guest accounts can browse but cannot change shared data. Use your personal access code to keep editing.";function W(e="perform this action"){if(L)throw new Error(`Guest accounts cannot ${e}. ${_}`)}var de={sessions:[],rosterExtras:[],rosterMeta:{},buildCards:{}};function fe(e){if(!e)return null;if(typeof e=="string"){let i=B(e);return i?{key:$(e),character:i}:null}if(typeof e!="object")return null;let t=B(e.character||e.characterName||e.name||e.player_name||""),a=e.key||e.playerKey||e.player_key||e.code||e.id||t,s=$(a);if(!s&&!t)return null;let r=B(e.playerName||e.player_name||e.displayName||"");return{key:s||$(t),character:t||r||s||"",playerName:r}}function he(e){if(!e||typeof e!="object")return null;let t=String(e.id||"").trim(),a=C(e.title)||(t?`Session ${t}`:"Session"),s=C(e.dm),r=String(e.date||"").trim(),i=Number.isFinite(Number(e.capacity))?Number(e.capacity):0,l=Array.isArray(e.players)?e.players.map(fe).filter(Boolean):[];return{id:t,title:a,dm:s,date:r,capacity:i,finale:!!e.finale,players:l}}function V(e){let t={sessions:[],rosterExtras:[],rosterMeta:{},buildCards:{}};return!e||typeof e!="object"||(Array.isArray(e.sessions)&&e.sessions.forEach(a=>{let s=he(a);s&&s.id&&(s.players=Array.isArray(a.players)?a.players.map(fe).filter(Boolean):[],t.sessions.push(s))}),Array.isArray(e.rosterExtras)&&e.rosterExtras.forEach(a=>{if(!a||typeof a!="object")return;let s=B(a.name);if(!s)return;let r=$(a.key||s);r&&t.rosterExtras.push({key:r,name:s,status:C(a.status),notes:C(a.notes),custom:!0})}),e.rosterMeta&&typeof e.rosterMeta=="object"&&Object.entries(e.rosterMeta).forEach(([a,s])=>{let r=$(a);if(!r||!s||typeof s!="object")return;let i=C(s.status),l=C(s.notes),o=!!s.hidden;(i||l||o)&&(t.rosterMeta[r]={status:i,notes:l,hidden:o})}),e.buildCards&&typeof e.buildCards=="object"&&Object.entries(e.buildCards).forEach(([a,s])=>{let r=$(a);if(!r||!s||typeof s!="object")return;let i={};s.class&&(i.class=C(s.class)),s.university&&(i.university=C(s.university)),(s.characterName||s.character_name||s.name)&&(i.characterName=B(s.characterName||s.character_name||s.name)),t.buildCards[r]=i})),t}var Q={key:"oracleOfflineState",read(){try{let e=localStorage.getItem(this.key);if(!e)return null;let t=JSON.parse(e);if(t&&typeof t=="object"&&t.version===1&&t.state)return V(t.state)}catch(e){console.warn("Offline cache read failed",e)}return null},write(e){try{localStorage.setItem(this.key,JSON.stringify({version:1,state:e}))}catch(t){console.warn("Offline cache write failed",t)}},clear(){try{localStorage.removeItem(this.key)}catch{}}},G=(function(){let e=document.getElementById("networkBanner"),t=0,a="";function s(){if(e){if(a){e.textContent=`\u26A0\uFE0F ${a}`,e.classList.add("error"),e.classList.remove("loading"),e.hidden=!1;return}t>0?(e.textContent="Syncing with the Oracle Archives\u2026",e.classList.add("loading"),e.classList.remove("error"),e.hidden=!1):(e.hidden=!0,e.classList.remove("error"),e.classList.remove("loading"))}}return{begin(){t++,s()},end(){t=Math.max(0,t-1),s()},setError(r){a=r||"Network request failed.",s()},clearError(){a="",s()}}})(),F=(function(){let e=document.getElementById("draftStatus");function t(a,s="info"){e&&(e.textContent=a,e.dataset.tone=s)}return{info(a){t(a,"info")},success(a){t(a,"success")},error(a){t(a,"error")}}})();function Z(e){if(!z||/^https?:/i.test(e))return e;try{return new URL(e,z).toString()}catch{return z.replace(/\/$/,"")+e}}async function R(e,t={}){let a=Z(e),s={...t};s.headers={...t.headers||{}},s.body&&!(s.body instanceof FormData)&&!s.headers["Content-Type"]&&(s.headers["Content-Type"]="application/json"),G.begin();try{let r=await fetch(a,s);if(!r.ok){let o=await r.text();throw new Error(o||`Request failed (${r.status})`)}let i=r.headers.get("content-type")||"",l=null;return i.includes("application/json")?l=await r.json():l=await r.text(),G.clearError(),l}catch(r){throw G.setError(r&&r.message?r.message:"Network request failed."),r}finally{G.end()}}window.APP_UTILS=window.APP_UTILS||{};window.APP_UTILS.testApiConnection=async function(){let t=await R("/api/state",{headers:{Accept:"application/json"}});return console.info("[OracleTournament] /api/state responded with:",t),t};var N={data:V(de),offline:!0,fallback:V(de),listeners:new Set,apply(e,t="remote"){let a=V(e);return this.data=a,t==="remote"?(Q.write(a),this.offline=!1):(this.offline=!0,t==="offline-cache"&&Q.write(a)),this.notify(),a},useFallbackSessions(e){Array.isArray(e)&&(this.fallback.sessions=e.map(t=>{let a=he(t);return a?{...a,players:Array.isArray(a.players)?a.players.map(s=>({...s})):[]}:null}).filter(Boolean))},useDefaultFallback(){this.apply(this.fallback,"offline-default")},loadFallbackFromCache(){let e=Q.read();return e?(this.apply(e,"offline-cache"),!0):!1},async refresh(){try{let e=await R("/api/state",{headers:{Accept:"application/json"}});if(!e||typeof e!="object"||!e.state)throw new Error("Invalid response from datastore.");return this.apply(e.state,"remote"),this.data}catch(e){throw this.loadFallbackFromCache()||this.useDefaultFallback(),e}},subscribe(e){if(typeof e=="function"){this.listeners.add(e);try{e(this.data)}catch(t){console.error(t)}}return()=>this.listeners.delete(e)},notify(){this.listeners.forEach(e=>{try{e(this.data)}catch(t){console.error(t)}})},getSessionsCopy(){return this.data.sessions.map(e=>({...e,players:Array.isArray(e.players)?e.players.map(t=>({...t})):[]}))}},ee={async joinSession(e,t){W("join sessions");let a=Y.getRosterEntry(),s={...t,playerKey:(t==null?void 0:t.playerKey)||j,playerName:(t==null?void 0:t.playerName)||(a==null?void 0:a.name)||"",characterName:(t==null?void 0:t.characterName)||(t==null?void 0:t.name)},r=await R(`/api/sessions/${encodeURIComponent(e)}/join`,{method:"POST",body:JSON.stringify(s)});return r&&r.state&&N.apply(r.state,"remote"),r},async leaveSession(e,t){W("leave sessions");let a={...t,playerKey:(t==null?void 0:t.playerKey)||j},s=await R(`/api/sessions/${encodeURIComponent(e)}/leave`,{method:"POST",body:JSON.stringify(a)});return s&&s.state&&N.apply(s.state,"remote"),s},async addRosterExtra(e){W("add roster entries");let t=await R("/api/roster/extras",{method:"POST",body:JSON.stringify(e)});return t&&t.state&&N.apply(t.state,"remote"),t},async updateRosterEntry(e,t){W("edit the roster");let a=await R(`/api/roster/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)});return a&&a.state&&N.apply(a.state,"remote"),a},async removeRosterExtra(e){W("remove roster entries");let t=await R(`/api/roster/extras/${encodeURIComponent(e)}`,{method:"DELETE"});return t&&t.state&&N.apply(t.state,"remote"),t}},ve={read(){return N.data.rosterExtras}},Ie={read(){return N.data.rosterMeta}},Ne={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function B(e){return String(e!=null?e:"").trim()}function C(e){return String(e!=null?e:"").trim()}function $(e){return B(e).toLowerCase()}function J(e){return String(e!=null?e:"").replace(/[&<>"']/g,t=>Ne[t]||t)}var be=new Set;function ge(e){let t=$(e);return t?be.has(t)?!0:ve.read().some(a=>a.key===t):!1}async function $e(e,t="",a=""){if(L)return{ok:!1,msg:_};let s=B(e);if(!s)return{ok:!1,msg:"Name is required."};let r=$(s);if(ge(r))return{ok:!1,msg:`${s} is already on the roster.`};let i=C(t),l=C(a);try{return await ee.addRosterExtra({name:s,status:i,notes:l}),{ok:!0,key:r,name:s}}catch(o){return{ok:!1,msg:o&&o.message?o.message:"Failed to add roster entry."}}}async function De(e,t,a,s,r){if(L)throw new Error(_);let i=$(e);if(!i)return;let l=C(a),o=C(s),d=r==null?!!(t&&t.hidden):!!r;await ee.updateRosterEntry(i,{status:l,notes:o,custom:!!(t&&t.custom),name:t&&t.name?B(t.name):"",hidden:d})}function ke(e={}){let t=!!e.includeHidden,a=ve.read(),s=Ie.read(),r=[];return S.roster.forEach(i=>{let l=$(i.key||i.name),o=s[l]||{},d={name:i.name,key:l,status:o.status||C(i.status),notes:o.notes||C(i.notes),custom:!1,hidden:!!o.hidden};d.hidden&&!t||r.push(d)}),a.forEach(i=>{let l=$(i.key||i.name),o=s[l]||{},d={name:i.name,key:l,status:o.status||C(i.status),notes:o.notes||C(i.notes),custom:!0,hidden:!!o.hidden};d.hidden&&!t||r.push(d)}),r.sort((i,l)=>i.name.localeCompare(l.name,"en",{sensitivity:"base"}))}function ue(e){let t=a=>String(a).padStart(2,"0");return e.getFullYear()+t(e.getMonth()+1)+t(e.getDate())+"T"+t(e.getHours())+t(e.getMinutes())+t(e.getSeconds())}function Le(e){let t="America/Edmonton",a=new Date(e.date+"T19:00:00"),s=new Date(e.date+"T21:00:00"),i=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//OracleTrials//Scheduler//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",`UID:${`${e.id}@oracletrials`}`,`SUMMARY:${e.title}`,`DESCRIPTION:DM: ${e.dm} | Capacity: ${e.capacity}`,`DTSTART;TZID=${t}:${ue(a)}`,`DTEND;TZID=${t}:${ue(s)}`,"END:VEVENT","END:VCALENDAR"].join(`\r
`),l=new Blob([i],{type:"text/calendar"}),o=document.createElement("a");o.href=URL.createObjectURL(l),o.download=`${e.title.replace(/\s+/g,"-")}.ics`,o.click(),URL.revokeObjectURL(o.href)}var S={levels:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],abilityArrays:{standard:[15,14,13,12,10,8]},universities:[{key:"lorehold",name:"Lorehold",theme:"History & Spirits",colours:"Red/White",focus:"Archaeomancy",playstyle:"Scholar / Explorer",spells:{1:["Comprehend Languages","Identify"],2:["Borrowed Knowledge","Locate Object"],3:["Speak with Dead","Spirit Guardians"],4:["Arcane Eye","Stone Shape"],5:["Flame Strike","Legend Lore"]}},{key:"prismari",name:"Prismari",theme:"Elemental Arts",colours:"Blue/Red",focus:"Performance & Elements",playstyle:"Passion / Spectacle",spells:{1:["Chromatic Orb","Thunderwave"],2:["Flaming Sphere","Kinetic Jaunt"],3:["Haste","Water Walk"],4:["Freedom of Movement","Wall of Fire"],5:["Cone of Cold","Conjure Elemental"]}},{key:"quandrix",name:"Quandrix",theme:"Math & Nature",colours:"Blue/Green",focus:"Fractals / Growth",playstyle:"Logical / Curious",spells:{1:["Entangle","Guiding Bolt"],2:["Enlarge/Reduce","Vortex Warp"],3:["Aura of Vitality","Haste"],4:["Control Water","Freedom of Movement"],5:["Circle of Power","Passwall"]}},{key:"silverquill",name:"Silverquill",theme:"Eloquence & Ink",colours:"White/Black",focus:"Radiance & Shadow",playstyle:"Charisma / Wit",spells:{1:["Dissonant Whispers","Silvery Barbs"],2:["Calm Emotions","Darkness"],3:["Beacon of Hope","Daylight"],4:["Compulsion","Confusion"],5:["Dominate Person","Rary\u2019s Telepathic Bond"]}},{key:"witherbloom",name:"Witherbloom",theme:"Life & Decay",colours:"Green/Black",focus:"Alchemy / Essence",playstyle:"Healer / Witch",spells:{1:["Cure Wounds","Inflict Wounds"],2:["Lesser Restoration","Wither and Bloom"],3:["Revivify","Vampiric Touch"],4:["Blight","Death Ward"],5:["Antilife Shell","Greater Restoration"]}}],backgrounds:[{key:"lorehold-student",name:"Lorehold Student",skills:["History","Religion"],tools:[],languages:"2 of choice",gear:["Ink/pen","Hammer","Lantern","History tome","Uniform"],feat:"Strixhaven Initiate (Lorehold)"},{key:"prismari-student",name:"Prismari Student",skills:["Acrobatics","Performance"],tools:["+1 instrument/tool"],languages:"1",gear:["Ink/pen","Artisan tools or Instrument","Uniform"],feat:"Strixhaven Initiate (Prismari)"},{key:"quandrix-student",name:"Quandrix Student",skills:["Arcana","Nature"],tools:["+1 artisan tool"],languages:"1",gear:["Ink/pen","Abacus","Arcane theory book","Uniform"],feat:"Strixhaven Initiite (Silverquill)"},{key:"silverquill-student",name:"Silverquill Student",skills:["Intimidation","Persuasion"],tools:[],languages:"2",gear:["Ink/pen","Poetry book","Uniform"],feat:"Strixhaven Initiite (Silverquill)"},{key:"witherbloom-student",name:"Witherbloom Student",skills:["Nature","Survival"],tools:["Herbalism Kit"],languages:"1",gear:["Plant ID book","Iron pot","Herbalism kit","Uniform"],feat:"Strixhaven Initiate (Witherbloom)"}],feats:{strixhavenInitiate:{name:"Strixhaven Initiate",text:"Choose your college; learn 2 cantrips from its list + one 1st-level spell. Cast the 1st-level spell once per long rest without a slot; also with slots. Choose Int/Wis/Cha as spellcasting ability for these."}},extracurriculars:[{key:"dead-languages",name:"Dead Languages Society",skills:["Athletics","History"]},{key:"fine-artists",name:"Distinguished Society of Fine Artists",skills:["Performance","Sleight of Hand"]},{key:"dragonchess",name:"Dragonchess Club",skills:["Deception","Investigation"]},{key:"historical-soc",name:"Dragonsguard Historical Society",skills:["Arcana","History"]},{key:"horticulture",name:"Fantastical Horticulture Club",skills:["Nature","Survival"]},{key:"entrepreneurs",name:"Future Entrepreneurs of Strixhaven",skills:["Insight","Persuasion"]},{key:"gymnastics",name:"Intramural Gymnastics",skills:["Acrobatics","Performance"]},{key:"silkball",name:"Silkball Club",skills:["Athletics","Intimidation"]},{key:"water-dance",name:"Water-Dancing Club",skills:["Athletics","Performance"]},{key:"larp",name:"LARP Guild",skills:["Animal Handling","Performance"]},{key:"cheer",name:"Mage Tower Cheer",skills:["Perception","Persuasion"]},{key:"drama",name:"Playactors Drama Guild",skills:["Arcana","Deception"]},{key:"iron-lifters",name:"Iron-Lifters",skills:["Athletics","Medicine"]},{key:"show-band",name:"Show Band",skills:["Sleight of Hand","Performance"]},{key:"newspaper",name:"Strixhaven Star (Newspaper)",skills:["Investigation","Insight"]},{key:"faith",name:"Student-Mages of Faith",skills:["Insight","Religion"]}],jobs:[{key:"biblioplex",name:"Biblioplex",skills:["Arcana","History"]},{key:"firejolt",name:"Firejolt Caf\xE9",skills:["Insight","Persuasion"]},{key:"bowsend",name:"Bow's End Tavern",skills:["Performance","Deception"]},{key:"stadium",name:"Stadium",skills:["Athletics","Intimidation"]},{key:"performing-arts",name:"Performing Arts Society",skills:["Performance","Deception"]},{key:"dorms",name:"Dormitories",skills:["Persuasion","Perception"]},{key:"grounds",name:"Campus Grounds",skills:["Nature","Survival"]},{key:"labs",name:"Magic Labs",skills:["Arcana","Investigation"]},{key:"intramural",name:"Intramural Fields",skills:["Athletics","Acrobatics"]}],roster:[{name:"Kaela",status:"Yes",key:"kaela123"},{name:"Tory DM",status:"Yes",key:"torydm123"},{name:"Mike",status:"Pending",key:"mike2025"},{name:"Megan",status:"Pending",key:"megan2025"},{name:"Jocelyn",status:"Pending",key:"joss2025"},{name:"Emory",status:"Pending",key:"emory2025"},{name:"Snack Erin",status:"Yes",key:"snacks"},{name:"Erin",status:"Yes",key:"erin2627"},{name:"Trevor",status:"Yes",key:"trev2227"},{name:"Amy",status:"Yes",key:"amyoracle"},{name:"Nicole",status:"Yes",key:"nicole2627"},{name:"Spencer",status:"Yes",key:"spence2627"},{name:"Marvin",status:"Pending",key:"marv2025"},{name:"Megan E",status:"Pending",key:"megane2025"},{name:"Jordan",status:"Pending",key:"jordan2025"},{name:"Becca",status:"Yes",key:"becca2728"},{name:"Evan",status:"Yes",key:"evan2728"},{name:"Lyric",status:"Pending",key:"lyric2025"},{name:"Lazarus",status:"Yes",key:"laz_kids"},{name:"Aramis",status:"Pending",key:"aramis2025"},{name:"James",status:"Pending",key:"james2025"},{name:"David",status:"Pending",key:"david2025"},{name:"Nova",status:"Yes",key:"nova_any"},{name:"Melissa",status:"Yes",key:"melissa_not28"},{name:"Josh",status:"Yes",key:"josh222729"},{name:"Marilyn",status:"Pending",key:"marilyn2025"}],sessions:[{id:"s2",date:"2025-12-22",title:"Oracle Trials I",dm:"Kaela & Tory",capacity:5,players:[]},{id:"s4",date:"2025-12-27",title:"Oracle Trials II",dm:"Kaela & Tory",capacity:5,players:[]},{id:"s6",date:"2025-12-29",title:"Oracle Trials II",dm:"Kaela & Tory",capacity:5,players:[]},{id:"finale",date:"2026-01-01",title:"Oracle Trials: Grand Finale",dm:"Kaela & Tory",capacity:8,players:[],finale:!0}]};S.roster=[...S.roster].sort((e,t)=>e.name.localeCompare(t.name,"en"));be=new Set(S.roster.map(e=>$(e.key||e.name)));N.useFallbackSessions(S.sessions);N.useDefaultFallback();var me={hardNo:["Link"],blockedDates:{Melissa:["2025-12-28"]}};function Se(){let e=[];try{if(!Array.isArray(S.sessions))e.push("DATA.sessions is missing or not an array.");else{let t=new Set;S.sessions.forEach((a,s)=>{if(!a||typeof a!="object"){e.push(`sessions[${s}] is not an object`);return}a.id||e.push(`sessions[${s}] is missing an id`),a.id&&(t.has(a.id)?e.push(`Duplicate session id: ${a.id}`):t.add(a.id)),/^\d{4}-\d{2}-\d{2}$/.test(String(a.date||""))||e.push(`${a.title||a.id||"session#"+s} has non-ISO date "${a.date}"`),typeof a.capacity!="number"&&e.push(`${a.title||a.id||"session#"+s} capacity must be a number`)})}}catch{e.push("DATA.sessions could not be validated.")}try{Array.isArray(S.roster)||e.push("DATA.roster is missing or not an array.")}catch{e.push("DATA.roster could not be validated.")}return e}function we(e){if(!e||!e.length)return;let t=document.querySelector("main"),a=document.createElement("div");a.className="panel",a.style.border="1px solid #f14a3b",a.style.background="#1d1111",a.innerHTML=`
      <h2>Configuration issues</h2>
      <p>Fix the items below, then refresh. If you changed dates/IDs recently, hit <strong>Clear Local Data</strong> in the sidebar.</p>
      <ul>${e.map(s=>`<li>${s.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</li>`).join("")}</ul>
    `,t.prepend(a)}window.addEventListener("error",e=>{let t=document.querySelector("main");if(!t)return;let a=document.createElement("div");a.className="panel",a.style.border="1px solid #f14a3b",a.style.background="#1d1111",a.innerHTML=`<strong>Runtime error:</strong> ${String(e.message||"Unknown error")}`,t.prepend(a)});var H={key:"oracleTrialsSave",read(){try{let e=localStorage.getItem(this.key);return e?JSON.parse(e):null}catch(e){return console.warn("Local draft read failed",e),null}},write(e){try{localStorage.setItem(this.key,JSON.stringify(e))}catch(t){console.warn("Local draft write failed",t)}},clear(){try{localStorage.removeItem(this.key)}catch(e){console.warn("Local draft clear failed",e)}}};function K(e){try{return JSON.parse(JSON.stringify(e||{}))}catch(t){return console.warn("Draft clone failed",t),{}}}async function Ce(e){if(!e)return console.warn("loadSavedBuildForPlayer: no playerKey provided"),null;try{let t=encodeURIComponent(e),a=await fetch(Z(`/api/builds/${t}`),{headers:{Accept:"application/json"}});if(a.status===404)return null;if(!a.ok){let r=await a.text();return console.error("loadSavedBuildForPlayer failed:",r),null}return await a.json()}catch(t){return console.error("loadSavedBuildForPlayer error:",t),null}}async function Pe(e,t){if(!e)return console.warn("saveBuildForPlayer: no playerKey provided"),!1;if(!t||typeof t!="object")return console.warn("saveBuildForPlayer: invalid build object"),!1;try{let a=encodeURIComponent(e),s=await fetch(Z(`/api/builds/${a}`),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!s.ok){let r=await s.text();return console.error("saveBuildForPlayer failed:",r),!1}return!0}catch(a){return console.error("saveBuildForPlayer error:",a),!1}}var m={data:{meta:{version:"0.5-stable"},core:{playerName:"",name:"",race:"",class:"",background:"",level:4,abilityMethod:"standard",abilities:{STR:15,DEX:14,CON:13,INT:12,WIS:10,CHA:8},equipment:"class"},university:{key:"",spellAbility:"INT"},feats:[],extras:{job:null,clubs:[],studentDice:[]},personality:{traits:"",ideal:"",bond:"",rival:"",goal:"",prompt:""},exams:{notes:"",studyRerolls:0,results:[]}},sessions:[],async save(){let e=K(this.data);return H.write(e),F.info("Draft saved locally."),L?(F.info("Guest saves stay in this browser. Enter your access code to sync online."),!0):(Pe(j,e).then(t=>{t?(console.info("Build synced to Oracle Archives via /api/builds"),F.success("Draft saved locally and synced to the Oracle Archives.")):(console.warn("Build sync returned false"),F.info("Draft saved locally. Sync to Oracle Archives may have failed."))}),!0)},async load(){let e=H.read();if(e)return this.data=K(e),X(),F.info("Loaded the draft stored in this browser."),!0;if(!L){let t=await Ce(j);if(t&&typeof t=="object")return this.data=K(t),H.write(this.data),X(),F.success("Draft loaded from the Oracle Archives."),!0}return F.error("No saved drafts yet."),alert("No saved draft found. Create and save a character first."),!1},export(){let e=new Blob([JSON.stringify({character:this.data,sessions:this.sessions},null,2)],{type:"application/json"}),t=URL.createObjectURL(e),a=document.createElement("a");a.href=t,a.download=`oracle-trials-${(this.data.core.name||"character").toLowerCase().replace(/[^a-z0-9-]/g,"-")}.json`,a.click(),URL.revokeObjectURL(t)}};N.subscribe(()=>{var e;if(m.sessions=N.getSessionsCopy(),(e=m==null?void 0:m.data)!=null&&e.core){let t=Y.getRosterEntry();t&&!m.data.core.playerName&&(m.data.core.playerName=t.name)}});function pe(){let e=m.data.core||{},t=m.data.university||{};return!!(e.name&&e.name.trim().length>=2&&e.class&&e.class.trim()&&e.level&&Number.isFinite(+e.level)&&t.key&&t.key.trim())}function ye(e,t={readOnly:!1}){let{readOnly:a=!1}=t;e.innerHTML="";let s=N.data.buildCards||{};m.sessions.slice().sort((r,i)=>r.date.localeCompare(i.date)).forEach(r=>{let i=(r.players||[]).length,l=i>=r.capacity,o=i?(Array.isArray(r.players)?r.players:[]).map(h=>{let v=h&&h.key?s[h.key]:null,D="";if(v){let c=J(v.class||"?"),u=J(v.university||"?");D=` \u2014 <span class="muted">${c} \u2022 ${u}</span>`}return`<div class="pill"><span>${J(h&&(h.character||h.name||h.playerName||"Player"))}</span>${D}</div>`}).join(""):'<span class="muted">No players yet</span>',d=!pe()||l?"disabled":"",f=a?"":`<button data-id="${r.id}" class="primary" ${d}>Add my character</button>`,b=document.createElement("div");b.className="card",b.innerHTML=`
        <div class="flex" style="justify-content:space-between">
          <div>
            <strong>${r.title}</strong>
            <div class="muted">${r.date} \u2022 DM: ${r.dm} \u2022 Capacity: ${i}/${r.capacity}</div>
            <div class="muted" style="margin-top:4px">No duplicate universities allowed in the same session.</div>
            ${!a&&!pe()?'<div class="muted" style="margin-top:6px">Finish <em>Core 5e</em> + choose a <em>University</em> to join.</div>':""}
            ${!a&&l?'<div class="muted" style="margin-top:6px">This session is full.</div>':""}
          </div>
          <div class="flex">
            ${f}
            <button data-ics="${r.id}">.ics</button>
          </div>
        </div>
        <div style="margin-top:8px" class="flex">${o}</div>
      `,e.appendChild(b)})}function qe(e){let t=e.querySelector("#commentForm"),a=e.querySelector("#commentText"),s=e.querySelector("#commentPlayer"),r=e.querySelector("#commentCharacter"),i=e.querySelector("#commentSession"),l=e.querySelector("#commentList"),o=e.querySelector("#refreshComments"),d=e.querySelector("#commentStatus");if(!t||!a||!l)return;let f=0,b=t.querySelector('button[type="submit"]'),h=L,v=(n,p="success")=>{if(d){try{window.clearTimeout(f)}catch{}d.textContent=n,d.dataset.tone=p,d.hidden=!1,f=window.setTimeout(()=>{d.hidden=!0},3600)}};if(d&&(d.hidden=!0),h){[a,s,r,i].forEach(p=>{p&&(p.disabled=!0,p.setAttribute("aria-disabled","true"))}),b&&(b.disabled=!0,b.title=_,b.textContent="Comments disabled for guests");let n=document.createElement("p");n.className="muted",n.textContent=_,t.appendChild(n)}let D=n=>{try{return new Date(n).toLocaleString(void 0,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}catch{return n}},k=n=>n.slice().sort((p,x)=>{let E=new Date((p==null?void 0:p.createdAt)||0).getTime();return new Date((x==null?void 0:x.createdAt)||0).getTime()-E}),c=n=>{var U,ae,se,re,ne,ie,oe;if(!n||typeof n!="object")return null;let p=((ae=(U=n.id)!=null?U:n.comment_id)!=null?ae:"").toString().trim(),x=((re=(se=n.comment)!=null?se:n.text)!=null?re:"").toString().trim();if(!x)return null;let E=C((ne=n.playerName)!=null?ne:n.player_name),w=C((ie=n.characterName)!=null?ie:n.character_name),q=C((oe=n.sessionId)!=null?oe:n.session_id),I=n.createdAt||n.created_at||n.stamp;if(I){let le=new Date(I);I=Number.isNaN(le.getTime())?new Date().toISOString():le.toISOString()}else I=new Date().toISOString();return{id:p||`local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,playerName:E,characterName:w,sessionId:q,comment:x,createdAt:I}},u={comments:[],loading:!1},y=n=>{let p=new Set,x=[];return(n||[]).forEach(E=>{let w=E&&E.comment?E:c(E);!w||!w.comment||p.has(w.id)||(p.add(w.id),x.push(w))}),u.comments=k(x),u.comments},g=()=>{if(u.loading){l.innerHTML='<p class="comment-empty">Loading comments\u2026</p>';return}if(!u.comments.length){l.innerHTML='<p class="comment-empty">No comments yet. Add the first note above.</p>';return}l.innerHTML="",u.comments.forEach(n=>{if(!n||!n.comment)return;let p=document.createElement("div");p.className="comment-item",p.dataset.pending=n.pending?"true":"false";let x=document.createElement("p");if(x.textContent=n.comment,p.appendChild(x),n.playerName||n.characterName||n.sessionId){let q=document.createElement("div");if(q.className="comment-meta",n.playerName){let I=document.createElement("span");I.textContent=`Player: ${n.playerName}`,q.appendChild(I)}if(n.characterName){let I=document.createElement("span");I.textContent=`Character: ${n.characterName}`,q.appendChild(I)}if(n.sessionId){let I=document.createElement("span");I.textContent=`Session: ${n.sessionId}`,q.appendChild(I)}p.appendChild(q)}let E=document.createElement("time");E.dateTime=n.createdAt,E.textContent=D(n.createdAt),p.appendChild(E);let w=document.createElement("button");w.type="button",w.className="danger",n.pending?(w.textContent="Posting\u2026",w.disabled=!0):h?(w.textContent="Delete",w.disabled=!0,w.title=_):(w.textContent="Delete",w.addEventListener("click",()=>{T(n)})),p.appendChild(w),l.appendChild(p)})},A=async({silent:n=!1}={})=>{u.loading=!0,g();try{let p=await R("/api/comments",{headers:{Accept:"application/json"}}),x=Array.isArray(p==null?void 0:p.comments)?p.comments:[];y(x.map(c).filter(Boolean)),n||v("Comments updated.","info")}catch(p){throw n||v(p&&p.message?p.message:"Failed to load comments.","error"),p}finally{u.loading=!1,g()}},T=async n=>{if(h){v(_,"error");return}if(!n||!n.id||!(typeof confirm=="function"?confirm("Delete this comment?"):!0))return;let x=u.comments.slice();y(x.filter(E=>E.id!==n.id)),g(),v("Removing comment\u2026","info");try{await R(`/api/comments/${encodeURIComponent(n.id)}`,{method:"DELETE"}),v("Comment deleted.","info")}catch(E){y(x),g(),v(E&&E.message?E.message:"Failed to delete comment.","error")}};t.addEventListener("submit",async n=>{if(n.preventDefault(),h){v(_,"error");return}let p=(a.value||"").trim();if(!p){v("Comment text is required.","error");return}let x=s?C(s.value):"",E=r?C(r.value):"",w=i?C(i.value):"",q=u.comments.slice(),I={id:`pending-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,playerName:x,characterName:E,sessionId:w,comment:p,createdAt:new Date().toISOString(),pending:!0};y([I,...q]),g(),v("Posting comment\u2026","info"),b&&(b.disabled=!0);try{let O=await R("/api/comments",{method:"POST",body:JSON.stringify({playerName:x,characterName:E,sessionId:w,comment:p})}),U=c(O&&O.comment);if(!U)throw new Error("Invalid response from datastore.");y([U,...q]),g(),a&&(a.value=""),s&&(s.value=""),r&&(r.value=""),i&&(i.value=""),v("Comment posted!","success")}catch(O){y(q),g(),O&&O.message?v(O.message,"error"):v("Failed to post comment.","error")}finally{b&&(b.disabled=!1)}}),o&&o.addEventListener("click",n=>{n.preventDefault(),A().catch(p=>{p&&p.message?v(p.message,"error"):v("Failed to refresh comments.","error")})}),g(),A({silent:!0}).catch(n=>{n&&n.message?v(n.message,"error"):v("Unable to load comments.","error")})}async function Be(e=document){var a;let t=(a=e==null?void 0:e.querySelector)==null?void 0:a.call(e,"#questList");if(t){t.innerHTML='<p class="muted">Loading quests\u2026</p>';try{let s=await fetch("./site/data/quests.json",{cache:"no-store"});if(!s.ok)throw new Error(`Request failed: ${s.status}`);let r=await s.json();if(!Array.isArray(r)||!r.length){t.innerHTML='<p class="muted">No quests are published yet. Check back soon.</p>';return}let i=document.createDocumentFragment();r.forEach(l=>{var b;if(!l||typeof l!="object")return;let o=document.createElement("article");o.className="quest-card";let d=document.createElement("h4");d.textContent=l.title||`Quest #${(b=l.id)!=null?b:"?"}`,o.appendChild(d);let f=document.createElement("div");if(f.className="quest-meta",typeof l.id!="undefined"){let h=document.createElement("span");h.textContent=`ID ${l.id}`,f.appendChild(h)}if(l.status){let h=document.createElement("span");h.textContent=`Status: ${l.status}`,f.appendChild(h)}if(f.childNodes.length&&o.appendChild(f),l.notes){let h=document.createElement("p");h.className="quest-notes",h.textContent=l.notes,o.appendChild(h)}i.appendChild(o)}),t.innerHTML="",t.appendChild(i)}catch(s){console.error("Quest board failed",s),t.innerHTML='<p class="muted">Unable to load quests right now. Try refreshing later.</p>'}}}function _e(){return N.data.buildCards||{}}var P=[{key:"intro",title:"Welcome",hint:"Overview & updates"},{key:"builder",title:"Character Builder",hint:"Core, college, flavour"},{key:"join",title:"Join a Session",hint:"Reserve a seat"},{key:"summary",title:"Summary & Export",hint:"Share or download"}],te=0;function Re(){let e=document.getElementById("stepNav");if(!e)return;let t=e.querySelector('button[aria-selected="true"]');t&&t.focus()}function M(e,t=!1){Number.isNaN(e)||e<0||e>=P.length||(te=e,xe(),Ee(),t&&Re())}function je(e){let t=e.target;if(!t||t.getAttribute("role")!=="tab")return;let a=e.key,s=Number(t.dataset.index||"0"),r=null;a==="ArrowRight"||a==="ArrowDown"?r=(s+1)%P.length:a==="ArrowLeft"||a==="ArrowUp"?r=(s-1+P.length)%P.length:a==="Home"?r=0:a==="End"&&(r=P.length-1),r!==null&&(e.preventDefault(),M(r,!0))}function Ee(){let e=document.getElementById("stepNav");if(!e)return;let t=e.scrollLeft;e.innerHTML="",e.setAttribute("role","tablist"),e.setAttribute("aria-label","Character builder steps");let a=document.createDocumentFragment();if(P.forEach((i,l)=>{let o=document.createElement("button");o.type="button",o.id=`step-tab-${i.key}`,o.className="step-pill",o.dataset.step=i.key,o.dataset.index=String(l),o.setAttribute("role","tab"),o.setAttribute("aria-controls",`panel-${i.key}`);let d=l===te;o.setAttribute("aria-selected",d?"true":"false"),o.setAttribute("tabindex",d?"0":"-1");let f=i.hint?`<small>${J(i.hint)}</small>`:"";o.innerHTML=`
        <span class="step-number">${l+1}</span>
        <span class="step-label"><span>${J(i.title)}</span>${f}</span>
      `,o.addEventListener("click",()=>{M(l,!0)}),a.appendChild(o)}),e.appendChild(a),e.dataset.keysBound||(e.addEventListener("keydown",je),e.dataset.keysBound="true"),e.scrollWidth>e.clientWidth+8){let i=e.querySelector('button[aria-selected="true"]');if(i)try{i.scrollIntoView({block:"nearest",inline:"center"})}catch{}}else e.scrollLeft=t;let s=document.getElementById("cfgBadge"),r=Se();s.textContent=r.length?`\u26A0\uFE0F ${r.length} config issue${r.length>1?"s":""}`:"\u2705 config OK"}function xe(){let e=document.getElementById("panels");if(!e)return;e.innerHTML="";let t=P[te].key,a=null;t==="builder"&&(a=Fe()),t==="summary"&&(a=He()),t==="intro"&&(a=Oe()),t==="join"&&(a=Me()),a&&(a.id=`panel-${t}`,a.setAttribute("role","tabpanel"),a.setAttribute("aria-labelledby",`step-tab-${t}`),a.setAttribute("tabindex","0"),e.appendChild(a))}function Oe(){let e=document.createElement("div");return e.className="panel",e.innerHTML=`
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

  `,qe(e),Be(e),e}function Fe(){let e=document.createElement("div");e.className="panel",e.innerHTML=`
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
              <select id="job"><option value="">\u2014 None \u2014</option>${S.jobs.map(c=>`<option value="${c.key}">${c.name}</option>`).join("")}</select>
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
    `;function t(c,u){let y=e.querySelector(`[data-save-note="${c}"]`);y&&(y.textContent=u)}let a=e.querySelector("#core_level");S.levels.forEach(c=>{let u=document.createElement("option");u.value=c,u.textContent=c,a.appendChild(u)});let s=e.querySelector("#ability_box");function r(){s.innerHTML="";let c=e.querySelector("#ability_method").value,u=["STR","DEX","CON","INT","WIS","CHA"];if(c==="standard"){let y=S.abilityArrays.standard.slice();u.forEach(g=>{let A=document.createElement("div");A.className="card",A.innerHTML=`<label>${g}</label><select data-ab="${g}">${y.map(T=>`<option value="${T}">${T}</option>`).join("")}</select>`,s.appendChild(A)})}else u.forEach(y=>{let g=document.createElement("div");g.className="card",g.innerHTML=`<label>${y}</label><input type="number" min="3" max="18" value="10" data-ab="${y}" />`,s.appendChild(g)})}e.querySelector("#ability_method").addEventListener("change",r),r();let i=m.data.core;e.querySelector("#core_player").value=i.playerName||"",e.querySelector("#core_name").value=i.name,e.querySelector("#core_race").value=i.race,e.querySelector("#core_class").value=i.class,e.querySelector("#core_background").value=i.background,e.querySelector("#core_level").value=i.level,e.querySelector("#ability_method").value=i.abilityMethod,e.querySelector("#equipment").value=i.equipment,r();let l=["STR","DEX","CON","INT","WIS","CHA"];l.forEach(c=>{var y,g;let u=s.querySelector(`[data-ab="${c}"]`);u&&(u.value=(g=(y=i.abilities)==null?void 0:y[c])!=null?g:u.value)}),e.querySelector("#save_core").onclick=()=>{let c={};l.forEach(u=>{let y=s.querySelector(`[data-ab="${u}"]`);c[u]=parseInt(y.value,10)}),m.data.core={playerName:e.querySelector("#core_player").value.trim(),name:e.querySelector("#core_name").value.trim(),race:e.querySelector("#core_race").value.trim(),class:e.querySelector("#core_class").value.trim(),background:e.querySelector("#core_background").value.trim(),level:parseInt(e.querySelector("#core_level").value,10),abilityMethod:e.querySelector("#ability_method").value,abilities:c,equipment:e.querySelector("#equipment").value},t("core","Core details saved."),m.save().catch(u=>console.error("Failed to persist core setup",u))};let o=e.querySelector("#uni");o.innerHTML='<option value="">\u2014 Select \u2014</option>'+S.universities.map(c=>`<option value="${c.key}">${c.name}</option>`).join("");function d(){let c=o.value,u=e.querySelector("#uni_info");if(!c){u.innerHTML='<span class="muted">Select a university to view theme & bonus spells.</span>';return}let y=S.universities.find(A=>A.key===c),g=Object.entries(y.spells).map(([A,T])=>`<tr><td>${A}</td><td>${T.join(", ")}</td></tr>`).join("");u.innerHTML=`
        <div class="two">
          <div>
            <div class="kicker">Theme</div><div>${y.theme}</div>
            <div class="kicker" style="margin-top:6px">Focus</div><div>${y.focus}</div>
            <div class="kicker" style="margin-top:6px">Colours</div><div>${y.colours}</div>
            <div class="kicker" style="margin-top:6px">Playstyle</div><div>${y.playstyle}</div>
          </div>
          <div>
            <div class="kicker">Bonus Spells</div>
            <table class="table"><thead><tr><th>Level</th><th>Spells</th></tr></thead><tbody>${g}</tbody></table>
          </div>
        </div>
        <div class="callout" style="margin-top:8px"><strong>Feat:</strong> ${S.feats.strixhavenInitiate.name} \u2014 ${S.feats.strixhavenInitiate.text}</div>
      `}o.addEventListener("change",d),o.value=m.data.university.key||"",e.querySelector("#spell_ability").value=m.data.university.spellAbility||"INT",d(),e.querySelector("#save_university").onclick=()=>{if(m.data.university={key:o.value,spellAbility:e.querySelector("#spell_ability").value},!m.data.university.key){alert("Pick a university to continue.");return}m.data.feats.find(c=>c.name==="Strixhaven Initiate")?m.data.feats=m.data.feats.map(c=>c.name==="Strixhaven Initiate"?{...c,ability:m.data.university.spellAbility}:c):m.data.feats.push({name:"Strixhaven Initiate",ability:m.data.university.spellAbility}),t("university","University saved.")};let f=e.querySelector("#clublist");function b(){f.innerHTML="",S.extracurriculars.forEach(c=>{let u=`club_${c.key}`,y=document.createElement("label");y.className="card",y.style.cursor="pointer",y.innerHTML=`<div class="flex"><input type="checkbox" id="${u}" data-key="${c.key}" /> <div><strong>${c.name}</strong><div class="muted">Student Die (d4): ${c.skills.join(" / ")}</div></div></div>`,f.appendChild(y)})}b();let h=e.querySelector("#job");h.value=m.data.extras.job||"",(m.data.extras.clubs||[]).forEach(c=>{let u=f.querySelector(`[data-key="${c}"]`);u&&(u.checked=!0)});function v(){let c=h.value||null,u=[...f.querySelectorAll('input[type="checkbox"]:checked')].map(n=>n.dataset.key),y=c?1:2;if(u.length>y){let n=u.pop();f.querySelector(`[data-key="${n}"]`).checked=!1}let g=S.jobs.find(n=>n.key===c),A=S.extracurriculars.filter(n=>u.includes(n.key)),T=[];return g&&T.push(`<span class="tag">Job: ${g.name} \u2014 d4: ${g.skills.join(" / ")}</span>`),A.forEach(n=>T.push(`<span class="tag">Club: ${n.name} \u2014 d4: ${n.skills.join(" / ")}</span>`)),e.querySelector("#bonus_readout").innerHTML=T.length?T.join(" "):'<span class="muted">Pick a job and/or clubs to see Student Dice bonuses.</span>',{job:c,clubs:u}}h.addEventListener("change",v),f.addEventListener("change",v),v(),e.querySelector("#save_extras").onclick=()=>{let{job:c,clubs:u}=v();m.data.extras.job=c,m.data.extras.clubs=u,t("extras","Schedule saved.")};let D=[{u:"Lorehold",text:"A cheerful necro-historian who argues with ghosts about footnotes."},{u:"Prismari",text:"A kinetic dancer who keeps leaving frost footprints after cantrips."},{u:"Quandrix",text:"A fractal botanist who names houseplants after famous equations."},{u:"Silverquill",text:"A sunny orator who spotlights corruption with literal light."},{u:"Witherbloom",text:"A swamp witch medic who collects bones \u201Cfor research.\u201D"}],k=e.querySelector("#prompt_box");return D.forEach(c=>{let u=document.createElement("button");u.className="pill",u.type="button",u.innerHTML=`<span>${c.u}</span><span>\u2022</span><span>${c.text}</span>`,u.onclick=()=>{m.data.personality.prompt=c.text,Array.from(k.children).forEach(y=>y.classList.remove("success")),u.classList.add("success")},k.appendChild(u),m.data.personality.prompt===c.text&&u.classList.add("success")}),e.querySelector("#traits").value=m.data.personality.traits||"",e.querySelector("#ideal").value=m.data.personality.ideal||"",e.querySelector("#bond").value=m.data.personality.bond||"",e.querySelector("#goal").value=m.data.personality.goal||"",e.querySelector("#save_personality").onclick=()=>{m.data.personality={traits:e.querySelector("#traits").value.trim(),ideal:e.querySelector("#ideal").value.trim(),bond:e.querySelector("#bond").value.trim(),goal:e.querySelector("#goal").value.trim(),prompt:m.data.personality.prompt||""},t("personality","Personality saved.")},e.querySelector("#back_builder").onclick=()=>{M(P.findIndex(c=>c.key==="intro"))},e.querySelector("#next_builder").onclick=()=>{M(P.findIndex(c=>c.key==="join"))},e}function Me(){let e=document.createElement("div");e.className="panel",e.innerHTML=`
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
  `;let t=e.querySelector("#join_list");return ye(t,{readOnly:L}),t.addEventListener("click",a=>{var i;let s=a.target.closest("button.primary[data-id]");if(s){if(L){alert(_);return}let l=s.getAttribute("data-id"),o=(m.sessions||[]).find(k=>k.id===l),d=(m.data.core.name||"").trim();if(!d){alert("Give your character a name (Core 5e).");return}if(me.hardNo.includes(d)){alert(`${d} is marked as not playing.`);return}if((me.blockedDates[d]||[]).includes(o.date)){alert(`${d} isn't available for ${o.date}.`);return}let f=Array.isArray(o.players)?o.players:[];if(f.some(k=>B(k&&k.character)===B(d))){alert("This character is already in that session.");return}if(f.some(k=>$(k&&k.key)===j)){alert("Your access code already has a seat in this session.");return}if(f.length>=o.capacity){alert("That session is full.");return}let b=((i=S.universities.find(k=>k.key===m.data.university.key))==null?void 0:i.name)||"",h=_e();if(b)for(let k of f){let c=k&&k.key?h[k.key]:null;if(c&&c.university===b){alert(`Another ${b} student is already in this session. Choose a different session or college.`);return}}let v=m.data.core.class||"",D=Y.getRosterEntry();ee.joinSession(l,{name:d,characterName:d,playerKey:j,playerName:D==null?void 0:D.name,build:{class:v,university:b}}).then(()=>{ye(t,{readOnly:L}),alert(`Added ${d} to ${o.title}.`)}).catch(k=>{alert(`Unable to join ${o.title}: ${k&&k.message?k.message:"Request failed."}`)});return}let r=a.target.closest("button[data-ics]");if(r){let l=r.getAttribute("data-ics"),o=m.sessions.find(d=>d.id===l);Le(o)}}),e.querySelector("#back_join").onclick=()=>{M(P.findIndex(a=>a.key==="builder"))},e.querySelector("#to_summary").onclick=()=>{M(P.findIndex(a=>a.key==="summary"))},e}function He(){var o;let e=document.createElement("div");e.className="panel";let t=m.data,a=S.universities.find(d=>d.key===t.university.key),s=Object.entries(t.core.abilities||{}).map(([d,f])=>`<span class="tag">${d}: ${f}</span>`).join(" "),r=(t.extras.clubs||[]).map(d=>{var f;return(f=S.extracurriculars.find(b=>b.key===d))==null?void 0:f.name}).filter(Boolean),i=((o=S.jobs.find(d=>d.key===t.extras.job))==null?void 0:o.name)||"\u2014";e.innerHTML=`
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
          <div>Job: <strong>${i}</strong></div>
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
    `,e.querySelector("#back_s").onclick=()=>{M(P.findIndex(d=>d.key==="builder"))},e.querySelector("#save_s").onclick=()=>m.save(),e.querySelector("#export_s").onclick=()=>m.export(),e.querySelector("#pdf_s").onclick=()=>window.print();let l=e.querySelector("#publish_roster");return l&&(L?(l.disabled=!0,l.title=_,l.textContent="Roster editing disabled for guests"):l.onclick=async()=>{var k,c,u,y,g;let d=B((c=(k=m.data)==null?void 0:k.core)==null?void 0:c.name);if(!d){alert("Give your character a name in Core Setup first.");return}let f=$(d),b=[];(y=(u=m.data)==null?void 0:u.core)!=null&&y.class&&b.push(m.data.core.class);let h=a?a.name:((g=S.universities.find(A=>{var T,n;return A.key===((n=(T=m.data)==null?void 0:T.university)==null?void 0:n.key)}))==null?void 0:g.name)||"";h&&b.push(h);let v=b.join(" \u2022 "),D="Interested";if(ge(f)){let T=ke().find(n=>n.key===f)||{name:d,custom:!1};try{await De(f,T,D,v),alert(`${d} is already on the roster. Updated their status and notes.`)}catch(n){alert(`Failed to update roster entry: ${n&&n.message?n.message:"Request failed."}`)}}else{let A=await $e(d,D,v);if(!A.ok){alert(A.msg);return}alert(`${d} added to the roster.`)}}),e}function X(){try{Ee(),xe(),Ae()}catch(e){we([`Render failed: ${String(e&&e.message||e)}`]),console.error(e)}}function Ae(){let e=document.getElementById("btnSave");e&&(e.onclick=()=>m.save());let t=document.getElementById("btnLoad");t&&(t.onclick=()=>m.load());let a=document.getElementById("btnExport");a&&(a.onclick=()=>m.export());let s=document.getElementById("btnClear");s&&(s.onclick=()=>{confirm("Clear all local data for this app?")&&(H.clear(),localStorage.removeItem("oracleOfflineState"),alert("Local data cleared. Reloading\u2026"),location.reload())})}(async function(){let e=Se();if(e.length){we(e),Ae();return}try{await N.refresh()}catch(t){console.warn("Initial sync failed",t),G.setError("Unable to reach the shared datastore. Showing cached data if available.")}if(!L&&j){let t=H.read();if(t)m.data=K(t);else try{let a=await Ce(j);a&&typeof a=="object"&&(m.data=K(a),H.write(m.data),console.info("Loaded saved build for player:",j))}catch(a){console.warn("Failed to load saved build for player",a)}}X()})();window.ORACLE_DEBUG=window.ORACLE_DEBUG||{};window.ORACLE_DEBUG.State=m;window.ORACLE_DEBUG.save=()=>m.save();})();
//# sourceMappingURL=app.js.map

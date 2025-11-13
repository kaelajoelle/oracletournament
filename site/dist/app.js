(()=>{function fe(){let e=window.APP_CONFIG||{},t=typeof e.apiBaseUrl=="string"?e.apiBaseUrl.trim():"";if(t){let r={...e,apiBaseUrl:t};return window.APP_CONFIG=r,r}let a=typeof window!="undefined"&&window.location&&window.location.origin?`${window.location.origin.replace(/\/$/,"")}/api`:"/api";console.warn("[OracleTournament] window.APP_CONFIG.apiBaseUrl is not configured; defaulting to",a);let s={...e,apiBaseUrl:a};return window.APP_CONFIG=s,s}var K=["2025-12-21","2025-12-22","2025-12-23","2025-12-26","2025-12-27","2025-12-28","2025-12-29","2026-01-01"],Re=fe(),oe=Re.apiBaseUrl,Q=(()=>{let e="player_key",t="guest";function a(){try{return(localStorage.getItem(e)||"").trim().toLowerCase()}catch(o){return console.warn("Failed to read player key from storage",o),""}}function s(){let o=a();if(!o)throw window.location.href="./login.html",new Error("Player key is required.");return o}function r(){try{localStorage.removeItem(e)}catch{}}function i(){let o=a();return o&&U({includeHidden:!0}).find(h=>h.key===o)||null}function c(){return a()===t}return{getKey:a,requireKey:s,clear:r,getRosterEntry:i,isGuest:c,getGuestKey:()=>t}})(),V=Q.requireKey(),B=Q.isGuest(),F="Guest accounts can browse but cannot change shared data. Use your personal access code to keep editing.";function Y(e="perform this action"){if(B)throw new Error(`Guest accounts cannot ${e}. ${F}`)}var pe={sessions:[],rosterExtras:[],rosterMeta:{},availability:{},buildCards:{}};function Se(e){if(!e)return null;if(typeof e=="string"){let i=H(e);return i?{key:R(e),character:i}:null}if(typeof e!="object")return null;let t=H(e.character||e.characterName||e.name||e.player_name||""),a=e.key||e.playerKey||e.player_key||e.code||e.id||t,s=R(a);if(!s&&!t)return null;let r=H(e.playerName||e.player_name||e.displayName||"");return{key:s||R(t),character:t||r||s||"",playerName:r}}function we(e){if(!e||typeof e!="object")return null;let t=String(e.id||"").trim(),a=T(e.title)||(t?`Session ${t}`:"Session"),s=T(e.dm),r=String(e.date||"").trim(),i=Number.isFinite(Number(e.capacity))?Number(e.capacity):0,c=Array.isArray(e.players)?e.players.map(Se).filter(Boolean):[];return{id:t,title:a,dm:s,date:r,capacity:i,finale:!!e.finale,players:c}}function se(e){let t={sessions:[],rosterExtras:[],rosterMeta:{},availability:{},buildCards:{}};return!e||typeof e!="object"||(Array.isArray(e.sessions)&&e.sessions.forEach(a=>{let s=we(a);s&&s.id&&(s.players=Array.isArray(a.players)?a.players.map(Se).filter(Boolean):[],t.sessions.push(s))}),Array.isArray(e.rosterExtras)&&e.rosterExtras.forEach(a=>{if(!a||typeof a!="object")return;let s=H(a.name);if(!s)return;let r=R(a.key||s);r&&t.rosterExtras.push({key:r,name:s,status:T(a.status),notes:T(a.notes),custom:!0})}),e.rosterMeta&&typeof e.rosterMeta=="object"&&Object.entries(e.rosterMeta).forEach(([a,s])=>{let r=R(a);if(!r||!s||typeof s!="object")return;let i=T(s.status),c=T(s.notes),o=!!s.hidden;(i||c||o)&&(t.rosterMeta[r]={status:i,notes:c,hidden:o})}),e.availability&&typeof e.availability=="object"&&Object.entries(e.availability).forEach(([a,s])=>{let r=R(a);if(!r||!s||typeof s!="object")return;let i={};Object.entries(s).forEach(([c,o])=>{K.includes(c)&&(i[c]=!!o)}),t.availability[r]=i}),e.buildCards&&typeof e.buildCards=="object"&&Object.entries(e.buildCards).forEach(([a,s])=>{let r=R(a);if(!r||!s||typeof s!="object")return;let i={};s.class&&(i.class=T(s.class)),s.university&&(i.university=T(s.university)),(s.characterName||s.character_name||s.name)&&(i.characterName=H(s.characterName||s.character_name||s.name)),t.buildCards[r]=i})),t}var ie={key:"oracleOfflineState",read(){try{let e=localStorage.getItem(this.key);if(!e)return null;let t=JSON.parse(e);if(t&&typeof t=="object"&&t.version===1&&t.state)return se(t.state)}catch(e){console.warn("Offline cache read failed",e)}return null},write(e){try{localStorage.setItem(this.key,JSON.stringify({version:1,state:e}))}catch(t){console.warn("Offline cache write failed",t)}},clear(){try{localStorage.removeItem(this.key)}catch{}}},ee=(function(){let e=document.getElementById("networkBanner"),t=0,a="";function s(){if(e){if(a){e.textContent=`\u26A0\uFE0F ${a}`,e.classList.add("error"),e.classList.remove("loading"),e.hidden=!1;return}t>0?(e.textContent="Syncing with the Oracle Archives\u2026",e.classList.add("loading"),e.classList.remove("error"),e.hidden=!1):(e.hidden=!0,e.classList.remove("error"),e.classList.remove("loading"))}}return{begin(){t++,s()},end(){t=Math.max(0,t-1),s()},setError(r){a=r||"Network request failed.",s()},clearError(){a="",s()}}})(),G=(function(){let e=document.getElementById("draftStatus");function t(a,s="info"){e&&(e.textContent=a,e.dataset.tone=s)}return{info(a){t(a,"info")},success(a){t(a,"success")},error(a){t(a,"error")}}})();function Pe(e){if(!oe||/^https?:/i.test(e))return e;try{return new URL(e,oe).toString()}catch{return oe.replace(/\/$/,"")+e}}async function O(e,t={}){let a=Pe(e),s={...t};s.headers={...t.headers||{}},s.body&&!(s.body instanceof FormData)&&!s.headers["Content-Type"]&&(s.headers["Content-Type"]="application/json"),ee.begin();try{let r=await fetch(a,s);if(!r.ok){let o=await r.text();throw new Error(o||`Request failed (${r.status})`)}let i=r.headers.get("content-type")||"",c=null;return i.includes("application/json")?c=await r.json():c=await r.text(),ee.clearError(),c}catch(r){throw ee.setError(r&&r.message?r.message:"Network request failed."),r}finally{ee.end()}}window.APP_UTILS=window.APP_UTILS||{};window.APP_UTILS.testApiConnection=async function(){let t=await O("/api/state",{headers:{Accept:"application/json"}});return console.info("[OracleTournament] /api/state responded with:",t),t};var D={data:se(pe),offline:!0,fallback:se(pe),listeners:new Set,apply(e,t="remote"){let a=se(e);return this.data=a,t==="remote"?(ie.write(a),this.offline=!1):(this.offline=!0,t==="offline-cache"&&ie.write(a)),this.notify(),a},useFallbackSessions(e){Array.isArray(e)&&(this.fallback.sessions=e.map(t=>{let a=we(t);return a?{...a,players:Array.isArray(a.players)?a.players.map(s=>({...s})):[]}:null}).filter(Boolean))},useDefaultFallback(){this.apply(this.fallback,"offline-default")},loadFallbackFromCache(){let e=ie.read();return e?(this.apply(e,"offline-cache"),!0):!1},async refresh(){try{let e=await O("/api/state",{headers:{Accept:"application/json"}});if(!e||typeof e!="object"||!e.state)throw new Error("Invalid response from datastore.");return this.apply(e.state,"remote"),this.data}catch(e){throw this.loadFallbackFromCache()||this.useDefaultFallback(),e}},subscribe(e){if(typeof e=="function"){this.listeners.add(e);try{e(this.data)}catch(t){console.error(t)}}return()=>this.listeners.delete(e)},notify(){this.listeners.forEach(e=>{try{e(this.data)}catch(t){console.error(t)}})},getSessionsCopy(){return this.data.sessions.map(e=>({...e,players:Array.isArray(e.players)?e.players.map(t=>({...t})):[]}))}},ne={async joinSession(e,t){Y("join sessions");let a=Q.getRosterEntry(),s={...t,playerKey:(t==null?void 0:t.playerKey)||V,playerName:(t==null?void 0:t.playerName)||(a==null?void 0:a.name)||"",characterName:(t==null?void 0:t.characterName)||(t==null?void 0:t.name)},r=await O(`/api/sessions/${encodeURIComponent(e)}/join`,{method:"POST",body:JSON.stringify(s)});return r&&r.state&&D.apply(r.state,"remote"),r},async leaveSession(e,t){Y("leave sessions");let a={...t,playerKey:(t==null?void 0:t.playerKey)||V},s=await O(`/api/sessions/${encodeURIComponent(e)}/leave`,{method:"POST",body:JSON.stringify(a)});return s&&s.state&&D.apply(s.state,"remote"),s},async setAvailability(e){Y("update availability");let t=Q.getRosterEntry(),a={...e,playerKey:(e==null?void 0:e.playerKey)||V,playerName:(e==null?void 0:e.playerName)||(t==null?void 0:t.name)||(e==null?void 0:e.name)},s=await O("/api/availability",{method:"POST",body:JSON.stringify(a)});return s&&s.state&&D.apply(s.state,"remote"),s},async addRosterExtra(e){Y("add roster entries");let t=await O("/api/roster/extras",{method:"POST",body:JSON.stringify(e)});return t&&t.state&&D.apply(t.state,"remote"),t},async updateRosterEntry(e,t){Y("edit the roster");let a=await O(`/api/roster/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)});return a&&a.state&&D.apply(a.state,"remote"),a},async removeRosterExtra(e){Y("remove roster entries");let t=await O(`/api/roster/extras/${encodeURIComponent(e)}`,{method:"DELETE"});return t&&t.state&&D.apply(t.state,"remote"),t}},Ae={read(){return D.data.availability}},Ce={read(){return D.data.rosterExtras}},Be={read(){return D.data.rosterMeta}},je={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function H(e){return String(e!=null?e:"").trim()}function T(e){return String(e!=null?e:"").trim()}function R(e){return H(e).toLowerCase()}function P(e){return String(e!=null?e:"").replace(/[&<>"']/g,t=>je[t]||t)}function Z(e){return P(e)}var Ee=new Set;function de(e){let t=R(e);return t?Ee.has(t)?!0:Ce.read().some(a=>a.key===t):!1}async function xe(e,t="",a=""){if(B)return{ok:!1,msg:F};let s=H(e);if(!s)return{ok:!1,msg:"Name is required."};let r=R(s);if(de(r))return{ok:!1,msg:`${s} is already on the roster.`};let i=T(t),c=T(a);try{return await ne.addRosterExtra({name:s,status:i,notes:c}),{ok:!0,key:r,name:s}}catch(o){return{ok:!1,msg:o&&o.message?o.message:"Failed to add roster entry."}}}async function ue(e,t,a,s,r){if(B)throw new Error(F);let i=R(e);if(!i)return;let c=T(a),o=T(s),u=r==null?!!(t&&t.hidden):!!r;await ne.updateRosterEntry(i,{status:c,notes:o,custom:!!(t&&t.custom),name:t&&t.name?H(t.name):"",hidden:u})}async function ye(e,t){if(B)throw new Error(F);!e||!e.key||await ue(e.key,e,e.status,e.notes,t)}function U(e={}){let t=!!e.includeHidden,a=Ce.read(),s=Be.read(),r=[];return N.roster.forEach(i=>{let c=R(i.key||i.name),o=s[c]||{},u={name:i.name,key:c,status:o.status||T(i.status),notes:o.notes||T(i.notes),custom:!1,hidden:!!o.hidden};u.hidden&&!t||r.push(u)}),a.forEach(i=>{let c=R(i.key||i.name),o=s[c]||{},u={name:i.name,key:c,status:o.status||T(i.status),notes:o.notes||T(i.notes),custom:!0,hidden:!!o.hidden};u.hidden&&!t||r.push(u)}),r.sort((i,c)=>i.name.localeCompare(c.name,"en",{sensitivity:"base"}))}function Oe(){return U({includeHidden:!0}).filter(e=>e.hidden)}function $e(e){try{return new Date(e+"T00:00:00").toLocaleDateString("en-CA",{month:"short",day:"2-digit"})}catch{return e}}function he(e){let t=a=>String(a).padStart(2,"0");return e.getFullYear()+t(e.getMonth()+1)+t(e.getDate())+"T"+t(e.getHours())+t(e.getMinutes())+t(e.getSeconds())}function Fe(e){let t="America/Edmonton",a=new Date(e.date+"T19:00:00"),s=new Date(e.date+"T21:00:00"),i=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//OracleTrials//Scheduler//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",`UID:${`${e.id}@oracletrials`}`,`SUMMARY:${e.title}`,`DESCRIPTION:DM: ${e.dm} | Capacity: ${e.capacity}`,`DTSTART;TZID=${t}:${he(a)}`,`DTEND;TZID=${t}:${he(s)}`,"END:VEVENT","END:VCALENDAR"].join(`\r
`),c=new Blob([i],{type:"text/calendar"}),o=document.createElement("a");o.href=URL.createObjectURL(c),o.download=`${e.title.replace(/\s+/g,"-")}.ics`,o.click(),URL.revokeObjectURL(o.href)}var N={levels:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],abilityArrays:{standard:[15,14,13,12,10,8]},universities:[{key:"lorehold",name:"Lorehold",theme:"History & Spirits",colours:"Red/White",focus:"Archaeomancy",playstyle:"Scholar / Explorer",spells:{1:["Comprehend Languages","Identify"],2:["Borrowed Knowledge","Locate Object"],3:["Speak with Dead","Spirit Guardians"],4:["Arcane Eye","Stone Shape"],5:["Flame Strike","Legend Lore"]}},{key:"prismari",name:"Prismari",theme:"Elemental Arts",colours:"Blue/Red",focus:"Performance & Elements",playstyle:"Passion / Spectacle",spells:{1:["Chromatic Orb","Thunderwave"],2:["Flaming Sphere","Kinetic Jaunt"],3:["Haste","Water Walk"],4:["Freedom of Movement","Wall of Fire"],5:["Cone of Cold","Conjure Elemental"]}},{key:"quandrix",name:"Quandrix",theme:"Math & Nature",colours:"Blue/Green",focus:"Fractals / Growth",playstyle:"Logical / Curious",spells:{1:["Entangle","Guiding Bolt"],2:["Enlarge/Reduce","Vortex Warp"],3:["Aura of Vitality","Haste"],4:["Control Water","Freedom of Movement"],5:["Circle of Power","Passwall"]}},{key:"silverquill",name:"Silverquill",theme:"Eloquence & Ink",colours:"White/Black",focus:"Radiance & Shadow",playstyle:"Charisma / Wit",spells:{1:["Dissonant Whispers","Silvery Barbs"],2:["Calm Emotions","Darkness"],3:["Beacon of Hope","Daylight"],4:["Compulsion","Confusion"],5:["Dominate Person","Rary\u2019s Telepathic Bond"]}},{key:"witherbloom",name:"Witherbloom",theme:"Life & Decay",colours:"Green/Black",focus:"Alchemy / Essence",playstyle:"Healer / Witch",spells:{1:["Cure Wounds","Inflict Wounds"],2:["Lesser Restoration","Wither and Bloom"],3:["Revivify","Vampiric Touch"],4:["Blight","Death Ward"],5:["Antilife Shell","Greater Restoration"]}}],backgrounds:[{key:"lorehold-student",name:"Lorehold Student",skills:["History","Religion"],tools:[],languages:"2 of choice",gear:["Ink/pen","Hammer","Lantern","History tome","Uniform"],feat:"Strixhaven Initiate (Lorehold)"},{key:"prismari-student",name:"Prismari Student",skills:["Acrobatics","Performance"],tools:["+1 instrument/tool"],languages:"1",gear:["Ink/pen","Artisan tools or Instrument","Uniform"],feat:"Strixhaven Initiate (Prismari)"},{key:"quandrix-student",name:"Quandrix Student",skills:["Arcana","Nature"],tools:["+1 artisan tool"],languages:"1",gear:["Ink/pen","Abacus","Arcane theory book","Uniform"],feat:"Strixhaven Initiite (Silverquill)"},{key:"silverquill-student",name:"Silverquill Student",skills:["Intimidation","Persuasion"],tools:[],languages:"2",gear:["Ink/pen","Poetry book","Uniform"],feat:"Strixhaven Initiite (Silverquill)"},{key:"witherbloom-student",name:"Witherbloom Student",skills:["Nature","Survival"],tools:["Herbalism Kit"],languages:"1",gear:["Plant ID book","Iron pot","Herbalism kit","Uniform"],feat:"Strixhaven Initiate (Witherbloom)"}],feats:{strixhavenInitiate:{name:"Strixhaven Initiate",text:"Choose your college; learn 2 cantrips from its list + one 1st-level spell. Cast the 1st-level spell once per long rest without a slot; also with slots. Choose Int/Wis/Cha as spellcasting ability for these."}},extracurriculars:[{key:"dead-languages",name:"Dead Languages Society",skills:["Athletics","History"]},{key:"fine-artists",name:"Distinguished Society of Fine Artists",skills:["Performance","Sleight of Hand"]},{key:"dragonchess",name:"Dragonchess Club",skills:["Deception","Investigation"]},{key:"historical-soc",name:"Dragonsguard Historical Society",skills:["Arcana","History"]},{key:"horticulture",name:"Fantastical Horticulture Club",skills:["Nature","Survival"]},{key:"entrepreneurs",name:"Future Entrepreneurs of Strixhaven",skills:["Insight","Persuasion"]},{key:"gymnastics",name:"Intramural Gymnastics",skills:["Acrobatics","Performance"]},{key:"silkball",name:"Silkball Club",skills:["Athletics","Intimidation"]},{key:"water-dance",name:"Water-Dancing Club",skills:["Athletics","Performance"]},{key:"larp",name:"LARP Guild",skills:["Animal Handling","Performance"]},{key:"cheer",name:"Mage Tower Cheer",skills:["Perception","Persuasion"]},{key:"drama",name:"Playactors Drama Guild",skills:["Arcana","Deception"]},{key:"iron-lifters",name:"Iron-Lifters",skills:["Athletics","Medicine"]},{key:"show-band",name:"Show Band",skills:["Sleight of Hand","Performance"]},{key:"newspaper",name:"Strixhaven Star (Newspaper)",skills:["Investigation","Insight"]},{key:"faith",name:"Student-Mages of Faith",skills:["Insight","Religion"]}],jobs:[{key:"biblioplex",name:"Biblioplex",skills:["Arcana","History"]},{key:"firejolt",name:"Firejolt Caf\xE9",skills:["Insight","Persuasion"]},{key:"bowsend",name:"Bow's End Tavern",skills:["Performance","Deception"]},{key:"stadium",name:"Stadium",skills:["Athletics","Intimidation"]},{key:"performing-arts",name:"Performing Arts Society",skills:["Performance","Deception"]},{key:"dorms",name:"Dormitories",skills:["Persuasion","Perception"]},{key:"grounds",name:"Campus Grounds",skills:["Nature","Survival"]},{key:"labs",name:"Magic Labs",skills:["Arcana","Investigation"]},{key:"intramural",name:"Intramural Fields",skills:["Athletics","Acrobatics"]}],roster:[{name:"Amy",status:"Yes",key:"amy456"},{name:"Kaela",status:"Yes",key:"kaela123"},{name:"Trevor",status:"Yes",key:"trev789"}],sessions:[{id:"s1",date:"2025-12-21",title:"Session 01",dm:"Kaela & Tory",capacity:6,players:[]},{id:"s2",date:"2025-12-22",title:"Session 02",dm:"Kaela & Tory",capacity:6,players:[]},{id:"s3",date:"2025-12-26",title:"Session 03",dm:"Kaela & Tory",capacity:6,players:[]},{id:"s4",date:"2025-12-27",title:"Session 04",dm:"Kaela & Tory",capacity:6,players:[]},{id:"s5",date:"2025-12-28",title:"Session 05",dm:"Kaela & Tory",capacity:6,players:[]},{id:"s6",date:"2025-12-29",title:"Session 06",dm:"Kaela & Tory",capacity:6,players:[]},{id:"finale",date:"2026-01-01",title:"Grand Finale",dm:"Kaela & Tory",capacity:8,players:[],finale:!0}]};N.roster=[...N.roster].sort((e,t)=>e.name.localeCompare(t.name,"en"));Ee=new Set(N.roster.map(e=>R(e.key||e.name)));D.useFallbackSessions(N.sessions);D.useDefaultFallback();var ve={hardNo:["Link"],blockedDates:{Melissa:["2025-12-28"]}};function Le(){let e=[];try{Array.isArray(K)?K.forEach((t,a)=>{/^\d{4}-\d{2}-\d{2}$/.test(String(t))||e.push(`AVAIL_DATES[${a}] must be YYYY-MM-DD (got "${t}")`)}):e.push("AVAIL_DATES is missing or not an array.")}catch{e.push("AVAIL_DATES could not be read.")}try{if(!Array.isArray(N.sessions))e.push("DATA.sessions is missing or not an array.");else{let t=new Set;N.sessions.forEach((a,s)=>{if(!a||typeof a!="object"){e.push(`sessions[${s}] is not an object`);return}a.id||e.push(`sessions[${s}] is missing an id`),a.id&&(t.has(a.id)?e.push(`Duplicate session id: ${a.id}`):t.add(a.id)),/^\d{4}-\d{2}-\d{2}$/.test(String(a.date||""))||e.push(`${a.title||a.id||"session#"+s} has non-ISO date "${a.date}"`),typeof a.capacity!="number"&&e.push(`${a.title||a.id||"session#"+s} capacity must be a number`)})}}catch{e.push("DATA.sessions could not be validated.")}try{Array.isArray(N.roster)||e.push("DATA.roster is missing or not an array.")}catch{e.push("DATA.roster could not be validated.")}return e}function Te(e){if(!e||!e.length)return;let t=document.querySelector("main"),a=document.createElement("div");a.className="panel",a.style.border="1px solid #f14a3b",a.style.background="#1d1111",a.innerHTML=`
      <h2>Configuration issues</h2>
      <p>Fix the items below, then refresh. If you changed dates/IDs recently, hit <strong>Clear Local Data</strong> in the sidebar.</p>
      <ul>${e.map(s=>`<li>${s.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</li>`).join("")}</ul>
    `,t.prepend(a)}window.addEventListener("error",e=>{let t=document.querySelector("main");if(!t)return;let a=document.createElement("div");a.className="panel",a.style.border="1px solid #f14a3b",a.style.background="#1d1111",a.innerHTML=`<strong>Runtime error:</strong> ${String(e.message||"Unknown error")}`,t.prepend(a)});var re={key:"oracleTrialsSave",read(){try{let e=localStorage.getItem(this.key);return e?JSON.parse(e):null}catch(e){return console.warn("Local draft read failed",e),null}},write(e){try{localStorage.setItem(this.key,JSON.stringify(e))}catch(t){console.warn("Local draft write failed",t)}},clear(){try{localStorage.removeItem(this.key)}catch(e){console.warn("Local draft clear failed",e)}}};function le(e){try{return JSON.parse(JSON.stringify(e||{}))}catch(t){return console.warn("Draft clone failed",t),{}}}var be={async saveDraft(e){let t=encodeURIComponent(V),a=await O(`/api/characters/${t}`,{method:"PUT",body:JSON.stringify({data:e})});return a&&a.draft?a.draft:null},async loadDraft(){let e=encodeURIComponent(V),t=await O(`/api/characters/${e}`,{headers:{Accept:"application/json"}});return t&&t.draft?t.draft:null}},b={data:{meta:{version:"0.5-stable"},core:{playerName:"",name:"",race:"",class:"",background:"",level:4,abilityMethod:"standard",abilities:{STR:15,DEX:14,CON:13,INT:12,WIS:10,CHA:8},equipment:"class"},university:{key:"",spellAbility:"INT"},feats:[],extras:{job:null,clubs:[],studentDice:[]},personality:{traits:"",ideal:"",bond:"",rival:"",goal:"",prompt:""},exams:{notes:"",studyRerolls:0,results:[]}},sessions:[],async save(){let e=le(this.data);re.write(e);let t=null,a=null;if(!B)try{t=await be.saveDraft(e)}catch(s){a=s,console.warn("Remote draft save failed",s)}return t?(G.success("Draft synced to the Oracle Archives and backed up in this browser."),!0):(a?G.error("Online save failed; your draft is stored in this browser only."):B?G.info("Guest saves stay in this browser. Enter your access code to sync online."):G.info("Saved locally. Reconnect to sync with the Oracle Archives."),!1)},async load(){let e=null;if(!B)try{let s=await be.loadDraft();if(s&&s.data)return this.data=le(s.data),re.write(this.data),ce(),G.success("Draft loaded from the Oracle Archives."),!0}catch(s){e=s,console.warn("Remote draft load failed",s)}let t=re.read();return t?(this.data=le(t),ce(),e?G.error("Loaded browser backup after the Oracle Archives could not be reached."):G.info("Loaded the draft stored in this browser."),!0):(G.error(e?"No drafts found online or offline. Save your character first.":"No saved drafts yet."),alert(e?"Could not load any drafts from the Oracle Archives or this browser. Save a character once you are back online.":"No saved draft found. Create and save a character first."),!1)},export(){let e=new Blob([JSON.stringify({character:this.data,sessions:this.sessions},null,2)],{type:"application/json"}),t=URL.createObjectURL(e),a=document.createElement("a");a.href=t,a.download=`oracle-trials-${(this.data.core.name||"character").toLowerCase().replace(/[^a-z0-9\-]/g,"-")}.json`,a.click(),URL.revokeObjectURL(t)}};D.subscribe(()=>{var e;if(b.sessions=D.getSessionsCopy(),(e=b==null?void 0:b.data)!=null&&e.core){let t=Q.getRosterEntry();t&&!b.data.core.playerName&&(b.data.core.playerName=t.name)}});function ge(){let e=b.data.core||{},t=b.data.university||{};return!!(e.name&&e.name.trim().length>=2&&e.class&&e.class.trim()&&e.level&&Number.isFinite(+e.level)&&t.key&&t.key.trim())}function ke(e,t={readOnly:!1}){let{readOnly:a=!1}=t;e.innerHTML="";let s=D.data.buildCards||{};b.sessions.slice().sort((r,i)=>r.date.localeCompare(i.date)).forEach(r=>{let i=(r.players||[]).length,c=i>=r.capacity,o=i?(Array.isArray(r.players)?r.players:[]).map(y=>{let E=y&&y.key?s[y.key]:null,q="";if(E){let m=P(E.class||"?"),f=P(E.university||"?");q=` \u2014 <span class="muted">${m} \u2022 ${f}</span>`}return`<div class="pill"><span>${P(y&&(y.character||y.name||y.playerName||"Player"))}</span>${q}</div>`}).join(""):'<span class="muted">No players yet</span>',u=!ge()||c?"disabled":"",h=a?"":`<button data-id="${r.id}" class="primary" ${u}>Add my character</button>`,S=document.createElement("div");S.className="card",S.innerHTML=`
        <div class="flex" style="justify-content:space-between">
          <div>
            <strong>${r.title}</strong>
            <div class="muted">${r.date} \u2022 DM: ${r.dm} \u2022 Capacity: ${i}/${r.capacity}</div>
            <div class="muted" style="margin-top:4px">No duplicate universities allowed in the same session.</div>
            ${!a&&!ge()?'<div class="muted" style="margin-top:6px">Finish <em>Core 5e</em> + choose a <em>University</em> to join.</div>':""}
            ${!a&&c?'<div class="muted" style="margin-top:6px">This session is full.</div>':""}
          </div>
          <div class="flex">
            ${h}
            <button data-ics="${r.id}">.ics</button>
          </div>
        </div>
        <div style="margin-top:8px" class="flex">${o}</div>
      `,e.appendChild(S)})}function He(e){let t=e.querySelector("#commentForm"),a=e.querySelector("#commentText"),s=e.querySelector("#commentPlayer"),r=e.querySelector("#commentCharacter"),i=e.querySelector("#commentSession"),c=e.querySelector("#commentList"),o=e.querySelector("#refreshComments"),u=e.querySelector("#commentStatus");if(!t||!a||!c)return;let h=0,S=t.querySelector('button[type="submit"]'),y=B,E=(n,g="success")=>{if(u){try{window.clearTimeout(h)}catch{}u.textContent=n,u.dataset.tone=g,u.hidden=!1,h=window.setTimeout(()=>{u.hidden=!0},3600)}};if(u&&(u.hidden=!0),y){[a,s,r,i].forEach(g=>{g&&(g.disabled=!0,g.setAttribute("aria-disabled","true"))}),S&&(S.disabled=!0,S.title=F,S.textContent="Comments disabled for guests");let n=document.createElement("p");n.className="muted",n.textContent=F,t.appendChild(n)}let q=n=>{try{return new Date(n).toLocaleString(void 0,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}catch{return n}},w=n=>n.slice().sort((g,l)=>{let d=new Date((g==null?void 0:g.createdAt)||0).getTime();return new Date((l==null?void 0:l.createdAt)||0).getTime()-d}),m=n=>{var $,L,M,te,ae,z,X;if(!n||typeof n!="object")return null;let g=((L=($=n.id)!=null?$:n.comment_id)!=null?L:"").toString().trim(),l=((te=(M=n.comment)!=null?M:n.text)!=null?te:"").toString().trim();if(!l)return null;let d=T((ae=n.playerName)!=null?ae:n.player_name),p=T((z=n.characterName)!=null?z:n.character_name),k=T((X=n.sessionId)!=null?X:n.session_id),C=n.createdAt||n.created_at||n.stamp;if(C){let J=new Date(C);C=Number.isNaN(J.getTime())?new Date().toISOString():J.toISOString()}else C=new Date().toISOString();return{id:g||`local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,playerName:d,characterName:p,sessionId:k,comment:l,createdAt:C}},f={comments:[],loading:!1},A=n=>{let g=new Set,l=[];return(n||[]).forEach(d=>{let p=d&&d.comment?d:m(d);!p||!p.comment||g.has(p.id)||(g.add(p.id),l.push(p))}),f.comments=w(l),f.comments},x=()=>{if(f.loading){c.innerHTML='<p class="comment-empty">Loading comments\u2026</p>';return}if(!f.comments.length){c.innerHTML='<p class="comment-empty">No comments yet. Add the first note above.</p>';return}c.innerHTML="",f.comments.forEach(n=>{if(!n||!n.comment)return;let g=document.createElement("div");g.className="comment-item",g.dataset.pending=n.pending?"true":"false";let l=document.createElement("p");if(l.textContent=n.comment,g.appendChild(l),n.playerName||n.characterName||n.sessionId){let k=document.createElement("div");if(k.className="comment-meta",n.playerName){let C=document.createElement("span");C.textContent=`Player: ${n.playerName}`,k.appendChild(C)}if(n.characterName){let C=document.createElement("span");C.textContent=`Character: ${n.characterName}`,k.appendChild(C)}if(n.sessionId){let C=document.createElement("span");C.textContent=`Session: ${n.sessionId}`,k.appendChild(C)}g.appendChild(k)}let d=document.createElement("time");d.dateTime=n.createdAt,d.textContent=q(n.createdAt),g.appendChild(d);let p=document.createElement("button");p.type="button",p.className="danger",n.pending?(p.textContent="Posting\u2026",p.disabled=!0):y?(p.textContent="Delete",p.disabled=!0,p.title=F):(p.textContent="Delete",p.addEventListener("click",()=>{_(n)})),g.appendChild(p),c.appendChild(g)})},I=async({silent:n=!1}={})=>{f.loading=!0,x();try{let g=await O("/api/comments",{headers:{Accept:"application/json"}}),l=Array.isArray(g==null?void 0:g.comments)?g.comments:[];A(l.map(m).filter(Boolean)),n||E("Comments updated.","info")}catch(g){throw n||E(g&&g.message?g.message:"Failed to load comments.","error"),g}finally{f.loading=!1,x()}},_=async n=>{if(y){E(F,"error");return}if(!n||!n.id||!(typeof confirm=="function"?confirm("Delete this comment?"):!0))return;let l=f.comments.slice();A(l.filter(d=>d.id!==n.id)),x(),E("Removing comment\u2026","info");try{await O(`/api/comments/${encodeURIComponent(n.id)}`,{method:"DELETE"}),E("Comment deleted.","info")}catch(d){A(l),x(),E(d&&d.message?d.message:"Failed to delete comment.","error")}};t.addEventListener("submit",async n=>{if(n.preventDefault(),y){E(F,"error");return}let g=(a.value||"").trim();if(!g){E("Comment text is required.","error");return}let l=s?T(s.value):"",d=r?T(r.value):"",p=i?T(i.value):"",k=f.comments.slice(),C={id:`pending-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,playerName:l,characterName:d,sessionId:p,comment:g,createdAt:new Date().toISOString(),pending:!0};A([C,...k]),x(),E("Posting comment\u2026","info"),S&&(S.disabled=!0);try{let v=await O("/api/comments",{method:"POST",body:JSON.stringify({playerName:l,characterName:d,sessionId:p,comment:g})}),$=m(v&&v.comment);if(!$)throw new Error("Invalid response from datastore.");A([$,...k]),x(),a&&(a.value=""),s&&(s.value=""),r&&(r.value=""),i&&(i.value=""),E("Comment posted!","success")}catch(v){A(k),x(),v&&v.message?E(v.message,"error"):E("Failed to post comment.","error")}finally{S&&(S.disabled=!1)}}),o&&o.addEventListener("click",n=>{n.preventDefault(),I().catch(g=>{g&&g.message?E(g.message,"error"):E("Failed to refresh comments.","error")})}),x(),I({silent:!0}).catch(n=>{n&&n.message?E(n.message,"error"):E("Unable to load comments.","error")})}async function Me(e=document){var a;let t=(a=e==null?void 0:e.querySelector)==null?void 0:a.call(e,"#questList");if(t){t.innerHTML='<p class="muted">Loading quests\u2026</p>';try{let s=await fetch("./site/data/quests.json",{cache:"no-store"});if(!s.ok)throw new Error(`Request failed: ${s.status}`);let r=await s.json();if(!Array.isArray(r)||!r.length){t.innerHTML='<p class="muted">No quests are published yet. Check back soon.</p>';return}let i=document.createDocumentFragment();r.forEach(c=>{var S;if(!c||typeof c!="object")return;let o=document.createElement("article");o.className="quest-card";let u=document.createElement("h4");u.textContent=c.title||`Quest #${(S=c.id)!=null?S:"?"}`,o.appendChild(u);let h=document.createElement("div");if(h.className="quest-meta",typeof c.id!="undefined"){let y=document.createElement("span");y.textContent=`ID ${c.id}`,h.appendChild(y)}if(c.status){let y=document.createElement("span");y.textContent=`Status: ${c.status}`,h.appendChild(y)}if(h.childNodes.length&&o.appendChild(h),c.notes){let y=document.createElement("p");y.className="quest-notes",y.textContent=c.notes,o.appendChild(y)}i.appendChild(o)}),t.innerHTML="",t.appendChild(i)}catch(s){console.error("Quest board failed",s),t.innerHTML='<p class="muted">Unable to load quests right now. Try refreshing later.</p>'}}}function Ue(){return D.data.buildCards||{}}function We(){let e=Ae.read(),t=K.slice(),s=[["name",...t.map($e)]];U().forEach(u=>{let h=[u.name];t.forEach(S=>{let y=e[u.key]||{};h.push(y[S]?"Y":"")}),s.push(h)});let r=s.map(u=>u.map(h=>`"${String(h!=null?h:"").replaceAll('"','""')}"`).join(",")).join(`
`),i=new Date().toISOString().slice(0,10).replace(/-/g,""),c=new Blob([r],{type:"text/csv"}),o=document.createElement("a");o.href=URL.createObjectURL(c),o.download=`oracle-availability-${i}.csv`,o.click(),URL.revokeObjectURL(o.href)}var j=[{key:"intro",title:"Welcome",hint:"Overview & updates"},{key:"sessions",title:"Availability",hint:"Mark who can attend"},{key:"builder",title:"Character Builder",hint:"Core, college, flavour"},{key:"join",title:"Join a Session",hint:"Reserve a seat"},{key:"summary",title:"Summary & Export",hint:"Share or download"}],me=0;function Ge(){let e=document.getElementById("stepNav");if(!e)return;let t=e.querySelector('button[aria-selected="true"]');t&&t.focus()}function W(e,t=!1){Number.isNaN(e)||e<0||e>=j.length||(me=e,Ie(),Ne(),t&&Ge())}function Ke(e){let t=e.target;if(!t||t.getAttribute("role")!=="tab")return;let a=e.key,s=Number(t.dataset.index||"0"),r=null;a==="ArrowRight"||a==="ArrowDown"?r=(s+1)%j.length:a==="ArrowLeft"||a==="ArrowUp"?r=(s-1+j.length)%j.length:a==="Home"?r=0:a==="End"&&(r=j.length-1),r!==null&&(e.preventDefault(),W(r,!0))}function Ne(){let e=document.getElementById("stepNav");if(!e)return;let t=e.scrollLeft;e.innerHTML="",e.setAttribute("role","tablist"),e.setAttribute("aria-label","Character builder steps");let a=document.createDocumentFragment();if(j.forEach((i,c)=>{let o=document.createElement("button");o.type="button",o.id=`step-tab-${i.key}`,o.className="step-pill",o.dataset.step=i.key,o.dataset.index=String(c),o.setAttribute("role","tab"),o.setAttribute("aria-controls",`panel-${i.key}`);let u=c===me;o.setAttribute("aria-selected",u?"true":"false"),o.setAttribute("tabindex",u?"0":"-1");let h=i.hint?`<small>${P(i.hint)}</small>`:"";o.innerHTML=`
        <span class="step-number">${c+1}</span>
        <span class="step-label"><span>${P(i.title)}</span>${h}</span>
      `,o.addEventListener("click",()=>{W(c,!0)}),a.appendChild(o)}),e.appendChild(a),e.dataset.keysBound||(e.addEventListener("keydown",Ke),e.dataset.keysBound="true"),e.scrollWidth>e.clientWidth+8){let i=e.querySelector('button[aria-selected="true"]');if(i)try{i.scrollIntoView({block:"nearest",inline:"center"})}catch{}}else e.scrollLeft=t;let s=document.getElementById("cfgBadge"),r=Le();s.textContent=r.length?`\u26A0\uFE0F ${r.length} config issue${r.length>1?"s":""}`:"\u2705 config OK"}function Ie(){let e=document.getElementById("panels");if(!e)return;e.innerHTML="";let t=j[me].key,a=null;t==="builder"&&(a=Ye()),t==="sessions"&&(a=Ve()),t==="summary"&&(a=ze()),t==="intro"&&(a=Je()),t==="join"&&(a=Qe()),a&&(a.id=`panel-${t}`,a.setAttribute("role","tabpanel"),a.setAttribute("aria-labelledby",`step-tab-${t}`),a.setAttribute("tabindex","0"),e.appendChild(a))}function Je(){let e=document.createElement("div");return e.className="panel",e.innerHTML=`
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

  `,He(e),Me(e),e}function Ve(){let e=document.createElement("div");e.className="panel",e.innerHTML=`
    <h2>Availability</h2>
    <div class="card avail-card">
      <form id="roster_quick_form" class="roster-form roster-quick-add" autocomplete="off">
        <div class="roster-form-grid">
          <div class="form-field">
            <label for="roster_quick_name">Name</label>
            <input id="roster_quick_name" name="name" placeholder="e.g., Tamsin Rowe" />
          </div>
          <div class="form-field">
            <label for="roster_quick_status">Status</label>
            <input id="roster_quick_status" name="status" placeholder="Yes / Maybe / No" />
          </div>
          <div class="form-field form-field-notes">
            <label for="roster_quick_notes">Notes</label>
            <textarea id="roster_quick_notes" name="notes" rows="2" placeholder="Add reminders or context"></textarea>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="primary">Add Person</button>
        </div>
      </form>
      <div class="form-message" id="roster_feedback" role="status" aria-live="polite" hidden></div>
      <div class="table-scroll">
        <table class="table avail" id="avail_table">
          <thead>
            <tr>
              <th>Name</th>
              ${K.map(l=>`<th title="${l}">${$e(l)}</th>`).join("")}
            </tr>
          </thead>
          <tbody id="roster_tbody"></tbody>
        </table>
      </div>
      <div class="muted" style="margin-top:6px">
        Tick when someone is available. Changes sync to the shared datastore automatically (with an offline cache on this device).
      </div>
    </div>
    <div class="card roster-removed-card" id="removed_roster_card" hidden>
      <h3>Hidden roster</h3>
      <p class="muted" id="removed_roster_hint">Restore entries hidden from the availability table.</p>
      <ul id="removed_roster_list" class="removed-roster-list"></ul>
    </div>
    <div class="controls">
      <div class="left">
        <button id="add_person">+ Add Person</button>
        <button id="back_sessions">\u2190 Back</button>
      </div>
      <div class="right">
        <button id="csv_export">Export Availability CSV</button>
        <button id="next_sessions" class="primary">Next \u2192</button>
      </div>
    </div>
  `;let t=e.querySelector("#roster_tbody"),a=e.querySelector(".table-scroll"),s=e.querySelector("#roster_quick_form"),r=e.querySelector("#roster_quick_name"),i=e.querySelector("#roster_quick_status"),c=e.querySelector("#roster_quick_notes"),o=e.querySelector("#roster_feedback"),u=e.querySelector("#removed_roster_card"),h=e.querySelector("#removed_roster_list"),S=B;S&&s&&s.querySelectorAll("input, textarea, button").forEach(l=>{l.disabled=!0,l.setAttribute("aria-disabled","true")});let y={key:null,mode:null},E=null,q=null;function w(l="",d="info"){if(o){if(o.textContent=l,o.classList.remove("error","success"),!l){o.hidden=!0;return}o.hidden=!1,d==="error"&&o.classList.add("error"),d==="success"&&o.classList.add("success")}}S&&w(F,"info");function m(l){return l?l.hasAttribute("data-edit")?{type:"edit",key:l.getAttribute("data-edit")}:l.hasAttribute("data-remove")?{type:"remove",key:l.getAttribute("data-remove")}:null:null}function f(l){return l?l.type==="edit"?Array.from(t.querySelectorAll("button[data-edit]")).find(d=>d.getAttribute("data-edit")===l.key)||null:l.type==="remove"&&Array.from(t.querySelectorAll("button[data-remove]")).find(d=>d.getAttribute("data-remove")===l.key)||null:null}function A(){if(!E)return;let l=f(E);l?l.focus():r&&r.focus(),E=null}function x(l,d="",p="info"){let k=l?l.querySelector("[data-inline-message]"):null;if(k){if(k.textContent=d,k.classList.remove("error","success"),!d){k.hidden=!0;return}k.hidden=!1,p==="error"&&k.classList.add("error"),p==="success"&&k.classList.add("success")}}function I(l){if(S||y.key!==l.key||!y.mode)return"";let d=K.length+1;if(y.mode==="edit"){let p=l.status||"",k=l.notes||"";return`<tr class="inline-editor" data-editor-row="${l.key}"><td colspan="${d}"><form class="roster-inline-editor" data-inline-form data-mode="edit" data-key="${l.key}"><div class="roster-form-grid"><div class="form-field"><label>Status</label><input name="status" value="${Z(p)}" data-editor-input="status" placeholder="Yes / Maybe / No" /></div><div class="form-field form-field-notes"><label>Notes</label><textarea name="notes" rows="2" data-editor-input="notes" placeholder="Add reminders or context">${P(k)}</textarea></div></div><div class="form-message" data-inline-message hidden></div><div class="form-actions"><button type="button" class="link-button" data-cancel>Cancel</button><button type="submit" class="primary">Save</button></div></form></td></tr>`}if(y.mode==="remove"){let p=l.custom?"Remove":"Hide",k=l.custom?"Remove this custom entry from the roster? You can re-add it later.":"Hide this roster entry? You can restore hidden players below.";return`<tr class="inline-editor" data-editor-row="${l.key}"><td colspan="${d}"><form class="roster-inline-editor" data-inline-form data-mode="remove" data-key="${l.key}"><p><strong>${P(l.name)}</strong> \u2014 ${P(k)}</p><div class="form-message" data-inline-message hidden></div><div class="form-actions"><button type="button" class="link-button" data-cancel>Cancel</button><button type="submit" class="danger" data-confirm>${p}</button></div></form></td></tr>`}return""}function _(){if(!u||!h)return;if(S){u.hidden=!0,h.innerHTML="";return}let l=Oe();if(!l.length){h.innerHTML="",u.hidden=!0;return}u.hidden=!1,h.innerHTML=l.map(d=>{let p=[];d.status&&p.push(`Status: ${P(d.status)}`),d.notes&&p.push(`Notes: ${P(d.notes)}`);let k=p.length?`<div class="removed-meta muted">${p.join(" \u2022 ")}</div>`:"";return`<li class="removed-roster-item"><div class="removed-entry"><strong>${P(d.name)}</strong>${k}</div><button type="button" class="link-button" data-restore="${d.key}" data-name="${Z(d.name)}">Restore</button></li>`}).join("")}function n(l={}){let d=Ae.read(),p=U(),k=typeof l.scrollLeft=="number"?l.scrollLeft:a.scrollLeft;if(!p.length){t.innerHTML=`<tr><td colspan="${K.length+1}" class="muted" style="text-align:center">Add people with the <em>Add Person</em> button to start tracking schedules.</td></tr>`,a.scrollLeft=k,_();return}let C=p.map(v=>{let $=d[v.key]||{},L=[];if(v.status){let J=v.status?`status-${v.status.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"default"}`:"status-default";L.push(`<span class="status-pill ${J}">${P(v.status)}</span>`)}v.notes&&L.push(`<span class="note-pill">${P(v.notes)}</span>`);let M=L.length?`<div class="name-meta">${L.join(" ")}</div>`:"",te=S?"":`<div class="name-actions">
        <button type="button" class="link-button" data-edit="${v.key}" data-name="${Z(v.name)}">Edit</button>
        <button type="button" class="link-button danger" data-remove="${v.key}" data-name="${Z(v.name)}" data-remove-type="${v.custom?"custom":"base"}">Remove</button>
      </div>`,ae=K.map(J=>{let _e=$[J]?" checked":"",De=S?" disabled":"";return`<td><input data-key="${v.key}" data-name="${Z(v.name)}" data-date="${J}" type="checkbox"${_e}${De}></td>`}).join(""),z=`<tr><td class="avail-name"><strong>${P(v.name)}</strong>${M}${te}</td>${ae}</tr>`,X=S?"":I(v);return X?`${z}${X}`:z}).join("");if(t.innerHTML=C,a.scrollLeft=k,l.focus&&l.focus.date&&(l.focus.key||l.focus.name)){let v=l.focus;requestAnimationFrame(()=>{let $=Array.from(t.querySelectorAll("input[data-key][data-date]")).find(L=>v.key?L.getAttribute("data-key")===v.key&&L.getAttribute("data-date")===v.date:L.getAttribute("data-name")===v.name&&L.getAttribute("data-date")===v.date);$&&$.focus({preventScroll:!0})})}typeof q=="function"&&requestAnimationFrame(()=>{let v=q();v&&v.focus({preventScroll:!0}),q=null}),l.restoreFocus&&requestAnimationFrame(()=>{A()}),_()}n(),S||(t.addEventListener("change",async l=>{let d=l.target.closest('input[type="checkbox"][data-key][data-name]');if(!d)return;let p=d.getAttribute("data-key"),k=d.getAttribute("data-name"),C=d.getAttribute("data-date"),v=d.checked;try{await ne.setAvailability({name:k,playerName:k,playerKey:p,date:C,available:v}),n({focus:{key:p,name:k,date:C},scrollLeft:a.scrollLeft})}catch($){d.checked=!v,alert(`Failed to update availability: ${$&&$.message?$.message:"Request failed."}`)}}),t.addEventListener("click",l=>{let d=l.target.closest("button[data-edit]");if(d){let C=d.getAttribute("data-edit");if(!U().find(L=>L.key===C))return;if(y.key===C&&y.mode==="edit"){y={key:null,mode:null},n({scrollLeft:a.scrollLeft,restoreFocus:!0});return}E=m(d),y={key:C,mode:"edit"},q=()=>{let L=Array.from(t.querySelectorAll("form[data-inline-form]")).find(M=>M.dataset.mode==="edit"&&M.dataset.key===C);return L?L.querySelector('[data-editor-input="status"]')||L.querySelector('[data-editor-input="notes"]'):null},w(),n({scrollLeft:a.scrollLeft});return}let p=l.target.closest("button[data-remove]");if(p){let C=p.getAttribute("data-remove");if(!U().find(L=>L.key===C))return;if(y.key===C&&y.mode==="remove"){y={key:null,mode:null},n({scrollLeft:a.scrollLeft,restoreFocus:!0});return}E=m(p),y={key:C,mode:"remove"},q=()=>{let L=Array.from(t.querySelectorAll("form[data-inline-form]")).find(M=>M.dataset.mode==="remove"&&M.dataset.key===C);return L?L.querySelector("[data-confirm]")||L.querySelector('button[type="submit"]'):null},w(),n({scrollLeft:a.scrollLeft});return}let k=l.target.closest("button[data-cancel]");k&&k.closest("form[data-inline-form]")&&(y={key:null,mode:null},n({scrollLeft:a.scrollLeft,restoreFocus:!0}))}),t.addEventListener("submit",async l=>{let d=l.target.closest("form[data-inline-form]");if(!d)return;l.preventDefault();let p=d.dataset.mode,k=d.dataset.key,v=U({includeHidden:!0}).find($=>$.key===k);if(!v){x(d,"Roster entry not found.","error");return}x(d);try{if(p==="edit"){let $=d.elements.status?d.elements.status.value:"",L=d.elements.notes?d.elements.notes.value:"";await ue(k,v,$,L),y={key:null,mode:null},n({scrollLeft:a.scrollLeft,restoreFocus:!0}),w(`Saved updates for ${v.name}.`,"success")}else p==="remove"&&(await ye(v,!0),y={key:null,mode:null},n({scrollLeft:a.scrollLeft,restoreFocus:!0}),w(`${v.name} is now hidden. Restore hidden entries below.`,"success"))}catch($){x(d,$&&$.message?$.message:"Request failed. Please try again.","error")}})),h&&!S&&h.addEventListener("click",async l=>{let d=l.target.closest("button[data-restore]");if(!d)return;let p=d.getAttribute("data-restore");try{let C=U({includeHidden:!0}).find(v=>v.key===p);C&&(await ye(C,!1),n({scrollLeft:a.scrollLeft}),w(`${C.name} restored to the roster.`,"success"))}catch(k){w(k&&k.message?k.message:"Failed to restore entry.","error")}});let g=e.querySelector("#add_person");return g&&(S?(g.disabled=!0,g.title=F):g.onclick=()=>{y={key:null,mode:null},w(),r&&r.focus()}),s&&!S&&s.addEventListener("submit",async l=>{l.preventDefault(),w();let d=r?r.value:"",p=H(d),k=T(i?i.value:""),C=T(c?c.value:"");if(!p){w("Name is required.","error"),r&&r.focus();return}let v=R(p);if(de(v)){w(`${p} is already on the roster.`,"error"),r&&(r.focus(),typeof r.select=="function"&&r.select());return}try{let $=await xe(p,k,C);if(!$.ok){w($.msg||"Failed to add roster entry.","error");return}r&&(r.value=""),i&&(i.value=""),c&&(c.value=""),y={key:null,mode:null},n({scrollLeft:a.scrollLeft}),w(`${p} added to the roster.`,"success"),r&&r.focus()}catch($){w($&&$.message?$.message:"Request failed. Please try again.","error")}}),e.querySelector("#csv_export").onclick=We,e.querySelector("#back_sessions").onclick=()=>{W(j.findIndex(l=>l.key==="intro"))},e.querySelector("#next_sessions").onclick=()=>{W(j.findIndex(l=>l.key==="builder"))},e}function Ye(){let e=document.createElement("div");e.className="panel",e.innerHTML=`
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
              <select id="job"><option value="">\u2014 None \u2014</option>${N.jobs.map(m=>`<option value="${m.key}">${m.name}</option>`).join("")}</select>
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
    `;function t(m,f){let A=e.querySelector(`[data-save-note="${m}"]`);A&&(A.textContent=f)}let a=e.querySelector("#core_level");N.levels.forEach(m=>{let f=document.createElement("option");f.value=m,f.textContent=m,a.appendChild(f)});let s=e.querySelector("#ability_box");function r(){s.innerHTML="";let m=e.querySelector("#ability_method").value,f=["STR","DEX","CON","INT","WIS","CHA"];if(m==="standard"){let A=N.abilityArrays.standard.slice();f.forEach(x=>{let I=document.createElement("div");I.className="card",I.innerHTML=`<label>${x}</label><select data-ab="${x}">${A.map(_=>`<option value="${_}">${_}</option>`).join("")}</select>`,s.appendChild(I)})}else f.forEach(A=>{let x=document.createElement("div");x.className="card",x.innerHTML=`<label>${A}</label><input type="number" min="3" max="18" value="10" data-ab="${A}" />`,s.appendChild(x)})}e.querySelector("#ability_method").addEventListener("change",r),r();let i=b.data.core;e.querySelector("#core_player").value=i.playerName||"",e.querySelector("#core_name").value=i.name,e.querySelector("#core_race").value=i.race,e.querySelector("#core_class").value=i.class,e.querySelector("#core_background").value=i.background,e.querySelector("#core_level").value=i.level,e.querySelector("#ability_method").value=i.abilityMethod,e.querySelector("#equipment").value=i.equipment,r();let c=["STR","DEX","CON","INT","WIS","CHA"];c.forEach(m=>{var A,x;let f=s.querySelector(`[data-ab="${m}"]`);f&&(f.value=(x=(A=i.abilities)==null?void 0:A[m])!=null?x:f.value)}),e.querySelector("#save_core").onclick=()=>{let m={};c.forEach(f=>{let A=s.querySelector(`[data-ab="${f}"]`);m[f]=parseInt(A.value,10)}),b.data.core={playerName:e.querySelector("#core_player").value.trim(),name:e.querySelector("#core_name").value.trim(),race:e.querySelector("#core_race").value.trim(),class:e.querySelector("#core_class").value.trim(),background:e.querySelector("#core_background").value.trim(),level:parseInt(e.querySelector("#core_level").value,10),abilityMethod:e.querySelector("#ability_method").value,abilities:m,equipment:e.querySelector("#equipment").value},t("core","Core details saved.")};let o=e.querySelector("#uni");o.innerHTML='<option value="">\u2014 Select \u2014</option>'+N.universities.map(m=>`<option value="${m.key}">${m.name}</option>`).join("");function u(){let m=o.value,f=e.querySelector("#uni_info");if(!m){f.innerHTML='<span class="muted">Select a university to view theme & bonus spells.</span>';return}let A=N.universities.find(I=>I.key===m),x=Object.entries(A.spells).map(([I,_])=>`<tr><td>${I}</td><td>${_.join(", ")}</td></tr>`).join("");f.innerHTML=`
        <div class="two">
          <div>
            <div class="kicker">Theme</div><div>${A.theme}</div>
            <div class="kicker" style="margin-top:6px">Focus</div><div>${A.focus}</div>
            <div class="kicker" style="margin-top:6px">Colours</div><div>${A.colours}</div>
            <div class="kicker" style="margin-top:6px">Playstyle</div><div>${A.playstyle}</div>
          </div>
          <div>
            <div class="kicker">Bonus Spells</div>
            <table class="table"><thead><tr><th>Level</th><th>Spells</th></tr></thead><tbody>${x}</tbody></table>
          </div>
        </div>
        <div class="callout" style="margin-top:8px"><strong>Feat:</strong> ${N.feats.strixhavenInitiate.name} \u2014 ${N.feats.strixhavenInitiate.text}</div>
      `}o.addEventListener("change",u),o.value=b.data.university.key||"",e.querySelector("#spell_ability").value=b.data.university.spellAbility||"INT",u(),e.querySelector("#save_university").onclick=()=>{if(b.data.university={key:o.value,spellAbility:e.querySelector("#spell_ability").value},!b.data.university.key){alert("Pick a university to continue.");return}b.data.feats.find(m=>m.name==="Strixhaven Initiate")?b.data.feats=b.data.feats.map(m=>m.name==="Strixhaven Initiate"?{...m,ability:b.data.university.spellAbility}:m):b.data.feats.push({name:"Strixhaven Initiate",ability:b.data.university.spellAbility}),t("university","University saved.")};let h=e.querySelector("#clublist");function S(){h.innerHTML="",N.extracurriculars.forEach(m=>{let f=`club_${m.key}`,A=document.createElement("label");A.className="card",A.style.cursor="pointer",A.innerHTML=`<div class="flex"><input type="checkbox" id="${f}" data-key="${m.key}" /> <div><strong>${m.name}</strong><div class="muted">Student Die (d4): ${m.skills.join(" / ")}</div></div></div>`,h.appendChild(A)})}S();let y=e.querySelector("#job");y.value=b.data.extras.job||"",(b.data.extras.clubs||[]).forEach(m=>{let f=h.querySelector(`[data-key="${m}"]`);f&&(f.checked=!0)});function E(){let m=y.value||null,f=[...h.querySelectorAll('input[type="checkbox"]:checked')].map(n=>n.dataset.key),A=m?1:2;if(f.length>A){let n=f.pop();h.querySelector(`[data-key="${n}"]`).checked=!1}let x=N.jobs.find(n=>n.key===m),I=N.extracurriculars.filter(n=>f.includes(n.key)),_=[];return x&&_.push(`<span class="tag">Job: ${x.name} \u2014 d4: ${x.skills.join(" / ")}</span>`),I.forEach(n=>_.push(`<span class="tag">Club: ${n.name} \u2014 d4: ${n.skills.join(" / ")}</span>`)),e.querySelector("#bonus_readout").innerHTML=_.length?_.join(" "):'<span class="muted">Pick a job and/or clubs to see Student Dice bonuses.</span>',{job:m,clubs:f}}y.addEventListener("change",E),h.addEventListener("change",E),E(),e.querySelector("#save_extras").onclick=()=>{let{job:m,clubs:f}=E();b.data.extras.job=m,b.data.extras.clubs=f,t("extras","Schedule saved.")};let q=[{u:"Lorehold",text:"A cheerful necro-historian who argues with ghosts about footnotes."},{u:"Prismari",text:"A kinetic dancer who keeps leaving frost footprints after cantrips."},{u:"Quandrix",text:"A fractal botanist who names houseplants after famous equations."},{u:"Silverquill",text:"A sunny orator who spotlights corruption with literal light."},{u:"Witherbloom",text:"A swamp witch medic who collects bones \u201Cfor research.\u201D"}],w=e.querySelector("#prompt_box");return q.forEach(m=>{let f=document.createElement("button");f.className="pill",f.type="button",f.innerHTML=`<span>${m.u}</span><span>\u2022</span><span>${m.text}</span>`,f.onclick=()=>{b.data.personality.prompt=m.text,Array.from(w.children).forEach(A=>A.classList.remove("success")),f.classList.add("success")},w.appendChild(f),b.data.personality.prompt===m.text&&f.classList.add("success")}),e.querySelector("#traits").value=b.data.personality.traits||"",e.querySelector("#ideal").value=b.data.personality.ideal||"",e.querySelector("#bond").value=b.data.personality.bond||"",e.querySelector("#goal").value=b.data.personality.goal||"",e.querySelector("#save_personality").onclick=()=>{b.data.personality={traits:e.querySelector("#traits").value.trim(),ideal:e.querySelector("#ideal").value.trim(),bond:e.querySelector("#bond").value.trim(),goal:e.querySelector("#goal").value.trim(),prompt:b.data.personality.prompt||""},t("personality","Personality saved.")},e.querySelector("#back_builder").onclick=()=>{W(j.findIndex(m=>m.key==="sessions"))},e.querySelector("#next_builder").onclick=()=>{W(j.findIndex(m=>m.key==="join"))},e}function Qe(){let e=document.createElement("div");e.className="panel",e.innerHTML=`
    <h2>Join a Session</h2>
    <div class="card">
      <p>Pick a table for your finished character. You\u2019ll need a <strong>Name</strong>, <strong>Class</strong>, <strong>Level</strong>, and a chosen <strong>University</strong>.</p>
    </div>
    ${B?'<div class="card" role="note"><p class="muted">Guest mode is read-only. Use your personal access code to reserve a seat.</p></div>':""}
    <div id="join_list" class="grid"></div>
    <div class="controls">
      <div class="left"><button id="back_join">\u2190 Back</button></div>
      <div class="right"><button class="primary" id="to_summary">Next \u2192</button></div>
    </div>
  `;let t=e.querySelector("#join_list");return ke(t,{readOnly:B}),t.addEventListener("click",a=>{var i;let s=a.target.closest("button.primary[data-id]");if(s){if(B){alert(F);return}let c=s.getAttribute("data-id"),o=(b.sessions||[]).find(w=>w.id===c),u=(b.data.core.name||"").trim();if(!u){alert("Give your character a name (Core 5e).");return}if(ve.hardNo.includes(u)){alert(`${u} is marked as not playing.`);return}if((ve.blockedDates[u]||[]).includes(o.date)){alert(`${u} isn't available for ${o.date}.`);return}let h=Array.isArray(o.players)?o.players:[];if(h.some(w=>H(w&&w.character)===H(u))){alert("This character is already in that session.");return}if(h.some(w=>R(w&&w.key)===V)){alert("Your access code already has a seat in this session.");return}if(h.length>=o.capacity){alert("That session is full.");return}let S=((i=N.universities.find(w=>w.key===b.data.university.key))==null?void 0:i.name)||"",y=Ue();if(S)for(let w of h){let m=w&&w.key?y[w.key]:null;if(m&&m.university===S){alert(`Another ${S} student is already in this session. Choose a different session or college.`);return}}let E=b.data.core.class||"",q=Q.getRosterEntry();ne.joinSession(c,{name:u,characterName:u,playerKey:V,playerName:q==null?void 0:q.name,build:{class:E,university:S}}).then(()=>{ke(t,{readOnly:B}),alert(`Added ${u} to ${o.title}.`)}).catch(w=>{alert(`Unable to join ${o.title}: ${w&&w.message?w.message:"Request failed."}`)});return}let r=a.target.closest("button[data-ics]");if(r){let c=r.getAttribute("data-ics"),o=b.sessions.find(u=>u.id===c);Fe(o)}}),e.querySelector("#back_join").onclick=()=>{W(j.findIndex(a=>a.key==="builder"))},e.querySelector("#to_summary").onclick=()=>{W(j.findIndex(a=>a.key==="summary"))},e}function ze(){var o;let e=document.createElement("div");e.className="panel";let t=b.data,a=N.universities.find(u=>u.key===t.university.key),s=Object.entries(t.core.abilities||{}).map(([u,h])=>`<span class="tag">${u}: ${h}</span>`).join(" "),r=(t.extras.clubs||[]).map(u=>{var h;return(h=N.extracurriculars.find(S=>S.key===u))==null?void 0:h.name}).filter(Boolean),i=((o=N.jobs.find(u=>u.key===t.extras.job))==null?void 0:o.name)||"\u2014";e.innerHTML=`
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
    `,e.querySelector("#back_s").onclick=()=>{W(j.findIndex(u=>u.key==="builder"))},e.querySelector("#save_s").onclick=()=>b.save(),e.querySelector("#export_s").onclick=()=>b.export(),e.querySelector("#pdf_s").onclick=()=>window.print();let c=e.querySelector("#publish_roster");return c&&(B?(c.disabled=!0,c.title=F,c.textContent="Roster editing disabled for guests"):c.onclick=async()=>{var w,m,f,A,x;let u=H((m=(w=b.data)==null?void 0:w.core)==null?void 0:m.name);if(!u){alert("Give your character a name in Core Setup first.");return}let h=R(u),S=[];(A=(f=b.data)==null?void 0:f.core)!=null&&A.class&&S.push(b.data.core.class);let y=a?a.name:((x=N.universities.find(I=>{var _,n;return I.key===((n=(_=b.data)==null?void 0:_.university)==null?void 0:n.key)}))==null?void 0:x.name)||"";y&&S.push(y);let E=S.join(" \u2022 "),q="Interested";if(de(h)){let _=U().find(n=>n.key===h)||{name:u,custom:!1};try{await ue(h,_,q,E),alert(`${u} is already on the roster. Updated their status and notes.`)}catch(n){alert(`Failed to update roster entry: ${n&&n.message?n.message:"Request failed."}`)}}else{let I=await xe(u,q,E);if(!I.ok){alert(I.msg);return}alert(`${u} added to the availability roster.`)}}),e}function ce(){try{Ne(),Ie(),qe()}catch(e){Te([`Render failed: ${String(e&&e.message||e)}`]),console.error(e)}}function qe(){let e=document.getElementById("btnSave");e&&(e.onclick=()=>b.save());let t=document.getElementById("btnLoad");t&&(t.onclick=()=>b.load());let a=document.getElementById("btnExport");a&&(a.onclick=()=>b.export());let s=document.getElementById("btnClear");s&&(s.onclick=()=>{confirm("Clear all local data for this app?")&&(re.clear(),localStorage.removeItem("oracleOfflineState"),alert("Local data cleared. Reloading\u2026"),location.reload())})}(async function(){let e=Le();if(e.length){Te(e),qe();return}try{await D.refresh()}catch(t){console.warn("Initial sync failed",t),ee.setError("Unable to reach the shared datastore. Showing cached data if available.")}ce()})();})();
//# sourceMappingURL=app.js.map

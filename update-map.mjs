import fs from 'node:fs/promises';
import path from 'node:path';
const url=process.env.TTQ_MAP_URL||'https://ttq.x2.europe.travian.com/map.sql';
const text=await (await fetch(url)).text();
if(!text.includes('x_world')) throw new Error('map.sql did not contain x_world');
function split(s){let out=[],cur='',q='';for(let i=0;i<s.length;i++){const ch=s[i];if(q){cur+=ch;if(ch===q&&s[i-1]!=='\\')q='';}else if(ch==="'"||ch==='"'){q=ch;cur+=ch}else if(ch===','){out.push(cur.trim());cur=''}else cur+=ch}out.push(cur.trim());return out.map(x=>{x=x.trim();if((x[0]==="'"&&x.at(-1)==="'")||(x[0]==='"'&&x.at(-1)==='"'))x=x.slice(1,-1);return x.replace(/''/g,"'")})}
const rows=[];const re=/INSERT\s+INTO\s+[`"']?x_world[`"']?\s+VALUES\s*/ig;let m;
while((m=re.exec(text))){let i=m.index+m[0].length,d=0,q='',st=i;for(;i<text.length;i++){const ch=text[i];if(q){if(ch===q&&text[i-1]!=='\\')q='';continue}if(ch==="'"||ch==='"'){q=ch;continue}if(ch==='('){d++;if(d===1)st=i+1}else if(ch===')'){d--;if(d===0){const v=split(text.slice(st,i));if(v.length>=11)rows.push({id:+v[0],x:+v[1],y:+v[2],tribe:+v[3],villageId:+v[4],name:v[5],playerId:+v[6],player:v[7],allianceId:+v[8],alliance:v[9],pop:+v[10]||0})}}if(d===0&&ch===';')break}}
rows.sort((a,b)=>a.id-b.id);
await fs.mkdir('data',{recursive:true});
await fs.writeFile(path.join('data','villages.json'),JSON.stringify(rows));
console.log(`Updated ${rows.length} villages from ${url}`);

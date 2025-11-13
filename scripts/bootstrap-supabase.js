#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '.env'), override: false });

const fetch = global.fetch || require('node-fetch');

async function main(){
  const projectUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const storageMode = (process.env.SUPABASE_STORAGE_MODE || 'json').toLowerCase();
  const defaultSql = storageMode === 'tables'
    ? 'oracle_tables.sql'
    : 'oracle_state.sql';
  const sqlFile = process.env.SUPABASE_SQL_PATH || path.join(__dirname, '..', 'supabase', defaultSql);

  if(!projectUrl){
    console.error('Missing SUPABASE_URL environment variable.');
    process.exit(1);
  }
  if(!serviceKey){
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
    process.exit(1);
  }

  const endpoint = `${projectUrl.replace(/\/$/, '')}/rest/v1/rpc/pg_execute_sql`;
  const sql = await fs.readFile(sqlFile, 'utf8');

  if(!sql.trim()){
    console.error(`SQL file ${sqlFile} is empty.`);
    process.exit(1);
  }

  console.log(`Executing ${path.relative(process.cwd(), sqlFile)} against ${projectUrl}...`);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  const text = await res.text();
  if(!res.ok){
    console.error(`Supabase responded with ${res.status}: ${text}`);
    process.exit(1);
  }

  try{
    const payload = JSON.parse(text);
    console.log('Supabase response:', payload);
  }catch{
    if(text){
      console.log('Supabase response:', text);
    }
  }

  console.log('Done.');
}

main().catch((err)=>{
  console.error(err);
  process.exit(1);
});

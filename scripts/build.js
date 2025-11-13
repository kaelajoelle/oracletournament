#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const STATIC_FILES = ['index.html', 'index_dev.html', 'login.html'];
const STATIC_DIRS = ['site'];

async function copyFileIfExists(file){
  const src = path.join(ROOT, file);
  try{
    await fs.access(src);
  }catch(err){
    if(err.code === 'ENOENT'){
      return;
    }
    throw err;
  }
  const dest = path.join(DIST, file);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

async function copyDir(dir){
  const src = path.join(ROOT, dir);
  try{
    await fs.access(src);
  }catch(err){
    if(err.code === 'ENOENT'){
      return;
    }
    throw err;
  }
  const dest = path.join(DIST, dir);
  await copyRecursive(src, dest);
}

async function copyRecursive(src, dest){
  const stats = await fs.stat(src);
  if(stats.isDirectory()){
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src);
    for(const entry of entries){
      const from = path.join(src, entry);
      const to = path.join(dest, entry);
      await copyRecursive(from, to);
    }
    return;
  }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

async function main(){
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });

  await Promise.all(STATIC_FILES.map(copyFileIfExists));
  for(const dir of STATIC_DIRS){
    await copyDir(dir);
  }

  console.log(`Static assets copied to ${path.relative(ROOT, DIST)}.`);
  console.log('Deploy the Express API separately (npm start) or serve the dist folder behind a CDN.');
}

main().catch((err)=>{
  console.error(err);
  process.exit(1);
});

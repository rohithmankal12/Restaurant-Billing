// Some terminals set this variable for other tools; desktop Electron must clear it.
const {spawn}=require('node:child_process');const path=require('node:path');
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const target=process.argv.includes('--smoke')?path.join(__dirname,'smoke.cjs'):path.join(__dirname,'..');
const child=spawn(require('electron'),[target],{env,stdio:'inherit'});
child.on('error',error=>{console.error(error.message);process.exit(1);});child.on('exit',code=>process.exit(code??1));

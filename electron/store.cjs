const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const initSqlJs = require('sql.js');
const money = n => Math.round(n * 100) / 100;
const localDayKey=value=>{const d=new Date(value);return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;};
function totals(lines, discount, taxRate) {
 const subtotal = money(lines.reduce((s,l)=>s+l.price*l.quantity,0));
 if (!Number.isFinite(discount) || discount<0 || discount>subtotal) throw Error('Discount must be between zero and subtotal.');
 const tax = money((subtotal-discount)*taxRate/100);
 return {subtotal,discount,tax,total:money(subtotal-discount+tax)};
}
async function openStore(file) {
 const SQL = await initSqlJs({locateFile:f=>require.resolve('sql.js/dist/'+f)});
 const db = new SQL.Database(fs.existsSync(file)?fs.readFileSync(file):undefined);
 db.run(`CREATE TABLE IF NOT EXISTS menu(id INTEGER PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE COLLATE NOCASE, category TEXT NOT NULL, full REAL NOT NULL, half REAL, active INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS invoices(id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE NOT NULL, created TEXT NOT NULL, data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1),data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS draft(id INTEGER PRIMARY KEY CHECK(id=1),data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS auth(id INTEGER PRIMARY KEY CHECK(id=1),username TEXT NOT NULL UNIQUE COLLATE NOCASE,salt TEXT NOT NULL,password_hash TEXT NOT NULL);`);
 const all=(sql,args=[])=>{const stmt=db.prepare(sql);try{stmt.bind(args);const rows=[];while(stmt.step())rows.push(stmt.getAsObject());return rows;}finally{stmt.free();}};
 const persist=()=>{fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.tmp';fs.writeFileSync(tmp,Buffer.from(db.export()));fs.renameSync(tmp,file);};
 if(!all('SELECT * FROM settings').length){db.run('INSERT INTO settings VALUES(1,?)',[JSON.stringify({restaurant:"SRI BALAJI’S LEMON TREE",address:'Above Sri Balaji Super Mrket\nopp: Bus-Stand, Tandur-501141',phone:'7671857847',gstin:'',currency:'INR',taxRate:0,printer:'__PDF__',paperWidth:80,copies:1,autoPrint:false,silent:false,invoiceRetentionDays:30,footer:'THANK YOU VISIT AGAIN'})]);
 for(const x of [['Chicken Biryani','CB','Biryani',270,null],['Veg Biryani','VB','Biryani',180,110],['Paneer Butter Masala','PBM','Curries',220,130],['Butter Naan','BN','Breads',45,null],['Lime Soda','LS','Drinks',60,null]])db.run('INSERT INTO menu(name,code,category,full,half) VALUES(?,?,?,?,?)',x);persist();}
 const settings=()=>({invoiceRetentionDays:30,...JSON.parse(all('SELECT data FROM settings WHERE id=1')[0].data)});
 return {file, all, settings,
 authStatus:()=>({configured:all('SELECT id FROM auth WHERE id=1').length===1}),
 setupAuth(username,password){if(all('SELECT id FROM auth WHERE id=1').length)throw Error('Owner access is already configured.');const user=String(username||'').trim();if(!/^[A-Za-z0-9._-]{3,40}$/.test(user))throw Error('Username must be 3-40 letters, numbers, dots, dashes or underscores.');if(String(password||'').length<8)throw Error('Password must contain at least 8 characters.');const salt=crypto.randomBytes(16).toString('hex');const hash=crypto.scryptSync(String(password),salt,64).toString('hex');db.run('INSERT INTO auth VALUES(1,?,?,?)',[user,salt,hash]);persist();return {username:user};},
 verifyAuth(username,password){const row=all('SELECT username,salt,password_hash FROM auth WHERE username=?',[String(username||'').trim()])[0];if(!row)return false;const actual=crypto.scryptSync(String(password||''),row.salt,64);const expected=Buffer.from(row.password_hash,'hex');return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);},
 changePassword(currentPassword,newPassword){const row=all('SELECT username,salt,password_hash FROM auth WHERE id=1')[0];if(!row||!this.verifyAuth(row.username,currentPassword))throw Error('Current password is incorrect.');if(String(newPassword||'').length<8)throw Error('New password must contain at least 8 characters.');const salt=crypto.randomBytes(16).toString('hex');const hash=crypto.scryptSync(String(newPassword),salt,64).toString('hex');db.run('UPDATE auth SET salt=?,password_hash=? WHERE id=1',[salt,hash]);persist();},
 snapshot:()=>({menu:all('SELECT * FROM menu ORDER BY category,name'),settings:settings(),invoices:all('SELECT data FROM invoices ORDER BY id DESC').map(r=>JSON.parse(r.data)),draft:JSON.parse(all('SELECT data FROM draft WHERE id=1')[0]?.data||'null')}),
 saveMenu(m){if(!m.name?.trim()||!m.code?.trim()||!m.category?.trim()||!Number.isFinite(m.full)||m.full<=0||(m.half!==null&&(!Number.isFinite(m.half)||m.half<=0)))throw Error('Enter a name, shortcut, category and valid prices.'); const args=[m.name.trim(),m.code.trim().toUpperCase(),m.category.trim(),m.full,m.half,m.active?1:0];if(m.id)db.run('UPDATE menu SET name=?,code=?,category=?,full=?,half=?,active=? WHERE id=?',[...args,m.id]);else db.run('INSERT INTO menu(name,code,category,full,half,active) VALUES(?,?,?,?,?,?)',args);persist();},
 deleteMenu(id){if(!Number.isInteger(id)||!all('SELECT id FROM menu WHERE id=?',[id]).length)throw Error('Menu item not found.');const draftRow=all('SELECT data FROM draft WHERE id=1')[0];db.run('BEGIN');try{db.run('DELETE FROM menu WHERE id=?',[id]);if(draftRow){const draft=JSON.parse(draftRow.data);draft.lines=(draft.lines||[]).filter(l=>l.id!==id);const subtotal=money(draft.lines.reduce((sum,line)=>sum+Number(line.price||0)*Number(line.quantity||0),0));draft.discount=Math.min(Number(draft.discount||0),subtotal);db.run('UPDATE draft SET data=? WHERE id=1',[JSON.stringify(draft)]);}db.run('COMMIT');persist();}catch(e){try{db.run('ROLLBACK');}catch{}throw e;}},
 saveSettings(s){if(!s.restaurant?.trim()||!Number.isFinite(s.taxRate)||s.taxRate<0||s.taxRate>100||![58,80].includes(s.paperWidth)||!Number.isInteger(s.copies)||s.copies<1||s.copies>5||!Number.isInteger(s.invoiceRetentionDays)||s.invoiceRetentionDays<1||s.invoiceRetentionDays>3650||!['INR','USD','EUR','GBP'].includes(s.currency))throw Error('Invalid restaurant, tax, retention period, paper width, copies or currency.');db.run('UPDATE settings SET data=? WHERE id=1',[JSON.stringify(s)]);persist();},
 purgeExpiredInvoices(days=settings().invoiceRetentionDays,now=new Date()){if(!Number.isInteger(days)||days<1||days>3650)throw Error('Invoice retention must be between 1 and 3650 days.');const cutoff=new Date(now.getTime()-days*86400000).toISOString();db.run('DELETE FROM invoices WHERE created < ?',[cutoff]);const deleted=db.getRowsModified();if(deleted)persist();return deleted;},
 saveDraft(d){db.run('INSERT OR REPLACE INTO draft VALUES(1,?)',[JSON.stringify(d)]);persist();},
 checkout(input){const prior=all('SELECT data FROM invoices WHERE token=?',[input.token]);if(prior.length){persist();return JSON.parse(prior[0].data);}
 if(!input.token||!Array.isArray(input.lines)||!input.lines.length||!['Cash','UPI','Card'].includes(input.payment)||!['Dine-in','Takeaway'].includes(input.type))throw Error('Invalid bill or payment method.');
 const lines=input.lines.map(l=>{const m=all('SELECT * FROM menu WHERE id=? AND active=1',[l.id])[0];if(!m||!['full','half'].includes(l.portion)||!Number.isInteger(l.quantity)||l.quantity<1||l.quantity>999||(l.portion==='half'&&m.half===null))throw Error('Invalid item, portion or quantity.');return {id:m.id,name:m.name,portion:l.portion,quantity:l.quantity,price:m[l.portion]};});
 const s=settings();const created=new Date().toISOString();const billDate=localDayKey(created);const dailyNumber=all('SELECT created FROM invoices').filter(row=>localDayKey(row.created)===billDate).length+1;const invoice={...totals(lines,input.discount,s.taxRate),lines,created,billDate,dailyNumber,payment:input.payment,type:input.type,table:String(input.table||'').slice(0,60),customer:String(input.customer||'').slice(0,100),restaurant:{name:s.restaurant,address:s.address,phone:s.phone,gstin:s.gstin,currency:s.currency,footer:s.footer},taxRate:s.taxRate,status:'Paid'};
 db.run('BEGIN');try{db.run('INSERT INTO invoices(token,created,data) VALUES(?,?,?)',[input.token,invoice.created,'{}']);invoice.id=all('SELECT last_insert_rowid() AS id')[0].id;invoice.number=`${billDate.slice(4)}-${String(dailyNumber).padStart(2,'0')}`;db.run('UPDATE invoices SET data=? WHERE id=?',[JSON.stringify(invoice),invoice.id]);db.run('DELETE FROM draft');db.run('COMMIT');persist();return invoice;}catch(e){if(db.getRowsModified!==undefined){try{db.run('ROLLBACK');}catch{}}throw e;}},
 cancelInvoice(id,reason=''){const row=all('SELECT data FROM invoices WHERE id=?',[id])[0];if(!row)throw Error('Invoice not found.');const i=JSON.parse(row.data);if(i.status!=='Paid')throw Error('Only a paid bill can be cancelled.');i.status='Cancelled';i.cancelReason=String(reason||'').trim();i.cancelledAt=new Date().toISOString();db.run('UPDATE invoices SET data=? WHERE id=?',[JSON.stringify(i),id]);persist();},
 backup:()=>Buffer.from(db.export()),close:()=>db.close()
 };
}
module.exports={openStore,totals};

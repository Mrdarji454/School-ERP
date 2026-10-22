// Optional acceptance runner. Requires Playwright outside the application dependency set.
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
process.chdir(fileURLToPath(new URL('../../', import.meta.url)));
await fs.mkdir('.verification/academic', { recursive: true });
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
const vite=spawn(process.execPath,['client/node_modules/vite/bin/vite.js','client','--host','127.0.0.1','--port','5178'],{stdio:['ignore','pipe','inherit']});
process.on('exit',()=>vite.kill());
await new Promise((resolve,reject)=>{vite.stdout.on('data',chunk=>{if(String(chunk).includes('Local:'))resolve();});vite.on('error',reject);});
const browser = await chromium.launch({ ...(process.env.BROWSER_EXECUTABLE_PATH ? { executablePath: process.env.BROWSER_EXECUTABLE_PATH } : {}), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const id = n => String(n).padStart(24, '0');
const year = { _id:id(1), name:'2026–27', isActive:true, isCurrent:true, eligible:true, startDate:'2026-06-01',endDate:'2027-05-31',hasEnrollments:true };
const cls = { _id:id(2), name:'Class 8', academicYear:year, isActive:true, eligible:true, description:'Secondary school',sectionCount:3,studentCount:96 };
const sec = { _id:id(3),name:'Section A', schoolClass:cls,isActive:true,eligible:true,capacity:40 };
const subject={_id:id(4),name:'Mathematics',code:'MATH-08',schoolClass:cls,isActive:true,eligible:true,isOptional:false};
const teacher={_id:id(5),employeeId:'VVS-T001',name:'Meera Shah',user:{fullname:'Meera Shah'},isActive:true,eligible:true};
const period={_id:id(6),name:'Period 1',periodNumber:1,startTime:'08:00',endTime:'08:45',isBreak:false,isActive:true,isScheduled:true,description:''};
const assignment={_id:id(7),academicYear:year,schoolClass:cls,section:sec,subject,teacher,isClassTeacher:true,isActive:true,remarks:'Class 8 A teaching assignment'};
sec.classTeacher=teacher;
const options={years:[year],classes:[{...cls,academicYear:year._id}],sections:[{...sec,schoolClass:cls._id}],subjects:[{...subject,schoolClass:cls._id}],teachers:[teacher]};
const records={'academic-years':[year,{...year,_id:id(11),name:'2025–26',isCurrent:false,hasEnrollments:false},{...year,_id:id(12),name:'2024–25',isActive:false,isCurrent:false}],classes:[cls],sections:[sec],subjects:[subject],periods:[period],'teacher-assignments':[assignment]};
let failSave=false, failDelete=false, failList=false, delaySearch=false, saves=0, checks=0;
const errors=[];
const page=await browser.newPage({viewport:{width:1440,height:1150}});
page.on('pageerror',error=>errors.push(error.message));
await page.addInitScript(()=>localStorage.setItem('token','synthetic-browser-fixture'));
await page.route('**/api/**',async route=>{
 const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api',''),method=req.method();
 if(method==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'http://127.0.0.1:5178','access-control-allow-credentials':'true','access-control-allow-headers':'authorization,content-type'}});
 const respond=(data,status=200)=>route.fulfill({status,headers:{'access-control-allow-origin':'http://127.0.0.1:5178','access-control-allow-credentials':'true'},contentType:'application/json',body:JSON.stringify({success:status<400,...(status<400?{data}:data)})});
 if(path==='/auth/me')return respond({_id:id(99),fullname:'Nisha Patel',role:'Admin',isActive:true});
 if(path==='/workflow/options')return respond({timeZone:'Asia/Kolkata',years:[year],assignments:[],periods:[period]});
 if(path==='/admin-management/options')return respond(options);
 if(path.endsWith('/dependencies'))return respond({sections:{active:3,total:3},students:{active:96,total:96},subjects:{active:8,total:8},assignments:{active:12,total:12}});
 if(path.startsWith('/admin-management/')){
   if(failList){failList=false;return respond({message:'Synthetic list failure'},503);}
   const resource=path.split('/').at(-1);let rows=records[resource]||[];
   const search=url.searchParams.get('search')||'';
   if(delaySearch&&search==='slow')await new Promise(r=>setTimeout(r,800));
   if(search)rows=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
   const status=url.searchParams.get('status');if(status==='active'||status==='inactive')rows=rows.filter(r=>r.isActive===(status==='active'));
   return respond({records:rows,pagination:{total:rows.length,page:1,totalPages:1,limit:10}});
 }
 if(['POST','PUT'].includes(method)){saves++;if(failSave){failSave=false;return respond({message:'A record with this name already exists.'},409);}return respond({...req.postDataJSON(),_id:id(50)},method==='POST'?201:200);}
 if(method==='DELETE'){if(failDelete){failDelete=false;return respond({message:'Synthetic deactivation failure'},409);}return respond({});}
 if(method==='PATCH')return respond({});
 return respond({message:'Unmocked request '+method+' '+path},500);
});
const modules=['academic-years','classes','sections','subjects','periods','teacher-assignments'];
for(const resource of modules){
 await page.goto('http://127.0.0.1:5178/admin/'+resource);
 await page.getByText(/matching (academic years|classes|sections|subjects|periods|teacher assignments)/).waitFor({timeout:8000}).catch(async e=>{console.log({url:page.url(),body:await page.content(),errors});throw e;});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>document.querySelector('.academic-heading .erp-primary')?.disabled===false);
 assert.equal(await page.locator('.academic-desktop-table').isVisible(),true);checks++;
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);checks++;
 const logo=page.locator('.admin-shell > .admin-sidebar .admin-brand img');
 assert.equal(await logo.evaluate(n=>n.complete&&n.naturalWidth>0),true);checks++;
 const geometry=await logo.boundingBox();assert.equal(geometry.width,56);assert.equal(geometry.height,64);checks++;
 await page.screenshot({path:'.verification/academic/'+resource+'-desktop.png',fullPage:true});
 await page.getByRole('button',{name:/^\+ Add/}).click();
 await page.getByRole('button',{name:/^Create/}).waitFor();
 assert.equal(await page.locator('.academic-form').isVisible(),true);checks++;
 await page.getByRole('button',{name:/^Back to/}).click();
 await page.locator('.academic-desktop-table').getByRole('button',{name:'Edit',exact:true}).first().click();
 if(resource==='periods'){
  assert.equal(await page.locator('#management-startTime').getAttribute('readonly'),'');checks++;
  assert.equal(await page.locator('#management-isBreak').inputValue(),'No');checks++;
 }
 if(resource==='academic-years'){assert.equal(await page.locator('#management-startDate').getAttribute('readonly'),'');checks++;}
 if(resource==='teacher-assignments'){assert.equal(await page.locator('#management-teacher').getAttribute('readonly'),'');checks++;}
 await page.screenshot({path:'.verification/academic/'+resource+'-edit.png',fullPage:true});
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.locator('.academic-mobile-records').isVisible(),true);checks++;
 assert.equal(await page.locator('.academic-desktop-table').isVisible(),false);checks++;
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);checks++;
 await page.screenshot({path:'.verification/academic/'+resource+'-mobile.png',fullPage:true});
 await page.getByRole('button',{name:/^Filters/}).click();
 assert.equal(await page.locator('#management-status').isVisible(),true);checks++;
 await page.setViewportSize({width:1440,height:1150});
}
await page.goto('http://127.0.0.1:5178/admin/classes');
await page.getByRole('button',{name:'+ Add class',exact:true}).click();
await page.locator('#management-academicYear').selectOption(year._id);
await page.locator('#management-name').fill('New class');
failSave=true;
await page.getByRole('button',{name:'Create class',exact:true}).click();
await page.getByRole('alert').filter({hasText:'already exists'}).waitFor();
assert.equal(await page.locator('#management-name').inputValue(),'New class');checks++;
await page.getByRole('button',{name:'Create class',exact:true}).click();
await page.locator('.academic-desktop-table').waitFor();checks++;
failDelete=true;
await page.locator('.academic-desktop-table').getByRole('button',{name:'Deactivate',exact:true}).click();
await page.getByRole('dialog').getByRole('button',{name:'Deactivate',exact:true}).click();
await page.getByRole('dialog').getByText('Synthetic deactivation failure').waitFor();
assert.equal(await page.getByRole('dialog').isVisible(),true);checks++;
await page.keyboard.press('Escape');
assert.equal(await page.getByRole('dialog').count(),0);checks++;
assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Deactivate');checks++;
failList=true;await page.getByRole('button',{name:'Refresh',exact:true}).click();
await page.getByRole('heading',{name:'Could not load records'}).waitFor();
await page.getByRole('button',{name:'Retry list'}).click();
await page.locator('.academic-desktop-table').waitFor();checks++;
delaySearch=true;await page.locator('#management-search').fill('slow');await page.locator('#management-search').fill('Class 8');
await page.waitForTimeout(1000);assert.equal(await page.locator('.academic-desktop-table tbody tr').count(),1);checks++;
await page.goto('http://127.0.0.1:5178/admin/academic-years');
await page.getByRole('button',{name:/^\+ Add/}).click();
await page.locator('#management-name').fill('Invalid range');await page.locator('#management-startDate').fill('2027-06-01');await page.locator('#management-endDate').fill('2026-06-01');
const before=saves;await page.getByRole('button',{name:'Create academic year',exact:true}).click();
await page.getByText('End date must be after start date',{exact:true}).waitFor();assert.equal(saves,before);checks++;
assert.deepEqual(errors,[]);
console.log(JSON.stringify({checks,saves,pageErrors:errors,browser:browser.version(),screenshots:18}));
await browser.close();
vite.kill();

import mongoose from 'mongoose';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { demoConfig, connectDemo, manifestCollection, MANIFEST_ID, demoId } from './config.js';
import * as M from './models.js';
import Exam from '../../models/Exam.js';
import Publication from '../../models/ExamPublication.js';
import ReportCard from '../../models/ReportCard.js';
import { EXAM_DEMO_ID } from './extend-exams.js';
import { createProfile } from '../../services/student/studentCore.js';
import { saveExam, examAction, saveMarks } from '../../services/exams.js';
import { issueReportCard, cardBytes } from '../../services/reportCards.js';
import { privatePath } from '../../services/privateStorage.js';
export const REPORT_CARD_DEMO_ID='demo-report-cards-v1';
export async function extendReportCards(config){
 const base=await manifestCollection().findOne({_id:MANIFEST_ID}),exams=await manifestCollection().findOne({_id:EXAM_DEMO_ID});
 if(base?.state!=='complete'||exams?.state!=='complete')throw new Error('Completed base, enrollment and exam demos required');
 let manifest=await manifestCollection().findOne({_id:REPORT_CARD_DEMO_ID});if(manifest?.state==='complete')return manifest;
 const examId=demoId('report-card-extension/long-exam'),email='long-name@report-card-demo.example.test';
 if(!manifest){if(await Exam.exists({_id:examId})||await M.User.exists({email}))throw new Error('Unmanaged report-card demo collision');await manifestCollection().insertOne({_id:REPORT_CARD_DEMO_ID,state:'building',createdAt:new Date()});}
 await ReportCard.createCollection();await ReportCard.createIndexes();
 const admin=await M.User.findById(demoId('admin')),teaching=await M.TeacherAssignment.findById(demoId('enrollment-extension/assignment-A')),profile=await M.Teacher.findById(teaching.teacher),teacher=await M.User.findById(profile.user);
 let account=await M.User.findOne({email}),student=account&&await M.Student.findOne({user:account._id});
 if(!student){student=await createProfile({fullname:'Demo Aarav Narayan Chandrakant Prakash Extended Family Name For Report Card Line Wrapping Verification',email,password:config.password,schoolClass:String(teaching.schoolClass),section:String(teaching.section),rollNumber:900,dob:'2015-01-01',gender:'Other',enrollmentStart:'2026-04-01',enrollmentReason:'Known fictional admission for report-card pagination fixture'},admin);account=await M.User.findById(student.user?._id||student.user);}
 let e=await Exam.findById(examId);
 if(!e){await saveExam(admin,null,{name:'DEMO: Extended component report for pagination and long-name verification',description:'Synthetic multi-page document acceptance fixture.',academicYear:String(teaching.academicYear),sections:[String(teaching.section)],startDate:'2026-10-01',endDate:'2026-10-31',eligibilityDate:'2026-04-01',entryDeadline:'2027-03-30T18:00:00Z',components:Array.from({length:36},(_,order)=>({name:`Component ${String(order+1).padStart(2,'0')} - extended assessment description with wrapped text`,subject:String(teaching.subject),sections:[String(teaching.section)],maximum:20,passMarks:null,evaluators:[String(teacher._id)],order,contributes:true})),policy:{aggregation:'sum',decimals:2,absent:'exclude',exempt:'exclude',passPercent:null,grades:[]}},examId);e=await Exam.findById(examId);}
 const reload=async()=>{e=await Exam.findById(examId);},action=async(action)=>{await examAction(admin,e._id,{action,version:e.revision});await reload();};
 if(!e.capturedAt)await action('capture');if(e.state==='draft')await action('open');
 for(let i=0;i<e.components.length;i++){const c=e.components[i];if(c.state!=='entry')continue;await saveMarks(teacher,e._id,String(c._id),{version:e.revision,action:'submit',entries:e.candidates.map(r=>({candidate:String(r._id),state:i===1?'Absent':i===2?'Exempt':'Scored',score:i===1||i===2?null:i===0?0:12}))},`demo_report_card_v1_${i}`);await reload();}
 if(e.state==='submitted-for-review')await action('approve');if(e.state==='approved')await action('publish');
 const cardIds=[];
 for(const n of [6,7]){
  const publications=await Publication.find({exam:exams.examIds[n]}).sort({version:1}).lean();
  for(const p of publications){for(const r of n===6?p.payload.results:p.payload.results.slice(0,1)){const card=await issueReportCard(admin,{publication:String(p._id),candidate:r._id,remarks:'Explicit synthetic demonstration remarks.',reason:p.version>1?'Synthetic corrected-publication reissue':''});cardIds.push(card._id);}}
 }
 const p=await Publication.findOne({exam:examId,version:1}).lean(),r=p.payload.results.find(r=>String(r.user)===String(account._id));
 const longCard=await issueReportCard(admin,{publication:String(p._id),candidate:r._id,remarks:'Synthetic pagination fixture. '.repeat(35),reason:''});cardIds.push(longCard._id);
 await manifestCollection().updateOne({_id:REPORT_CARD_DEMO_ID},{$set:{state:'complete',completedAt:new Date(),longCard:longCard._id,fixtureIds:{ReportCard:cardIds,Exam:[examId],Student:[student._id],User:[account._id]}}});return manifestCollection().findOne({_id:REPORT_CARD_DEMO_ID});
}
export async function verifyReportCardDemo(){
 const manifest=await manifestCollection().findOne({_id:REPORT_CARD_DEMO_ID});assert.equal(manifest?.state,'complete');
 const rows=await ReportCard.find({_id:{$in:manifest.fixtureIds.ReportCard}}).lean();assert.equal(rows.length,5);
 for(const r of rows){const bytes=await fs.readFile(await privatePath(r.file.key));assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.equal(createHash('sha256').update(bytes).digest('hex'),r.file.sha256);}
 assert.ok(rows.some(r=>r.issueNumber===2&&r.previous));assert.ok(rows.some(r=>r.snapshot.result.marks.some(m=>m.score===0)));assert.ok(rows.some(r=>r.snapshot.result.marks.some(m=>m.state==='Absent')));assert.ok(rows.some(r=>r.snapshot.result.marks.some(m=>m.state==='Exempt')));
 const long=rows.find(r=>String(r._id)===String(manifest.longCard));assert.equal(long.snapshot.result.marks.length,36);assert.ok(long.snapshot.result.name.length>80);
 const transferred=await M.User.findOne({email:'transfer@enrollment-demo.example.test'}),own=rows.find(r=>String(r.user)===String(transferred._id));assert.ok(own);assert.equal((await cardBytes(transferred,own._id)).buffer.length,own.file.size);
 return {cards:rows.length,longCard:manifest.longCard,correctedHistoryRetained:true};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/extend-report-cards.js')){try{const config=demoConfig();await connectDemo(config);if(!process.argv.includes('--verify'))await extendReportCards(config);console.log(JSON.stringify(await verifyReportCardDemo(),null,2));}catch(error){console.error(`Report-card demo failed: ${error.message}. Existing records were not reset.`);process.exitCode=1;}finally{await mongoose.disconnect();}}

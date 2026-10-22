import mongoose from 'mongoose';
import assert from 'node:assert/strict';
import { demoConfig, connectDemo, manifestCollection, MANIFEST_ID, demoId } from './config.js';
import * as M from './models.js';
import Exam from '../../models/Exam.js';
import Schedule from '../../models/ExamSchedule.js';
import Publication from '../../models/ExamPublication.js';
import Write from '../../models/ExamWrite.js';
import Lock from '../../models/ExamScheduleLock.js';
import { saveExam, examAction, saveMarks, saveSchedule, publishedResult } from '../../services/exams.js';
import { ENROLLMENT_DEMO_ID } from './extend-enrollments.js';
export const EXAM_DEMO_ID = 'demo-exams-v1';
export const examModels = [Exam, Schedule, Publication, Write, Lock];
const eid = name => demoId(`enrollment-extension/${name}`);
export async function extendExams() {
 const seed=await manifestCollection().findOne({_id:MANIFEST_ID}), enrollment=await manifestCollection().findOne({_id:ENROLLMENT_DEMO_ID});
 if(seed?.state!=='complete'||enrollment?.state!=='complete')throw new Error('Complete base and enrollment demo extensions first');
 let manifest=await manifestCollection().findOne({_id:EXAM_DEMO_ID});if(manifest?.state==='complete')return manifest;
 if(new Date()>new Date('2027-03-30T18:00:00Z'))throw new Error('This dated synthetic exam fixture needs an explicitly reviewed date revision before seeding');
 const ids=Array.from({length:8},(_,n)=>demoId(`exams-extension/${n}`));
 if(!manifest){if(await Exam.exists({_id:{$in:ids}}))throw new Error('Unmanaged exam fixture collision');manifest={_id:EXAM_DEMO_ID,state:'building',examIds:ids};await manifestCollection().insertOne(manifest);}
 for(const Model of examModels){await Model.createCollection();await Model.createIndexes();}
 const admin=await M.User.findById(demoId('admin')), teaching=await M.TeacherAssignment.findById(eid('assignment-A')), teacherProfile=await M.Teacher.findById(teaching.teacher), teacher=await M.User.findById(teacherProfile.user);
 const titles=['Draft setup','Scheduled sitting','Missing, zero, absent and exempt','Submitted for review','Returned component','Approved, not yet published','Published result with transferred candidate','Reviewed publication correction'];
 for(let n=0;n<8;n++){
  let e=await Exam.findById(ids[n]);
  if(!e){await saveExam(admin,null,{name:`DEMO: ${titles[n]}`,description:'Synthetic exam evidence only. No real student results.',academicYear:String(eid('current')),sections:[String(eid('section-current-A'))],startDate:'2026-10-01',endDate:'2026-10-31',eligibilityDate:'2026-04-01',entryDeadline:'2027-03-30T18:00:00Z',components:['Written','Practical'].map((name,order)=>({name,subject:String(eid('subject')),sections:[String(eid('section-current-A'))],maximum:20,passMarks:null,evaluators:[String(teacher._id)],order,contributes:true})),policy:{aggregation:'sum',decimals:2,absent:'no-total',exempt:'exclude',passPercent:null,grades:[]}},ids[n]);e=await Exam.findById(ids[n]);}
  const reload=async()=>{e=await Exam.findById(ids[n]);};
  const action=async(action,extra={})=>{await examAction(admin,e._id,{action,version:e.revision,...extra});await reload();};
  if(n===0)continue;
  if(!await Schedule.exists({exam:e._id})){await saveSchedule(admin,e._id,{version:e.revision,component:String(e.components[0]._id),sections:[String(eid('section-current-A'))],date:`2026-10-${String(n).padStart(2,'0')}`,startTime:'17:00',endTime:'17:45',room:`Synthetic exam room ${n}`,invigilator:String(teacher._id),active:true});await reload();}
  if(n===1)continue;
  if(!e.capturedAt)await action('capture');
  if(e.unresolved.some(r=>!r.resolution))throw new Error('Demo has unresolved historical candidates; preserve and review manually');
  if(e.state==='draft')await action('open');
  if(n===2){
   if(!e.entries.length){await saveMarks(teacher,e._id,String(e.components[0]._id),{version:e.revision,action:'save',entries:e.candidates.map((c,i)=>({candidate:String(c._id),state:i?'Absent':'Scored',score:i?null:0}))},'demo_exam_v1_missing_first');await reload();}
   if(!e.entries.some(v=>String(v.component)===String(e.components[1]._id)))await saveMarks(teacher,e._id,String(e.components[1]._id),{version:e.revision,action:'save',entries:[{candidate:String(e.candidates[0]._id),state:'Exempt',score:null}]},'demo_exam_v1_missing_second');
   continue;
  }
  for(let k=0;k<2;k++){
   const c=e.components[k];if(!['entry','returned'].includes(c.state))continue;
   // An intentionally returned demo remains returned on an interrupted rerun.
   if(n===4&&c.state==='returned')continue;
   const corrected=n===7&&e.publicationVersion===1;
   await saveMarks(teacher,e._id,String(c._id),{version:e.revision,action:'submit',entries:e.candidates.map((r,i)=>({candidate:String(r._id),state:k===0&&i?'Absent':k===1&&i?'Exempt':'Scored',score:i?null:corrected?5:k===0?0:12}))},`demo_exam_v1_${n}_${k}_${corrected?'corrected':'initial'}`);await reload();
  }
  if(n===3)continue;
  if(n===4){if(e.state==='submitted-for-review')await action('return',{component:String(e.components[0]._id),reason:'Synthetic request to verify written marks'});continue;}
  if(e.state==='submitted-for-review')await action('approve');
  if(n===5)continue;
  if(e.state==='approved')await action('publish');
  if(n===7&&e.publicationVersion===1){await action('correct',{components:[String(e.components[0]._id)],reason:'Synthetic reviewed correction: verified answer sheet'});await saveMarks(teacher,e._id,String(e.components[0]._id),{version:e.revision,action:'submit',entries:[{candidate:String(e.candidates[0]._id),state:'Scored',score:5}]},'demo_exam_v1_7_0_corrected');await reload();await action('approve');await action('publish');}
 }
 const fixtureIds={Exam:ids,ExamSchedule:await Schedule.find({exam:{$in:ids}}).distinct('_id'),ExamPublication:await Publication.find({exam:{$in:ids}}).distinct('_id'),ExamWrite:await Write.find({key:/^demo_exam_v1_/}).distinct('_id')};
 await manifestCollection().updateOne({_id:EXAM_DEMO_ID},{$set:{state:'complete',fixtureIds,completedAt:new Date()}});return manifestCollection().findOne({_id:EXAM_DEMO_ID});
}
export async function verifyExamDemo(){
 const manifest=await manifestCollection().findOne({_id:EXAM_DEMO_ID});assert.equal(manifest?.state,'complete');
 const rows=await Exam.find({_id:{$in:manifest.examIds}}),at=n=>rows.find(r=>String(r._id)===String(manifest.examIds[n]));assert.equal(rows.length,8);
 for(const [n,state] of ['draft','draft','open-for-entry','submitted-for-review','open-for-entry','approved','published','published'].entries())assert.equal(at(n).state,state);
 assert.equal(at(4).components[0].state,'returned');assert.equal(at(7).publicationVersion,2);assert.ok(at(2).entries.some(e=>e.score===0));assert.ok(at(2).entries.some(e=>e.state==='Absent'));assert.ok(at(2).entries.some(e=>e.state==='Exempt'));assert.ok(at(2).entries.length<at(2).candidates.length*2);
 const enrollment=await manifestCollection().findOne({_id:ENROLLMENT_DEMO_ID}),student=await M.Student.findById(enrollment.students.transfer),user=await M.User.findById(student.user),result=await publishedResult(user,at(6)._id,1);
 assert.equal(result.results.length,1);assert.equal(result.results[0].section,String(eid('section-current-A')));assert.equal(String(student.section),String(eid('section-current-B')));
 assert.equal(await Publication.countDocuments({exam:at(7)._id}),2);
 return {exams:8,publications:3,transferredCandidateResultRetained:true,repeatBehavior:'Completed reruns preserve manual edits'};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/extend-exams.js')){
 try{await connectDemo(demoConfig());if(!process.argv.includes('--verify'))await extendExams();console.log(JSON.stringify(await verifyExamDemo(),null,2));}
 catch(error){console.error(`Exam demo failed: ${error.message}. Existing records were not reset.`);process.exitCode=1;}finally{await mongoose.disconnect();}
}

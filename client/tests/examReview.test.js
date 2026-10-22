import test from 'node:test';
import assert from 'node:assert/strict';
import { componentCompletion } from '../src/utils/examReview.js';
test('exam completeness follows captured section and distinguishes zero, missing, absent, exempt and removed candidates', () => {
 const c={_id:'written',sections:['A','B'],maximum:10}, exam={policy:{exempt:'exclude'},candidates:[{_id:'zero',section:'A',active:true},{_id:'absent',section:'A',active:true},{_id:'missing',section:'B',active:true},{_id:'exempt',section:'B',active:true},{_id:'removed',section:'A',active:false}],entries:[{candidate:'zero',component:'written',state:'Scored',score:0},{candidate:'absent',component:'written',state:'Absent',score:null},{candidate:'exempt',component:'written',state:'Exempt',score:null}]};
 assert.deepEqual(componentCompletion(exam,c),{required:4,missing:1});assert.deepEqual(componentCompletion(exam,c,'A'),{required:2,missing:0});assert.deepEqual(componentCompletion(exam,c,'B'),{required:2,missing:1});
 exam.entries[0].score=null;assert.equal(componentCompletion(exam,c,'A').missing,1);exam.policy.exempt='not-allowed';assert.equal(componentCompletion(exam,c,'B').missing,2);
});

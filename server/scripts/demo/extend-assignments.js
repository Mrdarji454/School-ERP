import mongoose from 'mongoose';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { demoConfig, connectDemo, manifestCollection, MANIFEST_ID, demoId } from './config.js';
import * as M from './models.js';
import Assignment from '../../models/Assignment.js';
import Recipient from '../../models/AssignmentRecipient.js';
import Submission from '../../models/AssignmentSubmission.js';
import Evaluation from '../../models/AssignmentEvaluation.js';
import { createAssignment, assignmentAction, assignmentDetail, submitAssignment, evaluateSubmission } from '../../services/assignments.js';
import { privatePath } from '../../services/privateStorage.js';
export const ASSIGNMENT_DEMO_ID = 'demo-assignments-v1';
export const assignmentModels = [Assignment, Recipient, Submission, Evaluation];
export async function extendAssignments() {
  const seed = await manifestCollection().findOne({ _id: MANIFEST_ID });
  if (seed?.state !== 'complete') throw new Error('Completed base demo required');
  let manifest = await manifestCollection().findOne({ _id: ASSIGNMENT_DEMO_ID });
  if (manifest?.state === 'complete') return manifest;
  const fixtureIds = Array.from({ length: 8 }, (_, n) => demoId(`assignments-extension/${n}`));
  const teaching = await M.TeacherAssignment.findById(demoId('assignment/0/0'));
  const teacher = teaching && await M.Teacher.findById(teaching.teacher);
  const author = teacher && await M.User.findById(teacher.user), student = await M.Student.findById(demoId('student/1'));
  const studentUser = student && await M.User.findById(student.user), admin = await M.User.findById(demoId('admin'));
  if (!author?.isActive || !student?.enrollmentManaged || !studentUser?.isActive) throw new Error('Active base teacher/student and established enrollment required');
  const file = { originalname: 'synthetic-assignment-practice.pdf', mimetype: 'application/pdf', buffer: await fs.readFile(new URL('../../../output/pdf/demo-english-paper.pdf', import.meta.url)) };
  if (!manifest) {
    if (await Assignment.exists({ _id: { $in: fixtureIds } })) throw new Error('Unmanaged assignment fixture collision');
    manifest = { _id: ASSIGNMENT_DEMO_ID, state: 'building', assignmentIds: fixtureIds, clock: new Date() };
    await manifestCollection().insertOne(manifest);
  }
  for (const Model of assignmentModels) { await Model.createCollection(); await Model.createIndexes(); }
  const time = offset => new Date(new Date(manifest.clock).getTime() + offset * 3600000).toISOString();
  const titles = ['Draft writing task', 'Scheduled writing task', 'Published task with a genuine zero score', 'Late PDF submission', 'Returned for revision', 'Resubmitted work awaiting review', 'Closed assignment', 'Archived assignment with retained PDF'];
  for (let n = 0; n < fixtureIds.length; n++) {
    let row = await Assignment.findById(fixtureIds[n]);
    if (!row) {
      await createAssignment(author, { title: `DEMO: ${titles[n]}`, instructions: 'Synthetic assignment for testing only. Read the attached original practice sheet and explain your answer in your own words. No real pupil work.', academicYear: String(teaching.academicYear), schoolClass: String(teaching.schoolClass), subject: String(teaching.subject), sections: [String(teaching.section)], publishAt: time(n === 1 ? 168 : -48), dueAt: time(n === 3 ? -1 : n === 1 ? 192 : 72), cutoffAt: time(n === 1 ? 240 : 120), maxMarks: 10, allowResubmission: false }, file, fixtureIds[n]);
      row = await Assignment.findById(fixtureIds[n]);
    }
    if (n === 0) continue;
    if (row.state === 'draft') await assignmentAction(author, row._id, { action: 'publish', version: row.revision });
    if (n === 1) continue;
    const key = `demo_assignment_v1_${n}_first`;
    let first = await Submission.findOne({ user: studentUser._id, idempotencyKey: key });
    if (!first) { const result = await submitAssignment(studentUser, row._id, { text: `Synthetic explanation for scenario ${n}.`, expectedSequence: 0, confirmed: true }, n === 3 || n === 7 ? file : undefined, key); first = await Submission.findById(result.submissionId); }
    const evaluation = await Evaluation.findOne({ submission: first._id });
    if ([2, 4, 5].includes(n) && !evaluation) await evaluateSubmission(author, row._id, first._id, { version: 0, action: n === 2 ? 'publish' : 'return', score: n === 2 ? 0 : null, feedback: n === 2 ? 'Synthetic zero score, distinct from missing work.' : 'Please explain how you reached the answer.' });
    if (n === 5 && !await Submission.exists({ user: studentUser._id, idempotencyKey: 'demo_assignment_v1_5_revision' })) await submitAssignment(studentUser, row._id, { text: 'Synthetic revised explanation. This version has no inherited score.', expectedSequence: 1, confirmed: true }, undefined, 'demo_assignment_v1_5_revision');
    row = await Assignment.findById(row._id);
    if (n === 6 && row.state !== 'closed') await assignmentAction(author, row._id, { action: 'close', version: row.revision, reason: 'Synthetic submission window closed' });
    if (n === 7 && row.state !== 'archived') await assignmentAction(admin, row._id, { action: 'archive', version: row.revision, reason: 'Synthetic retention exercise' });
  }
  const recipientIds = await Recipient.find({ assignment: { $in: fixtureIds } }).distinct('_id');
  const submissionIds = await Submission.find({ assignment: { $in: fixtureIds } }).distinct('_id');
  const evaluationIds = await Evaluation.find({ submission: { $in: submissionIds } }).distinct('_id');
  await manifestCollection().updateOne({ _id: ASSIGNMENT_DEMO_ID }, { $set: { state: 'complete', completedAt: new Date(), fixtureIds: { Assignment: fixtureIds, AssignmentRecipient: recipientIds, AssignmentSubmission: submissionIds, AssignmentEvaluation: evaluationIds } } });
  return manifestCollection().findOne({ _id: ASSIGNMENT_DEMO_ID });
}
export async function verifyAssignmentDemo() {
  const manifest = await manifestCollection().findOne({ _id: ASSIGNMENT_DEMO_ID }); assert.equal(manifest?.state, 'complete');
  const rows = await Assignment.find({ _id: { $in: manifest.assignmentIds } }); assert.equal(rows.length, 8);
  const at = n => rows.find(r => String(r._id) === String(manifest.assignmentIds[n]));
  assert.equal(at(0).state, 'draft'); assert.equal(at(1).state, 'published'); assert.ok(at(1).publishAt > new Date(manifest.clock)); assert.equal(at(6).state, 'closed'); assert.equal(at(7).state, 'archived');
  const student = await M.Student.findById(demoId('student/1')), user = await M.User.findById(student.user);
  assert.equal((await assignmentDetail(user, at(2)._id)).recipients[0].history[0].evaluation.published.score, 0);
  assert.equal((await assignmentDetail(user, at(3)._id)).recipients[0].status, 'Submitted late');
  assert.equal((await assignmentDetail(user, at(4)._id)).recipients[0].status, 'Returned for revision');
  const revision = (await assignmentDetail(user, at(5)._id)).recipients[0]; assert.equal(revision.history.length, 2); assert.equal(revision.history[0].evaluation, null);
  for (const row of [...rows, ...await Submission.find({ assignment: { $in: manifest.assignmentIds } })]) if (row.file) { const bytes = await fs.readFile(await privatePath(row.file.key)); assert.equal(bytes.length, row.file.size); assert.equal(createHash('sha256').update(bytes).digest('hex'), row.file.sha256); }
  return { assignments: rows.length, submissions: await Submission.countDocuments({ assignment: { $in: manifest.assignmentIds } }), evaluations: await Evaluation.countDocuments({ _id: { $in: manifest.fixtureIds.AssignmentEvaluation } }), repeatBehavior: 'Completed reruns preserve manual edits and original timestamps' };
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/extend-assignments.js')) {
  try { await connectDemo(demoConfig()); if (!process.argv.includes('--verify')) await extendAssignments(); console.log(JSON.stringify(await verifyAssignmentDemo(), null, 2)); }
  catch (error) { console.error(`Assignment demo failed: ${error.message}. Existing records were not reset.`); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
}

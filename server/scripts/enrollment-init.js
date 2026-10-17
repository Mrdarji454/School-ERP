// No dotenv or default URI. An operator must intentionally select a database.
import mongoose from 'mongoose';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import EnrollmentTransition from '../models/EnrollmentTransition.js';
import Student from '../models/Student.js';
import { initializationPlan, initializeEnrollments } from '../services/enrollmentInitialization.js';
import { legacyRollIndexes } from '../services/enrollments.js';
const args = process.argv.slice(2), value = key => args[args.indexOf(key) + 1];
try {
  const uri = process.env.ENROLLMENT_DB_URI, name = args.includes('--database') && value('--database'), cutover = args.includes('--cutover') && value('--cutover');
  if (!uri || !name || !cutover || !/^[\w-]+$/.test(name)) throw new Error('Explicit ENROLLMENT_DB_URI, --database and --cutover required');
  if (new URL(uri).searchParams.has('dbName') || decodeURIComponent(new URL(uri).pathname.slice(1)) !== name) throw new Error('URI database and explicit database must match');
  await mongoose.connect(uri, { dbName: name, autoCreate: false, autoIndex: false, serverSelectionTimeoutMS: 10000 });
  const plan = await initializationPlan(cutover);
  if (!args.includes('--apply') && !args.includes('--transition-index')) console.log(JSON.stringify(plan, null, 2));
  else {
    if (!args.includes('--confirm-database') || value('--confirm-database') !== name) throw new Error('Exact database confirmation required');
    if (args.includes('--transition-index')) {
      if (plan.blocked || plan.overlaps.length) throw new Error('Resolve readiness conflicts before index transition');
      await Enrollment.createIndexes(); await EnrollmentTransition.createIndexes();
      for (const index of await legacyRollIndexes()) await Student.collection.dropIndex(index.name);
      console.log('Enrollment indexes created; only the verified legacy scoped-roll unique index removed. No records deleted.');
    }
    if (args.includes('--apply')) {
      const actor = args.includes('--actor') && await User.findOne({ _id: value('--actor'), role: 'Admin', isActive: true });
      if (!actor) throw new Error('An active Admin --actor identifier is required');
      console.log(JSON.stringify(await initializeEnrollments(actor, cutover), null, 2));
    }
  }
} catch (error) { console.error(error.status ? error.message : 'Enrollment operation failed. Check explicit database/cutover/confirmation, readiness and actor. Connection details are not logged.'); process.exitCode = 1; }
finally { await mongoose.disconnect(); }

// Read-only against the dedicated demo DB. Writes workbook files in demo-data only.
import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { demoConfig, connectDemo } from './config.js';
import { profileTemplate, exportPeople, importPeople } from '../../services/peopleWorkbook.js';
import User from '../../models/User.js';
import Student from '../../models/Student.js';
import { populatePeople } from '../../services/people.js';
try {
  await connectDemo(demoConfig());
  process.env.JWT_SECRET ||= 'development-demo-fixture-preview-only';
  const actor = await User.findOne({ email: 'admin@demo.example.test', role: 'Admin' });
  const student = await populatePeople('students', Student.findOne({ admissionNo: 'DVS-S001' }));
  if (!actor || !student) throw new Error('Seed the dedicated demo database first');
  const output = fileURLToPath(new URL('../../../demo-data/', import.meta.url));
  await fs.mkdir(output, { recursive: true });
  for (const kind of ['students', 'teachers']) for (const mode of ['create', 'update']) {
    const key = kind === 'students' ? 'admissionNo' : 'employeeId';
    const book = mode === 'create' ? profileTemplate(kind) : await exportPeople(kind, { [key]: kind === 'students' ? 'DVS-S001' : 'DVS-T001', status: 'all' });
    if (mode === 'create') {
      const sheet = book.worksheets[0], set = (name, value) => { sheet.getRow(2).getCell(sheet.getRow(1).values.indexOf(name)).value = value; };
      set('email', `import-${kind}@demo.example.test`); set('fullname', `Fictional Import ${kind === 'students' ? 'Student' : 'Teacher'}`);
      if (kind === 'students') {
        set('academicYear', student.schoolClass.academicYear.name); set('className', student.schoolClass.name); set('sectionName', student.section.name);
        const last = await Student.findOne({ schoolClass: student.schoolClass._id, section: student.section._id }).sort({ rollNumber: -1 }); set('rollNumber', last.rollNumber + 1);
        set('guardianName', 'Fictional Import Guardian'); set('guardianRelationship', 'Parent'); set('guardianPhone', '0000000000'); set('admissionDate', '2026-04-01');
      } else { set('dob', '1990-01-01'); set('emergencyContact', '0000000000'); }
    }
    const buffer = await book.xlsx.writeBuffer();
    const preview = await importPeople(kind, { originalname: `${kind}.xlsx`, size: buffer.length, buffer }, { mode, phase: 'preview' }, actor);
    if (preview.failed) throw new Error('Demo workbook preview failed; inspect manual changes before regenerating');
    await fs.writeFile(`${output}${kind}-${mode}-example.xlsx`, buffer);
    console.log(`Prepared ${kind}-${mode}-example.xlsx; preview validated; no records imported.`);
  }
} catch { console.error('Demo workbook generation failed. Check the dedicated demo database and its fixture records.'); process.exitCode = 1; }
finally { await mongoose.disconnect(); }

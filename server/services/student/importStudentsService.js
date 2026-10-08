import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";

import User from "../../models/User.js";
import Student from "../../models/Student.js";
import SchoolClass from "../../models/SchoolClass.js";
import Section from "../../models/Section.js";

export const importStudentsService = async (file) => {

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(file.buffer);

    const worksheet = workbook.getWorksheet(1);

    const success = [];
    const failed = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {

        try {

            const row = worksheet.getRow(rowNumber);

            const fullname = row.getCell(1).value?.toString().trim();
            const email = row.getCell(2).value?.toString().trim().toLowerCase();
            const password = row.getCell(3).value?.toString();
            const admissionNo = row.getCell(4).value?.toString().trim();
            const rollNumber = Number(row.getCell(5).value);
            const className = row.getCell(6).value?.toString().trim();
            const sectionName = row.getCell(7).value?.toString().trim();
            const fathername = row.getCell(8).value?.toString().trim();
            const mothername = row.getCell(9).value?.toString().trim();
            const gender = row.getCell(10).value?.toString().trim();
            const dob = row.getCell(11).value;
            const phone = row.getCell(12).value?.toString();
            const address = row.getCell(13).value?.toString();
            const bloodGroup = row.getCell(14).value?.toString();

            if (!fullname || !email || !password || !admissionNo) {
                failed.push({
                    row: rowNumber,
                    reason: "Required fields missing",
                });
                continue;
            }

            const emailExists = await User.findOne({ email });

            if (emailExists) {
                failed.push({
                    row: rowNumber,
                    reason: "Email already exists",
                });
                continue;
            }

            const admissionExists = await Student.findOne({ admissionNo });

            if (admissionExists) {
                failed.push({
                    row: rowNumber,
                    reason: "Admission No already exists",
                });
                continue;
            }
            console.log("Excel Class:", className);
            console.log("Excel Section:", sectionName);
            const schoolClass = await SchoolClass.findOne({
                name: className,
            });

            if (!schoolClass) {
                failed.push({
                    row: rowNumber,
                    reason: `Class '${className}' not found`,
                });
                continue;
            }
            console.log("School Class Found:", schoolClass);
            console.log("SchoolClass ID:", schoolClass._id);

            const allSections = await Section.find();

            console.log(
                "All Sections:",
                allSections.map((s) => ({
                    name: s.name,
                    schoolClass: s.schoolClass.toString(),
                }))
            );

            const section = await Section.findOne({
                name: sectionName.trim().toUpperCase(),
                schoolClass: schoolClass._id,
            });

            console.log("Matched Section:", section);

            if (!section) {
                failed.push({
                    row: rowNumber,
                    reason: `Section '${sectionName}' not found`,
                });
                continue;
            }
            console.log("Section Found:", section);

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await User.create({
                fullname,
                email,
                password: hashedPassword,
                role: "Student",
            });

            await Student.create({
                user: user._id,
                admissionNo,
                rollNumber,
                schoolClass: schoolClass._id,
                section: section._id,
                fathername,
                mothername,
                gender,
                dob,
                phone,
                address,
                bloodGroup,
            });

            success.push({
                row: rowNumber,
                name: fullname,
            });

        } catch (err) {

            failed.push({
                row: rowNumber,
                reason: err.message,
            });

        }
    }

    return {
        imported: success.length,
        failed: failed.length,
        success,
        errors: failed,
    };
};
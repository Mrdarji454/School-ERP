import Student from "../../models/Student.js";
import Teacher from "../../models/Teacher.js";
import SchoolClass from "../../models/SchoolClass.js";
import Subject from "../../models/Subject.js";
import AcademicYear from "../../models/AcademicYear.js";

export const getStatistics = async () => {
    const [
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        currentAcademicYear,
    ] = await Promise.all([
        Student.countDocuments({ isActive: true }),
        Teacher.countDocuments({ isActive: true }),
        SchoolClass.countDocuments({ isActive: true }),
        Subject.countDocuments({ isActive: true }),
        AcademicYear.findOne({
            isCurrent: true,
            isActive: true,
        }).select("name startDate endDate"),
    ]);

    return {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        currentAcademicYear,
    };
};
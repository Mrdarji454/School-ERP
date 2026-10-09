import AcademicYear from "../../models/AcademicYear.js";;

export const getAllAcademicYearService = async (req, res) => {
    const academicYears = await AcademicYear.find({ isActive: true }).sort({ startDate: -1 });
    return academicYears;
}
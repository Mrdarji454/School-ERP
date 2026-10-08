import AcademicYear from "../../models/AcademicYear.js";;

export const getAllAcademicYearService = async (req, res) => {
    console.log("hello");
    const academicYears = await AcademicYear.find({ isActive: true }).sort({ startDate: -1 });
    console.log("hello2");
    return academicYears;
}
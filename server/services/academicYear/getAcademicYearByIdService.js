import AcademicYear from "../../models/AcademicYear.js";

const getAcademicYearByIdService = async (id) => {
    const academicYear = await AcademicYear.findById(id);
    if (!academicYear)
        throw new console.error();

    return academicYear;
};
export default getAcademicYearByIdService;
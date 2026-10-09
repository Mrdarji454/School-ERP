import AcademicYear from "../../models/AcademicYear.js";

const getAcademicYearByIdService = async (id) => {
    const academicYear = await AcademicYear.findById(id);
    if (!academicYear)
        throw Object.assign(new Error("Academic year not found"), { status: 404 });

    return academicYear;
};
export default getAcademicYearByIdService;
import expressAsyncHandler from "express-async-handler";
import { deleteStudentService } from "../../services/student/deleteStudentService.js";


export const deleteStudent = expressAsyncHandler(async (req, res) => {

    const student = await deleteStudentService(req.params.id);


    res.status(200).json({
        success: true,
        message: "student deleted successfully"
    });


});
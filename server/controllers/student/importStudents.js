import expressAsyncHandler from "express-async-handler";
import { importPeople } from '../../services/peopleWorkbook.js';
import { sendResponse } from "../../utils/apiResponse.js";

export const importStudents = expressAsyncHandler(async (req, res) => {
    const result = await importPeople('students', req.file, req.body, req.user);

    sendResponse(
        res,
        200,
        "Students imported successfully",
        result
    );
});

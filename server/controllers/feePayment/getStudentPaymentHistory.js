import { listPayments } from "../paymentHandlers.js";
export const getStudentPaymentHistory = listPayments("fee");
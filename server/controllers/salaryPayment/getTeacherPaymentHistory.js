import { listPayments } from "../paymentHandlers.js";
export const getTeacherPaymentHistory = listPayments("salary");
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierInputSchema = void 0;
const zod_1 = require("zod");
exports.supplierInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    phone: zod_1.z.string().min(1, "Phone is required"),
    where: zod_1.z.string().optional(),
    notes: zod_1.z.string().min(1, "Notes are required"),
});

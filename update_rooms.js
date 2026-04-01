"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var categories = [
    { name: 'Standard', basePrice: 5000 },
    { name: 'Family Room', basePrice: 8000 },
    { name: 'Executive Suite Room', basePrice: 15000 },
    { name: 'Deluxe Room', basePrice: 10000 }
];
// Re-map simple "Standard" naming convention to match exactly
var rooms = [
    { roomNumber: '201', type: 'Family Room', floor: 1 },
    { roomNumber: '202', type: 'Family Room', floor: 1 },
    { roomNumber: '203', type: 'Executive Suite Room', floor: 1 },
    { roomNumber: '204', type: 'Executive Suite Room', floor: 1 },
    { roomNumber: '205', type: 'Deluxe Room', floor: 1 },
    { roomNumber: '206', type: 'Deluxe Room', floor: 1 },
    { roomNumber: '207', type: 'Deluxe Room', floor: 1 },
    { roomNumber: '208', type: 'Deluxe Room', floor: 1 },
    { roomNumber: '209', type: 'Executive Suite Room', floor: 1 },
    { roomNumber: '210', type: 'Executive Suite Room', floor: 1 },
    { roomNumber: '211', type: 'Family Room', floor: 1 },
    { roomNumber: '212', type: 'Standard Room', floor: 1 },
    { roomNumber: '301', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '302', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '303', type: 'Executive Suite Room', floor: 2 },
    { roomNumber: '304', type: 'Executive Suite Room', floor: 2 },
    { roomNumber: '305', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '306', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '307', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '308', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '309', type: 'Executive Suite Room', floor: 2 },
    { roomNumber: '310', type: 'Executive Suite Room', floor: 2 },
    { roomNumber: '311', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '312', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '101', type: 'Standard Room', floor: 0 },
    { roomNumber: '102', type: 'Family Room', floor: 0 },
    { roomNumber: '103', type: 'Executive Suite Room', floor: 0 },
    { roomNumber: '104', type: 'Executive Suite Room', floor: 0 },
    { roomNumber: '105', type: 'Deluxe Room', floor: 0 },
    { roomNumber: '106', type: 'Deluxe Room', floor: 0 },
    { roomNumber: '107', type: 'Deluxe Room', floor: 0 },
    { roomNumber: '108', type: 'Deluxe Room', floor: 0 },
    { roomNumber: '109', type: 'Standard Room', floor: 0 },
    { roomNumber: '110', type: 'Standard Room', floor: 0 },
];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var catMap, _i, categories_1, c, fallbackName, cat, oldRooms, newRoomNumbers, _a, oldRooms_1, oldRoom, e_1, _b, rooms_1, r, categoryId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('Ensuring categories exist...');
                    catMap = new Map();
                    _i = 0, categories_1 = categories;
                    _c.label = 1;
                case 1:
                    if (!(_i < categories_1.length)) return [3 /*break*/, 4];
                    c = categories_1[_i];
                    fallbackName = c.name === 'Standard' ? 'Standard Room' : c.name;
                    return [4 /*yield*/, prisma.roomCategory.upsert({
                            where: { name: fallbackName },
                            update: {},
                            create: { name: fallbackName, basePrice: c.basePrice },
                        })];
                case 2:
                    cat = _c.sent();
                    catMap.set(fallbackName, cat.id);
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log('Cleaning up obsolete rooms...');
                    return [4 /*yield*/, prisma.room.findMany()];
                case 5:
                    oldRooms = _c.sent();
                    newRoomNumbers = rooms.map(function (r) { return r.roomNumber; });
                    _a = 0, oldRooms_1 = oldRooms;
                    _c.label = 6;
                case 6:
                    if (!(_a < oldRooms_1.length)) return [3 /*break*/, 12];
                    oldRoom = oldRooms_1[_a];
                    if (!(!newRoomNumbers.includes(oldRoom.roomNumber) && !oldRoom.roomNumber.startsWith('ARCHIVED-'))) return [3 /*break*/, 11];
                    _c.label = 7;
                case 7:
                    _c.trys.push([7, 9, , 11]);
                    return [4 /*yield*/, prisma.room.delete({ where: { id: oldRoom.id } })];
                case 8:
                    _c.sent();
                    console.log("Deleted obsolete room ".concat(oldRoom.roomNumber));
                    return [3 /*break*/, 11];
                case 9:
                    e_1 = _c.sent();
                    return [4 /*yield*/, prisma.room.update({
                            where: { id: oldRoom.id },
                            data: { roomNumber: "ARCHIVED-".concat(oldRoom.roomNumber), status: 'MAINTENANCE' }
                        })];
                case 10:
                    _c.sent();
                    console.log("Archived obsolete room ".concat(oldRoom.roomNumber, " due to constraints"));
                    return [3 /*break*/, 11];
                case 11:
                    _a++;
                    return [3 /*break*/, 6];
                case 12:
                    console.log('Upserting the 34 rooms...');
                    _b = 0, rooms_1 = rooms;
                    _c.label = 13;
                case 13:
                    if (!(_b < rooms_1.length)) return [3 /*break*/, 16];
                    r = rooms_1[_b];
                    categoryId = catMap.get(r.type);
                    if (!categoryId) {
                        throw new Error("Missing category mapping for ".concat(r.type));
                    }
                    return [4 /*yield*/, prisma.room.upsert({
                            where: { roomNumber: r.roomNumber },
                            update: { categoryId: categoryId, floor: r.floor },
                            create: { roomNumber: r.roomNumber, categoryId: categoryId, floor: r.floor, status: 'AVAILABLE' }
                        })];
                case 14:
                    _c.sent();
                    _c.label = 15;
                case 15:
                    _b++;
                    return [3 /*break*/, 13];
                case 16:
                    console.log('Successfully configured 34 rooms!');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error).finally(function () { return prisma.$disconnect(); });

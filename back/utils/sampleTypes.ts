export type Root = Root2[];

export interface Root2 {
	accident_json: AccidentJson;
}

export interface RelationType {
	id: number;
	name: string;
}

export interface Attachment {
	fileName: string;
	fileSuffix: string;
}

export interface LicenceType extends RelationType {}

export interface Driver {
	sex: RelationType;
	lastName: string;
	firstName: string;
	injuryType: RelationType;
	licenceType: LicenceType;
	nationalCode: string;
	licenceNumber?: string;
	totalReason?: RelationType;
}

export interface PassengerDto {
	sex: RelationType;
	lastName: string;
	firstName: string;
	injuryType: RelationType;
	faultStatus: RelationType;
	totalReason?: RelationType;
	nationalCode: string;
}

export interface VehicleDto {
	color: RelationType;
	driver: Driver;
	system: RelationType;
	plaqueNo?: string[];
	plaqueType: RelationType;
	systemType: RelationType;
	faultStatus: RelationType;
	insuranceCo: RelationType;
	insuranceNo?: string;
	plaqueUsage: RelationType;
	printNumber?: string;
	plaqueSerial?: string[];
	insuranceDate: string;
	bodyInsuranceCo: RelationType;
	bodyInsuranceNo?: string;
	motionDirection: RelationType;
	bodyInsuranceDate: string;
	maxDamageSections: RelationType[];
	damageSectionOther?: string;
	insuranceWarrantyLimit: number;
	passengerDTOS?: PassengerDto[];
}

export interface PedestrianDto {
	sex: RelationType;
	lastName: string;
	firstName: string;
	injuryType: RelationType;
	faultStatus: RelationType;
	totalReason?: RelationType;
	nationalCode: string;
}

export interface AccidentJson {
	road: RelationType;
	seri: string;
	type: RelationType;
	officer: string;
	position: RelationType;
	province: RelationType;
	serialNO: number;
	township: RelationType;
	deadCount: number;
	xPosition: number;
	yPosition: number;
	areaUsages: RelationType[];
	hasWitness?: boolean;
	newsNumber: string;
	rulingType: RelationType;
	airStatuses: RelationType[];
	attachments: Attachment[];
	lightStatus: RelationType;
	roadDefects: RelationType[];
	vehicleDTOS?: VehicleDto[];
	accidentDate: string;
	base64Images?: string[];
	humanReasons: RelationType[];
	injuredCount: number;
	collisionType: RelationType;
	roadSituation: RelationType;
	completionDate: string;
	roadRepairType: RelationType;
	shoulderStatus: RelationType;
	vehicleReasons: RelationType[];
	equipmentDamages: RelationType[];
	roadSurfaceConditions: RelationType[];
	pedestrianDTOS?: PedestrianDto[];
}

// export interface RelationType {
// 	id: number;
// 	name: string;
// }
// export interface Attachment {
// 	fileName: string;
// 	fileSuffix: string;
// }

// export interface VehicleDtos {
// 	color: RelationType;
// 	driver: Driver;
// 	system: RelationType;
// 	plaqueNo?: string[];
// 	plaqueType: PlaqueType;
// 	systemType: RelationType;
// 	faultStatus: RelationType;
// 	insuranceCo: RelationType;
// 	insuranceNo: string;
// 	plaqueUsage: RelationType;
// 	printNumber: string;
// 	plaqueSerial?: string[];
// 	insuranceDate: string;
// 	bodyInsuranceCo: RelationType;
// 	bodyInsuranceNo?: string;
// 	motionDirection: RelationType;
// 	bodyInsuranceDate: string;
// 	maxDamageSections: RelationType[];
// 	damageSectionOther?: string;
// 	insuranceWarrantyLimit: number;
// 	passengerDTOS?: PassengerDtos[];
// }

// export interface Driver {
// 	sex: RelationType;
// 	lastName: string;
// 	firstName: string;
// 	injuryType: RelationType;
// 	licenceType: LicenceType;
// 	nationalCode: string;
// 	licenceNumber?: string;
// 	totalReason?: RelationType;
// }

// export interface PassengerDtos {
// 	sex: RelationType;
// 	lastName: string;
// 	firstName: string;
// 	injuryType: RelationType;
// 	faultStatus: RelationType;
// 	totalReason: RelationType;
// 	nationalCode: string;
// }

// export interface PedestrianDtos {
// 	sex: RelationType;
// 	lastName: string;
// 	firstName: string;
// 	injuryType: RelationType;
// 	faultStatus: RelationType;
// 	totalReason: RelationType;
// 	nationalCode: string;
// }

// export enum LicenceType {
// 	MOTORCYCLE = "motorcycle", // گواهینامه موتور سیکلت
// 	GRADE_THREE = "grade_three", // گواهینامه پایه سوم
// 	GRADE_TWO = "grade_two", // گواهینامه پایه دوم
// 	GRADE_ONE = "grade_one", // گواهینامه پایه اول
// 	SPECIAL = "special", // گواهینامه ویژه
// }

// export enum PlaqueType {
// 	PRIVATE = "private", // شخصی
// 	TAXI = "taxi", // تاکسی
// 	PUBLIC_TRANSPORT = "public", // عمومی (اتوبوس، مینی‌بوس)
// 	GOVERNMENT = "government", // دولتی
// 	POLICE = "police", // انتظامی
// 	DIPLOMATIC = "diplomatic", // سیاسی
// 	TEMPORARY = "temporary", // گذرموقت
// 	MILITARY = "military", // نظامی
// 	FREE_ZONE = "free_zone", // منطقه آزاد
// 	ORGANIZATION = "organization", // پلاک سازمانی
// }

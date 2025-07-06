import {
	type ActFn,
	type Document,
	Infer,
	object,
	ObjectId,
	TInsertRelations,
	type WithId,
} from "@deps";
import { MyContext } from "../../../utils/context.ts";
import {
	accident,
	air_status,
	area_usage,
	body_insurance_co,
	city,
	collision_type,
	color,
	coreApp,
	equipment_damage,
	fault_status,
	file,
	human_reason,
	insurance_co,
	licence_type,
	light_status,
	max_damage_section,
	motion_direction,
	plaque_type,
	plaque_usage,
	position,
	province,
	road,
	road_defect,
	road_repair_type,
	road_situation,
	road_surface_condition,
	ruling_type,
	shoulder_status,
	system,
	system_type,
	type,
	vehicle_reason,
} from "../../../mod.ts";
import { AccidentJson } from "../../../utils/sampleTypes.ts";
import { accident_pure, accident_relations } from "@model";
import { normalizePersianText } from "../../../utils/normalizePersianText.ts";

export const seedFn: ActFn = async (body) => {
	const { set: { fileID } } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	// const readJSON: { accident_json: string }[] = JSON.parse(
	// 	await Deno.readTextFile("./uploads/json/sample.json"),
	// );

	// --- 1. Read and Parse GeoJSON File ---
	const foundedJSONFile = await file.findOne({
		filters: { _id: new ObjectId(fileID as string) },
		projection: { name: 1 },
	});
	if (!foundedJSONFile) throw new Error(`JSONFile ${fileID} not found.`);

	const fileContent = await Deno.readTextFile(
		`./uploads/json/${foundedJSONFile.name}`,
	);
	const readJSON: { accident_json: string }[] = JSON.parse(fileContent);

	const modelMap = {
		position,
		road,
		province,
		city,
		type,
		ruling_type,
		light_status,
		collision_type,
		road_situation,
		road_repair_type,
		shoulder_status,
		area_usage,
		air_status,
		road_defect,
		human_reason,
		vehicle_reason,
		equipment_damage,
		road_surface_condition,
		color,
		system,
		plaque_type,
		system_type,
		fault_status,
		insurance_co,
		plaque_usage,
		body_insurance_co,
		motion_direction,
		max_damage_section,
		licence_type,
	};

	// Cache for findOrCreate results to avoid duplicate database queries
	const relationCache = new Map<string, WithId<Document>>();

	const findOrCreate = async (
		name: string,
		modelName: keyof typeof modelMap,
		userId: ObjectId,
	): Promise<WithId<Document>> => {
		// Validate input
		if (!isValidString(name)) {
			throw new Error(`Invalid name provided for ${modelName}: ${name}`);
		}

		const normalizedName = normalizePersianText(name).toLowerCase();
		const cacheKey = `${modelName}:${normalizedName}`;

		// Check cache first
		if (relationCache.has(cacheKey)) {
			return relationCache.get(cacheKey)!;
		}

		const model = modelMap[modelName];

		// Use case-insensitive search to avoid duplicates
		const found = await model.findOne({
			filters: {
				name: {
					$regex: new RegExp(
						`^${
							normalizedName.replace(
								/[.*+?^${}()|[\]\\]/g,
								"\\$&",
							)
						}$`,
						"i",
					),
				},
			},
			projection: { name: 1, _id: 1 },
		});

		if (found) {
			relationCache.set(cacheKey, found);
			return found;
		} else {
			// Double-check cache again before creating (race condition protection)
			if (relationCache.has(cacheKey)) {
				return relationCache.get(cacheKey)!;
			}

			try {
				const created = await model.insertOne({
					doc: {
						name: normalizedName,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
					relations: { registrer: { _ids: userId } },
					projection: { name: 1, _id: 1 },
				});
				if (created) {
					relationCache.set(cacheKey, created);
					return created;
				} else {
					throw new Error(
						`can not create or find this model ${modelName}`,
					);
				}
			} catch (error) {
				// If creation fails due to duplicate, try to find it again with case-insensitive search
				const foundAfterError = await model.findOne({
					filters: {
						name: {
							$regex: new RegExp(
								`^${
									normalizedName.replace(
										/[.*+?^${}()|[\]\\]/g,
										"\\$&",
									)
								}$`,
								"i",
							),
						},
					},
					projection: { name: 1, _id: 1 },
				});
				if (foundAfterError) {
					relationCache.set(cacheKey, foundAfterError);
					return foundAfterError;
				}
				console.error(
					`Error creating ${modelName} with name "${normalizedName}":`,
					error,
				);
				throw error;
			}
		}
	};

	const normalizeRelations = async (
		item: any,
		modelName: keyof typeof modelMap,
		userId: ObjectId,
	) => {
		if (
			!item || !item.name || typeof item.name !== "string" ||
			item.name.trim().length === 0
		) return null;
		try {
			return await findOrCreate(item.name, modelName, userId);
		} catch (error) {
			console.error(
				`Failed to normalize relation ${modelName} with name ${item.name}:`,
				error,
			);
			return null;
		}
	};

	const normalizeArrayRelations = async (
		items: any[] = [],
		modelName: keyof typeof modelMap,
		userId: ObjectId,
	) => {
		return Promise.all(
			items.map((item) => normalizeRelations(item, modelName, userId)),
		);
	};

	// Validation helper functions
	const isValidCoordinate = (coord: any): boolean => {
		return coord !== null && coord !== undefined &&
			typeof coord === "number" &&
			!isNaN(coord) &&
			isFinite(coord);
	};

	const isValidString = (str: any): boolean => {
		return str !== null && str !== undefined &&
			typeof str === "string" &&
			str.trim().length > 0;
	};

	const validateAccidentData = (
		accident: AccidentJson,
	): { isValid: boolean; errors: string[] } => {
		const errors: string[] = [];

		// Only validate coordinates - this was the main issue causing the geo error
		if (!isValidCoordinate(accident.xPosition)) {
			errors.push("Invalid or missing X coordinate");
		}
		if (!isValidCoordinate(accident.yPosition)) {
			errors.push("Invalid or missing Y coordinate");
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	};

	// Process records in batches for better performance
	const BATCH_SIZE = 1; // Reduced to 1 to prevent race conditions and duplicate records
	const userId = user._id;
	const startTime = Date.now();

	// Initialize counters
	let invalidCoordinatesCount = 0;
	let validCoordinatesCount = 0;

	const processAccidentRecord = async (
		element: { accident_json: string },
	) => {
		try {
			const parsedAccident: AccidentJson = JSON.parse(
				element.accident_json,
			);

			// Validate accident data
			const validation = validateAccidentData(parsedAccident);
			if (!validation.isValid) {
				invalidCoordinatesCount++;
				console.log(
					`Skipping accident with serial ${
						parsedAccident.serialNO || "unknown"
					} due to validation errors:`,
					validation.errors,
				);
				return;
			}

			validCoordinatesCount++;

			const pureAccident = object(accident_pure);

			const accidentDoc: Partial<Infer<typeof pureAccident>> = {
				seri: Number(parsedAccident.seri) || 0,
				serial: parsedAccident.serialNO || 0,
				officer: parsedAccident.officer
					? normalizePersianText(parsedAccident.officer)
					: "",
				dead_count: parsedAccident.deadCount || 0,
				has_witness: parsedAccident.hasWitness ?? false,
				news_number: Number(parsedAccident.newsNumber) || 0,
				location: {
					type: "Point",
					coordinates: [
						parsedAccident.xPosition,
						parsedAccident.yPosition,
					],
				},
				date_of_accident: new Date(parsedAccident.accidentDate),
				completion_date: new Date(parsedAccident.completionDate),
				injured_count: parsedAccident.injuredCount || 0,
				vehicle_dtos: [],
				pedestrian_dtos: [],
			};

			const accidentRelations: TInsertRelations<
				typeof accident_relations
			> = {};

			// Process all relations in parallel for better performance
			const relationPromises = [];

			// Single relations
			if (parsedAccident.province) {
				relationPromises.push(
					normalizeRelations(
						parsedAccident.province,
						"province",
						userId,
					).then((normalized) => {
						if (normalized) {
							accidentRelations.province = {
								_ids: normalized._id,
								relatedRelations: { accidents: true },
							};
						}
					}),
				);
			}

			if (parsedAccident.township) {
				relationPromises.push(
					normalizeRelations(parsedAccident.township, "city", userId)
						.then((normalized) => {
							if (normalized) {
								accidentRelations.city = {
									_ids: normalized._id,
									relatedRelations: { accidents: true },
								};
							}
						}),
				);
			}

			if (parsedAccident.road) {
				relationPromises.push(
					normalizeRelations(parsedAccident.road, "road", userId)
						.then((normalized) => {
							if (normalized) {
								accidentRelations.road = {
									_ids: normalized._id,
									relatedRelations: { accidents: true },
								};
							}
						}),
				);
			}

			if (parsedAccident.type) {
				relationPromises.push(
					normalizeRelations(parsedAccident.type, "type", userId)
						.then((normalized) => {
							if (normalized) {
								accidentRelations.type = {
									_ids: normalized._id,
									relatedRelations: { accidents: true },
								};
							}
						}),
				);
			}

			if (parsedAccident.position) {
				relationPromises.push(
					normalizeRelations(
						parsedAccident.position,
						"position",
						userId,
					).then((normalized) => {
						if (normalized) {
							accidentRelations.position = {
								_ids: normalized._id,
								relatedRelations: { accidents: true },
							};
						}
					}),
				);
			}

			if (parsedAccident.rulingType) {
				relationPromises.push(
					normalizeRelations(
						parsedAccident.rulingType,
						"ruling_type",
						userId,
					).then((normalized) => {
						if (normalized) {
							accidentRelations.ruling_type = {
								_ids: normalized._id,
								relatedRelations: { accidents: true },
							};
						}
					}),
				);
			}

			if (parsedAccident.lightStatus) {
				relationPromises.push(
					normalizeRelations(
						parsedAccident.lightStatus,
						"light_status",
						userId,
					).then((normalized) => {
						if (normalized) {
							accidentRelations.light_status = {
								_ids: normalized._id,
								relatedRelations: { accidents: true },
							};
						}
					}),
				);
			}

			if (parsedAccident.collisionType) {
				relationPromises.push(
					normalizeRelations(
						parsedAccident.collisionType,
						"collision_type",
						userId,
					).then((normalized) => {
						if (normalized) {
							accidentRelations.collision_type = {
								_ids: normalized._id,
								relatedRelations: { accidents: true },
							};
						}
					}),
				);
			}

			if (parsedAccident.roadSituation) {
				relationPromises.push(
					normalizeRelations(
						parsedAccident.roadSituation,
						"road_situation",
						userId,
					).then((normalized) => {
						if (normalized) {
							accidentRelations.road_situation = {
								_ids: normalized._id,
								relatedRelations: { accidents: true },
							};
						}
					}),
				);
			}

			if (parsedAccident.roadRepairType) {
				relationPromises.push(
					normalizeRelations(
						parsedAccident.roadRepairType,
						"road_repair_type",
						userId,
					).then((normalized) => {
						if (normalized) {
							accidentRelations.road_repair_type = {
								_ids: normalized._id,
								relatedRelations: { accidents: true },
							};
						}
					}),
				);
			}

			if (parsedAccident.shoulderStatus) {
				relationPromises.push(
					normalizeRelations(
						parsedAccident.shoulderStatus,
						"shoulder_status",
						userId,
					).then((normalized) => {
						if (normalized) {
							accidentRelations.shoulder_status = {
								_ids: normalized._id,
								relatedRelations: { accidents: true },
							};
						}
					}),
				);
			}

			// Array relations
			if (parsedAccident.areaUsages) {
				relationPromises.push(
					normalizeArrayRelations(
						parsedAccident.areaUsages,
						"area_usage",
						userId,
					).then((normalized) => {
						accidentRelations.area_usages = {
							_ids: normalized.map((item) => item!._id),
							relatedRelations: { accidents: true },
						};
					}),
				);
			}

			if (parsedAccident.airStatuses) {
				relationPromises.push(
					normalizeArrayRelations(
						parsedAccident.airStatuses,
						"air_status",
						userId,
					).then((normalized) => {
						accidentRelations.air_statuses = {
							_ids: normalized.map((item) => item!._id),
							relatedRelations: { accidents: true },
						};
					}),
				);
			}

			if (parsedAccident.roadDefects) {
				relationPromises.push(
					normalizeArrayRelations(
						parsedAccident.roadDefects,
						"road_defect",
						userId,
					).then((normalized) => {
						accidentRelations.road_defects = {
							_ids: normalized.map((item) => item!._id),
							relatedRelations: { accidents: true },
						};
					}),
				);
			}

			if (parsedAccident.humanReasons) {
				relationPromises.push(
					normalizeArrayRelations(
						parsedAccident.humanReasons,
						"human_reason",
						userId,
					).then((normalized) => {
						accidentRelations.human_reasons = {
							_ids: normalized.map((item) => item!._id),
							relatedRelations: { accidents: true },
						};
					}),
				);
			}

			if (parsedAccident.vehicleReasons) {
				relationPromises.push(
					normalizeArrayRelations(
						parsedAccident.vehicleReasons,
						"vehicle_reason",
						userId,
					).then((normalized) => {
						accidentRelations.vehicle_reasons = {
							_ids: normalized.map((item) => item!._id),
							relatedRelations: { accidents: true },
						};
					}),
				);
			}

			if (parsedAccident.equipmentDamages) {
				relationPromises.push(
					normalizeArrayRelations(
						parsedAccident.equipmentDamages,
						"equipment_damage",
						userId,
					).then((normalized) => {
						accidentRelations.equipment_damages = {
							_ids: normalized.map((item) => item!._id),
							relatedRelations: { accidents: true },
						};
					}),
				);
			}

			if (parsedAccident.roadSurfaceConditions) {
				relationPromises.push(
					normalizeArrayRelations(
						parsedAccident.roadSurfaceConditions,
						"road_surface_condition",
						userId,
					).then((normalized) => {
						accidentRelations.road_surface_conditions = {
							_ids: normalized.map((item) => item!._id),
							relatedRelations: { accidents: true },
						};
					}),
				);
			}

			// Wait for all relations to be processed
			await Promise.all(relationPromises);

			// attachments (input: accident.attachments):
			// if (accident.attachments) {
			//     const normalizedAttachments = await normalizeArrayRelations(accident.attachments, "file", userId);
			//     accidentRelations.attachments = {
			//         _ids: normalizedAttachments.map(item => item!._id),
			//     };
			// }

			// Optional: handle vehicleDTOS
			if (parsedAccident.vehicleDTOS?.length) {
				const vehicleResults = await Promise.all(
					parsedAccident.vehicleDTOS.filter((v) => v && v.driver).map(
						async (v) => {
							// Basic validation for vehicle data
							if (!v.driver) {
								console.warn(
									`Skipping vehicle with no driver data for accident ${
										parsedAccident.serialNO || "unknown"
									}`,
								);
								return null;
							}

							try {
								return {
									plaque_no: v.plaqueNo?.map((p) =>
										p ? normalizePersianText(p) : p
									),
									plaque_serial: v.plaqueSerial?.map((p) =>
										p ? normalizePersianText(p) : p
									),
									print_number: v.printNumber
										? normalizePersianText(v.printNumber)
										: v.printNumber,
									insurance_no: v.insuranceNo
										? normalizePersianText(v.insuranceNo)
										: v.insuranceNo,
									body_insurance_no: v.bodyInsuranceNo
										? normalizePersianText(
											v.bodyInsuranceNo,
										)
										: v.bodyInsuranceNo,
									damage_section_other: v.damageSectionOther
										? normalizePersianText(
											v.damageSectionOther,
										)
										: v.damageSectionOther,
									insurance_date: new Date(v.insuranceDate),
									body_insurance_date: new Date(
										v.bodyInsuranceDate,
									),
									insurance_warranty_limit:
										v.insuranceWarrantyLimit || 0,
									color: await normalizeRelations(
										v.color,
										"color",
										userId,
									),
									system: await normalizeRelations(
										v.system,
										"system",
										userId,
									),
									plaque_type: await normalizeRelations(
										v.plaqueType,
										"plaque_type",
										userId,
									),
									system_type: await normalizeRelations(
										v.systemType,
										"system_type",
										userId,
									),
									fault_status: await normalizeRelations(
										v.faultStatus,
										"fault_status",
										userId,
									),
									insurance_co: await normalizeRelations(
										v.insuranceCo,
										"insurance_co",
										userId,
									),
									plaque_usage: await normalizeRelations(
										v.plaqueUsage,
										"plaque_usage",
										userId,
									),
									body_insurance_co: await normalizeRelations(
										v.bodyInsuranceCo,
										"body_insurance_co",
										userId,
									),
									motion_direction: await normalizeRelations(
										v.motionDirection,
										"motion_direction",
										userId,
									),
									max_damage_sections:
										await normalizeArrayRelations(
											v.maxDamageSections,
											"max_damage_section",
											userId,
										),
									driver: {
										first_name: v.driver.firstName
											? normalizePersianText(
												v.driver.firstName,
											)
											: "",
										last_name: v.driver.lastName
											? normalizePersianText(
												v.driver.lastName,
											)
											: "",
										national_code: v.driver.nationalCode
											? normalizePersianText(
												v.driver.nationalCode,
											)
											: "",
										licence_number: v.driver.licenceNumber
											? normalizePersianText(
												v.driver.licenceNumber,
											)
											: v.driver.licenceNumber,
										sex: v.driver.sex
											? (
												v.driver.sex.name === "مرد"
													? "Male"
													: v.driver.sex.name === "زن"
													? "Female"
													: "Other"
											)
											: "Other",
										licence_type: await normalizeRelations(
											v.driver.licenceType,
											"licence_type",
											userId,
										),
										injury_type: await normalizeRelations(
											v.driver.injuryType,
											"max_damage_section",
											userId,
										),
										total_reason: await normalizeRelations(
											v.driver.totalReason,
											"human_reason",
											userId,
										),
									},
									passenger_dtos: v.passengerDTOS?.length
										? await Promise.all(
											v.passengerDTOS.map(async (p) => ({
												first_name:
													normalizePersianText(
														p.firstName,
													),
												last_name: normalizePersianText(
													p.lastName,
												),
												national_code:
													normalizePersianText(
														p.nationalCode,
													),
												sex: p.sex
													? (
														p.sex.name === "مرد"
															? "Male"
															: p.sex.name ===
																	"زن"
															? "Female"
															: "Other"
													)
													: "Other",
												injury_type:
													await normalizeRelations(
														p.injuryType,
														"max_damage_section",
														userId,
													),
												fault_status:
													await normalizeRelations(
														p.faultStatus,
														"fault_status",
														userId,
													),
												total_reason:
													await normalizeRelations(
														p.totalReason,
														"human_reason",
														userId,
													),
											})),
										)
										: [],
								};
							} catch (error) {
								console.error(
									`Error processing vehicle data for accident ${
										parsedAccident.serialNO || "unknown"
									}:`,
									error,
								);
								return null;
							}
						},
					),
				);
				accidentDoc.vehicle_dtos = vehicleResults.filter((v) =>
					v !== null
				) as any;
			}

			// Optional: handle pedestrianDTOS
			if (parsedAccident.pedestrianDTOS?.length) {
				const pedestrianResults = await Promise.all(
					parsedAccident.pedestrianDTOS.filter((p) =>
						p && p.firstName && p.lastName
					).map(async (p) => ({
						first_name: normalizePersianText(p.firstName),
						last_name: normalizePersianText(p.lastName),
						national_code: normalizePersianText(p.nationalCode),
						sex: p.sex
							? (
								p.sex.name === "مرد"
									? "Male"
									: p.sex.name === "زن"
									? "Female"
									: "Other"
							)
							: "Other",
						injury_type: await normalizeRelations(
							p.injuryType,
							"max_damage_section",
							userId,
						),
						fault_status: await normalizeRelations(
							p.faultStatus,
							"fault_status",
							userId,
						),
						total_reason: await normalizeRelations(
							p.totalReason,
							"human_reason",
							userId,
						),
					})),
				);
				accidentDoc.pedestrian_dtos = pedestrianResults as any;
			}

			try {
				await accident.insertOne({
					doc: accidentDoc,
					relations: accidentRelations,
					projection: { _id: 1 },
				});
			} catch (error) {
				console.error(
					`Failed to insert accident with serial ${
						parsedAccident.serialNO || "unknown"
					}:`,
					error,
				);
				// Don't throw error, just log it to continue processing other records
				return;
			}
		} catch (parseError) {
			console.error(`Failed to parse accident JSON:`, parseError);
			return;
		}
	};

	// Process records sequentially to prevent race conditions and duplicates
	let processedCount = 0;
	let skippedCount = 0;
	let totalRecords = readJSON.length;

	console.log(
		`Starting to process ${totalRecords} accident records sequentially...`,
	);

	for (let i = 0; i < readJSON.length; i++) {
		const recordStartTime = Date.now();

		try {
			await processAccidentRecord(readJSON[i]);
			processedCount++;
		} catch (error) {
			skippedCount++;
			console.error(`Failed to process record ${i + 1}: ${error}`);
		}

		const recordEndTime = Date.now();
		const recordTime = recordEndTime - recordStartTime;
		const progress = ((processedCount + skippedCount) / totalRecords * 100)
			.toFixed(1);

		// Log progress every 100 records
		if ((i + 1) % 100 === 0 || i === readJSON.length - 1) {
			console.log(
				`Progress: ${progress}% - Record ${
					i + 1
				}/${totalRecords} completed in ${recordTime}ms - Processed: ${processedCount}, Skipped: ${skippedCount}, Invalid coords: ${invalidCoordinatesCount}`,
			);
		}

		// Add small delay to prevent overwhelming the database
		if (i < readJSON.length - 1) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
	}

	const endTime = Date.now();
	const totalTime = endTime - startTime;
	const avgTimePerRecord = totalTime / totalRecords;

	console.log(`\n=== SEEDING COMPLETED ===`);
	console.log(`Total records processed: ${processedCount}`);
	console.log(`Total records skipped: ${skippedCount}`);
	console.log(`Records with valid coordinates: ${validCoordinatesCount}`);
	console.log(`Records with invalid coordinates: ${invalidCoordinatesCount}`);
	console.log(
		`Coordinate validation success rate: ${
			((validCoordinatesCount / totalRecords) * 100).toFixed(1)
		}%`,
	);
	console.log(`Total time: ${(totalTime / 1000).toFixed(2)} seconds`);
	console.log(`Average time per record: ${avgTimePerRecord.toFixed(2)}ms`);
	console.log(
		`Records per second: ${
			(processedCount / (totalTime / 1000)).toFixed(2)
		}`,
	);
	console.log(`=========================\n`);

	return { ok: true };
};

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
import { myRedis } from "../../../mod.ts";
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

	// Read file information to determine size and choose appropriate approach
	const filePath = `./uploads/json/${foundedJSONFile.name}`;
	const fileInfo = await Deno.stat(filePath);

	// Check if the file is too large (> 490MB) and throw an error if so
	const MAX_FILE_SIZE = 490 * 1024 * 1024; // 490MB in bytes
	if (fileInfo.size > MAX_FILE_SIZE) {
		throw new Error(
			`File size ${fileInfo.size} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (490MB). Please split the file into smaller chunks.`,
		);
	}

	let readJSON: { accident_json: string }[];

	const content = await Deno.readTextFile(filePath);
	readJSON = JSON.parse(content);

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

	// Global cache for most frequently used entities to reduce Redis pressure
	const globalEntityCache = new Map<string, WithId<Document>>();
	const frequentlyUsedEntities = new Set<string>();

	// Performance monitoring for cache operations
	let redisHits = 0;
	let redisMisses = 0;
	let dbQueries = 0;
	let recordsCreated = 0;
	let globalCacheHits = 0;

	// Relation statistics
	let relationSuccesses = 0;
	let relationFailures = 0;

	// Helper function to handle Redis errors gracefully
	const safeRedisOperation = async <T>(
		operation: () => Promise<T>,
		fallback: T,
		operationName: string,
	): Promise<T> => {
		try {
			return await operation();
		} catch (error) {
			console.warn(
				`Redis ${operationName} failed, using fallback:`,
				error,
			);
			return fallback;
		}
	};

	// Check Redis connection health
	const checkRedisConnection = async (): Promise<boolean> => {
		try {
			await myRedis.ping();
			return true;
		} catch (error) {
			console.warn("Redis connection issue detected:", error);
			return false;
		}
	};

	// Retry mechanism with exponential backoff and timeout
	const retryWithBackoff = async <T>(
		operation: () => Promise<T>,
		maxRetries: number = 5,
		baseDelay: number = 100,
		timeoutMs: number = 15000,
	): Promise<T> => {
		const startTime = Date.now();

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			// Check if we've exceeded the total timeout
			if (Date.now() - startTime > timeoutMs) {
				throw new Error(`Operation timeout after ${timeoutMs}ms`);
			}

			try {
				return await operation();
			} catch (error) {
				if (attempt === maxRetries - 1) {
					// Only log final failures occasionally to reduce noise
					if (Math.random() < 0.2) {
						console.warn(
							`Failed after ${maxRetries} attempts: ${
								(error as Error).message
							}`,
						);
					}
					throw error;
				}

				const delay = Math.min(
					baseDelay * Math.pow(2, attempt) + Math.random() * 100,
					2000,
				);
				// Only log every 10th retry to reduce noise
				if (Math.random() < 0.1) {
					console.log(
						`Retry attempt ${
							attempt + 1
						}/${maxRetries} after ${delay}ms for: ${
							(error as Error).message
						}`,
					);
				}
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
		throw new Error("Max retries exceeded");
	};

	const findOrCreate = async (
		name: string,
		modelName: keyof typeof modelMap,
		userId: ObjectId,
		additionalRelations?: Record<string, any>,
	): Promise<WithId<Document>> => {
		// Validate input
		if (!isValidString(name)) {
			throw new Error(`Invalid name provided for ${modelName}: ${name}`);
		}

		const normalizedName = normalizePersianText(name).toLowerCase();
		const cacheKey = `${modelName}:${normalizedName}`;
		const redisCacheKey = `seed_cache:${cacheKey}`;
		const redisLockKey = `seed_lock:${cacheKey}`;

		// Check in-memory cache first (fastest)
		if (relationCache.has(cacheKey)) {
			return relationCache.get(cacheKey)!;
		}

		// Check global entity cache for frequently used items
		if (globalEntityCache.has(cacheKey)) {
			const cachedItem = globalEntityCache.get(cacheKey)!;
			relationCache.set(cacheKey, cachedItem);
			globalCacheHits++;
			return cachedItem;
		}

		// Check Redis cache
		const redisResult = await safeRedisOperation(
			async () => await myRedis.get(redisCacheKey),
			null,
			`cache read for ${cacheKey}`,
		);

		if (redisResult) {
			try {
				const cachedItem = JSON.parse(redisResult);
				// Convert back to ObjectId
				cachedItem._id = new ObjectId(cachedItem._id);
				relationCache.set(cacheKey, cachedItem);
				redisHits++;
				return cachedItem;
			} catch (parseError) {
				console.warn(
					`Failed to parse cached item for ${cacheKey}:`,
					parseError,
				);
			}
		} else {
			redisMisses++;
		}

		const model = modelMap[modelName];

		// Use case-insensitive search to avoid duplicates
		dbQueries++;
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
			// Cache in memory and global cache
			relationCache.set(cacheKey, found);

			// Track frequently used entities and cache them globally
			if (frequentlyUsedEntities.has(cacheKey) || Math.random() < 0.1) {
				globalEntityCache.set(cacheKey, found);
				frequentlyUsedEntities.add(cacheKey);
			}

			await safeRedisOperation(
				async () =>
					await myRedis.set(
						redisCacheKey,
						JSON.stringify({
							_id: found._id.toString(),
							name: (found as any).name,
						}),
						{ ex: 3600 },
					),
				null,
				`cache write for ${cacheKey}`,
			);
			return found;
		} else {
			// Use Redis-based locking with retry mechanism to prevent duplicates during parallel processing
			return await retryWithBackoff(
				async () => {
					// Try to acquire lock with 5 second expiration (reduced for faster recovery)
					const lockAcquired = await safeRedisOperation(
						async () =>
							await myRedis.set(redisLockKey, "1", {
								nx: true,
								ex: 5,
							}),
						null,
						"lock acquisition",
					);

					if (lockAcquired === "OK") {
						try {
							// Double-check if someone else created it while we were waiting
							const doubleCheckFound = await model.findOne({
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

							if (doubleCheckFound) {
								// Someone else created it, use their result
								relationCache.set(cacheKey, doubleCheckFound);
								try {
									await myRedis.set(
										redisCacheKey,
										JSON.stringify({
											_id: doubleCheckFound._id
												.toString(),
											name: doubleCheckFound.name,
										}),
										{ ex: 3600 },
									);
								} catch (redisError) {
									console.warn(
										`Redis cache write error for ${cacheKey}:`,
										redisError,
									);
								}
								return doubleCheckFound;
							}

							// Create the new record
							recordsCreated++;
							const created = await model.insertOne({
								doc: {
									name: normalizedName,
									createdAt: new Date(),
									updatedAt: new Date(),
								},
								relations: {
									registrer: { _ids: userId },
									...additionalRelations,
								},
								projection: { name: 1, _id: 1 },
							});

							if (created) {
								relationCache.set(cacheKey, created);

								// Cache newly created entities globally if they might be frequently used
								if (Math.random() < 0.2) {
									globalEntityCache.set(cacheKey, created);
									frequentlyUsedEntities.add(cacheKey);
								}

								await safeRedisOperation(
									async () =>
										await myRedis.set(
											redisCacheKey,
											JSON.stringify({
												_id: created._id.toString(),
												name: (created as any).name,
											}),
											{ ex: 3600 },
										),
									null,
									`cache write for new record ${cacheKey}`,
								);
								return created;
							} else {
								throw new Error(
									`can not create or find this model ${modelName}`,
								);
							}
						} finally {
							// Always release the lock
							await safeRedisOperation(
								async () => await myRedis.del(redisLockKey),
								null,
								"lock release",
							);
						}
					} else {
						// Lock acquisition failed, throw error to trigger retry mechanism
						throw new Error(
							`Lock acquisition failed for ${modelName} with name "${normalizedName}"`,
						);
					}
				},
				6,
				100,
				10000,
			); // 6 retries with 100ms base delay, 10 second timeout
		}
	};

	const normalizeRelations = async (
		item: any,
		modelName: keyof typeof modelMap,
		userId: ObjectId,
		additionalRelations?: Record<string, any>,
	) => {
		if (
			!item || !item.name || typeof item.name !== "string" ||
			item.name.trim().length === 0
		) return null;
		try {
			const result = await findOrCreate(
				item.name,
				modelName,
				userId,
				additionalRelations,
			);
			relationSuccesses++;
			return result;
		} catch (error) {
			relationFailures++;
			// Only log every 20th failure to reduce noise
			if (Math.random() < 0.05) {
				console.warn(
					`Failed to normalize relation ${modelName} with name "${item.name}":`,
					(error as Error).message,
				);
			}
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

	// Pre-populate Redis cache with existing entities to avoid database lookups
	const warmUpCache = async () => {
		const redisConnected = await checkRedisConnection();
		if (!redisConnected) {
			console.warn("Redis not available, skipping cache warmup");
			return;
		}

		console.log("Warming up Redis cache with existing entities...");
		const warmupStartTime = Date.now();
		let totalCachedItems = 0;

		for (const [modelName, model] of Object.entries(modelMap)) {
			try {
				// Get all existing records for this model
				const existingRecords = await model.find({
					filters: {},
					projection: { name: 1, _id: 1 },
				})
					.limit(10000) // Reasonable limit to avoid memory issues
					.toArray();

				// Cache each record in Redis
				for (const record of existingRecords) {
					const normalizedName = normalizePersianText(record.name)
						.toLowerCase();
					const redisCacheKey =
						`seed_cache:${modelName}:${normalizedName}`;

					const success = await safeRedisOperation(
						async () => {
							await myRedis.set(
								redisCacheKey,
								JSON.stringify({
									_id: record._id.toString(),
									name: record.name,
								}),
								{ ex: 3600 },
							);
							return true;
						},
						false,
						`cache warmup for ${modelName} record`,
					);

					if (success) {
						totalCachedItems++;
					}
				}

				console.log(
					`Cached ${existingRecords.length} existing ${modelName} records`,
				);
			} catch (error) {
				console.warn(
					`Failed to warm up cache for ${modelName}:`,
					error,
				);
			}
		}

		const warmupEndTime = Date.now();
		console.log(
			`Cache warmup completed in ${
				warmupEndTime - warmupStartTime
			}ms. Cached ${totalCachedItems} total items.`,
		);
	};

	// Initialize Redis cache cleanup and warmup
	console.log("Initializing seed process with Redis cache...");
	await warmUpCache();

	// Process records in batches for better performance
	const BATCH_SIZE = 50; // Reduced further for easier debugging
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
			// Process province first, then city (city needs province relation)
			let provinceId: ObjectId | undefined;

			if (parsedAccident.province) {
				const provinceNormalized = await normalizeRelations(
					parsedAccident.province,
					"province",
					userId,
				);
				if (provinceNormalized && provinceNormalized._id) {
					provinceId = provinceNormalized._id;
					accidentRelations.province = {
						_ids: provinceId,
						relatedRelations: { accidents: true },
					};
				}
			}

			if (parsedAccident.township) {
				// Pass province relation when creating city
				const cityRelations = provinceId
					? {
						province: {
							_ids: provinceId,
							relatedRelations: { cities: true },
						},
					}
					: undefined;

				const cityNormalized = await normalizeRelations(
					parsedAccident.township,
					"city",
					userId,
					cityRelations,
				);
				if (cityNormalized && cityNormalized._id) {
					accidentRelations.city = {
						_ids: cityNormalized._id,
						relatedRelations: { accidents: true },
					};
				}
			}

			// Continue with other relations in parallel
			if (parsedAccident.road) {
				relationPromises.push(
					normalizeRelations(parsedAccident.road, "road", userId)
						.then((normalized) => {
							if (normalized && normalized._id) {
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
							if (normalized && normalized._id) {
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
						if (normalized && normalized._id) {
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
						if (normalized && normalized._id) {
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
						if (normalized && normalized._id) {
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
						if (normalized && normalized._id) {
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
						if (normalized && normalized._id) {
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
						if (normalized && normalized._id) {
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
						if (normalized && normalized._id) {
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
						const validIds = normalized.filter((item) =>
							item && item._id
						).map((item) => item!._id);
						if (validIds.length > 0) {
							accidentRelations.area_usages = {
								_ids: validIds,
								relatedRelations: { accidents: true },
							};
						}
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
						const validIds = normalized.filter((item) =>
							item && item._id
						).map((item) => item!._id);
						if (validIds.length > 0) {
							accidentRelations.air_statuses = {
								_ids: validIds,
								relatedRelations: { accidents: true },
							};
						}
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
						const validIds = normalized.filter((item) =>
							item && item._id
						).map((item) => item!._id);
						if (validIds.length > 0) {
							accidentRelations.road_defects = {
								_ids: validIds,
								relatedRelations: { accidents: true },
							};
						}
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
						const validIds = normalized.filter((item) =>
							item && item._id
						).map((item) => item!._id);
						if (validIds.length > 0) {
							accidentRelations.human_reasons = {
								_ids: validIds,
								relatedRelations: { accidents: true },
							};
						}
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
						const validIds = normalized.filter((item) =>
							item && item._id
						).map((item) => item!._id);
						if (validIds.length > 0) {
							accidentRelations.vehicle_reasons = {
								_ids: validIds,
								relatedRelations: { accidents: true },
							};
						}
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
						const validIds = normalized.filter((item) =>
							item && item._id
						).map((item) => item!._id);
						if (validIds.length > 0) {
							accidentRelations.equipment_damages = {
								_ids: validIds,
								relatedRelations: { accidents: true },
							};
						}
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
						const validIds = normalized.filter((item) =>
							item && item._id
						).map((item) => item!._id);
						if (validIds.length > 0) {
							accidentRelations.road_surface_conditions = {
								_ids: validIds,
								relatedRelations: { accidents: true },
							};
						}
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
									color: v.color
										? await normalizeRelations(
											v.color,
											"color",
											userId,
										)
										: null,
									system: v.system
										? await normalizeRelations(
											v.system,
											"system",
											userId,
										)
										: null,
									plaque_type: v.plaqueType
										? await normalizeRelations(
											v.plaqueType,
											"plaque_type",
											userId,
										)
										: null,
									system_type: v.systemType
										? await normalizeRelations(
											v.systemType,
											"system_type",
											userId,
										)
										: null,
									fault_status: v.faultStatus
										? await normalizeRelations(
											v.faultStatus,
											"fault_status",
											userId,
										)
										: null,
									insurance_co: v.insuranceCo
										? await normalizeRelations(
											v.insuranceCo,
											"insurance_co",
											userId,
										)
										: null,
									plaque_usage: v.plaqueUsage
										? await normalizeRelations(
											v.plaqueUsage,
											"plaque_usage",
											userId,
										)
										: null,
									body_insurance_co: v.bodyInsuranceCo
										? await normalizeRelations(
											v.bodyInsuranceCo,
											"body_insurance_co",
											userId,
										)
										: null,
									motion_direction: v.motionDirection
										? await normalizeRelations(
											v.motionDirection,
											"motion_direction",
											userId,
										)
										: null,
									max_damage_sections: v.maxDamageSections
										? (await normalizeArrayRelations(
											v.maxDamageSections,
											"max_damage_section",
											userId,
										)).filter((item) => item && item._id)
										: [],
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
										licence_type: v.driver.licenceType
											? await normalizeRelations(
												v.driver.licenceType,
												"licence_type",
												userId,
											)
											: null,
										injury_type: v.driver.injuryType
											? await normalizeRelations(
												v.driver.injuryType,
												"max_damage_section",
												userId,
											)
											: null,
										total_reason: v.driver.totalReason
											? await normalizeRelations(
												v.driver.totalReason,
												"human_reason",
												userId,
											)
											: null,
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
												injury_type: p.injuryType
													? await normalizeRelations(
														p.injuryType,
														"max_damage_section",
														userId,
													)
													: null,
												fault_status: p.faultStatus
													? await normalizeRelations(
														p.faultStatus,
														"fault_status",
														userId,
													)
													: null,
												total_reason: p.totalReason
													? await normalizeRelations(
														p.totalReason,
														"human_reason",
														userId,
													)
													: null,
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
						injury_type: p.injuryType
							? await normalizeRelations(
								p.injuryType,
								"max_damage_section",
								userId,
							)
							: null,
						fault_status: p.faultStatus
							? await normalizeRelations(
								p.faultStatus,
								"fault_status",
								userId,
							)
							: null,
						total_reason: p.totalReason
							? await normalizeRelations(
								p.totalReason,
								"human_reason",
								userId,
							)
							: null,
					})),
				);
				accidentDoc.pedestrian_dtos = pedestrianResults as any;
			}

			try {
				// Basic validation for critical relations like province
				if (
					accidentRelations.province &&
					typeof accidentRelations.province._ids === "string"
				) {
					try {
						const provinceId = new ObjectId(
							accidentRelations.province._ids,
						);
						const provinceExists = await province.findOne({
							filters: { _id: provinceId },
							projection: { _id: 1 },
						});

						if (!provinceExists) {
							console.warn(
								`Province with ID ${accidentRelations.province._ids} not found in database for accident ${parsedAccident.serialNO}`,
							);
							delete accidentRelations.province;
						}
					} catch (e) {
						console.warn(
							`Invalid province ObjectId ${
								accidentRelations.province!._ids
							} for accident ${parsedAccident.serialNO}`,
						);
						delete accidentRelations.province;
					}
				}

				// Validate ObjectId format for other relations
				const invalidRelations = [];

				for (
					const [key, relation] of Object.entries(accidentRelations)
				) {
					if (!relation || !relation._ids) {
						invalidRelations.push(key);
						continue;
					}

					// Check ObjectId format for single relations
					if (typeof relation._ids === "string") {
						try {
							new ObjectId(relation._ids);
						} catch (e) {
							invalidRelations.push(key);
						}
					} // Check ObjectId format for array relations
					else if (Array.isArray(relation._ids)) {
						try {
							const validIds = relation._ids.filter((id) => {
								try {
									new ObjectId(id);
									return true;
								} catch {
									return false;
								}
							});
							if (validIds.length === 0) {
								invalidRelations.push(key);
							} else if (
								validIds.length !== relation._ids.length
							) {
								relation._ids = validIds;
							}
						} catch (e) {
							invalidRelations.push(key);
						}
					}
				}

				// Remove invalid relations
				invalidRelations.forEach((key) => {
					delete (accidentRelations as any)[key];
				});

				await accident.insertOne({
					doc: accidentDoc,
					relations: accidentRelations,
					projection: { _id: 1 },
				});
			} catch (error) {
				// Only log every 10th error to reduce noise
				if (Math.random() < 0.1) {
					console.error(
						`Failed to insert accident with serial ${
							parsedAccident.serialNO || "unknown"
						}:`,
						(error as Error).message,
					);
				}
				// Don't throw error, just log it to continue processing other records
				return;
			}
		} catch (parseError) {
			console.error(`Failed to parse accident JSON:`, parseError);
			return;
		}
	};

	// Process records in batches for better performance
	let processedCount = 0;
	let skippedCount = 0;
	let totalRecords = 0; // We'll count as we go since we can't know the total in advance with streaming

	console.log(
		`Starting to process accident records in batches of ${BATCH_SIZE}...`,
	);
	console.log(
		`Redis-based entity caching enabled with lock timeout and retry mechanism.`,
	);

	// Reset counters for the actual processing
	processedCount = 0;
	skippedCount = 0;
	totalRecords = readJSON.length;

	for (let i = 0; i < readJSON.length; i += BATCH_SIZE) {
		const batchStartTime = Date.now();
		const batch = readJSON.slice(i, i + BATCH_SIZE);

		const batchPromises = batch.map(async (record, index) => {
			try {
				await processAccidentRecord(record);
				return { success: true, index: i + index };
			} catch (error) {
				console.error(
					`Failed to process record ${i + index + 1}: ${error}`,
				);
				return { success: false, index: i + index, error };
			}
		});

		const batchResults = await Promise.all(batchPromises);

		const batchProcessed = batchResults.filter((r) => r.success).length;
		const batchSkipped = batchResults.filter((r) => !r.success).length;

		processedCount += batchProcessed;
		skippedCount += batchSkipped;

		const batchEndTime = Date.now();
		const batchTime = batchEndTime - batchStartTime;
		const progress = ((processedCount + skippedCount) / totalRecords * 100)
			.toFixed(1);

		// Log progress after each batch
		// Only log progress every 5th batch to reduce noise
		if (
			(Math.floor(i / BATCH_SIZE) + 1) % 5 === 0 ||
			i + BATCH_SIZE >= totalRecords
		) {
			console.log(
				`Progress: ${progress}% - Batch ${
					Math.floor(i / BATCH_SIZE) + 1
				} (records ${i + 1}-${
					Math.min(i + BATCH_SIZE, totalRecords)
				}) completed in ${batchTime}ms - Processed: ${batchProcessed}, Skipped: ${batchSkipped}, Total processed: ${processedCount}, Total skipped: ${skippedCount}, Invalid coords: ${invalidCoordinatesCount}`,
			);
			console.log(
				`Cache stats: Global cache hits: ${globalCacheHits}, Redis hits: ${redisHits}, misses: ${redisMisses}, DB queries: ${dbQueries}, records created: ${recordsCreated}`,
			);
			console.log(
				`Relation stats: Successes: ${relationSuccesses}, Failures: ${relationFailures}, Success rate: ${
					((relationSuccesses /
						(relationSuccesses + relationFailures)) * 100).toFixed(
							1,
						)
				}%`,
			);
		}

		// Add small delay between batches to prevent overwhelming the database
		if (i + BATCH_SIZE < readJSON.length) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		// Clear in-memory cache periodically to prevent memory leaks (keep global cache)
		if ((Math.floor(i / BATCH_SIZE) + 1) % 20 === 0) {
			console.log("Clearing in-memory cache to prevent memory leaks...");
			relationCache.clear();
			console.log(
				`Global entity cache size: ${globalEntityCache.size}, Frequently used entities: ${frequentlyUsedEntities.size}`,
			);
		}
	}

	const endTime = Date.now();
	const totalTime = endTime - startTime;
	const avgTimePerRecord = totalRecords > 0 ? totalTime / totalRecords : 0;

	console.log(`\n=== SEEDING COMPLETED ===`);
	console.log(`Total records processed: ${processedCount}`);
	console.log(`Total records skipped: ${skippedCount}`);
	console.log(`Records with valid coordinates: ${validCoordinatesCount}`);
	console.log(`Records with invalid coordinates: ${invalidCoordinatesCount}`);
	console.log(
		`Coordinate validation success rate: ${
			totalRecords > 0
				? ((validCoordinatesCount / totalRecords) * 100).toFixed(1)
				: "0.0"
		}%`,
	);
	console.log(`Total time: ${(totalTime / 1000).toFixed(2)} seconds`);
	console.log(`Average time per record: ${avgTimePerRecord.toFixed(2)}ms`);
	console.log(
		`Records per second: ${
			totalTime > 0
				? (processedCount / (totalTime / 1000)).toFixed(2)
				: "0.00"
		}`,
	);

	// Performance statistics
	const cacheHitRate = ((redisHits / (redisHits + redisMisses)) * 100)
		.toFixed(1);
	console.log(`\n=== CACHE PERFORMANCE ===`);
	console.log(`Global cache hits: ${globalCacheHits}`);
	console.log(`Redis cache hits: ${redisHits}`);
	console.log(`Redis cache misses: ${redisMisses}`);
	console.log(`Cache hit rate: ${cacheHitRate}%`);
	console.log(`Database queries: ${dbQueries}`);
	console.log(`New records created: ${recordsCreated}`);
	console.log(`In-memory cache size: ${relationCache.size} items`);
	console.log(`Global entity cache size: ${globalEntityCache.size} items`);
	console.log(
		`Frequently used entities: ${frequentlyUsedEntities.size} types`,
	);
	console.log(`\n=== RELATION PERFORMANCE ===`);
	console.log(`Relation successes: ${relationSuccesses}`);
	console.log(`Relation failures: ${relationFailures}`);
	console.log(
		`Relation success rate: ${
			((relationSuccesses / (relationSuccesses + relationFailures)) * 100)
				.toFixed(1)
		}%`,
	);

	// Cleanup function to clear Redis cache entries after seeding
	const cleanupCache = async () => {
		console.log("Cleaning up Redis cache entries...");
		const keys = await safeRedisOperation(
			async () => await myRedis.keys("seed_cache:*"),
			[],
			"cache cleanup key lookup",
		);

		if (keys.length > 0) {
			await safeRedisOperation(
				async () => await myRedis.del(...keys),
				null,
				"cache cleanup deletion",
			);
			console.log(`Cleaned up ${keys.length} Redis cache entries`);
		}

		// Also cleanup any remaining lock keys
		const lockKeys = await safeRedisOperation(
			async () => await myRedis.keys("seed_lock:*"),
			[],
			"lock cleanup key lookup",
		);

		if (lockKeys.length > 0) {
			await safeRedisOperation(
				async () => await myRedis.del(...lockKeys),
				null,
				"lock cleanup deletion",
			);
			console.log(`Cleaned up ${lockKeys.length} Redis lock entries`);
		}
	};

	// Cleanup cache entries at the end
	await cleanupCache();

	console.log(`Redis cache cleaned up after seeding process`);
	console.log(`=========================\n`);

	return { ok: true };
};

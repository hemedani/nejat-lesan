import {
	type ActFn,
	type Document,
	Infer,
	object,
	type ObjectId,
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

export const seedFn: ActFn = async () => {
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const readJSON: { accident_json: string }[] = JSON.parse(
		await Deno.readTextFile("./uploads/json/sample.json"),
	);

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

	const findOrCreate = async (
		name: string,
		modelName: keyof typeof modelMap,
		userId: ObjectId,
	): Promise<WithId<Document>> => {
		const model = modelMap[modelName];
		const found = await model.findOne({
			filters: { name },
			projection: { name: 1, _id: 1 },
		});
		if (found) {
			return found;
		} else {
			const created = await model.insertOne({
				doc: { name, createdAt: new Date(), updatedAt: new Date() },
				relations: { registrer: { _ids: userId } },
				projection: { name: 1, _id: 1 },
			});
			if (created) {
				return created;
			} else {
				throw new Error(
					`can not create or find this model ${modelName}`,
				);
			}
		}
	};

	const normalizeRelations = async (
		item: any,
		modelName: keyof typeof modelMap,
		userId: ObjectId,
	) => {
		if (!item || !item.name) return null;
		return await findOrCreate(item.name, modelName, userId);
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

	for await (const element of readJSON) {
		const parsedAccident: AccidentJson = JSON.parse(element.accident_json);
		const userId = user._id;

		const pureAccident = object(accident_pure);

		const accidentDoc: Partial<Infer<typeof pureAccident>> = {
			seri: Number(parsedAccident.seri),
			serial: parsedAccident.serialNO,
			officer: parsedAccident.officer,
			dead_count: parsedAccident.deadCount,
			has_witness: parsedAccident.hasWitness ?? false,
			news_number: Number(parsedAccident.newsNumber),
			location: {
				type: "Point",
				coordinates: [
					parsedAccident.xPosition,
					parsedAccident.yPosition,
				],
			},
			date_of_accident: new Date(parsedAccident.accidentDate),
			completion_date: new Date(parsedAccident.completionDate),
			injured_count: parsedAccident.injuredCount,
			vehicle_dtos: [],
			pedestrian_dtos: [],
		};

		/// gemini code start
		//
		//
		//
		//

		const accidentRelations: TInsertRelations<typeof accident_relations> =
			{};

		// Process all relations as optional

		// province:
		if (parsedAccident.province) {
			const normalized = await normalizeRelations(
				parsedAccident.province,
				"province",
				userId,
			);
			accidentRelations.province = {
				_ids: normalized!._id,
				relatedRelations: { accidents: true },
			};
		}

		// city (input: accident.township):
		if (parsedAccident.township) {
			const normalized = await normalizeRelations(
				parsedAccident.township,
				"city",
				userId,
			);
			accidentRelations.city = {
				_ids: normalized!._id,
				relatedRelations: { accidents: true },
			};
		}

		// road:
		if (parsedAccident.road) {
			const normalizedRoad = await normalizeRelations(
				parsedAccident.road,
				"road",
				userId,
			);
			accidentRelations.road = {
				_ids: normalizedRoad!._id,
				relatedRelations: { accidents: true },
			};
		}

		// type (input: accident.type):
		if (parsedAccident.type) {
			const normalizedType = await normalizeRelations(
				parsedAccident.type,
				"type",
				userId,
			);
			accidentRelations.type = {
				_ids: normalizedType!._id,
				relatedRelations: { accidents: true },
			};
		}

		// area_usages (input: accident.areaUsages):
		if (parsedAccident.areaUsages) {
			const normalizedAreaUsages = await normalizeArrayRelations(
				parsedAccident.areaUsages,
				"area_usage",
				userId,
			);
			accidentRelations.area_usages = {
				_ids: normalizedAreaUsages.map((item) => item!._id),
				relatedRelations: { accidents: true },
			};
		}

		// position (input: accident.position):
		if (parsedAccident.position) {
			const normalizedPosition = await normalizeRelations(
				parsedAccident.position,
				"position",
				userId,
			);
			accidentRelations.position = {
				_ids: normalizedPosition!._id,
				relatedRelations: { accidents: true },
			};
		}

		// ruling_type (input: accident.rulingType):
		if (parsedAccident.rulingType) {
			const normalizedRulingType = await normalizeRelations(
				parsedAccident.rulingType,
				"ruling_type",
				userId,
			);
			accidentRelations.ruling_type = {
				_ids: normalizedRulingType!._id,
				relatedRelations: { accidents: true },
			};
		}

		// air_statuses (input: accident.airStatuses):
		if (parsedAccident.airStatuses) {
			const normalizedAirStatuses = await normalizeArrayRelations(
				parsedAccident.airStatuses,
				"air_status",
				userId,
			);
			accidentRelations.air_statuses = {
				_ids: normalizedAirStatuses.map((item) => item!._id),
				relatedRelations: { accidents: true },
			};
		}

		// light_status (input: accident.lightStatus):
		if (parsedAccident.lightStatus) {
			const normalizedLightStatus = await normalizeRelations(
				parsedAccident.lightStatus,
				"light_status",
				userId,
			);
			accidentRelations.light_status = {
				_ids: normalizedLightStatus!._id,
				relatedRelations: { accidents: true },
			};
		}

		// road_defects (input: accident.roadDefects):
		if (parsedAccident.roadDefects) {
			const normalizedRoadDefects = await normalizeArrayRelations(
				parsedAccident.roadDefects,
				"road_defect",
				userId,
			);
			accidentRelations.road_defects = {
				_ids: normalizedRoadDefects.map((item) => item!._id),
				relatedRelations: { accidents: true },
			};
		}

		// human_reasons (input: accident.humanReasons):
		if (parsedAccident.humanReasons) {
			const normalizedHumanReasons = await normalizeArrayRelations(
				parsedAccident.humanReasons,
				"human_reason",
				userId,
			);
			accidentRelations.human_reasons = {
				_ids: normalizedHumanReasons.map((item) => item!._id),
				relatedRelations: { accidents: true },
			};
		}

		// collision_type (input: accident.collisionType):
		if (parsedAccident.collisionType) {
			const normalizedCollisionType = await normalizeRelations(
				parsedAccident.collisionType,
				"collision_type",
				userId,
			);
			accidentRelations.collision_type = {
				_ids: normalizedCollisionType!._id,
				relatedRelations: { accidents: true },
			};
		}

		// road_situation (input: accident.roadSituation):
		if (parsedAccident.roadSituation) {
			const normalizedRoadSituation = await normalizeRelations(
				parsedAccident.roadSituation,
				"road_situation",
				userId,
			);
			accidentRelations.road_situation = {
				_ids: normalizedRoadSituation!._id,
				relatedRelations: { accidents: true },
			};
		}

		// road_repair_type (input: accident.roadRepairType):
		if (parsedAccident.roadRepairType) {
			const normalizedRoadRepairType = await normalizeRelations(
				parsedAccident.roadRepairType,
				"road_repair_type",
				userId,
			);
			accidentRelations.road_repair_type = {
				_ids: normalizedRoadRepairType!._id,
				relatedRelations: { accidents: true },
			};
		}

		// shoulder_status (input: accident.shoulderStatus):
		if (parsedAccident.shoulderStatus) {
			const normalizedShoulderStatus = await normalizeRelations(
				parsedAccident.shoulderStatus,
				"shoulder_status",
				userId,
			);
			accidentRelations.shoulder_status = {
				_ids: normalizedShoulderStatus!._id,
				relatedRelations: { accidents: true },
			};
		}

		// vehicle_reasons (input: accident.vehicleReasons):
		if (parsedAccident.vehicleReasons) {
			const normalizedVehicleReasons = await normalizeArrayRelations(
				parsedAccident.vehicleReasons,
				"vehicle_reason",
				userId,
			);
			accidentRelations.vehicle_reasons = {
				_ids: normalizedVehicleReasons.map((item) => item!._id),
				relatedRelations: { accidents: true },
			};
		}

		// equipment_damages (input: accident.equipmentDamages):
		if (parsedAccident.equipmentDamages) {
			const normalizedEquipmentDamages = await normalizeArrayRelations(
				parsedAccident.equipmentDamages,
				"equipment_damage",
				userId,
			);
			accidentRelations.equipment_damages = {
				_ids: normalizedEquipmentDamages.map((item) => item!._id),
				relatedRelations: { accidents: true },
			};
		}

		// road_surface_conditions (input: accident.roadSurfaceConditions):
		if (parsedAccident.roadSurfaceConditions) {
			const normalizedRoadSurfaceConditions =
				await normalizeArrayRelations(
					parsedAccident.roadSurfaceConditions,
					"road_surface_condition",
					userId,
				);
			accidentRelations.road_surface_conditions = {
				_ids: normalizedRoadSurfaceConditions.map((item) => item!._id),
				relatedRelations: { accidents: true },
			};
		}

		// attachments (input: accident.attachments):
		// if (accident.attachments) {
		//     const normalizedAttachments = await normalizeArrayRelations(accident.attachments, "file", userId);
		//     accidentRelations.attachments = {
		//         _ids: normalizedAttachments.map(item => item!._id),
		//     };
		// }
		//
		//
		// gemini code ends

		// Optional: handle vehicleDTOS
		if (parsedAccident.vehicleDTOS?.length) {
			accidentDoc.vehicle_dtos = await Promise.all(
				parsedAccident.vehicleDTOS.map(async (v) => {
					return {
						...v,
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
						max_damage_sections: await normalizeArrayRelations(
							v.maxDamageSections,
							"max_damage_section",
							userId,
						),
						driver: {
							...v.driver,
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
									...p,
									sex: await normalizeRelations(
										p.sex,
										"type",
										userId,
									),
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
							)
							: [],
					};
				}),
			) as any;
		}

		// Optional: handle pedestrianDTOS
		if (parsedAccident.pedestrianDTOS?.length) {
			accidentDoc.pedestrian_dtos = await Promise.all(
				parsedAccident.pedestrianDTOS.map(async (p) => ({
					...p,
					sex: await normalizeRelations(p.sex, "type", userId),
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
			) as any;
		}

		await accident.insertOne({
			doc: accidentDoc,
			relations: accidentRelations,
			projection: { _id: 1 },
		});
	}

	return { ok: true };
};

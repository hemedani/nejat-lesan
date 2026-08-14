/**
 * -----------------------------------------------------------------------------
 * FILE: seedTrafficZones.fn.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Reads a GeoJSON file containing traffic-restriction layers (e.g. Tehran's
 * "طرح ترافیک" and "طرح آلودگی") and seeds one `traffic_zone` / one
 * `air_pollution_zone` document per layer, linking each layer's City relation
 * and every accident that falls inside the layer geometry via `$geoWithin`.
 * -----------------------------------------------------------------------------
 */
import { type ActFn, ObjectId } from "@deps";
import {
	accident,
	air_pollution_zone,
	city,
	coreApp,
	file,
	traffic_zone,
} from "../../../mod.ts";
import { MyContext } from "../../../utils/context.ts";

const TRAFFIC_LAYER_KEYWORDS = ["ترافیک", "traffic"];
const POLLUTION_LAYER_KEYWORDS = ["آلودگی", "pollution", "LEZ"];

// Known LAYERID → layer type fallback for files that carry only IDs.
const LAYERID_TRAFFIC = new Set(["TTCCBD1044"]);
const LAYERID_POLLUTION = new Set(["TTCCBD1038"]);

const classifyLayer = (
	properties: Record<string, unknown>,
): "traffic" | "pollution" | null => {
	const name = String(
		properties.name ?? properties.NAME ?? properties.IDMAN ?? "",
	).toLowerCase();
	const layerId = String(properties.LAYERID ?? "").toUpperCase();

	if (
		POLLUTION_LAYER_KEYWORDS.some((k) => name.includes(k)) ||
		LAYERID_POLLUTION.has(layerId)
	) {
		return "pollution";
	}

	if (
		TRAFFIC_LAYER_KEYWORDS.some((k) => name.includes(k)) ||
		LAYERID_TRAFFIC.has(layerId)
	) {
		return "traffic";
	}

	return null;
};

export const seedTrafficZonesFn: ActFn = async (body) => {
	const { set: { cityId, geoId } } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const startTime = Date.now();
	let dbQueries = 0;
	const summary = {
		trafficZonesCreated: 0,
		airPollutionZonesCreated: 0,
		accidentsUpdated: 0,
		errors: [] as string[],
		dbQueries: 0,
		totalTime: "",
	};

	try {
		// --- 1. Read and Parse GeoJSON File ---
		const foundedGeoFile = await file.findOne({
			filters: { _id: new ObjectId(geoId as string) },
			projection: { name: 1 },
		});
		dbQueries++;

		if (!foundedGeoFile) throw new Error(`GeoFile ${geoId} not found.`);

		const filePath = `./uploads/geo/${foundedGeoFile.name}`;
		const fileInfo = await Deno.stat(filePath);

		const MAX_FILE_SIZE = 490 * 1024 * 1024; // 490MB in bytes
		if (fileInfo.size > MAX_FILE_SIZE) {
			throw new Error(
				`File size ${fileInfo.size} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (490MB). Please split the file into smaller chunks.`,
			);
		}

		const fileContent = await Deno.readTextFile(filePath);
		const featureCollection = JSON.parse(fileContent);

		// --- 2. Get Prerequisite Documents (City) ---
		const foundedCity = await city.findOne({
			filters: { _id: new ObjectId(cityId as string) },
		});
		dbQueries++;

		if (!foundedCity) throw new Error(`City ${cityId} not found.`);

		console.log(
			`Processing GeoJSON file with ${featureCollection.features.length} layers...`,
		);

		// --- 3. Iterate Over Each Layer in the GeoJSON ---
		for (let i = 0; i < featureCollection.features.length; i++) {
			const feature = featureCollection.features[i];
			const zoneName = String(
				feature.properties.name ?? feature.properties.NAME ??
					feature.properties.IDMAN ?? "Unknown",
			);
			const zoneGeometry = feature.geometry;
			const layerType = classifyLayer(feature.properties);

			console.log(
				`Processing Layer ${
					i + 1
				}/${featureCollection.features.length}: ${zoneName}`,
			);

			if (!layerType) {
				const errorMsg =
					`Could not classify layer "${zoneName}". Expected a traffic or air-pollution layer.`;
				console.error(errorMsg);
				summary.errors.push(errorMsg);
				continue;
			}

			try {
				// --- 4. Create the Zone Document with its relations ---
				const doc = {
					name: zoneName,
					area: zoneGeometry,
					population: 0,
				};

				const newZone = layerType === "traffic"
					? await traffic_zone.insertOne({
						doc,
						relations: {
							registrer: { _ids: user._id },
							city: {
								_ids: foundedCity._id,
								relatedRelations: { traffic_zones: true },
							},
						},
					})
					: await air_pollution_zone.insertOne({
						doc,
						relations: {
							registrer: { _ids: user._id },
							city: {
								_ids: foundedCity._id,
								relatedRelations: {
									air_pollution_zones: true,
								},
							},
						},
					});
				dbQueries++;

				if (layerType === "traffic") {
					summary.trafficZonesCreated++;
				} else {
					summary.airPollutionZonesCreated++;
				}

				// --- 5. Find all accidents within this layer's geometry ---
				const accidentsInZoneCursor = accident.find({
					filters: {
						location: {
							$geoWithin: {
								$geometry: zoneGeometry,
							},
						},
					},
					projection: { _id: 1 },
				});

				const relationKey = layerType === "traffic"
					? "traffic_zone"
					: "air_pollution_zone";

				const batchSize = 50;
				let batch: { _id: ObjectId }[] = [];
				let processedCount = 0;
				let accidentCount = 0;

				for await (const accidentDoc of accidentsInZoneCursor) {
					batch.push(accidentDoc);
					accidentCount++;

					if (batch.length >= batchSize) {
						const batchPromises = batch.map((accId) =>
							accident.addRelation({
								filters: { _id: accId._id },
								relations: {
									[relationKey]: {
										_ids: newZone!._id,
										relatedRelations: { accidents: true },
									},
								},
								replace: true,
							}).catch((error) => {
								console.error(
									`Failed to add relation for accident ${accId._id}:`,
									error,
								);
								throw error;
							})
						);

						await Promise.all(batchPromises);
						processedCount += batch.length;
						dbQueries += batch.length;
						summary.accidentsUpdated += batch.length;

						batch = [];
						console.log(
							`Processed ${processedCount} accidents in Layer ${zoneName}`,
						);
					}
				}

				if (batch.length > 0) {
					const batchPromises = batch.map((accId) =>
						accident.addRelation({
							filters: { _id: accId._id },
							relations: {
								[relationKey]: {
									_ids: newZone!._id,
									relatedRelations: { accidents: true },
								},
							},
							replace: true,
						}).catch((error) => {
							console.error(
								`Failed to add relation for accident ${accId._id}:`,
								error,
							);
							throw error;
						})
					);

					await Promise.all(batchPromises);
					processedCount += batch.length;
					dbQueries += batch.length;
					summary.accidentsUpdated += batch.length;

					console.log(
						`Processed ${processedCount} accidents in Layer ${zoneName}`,
					);
				}

				console.log(
					`Completed processing Layer ${zoneName}. Found and linked ${accidentCount} accidents.`,
				);

				if (i % 10 === 0) {
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			} catch (zoneError) {
				const errorMsg = `Error processing layer ${zoneName}: ${
					(zoneError as Error).message
				}`;
				console.error(errorMsg);
				summary.errors.push(errorMsg);
				continue;
			}
		}
	} catch (error) {
		const errorMsg = `Critical error in seedTrafficZones: ${
			(error as Error).message
		}`;
		console.error(errorMsg);
		summary.errors.push(errorMsg);
		throw error;
	}

	summary.dbQueries = dbQueries;
	summary.totalTime = `${Date.now() - startTime}ms`;

	console.log("Seeding process completed.");
	console.log("Summary:", summary);

	return { summary };
};

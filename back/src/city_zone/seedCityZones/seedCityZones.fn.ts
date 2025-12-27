/**
 * -----------------------------------------------------------------------------
 * FILE: seedCityZones.fn.ts (High-Performance Seeding Logic)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function performs the following steps in a highly optimized manner:
 * 1. Reads and parses the specified GeoJSON file.
 * 2. Finds the target City and the current User.
 * 3. Iterates through each zone (feature) in the GeoJSON file.
 * 4. For each zone, it creates a new `city_zone` document and links its relations.
 * 5. It finds all accidents that fall within the zone's geometry using `$geoWithin`.
 * 6. Finally, it uses `Promise.all` to run concurrent `addRelation` calls on each
 * found accident, which is the correct and performant Lesan pattern.
 */
import { type ActFn, ObjectId } from "@deps";
import { accident, city, city_zone, coreApp, file } from "../../../mod.ts";
import { MyContext } from "../../../utils/context.ts";

export const seedCityZonesFn: ActFn = async (body) => {
	const { set: { cityId, geoId } } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	// Performance monitoring
	const startTime = Date.now();
	let dbQueries = 0;
	let zonesCreated = 0;
	let accidentsUpdated = 0;
	const errors: string[] = [];

	// --- 1. Read and Parse GeoJSON File ---
	try {
		const foundedGeoFile = await file.findOne({
			filters: { _id: new ObjectId(geoId as string) },
			projection: { name: 1 },
		});
		dbQueries++;

		if (!foundedGeoFile) throw new Error(`GeoFile ${geoId} not found.`);

		// Read file information to determine size and choose appropriate approach
		const filePath = `./uploads/geo/${foundedGeoFile.name}`;
		const fileInfo = await Deno.stat(filePath);

		// Check if the file is too large (> 490MB) and throw an error if so
		const MAX_FILE_SIZE = 490 * 1024 * 1024; // 490MB in bytes
		if (fileInfo.size > MAX_FILE_SIZE) {
			throw new Error(
				`File size ${fileInfo.size} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (490MB). Please split the file into smaller chunks.`,
			);
		}

		const fileContent = await Deno.readTextFile(
			`./uploads/geo/${foundedGeoFile.name}`,
		);
		const featureCollection = JSON.parse(fileContent);

		// --- 2. Get Prerequisite Documents (City) ---
		const foundedCity = await city.findOne({
			filters: { _id: new ObjectId(cityId as string) },
		});
		dbQueries++;

		if (!foundedCity) throw new Error(`City ${cityId} not found.`);

		console.log(
			`Processing GeoJSON file with ${featureCollection.features.length} zones...`,
		);

		// --- 3. Iterate Over Each Zone in the GeoJSON ---
		for (let i = 0; i < featureCollection.features.length; i++) {
			const feature = featureCollection.features[i];

			// Handle both "name" and "NAME" properties, and both string and number types
			const zoneName =
				(feature.properties.name ?? feature.properties.NAME ??
					"Unknown").toString();
			const zoneGeometry = feature.geometry;

			console.log(
				`Processing Zone ${
					i + 1
				}/${featureCollection.features.length}: ${zoneName}`,
			);

			try {
				// --- 4. Create the City Zone Document with its relations ---
				const newZone = await city_zone.insertOne({
					doc: {
						name: zoneName,
						area: zoneGeometry,
					},
					relations: {
						registrer: { _ids: user._id },
						city: {
							_ids: foundedCity._id,
							relatedRelations: { city_zones: true },
						},
					},
				});
				dbQueries++;

				zonesCreated++;

				// --- 5. Find all accidents within this zone's geometry ---
				const accidentsInZoneCursor = accident.find({
					filters: {
						location: {
							$geoWithin: {
								$geometry: zoneGeometry,
							},
						},
					},
					projection: { _id: 1 }, // We only need the IDs
				});

				// Process accidents in batches to avoid memory overflow
				const batchSize = 50; // Reduced batch size for better memory management
				let batch: { _id: ObjectId }[] = [];
				let processedCount = 0;
				let accidentCount = 0;

				for await (const accidentDoc of accidentsInZoneCursor) {
					batch.push(accidentDoc);
					accidentCount++;

					if (batch.length >= batchSize) {
						// Process current batch
						const batchPromises = batch.map((accId) =>
							accident.addRelation({
								filters: { _id: accId._id },
								relations: {
									city_zone: {
										_ids: newZone!._id,
										relatedRelations: { accidents: true },
									},
								},
								replace: true, // Necessary for single-type relations
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
						accidentsUpdated += batch.length;

						// Clear the batch to free memory
						batch = [];

						console.log(
							`Processed ${processedCount} accidents in Zone ${zoneName}`,
						);
					}
				}

				// Process remaining accidents in the last batch
				if (batch.length > 0) {
					const batchPromises = batch.map((accId) =>
						accident.addRelation({
							filters: { _id: accId._id },
							relations: {
								city_zone: {
									_ids: newZone!._id,
									relatedRelations: { accidents: true },
								},
							},
							replace: true, // Necessary for single-type relations
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
					accidentsUpdated += batch.length;

					console.log(
						`Processed ${processedCount} accidents in Zone ${zoneName}`,
					);
				}

				console.log(
					`Completed processing Zone ${zoneName}. Found and linked ${accidentCount} accidents.`,
				);

				// Add small delay between zones to prevent overwhelming the database
				if (i % 10 === 0) { // Every 10 zones
					await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
				}

				// Clear any potential memory buildup periodically
				if (i % 50 === 0) { // Every 50 zones
					console.log(
						`Clearing memory after processing ${i + 1} zones...`,
					);
					// Force garbage collection by creating a new scope
					await new Promise((resolve) => setTimeout(resolve, 0));
				}
			} catch (zoneError) {
				const errorMsg = `Error processing zone ${
					feature.properties.name ?? feature.properties.NAME ??
						"Unknown"
				}: ${(zoneError as Error).message}`;
				console.error(errorMsg);
				errors.push(errorMsg);

				// Continue processing other zones instead of failing completely
				continue;
			}
		}
	} catch (error) {
		const errorMsg = `Critical error in seedCityZones: ${
			(error as Error).message
		}`;
		console.error(errorMsg);
		errors.push(errorMsg);
		throw error;
	}

	const endTime = Date.now();
	const totalTime = endTime - startTime;

	console.log("Seeding process completed.");
	console.log(
		`Summary: Created ${zonesCreated} zones, updated ${accidentsUpdated} accidents`,
	);
	console.log(`Database queries: ${dbQueries}, Total time: ${totalTime}ms`);
	console.log(`Errors: ${errors.length}`, errors);

	return {
		summary: {
			zonesCreated,
			accidentsUpdated,
			errors,
			dbQueries,
			totalTime: `${totalTime}ms`,
		},
	};
};

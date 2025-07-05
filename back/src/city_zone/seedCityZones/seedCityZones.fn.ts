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

	// --- 1. Read and Parse GeoJSON File ---
	const foundedGeoFile = await file.findOne({
		filters: { _id: new ObjectId(geoId as string) },
		projection: { name: 1 },
	});
	if (!foundedGeoFile) throw new Error(`GeoFile ${geoId} not found.`);

	const fileContent = await Deno.readTextFile(
		`./uploads/geo/${foundedGeoFile.name}`,
	);
	const featureCollection = JSON.parse(fileContent);

	// --- 2. Get Prerequisite Documents (City) ---
	const foundedCity = await city.findOne({
		filters: { _id: new ObjectId(cityId as string) },
	});
	if (!foundedCity) throw new Error(`City ${cityId} not found.`);

	const summary = {
		zonesCreated: 0,
		accidentsUpdated: 0,
		errors: [] as string[],
	};

	// --- 3. Iterate Over Each Zone in the GeoJSON ---
	for (const feature of featureCollection.features) {
		const zoneName = feature.properties.name.toString();
		const zoneGeometry = feature.geometry;

		console.log(`Processing Zone: ${zoneName}`);

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

		summary.zonesCreated++;

		// --- 5. Find all accidents within this zone's geometry ---
		const accidentsInZone = await accident.find({
			filters: {
				location: {
					$geoWithin: {
						$geometry: zoneGeometry,
					},
				},
			},
			projection: { _id: 1 }, // We only need the IDs
		}).toArray();

		if (accidentsInZone.length > 0) {
			console.log(
				`Found ${accidentsInZone.length} accidents in Zone ${zoneName}. Linking...`,
			);

			// --- 6. Create an array of promises to update each accident ---
			const updatePromises = accidentsInZone.map((accId) =>
				accident.addRelation({
					filters: { _id: accId._id },
					relations: {
						city_zone: {
							_ids: newZone!._id,
							relatedRelations: { accidents: true },
						},
					},
					replace: true, // Necessary for single-type relations
				})
			);

			// --- 7. Execute all update promises in parallel ---
			await Promise.all(updatePromises);

			summary.accidentsUpdated += accidentsInZone.length;
		}
	}

	console.log("Seeding process completed.");
	return { summary };
};

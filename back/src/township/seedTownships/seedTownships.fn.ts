/**
 * -----------------------------------------------------------------------------
 * FILE: seedTownships.fn.ts (High-Performance Seeding Logic)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function performs the following steps in a highly optimized manner:
 * 1. Reads and parses the specified GeoJSON file.
 * 2. Finds the target Province and the current User.
 * 3. Iterates through each township (feature) in the GeoJSON file.
 * 4. For each township, it creates a new `township` document and links its relations.
 * 5. It finds all accidents that fall within the township's geometry using `$geoWithin`.
 * 6. Finally, it uses `Promise.all` to run concurrent `addRelation` calls on each
 * found accident, which is the correct and performant Lesan pattern.
 */
import { type ActFn, ObjectId } from "@deps";
import { accident, province, township, coreApp, file } from "../../../mod.ts";
import { MyContext } from "../../../utils/context.ts";

export const seedTownshipsFn: ActFn = async (body) => {
	const { set: { provinceId, geoId } } = body.details;
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

	// --- 2. Get Prerequisite Documents (Province) ---
	const foundedProvince = await province.findOne({
		filters: { _id: new ObjectId(provinceId as string) },
	});
	if (!foundedProvince) throw new Error(`Province ${provinceId} not found.`);

	const summary = {
		townshipsCreated: 0,
		accidentsUpdated: 0,
		errors: [] as string[],
	};

	// --- 3. Iterate Over Each Township in the GeoJSON ---
	for (const feature of featureCollection.features) {
		// Handle both "township" and "township en" properties, and both string and number types
		const townshipName = (feature.properties.township ?? feature.properties["township en"] ?? "Unknown").toString();
		const townshipGeometry = feature.geometry;

		console.log(`Processing Township: ${townshipName}`);

		// --- 4. Create the Township Document with its relations ---
		const newTownship = await township.insertOne({
			doc: {
				name: townshipName,
				area: townshipGeometry,
			},
			relations: {
				registrer: { _ids: user._id },
				province: {
					_ids: foundedProvince._id,
					relatedRelations: { townships: true },
				},
			},
		});

		summary.townshipsCreated++;

		// --- 5. Find all accidents within this township's geometry ---
		const accidentsInTownship = await accident.find({
			filters: {
				location: {
					$geoWithin: {
						$geometry: townshipGeometry,
					},
				},
			},
			projection: { _id: 1 }, // We only need the IDs
		}).toArray();

		if (accidentsInTownship.length > 0) {
			console.log(
				`Found ${accidentsInTownship.length} accidents in Township ${townshipName}. Linking...`,
			);

			// --- 6. Process accidents in batches to avoid memory overflow ---
			const batchSize = 100; // Process 100 accidents at a time
			let processedCount = 0;

			for (let i = 0; i < accidentsInTownship.length; i += batchSize) {
				const batch = accidentsInTownship.slice(i, i + batchSize);

				// Create promises for this batch only
				const batchPromises = batch.map((accId) =>
					accident.addRelation({
						filters: { _id: accId._id },
						relations: {
							township: {
								_ids: newTownship!._id,
								relatedRelations: { accidents: true },
							},
						},
						replace: true, // Necessary for single-type relations
					})
				);

				// --- 7. Execute batch promises in parallel ---
				await Promise.all(batchPromises);

				processedCount += batch.length;
				console.log(`Processed ${processedCount}/${accidentsInTownship.length} accidents in Township ${townshipName}`);
			}

			summary.accidentsUpdated += accidentsInTownship.length;
		}
	}

	console.log("Seeding process completed.");
	return { summary };
};

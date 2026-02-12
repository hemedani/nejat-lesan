import { type ActFn, ObjectId } from "@deps";
import { accident, coreApp, township } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { provinceId, ...rest } = set;

	const newTownship = await township.insertOne({
		doc: rest,
		relations: {
			registrer: {
				_ids: user._id,
			},
			province: {
				_ids: new ObjectId(provinceId as string),
				relatedRelations: {
					cities: true,
				},
			},
		},
		projection: get,
	});

	// --- Find all accidents within this township's geometry ---
	if (newTownship && rest.area) {
		const accidentsInTownship = await accident.find({
			filters: {
				location: {
					$geoWithin: {
						$geometry: rest.area,
					},
				},
			},
			projection: { _id: 1 }, // We only need the IDs
		}).toArray();

		if (accidentsInTownship.length > 0) {
			console.log(
				`Found ${accidentsInTownship.length} accidents in Township ${rest.name}. Linking...`,
			);

			// --- Process accidents in batches to avoid memory overflow ---
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
								_ids: newTownship._id,
								relatedRelations: { accidents: true },
							},
						},
						replace: true, // Necessary for single-type relations
					})
				);

				// --- Execute batch promises in parallel ---
				await Promise.all(batchPromises);

				processedCount += batch.length;
				console.log(
					`Processed ${processedCount}/${accidentsInTownship.length} accidents in Township ${rest.name}`,
				);
			}

			console.log(
				`Successfully linked ${accidentsInTownship.length} accidents to Township ${rest.name}`,
			);
		}
	}

	return newTownship;
};

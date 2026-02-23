import { type ActFn, ensureDir, ObjectId } from "@deps";
import { coreApp, file } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { createExtractorFromFile } from "node-unrar-js";

const findJsonFile = async (dir: string): Promise<string | null> => {
	for await (const entry of Deno.readDir(dir)) {
		const fullPath = `${dir}/${entry.name}`;
		if (entry.isDirectory) {
			const found = await findJsonFile(fullPath);
			if (found) return found;
		} else if (entry.name.toLowerCase().endsWith(".json")) {
			return fullPath;
		}
	}
	return null;
};

export const uploadFileFn: ActFn = async (body) => {
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { formData, type, ...rest } = body.details.set;

	const fileToUpload: File = formData.get("file") as File;

	const uploadDir = type === "image"
		? "./uploads/images"
		: type === "video"
		? "./uploads/videos"
		: type === "geo"
		? "./uploads/geo"
		: type === "json" || type === "rar"
		? "./uploads/json"
		: "./uploads/docs";
	await ensureDir(uploadDir);

	let finalFileName = `${new ObjectId()}-${fileToUpload.name}`;
	let finalFileSize = fileToUpload.size;
	let finalFileType = fileToUpload.type;

	if (fileToUpload.name.toLowerCase().endsWith(".rar")) {
		const tempBase = "./uploads/temp";
		await ensureDir(tempBase);
		const sessionId = new ObjectId().toString();
		const extractDir = `${tempBase}/${sessionId}`;
		await ensureDir(extractDir);
		const tempRarPath = `${tempBase}/${sessionId}.rar`;

		try {
			// Write the uploaded RAR bytes to a temp path so node-unrar-js can read it
			await Deno.writeFile(
				tempRarPath,
				new Uint8Array(await fileToUpload.arrayBuffer()),
			);

			// Extract the entire RAR into a dedicated temp subdirectory
			const extractor = await createExtractorFromFile({
				filepath: tempRarPath,
				targetPath: extractDir,
			});

			const { files } = extractor.extract();

			// Consume the lazy iterator to trigger the actual extraction
			for (const _f of files) {
				// intentionally empty — side-effect is writing files to extractDir
			}

			// Walk the extracted tree and grab the first JSON file we find
			const jsonFilePath = await findJsonFile(extractDir);

			if (!jsonFilePath) {
				throw new Error("No JSON file found in the RAR archive");
			}

			// Build a unique destination name that keeps the original base-name
			const baseName = jsonFilePath.split("/").pop() ?? "extracted.json";
			finalFileName = `${new ObjectId()}-${baseName}`;

			// Use the real on-disk size (not the header's uncompressed size estimate)
			const stat = await Deno.stat(jsonFilePath);
			finalFileSize = stat.size;
			finalFileType = "application/json";

			// Move the JSON file into the proper upload directory
			await Deno.copyFile(jsonFilePath, `${uploadDir}/${finalFileName}`);
		} finally {
			// Always clean up the temporary RAR file and extracted tree
			await Deno.remove(tempRarPath).catch(() => {});
			await Deno.remove(extractDir, { recursive: true }).catch(() => {});
		}
	} else {
		await Deno.writeFile(
			`${uploadDir}/${finalFileName}`,
			fileToUpload.stream(),
		);
	}

	return await file.insertOne({
		doc: {
			name: finalFileName,
			type: finalFileType,
			size: finalFileSize,
			...rest,
		},
		relations: {
			uploader: {
				_ids: new ObjectId(user._id),
				relatedRelations: {
					uploadedAssets: true,
				},
			},
		},
		projection: body.details.get,
	});
};

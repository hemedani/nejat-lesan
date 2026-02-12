/**
 * Splits a large JSON array file into smaller chunks of specified maximum size.
 * Uses streaming to handle files larger than available memory.
 * Maintains valid JSON structure in each chunk and properly handles UTF-8 encoding.
 * @param inputFile Path to the large input JSON file
 * @param outputPrefix Prefix for output files
 * @param maxChunkSize Maximum size of each chunk in bytes (default 480MB)
 */
async function splitLargeJsonFile(
	inputFile: string,
	outputPrefix: string,
	maxChunkSize: number = 480 * 1024 * 1024, // 480MB
) {
	console.log(`Starting to split file: ${inputFile}`);
	console.log(`Max chunk size: ${maxChunkSize} bytes`);

	// Open the input file for reading
	const file = await Deno.open(inputFile, { read: true });

	// Create the output directory if it doesn't exist
	const outputDir = "sample_json_files/split";
	try {
		await Deno.mkdir(outputDir, { recursive: true });
	} catch (e) {
		// Directory might already exist, which is fine
	}

	let currentChunk: string[] = [];
	let currentChunkSize = 0;
	let chunkIndex = 1;
	let processedObjects = 0;

	// Track JSON parsing state
	let inArray = false;
	let currentObject = "";
	let braceCount = 0;
	let inString = false;
	let escapeNext = false;

	// Create a buffer to read the file in chunks
	const buffer = new Uint8Array(1024 * 1024); // 1MB buffer
	let decoder = new TextDecoder("utf-8");

	// Read the file character by character using the buffer
	let bufferData = new Uint8Array(0);
	let bufferIndex = 0;

	// We'll build a string to decode to avoid splitting multi-byte UTF-8 characters
	let rawData = new Uint8Array(0);
	let position = 0;

	// Read the file in binary chunks and decode properly
	const readNextChar = async (): Promise<string | null> => {
		if (bufferIndex >= rawData.length) {
			// Buffer is exhausted, read more data
			const bytesRead = await file.read(buffer);
			if (bytesRead === null) {
				// End of file
				return null;
			}

			// Append the new data to our raw data buffer
			const newBuffer = new Uint8Array(rawData.length + bytesRead);
			newBuffer.set(rawData);
			newBuffer.set(buffer.subarray(0, bytesRead), rawData.length);
			rawData = newBuffer;
		}

		// If we're at the end of the available data, return null
		if (bufferIndex >= rawData.length) {
			return null;
		}

		// Find the end of the current UTF-8 character
		let charLength = 1;
		const byte = rawData[bufferIndex];

		if (byte >= 0xF0) charLength = 4; // 4-byte UTF-8 character
		else if (byte >= 0xE0) charLength = 3; // 3-byte UTF-8 character
		else if (byte >= 0xC0) charLength = 2; // 2-byte UTF-8 character

		// Check if we have enough bytes for this character
		if (bufferIndex + charLength > rawData.length) {
			// Need more data, read another chunk
			const bytesRead = await file.read(buffer);
			if (bytesRead === null) {
				// End of file, but we don't have enough bytes for this character
				throw new Error(
					"Unexpected end of file in the middle of UTF-8 character",
				);
			}

			const newBuffer = new Uint8Array(rawData.length + bytesRead);
			newBuffer.set(rawData);
			newBuffer.set(buffer.subarray(0, bytesRead), rawData.length);
			rawData = newBuffer;

			if (bufferIndex + charLength > rawData.length) {
				// Still not enough data
				throw new Error("Not enough data to complete UTF-8 character");
			}
		}

		// Decode the character
		const charBytes = rawData.subarray(
			bufferIndex,
			bufferIndex + charLength,
		);
		const char = decoder.decode(charBytes);

		// Move the buffer index forward by the character length
		bufferIndex += charLength;
		position += charLength;

		return char;
	};

	// Read until we find the opening bracket of the array
	let char = await readNextChar();
	while (char !== null && char !== "[") {
		char = await readNextChar();
	}

	if (char === null) {
		throw new Error("File doesn't contain a valid JSON array");
	}

	inArray = true;
	console.log("Found start of JSON array, beginning parsing...");

	// Process the file character by character
	while (char !== null) {
		// Track if we're inside a string literal
		if (char === '"' && !escapeNext) {
			inString = !inString;
		} else if (char === "\\" && !escapeNext) {
			escapeNext = true;
			currentObject += char;
			char = await readNextChar();
			continue;
		} else {
			escapeNext = false;
		}

		// Track braces to properly identify complete JSON objects
		if (!inString) {
			if (char === "{") {
				braceCount++;

				// If this is the start of a top-level object (not nested), start capturing
				if (braceCount === 1) {
					currentObject = char; // Start with this opening brace
				} else if (braceCount > 1) {
					// This is a nested object, include the brace in the current object
					currentObject += char;
				}
			} else if (char === "}") {
				currentObject += char;
				braceCount--;

				// Check if we have a complete top-level JSON object
				if (braceCount === 0) {
					// Remove trailing comma and whitespace if present (for all but the last object in original array)
					currentObject = currentObject.trim().replace(/,\s*$/, "");

					// Check if adding this object would exceed the chunk size
					const objSize =
						new TextEncoder().encode(currentObject).length;
					const estimatedNewSize = currentChunkSize + objSize +
						(currentChunk.length > 0 ? 2 : 1); // comma + space, or just opening bracket

					if (
						currentChunk.length === 0 ||
						estimatedNewSize <= maxChunkSize
					) {
						// Add to current chunk
						currentChunk.push(currentObject);
						currentChunkSize += objSize;
						if (currentChunk.length > 1) {
							currentChunkSize += 2; // For the comma and space
						}
					} else {
						// Write current chunk to file and start a new chunk
						await writeChunkToFile(
							currentChunk,
							chunkIndex,
							outputDir,
							outputPrefix,
						);
						console.log(
							`Chunk ${chunkIndex} completed with ${currentChunk.length} objects`,
						);

						// Start a new chunk with the current object
						currentChunk = [currentObject];
						currentChunkSize = objSize;
						chunkIndex++;
					}

					processedObjects++;
					if (processedObjects % 10000 === 0) {
						console.log(`Processed ${processedObjects} objects`);
					}

					// Reset for the next object
					currentObject = "";

					// Skip whitespace characters after the object
					char = await readNextChar();
					while (char !== null && /\s/.test(char)) {
						char = await readNextChar();
					}

					// If we encounter a comma, skip it and any following whitespace
					if (char === ",") {
						char = await readNextChar();
						while (char !== null && /\s/.test(char)) {
							char = await readNextChar();
						}
					}

					continue; // Continue with the next character after the comma/whitespace
				}
			} else if (braceCount > 0) {
				// We're inside an object, add the character to the current object
				currentObject += char;
			}
		} else if (braceCount > 0) {
			// We're in a string inside an object, add the character to the current object
			currentObject += char;
		}

		// Read the next character
		char = await readNextChar();
	}

	// Write the last chunk if it has any objects
	if (currentChunk.length > 0) {
		await writeChunkToFile(
			currentChunk,
			chunkIndex,
			outputDir,
			outputPrefix,
		);
		console.log(
			`Final chunk ${chunkIndex} completed with ${currentChunk.length} objects`,
		);
	}

	file.close();

	console.log(`\nSplitting completed! Created ${chunkIndex} chunks.`);
	console.log("File splitting completed successfully!");
}

/**
 * Writes a chunk of JSON objects to a file with proper JSON array formatting
 */
async function writeChunkToFile(
	chunk: string[],
	index: number,
	outputDir: string,
	outputPrefix: string,
) {
	const content = "[\n" + chunk.join(",\n") + "\n]";
	const outputFile = `${outputDir}/${outputPrefix}_part_${
		index.toString().padStart(3, "0")
	}.json`;
	await Deno.writeTextFile(outputFile, content);
}

// Run the splitting function
if (import.meta.main) {
	const inputFile = "sample_json_files/2GB-merged.json";
	const outputPrefix = "2GB-merged";

	splitLargeJsonFile(inputFile, outputPrefix)
		.then(() => {
			console.log("All chunks created successfully!");
		})
		.catch((error) => {
			console.error("Error during file splitting:", error);
			Deno.exit(1);
		});
}

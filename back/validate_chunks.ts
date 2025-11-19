// Simple script to validate JSON structure of one of the chunks
async function validateJsonFile(filePath: string) {
	try {
		console.log(`Validating: ${filePath}`);

		// Read the file content
		const content = await Deno.readTextFile(filePath);
		console.log(`File size: ${content.length} characters`);

		// Check if it starts and ends with proper brackets
		const trimmed = content.trim();
		if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
			console.error(
				"✗ Invalid JSON array structure: does not start with [ or end with ]",
			);
			return;
		}

		// Try to parse just the first few entries to verify structure
		// Extract the content between the outer brackets
		const innerContent = trimmed.substring(1, trimmed.length - 1);

		// Find the first complete object by tracking braces
		let braceCount = 0;
		let inString = false;
		let escapeNext = false;
		let start = -1;

		for (let i = 0; i < innerContent.length; i++) {
			const char = innerContent[i];

			if (char === '"' && !escapeNext) {
				inString = !inString;
			} else if (char === "\\" && !escapeNext) {
				escapeNext = true;
				continue;
			} else {
				escapeNext = false;
			}

			if (!inString) {
				if (char === "{") {
					if (braceCount === 0) start = i; // Mark start of a top-level object
					braceCount++;
				} else if (char === "}") {
					braceCount--;
					if (braceCount === 0 && start !== -1) {
						// We have a complete top-level object
						const objectStr = innerContent.substring(start, i + 1);

						try {
							const parsed = JSON.parse(objectStr);
							console.log("✓ First JSON object is valid");
							console.log(
								"  Keys:",
								Object.keys(parsed).join(", "),
							);
							console.log(
								"  First 50 chars of accident_json:",
								parsed.accident_json.substring(0, 50) + "...",
							);
							break;
						} catch (e) {
							console.error(
								"✗ First JSON object is invalid:",
								e.message,
							);
							return;
						}
					}
				}
			}
		}

		console.log("✓ Basic JSON structure validation passed");
	} catch (error) {
		console.error("✗ Error validating file:", error.message);
	}
}

// Validate the first chunk
validateJsonFile("sample_json_files/split/2GB-merged_part_001.json");

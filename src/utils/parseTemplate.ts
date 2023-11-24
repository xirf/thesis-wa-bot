import log from "./logger";

function parseTemplate(template: string, replacements: { [ key: string ]: any }): string {
	// Regular expression to match conditional blocks
	const conditionalRegex = /\{if:(\w+)\}([\s\S]*?)\{else\}/g;

	// Replace conditional blocks
	const parsedText = template.replace(
		conditionalRegex,
		(_, key, block) => {

			try {
				if (replacements.hasOwnProperty(key) && replacements[ key ]) {
					return block.trim(); // Include the block if the key exists and has a value
				} else {
					return ""; // Remove the block if the key does not exist or has no value
				}
			} catch (error) {
				log.error(error);
				return "";
			}
		}
	);

	// Replace remaining placeholders
	const placeholderRegex = /\[(\w+)\]/g;
	const finalText = parsedText.replace(placeholderRegex, (_match, key) => {
		try {
			if (replacements.hasOwnProperty(key) && replacements[ key ]) {
				return replacements[ key ];
			}
			return key; // Leave the placeholder unchanged if the key is not found
		} catch (error) {
			log.error(error);
			return key;
		}
	});

	return finalText;
}

export default parseTemplate;
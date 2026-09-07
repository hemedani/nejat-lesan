import type { ActFn } from "@deps";
import { QUESTION_REGISTRY } from "../questionRegistry.ts";

export const getQuestionModelsFn: ActFn = async () => {
	const models = Object.entries(QUESTION_REGISTRY).map(
		([model_name, info]) => ({
			model_name,
			multi: info.multi,
			targetKind: info.target.kind,
		}),
	);
	return { models };
};

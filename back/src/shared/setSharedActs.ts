import {
	type ActFn,
	type Document,
	ObjectId,
	boolean,
	enums,
	number,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { grantAccess, setTokens, setUser, type MyContext } from "@lib";
import { coreApp, selectStruct } from "../../mod.ts";
import { shared_relation_pure } from "@model";

type SharedModel = {
	insertOne: (args: any) => Promise<any>;
	findOneAndUpdate: (args: any) => Promise<any>;
	aggregation: (args: any) => { toArray: () => Promise<any> };
	deleteOne: (args: any) => Promise<any>;
	countDocument: (args: any) => Promise<number>;
};

export const setSharedActs = (modelName: string, model: SharedModel) => {
	// --- add ---
	const addValidator = () =>
		object({
			set: object({
				...shared_relation_pure,
			}),
			get: selectStruct(modelName, 1),
		});

	const addFn: ActFn = async (body) => {
		const { set, get } = body.details;
		const { user }: MyContext = coreApp.contextFns
			.getContextModel() as MyContext;

		return await model.insertOne({
			doc: set,
			relations: {
				registrer: {
					_ids: user._id,
				},
			},
			projection: get,
		});
	};

	coreApp.acts.setAct({
		schema: modelName,
		fn: addFn,
		actName: "add",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: addValidator(),
		validationRunType: "create",
	});

	// --- get ---
	const getValidator = () =>
		object({
			set: object({
				_id: string(),
			}),
			get: selectStruct(modelName, 2),
		});

	const getFn: ActFn = async (body) => {
		const {
			set: { _id },
			get,
		} = body.details;

		return await model
			.aggregation({
				pipeline: [
					{ $match: { _id: new ObjectId(_id as string) } },
				],
				projection: get,
			})
			.toArray();
	};

	coreApp.acts.setAct({
		schema: modelName,
		fn: getFn,
		actName: "get",
		validator: getValidator(),
	});

	// --- gets ---
	const getsValidator = () =>
		object({
			set: object({
				page: number(),
				limit: number(),
				name: optional(string()),
			}),
			get: selectStruct(modelName, 2),
		});

	const getsFn: ActFn = async (body) => {
		const {
			set: { page, limit, name },
			get,
		} = body.details;

		const pipeline: Document[] = [];

		name &&
			pipeline.push({
				$match: {
					name: { $regex: new RegExp(name, "i") },
				},
			});

		pipeline.push({ $sort: { _id: -1 } });
		pipeline.push({ $skip: (page - 1) * limit });
		pipeline.push({ $limit: limit });

		return await model
			.aggregation({
				pipeline,
				projection: get,
			})
			.toArray();
	};

	coreApp.acts.setAct({
		schema: modelName,
		fn: getsFn,
		actName: "gets",
		validator: getsValidator(),
	});

	// --- update ---
	const updateValidator = () =>
		object({
			set: object({
				_id: objectIdValidation,
				name: optional(string()),
			}),
			get: selectStruct(modelName, 1),
		});

	const updateFn: ActFn = async (body) => {
		const {
			set: { _id, name },
			get,
		} = body.details;

		const updateObj: Record<string, any> = {
			updatedAt: new Date(),
		};

		name && (updateObj.name = name);

		return await model.findOneAndUpdate({
			filter: { _id: new ObjectId(_id as string) },
			update: {
				$set: updateObj,
			},
			projection: get,
		});
	};

	coreApp.acts.setAct({
		schema: modelName,
		fn: updateFn,
		actName: "update",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: updateValidator(),
	});

	// --- remove ---
	const removeValidator = () =>
		object({
			set: object({
				_id: string(),
				hardCascade: optional(boolean()),
			}),
			get: object({
				success: optional(enums([0, 1])),
			}),
		});

	const removeFn: ActFn = async (body) => {
		const {
			set: { _id, hardCascade },
		} = body.details;

		return await model.deleteOne({
			filter: { _id: new ObjectId(_id as string) },
			hardCascade: hardCascade || false,
		});
	};

	coreApp.acts.setAct({
		schema: modelName,
		actName: "remove",
		fn: removeFn,
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: removeValidator(),
	});

	// --- count ---
	const countValidator = () =>
		object({
			set: object({
				name: optional(string()),
			}),
			get: object({ qty: optional(enums([0, 1])) }),
		});

	const countFn: ActFn = async (body) => {
		const {
			set: { name },
		} = body.details;

		const filters: Document = {};

		name &&
			(filters["name"] = {
				$regex: new RegExp(name, "i"),
			});

		const foundedItemsLength = await model.countDocument({
			filter: filters,
		});

		return { qty: foundedItemsLength };
	};

	coreApp.acts.setAct({
		schema: modelName,
		fn: countFn,
		actName: "count",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: countValidator(),
	});
};
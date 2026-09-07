import { type ActFn, ObjectId } from "@deps";
import { coreApp, organization, unit } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext } from "@lib";
import { throwError } from "@lib";

/**
 * ایجاد گره سازمانی با دو گارد سمت سرور:
 *  - اگر سازمانِ والد به راهی گره خورده باشد، `road._id` باید با
 *    `organization.road._id` یکسان باشد؛ سازمان بدون راه (مثلاً شهرداری)
 *    واحدِ بدون راه می‌سازد و نباید `roadId` دریافت کند.
 *  - هر `parentUnit` باید در همان سازمان باشد (جلوگیری از درخت بین‌سازمانی).
 */
export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { organizationId, roadId, parentUnitId, headId, ...rest } = set;

	await assertOrgInActorScope(user, organizationId as string);

	const org = await organization.findOne({
		filters: { _id: new ObjectId(organizationId as string) },
		projection: { _id: 1, "road._id": 1 },
	});
	if (!org) return throwError("سازمان مورد نظر یافت نشد");
	const orgRoadId = (org as any).road?._id as ObjectId | undefined;

	if (orgRoadId) {
		const unitRoadId = roadId ? new ObjectId(roadId as string) : orgRoadId;
		if (unitRoadId.toString() !== orgRoadId.toString()) {
			return throwError("راه واحد باید با راه سازمان یکسان باشد");
		}
	} else if (roadId) {
		return throwError("سازمان راه معتبری ندارد");
	}

	if (parentUnitId) {
		const parent = await unit.findOne({
			filters: { _id: new ObjectId(parentUnitId as string) },
			projection: { _id: 1, "organization._id": 1 },
		});
		if (!parent) return throwError("واحد والد یافت نشد");
		const parentOrgId = (parent as any).organization?._id as
			| ObjectId
			| undefined;
		if (
			!parentOrgId ||
			parentOrgId.toString() !== (organizationId as string)
		) {
			return throwError("واحد والد باید در همان سازمان باشد");
		}
	}

	const relations: Record<string, any> = {
		organization: {
			_ids: new ObjectId(organizationId as string),
			relatedRelations: { units: true },
		},
		registrer: {
			_ids: user._id,
		},
	};

	if (orgRoadId) {
		relations.road = {
			_ids: roadId ? new ObjectId(roadId as string) : orgRoadId,
			relatedRelations: { units: true },
		};
	}

	if (parentUnitId) {
		relations.parentUnit = {
			_ids: new ObjectId(parentUnitId as string),
			relatedRelations: { subUnits: true },
		};
	}
	if (headId) {
		relations.head = {
			_ids: new ObjectId(headId as string),
			relatedRelations: { headedUnits: true },
		};
	}

	return await unit.insertOne({
		doc: rest as Record<string, any>,
		relations,
		projection: get,
	});
};

import { type ActFn, ObjectId } from "@deps";
import { accident, coreApp, file } from "../../../mod.ts";
import { throwError, type MyContext } from "@lib";

export const updateFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { _id, client_report_uuid, ...fields } = set;

	// --- 1. Resolve the target record ---
	const filter: Record<string, unknown> = {};
	if (_id) filter._id = new ObjectId(_id as string);
	else if (client_report_uuid) filter.client_report_uuid = client_report_uuid;
	else {
		throwError("شناسه گزارش یا client_report_uuid الزامی است");
	}

	// --- 2. Access control ---
	// Manager/Ghost may update any report; Patrol only their own.
	if (
		user.level !== "Manager" &&
		user.level !== "Ghost" &&
		user.level !== "Patrol"
	) {
		throwError("شما اجازه ویرایش این گزارش را ندارید");
	}
	if (user.level === "Patrol") {
		const existing = await accident.findOne({
			filters: filter,
			projection: { "officer._id": 1, sync_status: 1 },
		});
		if (!existing) throwError("گزارش یافت نشد");
		if (String((existing as { officer?: { _id?: unknown } }).officer?._id) !==
			String(user._id)
		) {
			throwError("شما اجازه ویرایش این گزارش را ندارید");
		}
	}

	// --- Sync Status Transition Validation ---
	// Patrol: can only set draft → queued (cannot set synced/rejected)
	// Manager/Ghost: can set any valid transition
	if (fields.sync_status !== undefined) {
		const newStatus = fields.sync_status as string;
		const validStatuses = ["draft", "queued", "syncing", "synced", "rejected"];
		if (!validStatuses.includes(newStatus)) {
			throwError("وضعیت همگام‌سازی نامعتبر است");
		}
		if (user.level === "Patrol") {
			// Patrol can only set draft or queued
			const allowedPatrolStatuses = ["draft", "queued"];
			if (!allowedPatrolStatuses.includes(newStatus)) {
				throwError("مأمور گشت تنها می‌تواند وضعیت draft یا queued را تنظیم کند");
			}
			// Cannot move backwards from queued to draft if already synced
			const existing = await accident.findOne({
				filters: filter,
				projection: { sync_status: 1 },
			});
			if (existing && existing.sync_status === "synced" && newStatus !== "synced") {
				throwError("نمی‌توان وضعیت گزارش تأیید شده را تغییر داد");
			}
			if (existing && existing.sync_status === "rejected" && newStatus === "synced") {
				throwError("گزارش رد شده نمی‌تواند به تأیید شده تغییر کند");
			}
		}
		if (user.level === "Manager" || user.level === "Ghost") {
			// Manager can transition queued → synced/rejected
			// but not backwards from synced/rejected
			const existing = await accident.findOne({
				filters: filter,
				projection: { sync_status: 1 },
			});
			if (existing) {
				const currentStatus = existing.sync_status;
				// Prevent downgrading from synced/rejected
				if ((currentStatus === "synced" || currentStatus === "rejected") &&
					newStatus !== currentStatus) {
					throwError(`نمی‌توان وضعیت از ${currentStatus} به ${newStatus} تغییر داد`);
				}
			}
		}
	}

	// --- 3. Build the $set of provided pure fields ---
	const updateObj: Record<string, unknown> = { updatedAt: new Date() };
	for (const key in fields) {
		if (fields[key] !== undefined) updateObj[key] = fields[key];
	}

	// --- 4. Handle attachment linking for new image ObjectIds ---
	// Check for new image ObjectIds in plate_image, insurance_image, vehicle_dtos, facility_damage_dtos
	const attachmentIds: string[] = [];
	if (fields.plate_image) attachmentIds.push(fields.plate_image as string);
	if (fields.insurance_image) attachmentIds.push(fields.insurance_image as string);
	if (fields.vehicle_dtos && Array.isArray(fields.vehicle_dtos)) {
		for (const vehicle of fields.vehicle_dtos) {
			if (vehicle.plate_image) attachmentIds.push(vehicle.plate_image as string);
			if (vehicle.insurance_image) attachmentIds.push(vehicle.insurance_image as string);
		}
	}
	if (fields.facility_damage_dtos && Array.isArray(fields.facility_damage_dtos)) {
		for (const facility of fields.facility_damage_dtos) {
			if (facility.images && Array.isArray(facility.images)) {
				for (const img of facility.images) attachmentIds.push(img as string);
			}
		}
	}

	// Deduplicate
	const uniqueAttachmentIds = [...new Set(attachmentIds)];

	// --- 5. Update the document ---
	const result = await accident.findOneAndUpdate({
		filter,
		update: { $set: updateObj },
		projection: get,
	});

	// --- 6. Link new attachments via addRelation ---
	if (uniqueAttachmentIds.length > 0 && result?._id) {
		for (const attachmentId of uniqueAttachmentIds) {
			try {
				await accident.addRelation({
					filters: { _id: new ObjectId(result._id as string) },
					relations: {
						attachments: {
							_ids: [new ObjectId(attachmentId)],
						},
					},
					projection: { _id: 1 },
				});
			} catch (e) {
				// Ignore duplicate relation errors
				console.warn(`Failed to link attachment ${attachmentId}:`, e);
			}
		}
	}

	return result;
};
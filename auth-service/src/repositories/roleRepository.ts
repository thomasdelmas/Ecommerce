import { HydratedDocument } from "mongoose"
import { IRole } from "../types/role"
import { IRoleModel } from "../types/db"

export type IRoleRepository = {
	getRole: (role: string, db: IRoleModel) => Promise<HydratedDocument<IRole> | null>
}

export class RoleRepository implements IRoleRepository {
	getRole = async (role: string, db: IRoleModel) => {
		return db.findOne({ role })
	}
}

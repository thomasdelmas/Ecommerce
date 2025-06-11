import { NextFunction, Request, Response } from "express";

export const authorize = (requiredPermissions: string[]) => {
	return (
		req: Request<{}, {}, any>,
		res: Response,
		next: NextFunction,
	): any => {
		const jwt = req.body.payload;

		if (!jwt.permissions) {
			return res.status(403).send('Not valid permission');
		}

		const isAuthorized = requiredPermissions.every((reqPerm) => (jwt.permissions.find((userPerm: string) => (userPerm === reqPerm))))
		
		if (!isAuthorized) {
			return res.status(403).send('Forbidden');
		}
		
		next();
	}
}

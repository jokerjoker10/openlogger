
import Prisma from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next'
import { unstable_getServerSession } from 'next-auth';
import prisma from '../../../../../lib/prisma';
import { getAuthUser, isMaintainer, isMember, onlyAdmin } from '../../../../../lib/usertools';
import { authOptions } from '../../../auth/[...nextauth]';

type Data = {
  status: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Prisma.Device | Array<Prisma.Device>>
) {
	var session = await unstable_getServerSession(req, res, authOptions)
	if(!session) {
		res.status(401).json({status: "not authenticated"})
		return
	}
	var user = await getAuthUser(session!);

    var device = await prisma.device.findUnique({
		where: {
			id: req.query.deviceId?.toString()
		},
        include: {
            project: true
        }
	})

	if(!await isMember(user!, device?.project!) || !await onlyAdmin(session!)) {
		res.status(403).json({status: "You are no Member of this Project"})
		return
	}

	if(req.method == "GET") {
		/*
			Returns the Project including ProjectMembers, Types and Devices
		*/

		var deviceList = await prisma.device.findUnique({
			where: {
				id: device?.id
			},
			include: {
				instances: true
			}
		})

		res.status(200).json(deviceList!);
		return
	}

	else if(req.method == "PUT") {
		/* 
			Updates the current Project
		*/

		if(await isMaintainer(user!,  device?.project!) || await onlyAdmin(session!)) {
			var data = await prisma.device.update({
				where: {
					id: device?.id
				},
				data: {
					name: req.body.name
				}
			})

			res.status(200).json(data)
			return
		}
		else {
			res.status(403).json({ status: 'You are not Allowed to Update this Project' });
			return
		}
	}

	else if(req.method == "DELETE") {
		/*
			Not implemented yet
		*/

		res.status(501).json({status: "not implemented"})
		return
	}

	else {
	  res.status(405).json({status: "unsupported method"})
	  return
	}
}

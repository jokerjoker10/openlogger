
import Prisma from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next'
import { unstable_getServerSession } from 'next-auth';
import prisma from '../../../../lib/prisma';
import { getAuthUser, isMaintainer, isMember, onlyAdmin } from '../../../../lib/usertools';
import { authOptions } from '../../auth/[...nextauth]';

type Data = {
  status: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Array<Prisma.Device> | Prisma.Device>
) {
	var session = await unstable_getServerSession(req, res, authOptions)
	if(!session) {
		res.status(401).json({status: "not authenticated"})
		return
	}
	var user = await getAuthUser(session!);

    var project = await prisma.project.findUnique({
		where: {
			id: req.query.projectId?.toString()
		}
	})

	if(!await isMember(user!, project!) || !await onlyAdmin(session!)) {
		res.status(403).json({status: "You are no Member of this Project"})
		return
	}
    
	if(req.method == "GET") {
		/*
			Returns the Project including ProjectMembers, Types and Devices
		*/

		var device = await prisma.device.findMany({
			where: {
				project: {
                    id: project?.id
                }
			}
		})

		res.status(200).json(device!);
		return
	}

    if(req.method == "POST") {
        /*
            Creates a new device on this Project
        */

        if(await isMaintainer(user!, project!) || await onlyAdmin(session!)) {
            var new_device = await prisma.device.create({
                data: {
                    name: req.body.name,
                    project: {
                        connect: {
                            id: project?.id
                        }
                    }
                }
            })

            res.status(200).json(new_device)
            return
        }
        else {
            res.status(403).json({ status: 'You are not allowed to Create a Device on this Project' });
            return
        }
    }

	else {
	  res.status(405).json({status: "unsupported method"})
      return
	}
}

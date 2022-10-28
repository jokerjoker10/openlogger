
import Prisma from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next'
import { unstable_getServerSession } from 'next-auth';
import prisma from '../../../../../../lib/prisma';
import { getAuthUser, isMaintainer, isMember, onlyAdmin } from '../../../../../../lib/usertools';
import { authOptions } from '../../../../auth/[...nextauth]';

type Data = {
  status: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Prisma.Message | Array<Prisma.Message>>
) {
	var session = await unstable_getServerSession(req, res, authOptions)
	if(!session) {
		res.status(401).json({status: "not authenticated"})
        return;
	}
	var user = await getAuthUser(session!);

    var instance = await prisma.instance.findUnique({
		where: {
			id: req.query.deviceId?.toString()
		},
        include: {
            device: {
                include: {
                    project: true
                }
            }
        }
	})

	if(!await isMember(user!, instance?.device?.project!) || !await onlyAdmin(session!)) {
		res.status(403).json({status: "You are no Member of this Project"})
        return;
	}

	if(req.method == "GET") {
		/*
			Returns the Project including ProjectMembers, Types and Devices
		*/

        var where: any = {
            instance: {
                id: instance?.id
            }
        }

        var order: Prisma.Prisma.SortOrder = 'desc';
        if(Object.keys(req.query).includes("order")) {
            order = req.query.order?.toString() == 'desc' ? 'desc' : 'asc';
        }
        var skip: number = 0;
        if(Object.keys(req.query).includes("skip")) {
            skip = +req.query.skip!;
        }
        var take: number = 50;
        if(Object.keys(req.query).includes("take")) {
            take = +req.query.take!;
        }
        if(Object.keys(req.query).includes("type")) {
            where["type"] = {
                id: req.query.type?.toString()!
            }
        }
        if(Object.keys(req.query).includes("from")) {
            where["timestamp"] = {
                gte: new Date(req.query.from?.toString()!)
            }
        }
        if(Object.keys(req.query).includes("until")) {
            where["timestamp"] = {
                lt: new Date(req.query.type?.toString()!)
            }
        }

		var datalist = await prisma.message.findMany({
			where: where,
            orderBy: {
                timestamp: order
            },
            skip: skip,
            take: take
		})

		res.status(200).json(datalist!);
        return;
	}

	else {
	  res.status(405).json({status: "unsupported method"})
      return;
	}
}

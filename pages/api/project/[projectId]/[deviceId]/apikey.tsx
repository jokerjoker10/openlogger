
import Prisma from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next'
import { unstable_getServerSession } from 'next-auth';
import { genHash } from '../../../../../lib/key';
import prisma from '../../../../../lib/prisma';
import { getAuthUser, isMaintainer, isMember, onlyAdmin } from '../../../../../lib/usertools';
import { authOptions } from '../../../auth/[...nextauth]';

type Data = {
  status: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Prisma.ApiKey & {token: string} | Prisma.ApiKey | Array<Prisma.ApiKey>>
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

		var datalist = await prisma.apiKey.findMany({
			where: {
				device: {
                    id: device?.id
                }
			}
		})

		res.status(200).json(datalist!);
		return
	}

	else if(req.method == "POST") {
		/* 
			Updates the Api Key (can only change active State)
		*/

		if(await isMaintainer(user!,  device?.project!) || await onlyAdmin(session!)) {

            // generate the api key
			var token = crypto.randomUUID()
			var key = await genHash(token)

			var data = await prisma.apiKey.create({
				data: {
					key: key,
					name: req.body.name,
                    device: {
                        connect: {
                            id: device?.id
                        }
                    }
				}
			})

			var dataAndToken: any = data
			dataAndToken["token"] = token

			res.status(200).json(dataAndToken)
			return
		}
		else {
			res.status(403).json({ status: 'You are not Allowed to Create Apikeys on this Project' });
			return
		}
	}

	else if(req.method == "PUT") {
		/* 
			Updates the Api Key (can only change active State)
		*/

		if(await isMaintainer(user!,  device?.project!) || await onlyAdmin(session!)) {
			var data = await prisma.apiKey.update({
				where: {
					id: req.body.id
				},
				data: {
					active: req.body.active
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

	else {
	  res.status(405).json({status: "unsupported method"})
	  return
	}
}

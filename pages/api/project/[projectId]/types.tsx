
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
  res: NextApiResponse<Data | Array<Prisma.Type> | Prisma.Type>
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
			Returns the members of the Project Project including ProjectMembers, Types and Devices
		*/

		var typelist = await prisma.type.findMany({
			where: {
				project: {
					id: project?.id
				}
			}
		})

		res.status(200).json(typelist!);
		return
	}

	else if(req.method == "POST") {
		/*
			Creates a new Project Memebership Object 
		*/

		if(await isMaintainer(user!, project!) || await onlyAdmin(session!)) {
			var type = await prisma.type.create({
				data: {
					name: req.body.name,
                    project: {
                        connect: {
                            id: project?.id
                        }
                    }
				}
			})
			
			res.status(200).json(type)
			return
		}
		else {
			res.status(403).json({ status: 'You are not Allowed to Create a Type on this Project' });
			return
		}
	}

	else if(req.method == "PUT") {
		/* 
			Updates the current Project
		*/

		if(await isMaintainer(user!, project!) || await onlyAdmin(session!)) {

			var type = await prisma.type.update({
				where: {
					id: req.body.id
				},
				data: {
					name: req.body.name
				}
			})

			res.status(200).json(type)
			return
		}
		else {
			res.status(403).json({ status: 'You are not Allowed to update a Type on this Project' });
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

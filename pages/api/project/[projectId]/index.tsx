
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
  res: NextApiResponse<Data | Prisma.Project>
) {
	var session = await unstable_getServerSession(req, res, authOptions)
	if(!session) {
		res.status(401).json({status: "not authenticated"})
		return
	}
	var user = await getAuthUser(session);

	
    var project = await prisma.project.findUnique({
		where: {
			id: req.query.projectId?.toString()
		}
	})
	
	if(project == undefined){
		res.status(400).json({status: "project not found"})
		return
	}

	if(!await isMember(user!, project!) && !await onlyAdmin(session)){
		res.status(403).json({status: "You are no Member of this Project"})
		return
	}

	if(req.method == "GET") {
		/*
			Returns the Project including ProjectMembers, Types and Devices
		*/

		project = await prisma.project.findUnique({
			where: {
				id: project?.id
			},
			include: {
				projectMembers: {
					include: {
						user: true
					}
				},
				types: true,
				devices: true
			}
		})

		res.status(200).json(project!);
		return
	}

	else if(req.method == "PUT") {
		/* 
			Updates the current Project
		*/

		if(await isMaintainer(user!, project!) || await onlyAdmin(session!)) {
			project = await prisma.project.update({
				where: {
					id: project?.id
				},
				data: {
					name: req.body.name
				}
			})

			res.status(200).json(project)
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

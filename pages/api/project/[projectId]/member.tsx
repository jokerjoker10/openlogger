
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
  res: NextApiResponse<Data | Array<Prisma.ProjectMember> | Prisma.ProjectMember>
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
			Returns the members of the Project Project including ProjectMembers, Types and Devices
		*/

		var memberlist = await prisma.projectMember.findMany({
			where: {
				project: {
					id: project?.id
				}
			}
		})

		res.status(200).json(memberlist!);
		return
	}

	else if(req.method == "POST") {
		/*
			Creates a new Project Memebership Object 
		*/
		if(!await isMaintainer(user!, project!) || !await onlyAdmin(session!)) {
			if(!(req.body.role == "VIEWER" || req.body.role == "MAINTAINER")){
				res.status(400).json({status: "Role must be VIEWER or MAINTAINER"})
				return
			}

			var member = await prisma.projectMember.create({
				data: {
					user: {
						connect: {
							id: req.body.userId
						}
					},
					project: {
						connect: {
							id: project?.id
						}
					},
					role: req.body.role
				}
			})

			res.status(200).json(member)
			return
		}
		else {
			res.status(403).json({ status: 'You are not Allowed to Create a Project Membership Object on this Project' });
			return
		}
	}

	else if(req.method == "PUT") {
		/* 
			Updates the current Project
		*/

		if(!await isMaintainer(user!, project!) || !await onlyAdmin(session!)) {

			if(!(req.body.role == "VIEWER" || req.body.role == "MAINTAINER")){
				res.status(400).json({status: "Role must be VIEWER or MAINTAINER"})
				return
			}

			var member = await prisma.projectMember.update({
				where: {
					id: req.body.id
				},
				data: {
					role: req.body.role
				}
			})

			res.status(200).json(member)
			return
		}
		else {
			res.status(403).json({ status: 'You are not Allowed to Update the Project Membership on this Project' });
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


import Prisma from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next'
import { unstable_getServerSession } from 'next-auth';
import prisma from '../../../../lib/prisma';
import { getAuthUser, isMaintainer, isMember, onlyAdmin } from '../../../../lib/usertools';
import { authOptions } from '../../auth/[...nextauth]';

type Data = {
  status: string
}

type Role = {
    role: "VIEWER" | "MAINTAINER"
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Role>
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
			Returns the role of the Current User on the given Project
		*/

		var member = await prisma.projectMember.findFirst({
			where: {
                project: {
                    id: project?.id,
                },
                user: {
                    id: user?.id
                }
			}
		})

		res.status(200).json({role: member?.role!});
		return
	}

	else {
	  res.status(405).json({status: "unsupported method"})
	  return
	}
}

import Prisma from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next'
import { unstable_getServerSession } from 'next-auth';
import prisma from '../../../lib/prisma';
import { getAuthUser, onlyAdmin } from '../../../lib/usertools';
import { authOptions } from '../auth/[...nextauth]';

type Data = {
  status: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Array<Prisma.Project> | Prisma.Project>
) {
  var session = await unstable_getServerSession(req, res, authOptions)
  if(!session) {
    res.status(401).json({status: "not authenticated"})
		return
  }
  var user = await getAuthUser(session!);

  if(req.method == "GET") {
    /*
      Returns a List of the Users projects.
      If the user is an Admin all Projects will be returned.
    */

    var projectList: Array<Prisma.Project>;
    if(!await onlyAdmin(session!)) {
      projectList = await prisma.project.findMany({
        where: {
          projectMembers: {
            some: {
              user: {
                id: user?.id
              }
            }
          }
        }
      })
    }
    else {
      projectList = await prisma.project.findMany({})
    }

    res.status(200).json(projectList)
		return
  }

  else if(req.method == "POST") {
    /*
      Creates a new Project with the User as Member (Maintainer)
    */
    
    var project: Prisma.Project = await prisma.project.create({
      data: {
        name: req.body.name,
        projectMembers: {
          create: {
            user: {
              connect: {
                id: user?.id
              }
            },
            role: 'MAINTAINER'
          }
        }
      }
    })

    res.status(200).json(project)
		return
  }

  else {
    res.status(405).json({status: "unsupported method"})
		return
  }
}

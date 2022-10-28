import Prisma from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { checkHash } from '../../../lib/key'
import prisma from '../../../lib/prisma'

type Data = {
  status: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Array<Prisma.Type>>
) {

    if(!req.headers["x-instance-key"]){
        res.status(400).json({status: "An x-instance-key must be set"})
        return;
    }

    if(!req.headers["x-api-key"]){
        res.status(400).json({status: "The x-api-key must be set"})
        return;
    }

    if(req.method == "GET") {
        /*
            Creates a new Instance
        */
       

        var instance = await prisma.instance.findUnique({
            where: {
                key: req.headers["x-instance-key"]?.toString()
            },
            include: {
                device: true
            }
        })
        
        var apikey = await prisma.apiKey.findFirst({
            where: {
                device: {
                    id: instance?.device.id
                }
            }
        })
        
        if(!await checkHash(req.headers["x-api-key"]?.toString()!, apikey?.key!)) {
            res.status(400).json({status: "Instance key does not match api key"})
            return;
        }

        // get types
        var typelist = await prisma.type.findMany({
            where: {
                project: {
                    devices: {
                        some: {
                            instances: {
                                some: {
                                    id: instance?.id
                                }
                            }
                        }
                    }
                }
            }
        })

        res.status(200).json(typelist!)
        return;
    }

	else {
        res.status(405).json({status: "unsupported method"})
        return;
	}
}

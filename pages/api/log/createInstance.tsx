import Prisma from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next'
import { checkHash } from '../../../lib/key';
import prisma from '../../../lib/prisma';

type Data = {
  status: string
}

type InstanceKey = {
    key: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | InstanceKey>
) {
    if(req.method == "POST") {
        /*
            Creates a new Instance
        */

        if(req.headers["x-instance-key"]){
            res.status(400).json({status: "An x-instance-key Header is already set"})
            return;
        }

        // check api key
        var apikeyList = await prisma.apiKey.findMany({
            where: {
            },
            include: {
                device: true
            }
        }) 
        var apikey: Prisma.ApiKey & {device: Prisma.Device} = apikeyList[0]
        var apikeyFound = false
        apikeyList.filter(async(x) => {
            if(await checkHash(req.headers["x-api-key"]?.toString()!, x.key)){
                apikey = x
                apikeyFound = true
                return
            }
        })

        if(!apikeyFound){
            res.status(400).json({status: "Unauthorized"})
            return;
        }


        // generate the instance key
        do {
            var key = crypto.randomUUID();
            var count = await prisma.instance.aggregate({
                where: {
                    key: key
                },
                _count: true
            })
        } while(count._count != 0)

        // create new instance
        var instance = await prisma.instance.create({
            data: {
                key: key,
                device: {
                    connect: {
                        id: apikey.device.id
                    }
                }
            }
        })

        res.status(200).json({key: instance.key})
        return;
    }

	else {
        res.status(405).json({status: "unsupported method"})
        return;
	}
}

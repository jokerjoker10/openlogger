import Prisma from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

type Data = {
  status: string;
};

export default async function handler(
  	req: NextApiRequest,
  	res: NextApiResponse<Data>
) {
  	if (!req.headers["x-api-key"]) {
    	res.status(400).json({ status: "The x-api-key must be set" });
		return;
  	}

  	if (!req.headers["x-instance-key"]) {
    	res.status(400).json({ status: "An x-instance-key must be set" });
		return;
  	}

  	if (req.method == "POST") {
    	/*
			Creates a new Instance
		*/

    	var apikey = await prisma.apiKey.findUnique({
    	  	where: {
	        	key: req.headers["x-api-key"]?.toString(),
      		},
      		include: {
        		device: true,
      		},
    	});

    	var instance = await prisma.instance.findUnique({
      		where: {
	        	key: req.headers["x-instance-key"]?.toString(),
      		},
      		include: {
        		device: true,
      		},
    	});

    	if (
      		apikey == undefined ||
      		instance == undefined ||
      		apikey?.deviceId != instance?.deviceId
    	) {
	      	res.status(400).json({ status: "Instance key does not match api key" });
			  return;
    	}

    	var type = await prisma.type.findFirst({
      		where: {
	        	project: {
          			devices: {
            			some: {
              				instances: {
                				some: {
                  					id: instance?.id,
                				},
              				},
            			},
	          		},
        		},
				name: req.body.type
	      	},
    	});



		// check if the type is available
		if(!type){
			res.status(400).json({status: "Type does not exists in the project"})
			return;
		}

		await prisma.message.create({
			data: {
				data: req.body.data,
				type: {
					connect: {
						id: type?.id
					}
				},
				instance: {
					connect: {
						id: instance?.id
					}
				}
			}
		})

    	res.status(200).json({status: "logged"});
		return;
	} else {
    	res.status(405).json({ status: "unsupported method" });
		return;
  	}
}

import Prisma from '@prisma/client';
import { Session } from 'next-auth';
import prisma from './prisma'

export async function getAuthUser(session: Session) {
    /*
        Checks if the user is authenticated and
        returns the user object from the database 
    */
    if(!session) return null;

    var user = await prisma.user.findUnique({
        where: {
            email: session.user?.email!
        }
    });

    return user;
}

export async function onlyAdmin(session: Session):Promise<boolean> {
    /*
        Tests if user is Admin. Returns boolean
        If th api key is set to true it will just return a bool.
    */
    return new Promise((resolve, reject) => {
        if(session) {
            resolve(false)
        }
        getAuthUser(session)
        .then((user) => {
            if(user == null) {
                resolve(false); 
                return;
            }
            
            if(user.admin) {
                resolve(true);
                return;
            }
            resolve(false); 
            return;
        })
        .catch(() => {
            resolve(false); 
        })
    })
}

export async function isMaintainer(user: Prisma.User, project: Prisma.Project): Promise<boolean> {
    /*
        Tests if user is a Maintaier of the current Project
    */
    return new Promise((resolve, reject) => {
        prisma.projectMember.findFirst({
            where: {
                user: {
                    id: user.id
                },
                project: {
                    id: project.id
                },
                role: 'MAINTAINER'
            }
        })
        .then((member) => {
            member != undefined ? resolve(false) : resolve(true)
        })
        .catch(() => {

        })
    })
}

export function isMember(user: Prisma.User, project: Prisma.Project): Promise<boolean> {
    /*
        Tests if user is a Maintaier of the current Project
    */
    return new Promise((resolve, reject) => {
        if(!user) {
            reject("User cannot be null")
        }

        prisma.projectMember.findFirst({
            where: {
                user: {
                    id: user.id
                },
                project: {
                    id: project.id
                }
            }
        })
        .then((member) => {
            member != undefined ? resolve(true) : resolve(true)
        })
        .catch(() => {

        })
        
    })
}

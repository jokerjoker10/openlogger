import bcrypt from "bcrypt"

export function genHash(token: string){
    return bcrypt.hash(token, 10)
}

export function checkHash(token: string, hash: string){
    return bcrypt.compare(token, hash)
}

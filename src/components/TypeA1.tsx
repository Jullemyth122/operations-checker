// variables.ts
import { useEffect, useState } from 'react';
import { Role, makeUser } from '../typesStructure/typeA';
import type { User, UserWithProfile } from '../typesStructure/typeA';

let currentUser: User = makeUser('Alice');   // inferred User from makeUser


const TypeA1 = () => {
    console.log(Role)

    // const [admin, setAdmin] = useState<User | null>(null)
    const [admin, setAdmin] = useState<UserWithProfile | null>(null)

    useEffect(() => {
        function makeAdmin() {
            const globalId = Math.random().toString(36).slice(5)
            return {
                id:globalId ,name: "Myth Xenex", role: Role.Admin
            }
        }

        function makeAdminWithProfile() {
            const user = makeAdmin()
            
            return {
                ...user, profile:{ userId: user.id, bio: "Dildo", interests:["Dick","Anal"] }
            }
        }

        setAdmin(makeAdminWithProfile())
    }, [])

    return (
        <div>
            {/* { user?.name } */}
            {currentUser?.name} <br />
            {currentUser?.id} <br />
            {currentUser?.role} <br />

            {admin?.name} <br />
            {admin?.id} <br />
            {admin?.role} <br />
            {admin?.profile?.bio} <br />
            {admin?.profile?.interests.map((a => a))} <br/>
            {admin?.profile?.userId} <br />


        </div>
    )
}

export default TypeA1
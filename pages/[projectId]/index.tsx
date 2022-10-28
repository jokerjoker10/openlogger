import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../../styles/Home.module.css'
import { useSession, getSession, signIn, signOut } from "next-auth/react"
import Router, { useRouter } from 'next/router'
import { redirect } from 'next/dist/server/api-utils'
import { MdMenu, MdLogout, MdSettings, MdAdd, MdDashboard, MdList, MdPeople, MdStorage } from 'react-icons/md'
import { IoMdPricetags } from 'react-icons/io'
import { useEffect, useState } from 'react'
import Prisma, { ProjectMember } from '@prisma/client'
import axios from 'axios'

const Home: NextPage = () => {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [projectList, setProjectList] = useState<Array<Prisma.Project>>()
  const [currentProject, setCurrentProject] = useState<Prisma.Project & {projectMembers: Array<ProjectMember & {user: Prisma.User}>, types: Array<Prisma.Type>, devices: Array<Prisma.Device>}>()
  const [userrole, setUserrole] = useState<"VIEWER" | "MAINTAINER">();

  const [listType, setListType] = useState<"CARDS" | "LIST">("CARDS")
  const [mainConetentType, setMainContentType] = useState<"ADDDEVICE" | "DEVICES" | "MEMBERS" | "TYPES">("DEVICES")

  const {data: session, status} = useSession()

  const router = useRouter()

  useEffect(() => {
    if(screen.width >= 600){
      setShowMenu(true)
      setIsMobile(true)
    }
  }, [])

  useEffect(() => {
    axios.get("/api/project/")
    .then((data) => {
      setProjectList(data.data)
    })
    .catch((error) => {

    })
  }, [])

  useEffect(() => {
    if(router.query.projectId != undefined){
      getCurrentProject()
    }
  }, [router])
  
  function getCurrentProject() {
    axios.get("/api/project/" + router.query.projectId + "/")
    .then((data) => {
      setCurrentProject(data.data)
    })
    .then(() => {
      axios.get("/api/project/" + router.query.projectId + "/userrole")
      .then((data) => {
        setUserrole(data.data.role);
      })
      .catch((error) => {

      })
    })
    .catch((error) => {

    })
  }

  function updateUserRole(userId: string, role: string){
    axios.put("/api/project/" + router.query.projectId + "/member", {
      id: userId,
      role: role
    })
    .then(() => {
      getCurrentProject()
    })
    .catch(() => {

    })
  }

  if(status === "loading"){
    return(<p>Loading</p>)
  }
  if(status === "unauthenticated"){
    signIn()
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Open source Logging Service" />
        <link rel="icon" href="/favicon.ico" />

      </Head>

      <nav>
        <div className={styles.card} style={{width: "auto", display: "flex", justifyContent: "space-between"}}>
          <div style={{display: "flex", justifyContent: "space-between", minWidth: "25%"}}>
            <div className={styles.clickable} onClick={() => setShowMenu(!showMenu)}> <MdMenu size="2em" /></div>
            <p>OpenLogger</p>
          </div>
          <div style={{display: "flex", justifyContent: "flex-end", minWidth: "25%"}}>
            <div className={styles.clickable}> <MdSettings size="2em" /></div>
            <div className={styles.clickable} onClick={() => signOut()}> <MdLogout size="2em" /></div>
          </div>
        </div>
      </nav>

      <main className={styles.main} style={{
        display: "flex", 
        justifyContent: "flex-start", 
        alignItems: "flex-start", 
        width: "100%",
        flexDirection: "row"
        }}>
        {showMenu ? (
          <div className={styles.sidemenue}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "row"}}>
              Projects 
              <div className={styles.clickable} onClick={() => Router.push("/createProject")}>
                <div className={styles.card} style={{padding: "0.5em", margin: 0}}>
                  Add Project<MdAdd size="1em"/>
                </div>
              </div>
            </div>
            
            <div style={{
              marginTop: "1em",
              paddingTop: "1em",
              boxShadow: "0px -1px 1px 0px rgba(41,78,121,0.1)",
              overflowY: "scroll",
              overflowBlock: "auto"
            }}>

              {projectList?.map((element, key) => (
                <div key={key} className={styles.clickable} style={{margin: "1px"}} onClick={() => Router.push("/" + element.id)}><span>{element.name}</span></div>
              ))}

            </div>
          </div>
        ) : <></>}

        <div className={styles.card} style={{width: "inherit"}}>
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <h1>{currentProject?.name}</h1>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              {mainConetentType != "ADDDEVICE" ? (
                <div className={styles.card} style={{padding: "0.5em", display: "flex", alignItems: "center"}}>
                  <MdDashboard size={"2em"} title="cards" className={styles.clickable} onClick={() => setListType("CARDS")}/>
                  <MdList size={"2em"} title="List" className={styles.clickable} onClick={() => setListType("LIST")}/>
                </div>
              ) : <></>}
              <div className={styles.card} style={{padding: "0.5em", display: "flex", alignItems: "center", flexWrap: "wrap"}}>
                {userrole == "MAINTAINER" ? (<MdAdd  size={"2em"} title="Add a Device" className={styles.clickable} onClick={() => setMainContentType("ADDDEVICE")}/>): <></>}
                <MdStorage size={"2em"} title="Devices" className={styles.clickable} onClick={() => setMainContentType("DEVICES")}/>
                <MdPeople size={"2em"} title="Project Members" className={styles.clickable} onClick={() => setMainContentType("MEMBERS")}/>
                <IoMdPricetags size={"2em"} title="Log Types" className={styles.clickable} onClick={() => setMainContentType("TYPES")}/>
              </div>
            </div>
          </div>

          {mainConetentType == "DEVICES" ? (
          <div>
            <h2>Devices:</h2>
            {currentProject?.devices.map((element, key) => (
              <div>
                {listType == "CARDS" ? (
                  <div className={styles.card}>{element.name}</div>
                ) : <></>}
                {listType == "LIST" ? (
                  <div>{element.name}</div>
                ) : <></>}
              </div>
            ))}
          </div>
          ) : <></>}
          {mainConetentType == "ADDDEVICE" ? (
            <div>
              <h2>Add a new Device:</h2>
              <input placeholder="Name of the Device"></input>
              <button>Add Device</button>
            </div>
          ): <></>}
          {mainConetentType == "MEMBERS" ? (
            <div>
              <h2>The Members of this Project:</h2>
              {listType == "CARDS" ? (
                <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-evenly", alignContent: "space-around"}}>
                  {currentProject?.projectMembers.map((element, key) => (
                    <div key={key}>
                      <div className={styles.card}>
                        <p>{element.user.email}</p>
                        {userrole == "MAINTAINER" ? (
                          <select defaultValue={element.role} onChange={(e) => updateUserRole(element.id, e.target.value)}>
                            <option value={"VIEWER"}>VIEWER</option>
                            <option value={"MAINTAINER"}>MAINTAINER</option>
                          </select>
                        ):(
                          <label>{element.role}</label>
                        )}
                      </div>
                    </div>
                  ))}
                  </div>
                ) : <></>}
              {listType == "LIST" ? (
                <table>
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProject?.projectMembers.map((element, key) => (
                      <tr key={key}>
                        <td>{key+1}</td>
                        <td>{element.user.email}</td>
                        <td>
                        {userrole == "MAINTAINER" ? (
                          <select defaultValue={element.role} onChange={(e) => updateUserRole(element.id, e.target.value)}>
                            <option value={"VIEWER"}>VIEWER</option>
                            <option value={"MAINTAINER"}>MAINTAINER</option>
                          </select>
                        ):(
                          <label>{element.role}</label>
                        )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ): <></>}
            </div>
          ): <></>}
          {mainConetentType == "TYPES" ? (
            <div>
              <h2>The Types of this Project:</h2>
            </div>
          ): <></>}
        </div>
      </main>

      <footer className={styles.footer}>
          <span className={styles.logo}>
            &copy; 2022 Openlogger
          </span>
      </footer>
    </div>
  )
}

export default Home

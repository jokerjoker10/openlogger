import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { useSession, getSession, signIn, signOut } from "next-auth/react"
import Router from 'next/router'
import { redirect } from 'next/dist/server/api-utils'
import { MdMenu, MdLogout, MdSettings, MdAdd } from 'react-icons/md'
import { useEffect, useState } from 'react'
import Prisma from '@prisma/client'
import axios from 'axios'

const Home: NextPage = () => {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [projectList, setProjectList] = useState<Array<Prisma.Project>>()
    const [projectName, setProjectName] = useState<string>()
  const {data: session, status} = useSession()

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
  
  function createNewProject(){
    axios.post("/api/project/", {name: projectName})
    .then((data) => {
        
        Router.push("/" + data.data.id)        
    })
    .catch((error) => {

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
            </div>
            
            <div style={{
              marginTop: "1em",
              paddingTop: "1em",
              boxShadow: "0px -1px 1px 0px rgba(41,78,121,0.1)",
              overflowY: "scroll",
              overflowBlock: "auto"
            }}>

              {projectList?.map((element, key) => (
                <div key={key} className={styles.clickable} onClick={() => Router.push("/" + element.id)}>{element.name}</div>
              ))}

            </div>
          </div>
        ) : <></>}

        <div className={styles.card} style={{width: "inherit"}}>
            <h1>Create a new Project</h1>
            <input type="text" placeholder='Name' onChange={e => setProjectName(e.target.value)}></input>
            <button type="submit" onClick={() => createNewProject()}>Create Project</button>
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

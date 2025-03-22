import React, { useEffect, useState } from 'react'
import "./App.css"
import Editor from "@monaco-editor/react";
import io from "socket.io-client";
const socket=io("http://localhost:5000");

const App = () => {
  const [language,setLanguage]=useState("javascript");
  const [code,setCode]=useState("//start your code here");
  const [roomId,setRoomId]=useState("");
  const [userName,setUserName]=useState("");
  //to identify the user in the room or not
  const [joined,setJoined]=useState(false);
  const [copySuccess,setCopySuccess]=useState("");
  const [users,setUsers]=useState([]);
  const [typing,setTyping]=useState(false);

  useEffect(()=>{
    socket.on("userJoined",(users)=>{
      setUsers(users);
    });
    //code update event listening
    socket.on("codeUpdate",(newCode)=>{
      setCode(newCode);
    });

    socket.on("userTyping",(user)=>{
      setTyping(`${user.slice(0,8)}... Typing`);
      setTimeout(()=>setTyping(""),2000);
    });

    socket.on("languageUpdate",(newLanguage)=>{
      setLanguage(newLanguage);
    })
    //to prevent it run again and again, we will give the clean up
    return ()=>{
      socket.off("userTyping");
      socket.off("userJoined");
      socket.off("codeUpdated");
      socket.off("languageUpdated");
    }
  },[])

  const joinRoom=async()=>{
    console.log("RoomId",roomId,"username",userName);

    if(roomId && userName){
      socket.emit("join",{roomId,userName});
      setJoined(true);
    }
  }

  const leaveRoom=()=>{
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("//start your code here");
    setLanguage("javascript");
  }
  const copyRoomId=()=>{
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied");
    setTimeout(()=>{
      setCopySuccess("")
    },2000)
  } 
  const handleCodeChange=(newCode)=>{
    setCode(newCode);
    //emit the new updated code
    socket.emit("codeChange",{roomId,code:newCode});
    socket.emit("typing",{roomId,userName});

  }
  const handleLanguageChange=(e)=>{
    
    const newLanguage=e.target.value;
    setLanguage(newLanguage);
    
    socket.emit("languageChange",{roomId,language:newLanguage});
  }
  useEffect(()=>{
    
    const handleBeforeUnload=()=>{
      socket.emit("leaveRoom");
    }

    window.addEventListener("beforeunload",handleBeforeUnload);

    //write cleanup also
    return ()=>{
      window.removeEventListener("beforeunload",handleBeforeUnload);
    }

  },[]);
  if(!joined){
    return <div className='join-container'>
        <div className="join-form">
          <h1>Join Code Room</h1>
          <input type="text" placeholder='Room Id' value={roomId} onChange={(e)=>setRoomId(e.target.value)}  />

          <input type="text" placeholder='Username' value={userName} onChange={(e)=>setUserName(e.target.value)}  />

          <button onClick={joinRoom}>Join Room</button>
        </div>
    </div>
  }

  return (
    <div className='editor-container'>
      <div className='sidebar'>
        <div className="room-info">
          <h2>Code Room : {roomId}</h2>
          <button className='copy-button' onClick={copyRoomId}>Copy room id</button>
          {
            copySuccess && <span className='copy-success'>{copySuccess}</span>
          }
        </div>
        <h3>Users in the room </h3>
        <ul>
          {
            users.map((user,index)=>{
              return <li key={index}>{user.slice(0,8)}</li>
            })
          }
        </ul>
        {/* For typing or not */}
        <p className="typing-indicator">{typing}</p>

        {/* Runtime for languages: npm i @monaco-editor/react */}

        <select className='language-selector' name="" id="" value={language} onChange={handleLanguageChange}>
          <option value="javascript">Javascript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          
        </select>

        {/* Leave room */}
        <button className='leave-button' onClick={leaveRoom}>Leave Room</button>

      </div>
      {/* Editor */}

      <Editor
        height={"100%"}
        defaultLanguage={language}
        language={language}
        value={code}
        onChange={handleCodeChange}
        theme='vs-dark'
        options={
          {
            minimap:{enabled:false},
            fontSize:14
          }
        }
      />
      
    </div>
  )
}

export default App

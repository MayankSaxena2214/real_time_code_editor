import express from "express";
import http from "http";
import {Server} from "socket.io";
import path from "path"

const app=express();
const server=http.createServer(app);

const io=new Server(server,{ 
    cors:{
        origin:"*"
    }
});
const rooms=new Map();

io.on("connection",(socket)=>{
    console.log(`User connected ${socket.id}`);
    
    let currentRoom=null;
    let currentUser=null;

    //make instance
    socket.on("join",({roomId,userName})=>{
        //user want to join the room
        //remove the previous room if already connected
        if(currentRoom){
            socket.leave(currentRoom);
            rooms.get(currentRoom).delete(currentUser); 
            //notify users
            io.to(currentRoom).emit("userJoined",Array.from(rooms.get(currentRoom)));

        }
        currentRoom=roomId;
        currentUser=userName;

        socket.join(roomId);
        
        if(!rooms.has(roomId)){
            rooms.set(roomId,new Set());
        }
        rooms.get(roomId).add(userName);
        //notify other user
        io.to(roomId).emit("userJoined",Array.from(rooms.get(currentRoom)));
        console.log("User joined room",roomId,userName)
    });

    socket.on("codeChange",({roomId,code})=>{
        socket.to(roomId).emit("codeUpdate",code);
    });

    socket.on("leaveRoom",()=>{
        if(currentRoom && currentUser){
            rooms.get(currentRoom).delete(currentUser);
            //sends the updated users list
            io.to(currentRoom).emit("userJoined",Array.from(rooms.get(currentRoom)));
            socket.leave(currentRoom);

            currentRoom=null;
            currentUser=null;
        }
    });
    socket.on("typing",({roomId,userName})=>{
        socket.to(roomId).emit("userTyping",userName);
    })
    socket.on("disconnect",()=>{
        if(currentRoom && currentUser){
            rooms.get(currentRoom).delete(currentUser);
            //sends the updated users list
            io.to(currentRoom).emit("userJoined",Array.from(rooms.get(currentRoom)));
        }
        console.log("User is disconnected");
    });
    socket.on("languageChange",({roomId,language})=>{
        io.to(roomId).emit("languageUpdate",language);
    })
})
const port=process.env.PORT || 5000;

const __dirname=path.resolve();
app.use(express.static(path.join(__dirname,"/frontend/dist")));
app.get("*",(req,res)=>{
    res.sendFile(path.join(__dirname,"frontend","dist","index.html"));
})

server.listen(port,()=>{
    console.log(`Server is listening on the port ${port}`);
});
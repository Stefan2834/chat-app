import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react"
import '../app/globals.css'
import { TextField, Avatar, IconButton, Tooltip, CircularProgress, Button } from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import axios from "axios";
import io from 'socket.io-client';


const socket = io(process.env.NEXT_PUBLIC_SERVER, {
  transports: ['websocket']
});


export default function index({ messages }) {
  const { data: session } = useSession()
  const [messageData, setMessageData] = useState('')
  const [messagesState, setMessagesState] = useState(messages)
  const [loading, setLoading] = useState(false)
  const pageRef = useRef(1)
  const containerScrollRef = useRef()

  const containerScrollCallback = useCallback(node => {
    containerScrollRef.current = node;
    containerScrollRef.current.addEventListener("scroll", handleInfiniteScroll)
    containerScrollRef.current.scrollTop = containerScrollRef.current.scrollHeight
  }, []);

  const handleInfiniteScroll = () => {
    console.log(containerScrollRef.current.scrollTop + containerScrollRef.current.clientHeight, containerScrollRef.current.scrollHeight)
    if (containerScrollRef.current.scrollTop === 0 && !loading) {
      const scrollPx = containerScrollRef.current.scrollHeight;
      setLoading(true);
      const page = pageRef.current;
      axios.post(`${process.env.NEXT_PUBLIC_SERVER}/`, { page: page + 1 })
        .then((newMessages) => {
          if (newMessages.data.success) {
            setMessagesState(m => [...newMessages.data.messages, ...m]);
            containerScrollRef.current.scrollTop = scrollPx
          }
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          pageRef.current += 1
          setLoading(false);
        });
    }
  };



  useEffect(() => {
    setMessagesState(messages)

    socket.on('message', async (data) => {
      if (data.success) {
        setMessagesState((prevMessages) => [...prevMessages, data.message]);
      } else {
        console.log('Error receiving new message:', data.message);
      }
    });

    return () => {
      containerScrollRef.current.removeEventListener("scroll", handleInfiniteScroll)
      socket.disconnect();
    };
  }, [])

  useEffect(() => {
    const cont = containerScrollRef.current
    if (cont) {
      cont.scrollTop = cont.scrollHeight
    }
  }, [messagesState])

  const handleFormSubmit = async e => {
    setLoading(true)
    await e.preventDefault()
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const time = `${year}-${month}-${day} ${hour}:${minutes}`;
    const message = {
      user: session.user.name,
      email: session.user.email,
      message: messageData,
      photo: session.user.image,
      time: time
    }
    socket.emit('message', message);
    setMessageData('')
    containerScrollRef.current.scrollTop = containerScrollRef.current.scrollHeight + 10000
    setLoading(false)
  }


  if (session) {
    return (
      <div className="flex w-screen h-screen justify-center items-start relative">
        <div className="max-w-[700px] w-full relative">
          <div className="w-full max-w-[700px] h-16 bg-slate-300 font-semibold flex items-center justify-evenly z-10 fixed shadow-md">
            <div>{session.user.email}</div>
            <Button variant='outlined' onClick={() => signOut()}>Sign out</Button>
          </div>
          <div className="w-full bg-gradient-to-br from-slate-200 to-blue-200 overflow-scroll overflow-x-hidden scroll-container mt-16"
            ref={containerScrollCallback}
          >
            <div className="h-auto flex flex-col items-center justify-center">
              {messagesState.map((mess, index) => {
                if (mess.email === session.user.email) {
                  return (
                    <div className="flex justify-end w-full items-center m-3">
                      <div className="flex flex-col items-end justify-end m-2">
                        <div className="flex items-center justify-center">
                          <div className="font-extralight text-xs overflow-hidden">{mess.time}</div>
                          <div className="font-sm">{mess.user}</div>
                        </div>
                        <div className="bg-white p-1 rounded text-right shadow-sm" key={index}>{mess.message}</div>
                      </div>
                      <Avatar className="rounded-full mr-2 shadow-sm" src={mess.photo} width={35} height={35} alt='Profile picture' />
                    </div>
                  )
                } else {
                  return (
                    <div className="flex justify-start w-full items-center m-3" >
                      <Avatar className="rounded-full ml-2 shadow-sm" src={mess.photo} width={35} height={35} alt='Profile picture' />
                      <div className="flex flex-col items-start justify-end m-2">
                        <div className="flex items-center justify-center">
                          <div className="font-sm">{mess.user}</div>
                          <div className="font-extralight text-xs overflow-hidden">{mess.time}</div>
                        </div>
                        <div className="bg-white p-1 rounded shadow-sm" key={index}>{mess.message}</div>
                      </div>
                    </div>
                  )
                }
              })}
            </div>
          </div>
          <form onSubmit={e => { !loading ? handleFormSubmit(e) : e.preventDefault() }}
            className="flex items-center justify-between w-full bottom-0 h-16 bg-zinc-200 max-w-[700px] fixed"
          >
            <Avatar className="rounded-full mx-2" src={session.user.image} width={40} height={40} alt='Profile picture' />
            <TextField
              sx={{
                width: 'calc(100% - 50px)',
                maxWidth: '650px',
                position: 'fixed',
                bottom: '3px',
                marginLeft: '60px',
                paddingRight: '70px',
                backgroundColor: 'transparent',
              }} label="Type something..." variant="filled" className="w-100"
              inputProps={{
                maxLength: 100,
              }}
              value={messageData} required
              onChange={(e) => !loading && setMessageData(e.target.value)}
            />
            <Tooltip title="Send">
              <IconButton sx={{ position: 'absolute', right: '4px', height: '50px', width: '50px' }} type='submit'>
                {loading ? (
                  <CircularProgress
                    size={24}
                    sx={{
                      color: 'rgb(96, 165, 250)',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: '-12px',
                      marginLeft: '-12px',
                    }}
                  />
                ) : (
                  <SendIcon />
                )}
              </IconButton>
            </Tooltip>
          </form>
        </div>
      </div>
    )
  }
  return (
    <div className="flex w-screen items-center flex-col justify-center h-screen text-black">
      <div>Not signed in </div>
      <Button variant="outlined" className="mt-2" onClick={() => signIn()}>Sing in</Button>
    </div>
  )
}

export async function getServerSideProps() {
  try {
    const server = process.env.NEXT_PUBLIC_SERVER
    const response = await axios.post(`${server}/`, { page: 1 });
    if (response.data.success) {
      const messages = response.data.messages;
      return {
        props: {
          messages: messages,
        },
      };
    } else {
      return {
        props: {
          messages: []
        }
      }
    }
  } catch (err) {
    console.error(err);
    return {
      props: {
        messages: [],
      },
    };
  }
}
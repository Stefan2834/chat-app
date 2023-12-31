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


export default function Index({ messages, more }) {
  const { data: session } = useSession()
  const [messageData, setMessageData] = useState('')
  const [messagesState, setMessagesState] = useState(messages)
  const [loading, setLoading] = useState(false)
  const containerScrollRef = useRef()
  const messagesLengthRef = useRef(messages.length)
  const hasMoreMessages = useRef(more)

  const containerScrollCallback = useCallback(node => {
    containerScrollRef.current = node;
    containerScrollRef.current.addEventListener("scroll", handleInfiniteScroll)
    containerScrollRef.current.scrollTop = containerScrollRef.current.scrollHeight
  }, []);

  const handleInfiniteScroll = () => {
    const element = containerScrollRef.current
    if(element.scrollHeight - 50 <= Math.round(element.clientHeight - element.scrollTop) && hasMoreMessages.current) {
      element.scrollTop = Math.round(- element.scrollHeight + element.clientHeight) 
    }
    if (element.scrollHeight === Math.round(element.clientHeight - element.scrollTop) && !loading && hasMoreMessages.current) {
      setLoading(true);
      axios.post(`${process.env.NEXT_PUBLIC_SERVER}/`, { currentLength: messagesLengthRef.current })
        .then((newMessages) => {
          if (newMessages.data.success) {
            setMessagesState(m => [...m, ...newMessages.data.messages]);
            hasMoreMessages.current = newMessages.data.hasMoreMessages
          }
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    messagesLengthRef.current = messagesState.length
  }, [messagesState])


  useEffect(() => {
    setMessagesState(messages)

    socket.on('message', async (data) => {
      if (data.success) {
        setMessagesState((prevMessages) => [data.message, ...prevMessages])
        setTimeout(() => {
          if (containerScrollRef.current) {
            containerScrollRef.current.scrollTop = containerScrollRef.current.scrollHeight;
          }
        }, 0);
      } else {
        console.log('Error receiving new message:', data.message);
      }
    });

    return () => {
      containerScrollRef.current.removeEventListener("scroll", handleInfiniteScroll)
      socket.disconnect();
    };
  }, [])


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
    containerScrollRef.current.scrollTop = containerScrollRef.current.scrollHeight
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
          <div className="w-full flex flex-col-reverse items-end justify-start bg-gradient-to-br from-slate-200  to-blue-200 overflow-scroll overflow-x-hidden scroll-container mt-16"
            ref={containerScrollCallback}
          >
            <div className="h-auto w-full flex flex-col-reverse items-center justify-center">
              {messagesState.map((mess, index) => {
                if (mess.email === session.user.email) {
                  return (
                    <div className="flex justify-end w-full items-center m-3" key={index}>
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
                    <div className="flex justify-start w-full items-center m-3" key={index}>
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
              {hasMoreMessages.current ? (
                <div className="w-full h-16 opacity-70 flex items-center justify-center">
                  <CircularProgress />
                </div>
              ) : (
                <div className="w-full bg-blue-400 flex flex-col items-center justify-center font-semibold text-center">
                  <span className="my-1">Chat-app versiunea beta</span>
                  <span className="my-1">Trimiți și primești mesaje în timp real</span>
                  <span className="my-1">Versiunea full disbonibilă în curând</span>
                </div>
              )}
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
    const response = await axios.post(`${server}/`, { currentLength: 0 });
    if (response.data.success) {
      const messages = response.data.messages;
      const more = response.data.hasMoreMessages
      return {
        props: {
          messages: messages,
          more: more
        },
      };
    } else {
      return {
        props: {
          messages: [],
          more: false
        }
      }
    }
  } catch (err) {
    console.error(err);
    return {
      props: {
        messages: [],
        more: false
      },
    };
  }
}
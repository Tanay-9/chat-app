import { useState, useRef, useTransition, useEffect } from "react";
import { Toaster,toast } from "sonner";

function App() {
  const [join, setJoin] = useState(false);
  const [create, setCreate] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [generatedCode, setCode] = useState("");
  const [message, setMessage] = useState<Message[]>([]);
  const [userName, setUserName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const roomCodeRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLInputElement>(null);

  interface Message {
    userName : string;
    content : string;
    type : string;
  }

  useEffect(() => {
    console.log(import.meta.env.VITE_SOCKET_URL);
    const ws = new WebSocket(import.meta.env.VITE_SOCKET_URL);
   
    ws.onopen = () => {
      console.log("Connected to WebSocket server");
      setWsConnection(ws);
    };

    ws.onmessage = (event) => {
      console.log(event);
      const current = JSON.parse(event.data)
      if(current.type === "join") toast.success(current.content)
      else
      setMessage((prev) => [...prev, current]);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    const chatContainer = document.querySelector(".overflow-y-auto")
    if(chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  },[message])
  
  const createRoom = () => {
    startTransition(() => {
      const generatedCode = Math.random().toString(36).substring(2, 10);
      setCode(generatedCode);
      setCreate(true);
      setJoin(false);
      console.log(generatedCode);
    });
  };

  const joinRoom = () => {
    const name = nameRef.current?.value.trim();
    const code = roomCodeRef.current?.value.trim();

    if (!name || !code) {
    toast.error("please fill both the fields")
      return;
    }

    setUserName(name);
    localStorage.setItem("username", name);
  
    setRoomCode(code);

    if (wsConnection) {
      wsConnection.send(
        JSON.stringify({
          type: "join",
          payload: {
            roomCode: code,
            userName: name,
          
          },
        })
      );
    }

    setJoin(true);
    setCreate(true);
    setCode(code);
    if (nameRef.current) nameRef.current.value = "";
    if (roomCodeRef.current) roomCodeRef.current.value = ""; 

  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageRef?.current?.value.trim();

    if (!content || !wsConnection) return;

    wsConnection.send(
      JSON.stringify({
        type: "chat",
        payload: {
          roomCode,
          userName,
          content,
        },
      })
    );

    if (messageRef.current) messageRef.current.value = "";
   
  };

  const refreshHandler = () => {
    setJoin(false);
    setCreate(false);
  }
  return (
    <>
   <div>
    <Toaster richColors/>
   
    <main className="bg-[#121212] h-screen flex items-center justify-center">
      <div className="container mx-auto px-6 py-4 max-w-2xl">
        <div className="h-auto flex flex-col border border-white/40 rounded-lg px-6 py-4 shadow-lg">
          <header className="mb-4 flex flex-col space-y-4">
            <h1 className="text-2xl tracking-widest text-white font-thin cursor-pointer" onClick={refreshHandler}>
              Real-time Chat
            </h1>
            {(create || !join) && (
              <div className="">
                <button className="w-full bg-white hover:opacity-80 text-center rounded-lg p-2 text-xl font-light cursor-pointer" onClick={createRoom} disabled={isPending}>
                  {isPending ? "Generating..." : "Create a new room"}
                </button>
              </div>
            )}

            {create && (
              <div>
                <p className="text-white">Room code is {generatedCode}</p>
              </div>
            )}
          </header>
          {join && (
            <section className="h-64 overflow-y-auto mb-4">
              {message.length === 0 ? (
                <p className="text-gray-400 italic">No messages yet...</p>
              ) : (
                <div className="space-y-2">
                  {message.map((msg : Message, index : number) => (
                    <div
                      key={index}
                      className={`rounded-lg p-2 ${
                        msg.userName === userName
                          ? "bg-blue-500 ml-4"
                          : "bg-[#1e1e1e] mr-4"
                      }`}
                    >
                      {msg.userName !== userName && (
                        <p className="text-xs text-gray-400 mb-1">
                          {msg.userName}
                        </p>
                      )}
                      <p className="text-white">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <footer className="mt-4 grid grid-cols-3 items-center">
            {!join ? (
              <>
                <input
                  ref={nameRef}
                  type="text"
                  placeholder="Enter your name"
                  className="p-2 border-white/45 border rounded-lg bg-[#1e1e1e] text-white placeholder-gray-500 col-span-full mb-4"
                />

                <input
                  ref={roomCodeRef}
                  type="text"
                  placeholder="Enter the room code"
                  className="p-2 col-span-2 border rounded-lg bg-[#1e1e1e] text-white placeholder-gray-500"
                />
                <button
                  className="ml-2 w-full text-white bg-blue-800 hover:opacity-80 rounded-lg p-2"
                  onClick={joinRoom}
                >
                  Join Room
                </button>
              </>
            ) : (
              <>
                <form onSubmit={sendMessage} className="col-span-3 grid grid-cols-3">
                  <input
                    ref={messageRef}
                    type="text"
                    placeholder="Type your message"
                    className="p-2 border rounded-lg bg-[#1e1e1e] col-span-2 text-white placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    className="px-4 text-white bg-blue-800 rounded-xl hover:opacity-80 ml-2"
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </footer>
        </div>
      </div>
    </main>
    </div>
    </>
  );
}

export default App;

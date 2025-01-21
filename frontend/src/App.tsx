import { useState, useRef, useTransition, useEffect } from "react";

function App() {
  const [join, setJoin] = useState(false);
  const [create, setCreate] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [generatedCode, setCode] = useState("");
  const [message,setMessage] = useState([]); 
  const [userName, setUserName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [wsConnection, setWsConnection] = useState(null);
  

  const nameRef = useRef();
  const roomCodeRef = useRef();
  const messageRef = useRef();


  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    
    ws.onopen = () => {
      console.log("Connected to WebSocket server");
      setWsConnection(ws);
    };

    ws.onmessage = (event) => {
      console.log(event);
      setMessage(prev => [...prev, event.data]);
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

  const createRoom = () => {
    startTransition(() => {
      const generatedCode = Math.random().toString(36).substring(2, 10);
      setCode(generatedCode);
      setCreate(true);
    });
  };

  const joinRoom = () => {
    const name = nameRef.current.value.trim();
    const code = roomCodeRef.current.value.trim();
  
    if (!name || !code) {
      alert("Please fill out both fields.");
      return;
    }
  
    setUserName(name);
    setRoomCode(code);
    
    if (wsConnection) {
      wsConnection.send(JSON.stringify({
        type: "join",
        payload: {
          roomCode: code,
          userName: name
        }
      }));
    }
    
    setJoin(true);
    nameRef.current.value = "";
    roomCodeRef.current.value = "";
  };
  
  const sendMessage = (e) => {
    e.preventDefault();
    const content = messageRef.current.value.trim();
    
    if (!content || !wsConnection) return;

    wsConnection.send(JSON.stringify({
      type: "chat",
      payload: {
        roomCode,
        userName,
        content
      }
    }));

    messageRef.current.value = "";
  };


  return (
    <main className="bg-[#121212] h-screen flex items-center justify-center">
      <div className="container mx-auto px-6 py-4 max-w-2xl">
        <div className="h-auto flex flex-col border border-white/40 rounded-lg px-6 py-4 shadow-lg">
          <header className="mb-4 flex flex-col space-y-4">
            <h1 className="text-2xl tracking-widest text-white font-thin">
              Real-time Chat
            </h1>
            {(!create || !join) && (
              <div className="w-full bg-white hover:opacity-80 text-center rounded-lg p-2 text-xl font-light cursor-pointer">
                <button onClick={createRoom} disabled={isPending}>
                  {isPending ? "Generating..." : "Create a room"}
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
            <section className="flex-1 overflow-y-auto">
              {
                message.length === 0 ? (
                  <p className="text-gray-400 italic">No messages yet...</p>
                ) : 
                (
                  <div className="space-y-2">
                    {message.map((msg,index) => (
                      <div key={index} className="bg-[#1e1e1e] rounded-lg p-2 text-white">
                        {msg}
                        </div>
                    ))}
                  </div>
                )
              }
              
            </section>
          )}

          <footer className="mt-4 grid grid-cols-3 items-center">
            {!join ?
             (
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
            <button className="ml-2 w-full text-white bg-blue-800 hover:opacity-80 rounded-lg p-2" onClick={joinRoom}>
              Join Room
            </button>
            </>
             ) : (
              <>  
              <form onSubmit={sendMessage}>
                    <input ref = {messageRef}
                    type="text"
                    placeholder="Type your message"
                    className="flex-1 p-2 border rounded-lg bg-[#1e1e1e] text-white placeholder-gray-500"
                    />
                    <button type="submit" className="px-4 text-white bg-blue-800 hover:opacity-80">
                        Send
                    </button> 
              </form>
              </>
             )}
          </footer>
        </div>
      </div>
    </main>
  );
}

export default App;
